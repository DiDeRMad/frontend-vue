import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import cron from 'node-cron';
import path from 'path';
import { fileURLToPath } from 'url';

// Game modules
import { GameEngine } from './game/GameEngine.js';
import { PlayerManager } from './game/PlayerManager.js';
import { WorldManager } from './game/WorldManager.js';
import { CombatSystem } from './game/CombatSystem.js';
import { QuestManager } from './game/QuestManager.js';
import { GuildSystem } from './game/GuildSystem.js';
import { EconomyManager } from './game/EconomyManager.js';
import { EventManager } from './game/EventManager.js';
import { DungeonManager } from './game/DungeonManager.js';
import { AchievementSystem } from './game/AchievementSystem.js';
import { PvPManager } from './game/PvPManager.js';
import { ChatSystem } from './game/ChatSystem.js';
import { WeatherSystem } from './game/WeatherSystem.js';
import { CraftingSystem } from './game/CraftingSystem.js';
import { AuctionHouse } from './game/AuctionHouse.js';
import { PetSystem } from './game/PetSystem.js';
import { MountSystem } from './game/MountSystem.js';
import { HousingSystem } from './game/HousingSystem.js';
import { FishingSystem } from './game/FishingSystem.js';
import { MiningSystem } from './game/MiningSystem.js';
import { AlchemySystem } from './game/AlchemySystem.js';
import { EnchantingSystem } from './game/EnchantingSystem.js';
import { TradingSystem } from './game/TradingSystem.js';
import { FriendSystem } from './game/FriendSystem.js';
import { MailSystem } from './game/MailSystem.js';
import { CalendarSystem } from './game/CalendarSystem.js';
import { TournamentSystem } from './game/TournamentSystem.js';
import { RaidSystem } from './game/RaidSystem.js';
import { ArenaSystem } from './game/ArenaSystem.js';
import { BattlegroundSystem } from './game/BattlegroundSystem.js';
import { MentorshipSystem } from './game/MentorshipSystem.js';
import { LootSystem } from './game/LootSystem.js';
import { BuffSystem } from './game/BuffSystem.js';
import { StatusEffectManager } from './game/StatusEffectManager.js';
import { SkillTreeSystem } from './game/SkillTreeSystem.js';
import { TalentSystem } from './game/TalentSystem.js';
import { ReputationSystem } from './game/ReputationSystem.js';
import { FactionSystem } from './game/FactionSystem.js';
import { BountySystem } from './game/BountySystem.js';
import { CriminalSystem } from './game/CriminalSystem.js';
import { RankingSystem } from './game/RankingSystem.js';
import { LeaderboardManager } from './game/LeaderboardManager.js';
import { StatisticsManager } from './game/StatisticsManager.js';
import { AnalyticsManager } from './game/AnalyticsManager.js';
import { ModeratorTools } from './game/ModeratorTools.js';
import { AdminPanel } from './game/AdminPanel.js';
import { SecurityManager } from './game/SecurityManager.js';
import { BackupManager } from './game/BackupManager.js';
import { LoggingSystem } from './game/LoggingSystem.js';
import { PerformanceMonitor } from './game/PerformanceMonitor.js';
import { LoadBalancer } from './game/LoadBalancer.js';
import { CacheManager } from './game/CacheManager.js';
import { ConfigManager } from './game/ConfigManager.js';
import { DatabaseManager } from './database/DatabaseManager.js';
import { AuthManager } from './auth/AuthManager.js';
import { SessionManager } from './auth/SessionManager.js';
import { ApiRoutes } from './routes/ApiRoutes.js';
import { GameRoutes } from './routes/GameRoutes.js';
import { AdminRoutes } from './routes/AdminRoutes.js';
import { SocketHandlers } from './socket/SocketHandlers.js';
import { GameSocketEvents } from './socket/GameSocketEvents.js';
import { ConnectionManager } from './socket/ConnectionManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class GameServer {
    constructor() {
        this.app = express();
        this.server = createServer(this.app);
        this.io = new Server(this.server, {
            cors: {
                origin: process.env.CLIENT_URL || "http://localhost:5173",
                methods: ["GET", "POST"],
                credentials: true
            },
            transports: ['websocket', 'polling']
        });
        
        this.port = process.env.PORT || 3001;
        this.isProduction = process.env.NODE_ENV === 'production';
        
        // Rate limiters
        this.rateLimiters = {
            login: new RateLimiterMemory({
                keyPrefix: 'login_fail_ip',
                points: 5,
                duration: 900, // 15 minutes
            }),
            api: new RateLimiterMemory({
                keyPrefix: 'api_calls',
                points: 100,
                duration: 60, // 1 minute
            }),
            socket: new RateLimiterMemory({
                keyPrefix: 'socket_events',
                points: 30,
                duration: 1, // 1 second
            })
        };
        
        // Game systems
        this.gameEngine = null;
        this.playerManager = null;
        this.worldManager = null;
        this.combatSystem = null;
        this.questManager = null;
        this.guildSystem = null;
        this.economyManager = null;
        this.eventManager = null;
        this.dungeonManager = null;
        this.achievementSystem = null;
        this.pvpManager = null;
        this.chatSystem = null;
        this.weatherSystem = null;
        this.craftingSystem = null;
        this.auctionHouse = null;
        this.petSystem = null;
        this.mountSystem = null;
        this.housingSystem = null;
        this.fishingSystem = null;
        this.miningSystem = null;
        this.alchemySystem = null;
        this.enchantingSystem = null;
        this.tradingSystem = null;
        this.friendSystem = null;
        this.mailSystem = null;
        this.calendarSystem = null;
        this.tournamentSystem = null;
        this.raidSystem = null;
        this.arenaSystem = null;
        this.battlegroundSystem = null;
        this.mentorshipSystem = null;
        this.lootSystem = null;
        this.buffSystem = null;
        this.statusEffectManager = null;
        this.skillTreeSystem = null;
        this.talentSystem = null;
        this.reputationSystem = null;
        this.factionSystem = null;
        this.bountySystem = null;
        this.criminalSystem = null;
        this.rankingSystem = null;
        this.leaderboardManager = null;
        this.statisticsManager = null;
        this.analyticsManager = null;
        this.moderatorTools = null;
        this.adminPanel = null;
        this.securityManager = null;
        this.backupManager = null;
        this.loggingSystem = null;
        this.performanceMonitor = null;
        this.loadBalancer = null;
        this.cacheManager = null;
        this.configManager = null;
        this.databaseManager = null;
        this.authManager = null;
        this.sessionManager = null;
        this.connectionManager = null;
        
        this.connectedPlayers = new Map();
        this.gameRooms = new Map();
        this.activeGames = new Map();
    }

    async initialize() {
        try {
            console.log('🎮 Initializing Epic Online Adventure Server...');
            
            // Initialize configuration
            this.configManager = new ConfigManager();
            await this.configManager.initialize();
            
            // Initialize database
            this.databaseManager = new DatabaseManager();
            await this.databaseManager.connect();
            
            // Initialize logging system
            this.loggingSystem = new LoggingSystem();
            await this.loggingSystem.initialize();
            
            // Initialize security
            this.securityManager = new SecurityManager();
            await this.securityManager.initialize();
            
            // Initialize cache
            this.cacheManager = new CacheManager();
            await this.cacheManager.initialize();
            
            // Initialize authentication
            this.authManager = new AuthManager();
            this.sessionManager = new SessionManager();
            
            // Initialize performance monitoring
            this.performanceMonitor = new PerformanceMonitor();
            await this.performanceMonitor.initialize();
            
            // Initialize backup system
            this.backupManager = new BackupManager();
            await this.backupManager.initialize();
            
            // Initialize game systems
            await this.initializeGameSystems();
            
            // Setup Express middleware
            this.setupMiddleware();
            
            // Setup routes
            this.setupRoutes();
            
            // Setup Socket.IO
            this.setupSocketHandlers();
            
            // Setup scheduled tasks
            this.setupScheduledTasks();
            
            console.log('✅ Server initialization complete!');
            
        } catch (error) {
            console.error('❌ Server initialization failed:', error);
            process.exit(1);
        }
    }

    async initializeGameSystems() {
        console.log('🎯 Initializing game systems...');
        
        // Core systems
        this.gameEngine = new GameEngine(this.io);
        this.playerManager = new PlayerManager(this.io);
        this.worldManager = new WorldManager(this.io);
        this.eventManager = new EventManager(this.io);
        this.connectionManager = new ConnectionManager(this.io);
        
        // Combat and progression
        this.combatSystem = new CombatSystem(this.io);
        this.lootSystem = new LootSystem(this.io);
        this.buffSystem = new BuffSystem(this.io);
        this.statusEffectManager = new StatusEffectManager(this.io);
        this.skillTreeSystem = new SkillTreeSystem(this.io);
        this.talentSystem = new TalentSystem(this.io);
        
        // Quests and content
        this.questManager = new QuestManager(this.io);
        this.dungeonManager = new DungeonManager(this.io);
        this.raidSystem = new RaidSystem(this.io);
        this.achievementSystem = new AchievementSystem(this.io);
        
        // Social systems
        this.guildSystem = new GuildSystem(this.io);
        this.chatSystem = new ChatSystem(this.io);
        this.friendSystem = new FriendSystem(this.io);
        this.mailSystem = new MailSystem(this.io);
        this.mentorshipSystem = new MentorshipSystem(this.io);
        
        // PvP systems
        this.pvpManager = new PvPManager(this.io);
        this.arenaSystem = new ArenaSystem(this.io);
        this.battlegroundSystem = new BattlegroundSystem(this.io);
        this.tournamentSystem = new TournamentSystem(this.io);
        
        // Economy and trading
        this.economyManager = new EconomyManager(this.io);
        this.tradingSystem = new TradingSystem(this.io);
        this.auctionHouse = new AuctionHouse(this.io);
        this.craftingSystem = new CraftingSystem(this.io);
        this.alchemySystem = new AlchemySystem(this.io);
        this.enchantingSystem = new EnchantingSystem(this.io);
        
        // Life skills
        this.fishingSystem = new FishingSystem(this.io);
        this.miningSystem = new MiningSystem(this.io);
        
        // Companions and housing
        this.petSystem = new PetSystem(this.io);
        this.mountSystem = new MountSystem(this.io);
        this.housingSystem = new HousingSystem(this.io);
        
        // World systems
        this.weatherSystem = new WeatherSystem(this.io);
        this.calendarSystem = new CalendarSystem(this.io);
        
        // Reputation and factions
        this.reputationSystem = new ReputationSystem(this.io);
        this.factionSystem = new FactionSystem(this.io);
        this.bountySystem = new BountySystem(this.io);
        this.criminalSystem = new CriminalSystem(this.io);
        
        // Rankings and statistics
        this.rankingSystem = new RankingSystem(this.io);
        this.leaderboardManager = new LeaderboardManager(this.io);
        this.statisticsManager = new StatisticsManager(this.io);
        this.analyticsManager = new AnalyticsManager(this.io);
        
        // Administration
        this.moderatorTools = new ModeratorTools(this.io);
        this.adminPanel = new AdminPanel(this.io);
        
        // Load balancing
        this.loadBalancer = new LoadBalancer(this.io);
        
        // Initialize all systems
        await Promise.all([
            this.gameEngine.initialize(),
            this.playerManager.initialize(),
            this.worldManager.initialize(),
            this.combatSystem.initialize(),
            this.questManager.initialize(),
            this.guildSystem.initialize(),
            this.economyManager.initialize(),
            this.eventManager.initialize(),
            this.dungeonManager.initialize(),
            this.achievementSystem.initialize(),
            this.pvpManager.initialize(),
            this.chatSystem.initialize(),
            this.weatherSystem.initialize(),
            this.craftingSystem.initialize(),
            this.auctionHouse.initialize(),
            this.petSystem.initialize(),
            this.mountSystem.initialize(),
            this.housingSystem.initialize(),
            this.fishingSystem.initialize(),
            this.miningSystem.initialize(),
            this.alchemySystem.initialize(),
            this.enchantingSystem.initialize(),
            this.tradingSystem.initialize(),
            this.friendSystem.initialize(),
            this.mailSystem.initialize(),
            this.calendarSystem.initialize(),
            this.tournamentSystem.initialize(),
            this.raidSystem.initialize(),
            this.arenaSystem.initialize(),
            this.battlegroundSystem.initialize(),
            this.mentorshipSystem.initialize(),
            this.lootSystem.initialize(),
            this.buffSystem.initialize(),
            this.statusEffectManager.initialize(),
            this.skillTreeSystem.initialize(),
            this.talentSystem.initialize(),
            this.reputationSystem.initialize(),
            this.factionSystem.initialize(),
            this.bountySystem.initialize(),
            this.criminalSystem.initialize(),
            this.rankingSystem.initialize(),
            this.leaderboardManager.initialize(),
            this.statisticsManager.initialize(),
            this.analyticsManager.initialize(),
            this.moderatorTools.initialize(),
            this.adminPanel.initialize(),
            this.loadBalancer.initialize(),
            this.connectionManager.initialize()
        ]);
        
        console.log('✅ All game systems initialized!');
    }

    setupMiddleware() {
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                    fontSrc: ["'self'", "https://fonts.gstatic.com"],
                    imgSrc: ["'self'", "data:", "https:"],
                    scriptSrc: ["'self'"],
                },
            },
        }));
        
        this.app.use(compression());
        this.app.use(cors({
            origin: process.env.CLIENT_URL || "http://localhost:5173",
            credentials: true
        }));
        
        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // limit each IP to 100 requests per windowMs
            message: 'Too many requests from this IP, please try again later.'
        });
        this.app.use('/api/', limiter);
        
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
        
        // Serve static files in production
        if (this.isProduction) {
            this.app.use(express.static(path.join(__dirname, '../dist')));
        }
        
        // Request logging
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
            next();
        });
    }

    setupRoutes() {
        // API routes
        this.app.use('/api', new ApiRoutes(this).router);
        this.app.use('/api/game', new GameRoutes(this).router);
        this.app.use('/api/admin', new AdminRoutes(this).router);
        
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'ok',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                players: this.connectedPlayers.size,
                rooms: this.gameRooms.size
            });
        });
        
        // Serve client app in production
        if (this.isProduction) {
            this.app.get('*', (req, res) => {
                res.sendFile(path.join(__dirname, '../dist/index.html'));
            });
        }
    }

    setupSocketHandlers() {
        const socketHandlers = new SocketHandlers(this);
        const gameSocketEvents = new GameSocketEvents(this);
        
        this.io.on('connection', (socket) => {
            console.log(`🔌 Player connected: ${socket.id}`);
            
            // Setup all socket event handlers
            socketHandlers.setupHandlers(socket);
            gameSocketEvents.setupHandlers(socket);
            
            // Handle disconnection
            socket.on('disconnect', () => {
                console.log(`🔌 Player disconnected: ${socket.id}`);
                this.handlePlayerDisconnect(socket);
            });
        });
    }

    setupScheduledTasks() {
        // Game world updates every second
        cron.schedule('* * * * * *', () => {
            this.gameEngine.update();
        });
        
        // Save player data every 5 minutes
        cron.schedule('*/5 * * * *', () => {
            this.playerManager.saveAllPlayers();
        });
        
        // Update weather every 30 minutes
        cron.schedule('*/30 * * * *', () => {
            this.weatherSystem.updateWeather();
        });
        
        // Reset daily quests at midnight
        cron.schedule('0 0 * * *', () => {
            this.questManager.resetDailyQuests();
        });
        
        // Weekly guild events on Sunday
        cron.schedule('0 0 * * 0', () => {
            this.guildSystem.weeklyReset();
        });
        
        // Monthly rankings update
        cron.schedule('0 0 1 * *', () => {
            this.rankingSystem.monthlyReset();
        });
        
        // Database backup every 6 hours
        cron.schedule('0 */6 * * *', () => {
            this.backupManager.createBackup();
        });
        
        // Performance monitoring every minute
        cron.schedule('* * * * *', () => {
            this.performanceMonitor.collectMetrics();
        });
        
        // Auction house cleanup every hour
        cron.schedule('0 * * * *', () => {
            this.auctionHouse.cleanupExpiredAuctions();
        });
        
        // Tournament scheduling
        cron.schedule('0 18 * * 6', () => { // Saturday 6 PM
            this.tournamentSystem.startWeeklyTournament();
        });
        
        // Raid resets on Tuesday
        cron.schedule('0 0 * * 2', () => {
            this.raidSystem.weeklyReset();
        });
    }

    async handlePlayerDisconnect(socket) {
        const playerId = socket.playerId;
        if (playerId) {
            await this.playerManager.handlePlayerDisconnect(playerId);
            this.connectedPlayers.delete(socket.id);
            
            // Notify other players
            socket.broadcast.emit('playerDisconnected', { playerId });
        }
    }

    async start() {
        await this.initialize();
        
        this.server.listen(this.port, () => {
            console.log(`🚀 Epic Online Adventure Server running on port ${this.port}`);
            console.log(`🌍 Environment: ${this.isProduction ? 'Production' : 'Development'}`);
            console.log(`📊 Memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
        });
        
        // Graceful shutdown
        process.on('SIGTERM', () => this.shutdown());
        process.on('SIGINT', () => this.shutdown());
    }

    async shutdown() {
        console.log('🛑 Shutting down server...');
        
        // Save all player data
        await this.playerManager.saveAllPlayers();
        
        // Close database connections
        await this.databaseManager.disconnect();
        
        // Create final backup
        await this.backupManager.createBackup();
        
        this.server.close(() => {
            console.log('✅ Server shutdown complete');
            process.exit(0);
        });
    }
}

// Start the server
const gameServer = new GameServer();
gameServer.start().catch(console.error);