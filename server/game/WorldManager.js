const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');

class WorldManager extends EventEmitter {
    constructor(gameEngine) {
        super();
        this.gameEngine = gameEngine;
        this.worlds = new Map();
        this.instances = new Map();
        this.regions = new Map();
        this.activeEvents = new Map();
        this.weatherSystem = null;
        this.dayNightCycle = null;
        this.seasonSystem = null;
        this.spawners = new Map();
        this.portals = new Map();
        this.barriers = new Map();
        this.treasures = new Map();
        this.landmarks = new Map();
        this.environmentalEffects = new Map();
        this.dynamicElements = new Map();
        this.worldConfigs = new Map();
        this.loadedChunks = new Map();
        this.chunkSize = 100;
        this.renderDistance = 500;
        this.maxInstances = 1000;
        this.instanceTimeout = 3600000; // 1 hour
        this.cleanupInterval = 300000; // 5 minutes
        this.worldSaveInterval = 600000; // 10 minutes
        this.statistics = {
            worldsLoaded: 0,
            instancesCreated: 0,
            playersTransported: 0,
            eventsTriggered: 0,
            chunksLoaded: 0,
            chunksUnloaded: 0,
            totalWorldTime: 0,
            weatherChanges: 0,
            seasonChanges: 0
        };
        this.eventListeners = new Map();
        this.worldData = new Map();
        this.persistentData = new Map();
        this.temporaryData = new Map();
        this.backgroundTasks = new Map();
        this.performanceMetrics = {
            averageLoadTime: 0,
            peakConcurrentPlayers: 0,
            totalDataTransferred: 0,
            errorCount: 0,
            uptime: 0
        };
    }

    async initialize() {
        console.log('Initializing WorldManager...');
        
        try {
            // Initialize world systems
            await this.initializeWorldSystems();
            
            // Load world configurations
            await this.loadWorldConfigurations();
            
            // Initialize default worlds
            await this.loadDefaultWorlds();
            
            // Setup environmental systems
            await this.setupEnvironmentalSystems();
            
            // Start background processes
            this.startBackgroundProcesses();
            
            // Setup event listeners
            this.setupEventListeners();
            
            console.log('WorldManager initialized successfully');
            this.emit('initialized');
        } catch (error) {
            console.error('Failed to initialize WorldManager:', error);
            throw error;
        }
    }

    async initializeWorldSystems() {
        // Initialize weather system
        this.weatherSystem = new WeatherSystem(this);
        await this.weatherSystem.initialize();

        // Initialize day/night cycle
        this.dayNightCycle = new DayNightCycle(this);
        await this.dayNightCycle.initialize();

        // Initialize season system
        this.seasonSystem = new SeasonSystem(this);
        await this.seasonSystem.initialize();

        console.log('World systems initialized');
    }

    async loadWorldConfigurations() {
        try {
            const configPath = path.join(__dirname, '../data/worlds');
            const configFiles = await fs.readdir(configPath);
            
            for (const file of configFiles) {
                if (file.endsWith('.json')) {
                    const configData = await fs.readFile(path.join(configPath, file), 'utf8');
                    const config = JSON.parse(configData);
                    this.worldConfigs.set(config.id, config);
                }
            }
            
            console.log(`Loaded ${this.worldConfigs.size} world configurations`);
        } catch (error) {
            console.error('Failed to load world configurations:', error);
            // Load default configurations
            this.loadDefaultConfigurations();
        }
    }

    loadDefaultConfigurations() {
        const defaultWorlds = [
            {
                id: 'starter_town',
                name: 'Starter Town',
                type: 'town',
                level: 1,
                maxPlayers: 100,
                pvpEnabled: false,
                size: { width: 1000, height: 1000 },
                spawnPoint: { x: 500, y: 500 },
                weather: true,
                dayNight: true,
                seasons: true,
                description: 'A peaceful town for new adventurers'
            },
            {
                id: 'forest_of_beginnings',
                name: 'Forest of Beginnings',
                type: 'wilderness',
                level: 5,
                maxPlayers: 50,
                pvpEnabled: false,
                size: { width: 2000, height: 2000 },
                spawnPoint: { x: 100, y: 100 },
                weather: true,
                dayNight: true,
                seasons: true,
                description: 'A mystical forest perfect for early adventures'
            },
            {
                id: 'pvp_arena',
                name: 'PvP Arena',
                type: 'arena',
                level: 10,
                maxPlayers: 20,
                pvpEnabled: true,
                size: { width: 500, height: 500 },
                spawnPoint: { x: 250, y: 250 },
                weather: false,
                dayNight: false,
                seasons: false,
                description: 'Battle arena for player vs player combat'
            },
            {
                id: 'ancient_dungeons',
                name: 'Ancient Dungeons',
                type: 'dungeon',
                level: 25,
                maxPlayers: 5,
                pvpEnabled: false,
                size: { width: 800, height: 800 },
                spawnPoint: { x: 50, y: 50 },
                weather: false,
                dayNight: false,
                seasons: false,
                description: 'Dark dungeons filled with treasures and dangers'
            },
            {
                id: 'dragon_peak',
                name: 'Dragon Peak',
                type: 'raid',
                level: 50,
                maxPlayers: 25,
                pvpEnabled: false,
                size: { width: 3000, height: 3000 },
                spawnPoint: { x: 150, y: 150 },
                weather: true,
                dayNight: true,
                seasons: true,
                description: 'The ultimate challenge for experienced players'
            }
        ];

        defaultWorlds.forEach(world => {
            this.worldConfigs.set(world.id, world);
        });

        console.log('Loaded default world configurations');
    }

    async loadDefaultWorlds() {
        for (const [worldId, config] of this.worldConfigs) {
            await this.loadWorld(worldId, config);
        }
    }

