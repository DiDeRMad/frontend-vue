import { EventEmitter } from 'events';
import { io, Socket } from 'socket.io-client';
import { logger } from '../utils/logger';
import { NetworkOptimizer } from './network/NetworkOptimizer';
import { PredictionEngine } from './prediction/PredictionEngine';
import { InterpolationEngine } from './interpolation/InterpolationEngine';
import { ReplaySystem } from './replay/ReplaySystem';
import { SecurityValidator } from './security/SecurityValidator';

export interface GameClientOptions {
  token?: string;
  enableReconnection?: boolean;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
  enablePrediction?: boolean;
  enableInterpolation?: boolean;
  enableCompression?: boolean;
  enableEncryption?: boolean;
  debug?: boolean;
}

export interface Player {
  id: string;
  name: string;
  level: number;
  experience: number;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  stamina: number;
  maxStamina: number;
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number };
  stats: {
    strength: number;
    agility: number;
    intelligence: number;
    vitality: number;
    luck: number;
  };
  skills: {
    [skillName: string]: number;
  };
  inventory: Array<{
    id: string;
    itemId: string;
    quantity: number;
    slot: number;
  }>;
  equipment: {
    [slot: string]: string | null;
  };
  quests: {
    active: Array<any>;
    completed: Array<any>;
    failed: Array<any>;
  };
  achievements: Array<any>;
  guild?: {
    id: string;
    name: string;
    rank: string;
  };
  friends: Array<string>;
  settings: {
    [key: string]: any;
  };
}

export interface GameState {
  world: {
    id: string;
    name: string;
    time: number;
    weather: string;
    season: string;
  };
  players: Map<string, Player>;
  entities: Map<string, any>;
  items: Map<string, any>;
  buildings: Map<string, any>;
  effects: Map<string, any>;
  chat: {
    channels: Map<string, any>;
    messages: Array<any>;
  };
  combat: {
    activeBattles: Map<string, any>;
    cooldowns: Map<string, number>;
  };
  market: {
    orders: Array<any>;
    history: Array<any>;
  };
  events: {
    world: Array<any>;
    seasonal: Array<any>;
    tournaments: Array<any>;
  };
}

export class GameClient extends EventEmitter {
  private socket: Socket | null = null;
  private options: GameClientOptions;
  private serverUrl: string;
  
  // Game state
  private gameState: GameState;
  private player: Player | null = null;
  private isConnected = false;
  private isAuthenticated = false;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  
  // Network systems
  private networkOptimizer: NetworkOptimizer;
  private predictionEngine: PredictionEngine;
  private interpolationEngine: InterpolationEngine;
  private replaySystem: ReplaySystem;
  private securityValidator: SecurityValidator;
  
  // Performance metrics
  private metrics = {
    ping: 0,
    packetLoss: 0,
    bandwidth: 0,
    fps: 0,
    lastUpdate: 0,
    messageCount: 0,
    errorCount: 0,
  };
  
  // Input handling
  private inputBuffer: Array<any> = [];
  private lastInputSent = 0;
  private inputSequence = 0;
  
  // Time synchronization
  private serverTimeOffset = 0;
  private lastPingTime = 0;
  private pingHistory: Array<number> = [];
  
  // Cache and storage
  private dataCache = new Map<string, any>();
  private pendingRequests = new Map<string, any>();
  
