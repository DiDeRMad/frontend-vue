import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react'
import { Character, Quest, GameConfig, WorldState, GameTime, Weather, Combat } from '@types'
import { gameService } from '@services/gameService'
import { characterService } from '@services/characterService'
import { questService } from '@services/questService'
import { notificationService } from '@services/notificationService'
import { useAuth } from './AuthContext'
import { useSocket } from './SocketContext'

// ==================== ТИПЫ ====================

export interface GameState {
  // Персонаж
  currentCharacter: Character | null
  characters: Character[]
  isLoadingCharacter: boolean
  
  // Мир
  worldState: WorldState | null
  gameConfig: GameConfig | null
  serverTime: Date | null
  
  // Квесты
  activeQuests: Quest[]
  availableQuests: Quest[]
  
  // Бой
  currentCombat: Combat | null
  inCombat: boolean
  
  // Интерфейс
  activeWindows: string[]
  uiScale: number
  showDebugInfo: boolean
  
  // Состояние загрузки
  isInitialized: boolean
  isLoading: boolean
  error: string | null
  
  // Настройки игры
  autoLoot: boolean
  showDamageNumbers: boolean
  showPlayerNames: boolean
  pauseOnDisconnect: boolean
  
  // Производительность
  fps: number
  ping: number
  packetLoss: number
}

type GameAction =
  | { type: 'GAME_LOADING' }
  | { type: 'GAME_INITIALIZED' }
  | { type: 'GAME_ERROR'; payload: string }
  | { type: 'SET_CURRENT_CHARACTER'; payload: Character }
  | { type: 'UPDATE_CHARACTER'; payload: Partial<Character> }
  | { type: 'SET_CHARACTERS'; payload: Character[] }
  | { type: 'SET_WORLD_STATE'; payload: WorldState }
  | { type: 'SET_GAME_CONFIG'; payload: GameConfig }
  | { type: 'UPDATE_SERVER_TIME'; payload: Date }
  | { type: 'SET_ACTIVE_QUESTS'; payload: Quest[] }
  | { type: 'SET_AVAILABLE_QUESTS'; payload: Quest[] }
  | { type: 'UPDATE_QUEST'; payload: Quest }
  | { type: 'REMOVE_QUEST'; payload: string }
  | { type: 'START_COMBAT'; payload: Combat }
  | { type: 'UPDATE_COMBAT'; payload: Combat }
  | { type: 'END_COMBAT' }
  | { type: 'OPEN_WINDOW'; payload: string }
  | { type: 'CLOSE_WINDOW'; payload: string }
  | { type: 'SET_UI_SCALE'; payload: number }
  | { type: 'TOGGLE_DEBUG_INFO' }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<GameState> }
  | { type: 'UPDATE_PERFORMANCE'; payload: { fps: number; ping: number; packetLoss: number } }
  | { type: 'CLEAR_ERROR' }

interface GameContextType {
  // Состояние
  state: GameState
  
  // Методы персонажа
  selectCharacter: (characterId: string) => Promise<void>
  createCharacter: (characterData: any) => Promise<void>
  deleteCharacter: (characterId: string) => Promise<void>
  updateCharacter: (updates: Partial<Character>) => void
  
  // Методы квестов
  acceptQuest: (questId: string) => Promise<void>
  abandonQuest: (questId: string) => Promise<void>
  completeQuest: (questId: string, chosenReward?: string) => Promise<void>
  updateQuestProgress: (questId: string, objectiveId: string, progress: number) => void
  
  // Методы боя
  startCombat: (combat: Combat) => void
  updateCombat: (combat: Combat) => void
  endCombat: () => void
  
  // Методы интерфейса
  openWindow: (windowId: string) => void
  closeWindow: (windowId: string) => void
  toggleWindow: (windowId: string) => void
  isWindowOpen: (windowId: string) => boolean
  closeAllWindows: () => void
  
