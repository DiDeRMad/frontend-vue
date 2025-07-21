import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';
import { PhysicsEngine } from './physics/PhysicsEngine.js';
import { NetworkManager } from './network/NetworkManager.js';
import { EntityManager } from './entities/EntityManager.js';
import { CollisionDetection } from './physics/CollisionDetection.js';
import { AISystem } from './ai/AISystem.js';
import { WeatherSystem } from './world/WeatherSystem.js';
import { DayNightCycle } from './world/DayNightCycle.js';
import { EconomySystem } from './economy/EconomySystem.js';
import { SkillSystem } from './progression/SkillSystem.js';
import { CombatCalculator } from './combat/CombatCalculator.js';
import { LootSystem } from './loot/LootSystem.js';
import { SpellSystem } from './magic/SpellSystem.js';
import { BuildingSystem } from './building/BuildingSystem.js';
import { TradingSystem } from './trading/TradingSystem.js';
import { PetSystem } from './pets/PetSystem.js';
import { MountSystem } from './mounts/MountSystem.js';
import { DungeonSystem } from './dungeons/DungeonSystem.js';
import { RaidSystem } from './raids/RaidSystem.js';
import { PvPSystem } from './pvp/PvPSystem.js';
import { SeasonalEvents } from './events/SeasonalEvents.js';
import { TournamentSystem } from './tournaments/TournamentSystem.js';
import { AuctionHouse } from './auction/AuctionHouse.js';

export class GameEngine extends EventEmitter {
  constructor(io) {
    super();
    this.io = io;
    this.isRunning = false;
    this.tickRate = 60; // 60 TPS (ticks per second)
    this.tickDuration = 1000 / this.tickRate;
    this.lastTick = 0;
    this.tickCount = 0;
    this.deltaTime = 0;
    
    // Game state
    this.gameState = {
      isActive: true,
      isPaused: false,
      maintenanceMode: false,
      serverTime: Date.now(),
      worldTime: 0,
      season: 'spring',
      weatherCondition: 'clear'
    };
    
    // Performance metrics
    this.metrics = {
      tickTime: 0,
      avgTickTime: 0,
      maxTickTime: 0,
      fps: 0,
      memoryUsage: 0,
      playerCount: 0,
      entityCount: 0,
      activeQuests: 0,
      activeBattles: 0
    };
    
    // Game systems
    this.systems = new Map();
    this.initializeSystems();
    
    // Player data
    this.players = new Map();
    this.playerPositions = new Map();
    this.playerStates = new Map();
    
    // World data
    this.worlds = new Map();
    this.activeInstances = new Map();
    this.dungeonInstances = new Map();
    this.raidInstances = new Map();
    
    // Game objects
    this.entities = new Map();
    this.npcs = new Map();
    this.monsters = new Map();
    this.items = new Map();
    this.buildings = new Map();
    
    // Combat data
    this.activeBattles = new Map();
    this.combatQueues = new Map();
    this.skillCooldowns = new Map();
    
    // Social systems
    this.guilds = new Map();
    this.parties = new Map();
    this.friendLists = new Map();
    this.chatChannels = new Map();
    
    // Economy data
    this.marketOrders = new Map();
    this.tradeRequests = new Map();
    this.auctionItems = new Map();
    this.economyHistory = [];
    
    // Events and quests
    this.activeQuests = new Map();
    this.worldEvents = new Map();
    this.seasonalEvents = new Map();
    this.tournaments = new Map();
    
    // Leaderboards
    this.leaderboards = {
      level: [],
      wealth: [],
      pvp: [],
      guild: [],
      achievements: []
    };
    
    // Statistics
    this.statistics = {
      totalPlayTime: 0,
      questsCompleted: 0,
      monstersKilled: 0,
      itemsCrafted: 0,
      tradesCompleted: 0,
      dungeonsCompleted: 0,
      pvpBattles: 0
    };
  }