    async loadWorld(worldId, config) {
        try {
            console.log(`Loading world: ${worldId}`);
            
            const world = {
                id: worldId,
                config: config,
                players: new Map(),
                entities: new Map(),
                npcs: new Map(),
                items: new Map(),
                effects: new Map(),
                events: new Map(),
                chunks: new Map(),
                lastUpdate: Date.now(),
                createdAt: Date.now(),
                statistics: {
                    totalPlayers: 0,
                    totalTime: 0,
                    eventsTriggered: 0,
                    itemsDropped: 0,
                    npcsSpawned: 0
                },
                environment: {
                    weather: null,
                    timeOfDay: 0,
                    season: 'spring',
                    temperature: 20,
                    humidity: 50,
                    windSpeed: 5,
                    visibility: 100
                },
                dynamicData: new Map(),
                persistentChanges: new Map()
            };

            // Load world-specific data
            await this.loadWorldData(world);
            
            // Initialize spawners
            await this.initializeSpawners(world);
            
            // Setup portals
            await this.setupPortals(world);
            
            // Initialize environmental effects
            await this.initializeEnvironmentalEffects(world);
            
            // Load chunks in spawn area
            await this.loadSpawnChunks(world);
            
            this.worlds.set(worldId, world);
            this.statistics.worldsLoaded++;
            
            console.log(`World ${worldId} loaded successfully`);
            this.emit('worldLoaded', worldId, world);
            
            return world;
        } catch (error) {
            console.error(`Failed to load world ${worldId}:`, error);
            throw error;
        }
    }

    async loadWorldData(world) {
        // Load NPCs
        world.npcs = await this.loadWorldNPCs(world.id);
        
        // Load static entities
        world.entities = await this.loadWorldEntities(world.id);
        
        // Load interactive objects
        world.items = await this.loadWorldItems(world.id);
        
        // Load environmental data
        world.environment = await this.loadEnvironmentalData(world.id);
        
        console.log(`Loaded data for world ${world.id}`);
    }

    async loadWorldNPCs(worldId) {
        const npcs = new Map();
        
        // Load from database or configuration
        const npcData = await this.gameEngine.database.collection('npcs')
            .find({ worldId: worldId }).toArray();
        
        npcData.forEach(npc => {
            npcs.set(npc.id, {
                id: npc.id,
                name: npc.name,
                type: npc.type,
                level: npc.level,
                position: npc.position,
                stats: npc.stats,
                behavior: npc.behavior,
                dialogue: npc.dialogue,
                quests: npc.quests,
                shop: npc.shop,
                spawned: false,
                lastSeen: 0,
                ai: null
            });
        });
        
        return npcs;
    }

    async loadWorldEntities(worldId) {
        const entities = new Map();
        
        // Load static world entities
        const entityData = await this.gameEngine.database.collection('world_entities')
            .find({ worldId: worldId }).toArray();
        
        entityData.forEach(entity => {
            entities.set(entity.id, {
                id: entity.id,
                type: entity.type,
                position: entity.position,
                properties: entity.properties,
                interactive: entity.interactive,
                collectable: entity.collectable,
                respawnTime: entity.respawnTime,
                lastInteraction: 0,
                state: entity.state || 'active'
            });
        });
        
        return entities;
    }

    async loadWorldItems(worldId) {
        const items = new Map();
        
        // Load world items and loot spawns
        const itemData = await this.gameEngine.database.collection('world_items')
            .find({ worldId: worldId }).toArray();
        
        itemData.forEach(item => {
            items.set(item.id, {
                id: item.id,
                itemId: item.itemId,
                position: item.position,
                quantity: item.quantity,
                quality: item.quality,
                spawnTime: item.spawnTime,
                despawnTime: item.despawnTime,
                owner: item.owner,
                visible: item.visible !== false
            });
        });
        
        return items;
    }

    async loadEnvironmentalData(worldId) {
        const config = this.worldConfigs.get(worldId);
        
        return {
            weather: config.weather ? 'clear' : null,
            timeOfDay: 720, // 12:00 PM
            season: 'spring',
            temperature: 22,
            humidity: 60,
            windSpeed: 3,
            visibility: 100,
            ambientSound: config.type === 'forest' ? 'forest_ambience' : 'town_ambience',
            lighting: {
                ambient: 0.8,
                directional: 0.6,
                shadows: true
            },
            effects: []
        };
    }

    async initializeSpawners(world) {
        const spawners = [];
        
        // Create monster spawners based on world type
        if (world.config.type === 'wilderness' || world.config.type === 'dungeon') {
            const spawnerCount = Math.floor(world.config.size.width * world.config.size.height / 10000);
            
            for (let i = 0; i < spawnerCount; i++) {
                const spawner = {
                    id: `${world.id}_spawner_${i}`,
                    worldId: world.id,
                    position: {
                        x: Math.random() * world.config.size.width,
                        y: Math.random() * world.config.size.height
                    },
                    radius: 50,
                    maxEntities: 5,
                    spawnRate: 60000, // 1 minute
                    entityTypes: this.getSpawnerEntities(world.config.level),
                    active: true,
                    lastSpawn: 0,
                    currentEntities: []
                };
                
                spawners.push(spawner);
                this.spawners.set(spawner.id, spawner);
            }
        }
        
        console.log(`Initialized ${spawners.length} spawners for world ${world.id}`);
    }

    getSpawnerEntities(worldLevel) {
        const baseEntities = ['goblin', 'wolf', 'spider', 'skeleton'];
        const entities = [];
        
        baseEntities.forEach(entity => {
            if (worldLevel >= this.getEntityMinLevel(entity)) {
                entities.push({
                    type: entity,
                    level: Math.max(1, worldLevel + Math.floor(Math.random() * 5) - 2),
                    weight: this.getEntitySpawnWeight(entity, worldLevel)
                });
            }
        });
        
        return entities;
    }

    getEntityMinLevel(entityType) {
        const minLevels = {
            'goblin': 1,
            'wolf': 3,
            'spider': 5,
            'skeleton': 8,
            'orc': 12,
            'troll': 20,
            'dragon': 50
        };
        
        return minLevels[entityType] || 1;
    }

    getEntitySpawnWeight(entityType, worldLevel) {
        const baseWeights = {
            'goblin': 100,
            'wolf': 80,
            'spider': 60,
            'skeleton': 40,
            'orc': 30,
            'troll': 10,
            'dragon': 1
        };
        
        return baseWeights[entityType] || 50;
    }

