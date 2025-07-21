import { EventEmitter } from 'events';
import { 
  Player, 
  Position, 
  Zone, 
  NPC, 
  GameObject,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  CHUNK_SIZE,
  VIEW_DISTANCE,
  SERVER_TICK_RATE,
  PlayerEvent
} from '@mmorpg/shared';
import { logger } from '../../utils/logger';
import { getDatabase } from '../../database';
import { Cache } from '../../redis';
import { ZoneManager } from './ZoneManager';
import { PlayerManager } from './PlayerManager';
import { NPCManager } from './NPCManager';
import { GameObjectManager } from './GameObjectManager';
import { calculateDistance } from '@mmorpg/shared';

export class WorldManager extends EventEmitter {
  private tickInterval?: NodeJS.Timeout;
  private saveInterval?: NodeJS.Timeout;
  private isRunning = false;
  
  private zoneManager: ZoneManager;
  private playerManager: PlayerManager;
  private npcManager: NPCManager;
  private objectManager: GameObjectManager;
  
  // Spatial indexing for efficient queries
  private spatialGrid: Map<string, Set<string>> = new Map();
  private entityPositions: Map<string, Position> = new Map();
  
  constructor() {
    super();
    
    this.zoneManager = new ZoneManager(this);
    this.playerManager = new PlayerManager(this);
    this.npcManager = new NPCManager(this);
    this.objectManager = new GameObjectManager(this);
    
    this.setupEventListeners();
  }
  
  private setupEventListeners(): void {
    // Player events
    this.playerManager.on('playerMove', this.handlePlayerMove.bind(this));
    this.playerManager.on('playerJoin', this.handlePlayerJoin.bind(this));
    this.playerManager.on('playerLeave', this.handlePlayerLeave.bind(this));
    
    // NPC events
    this.npcManager.on('npcMove', this.handleNPCMove.bind(this));
    this.npcManager.on('npcSpawn', this.handleNPCSpawn.bind(this));
    this.npcManager.on('npcDespawn', this.handleNPCDespawn.bind(this));
    
    // Zone events
    this.zoneManager.on('playerEnterZone', this.handlePlayerEnterZone.bind(this));
    this.zoneManager.on('playerLeaveZone', this.handlePlayerLeaveZone.bind(this));
  }
  
  // Initialize world data
  async loadZones(): Promise<void> {
    await this.zoneManager.loadZones();
  }
  
  async loadNPCs(): Promise<void> {
    await this.npcManager.loadNPCs();
  }
  
  // Game loop
  startGameLoop(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    const tickRate = 1000 / SERVER_TICK_RATE;
    
    this.tickInterval = setInterval(() => {
      this.tick();
    }, tickRate);
    
    // Save world state periodically
    this.saveInterval = setInterval(() => {
      this.saveWorldState().catch(err => {
        logger.error('Failed to save world state:', err);
      });
    }, 300000); // Every 5 minutes
    
    logger.info('World game loop started');
  }
  
