import { EventEmitter } from 'events';
import { logger, gameLogger, PerformanceLogger } from '../../utils/logger';
import { CacheManager, CacheKeys } from '../../config/redis.config';
import { BaseSystem } from '../systems/BaseSystem';
import { BaseManager } from '../managers/BaseManager';
import type { 
  IZone, 
  ICharacter, 
  IPlayer,
  Vector3,
  WorldState
} from '@epic-mmorpg/shared';

export interface GameWorldConfig {
  tickRate: number;
  maxPlayersPerInstance: number;
  instanceCleanupInterval: number;
}

export class GameWorld extends EventEmitter {
  private static instance: GameWorld;
  
  private config: GameWorldConfig;
  private isRunning: boolean = false;
  private tickInterval?: NodeJS.Timeout;
  private lastTickTime: number = Date.now();
  private tickCount: number = 0;
  
  private systems: Map<string, BaseSystem> = new Map();
  private managers: Map<string, BaseManager> = new Map();
  
  private zones: Map<string, IZone> = new Map();
  private instances: Map<string, Set<string>> = new Map(); // instanceId -> Set<characterId>
  
  constructor(config: GameWorldConfig) {
    super();
    this.config = config;
    logger.info('GameWorld initialized', { config });
  }

  static getInstance(config?: GameWorldConfig): GameWorld {
    if (!GameWorld.instance) {
      if (!config) {
        throw new Error('GameWorld config required for first initialization');
      }
      GameWorld.instance = new GameWorld(config);
    }
    return GameWorld.instance;
  }

  // System Management
  registerSystem(name: string, system: BaseSystem): void {
    if (this.systems.has(name)) {
      throw new Error(`System ${name} already registered`);
    }
    
    this.systems.set(name, system);
    system.setWorld(this);
    logger.info(`System registered: ${name}`);
  }

  registerManager(name: string, manager: BaseManager): void {
    if (this.managers.has(name)) {
      throw new Error(`Manager ${name} already registered`);
    }
    
    this.managers.set(name, manager);
    manager.setWorld(this);
    logger.info(`Manager registered: ${name}`);
  }

  getSystem<T extends BaseSystem>(name: string): T {
    const system = this.systems.get(name);
    if (!system) {
      throw new Error(`System ${name} not found`);
    }
    return system as T;
  }

  getManager<T extends BaseManager>(name: string): T {
    const manager = this.managers.get(name);
    if (!manager) {
      throw new Error(`Manager ${name} not found`);
    }
    return manager as T;
  }

