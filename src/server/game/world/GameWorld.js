import EventEmitter from 'events';
import { performance } from 'perf_hooks';
import { createNoise2D, createNoise3D } from 'simplex-noise';
import QuadTree from 'quadtree-js';
import { gameConfig } from '../../config/game.js';
import { Zone } from './Zone.js';
import { Chunk } from './Chunk.js';
import { TerrainGenerator } from './TerrainGenerator.js';
import { WeatherSystem } from './WeatherSystem.js';
import { TimeSystem } from './TimeSystem.js';
import { SpawnManager } from './SpawnManager.js';
import { ResourceManager } from './ResourceManager.js';
import { InstanceManager } from './InstanceManager.js';
import Character from '../../models/Character.js';
import winston from 'winston';

const logger = winston.createLogger({
    defaultMeta: { service: 'game-world' }
});

export class GameWorld extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            maxPlayers: options.maxPlayers || gameConfig.maxPlayersPerServer,
            worldSize: options.worldSize || gameConfig.worldSize,
            tickRate: options.tickRate || gameConfig.serverTickRate,
            chunkSize: options.chunkSize || gameConfig.chunkSize,
            viewDistance: options.viewDistance || gameConfig.viewDistance
        };
        
        // World state
        this.isRunning = false;
        this.tickCount = 0;
        this.lastTickTime = 0;
        this.deltaTime = 0;
        
        // World data
        this.zones = new Map();
        this.chunks = new Map();
        this.players = new Map();
        this.npcs = new Map();
        this.objects = new Map();
        this.instances = new Map();
        
        // Spatial indexing
        this.spatialIndex = new QuadTree({
            x: 0,
            y: 0,
            width: this.options.worldSize.width,
            height: this.options.worldSize.height
        });
        
        // World systems
        this.terrainGenerator = new TerrainGenerator({
            worldSize: this.options.worldSize,
            chunkSize: this.options.chunkSize,
            seed: options.seed || Date.now()
        });
        
        this.weatherSystem = new WeatherSystem(this);
        this.timeSystem = new TimeSystem(this);
        this.spawnManager = new SpawnManager(this);
        this.resourceManager = new ResourceManager(this);
        this.instanceManager = new InstanceManager(this);
        
        // Performance monitoring
        this.performance = {
            tickDuration: 0,
            playerCount: 0,
            npcCount: 0,
            objectCount: 0,
            chunkCount: 0,
            memoryUsage: 0
        };
        
        // Initialize world
        this.initialize();
    }
    
    async initialize() {
        logger.info('Initializing game world...');
        
        try {
            // Load world data
            await this.loadZones();
            await this.loadStaticObjects();
            await this.loadSpawnPoints();
            
            // Initialize systems
            this.weatherSystem.initialize();
            this.timeSystem.initialize();
            this.spawnManager.initialize();
            this.resourceManager.initialize();
            
            // Set up event listeners
            this.setupEventListeners();
            
            logger.info('Game world initialized successfully');
            this.emit('initialized');
            
        } catch (error) {
            logger.error('Failed to initialize game world:', error);
            throw error;
        }
    }
    
    async loadZones() {
        // Load zone definitions from database or config
        const zoneConfigs = [
            {
                id: 'starter_town',
                name: 'Haven Village',
                level: { min: 1, max: 10 },
                type: 'safe',
                bounds: { x: 0, y: 0, width: 1000, height: 1000 },
                spawnPoint: { x: 500, y: 500, z: 0 }
            },
            {
                id: 'eastern_forest',
                name: 'Silverleaf Forest',
                level: { min: 5, max: 15 },
                type: 'contested',
                bounds: { x: 1000, y: 0, width: 2000, height: 2000 },
                spawnPoint: { x: 1500, y: 1000, z: 0 }
            },
            {
                id: 'northern_mountains',
                name: 'Frostpeak Mountains',
                level: { min: 20, max: 30 },
                type: 'contested',
                bounds: { x: 0, y: 2000, width: 3000, height: 2000 },
                spawnPoint: { x: 1500, y: 3000, z: 500 }
            },
            {
                id: 'desert_wastes',
                name: 'Scorching Sands',
                level: { min: 30, max: 40 },
                type: 'pvp',
                bounds: { x: 3000, y: 0, width: 3000, height: 3000 },
                spawnPoint: { x: 4500, y: 1500, z: 0 }
            },
            {
                id: 'shadow_realm',
                name: 'The Void',
                level: { min: 50, max: 60 },
                type: 'raid',
                bounds: { x: 6000, y: 0, width: 2000, height: 2000 },
                spawnPoint: { x: 7000, y: 1000, z: -500 }
            }
        ];
        
        for (const config of zoneConfigs) {
            const zone = new Zone(config);
            this.zones.set(zone.id, zone);
            logger.info(`Loaded zone: ${zone.name}`);
        }
    }
    
    async loadStaticObjects() {
        // Load static world objects (buildings, trees, rocks, etc.)
        // This would typically come from a database
        const staticObjects = [
            // Starter town buildings
            { id: 'inn_01', type: 'building', model: 'inn_large', position: { x: 450, y: 450, z: 0 }, zone: 'starter_town' },
            { id: 'shop_01', type: 'building', model: 'shop_general', position: { x: 550, y: 450, z: 0 }, zone: 'starter_town' },
            { id: 'bank_01', type: 'building', model: 'bank', position: { x: 500, y: 550, z: 0 }, zone: 'starter_town' },
            { id: 'fountain_01', type: 'decoration', model: 'fountain_ornate', position: { x: 500, y: 500, z: 0 }, zone: 'starter_town' },
            
            // Forest objects
            ...this.generateForestObjects('eastern_forest', 500),
            
            // Mountain objects
            ...this.generateMountainObjects('northern_mountains', 300),
            
            // Desert objects
            ...this.generateDesertObjects('desert_wastes', 200)
        ];
        
        for (const obj of staticObjects) {
            this.objects.set(obj.id, obj);
            this.spatialIndex.insert({
                x: obj.position.x - 5,
                y: obj.position.y - 5,
                width: 10,
                height: 10,
                data: obj
            });
        }
        
        logger.info(`Loaded ${staticObjects.length} static objects`);
    }
    
    generateForestObjects(zoneId, count) {
        const objects = [];
        const zone = this.zones.get(zoneId);
        const noise = createNoise2D();
        
        for (let i = 0; i < count; i++) {
            const x = zone.bounds.x + Math.random() * zone.bounds.width;
            const y = zone.bounds.y + Math.random() * zone.bounds.height;
            
            // Use noise for natural clustering
            const density = noise(x * 0.01, y * 0.01);
            if (density < -0.2) continue; // Skip sparse areas
            
            const treeTypes = ['tree_oak', 'tree_pine', 'tree_birch', 'tree_willow'];
            const type = treeTypes[Math.floor(Math.random() * treeTypes.length)];
            
            objects.push({
                id: `${zoneId}_tree_${i}`,
                type: 'vegetation',
                model: type,
                position: { x, y, z: 0 },
                zone: zoneId,
                scale: 0.8 + Math.random() * 0.4,
                rotation: Math.random() * 360
            });
            
            // Add some rocks and bushes
            if (Math.random() < 0.3) {
                objects.push({
                    id: `${zoneId}_rock_${i}`,
                    type: 'rock',
                    model: `rock_${Math.floor(Math.random() * 5) + 1}`,
                    position: { x: x + (Math.random() - 0.5) * 20, y: y + (Math.random() - 0.5) * 20, z: 0 },
                    zone: zoneId,
                    scale: 0.5 + Math.random() * 1.5
                });
            }
        }
        
        return objects;
    }
    
    generateMountainObjects(zoneId, count) {
        const objects = [];
        const zone = this.zones.get(zoneId);
        
        for (let i = 0; i < count; i++) {
            const x = zone.bounds.x + Math.random() * zone.bounds.width;
            const y = zone.bounds.y + Math.random() * zone.bounds.height;
            
            // Mountain rocks and cliffs
            objects.push({
                id: `${zoneId}_cliff_${i}`,
                type: 'terrain',
                model: `cliff_${Math.floor(Math.random() * 3) + 1}`,
                position: { x, y, z: Math.random() * 200 },
                zone: zoneId,
                scale: 1 + Math.random() * 2,
                rotation: Math.random() * 360
            });
            
            // Snow-covered trees
            if (Math.random() < 0.4) {
                objects.push({
                    id: `${zoneId}_snow_tree_${i}`,
                    type: 'vegetation',
                    model: 'tree_pine_snow',
                    position: { x: x + (Math.random() - 0.5) * 50, y: y + (Math.random() - 0.5) * 50, z: 0 },
                    zone: zoneId,
                    scale: 0.7 + Math.random() * 0.6
                });
            }
        }
        
        return objects;
    }
    
    generateDesertObjects(zoneId, count) {
        const objects = [];
        const zone = this.zones.get(zoneId);
        
        for (let i = 0; i < count; i++) {
            const x = zone.bounds.x + Math.random() * zone.bounds.width;
            const y = zone.bounds.y + Math.random() * zone.bounds.height;
            
            // Desert objects
            const desertObjects = ['cactus_tall', 'cactus_round', 'rock_sandstone', 'dead_tree', 'oasis_palm'];
            const type = desertObjects[Math.floor(Math.random() * desertObjects.length)];
            
            objects.push({
                id: `${zoneId}_desert_obj_${i}`,
                type: type.includes('cactus') || type.includes('tree') ? 'vegetation' : 'rock',
                model: type,
                position: { x, y, z: 0 },
                zone: zoneId,
                scale: 0.6 + Math.random() * 0.8,
                rotation: Math.random() * 360
            });
            
            // Add sand dunes
            if (Math.random() < 0.2) {
                objects.push({
                    id: `${zoneId}_dune_${i}`,
                    type: 'terrain',
                    model: 'sand_dune',
                    position: { x: x + (Math.random() - 0.5) * 100, y: y + (Math.random() - 0.5) * 100, z: -5 },
                    zone: zoneId,
                    scale: 2 + Math.random() * 3
                });
            }
        }
        
        return objects;
    }
    
    async loadSpawnPoints() {
        // Load NPC spawn points
        const spawnPoints = [
            // Starter town NPCs
            { id: 'vendor_general', npcId: 'npc_vendor_01', position: { x: 520, y: 460, z: 0 }, zone: 'starter_town', respawnTime: 0 },
            { id: 'guard_01', npcId: 'npc_guard_01', position: { x: 480, y: 480, z: 0 }, zone: 'starter_town', respawnTime: 300 },
            { id: 'guard_02', npcId: 'npc_guard_01', position: { x: 520, y: 520, z: 0 }, zone: 'starter_town', respawnTime: 300 },
            { id: 'quest_giver_01', npcId: 'npc_questgiver_01', position: { x: 500, y: 480, z: 0 }, zone: 'starter_town', respawnTime: 0 },
            
            // Forest creatures
            ...this.generateCreatureSpawns('eastern_forest', 'wolf', 50, { min: 5, max: 8 }),
            ...this.generateCreatureSpawns('eastern_forest', 'bear', 20, { min: 8, max: 12 }),
            ...this.generateCreatureSpawns('eastern_forest', 'spider', 30, { min: 6, max: 10 }),
            
            // Mountain creatures
            ...this.generateCreatureSpawns('northern_mountains', 'yeti', 15, { min: 25, max: 30 }),
            ...this.generateCreatureSpawns('northern_mountains', 'ice_elemental', 25, { min: 22, max: 28 }),
            
            // Desert creatures
            ...this.generateCreatureSpawns('desert_wastes', 'scorpion', 40, { min: 32, max: 38 }),
            ...this.generateCreatureSpawns('desert_wastes', 'sand_worm', 10, { min: 35, max: 40 })
        ];
        
        this.spawnManager.addSpawnPoints(spawnPoints);
    }
    
    generateCreatureSpawns(zoneId, creatureType, count, levelRange) {
        const spawns = [];
        const zone = this.zones.get(zoneId);
        
        for (let i = 0; i < count; i++) {
            const x = zone.bounds.x + Math.random() * zone.bounds.width;
            const y = zone.bounds.y + Math.random() * zone.bounds.height;
            
            spawns.push({
                id: `${zoneId}_${creatureType}_spawn_${i}`,
                npcId: `npc_${creatureType}`,
                position: { x, y, z: 0 },
                zone: zoneId,
                respawnTime: 300000, // 5 minutes
                roamRadius: 50,
                level: levelRange
            });
        }
        
        return spawns;
    }
    
    setupEventListeners() {
        // Time system events
        this.timeSystem.on('dawn', () => {
            this.emit('time:dawn');
            this.weatherSystem.onDawn();
        });
        
        this.timeSystem.on('dusk', () => {
            this.emit('time:dusk');
            this.weatherSystem.onDusk();
        });
        
        this.timeSystem.on('midnight', () => {
            this.emit('time:midnight');
            // Spawn night-only creatures
            this.spawnManager.spawnNightCreatures();
        });
        
        // Weather system events
        this.weatherSystem.on('weather:change', (weather) => {
            this.emit('weather:change', weather);
            this.broadcastToZone(weather.zone, 'weather:update', weather);
        });
        
        // Resource respawn
        this.resourceManager.on('resource:respawn', (resource) => {
            this.emit('resource:respawn', resource);
        });
    }
    
    start() {
        if (this.isRunning) return;
        
        logger.info('Starting game world...');
        this.isRunning = true;
        this.lastTickTime = performance.now();
        
        // Start subsystems
        this.timeSystem.start();
        this.weatherSystem.start();
        this.spawnManager.start();
        this.resourceManager.start();
        
        // Start main game loop
        this.gameLoop();
        
        logger.info('Game world started');
        this.emit('started');
    }
    
    stop() {
        if (!this.isRunning) return;
        
        logger.info('Stopping game world...');
        this.isRunning = false;
        
        // Stop subsystems
        this.timeSystem.stop();
        this.weatherSystem.stop();
        this.spawnManager.stop();
        this.resourceManager.stop();
        
        // Clear tick interval
        if (this.tickInterval) {
            clearInterval(this.tickInterval);
            this.tickInterval = null;
        }
        
        logger.info('Game world stopped');
        this.emit('stopped');
    }
    
    gameLoop() {
        if (!this.isRunning) return;
        
        const tickInterval = 1000 / this.options.tickRate;
        
        this.tickInterval = setInterval(() => {
            const now = performance.now();
            this.deltaTime = (now - this.lastTickTime) / 1000;
            this.lastTickTime = now;
            
            const tickStart = performance.now();
            this.tick();
            this.performance.tickDuration = performance.now() - tickStart;
            
            // Warn if tick is taking too long
            if (this.performance.tickDuration > tickInterval * 0.8) {
                logger.warn(`Tick ${this.tickCount} took ${this.performance.tickDuration.toFixed(2)}ms`);
            }
        }, tickInterval);
    }
    
    tick() {
        this.tickCount++;
        
        // Update subsystems
        this.timeSystem.update(this.deltaTime);
        this.weatherSystem.update(this.deltaTime);
        this.spawnManager.update(this.deltaTime);
        this.resourceManager.update(this.deltaTime);
        
        // Update all active chunks
        for (const [chunkKey, chunk] of this.chunks) {
            if (chunk.isActive) {
                chunk.update(this.deltaTime);
            }
        }
        
        // Update performance metrics
        this.updatePerformanceMetrics();
        
        // Emit tick event
        this.emit('tick', this.tickCount, this.deltaTime);
    }
    
    updatePerformanceMetrics() {
        this.performance.playerCount = this.players.size;
        this.performance.npcCount = this.npcs.size;
        this.performance.objectCount = this.objects.size;
        this.performance.chunkCount = this.chunks.size;
        this.performance.memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024; // MB
    }
    
    // Player management
    async addPlayer(characterId, socket) {
        try {
            const character = await Character.findById(characterId)
                .populate('equipment.head equipment.chest equipment.legs')
                .populate('inventory.items.item');
            
            if (!character) {
                throw new Error('Character not found');
            }
            
            // Create player instance
            const player = {
                id: character._id.toString(),
                character: character,
                socket: socket,
                sessionStart: Date.now(),
                lastActivity: Date.now(),
                chunk: null,
                nearbyEntities: new Set()
            };
            
            // Add to world
            this.players.set(player.id, player);
            
            // Set character online
            character.flags.isOnline = true;
            await character.save();
            
            // Load player into chunk
            const chunk = this.getOrCreateChunk(character.position.x, character.position.y);
            chunk.addEntity(player);
            player.chunk = chunk;
            
            // Add to spatial index
            this.spatialIndex.insert({
                x: character.position.x - 1,
                y: character.position.y - 1,
                width: 2,
                height: 2,
                data: player
            });
            
            // Notify nearby players
            this.broadcastToNearby(character.position, 'player:join', {
                id: player.id,
                name: character.name,
                level: character.level,
                class: character.class,
                position: character.position
            }, player.id);
            
            logger.info(`Player ${character.name} joined the world`);
            this.emit('player:join', player);
            
            return player;
            
        } catch (error) {
            logger.error('Failed to add player:', error);
            throw error;
        }
    }
    
    async removePlayer(playerId) {
        const player = this.players.get(playerId);
        if (!player) return;
        
        try {
            // Update character data
            const character = player.character;
            character.flags.isOnline = false;
            character.lastSeen = new Date();
            character.playtime.lastSession = Date.now() - player.sessionStart;
            character.playtime.total += character.playtime.lastSession;
            await character.save();
            
            // Remove from chunk
            if (player.chunk) {
                player.chunk.removeEntity(player);
            }
            
            // Remove from spatial index
            this.spatialIndex.remove({
                x: character.position.x - 1,
                y: character.position.y - 1,
                width: 2,
                height: 2,
                data: player
            });
            
            // Remove from world
            this.players.delete(playerId);
            
            // Notify nearby players
            this.broadcastToNearby(character.position, 'player:leave', {
                id: player.id,
                name: character.name
            });
            
            logger.info(`Player ${character.name} left the world`);
            this.emit('player:leave', player);
            
        } catch (error) {
            logger.error('Failed to remove player:', error);
        }
    }
    
    movePlayer(playerId, newPosition) {
        const player = this.players.get(playerId);
        if (!player) return;
        
        const character = player.character;
        const oldPosition = { ...character.position };
        
        // Validate movement (check for collision, valid position, etc.)
        if (!this.isValidPosition(newPosition)) {
            return false;
        }
        
        // Update position
        character.position.x = newPosition.x;
        character.position.y = newPosition.y;
        character.position.z = newPosition.z;
        if (newPosition.rotation !== undefined) {
            character.position.rotation = newPosition.rotation;
        }
        
        // Update spatial index
        this.spatialIndex.remove({
            x: oldPosition.x - 1,
            y: oldPosition.y - 1,
            width: 2,
            height: 2,
            data: player
        });
        
        this.spatialIndex.insert({
            x: newPosition.x - 1,
            y: newPosition.y - 1,
            width: 2,
            height: 2,
            data: player
        });
        
        // Check if player moved to a new chunk
        const newChunk = this.getOrCreateChunk(newPosition.x, newPosition.y);
        if (player.chunk !== newChunk) {
            if (player.chunk) {
                player.chunk.removeEntity(player);
            }
            newChunk.addEntity(player);
            player.chunk = newChunk;
            
            // Load/unload chunks based on view distance
            this.updatePlayerChunks(player);
        }
        
        // Check if player entered a new zone
        const newZone = this.getZoneAt(newPosition.x, newPosition.y);
        if (character.position.zone !== newZone.id) {
            character.position.zone = newZone.id;
            this.emit('player:zone:change', player, newZone);
        }
        
        // Update nearby entities
        this.updateNearbyEntities(player);
        
        // Broadcast movement to nearby players
        this.broadcastToNearby(newPosition, 'player:move', {
            id: player.id,
            position: newPosition
        }, player.id);
        
        return true;
    }
    
    isValidPosition(position) {
        // Check world bounds
        if (position.x < 0 || position.x > this.options.worldSize.width ||
            position.y < 0 || position.y > this.options.worldSize.height) {
            return false;
        }
        
        // Check for collision with static objects
        const nearbyObjects = this.spatialIndex.retrieve({
            x: position.x - 5,
            y: position.y - 5,
            width: 10,
            height: 10
        });
        
        for (const obj of nearbyObjects) {
            if (obj.data.type === 'building' || obj.data.type === 'solid') {
                // Simple AABB collision check
                if (this.checkCollision(position, obj.data.position, obj.data.bounds)) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    checkCollision(pos1, pos2, bounds) {
        const dx = Math.abs(pos1.x - pos2.x);
        const dy = Math.abs(pos1.y - pos2.y);
        
        return dx < bounds.width / 2 && dy < bounds.height / 2;
    }
    
    updateNearbyEntities(player) {
        const viewDistance = 100; // meters
        const nearbyEntities = new Set();
        
        // Get all entities within view distance
        const nearby = this.spatialIndex.retrieve({
            x: player.character.position.x - viewDistance,
            y: player.character.position.y - viewDistance,
            width: viewDistance * 2,
            height: viewDistance * 2
        });
        
        for (const entity of nearby) {
            if (entity.data.id !== player.id) {
                const distance = this.getDistance(
                    player.character.position,
                    entity.data.character ? entity.data.character.position : entity.data.position
                );
                
                if (distance <= viewDistance) {
                    nearbyEntities.add(entity.data.id);
                    
                    // Entity entered view
                    if (!player.nearbyEntities.has(entity.data.id)) {
                        this.emit('entity:enter:view', player, entity.data);
                        
                        if (player.socket) {
                            player.socket.emit('entity:spawn', this.serializeEntity(entity.data));
                        }
                    }
                }
            }
        }
        
        // Check for entities that left view
        for (const entityId of player.nearbyEntities) {
            if (!nearbyEntities.has(entityId)) {
                this.emit('entity:leave:view', player, entityId);
                
                if (player.socket) {
                    player.socket.emit('entity:despawn', entityId);
                }
            }
        }
        
        player.nearbyEntities = nearbyEntities;
    }
    
    serializeEntity(entity) {
        if (entity.character) {
            // Player entity
            return {
                id: entity.id,
                type: 'player',
                name: entity.character.name,
                level: entity.character.level,
                class: entity.character.class,
                race: entity.character.race,
                guild: entity.character.guild,
                position: entity.character.position,
                status: {
                    health: entity.character.status.health,
                    maxHealth: entity.character.stats.maxHealth,
                    mana: entity.character.status.mana,
                    maxMana: entity.character.stats.maxMana
                },
                equipment: this.serializeEquipment(entity.character.equipment)
            };
        } else if (entity.npcData) {
            // NPC entity
            return {
                id: entity.id,
                type: 'npc',
                npcType: entity.npcData.type,
                name: entity.npcData.name,
                level: entity.npcData.level,
                position: entity.position,
                status: entity.status,
                hostile: entity.npcData.hostile
            };
        } else {
            // Static object
            return {
                id: entity.id,
                type: 'object',
                model: entity.model,
                position: entity.position,
                scale: entity.scale,
                rotation: entity.rotation
            };
        }
    }
    
    serializeEquipment(equipment) {
        const visible = {};
        const visibleSlots = ['head', 'chest', 'legs', 'mainHand', 'offHand'];
        
        for (const slot of visibleSlots) {
            if (equipment[slot]) {
                visible[slot] = {
                    id: equipment[slot]._id,
                    model: equipment[slot].model,
                    quality: equipment[slot].quality
                };
            }
        }
        
        return visible;
    }
    
    updatePlayerChunks(player) {
        const centerX = Math.floor(player.character.position.x / this.options.chunkSize);
        const centerY = Math.floor(player.character.position.y / this.options.chunkSize);
        
        const activeChunks = new Set();
        
        // Load chunks within view distance
        for (let dx = -this.options.viewDistance; dx <= this.options.viewDistance; dx++) {
            for (let dy = -this.options.viewDistance; dy <= this.options.viewDistance; dy++) {
                const chunkX = centerX + dx;
                const chunkY = centerY + dy;
                const chunkKey = `${chunkX},${chunkY}`;
                
                activeChunks.add(chunkKey);
                
                if (!this.chunks.has(chunkKey)) {
                    this.loadChunk(chunkX, chunkY);
                }
            }
        }
        
        // Unload chunks outside view distance
        for (const [chunkKey, chunk] of this.chunks) {
            if (!activeChunks.has(chunkKey) && chunk.players.size === 0) {
                this.unloadChunk(chunkKey);
            }
        }
    }
    
    getOrCreateChunk(x, y) {
        const chunkX = Math.floor(x / this.options.chunkSize);
        const chunkY = Math.floor(y / this.options.chunkSize);
        const chunkKey = `${chunkX},${chunkY}`;
        
        let chunk = this.chunks.get(chunkKey);
        if (!chunk) {
            chunk = this.loadChunk(chunkX, chunkY);
        }
        
        return chunk;
    }
    
    loadChunk(chunkX, chunkY) {
        const chunkKey = `${chunkX},${chunkY}`;
        
        const chunk = new Chunk({
            x: chunkX,
            y: chunkY,
            size: this.options.chunkSize,
            world: this
        });
        
        // Generate terrain for chunk
        chunk.terrain = this.terrainGenerator.generateChunk(chunkX, chunkY);
        
        // Load objects in chunk
        const chunkBounds = {
            x: chunkX * this.options.chunkSize,
            y: chunkY * this.options.chunkSize,
            width: this.options.chunkSize,
            height: this.options.chunkSize
        };
        
        const objects = this.spatialIndex.retrieve(chunkBounds);
        for (const obj of objects) {
            chunk.addObject(obj.data);
        }
        
        this.chunks.set(chunkKey, chunk);
        chunk.activate();
        
        return chunk;
    }
    
    unloadChunk(chunkKey) {
        const chunk = this.chunks.get(chunkKey);
        if (chunk) {
            chunk.deactivate();
            this.chunks.delete(chunkKey);
        }
    }
    
    // Zone management
    getZoneAt(x, y) {
        for (const [zoneId, zone] of this.zones) {
            if (x >= zone.bounds.x && x < zone.bounds.x + zone.bounds.width &&
                y >= zone.bounds.y && y < zone.bounds.y + zone.bounds.height) {
                return zone;
            }
        }
        
        // Return default zone if position is outside all zones
        return this.zones.get('starter_town');
    }
    
    // Broadcasting
    broadcastToAll(event, data) {
        for (const [playerId, player] of this.players) {
            if (player.socket && player.socket.connected) {
                player.socket.emit(event, data);
            }
        }
    }
    
    broadcastToZone(zoneId, event, data) {
        for (const [playerId, player] of this.players) {
            if (player.character.position.zone === zoneId && 
                player.socket && player.socket.connected) {
                player.socket.emit(event, data);
            }
        }
    }
    
    broadcastToNearby(position, event, data, exclude = null) {
        const range = 100; // meters
        
        for (const [playerId, player] of this.players) {
            if (playerId === exclude) continue;
            
            const distance = this.getDistance(position, player.character.position);
            
            if (distance <= range && player.socket && player.socket.connected) {
                player.socket.emit(event, data);
            }
        }
    }
    
    // Utility methods
    getDistance(pos1, pos2) {
        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;
        const dz = pos2.z - pos1.z || 0;
        
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    
    getDistance2D(pos1, pos2) {
        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;
        
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    // Save world state
    async saveWorldState() {
        try {
            logger.info('Saving world state...');
            
            // Save player positions
            for (const [playerId, player] of this.players) {
                await player.character.save();
            }
            
            // Save dynamic objects
            // TODO: Implement dynamic object persistence
            
            logger.info('World state saved');
            
        } catch (error) {
            logger.error('Failed to save world state:', error);
        }
    }
    
    // Performance monitoring
    getPerformanceStats() {
        return {
            ...this.performance,
            tickRate: this.options.tickRate,
            uptime: this.tickCount * (1000 / this.options.tickRate) / 1000, // seconds
            zonesLoaded: this.zones.size,
            chunksActive: Array.from(this.chunks.values()).filter(c => c.isActive).length
        };
    }
}