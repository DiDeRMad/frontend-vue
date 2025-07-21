import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import winston from 'winston';
import { createClient } from 'redis';
import Bull from 'bull';
import * as Sentry from '@sentry/node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { MeterProvider } from '@opentelemetry/sdk-metrics';
import { register } from 'prom-client';

// Import routers
import authRouter from './routes/auth.router.js';
import playerRouter from './routes/player.router.js';
import characterRouter from './routes/character.router.js';
import itemRouter from './routes/item.router.js';
import questRouter from './routes/quest.router.js';
import guildRouter from './routes/guild.router.js';
import auctionRouter from './routes/auction.router.js';
import mailRouter from './routes/mail.router.js';
import chatRouter from './routes/chat.router.js';
import adminRouter from './routes/admin.router.js';

// Import game systems
import { GameWorld } from './game/world/GameWorld.js';
import { CombatSystem } from './game/systems/CombatSystem.js';
import { MovementSystem } from './game/systems/MovementSystem.js';
import { QuestSystem } from './game/systems/QuestSystem.js';
import { LootSystem } from './game/systems/LootSystem.js';
import { CraftingSystem } from './game/systems/CraftingSystem.js';
import { TradeSystem } from './game/systems/TradeSystem.js';
import { GuildSystem } from './game/systems/GuildSystem.js';
import { ChatSystem } from './game/systems/ChatSystem.js';
import { AuctionSystem } from './game/systems/AuctionSystem.js';
import { MailSystem } from './game/systems/MailSystem.js';
import { PvPSystem } from './game/systems/PvPSystem.js';
import { EventSystem } from './game/systems/EventSystem.js';
import { WeatherSystem } from './game/systems/WeatherSystem.js';
import { AISystem } from './game/systems/AISystem.js';
import { SpawnSystem } from './game/systems/SpawnSystem.js';

// Import managers
import { PlayerManager } from './game/managers/PlayerManager.js';
import { ZoneManager } from './game/managers/ZoneManager.js';
import { InstanceManager } from './game/managers/InstanceManager.js';
import { PartyManager } from './game/managers/PartyManager.js';
import { NetworkManager } from './game/managers/NetworkManager.js';

// Import middleware
import { authMiddleware } from './middleware/auth.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import { requestLogger } from './middleware/logger.middleware.js';
import { validationMiddleware } from './middleware/validation.middleware.js';

// Import utils
import { Logger } from './utils/logger.js';
import { Cache } from './utils/cache.js';
import { Metrics } from './utils/metrics.js';

// Load environment variables
config();

// Initialize logger
const logger = new Logger('Server');

// Initialize Sentry for error tracking
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app: express() }),
    ],
    tracesSampleRate: 1.0,
  });
}

// Initialize Prometheus metrics
const metricsExporter = new PrometheusExporter({
  port: 9090,
  endpoint: '/metrics',
}, () => {
  logger.info('Prometheus metrics server started on port 9090');
});

const meterProvider = new MeterProvider({
  exporter: metricsExporter,
  interval: 2000,
});

// Initialize database
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// Initialize Redis
const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redis.on('error', (err) => logger.error('Redis Client Error', err));
redis.on('connect', () => logger.info('Connected to Redis'));

// Initialize job queues
const gameQueue = new Bull('game-queue', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

const maintenanceQueue = new Bull('maintenance-queue', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Apply middleware
app.use(Sentry.Handlers.requestHandler());
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

app.use('/api/', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// API routes
app.use('/api/auth', authRouter);
app.use('/api/players', authMiddleware, playerRouter);
app.use('/api/characters', authMiddleware, characterRouter);
app.use('/api/items', authMiddleware, itemRouter);
app.use('/api/quests', authMiddleware, questRouter);
app.use('/api/guilds', authMiddleware, guildRouter);
app.use('/api/auction', authMiddleware, auctionRouter);
app.use('/api/mail', authMiddleware, mailRouter);
app.use('/api/chat', authMiddleware, chatRouter);
app.use('/api/admin', authMiddleware, adminRouter);

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Error handling
app.use(Sentry.Handlers.errorHandler());
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found.',
  });
});