  constructor(serverUrl: string, options: GameClientOptions = {}) {
    super();
    this.serverUrl = serverUrl;
    this.options = {
      enableReconnection: true,
      maxReconnectAttempts: 5,
      reconnectDelay: 1000,
      enablePrediction: true,
      enableInterpolation: true,
      enableCompression: true,
      enableEncryption: false,
      debug: false,
      ...options,
    };
    
    // Initialize game state
    this.gameState = {
      world: {
        id: '',
        name: '',
        time: 0,
        weather: 'clear',
        season: 'spring',
      },
      players: new Map(),
      entities: new Map(),
      items: new Map(),
      buildings: new Map(),
      effects: new Map(),
      chat: {
        channels: new Map(),
        messages: [],
      },
      combat: {
        activeBattles: new Map(),
        cooldowns: new Map(),
      },
      market: {
        orders: [],
        history: [],
      },
      events: {
        world: [],
        seasonal: [],
        tournaments: [],
      },
    };
    
    // Initialize systems
    this.networkOptimizer = new NetworkOptimizer();
    this.predictionEngine = new PredictionEngine();
    this.interpolationEngine = new InterpolationEngine();
    this.replaySystem = new ReplaySystem();
    this.securityValidator = new SecurityValidator();
  }

  async initialize(): Promise<void> {
    logger.info('Initializing Game Client...');
    
    try {
      // Initialize subsystems
      await this.networkOptimizer.initialize();
      await this.predictionEngine.initialize();
      await this.interpolationEngine.initialize();
      await this.replaySystem.initialize();
      await this.securityValidator.initialize();
      
      // Set up periodic tasks
      this.startPeriodicTasks();
      
      logger.info('Game Client initialized successfully');
      
    } catch (error) {
      logger.error('Failed to initialize Game Client:', error);
      throw error;
    }
  }

  async connect(): Promise<void> {
    if (this.isConnected) {
      logger.warn('Already connected to server');
      return;
    }
    
    logger.info(`Connecting to game server: ${this.serverUrl}`);
    
    try {
      // Create socket connection
      this.socket = io(this.serverUrl, {
        auth: {
          token: this.options.token,
        },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true,
      });
      
      // Set up event handlers
      this.setupSocketEventHandlers();
      
      // Wait for connection
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 10000);
        
        this.socket!.on('connect', () => {
          clearTimeout(timeout);
          resolve();
        });
        
        this.socket!.on('connect_error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
      
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Start ping monitoring
      this.startPingMonitoring();
      
      logger.info('Connected to game server successfully');
      this.emit('connected');
      
    } catch (error) {
      logger.error('Failed to connect to game server:', error);
      this.emit('error', error);
      
      if (this.options.enableReconnection) {
        this.scheduleReconnect();
      }
      
      throw error;
    }
  }

  disconnect(): void {
    if (!this.isConnected) {
      return;
    }
    
    logger.info('Disconnecting from game server...');
    
    // Clear reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // Disconnect socket
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.isConnected = false;
    this.isAuthenticated = false;
    this.player = null;
    
    // Clear game state
    this.resetGameState();
    
    logger.info('Disconnected from game server');
    this.emit('disconnected', 'manual');
  }

