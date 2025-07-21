import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import redis from 'redis';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import winston from 'winston';

// Import configurations
import { dbConfig } from './config/database.js';
import { securityConfig } from './config/security.js';
import { gameConfig } from './config/game.js';
import { wsConfig } from './config/websocket.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { authMiddleware } from './middleware/auth.js';
import { validationMiddleware } from './middleware/validation.js';
import { loggingMiddleware } from './middleware/logging.js';
import { cacheMiddleware } from './middleware/cache.js';

// Import routes
import authRoutes from './api/auth.routes.js';
import userRoutes from './api/user.routes.js';
import characterRoutes from './api/character.routes.js';
import worldRoutes from './api/world.routes.js';
import combatRoutes from './api/combat.routes.js';
import questRoutes from './api/quest.routes.js';
import inventoryRoutes from './api/inventory.routes.js';
import guildRoutes from './api/guild.routes.js';
import marketRoutes from './api/market.routes.js';
import socialRoutes from './api/social.routes.js';
import craftingRoutes from './api/crafting.routes.js';
import paymentRoutes from './api/payment.routes.js';
import adminRoutes from './api/admin.routes.js';
import analyticsRoutes from './api/analytics.routes.js';

// Import game systems
import { GameWorld } from './game/world/GameWorld.js';
import { CombatSystem } from './game/combat/CombatSystem.js';
import { AIManager } from './game/ai/AIManager.js';
import { PhysicsEngine } from './game/physics/PhysicsEngine.js';
import { QuestManager } from './game/quests/QuestManager.js';
import { EventSystem } from './game/events/EventSystem.js';
import { EconomyManager } from './game/economy/EconomyManager.js';
import { CraftingSystem } from './game/crafting/CraftingSystem.js';

// Import services
import { WebSocketManager } from './websocket/WebSocketManager.js';
import { CacheService } from './services/CacheService.js';
import { EmailService } from './services/EmailService.js';
import { NotificationService } from './services/NotificationService.js';
import { MonitoringService } from './monitoring/MonitoringService.js';
import { AnalyticsService } from './services/AnalyticsService.js';
import { BackupService } from './services/BackupService.js';
import { MigrationService } from './services/MigrationService.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
    ),
    defaultMeta: { service: 'eternal-realms-server' },
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
});

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        credentials: true
    },
    pingTimeout: wsConfig.pingTimeout,
    pingInterval: wsConfig.pingInterval,
    maxHttpBufferSize: 1e8, // 100 MB
    transports: ['websocket', 'polling']
});

// Initialize Redis client
const redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
            return new Error('Redis connection refused');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
            return new Error('Redis retry time exhausted');
        }
        if (options.attempt > 10) {
            return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
    }
});

// Global middleware
app.use(helmet(securityConfig.helmet));
app.use(cors(securityConfig.cors));
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);

// Static files
app.use('/assets', express.static(join(__dirname, '../../public/assets'), {
    maxAge: '1y',
    etag: true
}));

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/characters', authMiddleware, characterRoutes);
app.use('/api/world', authMiddleware, worldRoutes);
app.use('/api/combat', authMiddleware, combatRoutes);
app.use('/api/quests', authMiddleware, questRoutes);
app.use('/api/inventory', authMiddleware, inventoryRoutes);
app.use('/api/guilds', authMiddleware, guildRoutes);
app.use('/api/market', authMiddleware, marketRoutes);
app.use('/api/social', authMiddleware, socialRoutes);
app.use('/api/crafting', authMiddleware, craftingRoutes);
app.use('/api/payments', authMiddleware, paymentRoutes);
app.use('/api/admin', authMiddleware, adminRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);

// API documentation
if (process.env.NODE_ENV === 'development') {
    const swaggerUi = await import('swagger-ui-express');
    const swaggerDocument = await import('./config/swagger.js');
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument.default));
}

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: 'The requested resource was not found',
        path: req.originalUrl
    });
});

// Initialize game systems
let gameWorld, combatSystem, aiManager, physicsEngine, questManager, 
    eventSystem, economyManager, craftingSystem, wsManager, cacheService,
    emailService, notificationService, monitoringService, analyticsService;