    async setupPortals(world) {
        const portals = [];
        
        // Create portals to other worlds
        if (world.id === 'starter_town') {
            portals.push({
                id: 'portal_to_forest',
                position: { x: 800, y: 500 },
                destination: {
                    worldId: 'forest_of_beginnings',
                    position: { x: 100, y: 100 }
                },
                requirements: { level: 5 },
                active: true
            });
        }
        
        if (world.id === 'forest_of_beginnings') {
            portals.push({
                id: 'portal_to_town',
                position: { x: 100, y: 100 },
                destination: {
                    worldId: 'starter_town',
                    position: { x: 800, y: 500 }
                },
                requirements: {},
                active: true
            });
        }
        
        portals.forEach(portal => {
            this.portals.set(portal.id, portal);
        });
        
        console.log(`Setup ${portals.length} portals for world ${world.id}`);
    }

    async initializeEnvironmentalEffects(world) {
        const effects = [];
        
        // Add weather effects based on world type
        if (world.config.weather) {
            effects.push({
                id: 'weather_effect',
                type: 'weather',
                intensity: 0.5,
                duration: -1, // Permanent
                area: 'global'
            });
        }
        
        // Add ambient effects
        if (world.config.type === 'forest') {
            effects.push({
                id: 'forest_ambience',
                type: 'ambient_sound',
                sound: 'forest_sounds',
                volume: 0.3,
                duration: -1
            });
        }
        
        effects.forEach(effect => {
            this.environmentalEffects.set(effect.id, effect);
        });
        
        console.log(`Initialized ${effects.length} environmental effects for world ${world.id}`);
    }

    async loadSpawnChunks(world) {
        const spawnPoint = world.config.spawnPoint;
        const chunksToLoad = this.getChunksInRadius(spawnPoint, this.renderDistance);
        
        for (const chunkCoord of chunksToLoad) {
            await this.loadChunk(world.id, chunkCoord.x, chunkCoord.y);
        }
        
        console.log(`Loaded ${chunksToLoad.length} spawn chunks for world ${world.id}`);
    }

    getChunksInRadius(center, radius) {
        const chunks = [];
        const chunkRadius = Math.ceil(radius / this.chunkSize);
        const centerChunkX = Math.floor(center.x / this.chunkSize);
        const centerChunkY = Math.floor(center.y / this.chunkSize);
        
        for (let x = centerChunkX - chunkRadius; x <= centerChunkX + chunkRadius; x++) {
            for (let y = centerChunkY - chunkRadius; y <= centerChunkY + chunkRadius; y++) {
                const distance = Math.sqrt(
                    Math.pow((x - centerChunkX) * this.chunkSize, 2) +
                    Math.pow((y - centerChunkY) * this.chunkSize, 2)
                );
                
                if (distance <= radius) {
                    chunks.push({ x, y });
                }
            }
        }
        
        return chunks;
    }

    async loadChunk(worldId, chunkX, chunkY) {
        const chunkKey = `${worldId}:${chunkX}:${chunkY}`;
        
        if (this.loadedChunks.has(chunkKey)) {
            return this.loadedChunks.get(chunkKey);
        }
        
        const chunk = {
            worldId: worldId,
            x: chunkX,
            y: chunkY,
            entities: new Map(),
            items: new Map(),
            players: new Set(),
            lastAccessed: Date.now(),
            dirty: false,
            bounds: {
                minX: chunkX * this.chunkSize,
                maxX: (chunkX + 1) * this.chunkSize,
                minY: chunkY * this.chunkSize,
                maxY: (chunkY + 1) * this.chunkSize
            }
        };
        
        // Load chunk data from database
        await this.loadChunkData(chunk);
        
        this.loadedChunks.set(chunkKey, chunk);
        this.statistics.chunksLoaded++;
        
        return chunk;
    }

    async loadChunkData(chunk) {
        // Load entities in chunk
        const entities = await this.gameEngine.database.collection('chunk_entities')
            .find({
                worldId: chunk.worldId,
                'position.x': { $gte: chunk.bounds.minX, $lt: chunk.bounds.maxX },
                'position.y': { $gte: chunk.bounds.minY, $lt: chunk.bounds.maxY }
            }).toArray();
        
        entities.forEach(entity => {
            chunk.entities.set(entity.id, entity);
        });
        
        // Load items in chunk
        const items = await this.gameEngine.database.collection('chunk_items')
            .find({
                worldId: chunk.worldId,
                'position.x': { $gte: chunk.bounds.minX, $lt: chunk.bounds.maxX },
                'position.y': { $gte: chunk.bounds.minY, $lt: chunk.bounds.maxY }
            }).toArray();
        
        items.forEach(item => {
            chunk.items.set(item.id, item);
        });
    }

    async setupEnvironmentalSystems() {
        // Setup weather system
        if (this.weatherSystem) {
            await this.weatherSystem.start();
        }
        
        // Setup day/night cycle
        if (this.dayNightCycle) {
            await this.dayNightCycle.start();
        }
        
        // Setup season system
        if (this.seasonSystem) {
            await this.seasonSystem.start();
        }
        
        console.log('Environmental systems setup complete');
    }

    startBackgroundProcesses() {
        // Cleanup process
        setInterval(() => {
            this.cleanupInactiveInstances();
            this.cleanupUnusedChunks();
        }, this.cleanupInterval);
        
        // World save process
        setInterval(() => {
            this.saveAllWorldData();
        }, this.worldSaveInterval);
        
        // Statistics update
        setInterval(() => {
            this.updateStatistics();
        }, 60000); // Every minute
        
        console.log('Background processes started');
    }

    setupEventListeners() {
        // Listen for player events
        this.gameEngine.on('player:join', (player) => {
            this.handlePlayerJoinWorld(player);
        });
        
        this.gameEngine.on('player:leave', (player) => {
            this.handlePlayerLeaveWorld(player);
        });
        
        this.gameEngine.on('player:move', (player, oldPosition, newPosition) => {
            this.handlePlayerMove(player, oldPosition, newPosition);
        });
        
        this.gameEngine.on('entity:spawn', (entity) => {
            this.handleEntitySpawn(entity);
        });
        
        this.gameEngine.on('entity:despawn', (entity) => {
            this.handleEntityDespawn(entity);
        });
        
        console.log('Event listeners setup complete');
    }

    handlePlayerJoinWorld(player) {
        const worldId = player.worldId;
        const world = this.worlds.get(worldId);
        
        if (!world) {
            console.error(`World ${worldId} not found for player ${player.id}`);
            return;
        }
        
        // Add player to world
        world.players.set(player.id, player);
        world.statistics.totalPlayers++;
        
        // Load chunks around player
        this.loadChunksAroundPlayer(player);
        
        // Update world statistics
        this.updateWorldPlayerCount(worldId);
        
        // Emit world update
        this.emit('playerJoinedWorld', worldId, player);
        
        console.log(`Player ${player.name} joined world ${worldId}`);
    }