  // Lifecycle
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('GameWorld already running');
      return;
    }

    logger.info('Starting GameWorld...');
    
    // Initialize all systems
    for (const [name, system] of this.systems) {
      await PerformanceLogger.measure(`Initialize ${name}`, async () => {
        await system.initialize();
      });
    }

    // Initialize all managers
    for (const [name, manager] of this.managers) {
      await PerformanceLogger.measure(`Initialize ${name}`, async () => {
        await manager.initialize();
      });
    }

    // Load zones
    await this.loadZones();

    // Start game loop
    this.isRunning = true;
    this.startGameLoop();

    // Start cleanup interval
    this.startCleanupInterval();

    logger.info('GameWorld started successfully');
    this.emit('started');
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      logger.warn('GameWorld not running');
      return;
    }

    logger.info('Stopping GameWorld...');
    this.isRunning = false;

    // Stop game loop
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = undefined;
    }

    // Shutdown all systems
    for (const [name, system] of this.systems) {
      await system.shutdown();
      logger.info(`System shutdown: ${name}`);
    }

    // Shutdown all managers
    for (const [name, manager] of this.managers) {
      await manager.shutdown();
      logger.info(`Manager shutdown: ${name}`);
    }

    logger.info('GameWorld stopped');
    this.emit('stopped');
  }

  // Game Loop
  private startGameLoop(): void {
    const tickInterval = 1000 / this.config.tickRate;
    
    this.tickInterval = setInterval(() => {
      this.tick();
    }, tickInterval);

    logger.info(`Game loop started with tick rate: ${this.config.tickRate} Hz`);
  }

  private async tick(): Promise<void> {
    const now = Date.now();
    const deltaTime = now - this.lastTickTime;
    this.lastTickTime = now;
    this.tickCount++;

    try {
      // Update all systems
      const systemPromises = Array.from(this.systems.values()).map(system => 
        system.update(deltaTime)
      );
      await Promise.all(systemPromises);

      // Update all managers
      const managerPromises = Array.from(this.managers.values()).map(manager => 
        manager.update(deltaTime)
      );
      await Promise.all(managerPromises);

      // Emit tick event
      this.emit('tick', { deltaTime, tickCount: this.tickCount });

      // Performance monitoring every 1000 ticks
      if (this.tickCount % 1000 === 0) {
        this.logPerformanceMetrics();
      }
    } catch (error) {
      gameLogger.error('Error in game tick', error);
    }
  }

  // Zone Management
  private async loadZones(): Promise<void> {
    // TODO: Load zones from database
    logger.info('Loading zones...');
    // This would typically load from database
    // For now, we'll create a starter zone
    const starterZone: IZone = {
      id: 'zone-starter',
      name: 'Starter Village',
      description: 'A peaceful village where adventurers begin their journey',
      type: 'city',
      minLevel: 1,
      maxLevel: 10,
      mapId: 'map-starter',
      bounds: {
        min: { x: 0, y: 0, z: 0 },
        max: { x: 1000, y: 100, z: 1000 }
      },
      climate: 'temperate',
      terrain: 'grassland',
      isPvP: false,
      isSanctuary: true,
      spawnPoints: [],
      graveyards: [],
      environment: {
        weather: 'clear',
        timeOfDay: 'noon',
        ambience: 'peaceful',
        lighting: 1.0,
        fogDensity: 0.1,
        windStrength: 0.3,
        temperature: 20
      },
      content: {
        npcs: [],
        creatures: [],
        objects: [],
        resources: [],
        quests: [],
        events: []
      },
      pointsOfInterest: [],
      travelOptions: {
        flightPaths: [],
        portals: [],
        boats: [],
        trains: []
      },
      phases: [],
      instances: [],
      mapData: {
        minimap: 'minimap-starter',
        worldMap: 'worldmap-starter',
        layers: []
      }
    };
    
    this.zones.set(starterZone.id, starterZone);
    await CacheManager.set(CacheKeys.zone(starterZone.id), starterZone, 3600);
    
    logger.info(`Loaded ${this.zones.size} zones`);
  }

  getZone(zoneId: string): IZone | undefined {
    return this.zones.get(zoneId);
  }

  getAllZones(): IZone[] {
    return Array.from(this.zones.values());
  }

  // Instance Management
  createInstance(zoneId: string): string {
    const instanceId = `${zoneId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.instances.set(instanceId, new Set());
    logger.info(`Created instance: ${instanceId} for zone: ${zoneId}`);
    return instanceId;
  }

  addCharacterToInstance(instanceId: string, characterId: string): boolean {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      logger.warn(`Instance not found: ${instanceId}`);
      return false;
    }

    if (instance.size >= this.config.maxPlayersPerInstance) {
      logger.warn(`Instance full: ${instanceId}`);
      return false;
    }

    instance.add(characterId);
    logger.info(`Added character ${characterId} to instance ${instanceId}`);
    return true;
  }

  removeCharacterFromInstance(instanceId: string, characterId: string): void {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      return;
    }

    instance.delete(characterId);
    logger.info(`Removed character ${characterId} from instance ${instanceId}`);

    // Delete empty instances
    if (instance.size === 0) {
      this.instances.delete(instanceId);
      logger.info(`Deleted empty instance: ${instanceId}`);
    }
  }

  getInstanceCharacters(instanceId: string): string[] {
    const instance = this.instances.get(instanceId);
    return instance ? Array.from(instance) : [];
  }

  // Character Position Management
  async updateCharacterPosition(
    characterId: string, 
    position: Vector3, 
    zoneId: string,
    instanceId?: string
  ): Promise<void> {
    const locationData = {
      position,
      zoneId,
      instanceId,
      timestamp: Date.now()
    };

    await CacheManager.set(
      CacheKeys.characterLocation(characterId), 
      locationData, 
      300 // 5 minutes TTL
    );

    // Update zone character list
    await CacheManager.sadd(CacheKeys.zoneCharacters(zoneId), characterId);

    // Emit position update event
    this.emit('characterPositionUpdate', {
      characterId,
      ...locationData
    });
  }

  async getCharactersInZone(zoneId: string): Promise<string[]> {
    return await CacheManager.smembers(CacheKeys.zoneCharacters(zoneId));
  }

  async removeCharacterFromZone(characterId: string, zoneId: string): Promise<void> {
    await CacheManager.srem(CacheKeys.zoneCharacters(zoneId), characterId);
  }

  // World State
  async getWorldState(): Promise<WorldState> {
    const onlinePlayers = await CacheManager.smembers(CacheKeys.onlinePlayers());
    const onlineCharacters = await CacheManager.smembers(CacheKeys.onlineCharacters());

    return {
      timestamp: Date.now(),
      serverTime: new Date().toISOString(),
      onlinePlayerCount: onlinePlayers.length,
      onlineCharacterCount: onlineCharacters.length,
      activeInstances: this.instances.size,
      tickRate: this.config.tickRate,
      uptime: process.uptime(),
      zones: this.zones.size,
      events: [], // TODO: Get active events
      notices: [] // TODO: Get server notices
    };
  }

  // Cleanup
  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanupEmptyInstances();
      this.cleanupOfflineCharacters();
    }, this.config.instanceCleanupInterval);
  }

  private cleanupEmptyInstances(): void {
    for (const [instanceId, characters] of this.instances) {
      if (characters.size === 0) {
        this.instances.delete(instanceId);
        logger.info(`Cleaned up empty instance: ${instanceId}`);
      }
    }
  }

  private async cleanupOfflineCharacters(): Promise<void> {
    // TODO: Implement offline character cleanup
  }

  // Performance Metrics
  private logPerformanceMetrics(): void {
    const metrics = {
      tickCount: this.tickCount,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      instances: this.instances.size,
      zones: this.zones.size,
      systems: this.systems.size,
      managers: this.managers.size
    };

    gameLogger.performance('Game world metrics', metrics);
  }

  // Event Broadcasting
  broadcastToZone(zoneId: string, event: string, data: any): void {
    this.emit('zoneBroadcast', { zoneId, event, data });
  }

  broadcastToInstance(instanceId: string, event: string, data: any): void {
    this.emit('instanceBroadcast', { instanceId, event, data });
  }

  broadcastGlobal(event: string, data: any): void {
    this.emit('globalBroadcast', { event, data });
  }
}