  private setupSocketEventHandlers(): void {
    if (!this.socket) return;
    
    // Connection events
    this.socket.on('connect', () => {
      logger.info('Socket connected');
      this.isConnected = true;
      this.emit('connected');
    });
    
    this.socket.on('disconnect', (reason: string) => {
      logger.warn(`Socket disconnected: ${reason}`);
      this.isConnected = false;
      this.isAuthenticated = false;
      this.emit('disconnected', reason);
      
      if (this.options.enableReconnection && reason !== 'io client disconnect') {
        this.scheduleReconnect();
      }
    });
    
    this.socket.on('connect_error', (error: Error) => {
      logger.error('Socket connection error:', error);
      this.emit('error', error);
    });
    
    // Authentication events
    this.socket.on('auth:success', (data: any) => {
      logger.info('Authentication successful');
      this.isAuthenticated = true;
      this.emit('authenticated', data);
    });
    
    this.socket.on('auth:failed', (data: any) => {
      logger.error('Authentication failed:', data.message);
      this.emit('authenticationFailed', data);
    });
    
    // Player events
    this.socket.on('player:joined', (playerData: Player) => {
      logger.info(`Player joined: ${playerData.name}`);
      this.player = playerData;
      this.gameState.players.set(playerData.id, playerData);
      this.emit('playerJoined', playerData);
    });
    
    this.socket.on('player:update', (updates: Partial<Player>) => {
      if (this.player && updates.id === this.player.id) {
        Object.assign(this.player, updates);
        this.emit('playerUpdate', updates);
      }
      
      // Update other players
      const otherPlayer = this.gameState.players.get(updates.id!);
      if (otherPlayer) {
        Object.assign(otherPlayer, updates);
        this.emit('otherPlayerUpdate', updates);
      }
    });
    
    this.socket.on('player:moved', (data: any) => {
      const player = this.gameState.players.get(data.id);
      if (player) {
        // Apply interpolation for smooth movement
        this.interpolationEngine.addMovement(data.id, data.position, data.velocity);
        this.emit('playerMoved', data);
      }
    });
    
    this.socket.on('player:entered', (playerData: Player) => {
      this.gameState.players.set(playerData.id, playerData);
      this.emit('playerEntered', playerData);
    });
    
    this.socket.on('player:left', (data: { id: string; name: string }) => {
      this.gameState.players.delete(data.id);
      this.emit('playerLeft', data);
    });
    
    // Game world events
    this.socket.on('game:update', (data: any) => {
      this.handleGameUpdate(data);
    });
    
    this.socket.on('world:changed', (worldData: any) => {
      this.gameState.world = worldData;
      this.emit('worldChanged', worldData);
    });
    
    this.socket.on('entities:loaded', (data: any) => {
      data.entities.forEach((entity: any) => {
        this.gameState.entities.set(entity.id, entity);
      });
      this.emit('entitiesLoaded', data);
    });
    
    // Combat events
    this.socket.on('combat:started', (data: any) => {
      this.gameState.combat.activeBattles.set(data.battleId, data);
      this.emit('combatStart', data);
    });
    
    this.socket.on('combat:ended', (data: any) => {
      this.gameState.combat.activeBattles.delete(data.battleId);
      this.emit('combatEnd', data);
    });
    
    this.socket.on('combat:damage', (data: any) => {
      this.emit('combatDamage', data);
    });
    
    // Chat events
    this.socket.on('chat:message', (message: any) => {
      this.gameState.chat.messages.push(message);
      // Keep only last 1000 messages
      if (this.gameState.chat.messages.length > 1000) {
        this.gameState.chat.messages.shift();
      }
      this.emit('chatMessage', message);
    });
    
    // Social events
    this.socket.on('friend:request', (data: any) => {
      this.emit('friendRequest', data);
    });
    
    this.socket.on('guild:invite', (data: any) => {
      this.emit('guildInvite', data);
    });
    
    this.socket.on('trade:request', (data: any) => {
      this.emit('tradeRequest', data);
    });
    
    // Achievement events
    this.socket.on('achievement:unlocked', (achievement: any) => {
      if (this.player) {
        this.player.achievements.push(achievement);
      }
      this.emit('achievementUnlocked', achievement);
    });
    
    // Level up events
    this.socket.on('player:levelup', (data: any) => {
      if (this.player && data.playerId === this.player.id) {
        this.player.level = data.newLevel;
        this.emit('playerLevelUp', data.newLevel);
      }
    });
    
    // Error handling
    this.socket.on('error', (error: any) => {
      logger.error('Socket error:', error);
      this.metrics.errorCount++;
      this.emit('error', error);
    });
    
    // Network diagnostics
    this.socket.on('ping', () => {
      this.socket!.emit('pong');
    });
    
    this.socket.on('pong', (timestamp: number) => {
      const ping = Date.now() - timestamp;
      this.updatePingMetrics(ping);
    });
  }

