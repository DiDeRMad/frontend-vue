<template>
  <header class="app-header" :class="{ 'transparent': isTransparent, 'condensed': isCondensed }">
    <div class="header-container">
      <!-- Logo and Brand -->
      <div class="brand-section">
        <router-link to="/" class="brand-link">
          <div class="brand-logo">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="18" stroke="currentColor" stroke-width="2" fill="url(#logoGradient)"/>
              <path d="M15 15l10 5-10 5v-10z" fill="currentColor"/>
              <defs>
                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:var(--accent-primary);stop-opacity:1" />
                  <stop offset="100%" style="stop-color:var(--accent-secondary);stop-opacity:1" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span class="brand-text">Epic Adventure</span>
        </router-link>
      </div>

      <!-- Navigation Menu -->
      <nav class="main-navigation" v-if="!isMobile || showMobileMenu">
        <ul class="nav-list">
          <li class="nav-item">
            <router-link to="/" class="nav-link" exact-active-class="active">
              <i class="icon-home"></i>
              <span>Home</span>
            </router-link>
          </li>
          <li class="nav-item" v-if="!isAuthenticated">
            <router-link to="/login" class="nav-link" active-class="active">
              <i class="icon-log-in"></i>
              <span>Login</span>
            </router-link>
          </li>
          <li class="nav-item" v-if="!isAuthenticated">
            <router-link to="/register" class="nav-link" active-class="active">
              <i class="icon-user-plus"></i>
              <span>Register</span>
            </router-link>
          </li>
          <li class="nav-item dropdown" v-if="isAuthenticated && hasCharacter">
            <button class="nav-link dropdown-toggle" @click="toggleGameMenu">
              <i class="icon-gamepad"></i>
              <span>Game</span>
              <i class="icon-chevron-down"></i>
            </button>
            <ul class="dropdown-menu" v-show="showGameMenu">
              <li><router-link to="/game/world" class="dropdown-link">World Map</router-link></li>
              <li><router-link to="/game/character" class="dropdown-link">Character</router-link></li>
              <li><router-link to="/game/inventory" class="dropdown-link">Inventory</router-link></li>
              <li><router-link to="/game/quests" class="dropdown-link">Quests</router-link></li>
              <li><router-link to="/game/guild" class="dropdown-link">Guild</router-link></li>
              <li><router-link to="/game/marketplace" class="dropdown-link">Marketplace</router-link></li>
              <li><router-link to="/game/leaderboard" class="dropdown-link">Leaderboard</router-link></li>
            </ul>
          </li>
          <li class="nav-item" v-if="isAuthenticated">
            <router-link to="/game/achievements" class="nav-link" active-class="active">
              <i class="icon-award"></i>
              <span>Achievements</span>
              <span class="badge" v-if="unlockedAchievements > 0">{{ unlockedAchievements }}</span>
            </router-link>
          </li>
        </ul>
      </nav>

      <!-- User Actions -->
      <div class="user-actions">
        <!-- Connection Status -->
        <div class="connection-status" v-if="isAuthenticated" :class="connectionStatus">
          <div class="status-indicator"></div>
          <span class="status-text">{{ connectionStatusText }}</span>
        </div>

        <!-- Notifications -->
        <button class="icon-button notification-btn" v-if="isAuthenticated" @click="toggleNotifications">
          <i class="icon-bell"></i>
          <span class="notification-badge" v-if="notificationCount > 0">{{ notificationCount }}</span>
        </button>

        <!-- Theme Toggle -->
        <button class="icon-button theme-toggle" @click="toggleTheme" :title="themeToggleTitle">
          <i :class="themeIcon"></i>
        </button>

        <!-- Settings -->
        <button class="icon-button settings-btn" @click="openSettings" title="Settings">
          <i class="icon-settings"></i>
        </button>

        <!-- User Menu -->
        <div class="user-menu dropdown" v-if="isAuthenticated">
          <button class="user-menu-toggle" @click="toggleUserMenu">
            <div class="user-avatar">
              <img v-if="user?.avatar" :src="user.avatar" :alt="user.username" />
              <div v-else class="avatar-placeholder">
                {{ user?.username?.charAt(0)?.toUpperCase() }}
              </div>
            </div>
            <div class="user-info" v-if="!isMobile">
              <span class="username">{{ user?.username }}</span>
              <span class="user-level" v-if="character">Level {{ character.level }}</span>
            </div>
            <i class="icon-chevron-down"></i>
          </button>
          
          <div class="dropdown-menu user-dropdown" v-show="showUserMenu">
            <div class="user-header">
              <div class="user-avatar-large">
                <img v-if="user?.avatar" :src="user.avatar" :alt="user.username" />
                <div v-else class="avatar-placeholder">
                  {{ user?.username?.charAt(0)?.toUpperCase() }}
                </div>
              </div>
              <div class="user-details">
                <h4>{{ user?.username }}</h4>
                <p v-if="character">{{ character.class }} - Level {{ character.level }}</p>
                <p class="user-status">{{ userStatusText }}</p>
              </div>
            </div>
            
            <div class="dropdown-divider"></div>
            
            <div class="dropdown-section">
              <router-link to="/profile" class="dropdown-link">
                <i class="icon-user"></i>
                Profile
              </router-link>
              <router-link to="/game/character" class="dropdown-link" v-if="hasCharacter">
                <i class="icon-user-check"></i>
                Character
              </router-link>
              <router-link to="/character-creation" class="dropdown-link" v-if="!hasCharacter">
                <i class="icon-user-plus"></i>
                Create Character
              </router-link>
              <router-link to="/settings" class="dropdown-link">
                <i class="icon-settings"></i>
                Settings
              </router-link>
            </div>
            
            <div class="dropdown-divider"></div>
            
            <div class="dropdown-section">
              <button class="dropdown-link logout-btn" @click="handleLogout">
                <i class="icon-log-out"></i>
                Logout
              </button>
            </div>
          </div>
        </div>

        <!-- Login Button for non-authenticated users -->
        <router-link to="/login" class="btn btn-primary" v-if="!isAuthenticated && !isMobile">
          Get Started
        </router-link>

        <!-- Mobile Menu Toggle -->
        <button class="icon-button mobile-menu-toggle" v-if="isMobile" @click="toggleMobileMenu">
          <i :class="showMobileMenu ? 'icon-x' : 'icon-menu'"></i>
        </button>
      </div>
    </div>

    <!-- Mobile Navigation -->
    <nav class="mobile-navigation" v-if="isMobile && showMobileMenu">
      <div class="mobile-nav-content">
        <div class="mobile-user-section" v-if="isAuthenticated">
          <div class="mobile-user-info">
            <div class="user-avatar">
              <img v-if="user?.avatar" :src="user.avatar" :alt="user.username" />
              <div v-else class="avatar-placeholder">
                {{ user?.username?.charAt(0)?.toUpperCase() }}
              </div>
            </div>
            <div class="user-details">
              <h4>{{ user?.username }}</h4>
              <p v-if="character">{{ character.class }} - Level {{ character.level }}</p>
            </div>
          </div>
        </div>
        
        <ul class="mobile-nav-list">
          <li><router-link to="/" class="mobile-nav-link" @click="closeMobileMenu">Home</router-link></li>
          <li v-if="!isAuthenticated">
            <router-link to="/login" class="mobile-nav-link" @click="closeMobileMenu">Login</router-link>
          </li>
          <li v-if="!isAuthenticated">
            <router-link to="/register" class="mobile-nav-link" @click="closeMobileMenu">Register</router-link>
          </li>
          <li v-if="isAuthenticated && hasCharacter">
            <router-link to="/game/world" class="mobile-nav-link" @click="closeMobileMenu">World Map</router-link>
          </li>
          <li v-if="isAuthenticated && hasCharacter">
            <router-link to="/game/character" class="mobile-nav-link" @click="closeMobileMenu">Character</router-link>
          </li>
          <li v-if="isAuthenticated && hasCharacter">
            <router-link to="/game/inventory" class="mobile-nav-link" @click="closeMobileMenu">Inventory</router-link>
          </li>
          <li v-if="isAuthenticated">
            <router-link to="/settings" class="mobile-nav-link" @click="closeMobileMenu">Settings</router-link>
          </li>
          <li v-if="isAuthenticated">
            <button class="mobile-nav-link logout-btn" @click="handleLogout">Logout</button>
          </li>
        </ul>
      </div>
    </nav>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { useGameStore } from '@/stores/game'
