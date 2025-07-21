import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import axios from 'axios'
import io from 'socket.io-client'

// Components
import App from './App.vue'

// Stores
import { useAuthStore } from './stores/auth'
import { useGameStore } from './stores/game'
import { usePlayerStore } from './stores/player'
import { useUIStore } from './stores/ui'

// Views
import HomeView from './views/HomeView.vue'
import LoginView from './views/LoginView.vue'
import RegisterView from './views/RegisterView.vue'
import CharacterCreationView from './views/CharacterCreationView.vue'
import GameView from './views/GameView.vue'
import WorldMapView from './views/WorldMapView.vue'
import InventoryView from './views/InventoryView.vue'
import CharacterView from './views/CharacterView.vue'
import QuestLogView from './views/QuestLogView.vue'
import GuildView from './views/GuildView.vue'
import MarketplaceView from './views/MarketplaceView.vue'
import CraftingView from './views/CraftingView.vue'
import AchievementsView from './views/AchievementsView.vue'
import LeaderboardView from './views/LeaderboardView.vue'
import SettingsView from './views/SettingsView.vue'
import HelpView from './views/HelpView.vue'

// CSS
import './assets/main.css'
import './assets/game.css'
import './assets/ui.css'

// Configure axios
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
axios.defaults.withCredentials = true

// Setup router
const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView,
    meta: { requiresAuth: false }
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { requiresAuth: false, redirectIfAuth: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterView,
    meta: { requiresAuth: false, redirectIfAuth: true }
  },
  {
    path: '/character-creation',
    name: 'CharacterCreation',
    component: CharacterCreationView,
    meta: { requiresAuth: true, requiresNoCharacter: true }
  },
  {
    path: '/game',
    name: 'Game',
    component: GameView,
    meta: { requiresAuth: true, requiresCharacter: true },
    children: [
      {
        path: '',
        redirect: '/game/world'
      },
      {
        path: 'world',
        name: 'World',
        component: WorldMapView
      },
      {
        path: 'inventory',
        name: 'Inventory',
        component: InventoryView
      },
      {
        path: 'character',
        name: 'Character',
        component: CharacterView
      },
      {
        path: 'quests',
        name: 'Quests',
        component: QuestLogView
      },
      {
        path: 'guild',
        name: 'Guild',
        component: GuildView
      },
      {
        path: 'marketplace',
        name: 'Marketplace',
        component: MarketplaceView
      },
      {
        path: 'crafting',
        name: 'Crafting',
        component: CraftingView
      },
      {
        path: 'achievements',
        name: 'Achievements',
        component: AchievementsView
      },
      {
        path: 'leaderboard',
        name: 'Leaderboard',
        component: LeaderboardView
      },
      {
        path: 'settings',
        name: 'Settings',
        component: SettingsView
      },
      {
        path: 'help',
        name: 'Help',
        component: HelpView
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Create app
const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Setup global properties
app.config.globalProperties.$http = axios
app.config.globalProperties.$socket = null

// Router guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const gameStore = useGameStore()
  
  // Check if route requires authentication
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
    return
  }
  
  // Redirect authenticated users away from login/register
  if (to.meta.redirectIfAuth && authStore.isAuthenticated) {
    next('/game')
    return
  }
  
  // Check if route requires character
  if (to.meta.requiresCharacter && !authStore.hasCharacter) {
    next('/character-creation')
    return
  }
  
  // Check if route requires no character
  if (to.meta.requiresNoCharacter && authStore.hasCharacter) {
    next('/game')
    return
  }
  
  next()
})

