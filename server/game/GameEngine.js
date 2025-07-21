import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';

export class GameEngine extends EventEmitter {
    constructor(io) {
        super();
        this.io = io;
        this.isRunning = false;
        this.tickRate = 60; // 60 FPS
        this.deltaTime = 1000 / this.tickRate;
        this.lastTick = 0;
        this.currentTick = 0;
        this.gameTime = 0;
        
        // Performance tracking
        this.performanceStats = {
            averageTickTime: 0,
            maxTickTime: 0,
            tickCount: 0,
            fps: 0,
            memoryUsage: 0
        };
        
        // Game state
        this.gameState = {
            worldTime: {
                day: 1,
                hour: 12,
                minute: 0,
                season: 'spring',
                year: 1
            },
            serverStatus: 'running',
            activeEvents: new Map(),
            globalCooldowns: new Map(),
            serverBoosts: new Map()
        };
        
        // System dependencies
        this.systems = new Map();
        this.updateOrder = [];
        
        console.log('🎮 GameEngine initialized');
    }

    async initialize() {
        console.log('🚀 Initializing GameEngine...');
        
        this.isRunning = true;
        this.lastTick = performance.now();
        
        // Start the main game loop
        this.startGameLoop();
        
        // Initialize world time system
        this.initializeWorldTime();
        
        // Setup periodic events
        this.setupPeriodicEvents();
        
        console.log('✅ GameEngine initialized successfully');
    }

    registerSystem(name, system, priority = 0) {
        this.systems.set(name, { system, priority });
        this.updateOrder = Array.from(this.systems.entries())
            .sort((a, b) => b[1].priority - a[1].priority)
            .map(([name]) => name);
        
        console.log(`📝 Registered system: ${name} (priority: ${priority})`);
    }

    startGameLoop() {
        const gameLoop = () => {
            if (!this.isRunning) return;
            
            const now = performance.now();
            const deltaTime = now - this.lastTick;
            
            if (deltaTime >= this.deltaTime) {
                this.update(deltaTime);
                this.lastTick = now;
                this.currentTick++;
            }
            
            // Use setImmediate for better performance than setTimeout
            setImmediate(gameLoop);
        };
        
        gameLoop();
        console.log('🔄 Game loop started');
    }

    update(deltaTime = this.deltaTime) {
        const updateStart = performance.now();
        
        try {
            // Update game time
            this.updateGameTime(deltaTime);
            
            // Update all registered systems in priority order
            for (const systemName of this.updateOrder) {
                const systemData = this.systems.get(systemName);
                if (systemData && systemData.system.update) {
                    systemData.system.update(deltaTime, this.gameTime);
                }
            }
            
            // Process global events
            this.processGlobalEvents(deltaTime);
            
            // Update performance stats
            this.updatePerformanceStats(performance.now() - updateStart);
            
            // Emit update event for other systems
            this.emit('gameUpdate', {
                deltaTime,
                gameTime: this.gameTime,
                tick: this.currentTick,
                worldTime: this.gameState.worldTime
            });
            
        } catch (error) {
            console.error('❌ GameEngine update error:', error);
            this.emit('error', error);
        }
    }

    updateGameTime(deltaTime) {
        this.gameTime += deltaTime;
        
        // Update world time (1 real second = 1 game minute)
        const gameMinutesElapsed = Math.floor(this.gameTime / 1000);
        const totalMinutes = gameMinutesElapsed;
        
        this.gameState.worldTime.minute = totalMinutes % 60;
        this.gameState.worldTime.hour = Math.floor(totalMinutes / 60) % 24;
        
        const totalDays = Math.floor(totalMinutes / (24 * 60));
        this.gameState.worldTime.day = (totalDays % 365) + 1;
        this.gameState.worldTime.year = Math.floor(totalDays / 365) + 1;
        
        // Determine season
        const dayOfYear = this.gameState.worldTime.day;
        if (dayOfYear <= 90) this.gameState.worldTime.season = 'spring';
        else if (dayOfYear <= 180) this.gameState.worldTime.season = 'summer';
        else if (dayOfYear <= 270) this.gameState.worldTime.season = 'autumn';
        else this.gameState.worldTime.season = 'winter';
    }