    handlePlayerLeaveWorld(player) {
        const worldId = player.worldId;
        const world = this.worlds.get(worldId);
        
        if (!world) {
            return;
        }
        
        // Remove player from world
        world.players.delete(player.id);
        
        // Remove player from chunks
        this.removePlayerFromChunks(player);
        
        // Update world statistics
        this.updateWorldPlayerCount(worldId);
        
        // Emit world update
        this.emit('playerLeftWorld', worldId, player);
        
        console.log(`Player ${player.name} left world ${worldId}`);
    }

    handlePlayerMove(player, oldPosition, newPosition) {
        // Update chunk membership
        this.updatePlayerChunks(player, oldPosition, newPosition);
        
        // Load new chunks if needed
        this.loadChunksAroundPlayer(player);
        
        // Check for environmental effects
        this.checkEnvironmentalEffects(player, newPosition);
        
        // Check for portal interactions
        this.checkPortalInteractions(player, newPosition);
    }

    loadChunksAroundPlayer(player) {
        const chunks = this.getChunksInRadius(player.position, this.renderDistance);
        
        chunks.forEach(async (chunkCoord) => {
            await this.loadChunk(player.worldId, chunkCoord.x, chunkCoord.y);
        });
    }

    removePlayerFromChunks(player) {
        for (const [chunkKey, chunk] of this.loadedChunks) {
            if (chunk.worldId === player.worldId) {
                chunk.players.delete(player.id);
            }
        }
    }

    updatePlayerChunks(player, oldPosition, newPosition) {
        const oldChunk = this.getChunkCoordinates(oldPosition);
        const newChunk = this.getChunkCoordinates(newPosition);
        
        if (oldChunk.x !== newChunk.x || oldChunk.y !== newChunk.y) {
            // Remove from old chunk
            const oldChunkKey = `${player.worldId}:${oldChunk.x}:${oldChunk.y}`;
            const oldChunkData = this.loadedChunks.get(oldChunkKey);
            if (oldChunkData) {
                oldChunkData.players.delete(player.id);
            }
            
            // Add to new chunk
            const newChunkKey = `${player.worldId}:${newChunk.x}:${newChunk.y}`;
            const newChunkData = this.loadedChunks.get(newChunkKey);
            if (newChunkData) {
                newChunkData.players.add(player.id);
            }
        }
    }

    getChunkCoordinates(position) {
        return {
            x: Math.floor(position.x / this.chunkSize),
            y: Math.floor(position.y / this.chunkSize)
        };
    }

    checkEnvironmentalEffects(player, position) {
        const world = this.worlds.get(player.worldId);
        if (!world) return;
        
        // Check for environmental damage/effects
        const effects = this.getEnvironmentalEffectsAtPosition(world, position);
        
        effects.forEach(effect => {
            this.applyEnvironmentalEffect(player, effect);
        });
    }

    getEnvironmentalEffectsAtPosition(world, position) {
        const effects = [];
        
        // Check weather effects
        if (world.environment.weather === 'storm') {
            effects.push({
                type: 'weather_damage',
                intensity: 0.1,
                damage: 1
            });
        }
        
        // Check temperature effects
        if (world.environment.temperature < 0) {
            effects.push({
                type: 'cold_damage',
                intensity: Math.abs(world.environment.temperature) / 20,
                damage: 2
            });
        } else if (world.environment.temperature > 40) {
            effects.push({
                type: 'heat_damage',
                intensity: (world.environment.temperature - 40) / 20,
                damage: 2
            });
        }
        
        return effects;
    }

    applyEnvironmentalEffect(player, effect) {
        // Apply environmental effect to player
        this.gameEngine.emit('player:environmentalEffect', player, effect);
    }

    checkPortalInteractions(player, position) {
        for (const [portalId, portal] of this.portals) {
            const distance = Math.sqrt(
                Math.pow(position.x - portal.position.x, 2) +
                Math.pow(position.y - portal.position.y, 2)
            );
            
            if (distance <= 10) { // Portal interaction range
                this.handlePortalInteraction(player, portal);
            }
        }
    }

    handlePortalInteraction(player, portal) {
        // Check requirements
        if (!this.checkPortalRequirements(player, portal)) {
            this.gameEngine.emit('player:message', player, 'You do not meet the requirements to use this portal.');
            return;
        }
        
        // Transport player
        this.transportPlayer(player, portal.destination.worldId, portal.destination.position);
    }

    checkPortalRequirements(player, portal) {
        if (portal.requirements.level && player.level < portal.requirements.level) {
            return false;
        }
        
        if (portal.requirements.quest && !player.completedQuests.includes(portal.requirements.quest)) {
            return false;
        }
        
        return true;
    }

    async transportPlayer(player, targetWorldId, targetPosition) {
        try {
            // Remove from current world
            this.handlePlayerLeaveWorld(player);
            
            // Update player world
            player.worldId = targetWorldId;
            player.position = { ...targetPosition };
            
            // Ensure target world is loaded
            if (!this.worlds.has(targetWorldId)) {
                const config = this.worldConfigs.get(targetWorldId);
                if (config) {
                    await this.loadWorld(targetWorldId, config);
                }
            }
            
            // Add to new world
            this.handlePlayerJoinWorld(player);
            
            // Update statistics
            this.statistics.playersTransported++;
            
            // Emit transport event
            this.emit('playerTransported', player, targetWorldId, targetPosition);
            
            console.log(`Player ${player.name} transported to world ${targetWorldId}`);
        } catch (error) {
            console.error(`Failed to transport player ${player.name}:`, error);
        }
    }

    handleEntitySpawn(entity) {
        const world = this.worlds.get(entity.worldId);
        if (!world) return;
        
        // Add entity to world
        world.entities.set(entity.id, entity);
        
        // Add to appropriate chunk
        const chunk = this.getChunkForPosition(entity.worldId, entity.position);
        if (chunk) {
            chunk.entities.set(entity.id, entity);
            chunk.dirty = true;
        }
        
        // Update statistics
        world.statistics.npcsSpawned++;
        
        console.log(`Entity ${entity.id} spawned in world ${entity.worldId}`);
    }

