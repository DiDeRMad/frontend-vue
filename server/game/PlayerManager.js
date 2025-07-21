import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Player } from '../models/Player.js';
import { PlayerSession } from '../models/PlayerSession.js';
import { EventEmitter } from 'events';

export class PlayerManager extends EventEmitter {
  constructor(io, gameEngine) {
    super();
    this.io = io;
    this.gameEngine = gameEngine;
    
    // Active players in memory
    this.activePlayers = new Map();
    this.playerSessions = new Map();
    this.playerSocketMap = new Map();
    this.socketPlayerMap = new Map();
    
    // Player states
    this.playerStates = new Map();
    this.playerPositions = new Map();
    this.playerInventories = new Map();
    this.playerStats = new Map();
    
    // Social connections
    this.friendLists = new Map();
    this.blockedPlayers = new Map();
    this.playerGroups = new Map();
    this.playerGuilds = new Map();
    
    // Authentication tokens
    this.authTokens = new Map();
    this.sessionTokens = new Map();
    
    // Player actions and cooldowns
    this.actionCooldowns = new Map();
    this.skillCooldowns = new Map();
    this.movementHistory = new Map();
    
    // Anti-cheat system
    this.suspiciousActivities = new Map();
    this.speedLimits = new Map();
    this.lastActionTimes = new Map();
    
    // Player data caching
    this.playerDataCache = new Map();
    this.cacheExpiry = new Map();
    
    // Statistics tracking
    this.playerMetrics = {
      totalConnections: 0,
      currentOnline: 0,
      maxConcurrent: 0,
      averageSessionTime: 0,
      totalDisconnections: 0
    };
    
    // Default player configuration
    this.defaultPlayerConfig = {
      level: 1,
      experience: 0,
      health: 100,
      maxHealth: 100,
      mana: 50,
      maxMana: 50,
      stamina: 100,
      maxStamina: 100,
      gold: 100,
      position: { x: 1024, y: 1024, z: 0 },
      worldId: 'newbie-island',
      class: 'adventurer',
      race: 'human',
      stats: {
        strength: 10,
        agility: 10,
        intelligence: 10,
        vitality: 10,
        luck: 10
      },
      skills: {
        combat: 1,
        magic: 1,
        crafting: 1,
        gathering: 1,
        social: 1
      },
      inventory: [],
      equipment: {
        weapon: null,
        armor: null,
        helmet: null,
        boots: null,
        accessory: null
      },
      achievements: [],
      quests: {
        active: [],
        completed: [],
        failed: []
      },
      preferences: {
        music: true,
        soundEffects: true,
        notifications: true,
        pvpMode: false,
        tradingEnabled: true
      }
    };
  }

  async initialize() {
    console.log('👥 Initializing Player Manager...');
    
    // Set up periodic cleanup
    setInterval(() => {
      this.cleanupExpiredSessions();
      this.cleanupPlayerCache();
      this.updatePlayerMetrics();
    }, 60000); // Every minute
    
    // Set up auto-save for player data
    setInterval(() => {
      this.autoSavePlayerData();
    }, 300000); // Every 5 minutes
    
    console.log('✅ Player Manager initialized');
  }

  async handlePlayerJoin(socket, data) {
    try {
      const { token, playerData } = data;
      
      // Validate authentication token
      const authData = await this.validateAuthToken(token);
      if (!authData) {
        socket.emit('auth:failed', { message: 'Invalid authentication token' });
        return;
      }
      
      // Load or create player
      let player = await this.loadPlayer(authData.playerId);
      if (!player) {
        player = await this.createNewPlayer(authData, playerData);
      }
      
      // Check if player is already connected
      if (this.activePlayers.has(player.id)) {
        const existingSocket = this.playerSocketMap.get(player.id);
        if (existingSocket && existingSocket.connected) {
          socket.emit('auth:failed', { message: 'Player already connected' });
          return;
        }
      }
      
      // Initialize player session
      await this.initializePlayerSession(socket, player);
      
      // Create physics body for player
      this.gameEngine.systems.get('physics').createPlayerBody(player);
      
      // Add player to game world
      await this.addPlayerToWorld(player);
      
      // Send successful join response
      socket.emit('player:joined', {
        player: this.sanitizePlayerData(player),
        world: this.gameEngine.worlds.get(player.worldId),
        gameTime: this.gameEngine.gameState.serverTime
      });
      
      // Notify other players
      socket.broadcast.emit('player:entered', {
        id: player.id,
        name: player.name,
        position: player.position,
        level: player.level,
        class: player.class
      });
      
      // Update metrics
      this.playerMetrics.totalConnections++;
      this.playerMetrics.currentOnline = this.activePlayers.size;
      this.playerMetrics.maxConcurrent = Math.max(
        this.playerMetrics.maxConcurrent, 
        this.playerMetrics.currentOnline
      );
      
      console.log(`Player ${player.name} (${player.id}) joined the game`);
      
    } catch (error) {
      console.error('Error handling player join:', error);
      socket.emit('error', { message: 'Failed to join game' });
    }
  }