    processGlobalEvents(deltaTime) {
        // Process active global events
        for (const [eventId, event] of this.gameState.activeEvents) {
            event.duration -= deltaTime;
            
            if (event.duration <= 0) {
                this.endGlobalEvent(eventId);
            } else {
                // Update event progress
                this.updateGlobalEvent(eventId, event, deltaTime);
            }
        }
        
        // Process global cooldowns
        for (const [cooldownId, cooldown] of this.gameState.globalCooldowns) {
            cooldown.remaining -= deltaTime;
            
            if (cooldown.remaining <= 0) {
                this.gameState.globalCooldowns.delete(cooldownId);
                this.emit('globalCooldownExpired', cooldownId);
            }
        }
    }

    updatePerformanceStats(tickTime) {
        this.performanceStats.tickCount++;
        this.performanceStats.maxTickTime = Math.max(this.performanceStats.maxTickTime, tickTime);
        
        // Calculate rolling average
        const alpha = 0.1; // Smoothing factor
        this.performanceStats.averageTickTime = 
            (1 - alpha) * this.performanceStats.averageTickTime + alpha * tickTime;
        
        // Calculate FPS
        this.performanceStats.fps = 1000 / this.performanceStats.averageTickTime;
        
        // Update memory usage every 1000 ticks
        if (this.performanceStats.tickCount % 1000 === 0) {
            this.performanceStats.memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
        }
    }

    initializeWorldTime() {
        // Set initial world time
        this.gameState.worldTime = {
            day: 1,
            hour: 8, // Start at 8 AM
            minute: 0,
            season: 'spring',
            year: 1
        };
        
        console.log('🌅 World time initialized:', this.gameState.worldTime);
    }

    setupPeriodicEvents() {
        // Hourly world time broadcast
        setInterval(() => {
            this.io.emit('worldTimeUpdate', this.gameState.worldTime);
        }, 60000); // Every real minute = 1 game hour
        
        // Performance stats broadcast
        setInterval(() => {
            this.io.emit('serverStats', {
                performance: this.performanceStats,
                players: this.io.engine.clientsCount,
                uptime: process.uptime()
            });
        }, 10000); // Every 10 seconds
        
        // Daily events (every 24 game hours = 24 real minutes)
        setInterval(() => {
            this.triggerDailyEvents();
        }, 24 * 60 * 1000);
        
        console.log('⏰ Periodic events setup complete');
    }

    triggerDailyEvents() {
        console.log(`🌅 New day in the world: Day ${this.gameState.worldTime.day}, Year ${this.gameState.worldTime.year}`);
        
        this.emit('newDay', {
            day: this.gameState.worldTime.day,
            year: this.gameState.worldTime.year,
            season: this.gameState.worldTime.season
        });
        
        this.io.emit('newDay', this.gameState.worldTime);
    }

    startGlobalEvent(eventData) {
        const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const globalEvent = {
            id: eventId,
            name: eventData.name,
            description: eventData.description,
            type: eventData.type,
            duration: eventData.duration,
            startTime: this.gameTime,
            effects: eventData.effects || {},
            participants: new Set(),
            rewards: eventData.rewards || {},
            ...eventData
        };
        
        this.gameState.activeEvents.set(eventId, globalEvent);
        
        console.log(`🎉 Global event started: ${globalEvent.name}`);
        this.io.emit('globalEventStarted', globalEvent);
        
        return eventId;
    }

    endGlobalEvent(eventId) {
        const event = this.gameState.activeEvents.get(eventId);
        if (!event) return;
        
        console.log(`🎊 Global event ended: ${event.name}`);
        
        // Distribute rewards to participants
        this.distributeEventRewards(event);
        
        this.gameState.activeEvents.delete(eventId);
        this.io.emit('globalEventEnded', { eventId, event });
        
        this.emit('globalEventEnded', event);
    }