  initializeSystems() {
    // Core systems
    this.systems.set('physics', new PhysicsEngine(this));
    this.systems.set('network', new NetworkManager(this, this.io));
    this.systems.set('entities', new EntityManager(this));
    this.systems.set('collision', new CollisionDetection(this));
    this.systems.set('ai', new AISystem(this));
    
    // World systems
    this.systems.set('weather', new WeatherSystem(this));
    this.systems.set('daynight', new DayNightCycle(this));
    this.systems.set('economy', new EconomySystem(this));
    
    // Progression systems
    this.systems.set('skills', new SkillSystem(this));
    this.systems.set('combat', new CombatCalculator(this));
    this.systems.set('loot', new LootSystem(this));
    this.systems.set('spells', new SpellSystem(this));
    
    // Building and crafting
    this.systems.set('building', new BuildingSystem(this));
    this.systems.set('trading', new TradingSystem(this));
    
    // Companion systems
    this.systems.set('pets', new PetSystem(this));
    this.systems.set('mounts', new MountSystem(this));
    
    // Instance systems
    this.systems.set('dungeons', new DungeonSystem(this));
    this.systems.set('raids', new RaidSystem(this));
    this.systems.set('pvp', new PvPSystem(this));
    
    // Event systems
    this.systems.set('seasonal', new SeasonalEvents(this));
    this.systems.set('tournaments', new TournamentSystem(this));
    this.systems.set('auction', new AuctionHouse(this));
  }

  async initialize() {
    console.log('🎮 Initializing Game Engine...');
    
    try {
      // Initialize all systems
      for (const [name, system] of this.systems) {
        console.log(`Initializing ${name} system...`);
        if (system.initialize) {
          await system.initialize();
        }
      }
      
      // Load world data
      await this.loadWorldData();
      
      // Load game configuration
      await this.loadGameConfig();
      
      // Start game loop
      this.startGameLoop();
      
      // Initialize chat channels
      this.initializeChatChannels();
      
      // Start background processes
      this.startBackgroundProcesses();
      
      console.log('✅ Game Engine initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize Game Engine:', error);
      throw error;
    }
  }

  async loadWorldData() {
    // Load default worlds
    const defaultWorlds = [
      {
        id: 'newbie-island',
        name: 'Newbie Island',
        description: 'Starting area for new players',
        maxPlayers: 1000,
        size: { width: 2048, height: 2048 },
        spawnPoint: { x: 1024, y: 1024 },
        difficulty: 1,
        levelRange: [1, 10]
      },
      {
        id: 'central-plains',
        name: 'Central Plains',
        description: 'Main hub world with cities and towns',
        maxPlayers: 5000,
        size: { width: 4096, height: 4096 },
        spawnPoint: { x: 2048, y: 2048 },
        difficulty: 2,
        levelRange: [10, 50]
      },
      {
        id: 'dark-forest',
        name: 'Dark Forest',
        description: 'Dangerous forest filled with monsters',
        maxPlayers: 2000,
        size: { width: 3072, height: 3072 },
        spawnPoint: { x: 1536, y: 1536 },
        difficulty: 4,
        levelRange: [30, 70]
      },
      {
        id: 'frozen-peaks',
        name: 'Frozen Peaks',
        description: 'High-level mountainous region',
        maxPlayers: 1500,
        size: { width: 2560, height: 2560 },
        spawnPoint: { x: 1280, y: 1280 },
        difficulty: 6,
        levelRange: [60, 100]
      }
    ];
    
    defaultWorlds.forEach(world => {
      this.worlds.set(world.id, world);
    });
    
    console.log(`Loaded ${defaultWorlds.length} worlds`);
  }

  async loadGameConfig() {
    this.config = {
      maxLevel: 100,
      experienceTable: this.generateExperienceTable(),
      itemDropRates: {
        common: 70,
        uncommon: 20,
        rare: 8,
        epic: 1.8,
        legendary: 0.2
      },
      combatSettings: {
        baseDamage: 10,
        criticalChance: 0.05,
        criticalMultiplier: 2.0,
        dodgeChance: 0.1,
        blockChance: 0.15
      },
      economySettings: {
        baseTaxRate: 0.05,
        inflationRate: 0.02,
        dailyQuestReward: 100,
        tradeCommission: 0.03
      }
    };
  }

  generateExperienceTable() {
    const table = [];
    for (let level = 1; level <= 100; level++) {
      const baseExp = 100;
      const multiplier = Math.pow(1.15, level - 1);
      table[level] = Math.floor(baseExp * multiplier);
    }
    return table;
  }

  startGameLoop() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastTick = performance.now();
    
