import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
  // State
  const gameSettings = ref({
    // Display Settings
    display: {
      theme: 'dark',
      language: 'en',
      fontSize: 'medium',
      contrast: 'normal',
      colorBlind: false,
      reducedMotion: false,
      highContrast: false,
      dyslexiaFont: false,
      showFPS: false,
      showPing: false,
      fullscreen: false,
      resolution: 'auto',
      quality: 'high',
      vsync: true,
      antiAliasing: true,
      shadows: true,
      particles: true,
      bloom: true,
      screenShake: true,
      uiScale: 1.0,
      chatOpacity: 0.8,
      hudOpacity: 0.9
    },

    // Audio Settings
    audio: {
      masterVolume: 0.8,
      musicVolume: 0.7,
      sfxVolume: 0.8,
      voiceVolume: 0.9,
      ambientVolume: 0.6,
      uiVolume: 0.5,
      muteAll: false,
      muteMusic: false,
      muteSFX: false,
      muteVoice: false,
      muteAmbient: false,
      muteUI: false,
      spatialAudio: true,
      audioCompression: false,
      audioQuality: 'high'
    },

    // Gameplay Settings
    gameplay: {
      autoRun: false,
      clickToMove: true,
      autoTarget: true,
      autoLoot: false,
      showDamageNumbers: true,
      showHealingNumbers: true,
      showExperienceNumbers: true,
      showCriticalHits: true,
      combatText: true,
      questTracker: true,
      minimapRotation: false,
      cameraBob: true,
      cameraShake: true,
      mouseInvert: false,
      mouseSensitivity: 0.5,
      keyRepeat: true,
      doubleClickTime: 500,
      tooltipDelay: 800,
      confirmActions: true,
      confirmDeletion: true,
      confirmTrade: true,
      autoJoinParty: false,
      autoDeclineGuild: false,
      showPlayerNames: true,
      showGuildTags: true,
      showTitles: true,
      showLevelDifference: true,
      pvpMode: false,
      duelRequests: true,
      tradeRequests: true,
      partyInvites: true,
      guildInvites: true,
      friendRequests: true,
      whisperRequests: true
    },

    // Interface Settings
    interface: {
      showMinimap: true,
      showChat: true,
      showQuickBar: true,
      showPlayerFrame: true,
      showTargetFrame: true,
      showPartyFrames: true,
      showBuffs: true,
      showDebuffs: true,
      showCooldowns: true,
      showHotkeys: true,
      showTooltips: true,
      showContextMenu: true,
      showNotifications: true,
      lockInterface: false,
      hideUIInCombat: false,
      fadeUIInCombat: false,
      minimalistUI: false,
      compactMode: false,
      quickBarRows: 2,
      quickBarColumns: 12,
      chatChannels: ['general', 'guild', 'party', 'whisper', 'system'],
      chatTabs: true,
      chatTimestamps: true,
      chatProfanityFilter: false,
      chatLinks: true,
      chatEmotes: true,
      inventorySort: 'type',
      inventoryBags: 4,
      bagSlots: 16
    },

    // Control Settings
    controls: {
      keyBindings: {
        // Movement
        moveForward: 'w',
        moveBackward: 's',
        moveLeft: 'a',
        moveRight: 'd',
        jump: 'space',
        crouch: 'ctrl',
        run: 'shift',
        walk: 'alt',
        autoRun: 'numlock',

        // Combat
        attack: 'leftmouse',
        block: 'rightmouse',
        dodge: 'v',
        parry: 'q',
        spell1: '1',
        spell2: '2',
        spell3: '3',
        spell4: '4',
        spell5: '5',
        spell6: '6',
        spell7: '7',
        spell8: '8',
        spell9: '9',
        spell0: '0',

        // Interface
        inventory: 'i',
        character: 'c',
        quests: 'l',
        guild: 'g',
        map: 'm',
        help: 'h',
        menu: 'escape',
        chat: 'enter',
        whisper: 'r',
        guild_chat: 'g',
        party_chat: 'p',
        say: 's',
        yell: 'y',

        // Quick Actions
        use_item: 'u',
        mount: 'x',
        pet: 'z',
        screenshot: 'f12',
        record: 'f9',
        ping: 'alt+leftmouse'
      },
      mouseSettings: {
        sensitivity: 0.5,
        invertY: false,
        doubleClickSpeed: 500,
        scrollSpeed: 3,
        smoothScrolling: true,
        mouseAcceleration: false
      }
    },

    // Chat Settings
    chat: {
      channels: {
        general: { enabled: true, color: '#ffffff', sound: true },
        guild: { enabled: true, color: '#00ff00', sound: true },
        party: { enabled: true, color: '#00aaff', sound: true },
        whisper: { enabled: true, color: '#ff00ff', sound: true },
        system: { enabled: true, color: '#ffff00', sound: false },
        trade: { enabled: false, color: '#ffa500', sound: false },
        lfg: { enabled: false, color: '#ff8080', sound: false }
      },
      profanityFilter: false,
      spamFilter: true,
      linkFilter: false,
      timestamps: true,
      joinLeaveMessages: false,
      logChat: true,
      chatBubbles: true,
      maxMessages: 500,
      fadeTime: 10000
    },

    // Privacy Settings
    privacy: {
      showOnlineStatus: true,
      allowFriendRequests: true,
      allowPartyInvites: true,
      allowGuildInvites: true,
      allowWhispers: true,
      allowTrade: true,
      allowDuels: true,
      showLocation: true,
      dataCollection: true,
      analytics: true,
      crashReports: true,
      beta: false
    },

    // Performance Settings
    performance: {
      maxFPS: 60,
      renderDistance: 100,
      lodBias: 1.0,
      textureQuality: 'high',
      shadowQuality: 'medium',
      particleQuality: 'high',
      postProcessing: true,
      motionBlur: false,
      depthOfField: false,
      ssao: true,
      bloom: true,
      vignette: false,
      chromaticAberration: false,
      filmGrain: false,
      multiThreading: true,
      hardwareAcceleration: true,
      memoryOptimization: false,
      backgroundFPS: 30,
      minimizedFPS: 5
    },

    // Accessibility Settings
    accessibility: {
      colorBlindSupport: false,
      colorBlindType: 'protanopia',
      highContrast: false,
      reducedMotion: false,
      largeText: false,
      dyslexiaFont: false,
      screenReader: false,
      keyboardNavigation: false,
      voiceOver: false,
      subtitles: false,
      closedCaptions: false,
      signLanguage: false,
      hapticFeedback: false
    }
  })

  const isLoading = ref(false)
  const hasUnsavedChanges = ref(false)
  const lastSaved = ref(null)

  // Computed
  const currentTheme = computed(() => gameSettings.value.display.theme)
  const currentLanguage = computed(() => gameSettings.value.display.language)
  const isMuted = computed(() => gameSettings.value.audio.muteAll)
  const masterVolume = computed(() => gameSettings.value.audio.masterVolume)
  const isFullscreen = computed(() => gameSettings.value.display.fullscreen)
  const showFPS = computed(() => gameSettings.value.display.showFPS)
  const keyBindings = computed(() => gameSettings.value.controls.keyBindings)

  // Watchers
  watch(gameSettings, () => {
    hasUnsavedChanges.value = true
  }, { deep: true })

  // Actions
  const updateSetting = (category, key, value) => {
    if (gameSettings.value[category] && gameSettings.value[category].hasOwnProperty(key)) {
      gameSettings.value[category][key] = value
      hasUnsavedChanges.value = true
    }
  }

  const updateNestedSetting = (category, subcategory, key, value) => {
    if (gameSettings.value[category] && 
        gameSettings.value[category][subcategory] && 
        gameSettings.value[category][subcategory].hasOwnProperty(key)) {
      gameSettings.value[category][subcategory][key] = value
      hasUnsavedChanges.value = true
    }
  }

  const resetCategory = (category) => {
    if (gameSettings.value[category]) {
      // Reset to default values
      const defaults = getDefaultSettings()
      gameSettings.value[category] = { ...defaults[category] }
      hasUnsavedChanges.value = true
    }
  }

  const resetAllSettings = () => {
    gameSettings.value = getDefaultSettings()
    hasUnsavedChanges.value = true
  }

  const saveSettings = async () => {
    try {
      isLoading.value = true
      
      // Save to localStorage
      localStorage.setItem('game_settings', JSON.stringify(gameSettings.value))
      
      // Save to server if authenticated
      const authStore = useAuthStore()
      if (authStore.isAuthenticated) {
        // Make API call to save settings
        await $http.post('/api/settings', gameSettings.value)
      }
      
      hasUnsavedChanges.value = false
      lastSaved.value = new Date().toISOString()
      
      // Apply settings immediately
      applySettings()
      
      return { success: true }
    } catch (error) {
      console.error('Failed to save settings:', error)
      return { success: false, error: error.message }
    } finally {
      isLoading.value = false
    }
  }

  const loadSettings = async () => {
    try {
      isLoading.value = true
      
      // Load from localStorage first
      const localSettings = localStorage.getItem('game_settings')
      if (localSettings) {
        const parsed = JSON.parse(localSettings)
        gameSettings.value = { ...getDefaultSettings(), ...parsed }
      }
      
      // Load from server if authenticated
      const authStore = useAuthStore()
      if (authStore.isAuthenticated) {
        try {
          const response = await $http.get('/api/settings')
          if (response.data.settings) {
            gameSettings.value = { ...gameSettings.value, ...response.data.settings }
          }
        } catch (error) {
          console.warn('Failed to load server settings:', error)
        }
      }
      
      hasUnsavedChanges.value = false
      applySettings()
      
      return { success: true }
    } catch (error) {
      console.error('Failed to load settings:', error)
      return { success: false, error: error.message }
    } finally {
      isLoading.value = false
    }
  }

  const applySettings = () => {
    // Apply theme
    document.documentElement.setAttribute('data-theme', gameSettings.value.display.theme)
    
    // Apply language
    // TODO: Implement i18n
    
    // Apply accessibility settings
    if (gameSettings.value.accessibility.reducedMotion) {
      document.documentElement.style.setProperty('--animation-duration', '0s')
    } else {
      document.documentElement.style.removeProperty('--animation-duration')
    }
    
    if (gameSettings.value.accessibility.largeText) {
      document.documentElement.classList.add('large-text')
    } else {
      document.documentElement.classList.remove('large-text')
    }
    
    if (gameSettings.value.accessibility.highContrast) {
      document.documentElement.classList.add('high-contrast')
    } else {
      document.documentElement.classList.remove('high-contrast')
    }
    
    // Apply UI scale
    document.documentElement.style.setProperty('--ui-scale', gameSettings.value.display.uiScale)
    
    // Apply fullscreen
    if (gameSettings.value.display.fullscreen && !document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else if (!gameSettings.value.display.fullscreen && document.fullscreenElement) {
      document.exitFullscreen()
    }
  }

  const getDefaultSettings = () => {
    return {
      display: {
        theme: 'dark',
        language: 'en',
        fontSize: 'medium',
        contrast: 'normal',
        colorBlind: false,
        reducedMotion: false,
        highContrast: false,
        dyslexiaFont: false,
        showFPS: false,
        showPing: false,
        fullscreen: false,
        resolution: 'auto',
        quality: 'high',
        vsync: true,
        antiAliasing: true,
        shadows: true,
        particles: true,
        bloom: true,
        screenShake: true,
        uiScale: 1.0,
        chatOpacity: 0.8,
        hudOpacity: 0.9
      },
      audio: {
        masterVolume: 0.8,
        musicVolume: 0.7,
        sfxVolume: 0.8,
        voiceVolume: 0.9,
        ambientVolume: 0.6,
        uiVolume: 0.5,
        muteAll: false,
        muteMusic: false,
        muteSFX: false,
        muteVoice: false,
        muteAmbient: false,
        muteUI: false,
        spatialAudio: true,
        audioCompression: false,
        audioQuality: 'high'
      },
      gameplay: {
        autoRun: false,
        clickToMove: true,
        autoTarget: true,
        autoLoot: false,
        showDamageNumbers: true,
        showHealingNumbers: true,
        showExperienceNumbers: true,
        showCriticalHits: true,
        combatText: true,
        questTracker: true,
        minimapRotation: false,
        cameraBob: true,
        cameraShake: true,
        mouseInvert: false,
        mouseSensitivity: 0.5,
        keyRepeat: true,
        doubleClickTime: 500,
        tooltipDelay: 800,
        confirmActions: true,
        confirmDeletion: true,
        confirmTrade: true,
        autoJoinParty: false,
        autoDeclineGuild: false,
        showPlayerNames: true,
        showGuildTags: true,
        showTitles: true,
        showLevelDifference: true,
        pvpMode: false,
        duelRequests: true,
        tradeRequests: true,
        partyInvites: true,
        guildInvites: true,
        friendRequests: true,
        whisperRequests: true
      },
      interface: {
        showMinimap: true,
        showChat: true,
        showQuickBar: true,
        showPlayerFrame: true,
        showTargetFrame: true,
        showPartyFrames: true,
        showBuffs: true,
        showDebuffs: true,
        showCooldowns: true,
        showHotkeys: true,
        showTooltips: true,
        showContextMenu: true,
        showNotifications: true,
        lockInterface: false,
        hideUIInCombat: false,
        fadeUIInCombat: false,
        minimalistUI: false,
        compactMode: false,
        quickBarRows: 2,
        quickBarColumns: 12,
        chatChannels: ['general', 'guild', 'party', 'whisper', 'system'],
        chatTabs: true,
        chatTimestamps: true,
        chatProfanityFilter: false,
        chatLinks: true,
        chatEmotes: true,
        inventorySort: 'type',
        inventoryBags: 4,
        bagSlots: 16
      },
      controls: {
        keyBindings: {
          moveForward: 'w',
          moveBackward: 's',
          moveLeft: 'a',
          moveRight: 'd',
          jump: 'space',
          crouch: 'ctrl',
          run: 'shift',
          walk: 'alt',
          autoRun: 'numlock',
          attack: 'leftmouse',
          block: 'rightmouse',
          dodge: 'v',
          parry: 'q',
          spell1: '1',
          spell2: '2',
          spell3: '3',
          spell4: '4',
          spell5: '5',
          spell6: '6',
          spell7: '7',
          spell8: '8',
          spell9: '9',
          spell0: '0',
          inventory: 'i',
          character: 'c',
          quests: 'l',
          guild: 'g',
          map: 'm',
          help: 'h',
          menu: 'escape',
          chat: 'enter',
          whisper: 'r',
          guild_chat: 'g',
          party_chat: 'p',
          say: 's',
          yell: 'y',
          use_item: 'u',
          mount: 'x',
          pet: 'z',
          screenshot: 'f12',
          record: 'f9',
          ping: 'alt+leftmouse'
        },
        mouseSettings: {
          sensitivity: 0.5,
          invertY: false,
          doubleClickSpeed: 500,
          scrollSpeed: 3,
          smoothScrolling: true,
          mouseAcceleration: false
        }
      },
      chat: {
        channels: {
          general: { enabled: true, color: '#ffffff', sound: true },
          guild: { enabled: true, color: '#00ff00', sound: true },
          party: { enabled: true, color: '#00aaff', sound: true },
          whisper: { enabled: true, color: '#ff00ff', sound: true },
          system: { enabled: true, color: '#ffff00', sound: false },
          trade: { enabled: false, color: '#ffa500', sound: false },
          lfg: { enabled: false, color: '#ff8080', sound: false }
        },
        profanityFilter: false,
        spamFilter: true,
        linkFilter: false,
        timestamps: true,
        joinLeaveMessages: false,
        logChat: true,
        chatBubbles: true,
        maxMessages: 500,
        fadeTime: 10000
      },
      privacy: {
        showOnlineStatus: true,
        allowFriendRequests: true,
        allowPartyInvites: true,
        allowGuildInvites: true,
        allowWhispers: true,
        allowTrade: true,
        allowDuels: true,
        showLocation: true,
        dataCollection: true,
        analytics: true,
        crashReports: true,
        beta: false
      },
      performance: {
        maxFPS: 60,
        renderDistance: 100,
        lodBias: 1.0,
        textureQuality: 'high',
        shadowQuality: 'medium',
        particleQuality: 'high',
        postProcessing: true,
        motionBlur: false,
        depthOfField: false,
        ssao: true,
        bloom: true,
        vignette: false,
        chromaticAberration: false,
        filmGrain: false,
        multiThreading: true,
        hardwareAcceleration: true,
        memoryOptimization: false,
        backgroundFPS: 30,
        minimizedFPS: 5
      },
      accessibility: {
        colorBlindSupport: false,
        colorBlindType: 'protanopia',
        highContrast: false,
        reducedMotion: false,
        largeText: false,
        dyslexiaFont: false,
        screenReader: false,
        keyboardNavigation: false,
        voiceOver: false,
        subtitles: false,
        closedCaptions: false,
        signLanguage: false,
        hapticFeedback: false
      }
    }
  }

  const exportSettings = () => {
    const settingsBlob = new Blob([JSON.stringify(gameSettings.value, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(settingsBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `epic-adventure-settings-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const importSettings = (settingsFile) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target.result)
          gameSettings.value = { ...getDefaultSettings(), ...importedSettings }
          hasUnsavedChanges.value = true
          applySettings()
          resolve({ success: true })
        } catch (error) {
          reject({ success: false, error: 'Invalid settings file' })
        }
      }
      reader.onerror = () => reject({ success: false, error: 'Failed to read file' })
      reader.readAsText(settingsFile)
    })
  }

  const bindKey = (action, key) => {
    if (gameSettings.value.controls.keyBindings[action] !== undefined) {
      gameSettings.value.controls.keyBindings[action] = key
      hasUnsavedChanges.value = true
    }
  }

  const getKeyBinding = (action) => {
    return gameSettings.value.controls.keyBindings[action] || null
  }

  const isKeyBound = (key) => {
    return Object.values(gameSettings.value.controls.keyBindings).includes(key)
  }

  const getActionForKey = (key) => {
    const action = Object.keys(gameSettings.value.controls.keyBindings).find(
      action => gameSettings.value.controls.keyBindings[action] === key
    )
    return action || null
  }

  const validateSettings = () => {
    const errors = []
    
    // Validate volume levels
    Object.keys(gameSettings.value.audio).forEach(key => {
      if (key.includes('Volume')) {
        const value = gameSettings.value.audio[key]
        if (value < 0 || value > 1) {
          errors.push(`Audio ${key} must be between 0 and 1`)
        }
      }
    })
    
    // Validate UI scale
    if (gameSettings.value.display.uiScale < 0.5 || gameSettings.value.display.uiScale > 2.0) {
      errors.push('UI scale must be between 0.5 and 2.0')
    }
    
    // Validate FPS settings
    if (gameSettings.value.performance.maxFPS < 30 || gameSettings.value.performance.maxFPS > 240) {
      errors.push('Max FPS must be between 30 and 240')
    }
    
    return errors
  }

  return {
    // State
    gameSettings,
    isLoading,
    hasUnsavedChanges,
    lastSaved,

    // Computed
    currentTheme,
    currentLanguage,
    isMuted,
    masterVolume,
    isFullscreen,
    showFPS,
    keyBindings,

    // Actions
    updateSetting,
    updateNestedSetting,
    resetCategory,
    resetAllSettings,
    saveSettings,
    loadSettings,
    applySettings,
    getDefaultSettings,
    exportSettings,
    importSettings,
    bindKey,
    getKeyBinding,
    isKeyBound,
    getActionForKey,
    validateSettings
  }
})