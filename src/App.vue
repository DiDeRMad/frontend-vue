<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'

// Stores
import { useAuthStore } from './stores/auth'
import { useGameStore } from './stores/game'
import { usePlayerStore } from './stores/player'
import { useUIStore } from './stores/ui'
import { useSettingsStore } from './stores/settings'

// Components
import LoadingScreen from './components/ui/LoadingScreen.vue'
import AppHeader from './components/layout/AppHeader.vue'
import AppFooter from './components/layout/AppFooter.vue'
import NotificationSystem from './components/ui/NotificationSystem.vue'
import FloatingTextSystem from './components/ui/FloatingTextSystem.vue'
import ModalSystem from './components/ui/ModalSystem.vue'
import ContextMenuSystem from './components/ui/ContextMenuSystem.vue'
import TooltipSystem from './components/ui/TooltipSystem.vue'
import ChatSystem from './components/game/ChatSystem.vue'
import MiniMap from './components/game/MiniMap.vue'
import QuickActionBar from './components/game/QuickActionBar.vue'
import PlayerStatusHUD from './components/game/PlayerStatusHUD.vue'
import WorldBossAlert from './components/game/WorldBossAlert.vue'
import GlobalEventNotifier from './components/game/GlobalEventNotifier.vue'
import BackgroundEffects from './components/effects/BackgroundEffects.vue'
import AudioSystem from './components/audio/AudioSystem.vue'
import DebugPanel from './components/debug/DebugPanel.vue'

// Setup stores
const authStore = useAuthStore()
const gameStore = useGameStore()
const playerStore = usePlayerStore()
const uiStore = useUIStore()
const settingsStore = useSettingsStore()

const route = useRoute()
const router = useRouter()

// Reactive refs
const isLoading = ref(true)
const showDebug = ref(false)

// Store refs
const { worldBoss, activeEvents, connectionStatus } = storeToRefs(gameStore)
const { theme } = storeToRefs(settingsStore)

// Computed properties
const isInGame = computed(() => route.path.startsWith('/game'))
const isDevelopment = computed(() => import.meta.env.DEV)
const themeClass = computed(() => `theme-${theme.value}`)
const currentScene = computed(() => {
  if (isInGame.value) return 'game'
  if (route.path === '/') return 'home'
  if (route.path === '/login' || route.path === '/register') return 'auth'
  if (route.path === '/character-creation') return 'creation'
  return 'default'
})

// Methods
const getTransitionName = (route) => {
  if (route.path.startsWith('/game')) return 'game'
  if (route.path === '/' || route.path === '/login' || route.path === '/register') return 'fade'
  return 'slide'
}

const onRouteEnter = (el) => {
  // Route enter animation
  uiStore.setRouteTransitioning(false)
}

const onRouteLeave = (el) => {
  // Route leave animation
  uiStore.setRouteTransitioning(true)
}

const handleKeyboardShortcuts = (event) => {
  // Global keyboard shortcuts
  if (event.ctrlKey || event.metaKey) {
    switch (event.key) {
      case '`':
        if (isDevelopment.value) {
          showDebug.value = !showDebug.value
          event.preventDefault()
        }
        break
    }
  }
  
  // Game-specific shortcuts (only when in game)
  if (isInGame.value && !uiStore.isInputFocused) {
    switch (event.key) {
      case 'Enter':
        uiStore.focusChat()
        event.preventDefault()
        break
      case 'Escape':
        uiStore.closeAllModals()
        event.preventDefault()
        break
      case 'i':
      case 'I':
        router.push('/game/inventory')
        event.preventDefault()
        break
      case 'c':
      case 'C':
        router.push('/game/character')
        event.preventDefault()
        break
      case 'q':
      case 'Q':
        router.push('/game/quests')
        event.preventDefault()
        break
      case 'g':
      case 'G':
        router.push('/game/guild')
        event.preventDefault()
        break
      case 'm':
      case 'M':
        uiStore.toggleMiniMap()
        event.preventDefault()
        break
      case 'h':
      case 'H':
        router.push('/game/help')
        event.preventDefault()
        break
    }
  }
}

const handleResize = () => {
  uiStore.updateScreenSize({
    width: window.innerWidth,
    height: window.innerHeight
  })
}

const handleVisibilityChange = () => {
  if (document.hidden) {
    // Page is hidden
    gameStore.setPageVisibility(false)
    if (isInGame.value) {
      gameStore.pauseGameUpdates()
    }
  } else {
    // Page is visible
    gameStore.setPageVisibility(true)
    if (isInGame.value) {
      gameStore.resumeGameUpdates()
    }
  }
}

const handleBeforeUnload = (event) => {
  if (isInGame.value && gameStore.hasUnsavedChanges) {
    event.preventDefault()
    event.returnValue = 'You have unsaved progress. Are you sure you want to leave?'
    return event.returnValue
  }
}

// Lifecycle hooks
onMounted(async () => {
  try {
    // Initialize settings
    await settingsStore.loadSettings()
    
    // Setup event listeners
    window.addEventListener('keydown', handleKeyboardShortcuts)
    window.addEventListener('resize', handleResize)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)
    
    // Initialize screen size
    handleResize()
    
    // Show app after brief loading
    setTimeout(() => {
      isLoading.value = false
    }, 1000)
    
    console.log('🎮 Epic Online Adventure App mounted!')
    
  } catch (error) {
    console.error('❌ App mount failed:', error)
    isLoading.value = false
  }
})