  // Настройки
  updateSettings: (settings: Partial<GameState>) => void
  setUIScale: (scale: number) => void
  toggleDebugInfo: () => void
  
  // Утилиты
  getServerTime: () => Date
  getGameTime: () => GameTime | null
  getWeather: () => Weather | null
  clearError: () => void
  
  // Производительность
  updatePerformance: (fps: number, ping: number, packetLoss: number) => void
}

// ==================== НАЧАЛЬНОЕ СОСТОЯНИЕ ====================

const initialState: GameState = {
  // Персонаж
  currentCharacter: null,
  characters: [],
  isLoadingCharacter: false,
  
  // Мир
  worldState: null,
  gameConfig: null,
  serverTime: null,
  
  // Квесты
  activeQuests: [],
  availableQuests: [],
  
  // Бой
  currentCombat: null,
  inCombat: false,
  
  // Интерфейс
  activeWindows: [],
  uiScale: 1.0,
  showDebugInfo: false,
  
  // Состояние загрузки
  isInitialized: false,
  isLoading: false,
  error: null,
  
  // Настройки игры
  autoLoot: true,
  showDamageNumbers: true,
  showPlayerNames: true,
  pauseOnDisconnect: true,
  
  // Производительность
  fps: 60,
  ping: 0,
  packetLoss: 0,
}

// ==================== REDUCER ====================

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'GAME_LOADING':
      return {
        ...state,
        isLoading: true,
        error: null,
      }

    case 'GAME_INITIALIZED':
      return {
        ...state,
        isLoading: false,
        isInitialized: true,
        error: null,
      }

    case 'GAME_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      }

    case 'SET_CURRENT_CHARACTER':
      return {
        ...state,
        currentCharacter: action.payload,
        isLoadingCharacter: false,
      }

    case 'UPDATE_CHARACTER':
      if (!state.currentCharacter) return state
      
      return {
        ...state,
        currentCharacter: {
          ...state.currentCharacter,
          ...action.payload,
        },
      }

    case 'SET_CHARACTERS':
      return {
        ...state,
        characters: action.payload,
      }

    case 'SET_WORLD_STATE':
      return {
        ...state,
        worldState: action.payload,
        serverTime: new Date(),
      }

    case 'SET_GAME_CONFIG':
      return {
        ...state,
        gameConfig: action.payload,
      }

    case 'UPDATE_SERVER_TIME':
      return {
        ...state,
        serverTime: action.payload,
      }

    case 'SET_ACTIVE_QUESTS':
      return {
        ...state,
        activeQuests: action.payload,
      }

    case 'SET_AVAILABLE_QUESTS':
      return {
        ...state,
        availableQuests: action.payload,
      }

    case 'UPDATE_QUEST':
      return {
        ...state,
        activeQuests: state.activeQuests.map(quest =>
          quest.id === action.payload.id ? action.payload : quest
        ),
      }

    case 'REMOVE_QUEST':
      return {
        ...state,
        activeQuests: state.activeQuests.filter(quest => quest.id !== action.payload),
      }

    case 'START_COMBAT':
      return {
        ...state,
        currentCombat: action.payload,
        inCombat: true,
      }

    case 'UPDATE_COMBAT':
      return {
        ...state,
        currentCombat: action.payload,
      }

    case 'END_COMBAT':
      return {
        ...state,
        currentCombat: null,
        inCombat: false,
      }

    case 'OPEN_WINDOW':
      if (state.activeWindows.includes(action.payload)) return state
      
      return {
        ...state,
        activeWindows: [...state.activeWindows, action.payload],
      }

    case 'CLOSE_WINDOW':
      return {
        ...state,
        activeWindows: state.activeWindows.filter(id => id !== action.payload),
      }

    case 'SET_UI_SCALE':
      return {
        ...state,
        uiScale: Math.max(0.5, Math.min(2.0, action.payload)),
      }

    case 'TOGGLE_DEBUG_INFO':
      return {
        ...state,
        showDebugInfo: !state.showDebugInfo,
      }

    case 'UPDATE_SETTINGS':
      return {
        ...state,
        ...action.payload,
      }

    case 'UPDATE_PERFORMANCE':
      return {
        ...state,
        fps: action.payload.fps,
        ping: action.payload.ping,
        packetLoss: action.payload.packetLoss,
      }

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      }

    default:
      return state
  }
}