async function initializeGameSystems() {
    try {
        // Initialize core services
        cacheService = new CacheService(redisClient);
        emailService = new EmailService();
        notificationService = new NotificationService(io, cacheService);
        monitoringService = new MonitoringService();
        analyticsService = new AnalyticsService();

        // Initialize game systems
        gameWorld = new GameWorld({
            maxPlayers: gameConfig.maxPlayersPerServer,
            worldSize: gameConfig.worldSize,
            tickRate: gameConfig.worldTickRate
        });

        physicsEngine = new PhysicsEngine({
            tickRate: gameConfig.physicsTickRate,
            gravity: gameConfig.gravity
        });

        combatSystem = new CombatSystem({
            gameWorld,
            physicsEngine,
            damageCalculation: gameConfig.damageCalculation
        });

        aiManager = new AIManager({
            gameWorld,
            combatSystem,
            updateRate: gameConfig.aiUpdateRate
        });

        questManager = new QuestManager({
            gameWorld,
            notificationService
        });

        eventSystem = new EventSystem({
            gameWorld,
            questManager,
            notificationService
        });

        economyManager = new EconomyManager({
            gameWorld,
            cacheService
        });

        craftingSystem = new CraftingSystem({
            gameWorld,
            economyManager
        });

        // Initialize WebSocket manager
        wsManager = new WebSocketManager(io, {
            gameWorld,
            combatSystem,
            aiManager,
            physicsEngine,
            questManager,
            eventSystem,
            economyManager,
            craftingSystem,
            cacheService,
            notificationService
        });

        // Start game loops
        gameWorld.start();
        physicsEngine.start();
        aiManager.start();
        eventSystem.start();

        logger.info('All game systems initialized successfully');
    } catch (error) {
        logger.error('Failed to initialize game systems:', error);
        throw error;
    }
}

// Database connection
async function connectDatabase() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eternal-realms', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
        });
        logger.info('Connected to MongoDB');

        await redisClient.connect();
        logger.info('Connected to Redis');

        // Run migrations if needed
        const migrationService = new MigrationService();
        await migrationService.runPendingMigrations();

    } catch (error) {
        logger.error('Database connection error:', error);
        throw error;
    }
}

// Graceful shutdown
async function gracefulShutdown() {
    logger.info('Shutting down gracefully...');

    // Stop accepting new connections
    httpServer.close(() => {
        logger.info('HTTP server closed');
    });

    // Close WebSocket connections
    io.close(() => {
        logger.info('WebSocket server closed');
    });

    // Stop game systems
    if (gameWorld) gameWorld.stop();
    if (physicsEngine) physicsEngine.stop();
    if (aiManager) aiManager.stop();
    if (eventSystem) eventSystem.stop();

    // Close database connections
    try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed');

        await redisClient.quit();
        logger.info('Redis connection closed');
    } catch (error) {
        logger.error('Error during shutdown:', error);
    }

    process.exit(0);
}

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown();
});

// Start server
async function startServer() {
    try {
        await connectDatabase();
        await initializeGameSystems();

        const PORT = process.env.PORT || 3000;
        httpServer.listen(PORT, () => {
            logger.info(`🎮 Eternal Realms Online Server running on port ${PORT}`);
            logger.info(`🌍 Environment: ${process.env.NODE_ENV}`);
            logger.info(`🔥 Game world ready for ${gameConfig.maxPlayersPerServer} players`);
            logger.info(`📡 WebSocket server listening on port ${PORT}`);
            
            if (process.env.NODE_ENV === 'development') {
                logger.info(`📚 API Documentation available at http://localhost:${PORT}/api-docs`);
            }
        });

        // Schedule periodic tasks
        const backupService = new BackupService();
        setInterval(() => backupService.performBackup(), 24 * 60 * 60 * 1000); // Daily backup

        // Performance monitoring
        setInterval(() => {
            const usage = process.memoryUsage();
            logger.info('Memory Usage:', {
                rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
                heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
                heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
                external: `${Math.round(usage.external / 1024 / 1024)}MB`
            });
        }, 60000); // Every minute

    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Initialize and start
startServer();