onUnmounted(() => {
  // Cleanup event listeners
  window.removeEventListener('keydown', handleKeyboardShortcuts)
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

// Watchers
watch(connectionStatus, (newStatus) => {
  if (newStatus === 'disconnected' && isInGame.value) {
    uiStore.showNotification('Connection lost. Attempting to reconnect...', 'warning')
  } else if (newStatus === 'connected' && isInGame.value) {
    uiStore.showNotification('Connection restored!', 'success')
  }
})

watch(theme, (newTheme) => {
  document.documentElement.setAttribute('data-theme', newTheme)
})

// Initialize theme
document.documentElement.setAttribute('data-theme', theme.value)
</script>

<template>
  <div id="app" class="epic-adventure-app" :class="themeClass">
    <!-- Loading Screen -->
    <LoadingScreen v-if="isLoading" />
    
    <!-- Main Game Interface -->
    <div v-else class="app-container">
      <!-- Header (only for non-game routes) -->
      <AppHeader v-if="!isInGame" />
      
      <!-- Main Content -->
      <main class="main-content" :class="{ 'game-mode': isInGame }">
        <router-view v-slot="{ Component, route }">
          <transition 
            :name="getTransitionName(route)" 
            mode="out-in"
            @enter="onRouteEnter"
            @leave="onRouteLeave"
          >
            <component :is="Component" :key="route.fullPath" />
          </transition>
        </router-view>
      </main>
      
      <!-- Global UI Components -->
      <NotificationSystem />
      <FloatingTextSystem />
      <ModalSystem />
      <ContextMenuSystem />
      <TooltipSystem />
      
      <!-- Game-specific UI -->
      <template v-if="isInGame">
        <ChatSystem />
        <MiniMap />
        <QuickActionBar />
        <PlayerStatusHUD />
        <WorldBossAlert v-if="worldBoss" :boss="worldBoss" />
        <GlobalEventNotifier v-if="activeEvents.length" :events="activeEvents" />
      </template>
      
      <!-- Footer (only for non-game routes) -->
      <AppFooter v-if="!isInGame" />
    </div>
    
    <!-- Background Effects -->
    <BackgroundEffects :scene="currentScene" />
    
    <!-- Audio System -->
    <AudioSystem />
    
    <!-- Debug Panel (development only) -->
    <DebugPanel v-if="isDevelopment && showDebug" />
  </div>
</template>

<style scoped>
.epic-adventure-app {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
  font-family: 'Exo 2', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  color: var(--text-primary);
}

.app-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
}

.main-content {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.main-content.game-mode {
  padding: 0;
  background: transparent;
}

/* Route Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.4s ease;
}

.slide-enter-from {
  transform: translateX(30px);
  opacity: 0;
}

.slide-leave-to {
  transform: translateX(-30px);
  opacity: 0;
}

.game-enter-active,
.game-leave-active {
  transition: all 0.5s ease;
}

.game-enter-from {
  transform: scale(0.95);
  opacity: 0;
}

.game-leave-to {
  transform: scale(1.05);
  opacity: 0;
}

/* Theme Support */
.theme-dark {
  --bg-primary: #1a1a2e;
  --bg-secondary: #16213e;
  --bg-tertiary: #0f3460;
  --text-primary: #ffffff;
  --text-secondary: #b0b0b0;
  --accent-primary: #4ecca3;
  --accent-secondary: #45b7d1;
  --accent-tertiary: #96ceb4;
  --border-color: #333;
  --shadow: rgba(0, 0, 0, 0.3);
}

.theme-light {
  --bg-primary: #f5f5f5;
  --bg-secondary: #ffffff;
  --bg-tertiary: #e9e9e9;
  --text-primary: #333333;
  --text-secondary: #666666;
  --accent-primary: #2196f3;
  --accent-secondary: #ff9800;
  --accent-tertiary: #4caf50;
  --border-color: #ddd;
  --shadow: rgba(0, 0, 0, 0.1);
}

.theme-fantasy {
  --bg-primary: #2c1810;
  --bg-secondary: #3d2817;
  --bg-tertiary: #5d3a1a;
  --text-primary: #f4e4bc;
  --text-secondary: #d4c4a8;
  --accent-primary: #ffd700;
  --accent-secondary: #ff6b35;
  --accent-tertiary: #c7522a;
  --border-color: #8b4513;
  --shadow: rgba(0, 0, 0, 0.4);
}

/* Scrollbar styling */
:deep(::-webkit-scrollbar) {
  width: 8px;
  height: 8px;
}

:deep(::-webkit-scrollbar-track) {
  background: var(--bg-tertiary);
  border-radius: 4px;
}

:deep(::-webkit-scrollbar-thumb) {
  background: var(--accent-primary);
  border-radius: 4px;
  transition: background 0.3s ease;
}

:deep(::-webkit-scrollbar-thumb:hover) {
  background: var(--accent-secondary);
}

/* Selection styling */
:deep(::selection) {
  background: var(--accent-primary);
  color: var(--bg-primary);
}

/* Focus styling */
:deep(*:focus) {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

/* Responsive design */
@media (max-width: 768px) {
  .epic-adventure-app {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .epic-adventure-app {
    font-size: 12px;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .fade-enter-active,
  .fade-leave-active,
  .slide-enter-active,
  .slide-leave-active,
  .game-enter-active,
  .game-leave-active {
    transition: none;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .epic-adventure-app {
    --border-color: currentColor;
    --shadow: none;
  }
}
</style>
