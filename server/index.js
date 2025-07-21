import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import game modules
import { GameEngine } from './game/GameEngine.js';
import { PlayerManager } from './game/PlayerManager.js';
import { WorldManager } from './game/WorldManager.js';
import { ChatSystem } from './game/ChatSystem.js';
import { QuestSystem } from './game/QuestSystem.js';
import { GuildSystem } from './game/GuildSystem.js';
import { MarketPlace } from './game/MarketPlace.js';
import { BattleSystem } from './game/BattleSystem.js';
import { CraftingSystem } from './game/CraftingSystem.js';
import { InventorySystem } from './game/InventorySystem.js';
import { AchievementSystem } from './game/AchievementSystem.js';

// Import API routes
import authRoutes from './routes/auth.js';
import playerRoutes from './routes/player.js';
import gameRoutes from './routes/game.js';
import adminRoutes from './routes/admin.js';
import marketRoutes from './routes/market.js';
import guildRoutes from './routes/guild.js';
import questRoutes from './routes/quest.js';
import statsRoutes from './routes/stats.js';

// Import middleware
import { authenticateToken } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './middleware/logger.js';

// Import utilities
import { DatabaseManager } from './database/DatabaseManager.js';
import { RedisManager } from './database/RedisManager.js';
import { SecurityManager } from './security/SecurityManager.js';
import { PerformanceMonitor } from './utils/PerformanceMonitor.js';
import { BackupManager } from './utils/BackupManager.js';
import { AnalyticsManager } from './analytics/AnalyticsManager.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const server = createServer(app);

// Initialize Socket.io with advanced configuration
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e8 // 100MB for large game data
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"]
    }
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

app.use(limiter);
app.use(compression());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(logger);

// Game Systems Initialization
const gameEngine = new GameEngine(io);
const playerManager = new PlayerManager(io, gameEngine);
const worldManager = new WorldManager(gameEngine);
const chatSystem = new ChatSystem(io);
const questSystem = new QuestSystem(gameEngine);
const guildSystem = new GuildSystem(io);
const marketPlace = new MarketPlace(io);
const battleSystem = new BattleSystem(gameEngine);
const craftingSystem = new CraftingSystem(gameEngine);
const inventorySystem = new InventorySystem(gameEngine);
const achievementSystem = new AchievementSystem(gameEngine);

// Utility Systems
const databaseManager = new DatabaseManager();
const redisManager = new RedisManager();
const securityManager = new SecurityManager();
const performanceMonitor = new PerformanceMonitor();
const backupManager = new BackupManager();
const analyticsManager = new AnalyticsManager();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/player', authenticateToken, playerRoutes);
app.use('/api/game', authenticateToken, gameRoutes);
app.use('/api/admin', authenticateToken, adminRoutes);
app.use('/api/market', authenticateToken, marketRoutes);
app.use('/api/guild', authenticateToken, guildRoutes);
app.use('/api/quest', authenticateToken, questRoutes);
app.use('/api/stats', authenticateToken, statsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    gameStats: gameEngine.getStats()
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);
  
  // Authentication middleware for sockets
  socket.use(async (packet, next) => {
    try {
      await securityManager.validateSocketAuth(socket, packet);
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  // Game event handlers
  socket.on('player:join', async (data) => {
    try {
      await playerManager.handlePlayerJoin(socket, data);
      analyticsManager.trackEvent('player_join', { playerId: socket.playerId });
    } catch (error) {
      socket.emit('error', { message: 'Failed to join game' });
    }
  });

  socket.on('player:move', async (data) => {
    try {
      await playerManager.handlePlayerMove(socket, data);
      gameEngine.updatePlayerPosition(socket.playerId, data);
    } catch (error) {
      socket.emit('error', { message: 'Invalid move' });
    }
  });

  socket.on('player:action', async (data) => {
    try {
      await gameEngine.handlePlayerAction(socket, data);
    } catch (error) {
      socket.emit('error', { message: 'Action failed' });
    }
  });

  socket.on('chat:message', async (data) => {
    try {
      await chatSystem.handleMessage(socket, data);
    } catch (error) {
      socket.emit('error', { message: 'Message failed to send' });
    }
  });

  socket.on('battle:action', async (data) => {
    try {
      await battleSystem.handleBattleAction(socket, data);
    } catch (error) {
      socket.emit('error', { message: 'Battle action failed' });
    }
  });

  socket.on('inventory:action', async (data) => {
    try {
      await inventorySystem.handleInventoryAction(socket, data);
    } catch (error) {
      socket.emit('error', { message: 'Inventory action failed' });
    }
  });

  socket.on('quest:action', async (data) => {
    try {
      await questSystem.handleQuestAction(socket, data);
    } catch (error) {
      socket.emit('error', { message: 'Quest action failed' });
    }
  });

  socket.on('guild:action', async (data) => {
    try {
      await guildSystem.handleGuildAction(socket, data);
    } catch (error) {
      socket.emit('error', { message: 'Guild action failed' });
    }
  });

  socket.on('market:action', async (data) => {
    try {
      await marketPlace.handleMarketAction(socket, data);
    } catch (error) {
      socket.emit('error', { message: 'Market action failed' });
    }
  });

  socket.on('crafting:action', async (data) => {
    try {
      await craftingSystem.handleCraftingAction(socket, data);
    } catch (error) {
      socket.emit('error', { message: 'Crafting action failed' });
    }
  });

  socket.on('disconnect', async (reason) => {
    console.log(`Player disconnected: ${socket.id}, reason: ${reason}`);
    try {
      await playerManager.handlePlayerDisconnect(socket);
      analyticsManager.trackEvent('player_disconnect', { 
        playerId: socket.playerId, 
        reason 
      });
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });
});

// Error handling middleware
app.use(errorHandler);

// Database connection
async function connectDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/supergame', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 50,
      bufferMaxEntries: 0,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('Connected to MongoDB');
    
    // Initialize Redis
    await redisManager.connect();
    console.log('Connected to Redis');
    
    // Initialize game systems
    await gameEngine.initialize();
    await worldManager.initialize();
    await questSystem.initialize();
    await achievementSystem.initialize();
    
    console.log('Game systems initialized');
    
    // Start performance monitoring
    performanceMonitor.start();
    
    // Start backup manager
    backupManager.start();
    
    console.log('All systems online!');
    
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  
  // Save all player data
  await playerManager.saveAllPlayers();
  
  // Close database connections
  await mongoose.connection.close();
  await redisManager.disconnect();
  
  // Close server
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  
  // Save all player data
  await playerManager.saveAllPlayers();
  
  // Close database connections
  await mongoose.connection.close();
  await redisManager.disconnect();
  
  // Close server
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Start server
const PORT = process.env.PORT || 3001;

async function startServer() {
  await connectDatabase();
  
  server.listen(PORT, () => {
    console.log(`🚀 Super Puper Online Game Server running on port ${PORT}`);
    console.log(`🎮 Game Engine initialized with ${gameEngine.getPlayerCount()} players online`);
    console.log(`🌍 World ${worldManager.getCurrentWorld()} loaded successfully`);
    console.log(`⚡ Performance monitoring active`);
    console.log(`💾 Auto-backup system running`);
  });
}

startServer().catch(console.error);

export { app, server, io, gameEngine, playerManager, worldManager };