// Initialize game systems
const initializeGameSystems = async () => {
  logger.info('Initializing game systems...');
  
  // Initialize cache
  const cache = new Cache(redis);
  await cache.connect();
  
  // Initialize metrics
  const metrics = new Metrics(meterProvider);
  
  // Initialize game world
  const gameWorld = new GameWorld(prisma, cache, metrics);
  await gameWorld.initialize();
  
  // Initialize managers
  const playerManager = new PlayerManager(prisma, cache);
  const zoneManager = new ZoneManager(prisma, cache);
  const instanceManager = new InstanceManager(prisma, cache);
  const partyManager = new PartyManager(prisma, cache);
  const networkManager = new NetworkManager(io, cache);
  
  // Initialize game systems
  const combatSystem = new CombatSystem(gameWorld, playerManager);
  const movementSystem = new MovementSystem(gameWorld, playerManager, networkManager);
  const questSystem = new QuestSystem(gameWorld, playerManager);
  const lootSystem = new LootSystem(gameWorld, playerManager);
  const craftingSystem = new CraftingSystem(gameWorld, playerManager);
  const tradeSystem = new TradeSystem(gameWorld, playerManager);
  const guildSystem = new GuildSystem(gameWorld, playerManager);
  const chatSystem = new ChatSystem(gameWorld, playerManager, networkManager);
  const auctionSystem = new AuctionSystem(gameWorld, prisma, cache);
  const mailSystem = new MailSystem(gameWorld, playerManager);
  const pvpSystem = new PvPSystem(gameWorld, playerManager);
  const eventSystem = new EventSystem(gameWorld);
  const weatherSystem = new WeatherSystem(gameWorld);
  const aiSystem = new AISystem(gameWorld);
  const spawnSystem = new SpawnSystem(gameWorld);
  
  // Register systems with game world
  gameWorld.registerSystem('combat', combatSystem);
  gameWorld.registerSystem('movement', movementSystem);
  gameWorld.registerSystem('quest', questSystem);
  gameWorld.registerSystem('loot', lootSystem);
  gameWorld.registerSystem('crafting', craftingSystem);
  gameWorld.registerSystem('trade', tradeSystem);
  gameWorld.registerSystem('guild', guildSystem);
  gameWorld.registerSystem('chat', chatSystem);
  gameWorld.registerSystem('auction', auctionSystem);
  gameWorld.registerSystem('mail', mailSystem);
  gameWorld.registerSystem('pvp', pvpSystem);
  gameWorld.registerSystem('event', eventSystem);
  gameWorld.registerSystem('weather', weatherSystem);
  gameWorld.registerSystem('ai', aiSystem);
  gameWorld.registerSystem('spawn', spawnSystem);
  
  // Start game world
  await gameWorld.start();
  
  logger.info('Game systems initialized successfully');
  
  return {
    gameWorld,
    managers: {
      playerManager,
      zoneManager,
      instanceManager,
      partyManager,
      networkManager,
    },
    systems: {
      combatSystem,
      movementSystem,
      questSystem,
      lootSystem,
      craftingSystem,
      tradeSystem,
      guildSystem,
      chatSystem,
      auctionSystem,
      mailSystem,
      pvpSystem,
      eventSystem,
      weatherSystem,
      aiSystem,
      spawnSystem,
    },
  };
};

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`New socket connection: ${socket.id}`);
  
  socket.on('authenticate', async (token) => {
    try {
      // Verify token and get player info
      const player = await verifyToken(token);
      if (!player) {
        socket.emit('auth_error', { message: 'Invalid token' });
        socket.disconnect();
        return;
      }
      
      // Associate socket with player
      socket.data.playerId = player.id;
      socket.data.characterId = player.selectedCharacterId;
      
      // Join player to their personal room
      socket.join(`player:${player.id}`);
      
      // Join character to zone room if they have a character selected
      if (player.selectedCharacterId) {
        const character = await prisma.character.findUnique({
          where: { id: player.selectedCharacterId },
        });
        
        if (character) {
          socket.join(`zone:${character.zoneId}`);
          socket.data.zoneId = character.zoneId;
        }
      }
      
      socket.emit('authenticated', { playerId: player.id });
      logger.info(`Player ${player.id} authenticated on socket ${socket.id}`);
      
    } catch (error) {
      logger.error('Socket authentication error:', error);
      socket.emit('auth_error', { message: 'Authentication failed' });
      socket.disconnect();
    }
  });
  
  socket.on('disconnect', (reason) => {
    logger.info(`Socket ${socket.id} disconnected: ${reason}`);
    // Handle player disconnection
    if (socket.data.playerId) {
      // Update player status, save state, etc.
    }
  });
  
  // Handle game events
  socket.on('movement', (data) => {
    // Handle movement
  });
  
  socket.on('combat_action', (data) => {
    // Handle combat action
  });
  
  socket.on('chat_message', (data) => {
    // Handle chat message
  });
  
  // Add more event handlers as needed
});

// Job queue processing
gameQueue.process('world_save', async (job) => {
  logger.info('Processing world save job');
  // Save world state
});

gameQueue.process('spawn_update', async (job) => {
  logger.info('Processing spawn update job');
  // Update spawns
});

maintenanceQueue.process('cleanup_expired', async (job) => {
  logger.info('Processing cleanup job');
  // Clean up expired data
});

maintenanceQueue.process('calculate_rankings', async (job) => {
  logger.info('Processing rankings calculation job');
  // Calculate rankings
});

// Schedule recurring jobs
const scheduleJobs = () => {
  // Save world state every 5 minutes
  gameQueue.add('world_save', {}, {
    repeat: { cron: '*/5 * * * *' },
  });
  
  // Update spawns every minute
  gameQueue.add('spawn_update', {}, {
    repeat: { cron: '* * * * *' },
  });
  
  // Clean up expired data daily
  maintenanceQueue.add('cleanup_expired', {}, {
    repeat: { cron: '0 3 * * *' }, // 3 AM daily
  });
  
  // Calculate rankings hourly
  maintenanceQueue.add('calculate_rankings', {}, {
    repeat: { cron: '0 * * * *' },
  });
};

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info('Starting graceful shutdown...');
  
  // Stop accepting new connections
  httpServer.close();
  
  // Close Socket.IO connections
  io.close();
  
  // Close job queues
  await gameQueue.close();
  await maintenanceQueue.close();
  
  // Save world state
  if (gameWorld) {
    await gameWorld.shutdown();
  }
  
  // Close database connections
  await prisma.$disconnect();
  await redis.quit();
  
  logger.info('Graceful shutdown completed');
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const startServer = async () => {
  try {
    // Connect to Redis
    await redis.connect();
    
    // Initialize game systems
    const { gameWorld, managers, systems } = await initializeGameSystems();
    
    // Make game systems available globally
    global.gameWorld = gameWorld;
    global.gameManagers = managers;
    global.gameSystems = systems;
    
    // Schedule jobs
    scheduleJobs();
    
    // Start HTTP server
    const PORT = process.env.PORT || 3001;
    httpServer.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Client URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
    });
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Helper function to verify JWT token
async function verifyToken(token: string) {
  // Implement JWT verification
  // This is a placeholder - implement actual JWT verification
  return null;
}

// Declare global types
declare global {
  var gameWorld: GameWorld;
  var gameManagers: any;
  var gameSystems: any;
}

// Start the server
startServer();