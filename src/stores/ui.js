import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUIStore = defineStore('ui', () => {
  // State
  const modals = ref([])
  const notifications = ref([])
  const tooltips = ref([])
  const contextMenu = ref(null)
  const floatingTexts = ref([])
  const loading = ref(false)
  const loadingText = ref('Loading...')
  const sidebarCollapsed = ref(false)
  const fullscreen = ref(false)
  const theme = ref('dark')
  const hudVisible = ref(true)
  const chatVisible = ref(true)
  const minimapVisible = ref(true)
  const debugMode = ref(false)
  const confirmDialog = ref(null)
  const imagePreview = ref(null)
  const dragData = ref(null)
  const keyboardShortcuts = ref(true)
  const soundEnabled = ref(true)
  const musicEnabled = ref(true)
  const currentTour = ref(null)
  const hotkeys = ref(new Map())
  const panelStates = ref(new Map())

  // Computed
  const hasModals = computed(() => modals.value.length > 0)
  const hasNotifications = computed(() => notifications.value.length > 0)
  const activeModal = computed(() => modals.value[modals.value.length - 1])
  const notificationCount = computed(() => notifications.value.filter(n => !n.read).length)
  const isContextMenuOpen = computed(() => !!contextMenu.value)
  const isDragging = computed(() => !!dragData.value)
  const themeClass = computed(() => `theme-${theme.value}`)

  // Modal Management
  const openModal = (modalData) => {
    const modal = {
      id: Date.now(),
      component: modalData.component,
      props: modalData.props || {},
      options: {
        closable: modalData.closable !== false,
        backdrop: modalData.backdrop !== false,
        size: modalData.size || 'medium',
        animation: modalData.animation || 'fade',
        persistent: modalData.persistent || false,
        ...modalData.options
      },
      onClose: modalData.onClose,
      onConfirm: modalData.onConfirm
    }
    modals.value.push(modal)
    return modal.id
  }

  const closeModal = (modalId) => {
    if (!modalId) {
      const modal = modals.value.pop()
      if (modal?.onClose) modal.onClose()
      return
    }
    
    const index = modals.value.findIndex(m => m.id === modalId)
    if (index !== -1) {
      const modal = modals.value.splice(index, 1)[0]
      if (modal?.onClose) modal.onClose()
    }
  }

  const closeAllModals = () => {
    modals.value.forEach(modal => {
      if (modal.onClose) modal.onClose()
    })
    modals.value = []
  }

  // Notification Management
  const addNotification = (notification) => {
    const notif = {
      id: Date.now() + Math.random(),
      type: notification.type || 'info',
      title: notification.title,
      message: notification.message,
      duration: notification.duration || 5000,
      persistent: notification.persistent || false,
      actions: notification.actions || [],
      icon: notification.icon,
      read: false,
      timestamp: new Date().toISOString(),
      ...notification
    }
    
    notifications.value.unshift(notif)
    
    if (!notif.persistent && notif.duration > 0) {
      setTimeout(() => {
        removeNotification(notif.id)
      }, notif.duration)
    }
    
    return notif.id
  }

  const removeNotification = (notificationId) => {
    const index = notifications.value.findIndex(n => n.id === notificationId)
    if (index !== -1) {
      notifications.value.splice(index, 1)
    }
  }

  const markNotificationRead = (notificationId) => {
    const notification = notifications.value.find(n => n.id === notificationId)
    if (notification) {
      notification.read = true
    }
  }

  const clearAllNotifications = () => {
    notifications.value = []
  }

  // Tooltip Management
  const showTooltip = (tooltipData) => {
    const tooltip = {
      id: Date.now(),
      content: tooltipData.content,
      target: tooltipData.target,
      position: tooltipData.position || 'top',
      delay: tooltipData.delay || 0,
      x: tooltipData.x || 0,
      y: tooltipData.y || 0,
      ...tooltipData
    }
    
    tooltips.value.push(tooltip)
    return tooltip.id
  }

  const hideTooltip = (tooltipId) => {
    if (!tooltipId) {
      tooltips.value = []
      return
    }
    
    const index = tooltips.value.findIndex(t => t.id === tooltipId)
    if (index !== -1) {
      tooltips.value.splice(index, 1)
    }
  }

  // Context Menu Management
  const showContextMenu = (menuData) => {
    contextMenu.value = {
      id: Date.now(),
      items: menuData.items || [],
      x: menuData.x || 0,
      y: menuData.y || 0,
      target: menuData.target,
      ...menuData
    }
  }

  const hideContextMenu = () => {
    contextMenu.value = null
  }

  // Floating Text Management
  const addFloatingText = (textData) => {
    const text = {
      id: Date.now() + Math.random(),
      content: textData.content,
      type: textData.type || 'info',
      x: textData.x || 0,
      y: textData.y || 0,
      duration: textData.duration || 3000,
      animation: textData.animation || 'float-up',
      color: textData.color,
      size: textData.size || 'medium',
      timestamp: Date.now(),
      ...textData
    }
    
    floatingTexts.value.push(text)
    
    setTimeout(() => {
      removeFloatingText(text.id)
    }, text.duration)
    
    return text.id
  }

  const removeFloatingText = (textId) => {
    const index = floatingTexts.value.findIndex(t => t.id === textId)
    if (index !== -1) {
      floatingTexts.value.splice(index, 1)
    }
  }

  // Loading Management
  const setLoading = (isLoading, text = 'Loading...') => {
    loading.value = isLoading
    loadingText.value = text
  }

  // Theme Management
  const setTheme = (newTheme) => {
    theme.value = newTheme
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('game_theme', newTheme)
  }

  // UI State Management
  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      fullscreen.value = true
    } else {
      document.exitFullscreen()
      fullscreen.value = false
    }
  }

  const toggleHUD = () => {
    hudVisible.value = !hudVisible.value
  }

  const toggleChat = () => {
    chatVisible.value = !chatVisible.value
  }

  const toggleMinimap = () => {
    minimapVisible.value = !minimapVisible.value
  }

  const toggleDebugMode = () => {
    debugMode.value = !debugMode.value
  }

  // Confirm Dialog
  const showConfirmDialog = (options) => {
    return new Promise((resolve) => {
      confirmDialog.value = {
        title: options.title || 'Confirm',
        message: options.message || 'Are you sure?',
        confirmText: options.confirmText || 'Yes',
        cancelText: options.cancelText || 'No',
        type: options.type || 'warning',
        onConfirm: () => {
          confirmDialog.value = null
          resolve(true)
        },
        onCancel: () => {
          confirmDialog.value = null
          resolve(false)
        }
      }
    })
  }

  // Image Preview
  const showImagePreview = (imageData) => {
    imagePreview.value = {
      src: imageData.src,
      alt: imageData.alt || '',
      title: imageData.title || '',
      description: imageData.description || ''
    }
  }

  const hideImagePreview = () => {
    imagePreview.value = null
  }

  // Drag and Drop
  const startDrag = (data) => {
    dragData.value = data
  }

  const endDrag = () => {
    dragData.value = null
  }

  // Hotkey Management
  const registerHotkey = (key, action, description = '') => {
    hotkeys.value.set(key, { action, description })
  }

  const unregisterHotkey = (key) => {
    hotkeys.value.delete(key)
  }

  const executeHotkey = (key) => {
    const hotkey = hotkeys.value.get(key)
    if (hotkey && keyboardShortcuts.value) {
      hotkey.action()
      return true
    }
    return false
  }

  // Panel State Management
  const setPanelState = (panelId, state) => {
    panelStates.value.set(panelId, state)
  }

  const getPanelState = (panelId, defaultState = {}) => {
    return panelStates.value.get(panelId) || defaultState
  }

  // Tour Management
  const startTour = (tourData) => {
    currentTour.value = {
      id: tourData.id,
      steps: tourData.steps || [],
      currentStep: 0,
      options: tourData.options || {}
    }
  }

  const nextTourStep = () => {
    if (currentTour.value && currentTour.value.currentStep < currentTour.value.steps.length - 1) {
      currentTour.value.currentStep++
    }
  }

  const prevTourStep = () => {
    if (currentTour.value && currentTour.value.currentStep > 0) {
      currentTour.value.currentStep--
    }
  }

  const endTour = () => {
    currentTour.value = null
  }

  // Sound Management
  const toggleSound = () => {
    soundEnabled.value = !soundEnabled.value
    localStorage.setItem('game_sound', soundEnabled.value)
  }

  const toggleMusic = () => {
    musicEnabled.value = !musicEnabled.value
    localStorage.setItem('game_music', musicEnabled.value)
  }

  // Utility Functions
  const showSuccess = (message, title = 'Success') => {
    addNotification({
      type: 'success',
      title,
      message,
      icon: 'check-circle'
    })
  }

  const showError = (message, title = 'Error') => {
    addNotification({
      type: 'error',
      title,
      message,
      icon: 'x-circle',
      persistent: true
    })
  }

  const showWarning = (message, title = 'Warning') => {
    addNotification({
      type: 'warning',
      title,
      message,
      icon: 'alert-triangle'
    })
  }

  const showInfo = (message, title = 'Info') => {
    addNotification({
      type: 'info',
      title,
      message,
      icon: 'info'
    })
  }

  // Initialize
  const initializeUI = () => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('game_theme')
    if (savedTheme) {
      setTheme(savedTheme)
    }

    // Load sound settings
    const savedSound = localStorage.getItem('game_sound')
    if (savedSound !== null) {
      soundEnabled.value = JSON.parse(savedSound)
    }

    const savedMusic = localStorage.getItem('game_music')
    if (savedMusic !== null) {
      musicEnabled.value = JSON.parse(savedMusic)
    }

    // Setup default hotkeys
    registerHotkey('Escape', () => {
      if (hasModals.value) {
        closeModal()
      } else if (isContextMenuOpen.value) {
        hideContextMenu()
      }
    }, 'Close modal or context menu')

    registerHotkey('F11', toggleFullscreen, 'Toggle fullscreen')
    registerHotkey('h', toggleHUD, 'Toggle HUD visibility')
    registerHotkey('Enter', toggleChat, 'Toggle chat')
    registerHotkey('m', toggleMinimap, 'Toggle minimap')
  }

  return {
    // State
    modals,
    notifications,
    tooltips,
    contextMenu,
    floatingTexts,
    loading,
    loadingText,
    sidebarCollapsed,
    fullscreen,
    theme,
    hudVisible,
    chatVisible,
    minimapVisible,
    debugMode,
    confirmDialog,
    imagePreview,
    dragData,
    keyboardShortcuts,
    soundEnabled,
    musicEnabled,
    currentTour,
    hotkeys,
    panelStates,

    // Computed
    hasModals,
    hasNotifications,
    activeModal,
    notificationCount,
    isContextMenuOpen,
    isDragging,
    themeClass,

    // Actions
    openModal,
    closeModal,
    closeAllModals,
    addNotification,
    removeNotification,
    markNotificationRead,
    clearAllNotifications,
    showTooltip,
    hideTooltip,
    showContextMenu,
    hideContextMenu,
    addFloatingText,
    removeFloatingText,
    setLoading,
    setTheme,
    toggleSidebar,
    toggleFullscreen,
    toggleHUD,
    toggleChat,
    toggleMinimap,
    toggleDebugMode,
    showConfirmDialog,
    showImagePreview,
    hideImagePreview,
    startDrag,
    endDrag,
    registerHotkey,
    unregisterHotkey,
    executeHotkey,
    setPanelState,
    getPanelState,
    startTour,
    nextTourStep,
    prevTourStep,
    endTour,
    toggleSound,
    toggleMusic,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    initializeUI
  }
})