    handleEntityDespawn(entity) {
        const world = this.worlds.get(entity.worldId);
        if (!world) return;
        
        // Remove entity from world
        world.entities.delete(entity.id);
        
        // Remove from chunk
        const chunk = this.getChunkForPosition(entity.worldId, entity.position);
        if (chunk) {
            chunk.entities.delete(entity.id);
            chunk.dirty = true;
        }
        
        console.log(`Entity ${entity.id} despawned from world ${entity.worldId}`);
    }

    getChunkForPosition(worldId, position) {
        const chunkCoord = this.getChunkCoordinates(position);
        const chunkKey = `${worldId}:${chunkCoord.x}:${chunkCoord.y}`;
        return this.loadedChunks.get(chunkKey);
    }

    async createInstance(worldId, config = {}) {
        if (this.instances.size >= this.maxInstances) {
            throw new Error('Maximum instances reached');
        }
        
        const instanceId = `${worldId}_instance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const baseConfig = this.worldConfigs.get(worldId);
        
        if (!baseConfig) {
            throw new Error(`World configuration not found for ${worldId}`);
        }
        
        const instanceConfig = {
            ...baseConfig,
            ...config,
            id: instanceId,
            isInstance: true,
            baseWorldId: worldId,
            maxPlayers: config.maxPlayers || baseConfig.maxPlayers,
            createdAt: Date.now(),
            expiresAt: Date.now() + this.instanceTimeout
        };
        
        // Create instance world
        const instance = await this.loadWorld(instanceId, instanceConfig);
        this.instances.set(instanceId, instance);
        this.statistics.instancesCreated++;
        
        console.log(`Created instance ${instanceId} for world ${worldId}`);
        this.emit('instanceCreated', instanceId, instance);
        
        return instance;
    }

    async destroyInstance(instanceId) {
        const instance = this.instances.get(instanceId);
        if (!instance) return;
        
        // Move all players back to base world
        for (const [playerId, player] of instance.players) {
            const baseWorldId = instance.config.baseWorldId;
            const baseWorld = this.worlds.get(baseWorldId);
            
            if (baseWorld) {
                await this.transportPlayer(player, baseWorldId, baseWorld.config.spawnPoint);
            }
        }
        
        // Save instance data if needed
        await this.saveWorldData(instance);
        
        // Clean up chunks
        this.cleanupInstanceChunks(instanceId);
        
        // Remove instance
        this.instances.delete(instanceId);
        this.worlds.delete(instanceId);
        
        console.log(`Destroyed instance ${instanceId}`);
        this.emit('instanceDestroyed', instanceId);
    }

    cleanupInstanceChunks(instanceId) {
        const chunksToRemove = [];
        
        for (const [chunkKey, chunk] of this.loadedChunks) {
            if (chunk.worldId === instanceId) {
                chunksToRemove.push(chunkKey);
            }
        }
        
        chunksToRemove.forEach(chunkKey => {
            this.loadedChunks.delete(chunkKey);
        });
        
        this.statistics.chunksUnloaded += chunksToRemove.length;
    }

    cleanupInactiveInstances() {
        const now = Date.now();
        const instancesToDestroy = [];
        
        for (const [instanceId, instance] of this.instances) {
            if (instance.config.expiresAt && now > instance.config.expiresAt) {
                if (instance.players.size === 0) {
                    instancesToDestroy.push(instanceId);
                } else {
                    // Extend expiration if players are still present
                    instance.config.expiresAt = now + this.instanceTimeout;
                }
            }
        }
        
        instancesToDestroy.forEach(instanceId => {
            this.destroyInstance(instanceId);
        });
        
        if (instancesToDestroy.length > 0) {
            console.log(`Cleaned up ${instancesToDestroy.length} inactive instances`);
        }
    }

    cleanupUnusedChunks() {
        const now = Date.now();
        const chunksToUnload = [];
        const maxIdleTime = 300000; // 5 minutes
        
        for (const [chunkKey, chunk] of this.loadedChunks) {
            if (chunk.players.size === 0 && (now - chunk.lastAccessed) > maxIdleTime) {
                // Don't unload spawn chunks
                const world = this.worlds.get(chunk.worldId);
                if (world) {
                    const spawnChunk = this.getChunkCoordinates(world.config.spawnPoint);
                    const chunkDistance = Math.sqrt(
                        Math.pow((chunk.x - spawnChunk.x) * this.chunkSize, 2) +
                        Math.pow((chunk.y - spawnChunk.y) * this.chunkSize, 2)
                    );
                    
                    if (chunkDistance > this.renderDistance) {
                        chunksToUnload.push(chunkKey);
                    }
                }
            }
        }
        
        chunksToUnload.forEach(async chunkKey => {
            const chunk = this.loadedChunks.get(chunkKey);
            if (chunk && chunk.dirty) {
                await this.saveChunkData(chunk);
            }
            this.loadedChunks.delete(chunkKey);
        });
        
        this.statistics.chunksUnloaded += chunksToUnload.length;
        
        if (chunksToUnload.length > 0) {
            console.log(`Unloaded ${chunksToUnload.length} unused chunks`);
        }
    }

    async saveChunkData(chunk) {
        try {
            // Save chunk entities
            const entities = Array.from(chunk.entities.values());
            if (entities.length > 0) {
                await this.gameEngine.database.collection('chunk_entities')
                    .deleteMany({
                        worldId: chunk.worldId,
                        'position.x': { $gte: chunk.bounds.minX, $lt: chunk.bounds.maxX },
                        'position.y': { $gte: chunk.bounds.minY, $lt: chunk.bounds.maxY }
                    });
                
                await this.gameEngine.database.collection('chunk_entities')
                    .insertMany(entities);
            }
            
            // Save chunk items
            const items = Array.from(chunk.items.values());
            if (items.length > 0) {
                await this.gameEngine.database.collection('chunk_items')
                    .deleteMany({
                        worldId: chunk.worldId,
                        'position.x': { $gte: chunk.bounds.minX, $lt: chunk.bounds.maxX },
                        'position.y': { $gte: chunk.bounds.minY, $lt: chunk.bounds.maxY }
                    });
                
                await this.gameEngine.database.collection('chunk_items')
                    .insertMany(items);
            }
            
            chunk.dirty = false;
        } catch (error) {
            console.error(`Failed to save chunk data for ${chunk.worldId}:${chunk.x}:${chunk.y}:`, error);
        }
    }

    async saveWorldData(world) {
        try {
            // Save world state
            await this.gameEngine.database.collection('world_states')
                .replaceOne(
                    { worldId: world.id },
                    {
                        worldId: world.id,
                        environment: world.environment,
                        statistics: world.statistics,
                        lastUpdate: Date.now(),
                        persistentChanges: Array.from(world.persistentChanges.entries())
                    },
                    { upsert: true }
                );
            
            console.log(`Saved world data for ${world.id}`);
        } catch (error) {
            console.error(`Failed to save world data for ${world.id}:`, error);
        }
    }

    async saveAllWorldData() {
        console.log('Saving all world data...');
        
        const savePromises = [];
        
        // Save all worlds
        for (const [worldId, world] of this.worlds) {
            savePromises.push(this.saveWorldData(world));
        }
        
        // Save all dirty chunks
        for (const [chunkKey, chunk] of this.loadedChunks) {
            if (chunk.dirty) {
                savePromises.push(this.saveChunkData(chunk));
            }
        }
        
        try {
            await Promise.all(savePromises);
            console.log('All world data saved successfully');
        } catch (error) {
            console.error('Failed to save some world data:', error);
        }
    }

    updateWorldPlayerCount(worldId) {
        const world = this.worlds.get(worldId);
        if (!world) return;
        
        const playerCount = world.players.size;
        
        // Update performance metrics
        if (playerCount > this.performanceMetrics.peakConcurrentPlayers) {
            this.performanceMetrics.peakConcurrentPlayers = playerCount;
        }
        
        // Emit player count update
        this.emit('worldPlayerCountUpdated', worldId, playerCount);
    }

    updateStatistics() {
        this.statistics.totalWorldTime += 60; // Add 1 minute
        this.performanceMetrics.uptime += 60;
        
        // Calculate average load time
        const totalWorlds = this.statistics.worldsLoaded;
        if (totalWorlds > 0) {
            this.performanceMetrics.averageLoadTime = this.statistics.totalWorldTime / totalWorlds;
        }
        
        // Emit statistics update
        this.emit('statisticsUpdated', this.statistics, this.performanceMetrics);
    }

    update(deltaTime) {
        // Update environmental systems
        if (this.weatherSystem) {
            this.weatherSystem.update(deltaTime);
        }
        
        if (this.dayNightCycle) {
            this.dayNightCycle.update(deltaTime);
        }
        
        if (this.seasonSystem) {
            this.seasonSystem.update(deltaTime);
        }
        
        // Update spawners
        this.updateSpawners(deltaTime);
        
        // Update world events
        this.updateWorldEvents(deltaTime);
        
        // Update environmental effects
        this.updateEnvironmentalEffects(deltaTime);
    }

    updateSpawners(deltaTime) {
        const now = Date.now();
        
        for (const [spawnerId, spawner] of this.spawners) {
            if (!spawner.active) continue;
            
            if (now - spawner.lastSpawn >= spawner.spawnRate) {
                if (spawner.currentEntities.length < spawner.maxEntities) {
                    this.spawnEntity(spawner);
                    spawner.lastSpawn = now;
                }
            }
        }
    }

    spawnEntity(spawner) {
        // Select random entity type based on weights
        const entityType = this.selectWeightedRandom(spawner.entityTypes);
        if (!entityType) return;
        
        // Find spawn position
        const spawnPosition = this.findValidSpawnPosition(spawner);
        if (!spawnPosition) return;
        
        // Create entity
        const entity = {
            id: `spawned_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: entityType.type,
            level: entityType.level,
            position: spawnPosition,
            worldId: spawner.worldId,
            spawnerId: spawner.id,
            spawnTime: Date.now(),
            ai: true
        };
        