  async initializePlayerSession(socket, player) {
    // Create player session
    const session = {
      id: uuidv4(),
      playerId: player.id,
      socketId: socket.id,
      startTime: Date.now(),
      lastActivity: Date.now(),
      ipAddress: socket.handshake.address,
      userAgent: socket.handshake.headers['user-agent']
    };
    
    // Store session data
    this.playerSessions.set(session.id, session);
    this.playerSocketMap.set(player.id, socket);
    this.socketPlayerMap.set(socket.id, player);
    
    // Set socket player reference
    socket.playerId = player.id;
    socket.sessionId = session.id;
    
    // Add player to active players
    this.activePlayers.set(player.id, player);
    this.gameEngine.players.set(player.id, player);
    
    // Initialize player state tracking
    this.initializePlayerTracking(player);
    
    // Save session to database
    await PlayerSession.create(session);
  }

  initializePlayerTracking(player) {
    // Initialize position tracking
    this.playerPositions.set(player.id, {
      current: { ...player.position },
      previous: { ...player.position },
      velocity: { x: 0, y: 0 },
      lastUpdate: Date.now()
    });
    
    // Initialize state tracking
    this.playerStates.set(player.id, {
      health: player.health,
      mana: player.mana,
      stamina: player.stamina,
      isMoving: false,
      isCombat: false,
      isTrading: false,
      isCrafting: false,
      currentAction: 'idle',
      effects: [],
      buffs: [],
      debuffs: []
    });
    
    // Initialize inventory tracking
    this.playerInventories.set(player.id, {
      items: [...player.inventory],
      equipment: { ...player.equipment },
      lastUpdate: Date.now()
    });
    
    // Initialize anti-cheat tracking
    this.movementHistory.set(player.id, []);
    this.lastActionTimes.set(player.id, new Map());
    this.suspiciousActivities.set(player.id, []);
    
    // Initialize cooldown tracking
    this.actionCooldowns.set(player.id, new Map());
    this.skillCooldowns.set(player.id, new Map());
  }

  async loadPlayer(playerId) {
    try {
      // Check cache first
      if (this.playerDataCache.has(playerId)) {
        const cachedData = this.playerDataCache.get(playerId);
        const expiry = this.cacheExpiry.get(playerId);
        
        if (Date.now() < expiry) {
          return cachedData;
        } else {
          this.playerDataCache.delete(playerId);
          this.cacheExpiry.delete(playerId);
        }
      }
      
      // Load from database
      const playerDoc = await Player.findById(playerId);
      if (!playerDoc) return null;
      
      const player = playerDoc.toObject();
      
      // Cache player data
      this.playerDataCache.set(playerId, player);
      this.cacheExpiry.set(playerId, Date.now() + 300000); // 5 minutes
      
      return player;
      
    } catch (error) {
      console.error('Error loading player:', error);
      return null;
    }
  }

  async createNewPlayer(authData, playerData) {
    const playerId = uuidv4();
    
    const player = {
      ...this.defaultPlayerConfig,
      id: playerId,
      accountId: authData.accountId,
      name: playerData.name || `Player_${playerId.slice(0, 8)}`,
      class: playerData.class || 'adventurer',
      race: playerData.race || 'human',
      gender: playerData.gender || 'neutral',
      appearance: playerData.appearance || {},
      createdAt: new Date(),
      lastLogin: new Date(),
      totalPlayTime: 0
    };
    
    // Validate player name
    if (!await this.isValidPlayerName(player.name)) {
      throw new Error('Invalid player name');
    }
    
    // Save to database
    const playerDoc = new Player(player);
    await playerDoc.save();
    
    console.log(`Created new player: ${player.name} (${player.id})`);
    
    return player;
  }

  async isValidPlayerName(name) {
    // Check name length and characters
    if (!name || name.length < 3 || name.length > 20) {
      return false;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(name)) {
      return false;
    }
    
    // Check if name is already taken
    const existingPlayer = await Player.findOne({ name: name });
    return !existingPlayer;
  }