// ==================== КОНТЕКСТ ====================

const GameContext = createContext<GameContextType | undefined>(undefined)

// ==================== ПРОВАЙДЕР ====================

interface GameProviderProps {
  children: ReactNode
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState)
  const { user, isAuthenticated } = useAuth()
  const { socket, isConnected } = useSocket()

  // ==================== ЭФФЕКТЫ ====================

  // Инициализация игры
  useEffect(() => {
    if (!isAuthenticated || !isConnected) return

    const initializeGame = async () => {
      dispatch({ type: 'GAME_LOADING' })

      try {
        // Загружаем конфигурацию игры
        const configResponse = await gameService.getConfig()
        if (configResponse.success && configResponse.data) {
          dispatch({ type: 'SET_GAME_CONFIG', payload: configResponse.data })
        }

        // Загружаем персонажей пользователя
        const charactersResponse = await characterService.getCharacters()
        if (charactersResponse.success && charactersResponse.data) {
          dispatch({ type: 'SET_CHARACTERS', payload: charactersResponse.data.characters })
        }

        dispatch({ type: 'GAME_INITIALIZED' })
        console.log('✅ Игра инициализирована')
      } catch (error: any) {
        console.error('❌ Ошибка инициализации игры:', error)
        dispatch({ type: 'GAME_ERROR', payload: error.message || 'Ошибка инициализации игры' })
      }
    }

    initializeGame()
  }, [isAuthenticated, isConnected])

  // Синхронизация времени сервера
  useEffect(() => {
    if (!isConnected) return

    const syncTime = () => {
      dispatch({ type: 'UPDATE_SERVER_TIME', payload: new Date() })
    }

    // Синхронизируем время каждую секунду
    const timeInterval = setInterval(syncTime, 1000)
    
    // Начальная синхронизация
    syncTime()

    return () => clearInterval(timeInterval)
  }, [isConnected])

  // Socket событиы
  useEffect(() => {
    if (!socket) return

    // Обновления персонажа
    socket.on('player:update', (data: { character: Character }) => {
      dispatch({ type: 'UPDATE_CHARACTER', payload: data.character })
    })

    // Обновления мира
    socket.on('world:update', (data: { worldState: WorldState }) => {
      dispatch({ type: 'SET_WORLD_STATE', payload: data.worldState })
    })

    // Квесты
    socket.on('quest:update', (data: { quest: Quest }) => {
      dispatch({ type: 'UPDATE_QUEST', payload: data.quest })
    })

    socket.on('quest:complete', (data: { quest: Quest }) => {
      dispatch({ type: 'REMOVE_QUEST', payload: data.quest.id })
      notificationService.showSuccess(`Квест "${data.quest.name}" завершен!`)
    })

    // Бой
    socket.on('combat:start', (data: { combat: Combat }) => {
      dispatch({ type: 'START_COMBAT', payload: data.combat })
    })

    socket.on('combat:update', (data: { combat: Combat }) => {
      dispatch({ type: 'UPDATE_COMBAT', payload: data.combat })
    })

    socket.on('combat:end', () => {
      dispatch({ type: 'END_COMBAT' })
    })

    // Cleanup
    return () => {
      socket.off('player:update')
      socket.off('world:update')
      socket.off('quest:update')
      socket.off('quest:complete')
      socket.off('combat:start')
      socket.off('combat:update')
      socket.off('combat:end')
    }
  }, [socket])

  // Мониторинг производительности
  useEffect(() => {
    let frameCount = 0
    let lastTime = performance.now()
    let animationId: number

    const measureFPS = () => {
      frameCount++
      const currentTime = performance.now()
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime))
        
        // Обновляем FPS только если значение изменилось
        if (Math.abs(fps - state.fps) > 5) {
          dispatch({ 
            type: 'UPDATE_PERFORMANCE', 
            payload: { 
              fps, 
              ping: state.ping, 
              packetLoss: state.packetLoss 
            } 
          })
        }
        
        frameCount = 0
        lastTime = currentTime
      }
      
      animationId = requestAnimationFrame(measureFPS)
    }

    animationId = requestAnimationFrame(measureFPS)

    return () => cancelAnimationFrame(animationId)
  }, [state.fps, state.ping, state.packetLoss])

  // ==================== МЕТОДЫ ПЕРСОНАЖА ====================

  const selectCharacter = async (characterId: string): Promise<void> => {
    dispatch({ type: 'GAME_LOADING' })

    try {
      const response = await characterService.selectCharacter(characterId)
      
      if (response.success && response.data) {
        dispatch({ type: 'SET_CURRENT_CHARACTER', payload: response.data.character })
        dispatch({ type: 'SET_WORLD_STATE', payload: response.data.worldState })
        
        // Загружаем квесты персонажа
        await loadCharacterQuests(characterId)
        
        notificationService.showSuccess(`Добро пожаловать, ${response.data.character.name}!`)
        console.log(`🎮 Выбран персонаж: ${response.data.character.name}`)
      } else {
        throw new Error(response.error?.message || 'Ошибка выбора персонажа')
      }
    } catch (error: any) {
      dispatch({ type: 'GAME_ERROR', payload: error.message })
      notificationService.showError(error.message)
      throw error
    }
  }

  const createCharacter = async (characterData: any): Promise<void> => {
    try {
      const response = await characterService.createCharacter(characterData)
      
      if (response.success && response.data) {
        // Обновляем список персонажей
        const charactersResponse = await characterService.getCharacters()
        if (charactersResponse.success && charactersResponse.data) {
          dispatch({ type: 'SET_CHARACTERS', payload: charactersResponse.data.characters })
        }
        
        notificationService.showSuccess(`Персонаж ${characterData.name} создан!`)
      } else {
        throw new Error(response.error?.message || 'Ошибка создания персонажа')
      }
    } catch (error: any) {
      notificationService.showError(error.message)
      throw error
    }
  }

  const deleteCharacter = async (characterId: string): Promise<void> => {
    try {
      const response = await characterService.deleteCharacter(characterId)
      
      if (response.success) {
        // Обновляем список персонажей
        const charactersResponse = await characterService.getCharacters()
        if (charactersResponse.success && charactersResponse.data) {
          dispatch({ type: 'SET_CHARACTERS', payload: charactersResponse.data.characters })
        }
        
        notificationService.showSuccess('Персонаж удален')
      } else {
        throw new Error(response.error?.message || 'Ошибка удаления персонажа')
      }
    } catch (error: any) {
      notificationService.showError(error.message)
      throw error
    }
  }

  const updateCharacter = useCallback((updates: Partial<Character>) => {
    dispatch({ type: 'UPDATE_CHARACTER', payload: updates })
  }, [])

  // ==================== МЕТОДЫ КВЕСТОВ ====================

  const loadCharacterQuests = async (characterId: string) => {
    try {
      const response = await questService.getQuests(characterId)
      
      if (response.success && response.data) {
        const activeQuests = response.data.quests.filter(q => q.status === 'active')
        const availableQuests = response.data.quests.filter(q => q.status === 'available')
        
        dispatch({ type: 'SET_ACTIVE_QUESTS', payload: activeQuests })
        dispatch({ type: 'SET_AVAILABLE_QUESTS', payload: availableQuests })
      }
    } catch (error) {
      console.warn('⚠️ Ошибка загрузки квестов:', error)
    }
  }

  const acceptQuest = async (questId: string): Promise<void> => {
    if (!state.currentCharacter) {
      throw new Error('Нет активного персонажа')
    }

    try {
      const response = await questService.acceptQuest(state.currentCharacter.id, questId)
      
      if (response.success && response.data) {
        dispatch({ type: 'UPDATE_QUEST', payload: response.data })
        notificationService.showSuccess(`Квест "${response.data.name}" принят!`)
      } else {
        throw new Error(response.error?.message || 'Ошибка принятия квеста')
      }
    } catch (error: any) {
      notificationService.showError(error.message)
      throw error
    }
  }

  const abandonQuest = async (questId: string): Promise<void> => {
    if (!state.currentCharacter) {
      throw new Error('Нет активного персонажа')
    }

    try {
      const response = await questService.abandonQuest(state.currentCharacter.id, questId)
      
      if (response.success) {
        dispatch({ type: 'REMOVE_QUEST', payload: questId })
        notificationService.showInfo('Квест отменен')
      } else {
        throw new Error(response.error?.message || 'Ошибка отмены квеста')
      }
    } catch (error: any) {
      notificationService.showError(error.message)
      throw error
    }
  }

  const completeQuest = async (questId: string, chosenReward?: string): Promise<void> => {
    if (!state.currentCharacter) {
      throw new Error('Нет активного персонажа')
    }

    try {
      const response = await questService.completeQuest(state.currentCharacter.id, questId, chosenReward)
      
      if (response.success && response.data) {
        dispatch({ type: 'REMOVE_QUEST', payload: questId })
        
        // Обновляем персонажа с новым опытом и предметами
        if (response.data.experience > 0) {
          updateCharacter({ 
            experience: state.currentCharacter.experience + response.data.experience 
          })
        }
        
        notificationService.showSuccess('Квест завершен!')
      } else {
        throw new Error(response.error?.message || 'Ошибка завершения квеста')
      }
    } catch (error: any) {
      notificationService.showError(error.message)
      throw error
    }
  }

  const updateQuestProgress = useCallback((questId: string, objectiveId: string, progress: number) => {
    const quest = state.activeQuests.find(q => q.id === questId)
    if (!quest) return

    const updatedQuest = {
      ...quest,
      progress: {
        ...quest.progress,
        [objectiveId]: progress,
      },
    }

    dispatch({ type: 'UPDATE_QUEST', payload: updatedQuest })
  }, [state.activeQuests])

  // ==================== МЕТОДЫ БОЕВОГО ДЕЙСТВИЯ ====================

  const startCombat = useCallback((combat: Combat) => {
    dispatch({ type: 'START_COMBAT', payload: combat })
  }, [])

  const updateCombat = useCallback((combat: Combat) => {
    dispatch({ type: 'UPDATE_COMBAT', payload: combat })
  }, [])

  const endCombat = useCallback(() => {
    dispatch({ type: 'END_COMBAT' })
  }, [])

  // ==================== МЕТОДЫ ИНТЕРФЕЙСА ====================

  const openWindow = useCallback((windowId: string) => {
    dispatch({ type: 'OPEN_WINDOW', payload: windowId })
  }, [])

  const closeWindow = useCallback((windowId: string) => {
    dispatch({ type: 'CLOSE_WINDOW', payload: windowId })
  }, [])

  const toggleWindow = useCallback((windowId: string) => {
    if (state.activeWindows.includes(windowId)) {
      closeWindow(windowId)
    } else {
      openWindow(windowId)
    }
  }, [state.activeWindows, openWindow, closeWindow])

  const isWindowOpen = useCallback((windowId: string): boolean => {
    return state.activeWindows.includes(windowId)
  }, [state.activeWindows])

  const closeAllWindows = useCallback(() => {
    state.activeWindows.forEach(windowId => {
      dispatch({ type: 'CLOSE_WINDOW', payload: windowId })
    })
  }, [state.activeWindows])

  // ==================== НАСТРОЙКИ ====================

  const updateSettings = useCallback((settings: Partial<GameState>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings })
  }, [])

  const setUIScale = useCallback((scale: number) => {
    dispatch({ type: 'SET_UI_SCALE', payload: scale })
  }, [])

  const toggleDebugInfo = useCallback(() => {
    dispatch({ type: 'TOGGLE_DEBUG_INFO' })
  }, [])

  // ==================== УТИЛИТЫ ====================

  const getServerTime = useCallback((): Date => {
    return state.serverTime || new Date()
  }, [state.serverTime])

  const getGameTime = useCallback((): GameTime | null => {
    return state.worldState?.time || null
  }, [state.worldState])

  const getWeather = useCallback((): Weather | null => {
    return state.worldState?.weather || null
  }, [state.worldState])

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' })
  }, [])

  const updatePerformance = useCallback((fps: number, ping: number, packetLoss: number) => {
    dispatch({ type: 'UPDATE_PERFORMANCE', payload: { fps, ping, packetLoss } })
  }, [])

  // ==================== ЗНАЧЕНИЕ КОНТЕКСТА ====================

  const contextValue: GameContextType = {
    // Состояние
    state,
    
    // Методы персонажа
    selectCharacter,
    createCharacter,
    deleteCharacter,
    updateCharacter,
    
    // Методы квестов
    acceptQuest,
    abandonQuest,
    completeQuest,
    updateQuestProgress,
    
    // Методы боя
    startCombat,
    updateCombat,
    endCombat,
    
    // Методы интерфейса
    openWindow,
    closeWindow,
    toggleWindow,
    isWindowOpen,
    closeAllWindows,
    
    // Настройки
    updateSettings,
    setUIScale,
    toggleDebugInfo,
    
    // Утилиты
    getServerTime,
    getGameTime,
    getWeather,
    clearError,
    
    // Производительность
    updatePerformance,
  }

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  )
}