        // Add to spawner tracking
        spawner.currentEntities.push(entity.id);
        
        // Emit spawn event
        this.emit('entitySpawned', entity);
        
        console.log(`Spawned ${entityType.type} level ${entityType.level} at ${spawnPosition.x}, ${spawnPosition.y}`);
    }

    selectWeightedRandom(entityTypes) {
        const totalWeight = entityTypes.reduce((sum, entity) => sum + entity.weight, 0);
        const random = Math.random() * totalWeight;
        
        let currentWeight = 0;
        for (const entityType of entityTypes) {
            currentWeight += entityType.weight;
            if (random <= currentWeight) {
                return entityType;
            }
        }
        
        return entityTypes[0]; // Fallback
    }

    findValidSpawnPosition(spawner) {
        const maxAttempts = 10;
        
        for (let i = 0; i < maxAttempts; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * spawner.radius;
            
            const position = {
                x: spawner.position.x + Math.cos(angle) * distance,
                y: spawner.position.y + Math.sin(angle) * distance
            };
            
            // Check if position is valid (not occupied, within world bounds, etc.)
            if (this.isValidSpawnPosition(spawner.worldId, position)) {
                return position;
            }
        }
        
        return null;
    }

    isValidSpawnPosition(worldId, position) {
        const world = this.worlds.get(worldId);
        if (!world) return false;
        
        // Check world bounds
        if (position.x < 0 || position.x >= world.config.size.width ||
            position.y < 0 || position.y >= world.config.size.height) {
            return false;
        }
        
        // Check for collisions with other entities
        const minDistance = 20; // Minimum distance from other entities
        
        for (const [entityId, entity] of world.entities) {
            const distance = Math.sqrt(
                Math.pow(position.x - entity.position.x, 2) +
                Math.pow(position.y - entity.position.y, 2)
            );
            
            if (distance < minDistance) {
                return false;
            }
        }
        
        return true;
    }

    updateWorldEvents(deltaTime) {
        for (const [worldId, world] of this.worlds) {
            for (const [eventId, event] of world.events) {
                this.updateWorldEvent(world, event, deltaTime);
            }
        }
    }

    updateWorldEvent(world, event, deltaTime) {
        event.timeElapsed += deltaTime;
        
        if (event.duration > 0 && event.timeElapsed >= event.duration) {
            // Event finished
            this.endWorldEvent(world, event);
        } else {
            // Update event
            this.processEventUpdate(world, event, deltaTime);
        }
    }

    processEventUpdate(world, event, deltaTime) {
        switch (event.type) {
            case 'monster_invasion':
                this.updateMonsterInvasion(world, event, deltaTime);
                break;
            case 'treasure_hunt':
                this.updateTreasureHunt(world, event, deltaTime);
                break;
            case 'weather_change':
                this.updateWeatherChange(world, event, deltaTime);
                break;
        }
    }

    updateMonsterInvasion(world, event, deltaTime) {
        if (event.timeElapsed % 30000 < deltaTime) { // Every 30 seconds
            // Spawn invasion monsters
            const spawnCount = Math.floor(Math.random() * 3) + 1;
            
            for (let i = 0; i < spawnCount; i++) {
                this.spawnInvasionMonster(world, event);
            }
        }
    }

    spawnInvasionMonster(world, event) {
        const position = {
            x: Math.random() * world.config.size.width,
            y: Math.random() * world.config.size.height
        };
        
        const monster = {
            id: `invasion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: event.monsterType || 'orc',
            level: event.level || 15,
            position: position,
            worldId: world.id,
            eventId: event.id,
            ai: true,
            aggressive: true
        };
        
        this.emit('entitySpawned', monster);
    }

    updateTreasureHunt(world, event, deltaTime) {
        if (!event.treasuresSpawned) {
            // Spawn treasures
            const treasureCount = event.treasureCount || 5;
            
            for (let i = 0; i < treasureCount; i++) {
                this.spawnEventTreasure(world, event);
            }
            
            event.treasuresSpawned = true;
        }
    }

    spawnEventTreasure(world, event) {
        const position = {
            x: Math.random() * world.config.size.width,
            y: Math.random() * world.config.size.height
        };
        
        const treasure = {
            id: `treasure_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'treasure_chest',
            position: position,
            worldId: world.id,
            eventId: event.id,
            interactive: true,
            loot: event.treasureLoot || ['gold', 'gems', 'equipment']
        };
        
        world.items.set(treasure.id, treasure);
    }

    updateWeatherChange(world, event, deltaTime) {
        const progress = event.timeElapsed / event.duration;
        
        // Interpolate weather change
        if (event.targetWeather) {
            world.environment.weather = event.targetWeather;
            world.environment.intensity = Math.sin(progress * Math.PI);
        }
    }

    endWorldEvent(world, event) {
        console.log(`World event ${event.id} ended in world ${world.id}`);
        
        // Clean up event-specific entities
        if (event.type === 'monster_invasion') {
            this.cleanupInvasionMonsters(world, event);
        }
        
        // Remove event
        world.events.delete(event.id);
        this.activeEvents.delete(event.id);
        
        // Emit event end
        this.emit('worldEventEnded', world.id, event);
    }

    cleanupInvasionMonsters(world, event) {
        const monstersToRemove = [];
        
        for (const [entityId, entity] of world.entities) {
            if (entity.eventId === event.id) {
                monstersToRemove.push(entityId);
            }
        }
        
        monstersToRemove.forEach(entityId => {
            const entity = world.entities.get(entityId);
            this.emit('entityDespawned', entity);
        });
    }

    updateEnvironmentalEffects(deltaTime) {
        for (const [effectId, effect] of this.environmentalEffects) {
            this.updateEnvironmentalEffect(effect, deltaTime);
        }
    }

    updateEnvironmentalEffect(effect, deltaTime) {
        if (effect.duration > 0) {
            effect.duration -= deltaTime;
            
            if (effect.duration <= 0) {
                this.removeEnvironmentalEffect(effect);
            }
        }
        
        // Update effect-specific logic
        switch (effect.type) {
            case 'weather':
                this.updateWeatherEffect(effect, deltaTime);
                break;
            case 'ambient_sound':
                this.updateAmbientSoundEffect(effect, deltaTime);
                break;
        }
    }

    updateWeatherEffect(effect, deltaTime) {
        // Weather effects are handled by WeatherSystem
    }

    updateAmbientSoundEffect(effect, deltaTime) {
        // Ambient sound effects handled by audio system
    }

    removeEnvironmentalEffect(effect) {
        this.environmentalEffects.delete(effect.id);
        this.emit('environmentalEffectRemoved', effect);
    }

    // Public API methods
    getWorld(worldId) {
        return this.worlds.get(worldId);
    }

    getAllWorlds() {
        return Array.from(this.worlds.values());
    }

    getWorldList() {
        return Array.from(this.worlds.values()).map(world => ({
            id: world.id,
            name: world.config.name,
            type: world.config.type,
            playerCount: world.players.size,
            maxPlayers: world.config.maxPlayers,
            level: world.config.level,
            pvpEnabled: world.config.pvpEnabled
        }));
    }

    getPlayersInWorld(worldId) {
        const world = this.worlds.get(worldId);
        return world ? Array.from(world.players.values()) : [];
    }

    getEntitiesInWorld(worldId) {
        const world = this.worlds.get(worldId);
        return world ? Array.from(world.entities.values()) : [];
    }

    getWorldStatistics(worldId) {
        const world = this.worlds.get(worldId);
        return world ? world.statistics : null;
    }

    getGlobalStatistics() {
        return {
            ...this.statistics,
            performance: this.performanceMetrics,
            totalWorlds: this.worlds.size,
            totalInstances: this.instances.size,
            totalLoadedChunks: this.loadedChunks.size,
            totalActiveSpawners: this.spawners.size
        };
    }

    async startWorldEvent(worldId, eventConfig) {
        const world = this.worlds.get(worldId);
        if (!world) {
            throw new Error(`World ${worldId} not found`);
        }
        
        const event = {
            id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: eventConfig.type,
            worldId: worldId,
            startTime: Date.now(),
            duration: eventConfig.duration || 300000, // 5 minutes default
            timeElapsed: 0,
            ...eventConfig
        };
        
        world.events.set(event.id, event);
        this.activeEvents.set(event.id, event);
        this.statistics.eventsTriggered++;
        
        console.log(`Started world event ${event.type} in world ${worldId}`);
        this.emit('worldEventStarted', worldId, event);
        
        return event;
    }

    async stopWorldEvent(worldId, eventId) {
        const world = this.worlds.get(worldId);
        if (!world) return;
        
        const event = world.events.get(eventId);
        if (event) {
            this.endWorldEvent(world, event);
        }
    }

    destroy() {
        console.log('Destroying WorldManager...');
        
        // Save all world data
        this.saveAllWorldData();
        
        // Clear all intervals
        this.backgroundTasks.forEach(task => {
            if (task.interval) {
                clearInterval(task.interval);
            }
        });
        
        // Clear all data
        this.worlds.clear();
        this.instances.clear();
        this.regions.clear();
        this.activeEvents.clear();
        this.spawners.clear();
        this.portals.clear();
        this.barriers.clear();
        this.treasures.clear();
        this.landmarks.clear();
        this.environmentalEffects.clear();
        this.loadedChunks.clear();
        
        console.log('WorldManager destroyed');
    }
}