    updateGlobalEvent(eventId, event, deltaTime) {
        // Update event-specific logic
        switch (event.type) {
            case 'double_xp':
                // No specific update needed, effect is passive
                break;
                
            case 'world_boss':
                this.updateWorldBossEvent(event, deltaTime);
                break;
                
            case 'treasure_hunt':
                this.updateTreasureHuntEvent(event, deltaTime);
                break;
                
            case 'pvp_tournament':
                this.updatePvPTournamentEvent(event, deltaTime);
                break;
                
            case 'seasonal_festival':
                this.updateSeasonalFestivalEvent(event, deltaTime);
                break;
        }
        
        // Broadcast event update
        this.io.emit('globalEventUpdate', {
            eventId,
            remainingTime: event.duration,
            progress: event.progress || 0
        });
    }

    updateWorldBossEvent(event, deltaTime) {
        if (!event.boss) {
            // Spawn world boss
            event.boss = {
                id: `world_boss_${Date.now()}`,
                name: event.bossName || 'Ancient Dragon',
                health: event.bossHealth || 1000000,
                maxHealth: event.bossHealth || 1000000,
                location: event.spawnLocation || { x: 0, y: 0, zone: 'central_plains' },
                attackers: new Map(),
                lastAttackTime: 0
            };
            
            console.log(`🐉 World boss spawned: ${event.boss.name}`);
            this.io.emit('worldBossSpawned', event.boss);
        }
        
        // Update boss behavior
        if (event.boss.health <= 0) {
            this.defeatWorldBoss(event);
        }
    }

    updateTreasureHuntEvent(event, deltaTime) {
        if (!event.treasuresSpawned) {
            this.spawnTreasures(event);
            event.treasuresSpawned = true;
        }
        
        // Check treasure hunt progress
        const foundTreasures = event.treasures?.filter(t => t.found).length || 0;
        const totalTreasures = event.treasures?.length || 0;
        event.progress = totalTreasures > 0 ? foundTreasures / totalTreasures : 0;
    }

    updatePvPTournamentEvent(event, deltaTime) {
        if (!event.tournamentStarted) {
            this.startTournamentBrackets(event);
            event.tournamentStarted = true;
        }
        
        // Update tournament progress
        this.updateTournamentMatches(event, deltaTime);
    }

    updateSeasonalFestivalEvent(event, deltaTime) {
        // Update festival activities
        if (!event.activitiesSpawned) {
            this.spawnFestivalActivities(event);
            event.activitiesSpawned = true;
        }
        
        // Rotate festival rewards
        if (this.gameTime - event.lastRewardRotation > 300000) { // 5 minutes
            this.rotateFestivalRewards(event);
            event.lastRewardRotation = this.gameTime;
        }
    }

    spawnTreasures(event) {
        event.treasures = [];
        const treasureCount = event.treasureCount || 50;
        
        for (let i = 0; i < treasureCount; i++) {
            const treasure = {
                id: `treasure_${Date.now()}_${i}`,
                location: this.generateRandomLocation(),
                value: Math.floor(Math.random() * 1000) + 100,
                found: false,
                rarity: this.determineTreasureRarity()
            };
            
            event.treasures.push(treasure);
        }
        
        console.log(`💰 ${treasureCount} treasures spawned for treasure hunt`);
        this.io.emit('treasuresSpawned', event.treasures.map(t => ({
            id: t.id,
            location: t.location,
            rarity: t.rarity
        })));
    }

    defeatWorldBoss(event) {
        console.log(`🗡️ World boss defeated: ${event.boss.name}`);
        
        // Distribute rewards based on contribution
        const rewards = this.calculateWorldBossRewards(event.boss);
        
        this.io.emit('worldBossDefeated', {
            boss: event.boss,
            rewards: rewards
        });
        
        // End the event
        this.endGlobalEvent(event.id);
    }

    calculateWorldBossRewards(boss) {
        const rewards = [];
        
        for (const [playerId, damage] of boss.attackers) {
            const contribution = damage / boss.maxHealth;
            const baseReward = 1000;
            const playerReward = Math.floor(baseReward * contribution);
            
            rewards.push({
                playerId,
                damage,
                contribution,
                gold: playerReward,
                experience: playerReward * 2,
                items: this.generateBossLoot(contribution)
            });
        }
        
        return rewards;
    }