  async handlePlayerMove(socket, data) {
    const playerId = socket.playerId;
    const player = this.activePlayers.get(playerId);
    
    if (!player) {
      throw new Error('Player not found');
    }
    
    // Anti-cheat: Check movement speed
    if (!this.validateMovement(player, data)) {
      this.flagSuspiciousActivity(playerId, 'speed_hack', data);
      return;
    }
    
    // Update position tracking
    const positionData = this.playerPositions.get(playerId);
    positionData.previous = { ...positionData.current };
    positionData.current = { x: data.x, y: data.y };
    positionData.velocity = data.velocity || { x: 0, y: 0 };
    positionData.lastUpdate = Date.now();
    
    // Update player object
    player.position.x = data.x;
    player.position.y = data.y;
    player.isDirty = true;
    
    // Add to movement history for anti-cheat
    const history = this.movementHistory.get(playerId);
    history.push({
      position: { x: data.x, y: data.y },
      timestamp: Date.now(),
      velocity: data.velocity
    });
    
    // Keep only last 10 movements
    if (history.length > 10) {
      history.shift();
    }
    
    // Update player state
    const state = this.playerStates.get(playerId);
    state.isMoving = data.isMoving || false;
    
    // Broadcast movement to nearby players
    this.broadcastToNearbyPlayers(player, 'player:moved', {
      id: playerId,
      position: player.position,
      velocity: data.velocity,
      isMoving: state.isMoving
    });
  }

  validateMovement(player, data) {
    const positionData = this.playerPositions.get(player.id);
    if (!positionData) return true;
    
    const distance = Math.sqrt(
      Math.pow(data.x - positionData.current.x, 2) + 
      Math.pow(data.y - positionData.current.y, 2)
    );
    
    const timeDiff = Date.now() - positionData.lastUpdate;
    const maxDistance = (player.movementSpeed || 150) * (timeDiff / 1000) * 1.5; // 50% tolerance
    
    return distance <= maxDistance;
  }

  flagSuspiciousActivity(playerId, type, data) {
    const activities = this.suspiciousActivities.get(playerId) || [];
    activities.push({
      type: type,
      data: data,
      timestamp: Date.now()
    });
    
    this.suspiciousActivities.set(playerId, activities);
    
    // Auto-kick if too many suspicious activities
    if (activities.length > 5) {
      this.kickPlayer(playerId, 'Suspicious activity detected');
    }
  }

  async handlePlayerDisconnect(socket) {
    const playerId = socket.playerId;
    if (!playerId) return;
    
    const player = this.activePlayers.get(playerId);
    if (!player) return;
    
    try {
      // Calculate session time
      const session = this.playerSessions.get(socket.sessionId);
      if (session) {
        const sessionTime = Date.now() - session.startTime;
        player.totalPlayTime += sessionTime;
        
        // Update session in database
        await PlayerSession.findByIdAndUpdate(session.id, {
          endTime: Date.now(),
          duration: sessionTime
        });
      }
      
      // Save player data
      await this.savePlayerData(player);
      
      // Remove from physics world
      this.gameEngine.systems.get('physics').destroyBody(playerId);
      
      // Clean up tracking data
      this.cleanupPlayerTracking(playerId);
      
      // Remove from active players
      this.activePlayers.delete(playerId);
      this.gameEngine.players.delete(playerId);
      this.playerSocketMap.delete(playerId);
      this.socketPlayerMap.delete(socket.id);
      
      // Notify other players
      socket.broadcast.emit('player:left', {
        id: playerId,
        name: player.name
      });
      
      // Update metrics
      this.playerMetrics.totalDisconnections++;
      this.playerMetrics.currentOnline = this.activePlayers.size;
      
      console.log(`Player ${player.name} (${playerId}) disconnected`);
      
    } catch (error) {
      console.error('Error handling player disconnect:', error);
    }
  }

  cleanupPlayerTracking(playerId) {
    this.playerSessions.delete(playerId);
    this.playerStates.delete(playerId);
    this.playerPositions.delete(playerId);
    this.playerInventories.delete(playerId);
    this.actionCooldowns.delete(playerId);
    this.skillCooldowns.delete(playerId);
    this.movementHistory.delete(playerId);
    this.lastActionTimes.delete(playerId);
    this.suspiciousActivities.delete(playerId);
  }

  async savePlayerData(player) {
    try {
      // Update last login time
      player.lastLogin = new Date();
      
      // Save to database
      await Player.findByIdAndUpdate(player.id, player, { upsert: true });
      
      // Update cache
      this.playerDataCache.set(player.id, player);
      this.cacheExpiry.set(player.id, Date.now() + 300000);
      
    } catch (error) {
      console.error(`Error saving player data for ${player.id}:`, error);
    }
  }

  async saveAllPlayers() {
    console.log('💾 Saving all player data...');
    
    const savePromises = [];
    for (const [playerId, player] of this.activePlayers) {
      savePromises.push(this.savePlayerData(player));
    }
    
    try {
      await Promise.all(savePromises);
      console.log(`✅ Saved data for ${savePromises.length} players`);
    } catch (error) {
      console.error('❌ Error saving player data:', error);
    }
  }

