<template>
  <div class="notification-system">
    <teleport to="body">
      <div class="notification-container" :class="containerClass">
        <transition-group
          name="notification"
          tag="div"
          class="notification-list"
        >
          <div
            v-for="notification in visibleNotifications"
            :key="notification.id"
            class="notification"
            :class="getNotificationClass(notification)"
            @mouseenter="pauseTimer(notification.id)"
            @mouseleave="resumeTimer(notification.id)"
          >
            <!-- Icon -->
            <div class="notification-icon" v-if="notification.icon || hasDefaultIcon(notification.type)">
              <i :class="getIconClass(notification)" />
            </div>

            <!-- Content -->
            <div class="notification-content">
              <div class="notification-header" v-if="notification.title">
                <h4 class="notification-title">{{ notification.title }}</h4>
                <span class="notification-time" v-if="showTimestamps">
                  {{ formatTime(notification.timestamp) }}
                </span>
              </div>
              
              <div class="notification-message" v-if="notification.message">
                <p v-if="typeof notification.message === 'string'">{{ notification.message }}</p>
                <component v-else :is="notification.message" />
              </div>

              <!-- Progress bar for auto-dismiss -->
              <div
                v-if="notification.duration > 0 && !notification.persistent"
                class="notification-progress"
              >
                <div
                  class="notification-progress-bar"
                  :style="{
                    width: `${getProgress(notification)}%`,
                    animationDuration: `${notification.duration}ms`
                  }"
                />
              </div>

              <!-- Actions -->
              <div class="notification-actions" v-if="notification.actions?.length">
                <button
                  v-for="action in notification.actions"
                  :key="action.id"
                  class="notification-action"
                  :class="action.class"
                  @click="handleAction(notification, action)"
                >
                  <i v-if="action.icon" :class="action.icon" />
                  {{ action.label }}
                </button>
              </div>
            </div>

            <!-- Close button -->
            <button
              class="notification-close"
              @click="dismissNotification(notification.id)"
              :title="closeButtonTitle"
            >
              <i class="icon-x" />
            </button>
          </div>
        </transition-group>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useUIStore } from '@/stores/ui'
import { useSettingsStore } from '@/stores/settings'

// Props
const props = defineProps({
  position: {
    type: String,
    default: 'top-right',
    validator: (value) => [
      'top-left', 'top-center', 'top-right',
      'bottom-left', 'bottom-center', 'bottom-right'
    ].includes(value)
  },
  maxVisible: {
    type: Number,
    default: 5
  },
  showTimestamps: {
    type: Boolean,
    default: true
  },
  closeButtonTitle: {
    type: String,
    default: 'Close notification'
  }
})

// Stores
const uiStore = useUIStore()
const settingsStore = useSettingsStore()

// Store state
const { notifications } = storeToRefs(uiStore)

// Component state
const timers = ref(new Map())
const pausedTimers = ref(new Set())

// Computed
const visibleNotifications = computed(() => {
  return notifications.value.slice(0, props.maxVisible)
})

const containerClass = computed(() => {
  return `notification-container--${props.position}`
})

// Methods
const getNotificationClass = (notification) => {
  return [
    `notification--${notification.type}`,
    {
      'notification--persistent': notification.persistent,
      'notification--with-actions': notification.actions?.length > 0,
      'notification--read': notification.read
    }
  ]
}

const getIconClass = (notification) => {
  if (notification.icon) {
    return notification.icon
  }
  
  return getDefaultIcon(notification.type)
}

const hasDefaultIcon = (type) => {
  return ['success', 'error', 'warning', 'info'].includes(type)
}

const getDefaultIcon = (type) => {
  const iconMap = {
    success: 'icon-check-circle',
    error: 'icon-x-circle',
    warning: 'icon-alert-triangle',
    info: 'icon-info'
  }
  return iconMap[type] || 'icon-bell'
}

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date

  if (diff < 60000) { // Less than 1 minute
    return 'Just now'
  } else if (diff < 3600000) { // Less than 1 hour
    const minutes = Math.floor(diff / 60000)
    return `${minutes}m ago`
  } else if (diff < 86400000) { // Less than 1 day
    const hours = Math.floor(diff / 3600000)
    return `${hours}h ago`
  } else {
    return date.toLocaleDateString()
  }
}

const getProgress = (notification) => {
  if (!notification.duration || notification.persistent) return 100
  
  const elapsed = Date.now() - new Date(notification.timestamp).getTime()
  const progress = Math.max(0, Math.min(100, ((notification.duration - elapsed) / notification.duration) * 100))
  return progress
}

const dismissNotification = (notificationId) => {
  uiStore.removeNotification(notificationId)
  clearTimer(notificationId)
}

const handleAction = (notification, action) => {
  if (action.handler) {
    action.handler(notification)
  }
  
  if (action.dismiss !== false) {
    dismissNotification(notification.id)
  }
}

const pauseTimer = (notificationId) => {
  pausedTimers.value.add(notificationId)
}

const resumeTimer = (notificationId) => {
  pausedTimers.value.delete(notificationId)
}

const clearTimer = (notificationId) => {
  const timer = timers.value.get(notificationId)
  if (timer) {
    clearTimeout(timer)
    timers.value.delete(notificationId)
  }
  pausedTimers.value.delete(notificationId)
}

const setupTimer = (notification) => {
  if (notification.persistent || notification.duration <= 0) {
    return
  }

  const timer = setTimeout(() => {
    if (!pausedTimers.value.has(notification.id)) {
      dismissNotification(notification.id)
    }
  }, notification.duration)

  timers.value.set(notification.id, timer)
}