  stopGameLoop(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = undefined;
    }
    
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
      this.saveInterval = undefined;
    }
    
    logger.info('World game loop stopped');
  }
  
  private tick(): void {
    const startTime = Date.now();
    
    try {
      // Update all systems
      this.playerManager.tick();
      this.npcManager.tick();
      this.objectManager.tick();
      this.zoneManager.tick();
      
      // Emit tick event for other systems
      this.emit('tick');
      
    } catch (error) {
      logger.error('Error in world tick:', error);
    }
    
    const tickTime = Date.now() - startTime;
    if (tickTime > 50) {
      logger.warn(`Slow world tick: ${tickTime}ms`);
    }
  }
  
  // Player management
  async addPlayer(player: Player, position: Position): Promise<void> {
    await this.playerManager.addPlayer(player);
    this.updateEntityPosition(player.id, position, 'player');
    
    // Load nearby entities for the player
    const nearbyEntities = this.getEntitiesInRange(position, VIEW_DISTANCE);
    this.emit('playerViewUpdate', player.id, nearbyEntities);
  }
  
  async removePlayer(playerId: string): Promise<void> {
    const player = this.playerManager.getPlayer(playerId);
    if (player) {
      this.removeEntityFromGrid(playerId);
      await this.playerManager.removePlayer(playerId);
    }
  }
  
  getPlayer(playerId: string): Player | undefined {
    return this.playerManager.getPlayer(playerId);
  }
  
  getOnlinePlayers(): Player[] {
    return this.playerManager.getOnlinePlayers();
  }
  
  // NPC management
  getNPC(npcId: string): NPC | undefined {
    return this.npcManager.getNPC(npcId);
  }
  
  getNPCsInZone(zoneId: string): NPC[] {
    return this.npcManager.getNPCsInZone(zoneId);
  }
  
  // Object management
  getGameObject(objectId: string): GameObject | undefined {
    return this.objectManager.getGameObject(objectId);
  }
  
  getObjectsInZone(zoneId: string): GameObject[] {
    return this.objectManager.getObjectsInZone(zoneId);
  }
  
  // Zone management
  getZone(zoneId: string): Zone | undefined {
    return this.zoneManager.getZone(zoneId);
  }
  
  getZoneAt(position: Position): Zone | undefined {
    return this.zoneManager.getZoneAt(position);
  }
  
  // Spatial indexing
  private getGridKey(position: Position): string {
    const x = Math.floor(position.x / CHUNK_SIZE);
    const y = Math.floor(position.y / CHUNK_SIZE);
    return `${x},${y}`;
  }
  
  private updateEntityPosition(
    entityId: string, 
    position: Position, 
    entityType: 'player' | 'npc' | 'object'
  ): void {
    // Remove from old grid cell
    this.removeEntityFromGrid(entityId);
    
    // Add to new grid cell
    const gridKey = this.getGridKey(position);
    if (!this.spatialGrid.has(gridKey)) {
      this.spatialGrid.set(gridKey, new Set());
    }
    this.spatialGrid.get(gridKey)!.add(`${entityType}:${entityId}`);
    this.entityPositions.set(entityId, position);
  }
  
  private removeEntityFromGrid(entityId: string): void {
    const oldPosition = this.entityPositions.get(entityId);
    if (oldPosition) {
      const oldGridKey = this.getGridKey(oldPosition);
      const cell = this.spatialGrid.get(oldGridKey);
      if (cell) {
        // Remove all entries for this entity
        cell.forEach(entry => {
          if (entry.endsWith(`:${entityId}`)) {
            cell.delete(entry);
          }
        });
        if (cell.size === 0) {
          this.spatialGrid.delete(oldGridKey);
        }
      }
      this.entityPositions.delete(entityId);
    }
  }
  
  getEntitiesInRange(
    center: Position, 
    range: number
  ): { players: Player[], npcs: NPC[], objects: GameObject[] } {
    const result = {
      players: [] as Player[],
      npcs: [] as NPC[],
      objects: [] as GameObject[]
    };
    
    // Calculate grid cells to check
    const minX = Math.floor((center.x - range) / CHUNK_SIZE);
    const maxX = Math.floor((center.x + range) / CHUNK_SIZE);
    const minY = Math.floor((center.y - range) / CHUNK_SIZE);
    const maxY = Math.floor((center.y + range) / CHUNK_SIZE);
    
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        const gridKey = `${x},${y}`;
        const cell = this.spatialGrid.get(gridKey);
        
        if (cell) {
          cell.forEach(entry => {
            const [type, id] = entry.split(':');
            const position = this.entityPositions.get(id);
            
            if (position && calculateDistance(center, position) <= range) {
              switch (type) {
                case 'player':
                  const player = this.getPlayer(id);
                  if (player) result.players.push(player);
                  break;
                case 'npc':
                  const npc = this.getNPC(id);
                  if (npc) result.npcs.push(npc);
                  break;
                case 'object':
                  const obj = this.getGameObject(id);
                  if (obj) result.objects.push(obj);
                  break;
              }
            }
          });
        }
      }
    }
    
    return result;
  }
  
  // Event handlers
  private handlePlayerMove(playerId: string, oldPosition: Position, newPosition: Position): void {
    this.updateEntityPosition(playerId, newPosition, 'player');
    
    // Check for zone changes
    const oldZone = this.getZoneAt(oldPosition);
    const newZone = this.getZoneAt(newPosition);
    
    if (oldZone?.id !== newZone?.id) {
      this.zoneManager.handlePlayerZoneChange(playerId, oldZone, newZone);
    }
    
    // Update visibility for nearby players
    const nearbyPlayers = this.getEntitiesInRange(newPosition, VIEW_DISTANCE * 2).players;
    nearbyPlayers.forEach(otherPlayer => {
      if (otherPlayer.id !== playerId) {
        this.emit('entityMove', otherPlayer.id, 'player', playerId, newPosition);
      }
    });
  }
  
  private handleNPCMove(npcId: string, oldPosition: Position, newPosition: Position): void {
    this.updateEntityPosition(npcId, newPosition, 'npc');
    
    // Update visibility for nearby players
    const nearbyPlayers = this.getEntitiesInRange(newPosition, VIEW_DISTANCE).players;
    nearbyPlayers.forEach(player => {
      this.emit('entityMove', player.id, 'npc', npcId, newPosition);
    });
  }
  
  private handlePlayerJoin(playerId: string): void {
    const player = this.getPlayer(playerId);
    if (!player) return;
    
    // Notify nearby players
    const nearbyPlayers = this.getEntitiesInRange(player.position, VIEW_DISTANCE).players;
    nearbyPlayers.forEach(otherPlayer => {
      if (otherPlayer.id !== playerId) {
        this.emit('playerVisible', otherPlayer.id, player);
      }
    });
    
    // Update leaderboards
    this.emit('leaderboardUpdate', 'online_players', this.getOnlinePlayers().length);
  }
  
  private handlePlayerLeave(playerId: string): void {
    const position = this.entityPositions.get(playerId);
    if (!position) return;
    
    // Notify nearby players
    const nearbyPlayers = this.getEntitiesInRange(position, VIEW_DISTANCE).players;
    nearbyPlayers.forEach(player => {
      this.emit('playerInvisible', player.id, playerId);
    });
    
    // Update leaderboards
    this.emit('leaderboardUpdate', 'online_players', this.getOnlinePlayers().length);
  }
  
  private handleNPCSpawn(npcId: string): void {
    const npc = this.getNPC(npcId);
    if (!npc) return;
    
    const position = this.entityPositions.get(npcId);
    if (!position) return;
    
    // Notify nearby players
    const nearbyPlayers = this.getEntitiesInRange(position, VIEW_DISTANCE).players;
    nearbyPlayers.forEach(player => {
      this.emit('npcVisible', player.id, npc);
    });
  }
  
  private handleNPCDespawn(npcId: string): void {
    const position = this.entityPositions.get(npcId);
    if (!position) return;
    
    // Notify nearby players
    const nearbyPlayers = this.getEntitiesInRange(position, VIEW_DISTANCE).players;
    nearbyPlayers.forEach(player => {
      this.emit('npcInvisible', player.id, npcId);
    });
  }
  
  private handlePlayerEnterZone(playerId: string, zone: Zone): void {
    this.emit('playerEnterZone', playerId, zone);
    
    const player = this.getPlayer(playerId);
    if (player) {
      // Log zone entry
      logger.info(`Player ${player.name} entered zone ${zone.name}`);
      
      // Check for zone-specific events
      if (zone.pvpEnabled && !player.pvpStats) {
        this.emit('playerPvPFlagChange', playerId, true);
      }
    }
  }
  
  private handlePlayerLeaveZone(playerId: string, zone: Zone): void {
    this.emit('playerLeaveZone', playerId, zone);
    
    const player = this.getPlayer(playerId);
    if (player) {
      // Log zone exit
      logger.info(`Player ${player.name} left zone ${zone.name}`);
    }
  }
  
  // World state persistence
  async saveWorldState(): Promise<void> {
    logger.info('Saving world state...');
    
    try {
      // Save player states
      await this.playerManager.saveAllPlayers();
      
      // Save NPC states
      await this.npcManager.saveNPCStates();
      
      // Save object states
      await this.objectManager.saveObjectStates();
      
      // Save zone states
      await this.zoneManager.saveZoneStates();
      
      // Cache current world statistics
      await Cache.set('world:stats', {
        onlinePlayers: this.getOnlinePlayers().length,
        activeZones: this.zoneManager.getActiveZones().length,
        totalNPCs: this.npcManager.getTotalNPCs(),
        lastSave: new Date().toISOString()
      }, 3600); // 1 hour TTL
      
      logger.info('World state saved successfully');
    } catch (error) {
      logger.error('Failed to save world state:', error);
      throw error;
    }
  }
  
  // Utility methods
  async broadcastToZone(zoneId: string, event: string, ...args: any[]): Promise<void> {
    const players = this.playerManager.getPlayersInZone(zoneId);
    players.forEach(player => {
      this.emit(`player:${player.id}:${event}`, ...args);
    });
  }
  
  async broadcastToRange(
    position: Position, 
    range: number, 
    event: string, 
    ...args: any[]
  ): Promise<void> {
    const nearbyPlayers = this.getEntitiesInRange(position, range).players;
    nearbyPlayers.forEach(player => {
      this.emit(`player:${player.id}:${event}`, ...args);
    });
  }
  
  async broadcastGlobal(event: string, ...args: any[]): Promise<void> {
    const allPlayers = this.getOnlinePlayers();
    allPlayers.forEach(player => {
      this.emit(`player:${player.id}:${event}`, ...args);
    });
  }
}