    generateRandomLocation() {
        const zones = ['forest', 'mountains', 'desert', 'swamp', 'plains'];
        return {
            x: Math.floor(Math.random() * 1000) - 500,
            y: Math.floor(Math.random() * 1000) - 500,
            zone: zones[Math.floor(Math.random() * zones.length)]
        };
    }

    determineTreasureRarity() {
        const roll = Math.random();
        if (roll < 0.01) return 'legendary';
        if (roll < 0.05) return 'epic';
        if (roll < 0.15) return 'rare';
        if (roll < 0.35) return 'uncommon';
        return 'common';
    }

    generateBossLoot(contribution) {
        const items = [];
        const lootRolls = Math.floor(contribution * 10) + 1;
        
        for (let i = 0; i < lootRolls; i++) {
            if (Math.random() < 0.3) { // 30% chance per roll
                items.push({
                    id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    name: this.generateRandomItemName(),
                    rarity: this.determineTreasureRarity(),
                    type: this.generateRandomItemType(),
                    stats: this.generateRandomStats()
                });
            }
        }
        
        return items;
    }

    generateRandomItemName() {
        const prefixes = ['Ancient', 'Mystic', 'Ethereal', 'Divine', 'Cursed', 'Blessed'];
        const suffixes = ['Blade', 'Staff', 'Shield', 'Armor', 'Ring', 'Amulet'];
        return `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
    }

    generateRandomItemType() {
        const types = ['weapon', 'armor', 'accessory', 'consumable', 'material'];
        return types[Math.floor(Math.random() * types.length)];
    }

    generateRandomStats() {
        return {
            attack: Math.floor(Math.random() * 50) + 1,
            defense: Math.floor(Math.random() * 30) + 1,
            health: Math.floor(Math.random() * 100) + 10,
            mana: Math.floor(Math.random() * 80) + 5
        };
    }

    setGlobalCooldown(cooldownId, duration) {
        this.gameState.globalCooldowns.set(cooldownId, {
            id: cooldownId,
            remaining: duration,
            startTime: this.gameTime
        });
    }

    isOnGlobalCooldown(cooldownId) {
        return this.gameState.globalCooldowns.has(cooldownId);
    }

    addServerBoost(boostId, boostData) {
        this.gameState.serverBoosts.set(boostId, {
            id: boostId,
            ...boostData,
            startTime: this.gameTime
        });
        
        console.log(`⚡ Server boost added: ${boostId}`);
        this.io.emit('serverBoostAdded', { boostId, ...boostData });
    }

    removeServerBoost(boostId) {
        if (this.gameState.serverBoosts.delete(boostId)) {
            console.log(`⚡ Server boost removed: ${boostId}`);
            this.io.emit('serverBoostRemoved', boostId);
        }
    }

    getServerBoosts() {
        return Array.from(this.gameState.serverBoosts.values());
    }

    distributeEventRewards(event) {
        console.log(`🎁 Distributing rewards for event: ${event.name}`);
        
        for (const participantId of event.participants) {
            const rewards = this.calculateEventRewards(event, participantId);
            
            this.emit('distributeRewards', {
                playerId: participantId,
                eventId: event.id,
                rewards
            });
        }
    }

    calculateEventRewards(event, participantId) {
        const baseRewards = event.rewards;
        const participationMultiplier = 1.0; // Could be based on participation level
        
        return {
            experience: Math.floor((baseRewards.experience || 0) * participationMultiplier),
            gold: Math.floor((baseRewards.gold || 0) * participationMultiplier),
            items: baseRewards.items || [],
            titles: baseRewards.titles || [],
            achievements: baseRewards.achievements || []
        };
    }

    getGameState() {
        return {
            ...this.gameState,
            performance: this.performanceStats,
            gameTime: this.gameTime,
            tick: this.currentTick,
            systemCount: this.systems.size
        };
    }

    shutdown() {
        console.log('🛑 GameEngine shutting down...');
        this.isRunning = false;
        
        // Save any critical game state
        this.emit('shutdown');
        
        console.log('✅ GameEngine shutdown complete');
    }
}