// Initialize socket connection when authenticated
const initializeSocket = () => {
  const authStore = useAuthStore()
  const gameStore = useGameStore()
  const playerStore = usePlayerStore()
  const uiStore = useUIStore()
  
  if (!authStore.token) return
  
  console.log('🔌 Connecting to game server...')
  
  const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001', {
    auth: {
      token: authStore.token
    },
    transports: ['websocket', 'polling']
  })
  
  // Connection events
  socket.on('connect', () => {
    console.log('✅ Connected to game server')
    gameStore.setConnectionStatus('connected')
    app.config.globalProperties.$socket = socket
  })
  
  socket.on('disconnect', () => {
    console.log('❌ Disconnected from game server')
    gameStore.setConnectionStatus('disconnected')
    uiStore.showNotification('Disconnected from server', 'error')
  })
  
  socket.on('connect_error', (error) => {
    console.error('❌ Connection error:', error)
    gameStore.setConnectionStatus('error')
    uiStore.showNotification('Failed to connect to server', 'error')
  })
  
  // Authentication events
  socket.on('connectionSuccess', (data) => {
    console.log('🎮 Game connection established')
    playerStore.setPlayerData(data.player)
    gameStore.setWorldTime(data.worldTime)
    gameStore.setServerBoosts(data.serverBoosts)
    uiStore.showNotification('Welcome to Epic Online Adventure!', 'success')
  })
  
  socket.on('connectionError', (data) => {
    console.error('🔒 Authentication failed:', data.message)
    authStore.logout()
    uiStore.showNotification(data.message, 'error')
  })
  
  // Player events
  socket.on('experienceGained', (data) => {
    playerStore.addExperience(data.amount)
    uiStore.showFloatingText(`+${data.amount} XP`, 'experience')
  })
  
  socket.on('levelUp', (data) => {
    playerStore.levelUp(data)
    uiStore.showNotification(`Level Up! You are now level ${data.newLevel}!`, 'success')
    uiStore.showLevelUpDialog(data)
  })
  
  socket.on('goldChanged', (data) => {
    playerStore.updateGold(data.total)
    if (data.amount > 0) {
      uiStore.showFloatingText(`+${data.amount} Gold`, 'gold')
    }
  })
  
  // World events
  socket.on('worldTimeUpdate', (worldTime) => {
    gameStore.setWorldTime(worldTime)
  })
  
  socket.on('serverStats', (stats) => {
    gameStore.setServerStats(stats)
  })
  
  socket.on('newDay', (worldTime) => {
    gameStore.setWorldTime(worldTime)
    uiStore.showNotification(`A new day has begun! Day ${worldTime.day}, ${worldTime.season}`, 'info')
  })
  
  // Global events
  socket.on('globalEventStarted', (event) => {
    gameStore.addActiveEvent(event)
    uiStore.showNotification(`Global Event: ${event.name} has started!`, 'event')
  })
  
  socket.on('globalEventEnded', (data) => {
    gameStore.removeActiveEvent(data.eventId)
    uiStore.showNotification(`Global Event: ${data.event.name} has ended!`, 'info')
  })
  
  socket.on('globalEventUpdate', (data) => {
    gameStore.updateActiveEvent(data.eventId, data)
  })
  
  // World boss events
  socket.on('worldBossSpawned', (boss) => {
    gameStore.setWorldBoss(boss)
    uiStore.showNotification(`World Boss ${boss.name} has appeared!`, 'boss')
  })
  
  socket.on('worldBossDefeated', (data) => {
    gameStore.clearWorldBoss()
    uiStore.showNotification(`World Boss ${data.boss.name} has been defeated!`, 'success')
  })
  
  // Player interaction events
  socket.on('playerJoined', (player) => {
    gameStore.addNearbyPlayer(player)
    uiStore.showFloatingText(`${player.name} joined the area`, 'info')
  })
  
  socket.on('playerLeft', (player) => {
    gameStore.removeNearbyPlayer(player.id)
  })
  
  socket.on('playerMoved', (data) => {
    gameStore.updatePlayerLocation(data.playerId, data.location)
  })
  
  socket.on('playerLevelUp', (data) => {
    uiStore.showFloatingText(`${data.name} reached level ${data.newLevel}!`, 'levelup')
  })
  
  // Chat events
  socket.on('chatMessage', (message) => {
    gameStore.addChatMessage(message)
  })
  
  socket.on('systemMessage', (message) => {
    gameStore.addSystemMessage(message)
  })
  
  // Combat events
  socket.on('combatStarted', (combatData) => {
    gameStore.startCombat(combatData)
  })
  
  socket.on('combatEnded', (result) => {
    gameStore.endCombat(result)
  })
  
  socket.on('combatUpdate', (update) => {
    gameStore.updateCombat(update)
  })
  
  // Trading events
  socket.on('tradeRequest', (request) => {
    uiStore.showTradeRequest(request)
  })
  
  socket.on('tradeStarted', (tradeData) => {
    gameStore.startTrade(tradeData)
  })
  
  socket.on('tradeEnded', () => {
    gameStore.endTrade()
  })
  
  // Guild events
  socket.on('guildInvite', (invite) => {
    uiStore.showGuildInvite(invite)
  })
  
  socket.on('guildUpdate', (guildData) => {
    playerStore.updateGuild(guildData)
  })
  
  // Quest events
  socket.on('questUpdate', (quest) => {
    playerStore.updateQuest(quest)
  })
  
  socket.on('questCompleted', (quest) => {
    playerStore.completeQuest(quest)
    uiStore.showNotification(`Quest completed: ${quest.name}`, 'success')
  })
  
  // Achievement events
  socket.on('achievementUnlocked', (achievement) => {
    playerStore.unlockAchievement(achievement)
    uiStore.showAchievementUnlock(achievement)
  })
  
  // Server boost events
  socket.on('serverBoostAdded', (boost) => {
    gameStore.addServerBoost(boost)
    uiStore.showNotification(`Server Boost: ${boost.name} is now active!`, 'boost')
  })
  
  socket.on('serverBoostRemoved', (boostId) => {
    gameStore.removeServerBoost(boostId)
  })
  
  // Error handling
  socket.on('error', (error) => {
    console.error('🚨 Socket error:', error)
    uiStore.showNotification('An error occurred', 'error')
  })
  
  // Store socket reference
  gameStore.setSocket(socket)
}

// Initialize app
const init = async () => {
  try {
    const authStore = useAuthStore()
    
    // Try to restore authentication state
    await authStore.initializeAuth()
    
    // Connect to game server if authenticated
    if (authStore.isAuthenticated) {
      initializeSocket()
    }
    
    // Mount app
    app.mount('#app')
    
    console.log('🚀 Epic Online Adventure client initialized!')
    
  } catch (error) {
    console.error('❌ Failed to initialize app:', error)
  }
}

// Global error handler
app.config.errorHandler = (error, instance, info) => {
  console.error('🚨 Global error:', error, info)
  const uiStore = useUIStore()
  uiStore.showNotification('An unexpected error occurred', 'error')
}

// Start the application
init()

// Expose socket initialization for auth store
window.initializeSocket = initializeSocket

// Hot reload support
if (import.meta.hot) {
  import.meta.hot.on('vite:beforeUpdate', () => {
    console.log('🔄 Hot reloading...')
  })
}