  async autoSavePlayerData() {
    console.log('🔄 Auto-saving player data...');
    
    let savedCount = 0;
    for (const [playerId, player] of this.activePlayers) {
      try {
        await this.savePlayerData(player);
        savedCount++;
      } catch (error) {
        console.error(`Error auto-saving player ${playerId}:`, error);
      }
    }
    
    console.log(`✅ Auto-saved data for ${savedCount} players`);
  }

  broadcastToNearbyPlayers(player, event, data, radius = 500) {
    const nearbyPlayers = this.getNearbyPlayers(player, radius);
    
    nearbyPlayers.forEach(nearbyPlayer => {
      const socket = this.playerSocketMap.get(nearbyPlayer.id);
      if (socket && socket.connected) {
        socket.emit(event, data);
      }
    });
  }

  getNearbyPlayers(player, radius) {
    const nearbyPlayers = [];
    
    for (const [playerId, otherPlayer] of this.activePlayers) {
      if (playerId === player.id) continue;
      
      const distance = Math.sqrt(
        Math.pow(player.position.x - otherPlayer.position.x, 2) + 
        Math.pow(player.position.y - otherPlayer.position.y, 2)
      );
      
      if (distance <= radius) {
        nearbyPlayers.push(otherPlayer);
      }
    }
    
    return nearbyPlayers;
  }

  async addPlayerToWorld(player) {
    const world = this.gameEngine.worlds.get(player.worldId);
    if (!world) {
      // Default to starting world
      player.worldId = 'newbie-island';
      player.position = { x: 1024, y: 1024, z: 0 };
    }
    
    // Add to world player list
    if (!world.players) {
      world.players = new Set();
    }
    world.players.add(player.id);
    
    // Load nearby entities for player
    await this.loadNearbyEntities(player);
  }

  async loadNearbyEntities(player) {
    const radius = 1000; // Load entities within 1000 units
    
    // Get entities from spatial partitioning system
    const physics = this.gameEngine.systems.get('physics');
    const nearbyEntities = physics.queryAABB(
      { x: player.position.x - radius, y: player.position.y - radius },
      { x: player.position.x + radius, y: player.position.y + radius }
    );
    
    // Send entity data to player
    const socket = this.playerSocketMap.get(player.id);
    if (socket) {
      socket.emit('entities:loaded', {
        entities: nearbyEntities.map(entity => ({
          id: entity.userData?.id,
          type: entity.userData?.type,
          position: entity.body.getPosition(),
          data: entity.userData?.gameObject
        }))
      });
    }
  }

  sanitizePlayerData(player) {
    // Remove sensitive data before sending to client
    const sanitized = { ...player };
    delete sanitized.accountId;
    delete sanitized.lastIP;
    delete sanitized.sessionId;
    
    return sanitized;
  }

  async validateAuthToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super-secret-key');
      return decoded;
    } catch (error) {
      return null;
    }
  }

  kickPlayer(playerId, reason) {
    const socket = this.playerSocketMap.get(playerId);
    if (socket) {
      socket.emit('player:kicked', { reason });
      socket.disconnect();
    }
  }

  banPlayer(playerId, reason, duration) {
    // Implement ban logic
    console.log(`Banning player ${playerId} for ${reason} (duration: ${duration})`);
    this.kickPlayer(playerId, `Banned: ${reason}`);
  }

  getPlayerById(playerId) {
    return this.activePlayers.get(playerId);
  }

  getPlayerBySocket(socket) {
    return this.socketPlayerMap.get(socket.id);
  }

  getOnlinePlayerCount() {
    return this.activePlayers.size;
  }

  getOnlinePlayers() {
    return Array.from(this.activePlayers.values()).map(player => 
      this.sanitizePlayerData(player)
    );
  }

  cleanupExpiredSessions() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    for (const [sessionId, session] of this.playerSessions) {
      if (session.lastActivity < oneHourAgo) {
        this.playerSessions.delete(sessionId);
      }
    }
  }

  cleanupPlayerCache() {
    const now = Date.now();
    
    for (const [playerId, expiry] of this.cacheExpiry) {
      if (now > expiry) {
        this.playerDataCache.delete(playerId);
        this.cacheExpiry.delete(playerId);
      }
    }
  }

  updatePlayerMetrics() {
    this.playerMetrics.currentOnline = this.activePlayers.size;
    
    // Calculate average session time
    let totalSessionTime = 0;
    let sessionCount = 0;
    
    for (const [sessionId, session] of this.playerSessions) {
      if (session.startTime) {
        totalSessionTime += Date.now() - session.startTime;
        sessionCount++;
      }
    }
    
    if (sessionCount > 0) {
      this.playerMetrics.averageSessionTime = totalSessionTime / sessionCount;
    }
  }

  getMetrics() {
    return {
      ...this.playerMetrics,
      activePlayers: this.activePlayers.size,
      cachedPlayers: this.playerDataCache.size,
      activeSessions: this.playerSessions.size
    };
  }
}