// Weather System Class
class WeatherSystem extends EventEmitter {
    constructor(worldManager) {
        super();
        this.worldManager = worldManager;
        this.weatherTypes = ['clear', 'cloudy', 'rain', 'storm', 'snow', 'fog'];
        this.transitionTime = 300000; // 5 minutes
        this.updateInterval = 60000; // 1 minute
        this.updateTimer = null;
    }

    async initialize() {
        console.log('Initializing WeatherSystem...');
        // Initialize weather for all worlds
        for (const [worldId, world] of this.worldManager.worlds) {
            if (world.config.weather) {
                world.environment.weather = this.getRandomWeather();
            }
        }
    }

    async start() {
        this.updateTimer = setInterval(() => {
            this.updateWeather();
        }, this.updateInterval);
        console.log('WeatherSystem started');
    }

    updateWeather() {
        for (const [worldId, world] of this.worldManager.worlds) {
            if (world.config.weather) {
                this.updateWorldWeather(world);
            }
        }
    }

    updateWorldWeather(world) {
        // Random chance to change weather
        if (Math.random() < 0.1) { // 10% chance per update
            const newWeather = this.getRandomWeather();
            if (newWeather !== world.environment.weather) {
                world.environment.weather = newWeather;
                this.worldManager.statistics.weatherChanges++;
                this.emit('weatherChanged', world.id, newWeather);
            }
        }
    }