import { usePlayerStore } from '@/stores/player'
import { useUIStore } from '@/stores/ui'
import { useSettingsStore } from '@/stores/settings'

// Stores
const authStore = useAuthStore()
const gameStore = useGameStore()
const playerStore = usePlayerStore()
const uiStore = useUIStore()
const settingsStore = useSettingsStore()

// Router
const route = useRoute()
const router = useRouter()

// Store state
const { user, isAuthenticated, hasCharacter } = storeToRefs(authStore)
const { connectionStatus } = storeToRefs(gameStore)
const { character } = storeToRefs(playerStore)
const { notificationCount, theme } = storeToRefs(uiStore)

// Component state
const showMobileMenu = ref(false)
const showGameMenu = ref(false)
const showUserMenu = ref(false)
const showNotifications = ref(false)
const isMobile = ref(false)

// Computed properties
const isTransparent = computed(() => route.name === 'Home')
const isCondensed = computed(() => route.path.startsWith('/game'))

const connectionStatusText = computed(() => {
  switch (connectionStatus.value) {
    case 'connected': return 'Online'
    case 'connecting': return 'Connecting...'
    case 'disconnected': return 'Offline'
    case 'reconnecting': return 'Reconnecting...'
    default: return 'Unknown'
  }
})

const userStatusText = computed(() => {
  if (!isAuthenticated.value) return 'Not logged in'
  if (!hasCharacter.value) return 'No character'
  return connectionStatusText.value
})

