import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import mongoose from 'mongoose'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import cron from 'node-cron'

// Импортируем маршруты
import authRoutes from './routes/auth.js'
import gameRoutes from './routes/game.js'
import userRoutes from './routes/user.js'
import characterRoutes from './routes/character.js'
import guildRoutes from './routes/guild.js'
import shopRoutes from './routes/shop.js'
import leaderboardRoutes from './routes/leaderboard.js'
import adminRoutes from './routes/admin.js'
import errorRoutes from './routes/errors.js'

// Импортируем игровые системы
import { GameWorld } from './game/GameWorld.js'
import { PlayerManager } from './game/PlayerManager.js'
import { CombatSystem } from './game/CombatSystem.js'
import { QuestSystem } from './game/QuestSystem.js'
import { GuildSystem } from './game/GuildSystem.js'
import { EconomySystem } from './game/EconomySystem.js'
import { PvPSystem } from './game/PvPSystem.js'
import { DungeonSystem } from './game/DungeonSystem.js'
import { ChatSystem } from './game/ChatSystem.js'
import { EventSystem } from './game/EventSystem.js'

// Импортируем middleware
import { authenticateSocket } from './middleware/socketAuth.js'
import { rateLimitSocket } from './middleware/socketRateLimit.js'
import { validateSocketData } from './middleware/socketValidation.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Загружаем переменные окружения
dotenv.config()

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL 
      : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
})

const PORT = process.env.PORT || 3001
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/eternal-realms'

// Инициализируем игровые системы
const gameWorld = new GameWorld()
const playerManager = new PlayerManager(io)
const combatSystem = new CombatSystem(gameWorld, playerManager)
const questSystem = new QuestSystem(gameWorld, playerManager)
const guildSystem = new GuildSystem(playerManager)
const economySystem = new EconomySystem(gameWorld)
const pvpSystem = new PvPSystem(gameWorld, playerManager, combatSystem)
const dungeonSystem = new DungeonSystem(gameWorld, playerManager, combatSystem)
const chatSystem = new ChatSystem(io, playerManager)
const eventSystem = new EventSystem(io, gameWorld)

// Middleware для Express
app.use(helmet({
  contentSecurityPolicy: false, // Отключаем для разработки
  crossOriginEmbedderPolicy: false
}))

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}))

app.use(compression())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // лимит запросов
  message: {
    error: 'Слишком много запросов с этого IP. Попробуйте позже.'
  },
  standardHeaders: true,
  legacyHeaders: false
})

app.use('/api/', limiter)

// Статические файлы
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')))
}

// API маршруты
app.use('/api/auth', authRoutes)
app.use('/api/game', gameRoutes)
app.use('/api/users', userRoutes)
app.use('/api/characters', characterRoutes)
app.use('/api/guilds', guildRoutes)
app.use('/api/shop', shopRoutes)
app.use('/api/leaderboards', leaderboardRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/errors', errorRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    players: playerManager.getOnlinePlayersCount(),
    timestamp: new Date().toISOString()
  })
})

// Game stats endpoint
app.get('/api/stats', (req, res) => {
  res.json({
    players: {
      online: playerManager.getOnlinePlayersCount(),
      total: playerManager.getTotalPlayersCount(),
      inCombat: combatSystem.getActiveCombatsCount(),
      inDungeons: dungeonSystem.getActiveDungeonsCount()
    },
    world: {
      activeEvents: eventSystem.getActiveEventsCount(),
      worldBosses: gameWorld.getActiveBossesCount(),
      guilds: guildSystem.getGuildsCount()
    },
    economy: {
      totalGold: economySystem.getTotalGold(),
      totalItems: economySystem.getTotalItems(),
      activeTrades: economySystem.getActiveTradesCount()
    }
  })
})

// WebSocket обработчики
io.use(authenticateSocket)
io.use(rateLimitSocket)
io.use(validateSocketData)

