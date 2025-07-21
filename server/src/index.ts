import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { logger } from './utils/logger';
import { initializeDatabase } from './database';
import { initializeRedis } from './redis';
import { setupSocketHandlers } from './network/socket';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';

// API Routes
import authRoutes from './api/auth.routes';
import characterRoutes from './api/character.routes';
import gameRoutes from './api/game.routes';
import socialRoutes from './api/social.routes';
import adminRoutes from './api/admin.routes';

// Game Systems
import { WorldManager } from './systems/world/WorldManager';
import { CombatSystem } from './systems/combat/CombatSystem';
import { QuestSystem } from './systems/quests/QuestSystem';
import { ItemSystem } from './systems/items/ItemSystem';
import { SkillSystem } from './systems/skills/SkillSystem';
import { SocialSystem } from './systems/social/SocialSystem';
import { EconomySystem } from './systems/economy/EconomySystem';
import { AISystem } from './systems/ai/AISystem';

const PORT = process.env.PORT || 3000;
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', rateLimiter('auth'), authRoutes);
app.use('/api/characters', rateLimiter('api'), characterRoutes);
app.use('/api/game', rateLimiter('api'), gameRoutes);
app.use('/api/social', rateLimiter('api'), socialRoutes);
app.use('/api/admin', rateLimiter('api'), adminRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

// Initialize game systems
let worldManager: WorldManager;
let combatSystem: CombatSystem;
let questSystem: QuestSystem;
let itemSystem: ItemSystem;
let skillSystem: SkillSystem;
let socialSystem: SocialSystem;
let economySystem: EconomySystem;
let aiSystem: AISystem;

async function initializeGameSystems() {
  logger.info('Initializing game systems...');
  
  // Initialize managers and systems
  worldManager = new WorldManager();
  combatSystem = new CombatSystem(worldManager);
  questSystem = new QuestSystem(worldManager);
  itemSystem = new ItemSystem(worldManager);
  skillSystem = new SkillSystem(worldManager);
  socialSystem = new SocialSystem(worldManager);
  economySystem = new EconomySystem(worldManager);
  aiSystem = new AISystem(worldManager);
  
  // Load game data
  await worldManager.loadZones();
  await worldManager.loadNPCs();
  await itemSystem.loadItems();
  await skillSystem.loadSkills();
  await questSystem.loadQuests();
  
  // Start game loops
  worldManager.startGameLoop();
  combatSystem.startCombatLoop();
  aiSystem.startAILoop();
  
  logger.info('Game systems initialized successfully');
}

async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();
    logger.info('Database initialized');
    
    // Initialize Redis
    await initializeRedis();
    logger.info('Redis initialized');
    
    // Initialize game systems
    await initializeGameSystems();
    
    // Setup socket handlers
    setupSocketHandlers(io, {
      worldManager,
      combatSystem,
      questSystem,
      itemSystem,
      skillSystem,
      socialSystem,
      economySystem
    });
    
    // Start HTTP server
    httpServer.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Socket.IO server ready`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  
  // Stop accepting new connections
  httpServer.close(() => {
    logger.info('HTTP server closed');
  });
  
  // Close socket connections
  io.close(() => {
    logger.info('Socket.IO server closed');
  });
  
  // Stop game loops
  if (worldManager) worldManager.stopGameLoop();
  if (combatSystem) combatSystem.stopCombatLoop();
  if (aiSystem) aiSystem.stopAILoop();
  
  // Save world state
  if (worldManager) await worldManager.saveWorldState();
  
  // Close database connections
  await initializeDatabase().then(db => db.destroy());
  
  logger.info('Shutdown complete');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();