const themeIcon = computed(() => {
  switch (theme.value) {
    case 'light': return 'icon-sun'
    case 'dark': return 'icon-moon'
    case 'fantasy': return 'icon-star'
    default: return 'icon-moon'
  }
})

const themeToggleTitle = computed(() => {
  switch (theme.value) {
    case 'light': return 'Switch to Dark Theme'
    case 'dark': return 'Switch to Fantasy Theme'
    case 'fantasy': return 'Switch to Light Theme'
    default: return 'Toggle Theme'
  }
})

const unlockedAchievements = computed(() => {
  return playerStore.unlockedAchievements?.length || 0
})

// Methods
const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value
  if (showMobileMenu.value) {
    showGameMenu.value = false
    showUserMenu.value = false
  }
}

const closeMobileMenu = () => {
  showMobileMenu.value = false
}

const toggleGameMenu = () => {
  showGameMenu.value = !showGameMenu.value
  showUserMenu.value = false
  showNotifications.value = false
}

const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
  showGameMenu.value = false
  showNotifications.value = false
}

const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value
  showGameMenu.value = false
  showUserMenu.value = false
}

const toggleTheme = () => {
  const themes = ['light', 'dark', 'fantasy']
  const currentIndex = themes.indexOf(theme.value)
  const nextIndex = (currentIndex + 1) % themes.length
  uiStore.setTheme(themes[nextIndex])
}

const openSettings = () => {
  router.push('/settings')
  closeMobileMenu()
}

const handleLogout = async () => {
  const confirmed = await uiStore.showConfirmDialog({
    title: 'Logout',
    message: 'Are you sure you want to logout?',
    confirmText: 'Logout',
    type: 'warning'
  })
  
  if (confirmed) {
    await authStore.logout()
    closeMobileMenu()
    router.push('/')
    uiStore.showSuccess('Successfully logged out')
  }
}

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
}

const handleClickOutside = (event) => {
  const header = event.target.closest('.app-header')
  if (!header) {
    showGameMenu.value = false
    showUserMenu.value = false
    showNotifications.value = false
  }
}

const handleResize = () => {
  checkMobile()
  if (!isMobile.value) {
    showMobileMenu.value = false
  }
}

// Lifecycle
onMounted(() => {
  checkMobile()
  window.addEventListener('resize', handleResize)
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: var(--z-header);
  background: rgba(var(--bg-primary-rgb), 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border-color);
  transition: all var(--transition-duration);
}

.app-header.transparent {
  background: rgba(var(--bg-primary-rgb), 0.8);
}

.app-header.condensed {
  transform: translateY(-60px);
}

.header-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-md);
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
}

