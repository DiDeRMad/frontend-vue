import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useGameStore = defineStore('game', () => {
  // Connection state
  const connectionStatus = ref('disconnected') // 'connected', 'connecting', 'disconnected', 'error'
  const socket = ref(null)
  const isPageVisible = ref(true)
  const hasUnsavedChanges = ref(false)

  // World state
  const worldTime = ref({
    day: 1,
    hour: 12,
    minute: 0,
    season: 'spring',
    year: 1
  })

  // Server state
  const serverStats = ref({
    performance: {
      fps: 60,
      averageTickTime: 16,
      memoryUsage: 0
    },
    players: 0,
    uptime: 0
  })

  const serverBoosts = ref([])
  const activeEvents = ref([])
  const worldBoss = ref(null)

  // Chat system
  const chatMessages = ref([])
  const chatTabs = ref(['World', 'Guild', 'Party', 'Whisper'])
  const activeChatTab = ref('World')

  // Player lists
  const nearbyPlayers = ref([])
  const partyMembers = ref([])

  // Combat state
  const inCombat = ref(false)
  const combatData = ref(null)

  // Trading state
  const inTrade = ref(false)
  const tradeData = ref(null)

  // Game settings
  const gameSettings = ref({
    showPlayerNames: true,
    showDamageNumbers: true,
    autoLoot: false,
    soundEffects: true,
    musicVolume: 0.7,
    sfxVolume: 0.8
  })

  // Computed properties
  const isConnected = computed(() => connectionStatus.value === 'connected')
  const formattedWorldTime = computed(() => {
    const hour = worldTime.value.hour.toString().padStart(2, '0')
    const minute = worldTime.value.minute.toString().padStart(2, '0')
    return `${hour}:${minute}`
  })

  const seasonColor = computed(() => {
    switch (worldTime.value.season) {
      case 'spring': return '#4ecca3'
      case 'summer': return '#f1c40f'
      case 'autumn': return '#e67e22'
      case 'winter': return '#3498db'
      default: return '#4ecca3'
    }
  })

  const activeServerBoosts = computed(() => {
    return serverBoosts.value.filter(boost => boost.active)
  })

  // Actions
  const setConnectionStatus = (status) => {
    connectionStatus.value = status
  }

  const setSocket = (socketInstance) => {
    socket.value = socketInstance
  }

  const setPageVisibility = (visible) => {
    isPageVisible.value = visible
  }

  const setWorldTime = (time) => {
    worldTime.value = { ...worldTime.value, ...time }
  }

  const setServerStats = (stats) => {
    serverStats.value = { ...serverStats.value, ...stats }
  }

  const addServerBoost = (boost) => {
    const existingIndex = serverBoosts.value.findIndex(b => b.id === boost.id)
    if (existingIndex >= 0) {
      serverBoosts.value[existingIndex] = boost
    } else {
      serverBoosts.value.push(boost)
    }
  }

  const removeServerBoost = (boostId) => {
    const index = serverBoosts.value.findIndex(b => b.id === boostId)
    if (index >= 0) {
      serverBoosts.value.splice(index, 1)
    }
  }

  const setServerBoosts = (boosts) => {
    serverBoosts.value = boosts || []
  }

  const addActiveEvent = (event) => {
    const existingIndex = activeEvents.value.findIndex(e => e.id === event.id)
    if (existingIndex >= 0) {
      activeEvents.value[existingIndex] = event
    } else {
      activeEvents.value.push(event)
    }
  }

  const removeActiveEvent = (eventId) => {
    const index = activeEvents.value.findIndex(e => e.id === eventId)
    if (index >= 0) {
      activeEvents.value.splice(index, 1)
    }
  }

  const updateActiveEvent = (eventId, updates) => {
    const index = activeEvents.value.findIndex(e => e.id === eventId)
    if (index >= 0) {
      activeEvents.value[index] = { ...activeEvents.value[index], ...updates }
    }
  }

  const setWorldBoss = (boss) => {
    worldBoss.value = boss
  }

  const clearWorldBoss = () => {
    worldBoss.value = null
  }

  const updateWorldBoss = (updates) => {
    if (worldBoss.value) {
      worldBoss.value = { ...worldBoss.value, ...updates }
    }
  }

  const addChatMessage = (message) => {
    chatMessages.value.push({
      id: Date.now() + Math.random(),
      timestamp: new Date(),
      ...message
    })

    // Keep only last 100 messages
    if (chatMessages.value.length > 100) {
      chatMessages.value = chatMessages.value.slice(-100)
    }
  }

  const addSystemMessage = (message) => {
    addChatMessage({
      type: 'system',
      content: message,
      sender: 'System'
    })
  }

  const setActiveChatTab = (tab) => {
    activeChatTab.value = tab
  }

  const getChatMessages = (tab = null) => {
    const targetTab = tab || activeChatTab.value
    return chatMessages.value.filter(message => {
      switch (targetTab.toLowerCase()) {
        case 'world':
          return message.type === 'world' || message.type === 'system'
        case 'guild':
          return message.type === 'guild'
        case 'party':
          return message.type === 'party'
        case 'whisper':
          return message.type === 'whisper'
        default:
          return true
      }
    })
  }

  const addNearbyPlayer = (player) => {
    const existingIndex = nearbyPlayers.value.findIndex(p => p.id === player.id)
    if (existingIndex >= 0) {
      nearbyPlayers.value[existingIndex] = player
    } else {
      nearbyPlayers.value.push(player)
    }
  }

  const removeNearbyPlayer = (playerId) => {
    const index = nearbyPlayers.value.findIndex(p => p.id === playerId)
    if (index >= 0) {
      nearbyPlayers.value.splice(index, 1)
    }
  }

  const updatePlayerLocation = (playerId, location) => {
    const player = nearbyPlayers.value.find(p => p.id === playerId)
    if (player) {
      player.location = { ...player.location, ...location }
    }
  }

  const startCombat = (combatInfo) => {
    inCombat.value = true
    combatData.value = combatInfo
  }

  const endCombat = (result) => {
    inCombat.value = false
    combatData.value = null
    
    // Add combat result to chat
    if (result) {
      addSystemMessage(`Combat ended: ${result.message}`)
    }
  }

  const updateCombat = (update) => {
    if (combatData.value) {
      combatData.value = { ...combatData.value, ...update }
    }
  }

  const startTrade = (tradeInfo) => {
    inTrade.value = true
    tradeData.value = tradeInfo
  }

  const endTrade = () => {
    inTrade.value = false
    tradeData.value = null
  }

  const updateTrade = (update) => {
    if (tradeData.value) {
      tradeData.value = { ...tradeData.value, ...update }
    }
  }

  const sendChatMessage = (message, type = 'world') => {
    if (!socket.value || !isConnected.value) {
      addSystemMessage('Not connected to server')
      return false
    }

    socket.value.emit('chatMessage', {
      content: message,
      type: type
    })

    return true
  }

  const pauseGameUpdates = () => {
    if (socket.value) {
      socket.value.emit('pauseUpdates')
    }
  }

  const resumeGameUpdates = () => {
    if (socket.value) {
      socket.value.emit('resumeUpdates')
    }
  }

  const updateGameSettings = (newSettings) => {
    gameSettings.value = { ...gameSettings.value, ...newSettings }
    
    // Save to localStorage
    localStorage.setItem('gameSettings', JSON.stringify(gameSettings.value))
  }

  const loadGameSettings = () => {
    try {
      const saved = localStorage.getItem('gameSettings')
      if (saved) {
        gameSettings.value = { ...gameSettings.value, ...JSON.parse(saved) }
      }
    } catch (error) {
      console.warn('Failed to load game settings:', error)
    }
  }

  const emitSocketEvent = (event, data) => {
    if (socket.value && isConnected.value) {
      socket.value.emit(event, data)
      return true
    }
    return false
  }

  const joinParty = (partyId) => {
    return emitSocketEvent('joinParty', { partyId })
  }

  const leaveParty = () => {
    partyMembers.value = []
    return emitSocketEvent('leaveParty')
  }

  const inviteToParty = (playerId) => {
    return emitSocketEvent('partyInvite', { playerId })
  }

  const kickFromParty = (playerId) => {
    const index = partyMembers.value.findIndex(p => p.id === playerId)
    if (index >= 0) {
      partyMembers.value.splice(index, 1)
    }
    return emitSocketEvent('kickFromParty', { playerId })
  }

  const teleportToPlayer = (playerId) => {
    return emitSocketEvent('teleportToPlayer', { playerId })
  }

  const useItem = (itemId, slot = null) => {
    return emitSocketEvent('useItem', { itemId, slot })
  }

  const castSpell = (spellId, targetId = null) => {
    return emitSocketEvent('castSpell', { spellId, targetId })
  }

  const attackTarget = (targetId) => {
    return emitSocketEvent('attack', { targetId })
  }

  const moveToLocation = (x, y, zone = null) => {
    return emitSocketEvent('move', { x, y, zone })
  }

  const interactWithNPC = (npcId) => {
    return emitSocketEvent('interactNPC', { npcId })
  }

  const pickupItem = (itemId) => {
    return emitSocketEvent('pickupItem', { itemId })
  }

  const dropItem = (itemId, quantity = 1) => {
    return emitSocketEvent('dropItem', { itemId, quantity })
  }

  const openContainer = (containerId) => {
    return emitSocketEvent('openContainer', { containerId })
  }

  // Reset store state (for logout)
  const resetGameState = () => {
    connectionStatus.value = 'disconnected'
    socket.value = null
    worldTime.value = { day: 1, hour: 12, minute: 0, season: 'spring', year: 1 }
    serverStats.value = { performance: { fps: 60, averageTickTime: 16, memoryUsage: 0 }, players: 0, uptime: 0 }
    serverBoosts.value = []
    activeEvents.value = []
    worldBoss.value = null
    chatMessages.value = []
    activeChatTab.value = 'World'
    nearbyPlayers.value = []
    partyMembers.value = []
    inCombat.value = false
    combatData.value = null
    inTrade.value = false
    tradeData.value = null
    hasUnsavedChanges.value = false
  }

  // Initialize settings on store creation
  loadGameSettings()

  return {
    // State
    connectionStatus,
    socket,
    isPageVisible,
    hasUnsavedChanges,
    worldTime,
    serverStats,
    serverBoosts,
    activeEvents,
    worldBoss,
    chatMessages,
    chatTabs,
    activeChatTab,
    nearbyPlayers,
    partyMembers,
    inCombat,
    combatData,
    inTrade,
    tradeData,
    gameSettings,

    // Computed
    isConnected,
    formattedWorldTime,
    seasonColor,
    activeServerBoosts,

    // Actions
    setConnectionStatus,
    setSocket,
    setPageVisibility,
    setWorldTime,
    setServerStats,
    addServerBoost,
    removeServerBoost,
    setServerBoosts,
    addActiveEvent,
    removeActiveEvent,
    updateActiveEvent,
    setWorldBoss,
    clearWorldBoss,
    updateWorldBoss,
    addChatMessage,
    addSystemMessage,
    setActiveChatTab,
    getChatMessages,
    addNearbyPlayer,
    removeNearbyPlayer,
    updatePlayerLocation,
    startCombat,
    endCombat,
    updateCombat,
    startTrade,
    endTrade,
    updateTrade,
    sendChatMessage,
    pauseGameUpdates,
    resumeGameUpdates,
    updateGameSettings,
    loadGameSettings,
    emitSocketEvent,
    joinParty,
    leaveParty,
    inviteToParty,
    kickFromParty,
    teleportToPlayer,
    useItem,
    castSpell,
    attackTarget,
    moveToLocation,
    interactWithNPC,
    pickupItem,
    dropItem,
    openContainer,
    resetGameState
  }
})