const playNotificationSound = (notification) => {
  if (!settingsStore.gameSettings.audio.uiVolume || settingsStore.gameSettings.audio.muteUI) {
    return
  }

  // Create a simple beep sound based on notification type
  const audioContext = new (window.AudioContext || window.webkitAudioContext)()
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)

  // Different frequencies for different types
  const frequencies = {
    success: 800,
    error: 400,
    warning: 600,
    info: 500
  }

  oscillator.frequency.setValueAtTime(
    frequencies[notification.type] || 500,
    audioContext.currentTime
  )

  oscillator.type = 'sine'
  gainNode.gain.setValueAtTime(
    settingsStore.gameSettings.audio.uiVolume * 0.1,
    audioContext.currentTime
  )

  oscillator.start()
  oscillator.stop(audioContext.currentTime + 0.1)
}

// Watch for new notifications
watch(notifications, (newNotifications, oldNotifications) => {
  if (newNotifications.length > (oldNotifications?.length || 0)) {
    const newNotification = newNotifications[0]
    setupTimer(newNotification)
    
    // Play sound for new notifications
    if (newNotification.sound !== false) {
      playNotificationSound(newNotification)
    }
  }
}, { deep: true })

// Cleanup timers on unmount
onUnmounted(() => {
  timers.value.forEach(timer => clearTimeout(timer))
  timers.value.clear()
  pausedTimers.value.clear()
})
</script>

<style scoped>
.notification-system {
  position: relative;
  z-index: var(--z-notifications);
}

.notification-container {
  position: fixed;
  z-index: var(--z-notifications);
  pointer-events: none;
  max-width: 420px;
  width: 100%;
}

.notification-container--top-left {
  top: var(--spacing-lg);
  left: var(--spacing-lg);
}

.notification-container--top-center {
  top: var(--spacing-lg);
  left: 50%;
  transform: translateX(-50%);
}

.notification-container--top-right {
  top: var(--spacing-lg);
  right: var(--spacing-lg);
}

.notification-container--bottom-left {
  bottom: var(--spacing-lg);
  left: var(--spacing-lg);
}

.notification-container--bottom-center {
  bottom: var(--spacing-lg);
  left: 50%;
  transform: translateX(-50%);
}

.notification-container--bottom-right {
  bottom: var(--spacing-lg);
  right: var(--spacing-lg);
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.notification {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  backdrop-filter: blur(10px);
  pointer-events: auto;
  max-width: 100%;
  overflow: hidden;
  transition: all var(--transition-duration);
}

.notification:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-xl);
}

.notification--success {
  border-left: 4px solid var(--status-success);
}

.notification--error {
  border-left: 4px solid var(--status-error);
}

.notification--warning {
  border-left: 4px solid var(--status-warning);
}

.notification--info {
  border-left: 4px solid var(--status-info);
}

.notification--persistent {
  background: var(--bg-secondary);
}

.notification--read {
  opacity: 0.8;
}

.notification-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  margin-top: 2px;
}

.notification--success .notification-icon {
  color: var(--status-success);
  background: rgba(var(--status-success-rgb), 0.1);
}

.notification--error .notification-icon {
  color: var(--status-error);
  background: rgba(var(--status-error-rgb), 0.1);
}

.notification--warning .notification-icon {
  color: var(--status-warning);
  background: rgba(var(--status-warning-rgb), 0.1);
}

.notification--info .notification-icon {
  color: var(--status-info);
  background: rgba(var(--status-info-rgb), 0.1);
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-xs);
}

.notification-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.notification-time {
  font-size: 0.7rem;
  color: var(--text-tertiary);
  margin-left: var(--spacing-sm);
}

.notification-message {
  color: var(--text-secondary);
  font-size: 0.8rem;
  line-height: 1.4;
  margin-bottom: var(--spacing-sm);
}

.notification-message p {
  margin: 0;
}

.notification-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(var(--border-color-rgb), 0.3);
  overflow: hidden;
}

.notification-progress-bar {
  height: 100%;
  background: linear-gradient(
    90deg,
    var(--accent-primary),
    var(--accent-secondary)
  );
  transform-origin: left;
  animation: progress-countdown linear;
}

.notification-actions {
  display: flex;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-sm);
}

.notification-action {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  color: var(--text-secondary);
  font-size: 0.7rem;
  cursor: pointer;
  transition: all var(--transition-duration);
}

.notification-action:hover {
  background: var(--bg-quaternary);
  color: var(--text-primary);
}

.notification-action.primary {
  background: var(--accent-primary);
  color: white;
  border-color: var(--accent-primary);
}

.notification-action.primary:hover {
  background: var(--accent-primary-dark);
}

.notification-action.danger {
  background: var(--accent-danger);
  color: white;
  border-color: var(--accent-danger);
}

.notification-action.danger:hover {
  background: var(--accent-danger-dark);
}

.notification-close {
  position: absolute;
  top: var(--spacing-sm);
  right: var(--spacing-sm);
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--text-tertiary);
  border-radius: 50%;
  cursor: pointer;
  transition: all var(--transition-duration);
  opacity: 0;
}

.notification:hover .notification-close {
  opacity: 1;
}

.notification-close:hover {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}

/* Animations */
.notification-enter-active {
  transition: all 0.3s ease-out;
}

.notification-leave-active {
  transition: all 0.3s ease-in;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.notification-move {
  transition: transform 0.3s ease;
}

@keyframes progress-countdown {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}

@media (max-width: 480px) {
  .notification-container {
    left: var(--spacing-sm) !important;
    right: var(--spacing-sm) !important;
    max-width: none;
    transform: none !important;
  }

  .notification {
    padding: var(--spacing-sm);
  }

  .notification-actions {
    flex-direction: column;
  }

  .notification-action {
    justify-content: center;
  }
}
</style>