.brand-section {
  display: flex;
  align-items: center;
}

.brand-link {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  text-decoration: none;
  color: var(--text-primary);
  font-weight: 600;
  font-size: 1.2rem;
  transition: color var(--transition-duration);
}

.brand-link:hover {
  color: var(--accent-primary);
}

.brand-logo {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-text {
  font-family: var(--font-heading);
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.main-navigation {
  flex: 1;
  display: flex;
  justify-content: center;
}

.nav-list {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-item {
  position: relative;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm);
  text-decoration: none;
  color: var(--text-secondary);
  border-radius: var(--border-radius);
  transition: all var(--transition-duration);
  background: none;
  border: none;
  font-size: 0.9rem;
  cursor: pointer;
}

.nav-link:hover {
  color: var(--text-primary);
  background: var(--bg-secondary);
}

.nav-link.active {
  color: var(--accent-primary);
  background: rgba(var(--accent-primary-rgb), 0.1);
}

.dropdown-toggle::after {
  margin-left: var(--spacing-xs);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  min-width: 200px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-lg);
  z-index: 1000;
  list-style: none;
  padding: var(--spacing-sm) 0;
  margin: var(--spacing-xs) 0 0;
}

.dropdown-link {
  display: block;
  padding: var(--spacing-sm) var(--spacing-md);
  color: var(--text-secondary);
  text-decoration: none;
  transition: all var(--transition-duration);
}

.dropdown-link:hover {
  color: var(--text-primary);
  background: var(--bg-secondary);
}

.user-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.connection-status {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius);
  font-size: 0.8rem;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--status-offline);
}

.connection-status.connected .status-indicator {
  background: var(--status-online);
}

.connection-status.connecting .status-indicator,
.connection-status.reconnecting .status-indicator {
  background: var(--status-warning);
  animation: pulse 1s infinite;
}

.icon-button {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  background: none;
  color: var(--text-secondary);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all var(--transition-duration);
}

.icon-button:hover {
  color: var(--text-primary);
  background: var(--bg-secondary);
}

.notification-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  min-width: 16px;
  height: 16px;
  background: var(--accent-danger);
  color: white;
  border-radius: 8px;
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}

.user-menu-toggle {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs);
  background: none;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all var(--transition-duration);
}

.user-menu-toggle:hover {
  background: var(--bg-secondary);
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
}

.user-info {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.username {
  font-weight: 500;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.user-level {
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.user-dropdown {
  right: 0;
  left: auto;
  min-width: 280px;
}

.user-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
}

.user-avatar-large {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
}

.user-details h4 {
  margin: 0;
  color: var(--text-primary);
  font-size: 1rem;
}

.user-details p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.8rem;
}

.dropdown-divider {
  height: 1px;
  background: var(--border-color);
  margin: var(--spacing-sm) 0;
}

.dropdown-section {
  padding: 0;
}

.logout-btn {
  color: var(--accent-danger) !important;
  background: none;
  border: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
}

.mobile-menu-toggle {
  display: none;
}

.mobile-navigation {
  display: none;
  background: var(--bg-primary);
  border-top: 1px solid var(--border-color);
}

.mobile-nav-content {
  padding: var(--spacing-md);
}

.mobile-user-section {
  padding: var(--spacing-md) 0;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: var(--spacing-md);
}

.mobile-user-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.mobile-nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.mobile-nav-list li {
  margin-bottom: var(--spacing-sm);
}

.mobile-nav-link {
  display: block;
  padding: var(--spacing-md);
  color: var(--text-primary);
  text-decoration: none;
  border-radius: var(--border-radius);
  transition: all var(--transition-duration);
  background: none;
  border: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  font-size: 1rem;
}

.mobile-nav-link:hover {
  background: var(--bg-secondary);
}

.badge {
  background: var(--accent-primary);
  color: white;
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 0.7rem;
  margin-left: var(--spacing-xs);
}

@media (max-width: 768px) {
  .main-navigation {
    display: none;
  }
  
  .mobile-menu-toggle {
    display: flex;
  }
  
  .mobile-navigation {
    display: block;
  }
  
  .user-info {
    display: none;
  }
  
  .connection-status .status-text {
    display: none;
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>