// ==================== ХУКИ ====================

export const useGame = (): GameContextType => {
  const context = useContext(GameContext)
  
  if (context === undefined) {
    throw new Error('useGame должен использоваться внутри GameProvider')
  }
  
  return context
}

// Хук для работы с текущим персонажем
export const useCurrentCharacter = () => {
  const { state, updateCharacter } = useGame()
  
  return {
    character: state.currentCharacter,
    isLoading: state.isLoadingCharacter,
    updateCharacter,
  }
}

// Хук для работы с квестами
export const useQuests = () => {
  const { 
    state, 
    acceptQuest, 
    abandonQuest, 
    completeQuest, 
    updateQuestProgress 
  } = useGame()
  
  return {
    activeQuests: state.activeQuests,
    availableQuests: state.availableQuests,
    acceptQuest,
    abandonQuest,
    completeQuest,
    updateQuestProgress,
  }
}

// Хук для работы с боем
export const useCombat = () => {
  const { state, startCombat, updateCombat, endCombat } = useGame()
  
  return {
    currentCombat: state.currentCombat,
    inCombat: state.inCombat,
    startCombat,
    updateCombat,
    endCombat,
  }
}

// Хук для работы с интерфейсом
export const useGameUI = () => {
  const { 
    state, 
    openWindow, 
    closeWindow, 
    toggleWindow, 
    isWindowOpen, 
    closeAllWindows,
    setUIScale,
    toggleDebugInfo
  } = useGame()
  
  return {
    activeWindows: state.activeWindows,
    uiScale: state.uiScale,
    showDebugInfo: state.showDebugInfo,
    openWindow,
    closeWindow,
    toggleWindow,
    isWindowOpen,
    closeAllWindows,
    setUIScale,
    toggleDebugInfo,
  }
}

export default GameContext