    getRandomWeather() {
        return this.weatherTypes[Math.floor(Math.random() * this.weatherTypes.length)];
    }

    update(deltaTime) {
        // Weather system updates handled by interval
    }
}

// Day/Night Cycle Class
class DayNightCycle extends EventEmitter {
    constructor(worldManager) {
        super();
        this.worldManager = worldManager;
        this.dayDuration = 1800000; // 30 minutes real time = 24 hours game time
        this.updateInterval = 60000; // 1 minute
        this.updateTimer = null;
    }

    async initialize() {
        console.log('Initializing DayNightCycle...');
        // Set initial time for all worlds
        for (const [worldId, world] of this.worldManager.worlds) {
            if (world.config.dayNight) {
                world.environment.timeOfDay = 720; // Start at noon
            }
        }
    }

    async start() {
        this.updateTimer = setInterval(() => {
            this.updateDayNight();
        }, this.updateInterval);
        console.log('DayNightCycle started');
    }

    updateDayNight() {
        const timeIncrement = 1440 / (this.dayDuration / this.updateInterval); // Minutes per update
        
        for (const [worldId, world] of this.worldManager.worlds) {
            if (world.config.dayNight) {
                world.environment.timeOfDay = (world.environment.timeOfDay + timeIncrement) % 1440;
                this.updateLighting(world);
            }
        }
    }

    updateLighting(world) {
        const timeOfDay = world.environment.timeOfDay;
        let ambientLight = 0.8;
        
        // Calculate lighting based on time of day
        if (timeOfDay >= 360 && timeOfDay <= 1080) { // 6 AM to 6 PM
            ambientLight = 1.0;
        } else if (timeOfDay > 1080 && timeOfDay <= 1200) { // 6 PM to 8 PM
            ambientLight = 1.0 - ((timeOfDay - 1080) / 120) * 0.7;
        } else if (timeOfDay > 240 && timeOfDay < 360) { // 4 AM to 6 AM
            ambientLight = 0.3 + ((timeOfDay - 240) / 120) * 0.7;
        } else { // Night time
            ambientLight = 0.3;
        }
        
        world.environment.lighting.ambient = ambientLight;
    }

    update(deltaTime) {
        // Day/night cycle updates handled by interval
    }
}

// Season System Class
class SeasonSystem extends EventEmitter {
    constructor(worldManager) {
        super();
        this.worldManager = worldManager;
        this.seasons = ['spring', 'summer', 'autumn', 'winter'];
        this.seasonDuration = 7200000; // 2 hours real time = 1 season
        this.updateInterval = 300000; // 5 minutes
        this.updateTimer = null;
        this.seasonStartTime = Date.now();
    }

    async initialize() {
        console.log('Initializing SeasonSystem...');
        // Set initial season for all worlds
        for (const [worldId, world] of this.worldManager.worlds) {
            if (world.config.seasons) {
                world.environment.season = 'spring';
            }
        }
    }

    async start() {
        this.updateTimer = setInterval(() => {
            this.updateSeasons();
        }, this.updateInterval);
        console.log('SeasonSystem started');
    }

    updateSeasons() {
        const elapsed = Date.now() - this.seasonStartTime;
        const seasonIndex = Math.floor(elapsed / this.seasonDuration) % this.seasons.length;
        const currentSeason = this.seasons[seasonIndex];
        
        for (const [worldId, world] of this.worldManager.worlds) {
            if (world.config.seasons && world.environment.season !== currentSeason) {
                world.environment.season = currentSeason;
                this.updateSeasonEffects(world, currentSeason);
                this.worldManager.statistics.seasonChanges++;
                this.emit('seasonChanged', world.id, currentSeason);
            }
        }
    }

    updateSeasonEffects(world, season) {
        switch (season) {
            case 'spring':
                world.environment.temperature = 18;
                world.environment.humidity = 70;
                break;
            case 'summer':
                world.environment.temperature = 28;
                world.environment.humidity = 50;
                break;
            case 'autumn':
                world.environment.temperature = 15;
                world.environment.humidity = 60;
                break;
            case 'winter':
                world.environment.temperature = 2;
                world.environment.humidity = 80;
                break;
        }
    }

    update(deltaTime) {
        // Season system updates handled by interval
    }
}

module.exports = WorldManager;