io.on('connection', async (socket) => {
  const userId = socket.userData?.userId
  const username = socket.userData?.username

  console.log(`🎮 Игрок подключился: ${username} (${userId})`)

  try {
    // Регистрируем игрока в системе
    await playerManager.addPlayer(socket, userId, username)

    // Базовые обработчики событий
    socket.on('disconnect', async (reason) => {
      console.log(`👋 Игрок отключился: ${username} (${reason})`)
      await playerManager.removePlayer(userId)
    })

    // Игровые события
    socket.on('player:move', (data) => {
      playerManager.handlePlayerMove(userId, data)
    })

    socket.on('player:action', (data) => {
      playerManager.handlePlayerAction(userId, data)
    })

    socket.on('combat:attack', (data) => {
      combatSystem.handleAttack(userId, data)
    })

    socket.on('combat:defend', (data) => {
      combatSystem.handleDefend(userId, data)
    })

    socket.on('combat:useSkill', (data) => {
      combatSystem.handleUseSkill(userId, data)
    })

    // Квесты
    socket.on('quest:accept', (data) => {
      questSystem.acceptQuest(userId, data.questId)
    })

    socket.on('quest:complete', (data) => {
      questSystem.completeQuest(userId, data.questId)
    })

    socket.on('quest:abandon', (data) => {
      questSystem.abandonQuest(userId, data.questId)
    })

    // Гильдии
    socket.on('guild:create', (data) => {
      guildSystem.createGuild(userId, data)
    })

    socket.on('guild:join', (data) => {
      guildSystem.joinGuild(userId, data.guildId)
    })

    socket.on('guild:leave', () => {
      guildSystem.leaveGuild(userId)
    })

    socket.on('guild:invite', (data) => {
      guildSystem.invitePlayer(userId, data.targetUserId)
    })

    // Торговля
    socket.on('trade:request', (data) => {
      economySystem.requestTrade(userId, data.targetUserId)
    })

    socket.on('trade:accept', (data) => {
      economySystem.acceptTrade(userId, data.tradeId)
    })

    socket.on('trade:addItem', (data) => {
      economySystem.addItemToTrade(userId, data.tradeId, data.itemId, data.quantity)
    })

    // PvP
    socket.on('pvp:challenge', (data) => {
      pvpSystem.challengePlayer(userId, data.targetUserId)
    })

    socket.on('pvp:acceptChallenge', (data) => {
      pvpSystem.acceptChallenge(userId, data.challengeId)
    })

    socket.on('pvp:enterArena', (data) => {
      pvpSystem.enterArena(userId, data.arenaType)
    })

    // Подземелья
    socket.on('dungeon:enter', (data) => {
      dungeonSystem.enterDungeon(userId, data.dungeonId)
    })

    socket.on('dungeon:leave', () => {
      dungeonSystem.leaveDungeon(userId)
    })

    // Чат
    socket.on('chat:message', (data) => {
      chatSystem.handleMessage(userId, data)
    })

    socket.on('chat:whisper', (data) => {
      chatSystem.handleWhisper(userId, data.targetUsername, data.message)
    })

    // События
    socket.on('event:participate', (data) => {
      eventSystem.participateInEvent(userId, data.eventId)
    })

    // Обработка ошибок
    socket.on('error', (error) => {
      console.error(`❌ Ошибка WebSocket для ${username}:`, error)
    })

    // Уведомляем о подключении
    socket.emit('connected', {
      message: 'Добро пожаловать в ETERNAL REALMS!',
      timestamp: new Date().toISOString(),
      serverVersion: '1.0.0'
    })

  } catch (error) {
    console.error(`💥 Ошибка при подключении игрока ${username}:`, error)
    socket.emit('error', {
      message: 'Ошибка подключения к игре',
      code: 'CONNECTION_ERROR'
    })
    socket.disconnect(true)
  }
})

// Подключение к MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})

mongoose.connection.on('connected', () => {
  console.log('✅ Подключено к MongoDB')
})

mongoose.connection.on('error', (error) => {
  console.error('❌ Ошибка MongoDB:', error)
})

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ Отключено от MongoDB')
})

// Периодические задачи
// Сохранение состояния игры каждые 5 минут
cron.schedule('*/5 * * * *', async () => {
  try {
    console.log('💾 Автосохранение состояния игры...')
    await gameWorld.saveState()
    await playerManager.saveAllPlayers()
    console.log('✅ Состояние игры сохранено')
  } catch (error) {
    console.error('❌ Ошибка автосохранения:', error)
  }
})

// Очистка неактивных сессий каждый час
cron.schedule('0 * * * *', async () => {
  try {
    console.log('🧹 Очистка неактивных сессий...')
    await playerManager.cleanupInactiveSessions()
    await chatSystem.cleanupOldMessages()
    console.log('✅ Очистка завершена')
  } catch (error) {
    console.error('❌ Ошибка очистки:', error)
  }
})

// Глобальные события каждые 30 минут
cron.schedule('*/30 * * * *', async () => {
  try {
    console.log('🎪 Запуск случайного глобального события...')
    await eventSystem.triggerRandomEvent()
  } catch (error) {
    console.error('❌ Ошибка запуска события:', error)
  }
})

// Обновление экономики каждые 15 минут
cron.schedule('*/15 * * * *', async () => {
  try {
    await economySystem.updateMarketPrices()
    await economySystem.processAuctions()
  } catch (error) {
    console.error('❌ Ошибка обновления экономики:', error)
  }
})

// Обработка завершения процесса
process.on('SIGTERM', async () => {
  console.log('🔄 Получен сигнал SIGTERM, корректное завершение...')
  await gracefulShutdown()
})

process.on('SIGINT', async () => {
  console.log('🔄 Получен сигнал SIGINT, корректное завершение...')
  await gracefulShutdown()
})

async function gracefulShutdown() {
  try {
    console.log('💾 Сохранение состояния игры...')
    await gameWorld.saveState()
    await playerManager.saveAllPlayers()
    
    console.log('🔌 Отключение игроков...')
    io.emit('server:shutdown', {
      message: 'Сервер перезагружается. Переподключение через 30 секунд.',
      countdown: 30
    })
    
    setTimeout(() => {
      io.close()
      server.close(() => {
        console.log('✅ Сервер корректно завершен')
        process.exit(0)
      })
    }, 5000)
    
  } catch (error) {
    console.error('❌ Ошибка при завершении:', error)
    process.exit(1)
  }
}

// Запуск сервера
server.listen(PORT, () => {
  console.log(`🚀 ETERNAL REALMS сервер запущен на порту ${PORT}`)
  console.log(`🌍 Режим: ${process.env.NODE_ENV || 'development'}`)
  console.log(`📊 MongoDB: ${MONGODB_URI}`)
  console.log(`⏰ Время запуска: ${new Date().toISOString()}`)
})

// Отправляем SPA для всех неизвестных маршрутов в продакшене
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'))
  })
}

export { io, gameWorld, playerManager }