    const gameLoop = () => {
      if (!this.isRunning) return;
      
      const now = performance.now();
      this.deltaTime = now - this.lastTick;
      
      if (this.deltaTime >= this.tickDuration) {
        this.update(this.deltaTime);
        this.lastTick = now - (this.deltaTime % this.tickDuration);
        this.tickCount++;
        
        // Update metrics
        this.updateMetrics();
      }
      
      setImmediate(gameLoop);
    };
    
    gameLoop();
    console.log(`🔄 Game loop started at ${this.tickRate} TPS`);
  }

  update(deltaTime) {
    if (this.gameState.isPaused || this.gameState.maintenanceMode) {
      return;
    }
    
    const updateStart = performance.now();
    
    try {
      // Update game time
      this.gameState.serverTime = Date.now();
      this.gameState.worldTime += deltaTime;
      
      // Update all systems
      this.updateSystems(deltaTime);
      
      // Update players
      this.updatePlayers(deltaTime);
      
      // Update entities
      this.updateEntities(deltaTime);
      
      // Update world state
      this.updateWorldState(deltaTime);
      
      // Update combat
      this.updateCombat(deltaTime);
      
      // Update economy
      this.updateEconomy(deltaTime);
      
      // Update events
      this.updateEvents(deltaTime);
      
      // Send updates to clients
      this.sendUpdatesToClients();
      
      // Cleanup
      this.cleanup();
      
    } catch (error) {
      console.error('Error in game update:', error);
    }
    
    this.metrics.tickTime = performance.now() - updateStart;
  }

  updateSystems(deltaTime) {
    for (const [name, system] of this.systems) {
      if (system.update) {
        try {
          system.update(deltaTime);
        } catch (error) {
          console.error(`Error updating ${name} system:`, error);
        }
      }
    }
  }

  updatePlayers(deltaTime) {
    for (const [playerId, player] of this.players) {
      try {
        // Update player position
        if (player.isMoving) {
          this.updatePlayerMovement(player, deltaTime);
        }
        
        // Update player stats regeneration
        this.updatePlayerRegeneration(player, deltaTime);
        
        // Update player buffs/debuffs
        this.updatePlayerEffects(player, deltaTime);
        
        // Update player skills cooldowns
        this.updatePlayerCooldowns(player, deltaTime);
        
        // Update player quests
        this.updatePlayerQuests(player, deltaTime);
        
      } catch (error) {
        console.error(`Error updating player ${playerId}:`, error);
      }
    }
  }

  updateEntities(deltaTime) {
    for (const [entityId, entity] of this.entities) {
      try {
        // Update entity AI
        if (entity.ai) {
          this.systems.get('ai').updateEntity(entity, deltaTime);
        }
        
        // Update entity movement
        if (entity.isMoving) {
          this.updateEntityMovement(entity, deltaTime);
        }
        
        // Update entity health regeneration
        if (entity.health < entity.maxHealth) {
          entity.health = Math.min(entity.maxHealth, 
            entity.health + entity.healthRegen * deltaTime / 1000);
        }
        
        // Update entity effects
        this.updateEntityEffects(entity, deltaTime);
        
      } catch (error) {
        console.error(`Error updating entity ${entityId}:`, error);
      }
    }
  }

  updateWorldState(deltaTime) {
    // Update weather
    this.systems.get('weather').update(deltaTime);
    
    // Update day/night cycle
    this.systems.get('daynight').update(deltaTime);
    
    // Update seasonal events
    this.systems.get('seasonal').update(deltaTime);
  }

  updateCombat(deltaTime) {
    for (const [battleId, battle] of this.activeBattles) {
      try {
        this.systems.get('combat').updateBattle(battle, deltaTime);
        
        if (battle.isFinished) {
          this.resolveBattle(battle);
          this.activeBattles.delete(battleId);
        }
      } catch (error) {
        console.error(`Error updating battle ${battleId}:`, error);
      }
    }
  }

  updateEconomy(deltaTime) {
    this.systems.get('economy').update(deltaTime);
    this.systems.get('auction').update(deltaTime);
    this.systems.get('trading').update(deltaTime);
  }

  updateEvents(deltaTime) {
    for (const [eventId, event] of this.worldEvents) {
      try {
        event.update(deltaTime);
        
        if (event.isExpired()) {
          this.endWorldEvent(eventId);
        }
      } catch (error) {
        console.error(`Error updating event ${eventId}:`, error);
      }
    }
  }

  sendUpdatesToClients() {
    // Batch updates for better performance
    const playerUpdates = [];
    const entityUpdates = [];
    const worldUpdates = {
      weather: this.gameState.weatherCondition,
      timeOfDay: this.systems.get('daynight').getTimeOfDay(),
      season: this.gameState.season
    };
    
    // Collect player updates
    for (const [playerId, player] of this.players) {
      if (player.isDirty) {
        playerUpdates.push({
          id: playerId,
          position: player.position,
          health: player.health,
          mana: player.mana,
          level: player.level,
          experience: player.experience
        });
        player.isDirty = false;
      }
    }
    
    // Collect entity updates
    for (const [entityId, entity] of this.entities) {
      if (entity.isDirty) {
        entityUpdates.push({
          id: entityId,
          position: entity.position,
          health: entity.health,
          state: entity.state
        });
        entity.isDirty = false;
      }
    }
    
    // Send updates to all connected clients
    if (playerUpdates.length > 0 || entityUpdates.length > 0) {
      this.io.emit('game:update', {
        players: playerUpdates,
        entities: entityUpdates,
        world: worldUpdates,
        timestamp: this.gameState.serverTime
      });
    }
  }

  cleanup() {
    // Remove expired effects
    for (const [playerId, player] of this.players) {
      player.effects = player.effects.filter(effect => 
        effect.expiresAt > this.gameState.serverTime);
    }
    
    // Remove expired entities
    for (const [entityId, entity] of this.entities) {
      if (entity.shouldRemove) {
        this.entities.delete(entityId);
      }
    }
    
    // Clean up old battle data
    if (this.tickCount % (this.tickRate * 60) === 0) { // Every minute
      this.cleanupOldData();
    }
  }

  updateMetrics() {
    this.metrics.avgTickTime = (this.metrics.avgTickTime * 0.95) + 
      (this.metrics.tickTime * 0.05);
    this.metrics.maxTickTime = Math.max(this.metrics.maxTickTime, 
      this.metrics.tickTime);
    this.metrics.fps = Math.round(1000 / this.deltaTime);
    this.metrics.memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
    this.metrics.playerCount = this.players.size;
    this.metrics.entityCount = this.entities.size;
    this.metrics.activeQuests = this.activeQuests.size;
    this.metrics.activeBattles = this.activeBattles.size;
  }

  // Player management methods
  async handlePlayerAction(socket, data) {
    const playerId = socket.playerId;
    const player = this.players.get(playerId);
    
    if (!player) {
      throw new Error('Player not found');
    }
    
    switch (data.action) {
      case 'move':
        await this.handlePlayerMove(player, data);
        break;
      case 'attack':
        await this.handlePlayerAttack(player, data);
        break;
      case 'cast_spell':
        await this.handlePlayerCastSpell(player, data);
        break;
      case 'use_item':
        await this.handlePlayerUseItem(player, data);
        break;
      case 'interact':
        await this.handlePlayerInteract(player, data);
        break;
      case 'trade':
        await this.handlePlayerTrade(player, data);
        break;
      case 'craft':
        await this.handlePlayerCraft(player, data);
        break;
      default:
        throw new Error(`Unknown action: ${data.action}`);
    }
  }

  async handlePlayerMove(player, data) {
    const { x, y, targetX, targetY } = data;
    
    // Validate movement
    if (!this.isValidPosition(x, y) || !this.isValidPosition(targetX, targetY)) {
      throw new Error('Invalid position');
    }
    
    // Check movement speed
    const distance = Math.sqrt(
      Math.pow(targetX - x, 2) + Math.pow(targetY - y, 2)
    );
    
    if (distance > player.movementSpeed * 2) {
      throw new Error('Movement too fast');
    }
    
    // Update player position
    player.position.x = x;
    player.position.y = y;
    player.targetPosition = { x: targetX, y: targetY };
    player.isMoving = true;
    player.isDirty = true;
    
    // Check for collisions
    const collisions = this.systems.get('collision').checkPlayerMovement(player);
    if (collisions.length > 0) {
      await this.handlePlayerCollisions(player, collisions);
    }
  }

  updatePlayerMovement(player, deltaTime) {
    if (!player.targetPosition) return;
    
    const dx = player.targetPosition.x - player.position.x;
    const dy = player.targetPosition.y - player.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 1) {
      player.position.x = player.targetPosition.x;
      player.position.y = player.targetPosition.y;
      player.isMoving = false;
      player.targetPosition = null;
    } else {
      const moveDistance = player.movementSpeed * deltaTime / 1000;
      const ratio = Math.min(moveDistance / distance, 1);
      
      player.position.x += dx * ratio;
      player.position.y += dy * ratio;
    }
    
    player.isDirty = true;
  }

  updatePlayerRegeneration(player, deltaTime) {
    const regenAmount = deltaTime / 1000;
    
    // Health regeneration
    if (player.health < player.maxHealth) {
      player.health = Math.min(player.maxHealth, 
        player.health + player.healthRegen * regenAmount);
      player.isDirty = true;
    }
    
    // Mana regeneration
    if (player.mana < player.maxMana) {
      player.mana = Math.min(player.maxMana, 
        player.mana + player.manaRegen * regenAmount);
      player.isDirty = true;
    }
    
    // Stamina regeneration
    if (player.stamina < player.maxStamina) {
      player.stamina = Math.min(player.maxStamina, 
        player.stamina + player.staminaRegen * regenAmount);
      player.isDirty = true;
    }
  }

  // Utility methods
  isValidPosition(x, y) {
    return x >= 0 && y >= 0 && x <= 10000 && y <= 10000;
  }

  getStats() {
    return {
      ...this.metrics,
      gameState: this.gameState,
      uptime: this.tickCount / this.tickRate
    };
  }

  getPlayerCount() {
    return this.players.size;
  }

  updatePlayerPosition(playerId, data) {
    const player = this.players.get(playerId);
    if (player) {
      player.position = data.position;
      player.isDirty = true;
    }
  }

  initializeChatChannels() {
    const defaultChannels = ['global', 'trade', 'help', 'guild', 'party'];
    defaultChannels.forEach(channel => {
      this.chatChannels.set(channel, {
        name: channel,
        users: new Set(),
        messages: [],
        maxMessages: 1000
      });
    });
  }

  startBackgroundProcesses() {
    // Auto-save every 5 minutes
    setInterval(() => {
      this.autoSave();
    }, 5 * 60 * 1000);
    
    // Update leaderboards every hour
    setInterval(() => {
      this.updateLeaderboards();
    }, 60 * 60 * 1000);
    
    // Clean up old data every 30 minutes
    setInterval(() => {
      this.cleanupOldData();
    }, 30 * 60 * 1000);
  }

  async autoSave() {
    console.log('🔄 Auto-saving game data...');
    try {
      // Save player data
      for (const [playerId, player] of this.players) {
        await this.savePlayerData(player);
      }
      
      // Save world state
      await this.saveWorldState();
      
      console.log('✅ Auto-save completed');
    } catch (error) {
      console.error('❌ Auto-save failed:', error);
    }
  }

  updateLeaderboards() {
    // Update level leaderboard
    this.leaderboards.level = Array.from(this.players.values())
      .sort((a, b) => b.level - a.level)
      .slice(0, 100)
      .map(player => ({
        id: player.id,
        name: player.name,
        level: player.level,
        experience: player.experience
      }));
    
    // Update wealth leaderboard
    this.leaderboards.wealth = Array.from(this.players.values())
      .sort((a, b) => b.gold - a.gold)
      .slice(0, 100)
      .map(player => ({
        id: player.id,
        name: player.name,
        gold: player.gold
      }));
    
    // Broadcast updated leaderboards
    this.io.emit('leaderboards:update', this.leaderboards);
  }

  cleanupOldData() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    // Clean up old chat messages
    for (const [channelName, channel] of this.chatChannels) {
      channel.messages = channel.messages.filter(msg => 
        msg.timestamp > oneHourAgo);
    }
    
    // Clean up old economy history
    this.economyHistory = this.economyHistory.filter(entry => 
      entry.timestamp > oneHourAgo);
  }

  stop() {
    this.isRunning = false;
    console.log('🛑 Game Engine stopped');
  }
}