  private handleGameUpdate(data: any): void {
    // Update players
    if (data.players) {
      data.players.forEach((playerUpdate: any) => {
        const player = this.gameState.players.get(playerUpdate.id);
        if (player) {
          Object.assign(player, playerUpdate);
        }
      });
    }
    
    // Update entities
    if (data.entities) {
      data.entities.forEach((entityUpdate: any) => {
        const entity = this.gameState.entities.get(entityUpdate.id);
        if (entity) {
          Object.assign(entity, entityUpdate);
        }
      });
    }
    
    // Update world state
    if (data.world) {
      Object.assign(this.gameState.world, data.world);
    }
    
    // Update server time
    if (data.timestamp) {
      this.updateServerTimeOffset(data.timestamp);
    }
    
    this.emit('gameUpdate', data);
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts!) {
      logger.error('Max reconnect attempts reached');
      this.emit('maxReconnectAttemptsReached');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = this.options.reconnectDelay! * Math.pow(2, this.reconnectAttempts - 1);
    
    logger.info(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect().catch((error) => {
        logger.error('Reconnect attempt failed:', error);
      });
    }, delay);
  }

  private startPingMonitoring(): void {
    setInterval(() => {
      if (this.isConnected && this.socket) {
        const timestamp = Date.now();
        this.lastPingTime = timestamp;
        this.socket.emit('ping', timestamp);
      }
    }, 5000); // Ping every 5 seconds
  }

  private updatePingMetrics(ping: number): void {
    this.metrics.ping = ping;
    this.pingHistory.push(ping);
    
    // Keep only last 20 ping values
    if (this.pingHistory.length > 20) {
      this.pingHistory.shift();
    }
    
    // Calculate average ping
    const avgPing = this.pingHistory.reduce((sum, p) => sum + p, 0) / this.pingHistory.length;
    this.metrics.ping = Math.round(avgPing);
  }

  private updateServerTimeOffset(serverTimestamp: number): void {
    const clientTime = Date.now();
    const networkDelay = this.metrics.ping / 2;
    this.serverTimeOffset = serverTimestamp - clientTime + networkDelay;
  }

  private startPeriodicTasks(): void {
    // Update metrics every second
    setInterval(() => {
      this.updateMetrics();
    }, 1000);
    
    // Process input buffer
    setInterval(() => {
      this.processInputBuffer();
    }, 16); // ~60 FPS
    
    // Clean up old data
    setInterval(() => {
      this.cleanupOldData();
    }, 60000); // Every minute
  }

  private updateMetrics(): void {
    this.metrics.lastUpdate = Date.now();
    this.emit('metricsUpdate', this.metrics);
  }

  private processInputBuffer(): void {
    if (this.inputBuffer.length === 0 || !this.isConnected) {
      return;
    }
    
    const now = Date.now();
    if (now - this.lastInputSent < 16) { // Throttle to ~60 FPS
      return;
    }
    
    const input = this.inputBuffer.shift();
    if (input) {
      input.sequence = ++this.inputSequence;
      input.timestamp = now;
      
      this.socket!.emit('input', input);
      this.lastInputSent = now;
      
      // Store for prediction
      if (this.options.enablePrediction) {
        this.predictionEngine.addInput(input);
      }
    }
  }

  private cleanupOldData(): void {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    // Clean up old chat messages
    this.gameState.chat.messages = this.gameState.chat.messages.filter(
      msg => msg.timestamp > oneHourAgo
    );
    
    // Clean up cache
    for (const [key, data] of this.dataCache) {
      if (data.timestamp < oneHourAgo) {
        this.dataCache.delete(key);
      }
    }
  }

  private resetGameState(): void {
    this.gameState.players.clear();
    this.gameState.entities.clear();
    this.gameState.items.clear();
    this.gameState.buildings.clear();
    this.gameState.effects.clear();
    this.gameState.chat.messages = [];
    this.gameState.combat.activeBattles.clear();
    this.gameState.combat.cooldowns.clear();
  }

  // Public API methods
  public sendInput(input: any): void {
    if (!this.isConnected) {
      logger.warn('Cannot send input: not connected');
      return;
    }
    
    this.inputBuffer.push(input);
  }

  public sendMouseInput(mouseData: any): void {
    this.sendInput({
      type: 'mouse',
      data: mouseData,
    });
  }

  public movePlayer(position: { x: number; y: number }, velocity: { x: number; y: number }): void {
    this.sendInput({
      type: 'move',
      position,
      velocity,
      timestamp: Date.now(),
    });
    
    // Client-side prediction
    if (this.options.enablePrediction && this.player) {
      this.predictionEngine.predictMovement(this.player.id, position, velocity);
    }
  }

  public sendChatMessage(channel: string, message: string): void {
    if (!this.isConnected) return;
    
    this.socket!.emit('chat:send', {
      channel,
      message,
      timestamp: Date.now(),
    });
  }

  public attackTarget(targetId: string): void {
    this.sendInput({
      type: 'attack',
      targetId,
      timestamp: Date.now(),
    });
  }

  public castSpell(spellId: string, targetId?: string, position?: { x: number; y: number }): void {
    this.sendInput({
      type: 'cast_spell',
      spellId,
      targetId,
      position,
      timestamp: Date.now(),
    });
  }

  public useItem(itemId: string, targetId?: string): void {
    this.sendInput({
      type: 'use_item',
      itemId,
      targetId,
      timestamp: Date.now(),
    });
  }

  public interactWithEntity(entityId: string): void {
    this.sendInput({
      type: 'interact',
      entityId,
      timestamp: Date.now(),
    });
  }

  public acceptFriendRequest(requestId: string): void {
    if (!this.isConnected) return;
    
    this.socket!.emit('friend:accept', { requestId });
  }

  public declineFriendRequest(requestId: string): void {
    if (!this.isConnected) return;
    
    this.socket!.emit('friend:decline', { requestId });
  }

  public acceptGuildInvite(inviteId: string): void {
    if (!this.isConnected) return;
    
    this.socket!.emit('guild:accept', { inviteId });
  }

  public declineGuildInvite(inviteId: string): void {
    if (!this.isConnected) return;
    
    this.socket!.emit('guild:decline', { inviteId });
  }

  public acceptTrade(tradeId: string): void {
    if (!this.isConnected) return;
    
    this.socket!.emit('trade:accept', { tradeId });
  }

  public declineTrade(tradeId: string): void {
    if (!this.isConnected) return;
    
    this.socket!.emit('trade:decline', { tradeId });
  }

  // Getters
  public get isConnectedToServer(): boolean {
    return this.isConnected;
  }

  public get isPlayerAuthenticated(): boolean {
    return this.isAuthenticated;
  }

  public get currentPlayer(): Player | null {
    return this.player;
  }

  public get currentGameState(): GameState {
    return this.gameState;
  }

  public get networkMetrics(): typeof this.metrics {
    return { ...this.metrics };
  }

  public getServerTime(): number {
    return Date.now() + this.serverTimeOffset;
  }

  public getPlayer(playerId: string): Player | undefined {
    return this.gameState.players.get(playerId);
  }

  public getEntity(entityId: string): any {
    return this.gameState.entities.get(entityId);
  }

  public getNearbyPlayers(position: { x: number; y: number }, radius: number): Player[] {
    const nearbyPlayers: Player[] = [];
    
    for (const player of this.gameState.players.values()) {
      const distance = Math.sqrt(
        Math.pow(player.position.x - position.x, 2) + 
        Math.pow(player.position.y - position.y, 2)
      );
      
      if (distance <= radius) {
        nearbyPlayers.push(player);
      }
    }
    
    return nearbyPlayers;
  }

  public getNearbyEntities(position: { x: number; y: number }, radius: number): any[] {
    const nearbyEntities: any[] = [];
    
    for (const entity of this.gameState.entities.values()) {
      if (!entity.position) continue;
      
      const distance = Math.sqrt(
        Math.pow(entity.position.x - position.x, 2) + 
        Math.pow(entity.position.y - position.y, 2)
      );
      
      if (distance <= radius) {
        nearbyEntities.push(entity);
      }
    }
    
    return nearbyEntities;
  }
}