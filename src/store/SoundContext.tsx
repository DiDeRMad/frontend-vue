import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback, useRef } from 'react'
import { Howl, Howler } from 'howler'
import { storageService } from '@services/storageService'
import { Vector3 } from '@types'

// ==================== ТИПЫ ====================

interface AudioSettings {
  masterVolume: number
  musicVolume: number
  effectsVolume: number
  voiceVolume: number
  ambientVolume: number
  uiVolume: number
  muted: boolean
  musicMuted: boolean
  effectsMuted: boolean
  voiceMuted: boolean
  ambientMuted: boolean
  uiMuted: boolean
  spatialAudio: boolean
  audioQuality: AudioQuality
  maxSources: number
  fadeTime: number
}

export enum AudioQuality {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export enum AudioCategory {
  MUSIC = 'music',
  EFFECTS = 'effects',
  VOICE = 'voice',
  AMBIENT = 'ambient',
  UI = 'ui'
}

interface SoundSource {
  id: string
  howl: Howl
  category: AudioCategory
  volume: number
  loop: boolean
  spatial: boolean
  position?: Vector3
  fadeIn?: boolean
  fadeOut?: boolean
  priority: number
  tags: string[]
  lastPlayed: Date
}

interface SoundState {
  settings: AudioSettings
  sources: Map<string, SoundSource>
  currentMusic: string | null
  currentAmbient: string | null
  loadedSounds: Map<string, Howl>
  isInitialized: boolean
  isLoading: boolean
  loadingProgress: number
  error: string | null
  
  // Статистика
  totalSoundsPlayed: number
  totalLoadTime: number
  memoryUsage: number
  
  // 3D аудио
  listenerPosition: Vector3
  listenerOrientation: Vector3
}

type SoundAction =
  | { type: 'SOUND_LOADING' }
  | { type: 'SOUND_INITIALIZED' }
  | { type: 'SOUND_ERROR'; payload: string }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AudioSettings> }
  | { type: 'ADD_SOURCE'; payload: SoundSource }
  | { type: 'REMOVE_SOURCE'; payload: string }
  | { type: 'UPDATE_SOURCE'; payload: { id: string; updates: Partial<SoundSource> } }
  | { type: 'SET_CURRENT_MUSIC'; payload: string | null }
  | { type: 'SET_CURRENT_AMBIENT'; payload: string | null }
  | { type: 'ADD_LOADED_SOUND'; payload: { id: string; howl: Howl } }
  | { type: 'REMOVE_LOADED_SOUND'; payload: string }
  | { type: 'UPDATE_LOADING_PROGRESS'; payload: number }
  | { type: 'UPDATE_LISTENER_POSITION'; payload: Vector3 }
  | { type: 'UPDATE_LISTENER_ORIENTATION'; payload: Vector3 }
  | { type: 'UPDATE_STATS'; payload: { played?: number; loadTime?: number; memory?: number } }
  | { type: 'CLEAR_ERROR' }

interface SoundContextType {
  // Состояние
  settings: AudioSettings
  isInitialized: boolean
  isLoading: boolean
  loadingProgress: number
  error: string | null
  currentMusic: string | null
  currentAmbient: string | null
  
  // Статистика
  totalSoundsPlayed: number
  totalLoadTime: number
  memoryUsage: number
  
  // Основные методы
  playSound: (id: string, options?: PlaySoundOptions) => Promise<string | null>
  stopSound: (sourceId: string) => void
  pauseSound: (sourceId: string) => void
  resumeSound: (sourceId: string) => void
  stopAllSounds: (category?: AudioCategory) => void
  
  // Музыка
  playMusic: (id: string, fadeTime?: number) => Promise<void>
  stopMusic: (fadeTime?: number) => void
  pauseMusic: () => void
  resumeMusic: () => void
  
  // Звуки окружения
  playAmbient: (id: string, fadeTime?: number) => Promise<void>
  stopAmbient: (fadeTime?: number) => void
  
  // 3D звук
  setListenerPosition: (position: Vector3) => void
  setListenerOrientation: (orientation: Vector3) => void
  updateSoundPosition: (sourceId: string, position: Vector3) => void
  
  // Настройки звука
  setMasterVolume: (volume: number) => void
  setCategoryVolume: (category: AudioCategory, volume: number) => void
  setMuted: (muted: boolean) => void
  setCategoryMuted: (category: AudioCategory, muted: boolean) => void
  updateSettings: (settings: Partial<AudioSettings>) => void
  
  // Предзагрузка
  preloadSound: (id: string, url: string, category: AudioCategory) => Promise<void>
  preloadSounds: (sounds: SoundDefinition[]) => Promise<void>
  unloadSound: (id: string) => void
  unloadAllSounds: () => void
  
  // Утилиты
  isSoundPlaying: (sourceId: string) => boolean
  getSoundDuration: (id: string) => number
  getCurrentTime: (sourceId: string) => number
  setCurrentTime: (sourceId: string, time: number) => void
  fadeSound: (sourceId: string, volume: number, duration: number) => void
  clearError: () => void
  
  // Сохранение/загрузка настроек
  saveSettings: () => void
  loadSettings: () => void
  resetSettings: () => void
}

interface PlaySoundOptions {
  volume?: number
  loop?: boolean
  fadeIn?: number
  position?: Vector3
  priority?: number
  tags?: string[]
  category?: AudioCategory
  onEnd?: () => void
  onLoad?: () => void
  onError?: (error: any) => void
}

interface SoundDefinition {
  id: string
  url: string
  category: AudioCategory
  preload?: boolean
  volume?: number
  loop?: boolean
  spatial?: boolean
}

// ==================== КОНСТАНТЫ ====================

const DEFAULT_SETTINGS: AudioSettings = {
  masterVolume: 0.8,
  musicVolume: 0.7,
  effectsVolume: 0.8,
  voiceVolume: 0.9,
  ambientVolume: 0.6,
  uiVolume: 0.5,
  muted: false,
  musicMuted: false,
  effectsMuted: false,
  voiceMuted: false,
  ambientMuted: false,
  uiMuted: false,
  spatialAudio: true,
  audioQuality: AudioQuality.MEDIUM,
  maxSources: 32,
  fadeTime: 1000,
}

const AUDIO_PATHS = {
  music: '/sounds/music/',
  effects: '/sounds/effects/',
  voice: '/sounds/voice/',
  ambient: '/sounds/ambient/',
  ui: '/sounds/ui/',
}

// ==================== НАЧАЛЬНОЕ СОСТОЯНИЕ ====================

const initialState: SoundState = {
  settings: DEFAULT_SETTINGS,
  sources: new Map(),
  currentMusic: null,
  currentAmbient: null,
  loadedSounds: new Map(),
  isInitialized: false,
  isLoading: false,
  loadingProgress: 0,
  error: null,
  totalSoundsPlayed: 0,
  totalLoadTime: 0,
  memoryUsage: 0,
  listenerPosition: { x: 0, y: 0, z: 0 },
  listenerOrientation: { x: 0, y: 0, z: -1 },
}

// ==================== REDUCER ====================

function soundReducer(state: SoundState, action: SoundAction): SoundState {
  switch (action.type) {
    case 'SOUND_LOADING':
      return {
        ...state,
        isLoading: true,
        error: null,
      }

    case 'SOUND_INITIALIZED':
      return {
        ...state,
        isLoading: false,
        isInitialized: true,
        error: null,
      }

    case 'SOUND_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      }

    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload,
        },
      }

    case 'ADD_SOURCE':
      return {
        ...state,
        sources: new Map(state.sources).set(action.payload.id, action.payload),
      }

    case 'REMOVE_SOURCE':
      const newSources = new Map(state.sources)
      newSources.delete(action.payload)
      return {
        ...state,
        sources: newSources,
      }

    case 'UPDATE_SOURCE':
      const sourceToUpdate = state.sources.get(action.payload.id)
      if (!sourceToUpdate) return state
      
      const updatedSources = new Map(state.sources)
      updatedSources.set(action.payload.id, {
        ...sourceToUpdate,
        ...action.payload.updates,
      })
      
      return {
        ...state,
        sources: updatedSources,
      }

    case 'SET_CURRENT_MUSIC':
      return {
        ...state,
        currentMusic: action.payload,
      }

    case 'SET_CURRENT_AMBIENT':
      return {
        ...state,
        currentAmbient: action.payload,
      }

    case 'ADD_LOADED_SOUND':
      return {
        ...state,
        loadedSounds: new Map(state.loadedSounds).set(action.payload.id, action.payload.howl),
      }

    case 'REMOVE_LOADED_SOUND':
      const newLoadedSounds = new Map(state.loadedSounds)
      newLoadedSounds.delete(action.payload)
      return {
        ...state,
        loadedSounds: newLoadedSounds,
      }

    case 'UPDATE_LOADING_PROGRESS':
      return {
        ...state,
        loadingProgress: action.payload,
      }

    case 'UPDATE_LISTENER_POSITION':
      return {
        ...state,
        listenerPosition: action.payload,
      }

    case 'UPDATE_LISTENER_ORIENTATION':
      return {
        ...state,
        listenerOrientation: action.payload,
      }

    case 'UPDATE_STATS':
      return {
        ...state,
        totalSoundsPlayed: action.payload.played !== undefined 
          ? state.totalSoundsPlayed + action.payload.played 
          : state.totalSoundsPlayed,
        totalLoadTime: action.payload.loadTime !== undefined 
          ? state.totalLoadTime + action.payload.loadTime 
          : state.totalLoadTime,
        memoryUsage: action.payload.memory !== undefined 
          ? action.payload.memory 
          : state.memoryUsage,
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

const SoundContext = createContext<SoundContextType | undefined>(undefined)

// ==================== ПРОВАЙДЕР ====================

interface SoundProviderProps {
  children: ReactNode
}

export const SoundProvider: React.FC<SoundProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(soundReducer, initialState)
  const nextSourceId = useRef(0)
  const cleanupInterval = useRef<NodeJS.Timeout>()

  // ==================== ЭФФЕКТЫ ====================

  // Инициализация звуковой системы
  useEffect(() => {
    const initializeSound = async () => {
      dispatch({ type: 'SOUND_LOADING' })

      try {
        // Загружаем настройки
        loadSettings()

        // Настраиваем глобальные параметры Howler
        Howler.volume(state.settings.masterVolume)
        Howler.mute(state.settings.muted)

        // Настраиваем HTML5 аудио для лучшей производительности
        Howler.html5PoolSize = 10
        Howler.autoSuspend = false

        // Включаем пространственный звук если поддерживается
        if (state.settings.spatialAudio && Howler.ctx) {
          Howler.pos(
            state.listenerPosition.x,
            state.listenerPosition.y,
            state.listenerPosition.z
          )
          Howler.orientation(
            state.listenerOrientation.x,
            state.listenerOrientation.y,
            state.listenerOrientation.z,
            0, 1, 0
          )
        }

        dispatch({ type: 'SOUND_INITIALIZED' })
        console.log('🔊 Звуковая система инициализирована')

      } catch (error: any) {
        console.error('❌ Ошибка инициализации звука:', error)
        dispatch({ type: 'SOUND_ERROR', payload: error.message })
      }
    }

    initializeSound()
  }, [])

  // Автоматическая очистка неиспользуемых источников
  useEffect(() => {
    cleanupInterval.current = setInterval(() => {
      const now = Date.now()
      const sourcesToRemove: string[] = []

      state.sources.forEach((source, id) => {
        // Удаляем источники, которые не играют более 30 секунд
        if (!source.howl.playing() && now - source.lastPlayed.getTime() > 30000) {
          sourcesToRemove.push(id)
        }
      })

      sourcesToRemove.forEach(id => {
        const source = state.sources.get(id)
        if (source) {
          source.howl.unload()
          dispatch({ type: 'REMOVE_SOURCE', payload: id })
        }
      })

      // Обновляем статистику использования памяти
      updateMemoryUsage()
    }, 15000) // Проверяем каждые 15 секунд

    return () => {
      if (cleanupInterval.current) {
        clearInterval(cleanupInterval.current)
      }
    }
  }, [state.sources])

  // Обновление глобальных настроек Howler
  useEffect(() => {
    Howler.volume(state.settings.muted ? 0 : state.settings.masterVolume)
    Howler.mute(state.settings.muted)

    // Обновляем позицию слушателя
    if (state.settings.spatialAudio && Howler.ctx) {
      Howler.pos(
        state.listenerPosition.x,
        state.listenerPosition.y,
        state.listenerPosition.z
      )
      Howler.orientation(
        state.listenerOrientation.x,
        state.listenerOrientation.y,
        state.listenerOrientation.z,
        0, 1, 0
      )
    }
  }, [state.settings, state.listenerPosition, state.listenerOrientation])

  // ==================== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ====================

  const generateSourceId = (): string => {
    return `source_${++nextSourceId.current}`
  }

  const getCategoryVolume = (category: AudioCategory): number => {
    switch (category) {
      case AudioCategory.MUSIC:
        return state.settings.musicMuted ? 0 : state.settings.musicVolume
      case AudioCategory.EFFECTS:
        return state.settings.effectsMuted ? 0 : state.settings.effectsVolume
      case AudioCategory.VOICE:
        return state.settings.voiceMuted ? 0 : state.settings.voiceVolume
      case AudioCategory.AMBIENT:
        return state.settings.ambientMuted ? 0 : state.settings.ambientVolume
      case AudioCategory.UI:
        return state.settings.uiMuted ? 0 : state.settings.uiVolume
      default:
        return 1
    }
  }

  const getSoundUrl = (id: string, category: AudioCategory): string => {
    const basePath = AUDIO_PATHS[category] || '/sounds/'
    return `${basePath}${id}.${getAudioFormat()}`
  }

  const getAudioFormat = (): string => {
    // Выбираем формат на основе поддержки браузера и качества
    const audio = new Audio()
    
    if (state.settings.audioQuality === AudioQuality.HIGH) {
      if (audio.canPlayType('audio/flac')) return 'flac'
      if (audio.canPlayType('audio/wav')) return 'wav'
    }
    
    if (audio.canPlayType('audio/ogg; codecs="vorbis"')) return 'ogg'
    if (audio.canPlayType('audio/mpeg')) return 'mp3'
    if (audio.canPlayType('audio/wav')) return 'wav'
    
    return 'mp3' // fallback
  }

  const updateMemoryUsage = () => {
    let totalMemory = 0
    
    state.loadedSounds.forEach((howl) => {
      // Приблизительная оценка использования памяти
      if (howl._duration) {
        totalMemory += howl._duration * 44100 * 2 * 2 // 44.1kHz, stereo, 16-bit
      }
    })
    
    dispatch({ 
      type: 'UPDATE_STATS', 
      payload: { memory: totalMemory } 
    })
  }

  // ==================== ОСНОВНЫЕ МЕТОДЫ ====================

  const playSound = useCallback(async (id: string, options: PlaySoundOptions = {}): Promise<string | null> => {
    try {
      const {
        volume = 1,
        loop = false,
        fadeIn,
        position,
        priority = 0,
        tags = [],
        category = AudioCategory.EFFECTS,
        onEnd,
        onLoad,
        onError,
      } = options

      // Проверяем, не превышено ли максимальное количество источников
      if (state.sources.size >= state.settings.maxSources) {
        // Останавливаем источник с наименьшим приоритетом
        let lowestPriority = Infinity
        let sourceToRemove: string | null = null
        
        state.sources.forEach((source, id) => {
          if (source.priority < lowestPriority && !source.howl.playing()) {
            lowestPriority = source.priority
            sourceToRemove = id
          }
        })
        
        if (sourceToRemove) {
          stopSound(sourceToRemove)
        } else if (priority <= lowestPriority) {
          console.warn('⚠️ Нет места для нового звука с низким приоритетом')
          return null
        }
      }

      // Получаем или загружаем звук
      let howl = state.loadedSounds.get(id)
      
      if (!howl) {
        const url = getSoundUrl(id, category)
        const startTime = performance.now()
        
        howl = new Howl({
          src: [url],
          volume: 0, // Начинаем с нулевой громкости для плавного фейда
          loop,
          html5: category === AudioCategory.MUSIC || category === AudioCategory.AMBIENT,
          preload: true,
          onload: () => {
            const loadTime = performance.now() - startTime
            dispatch({ type: 'UPDATE_STATS', payload: { loadTime } })
            onLoad?.()
          },
          onloaderror: (soundId, error) => {
            console.error(`❌ Ошибка загрузки звука ${id}:`, error)
            onError?.(error)
          },
        })
        
        dispatch({ type: 'ADD_LOADED_SOUND', payload: { id, howl } })
      }

      // Создаем новый источник звука
      const sourceId = generateSourceId()
      const categoryVolume = getCategoryVolume(category)
      const finalVolume = volume * categoryVolume * state.settings.masterVolume

      // Настраиваем пространственный звук
      if (position && state.settings.spatialAudio) {
        howl.pos(position.x, position.y, position.z)
      }

      const soundId = howl.play()
      
      if (soundId !== undefined) {
        // Настраиваем громкость и фейд
        howl.volume(fadeIn ? 0 : finalVolume, soundId)
        
        if (fadeIn) {
          howl.fade(0, finalVolume, fadeIn, soundId)
        }

        // Создаем источник
        const source: SoundSource = {
          id: sourceId,
          howl,
          category,
          volume: finalVolume,
          loop,
          spatial: !!position,
          position,
          fadeIn: !!fadeIn,
          priority,
          tags,
          lastPlayed: new Date(),
        }

        dispatch({ type: 'ADD_SOURCE', payload: source })

        // Обработчик завершения
        howl.on('end', () => {
          dispatch({ type: 'REMOVE_SOURCE', payload: sourceId })
          onEnd?.()
        }, soundId)

        dispatch({ type: 'UPDATE_STATS', payload: { played: 1 } })
        
        return sourceId
      }

      return null
    } catch (error: any) {
      console.error(`❌ Ошибка воспроизведения звука ${id}:`, error)
      options.onError?.(error)
      return null
    }
  }, [state.loadedSounds, state.sources, state.settings])

  const stopSound = useCallback((sourceId: string) => {
    const source = state.sources.get(sourceId)
    if (source) {
      source.howl.stop()
      dispatch({ type: 'REMOVE_SOURCE', payload: sourceId })
    }
  }, [state.sources])

  const pauseSound = useCallback((sourceId: string) => {
    const source = state.sources.get(sourceId)
    if (source) {
      source.howl.pause()
    }
  }, [state.sources])

  const resumeSound = useCallback((sourceId: string) => {
    const source = state.sources.get(sourceId)
    if (source) {
      source.howl.play()
    }
  }, [state.sources])

  const stopAllSounds = useCallback((category?: AudioCategory) => {
    state.sources.forEach((source, id) => {
      if (!category || source.category === category) {
        source.howl.stop()
        dispatch({ type: 'REMOVE_SOURCE', payload: id })
      }
    })
  }, [state.sources])

  // ==================== МУЗЫКА ====================

  const playMusic = useCallback(async (id: string, fadeTime: number = state.settings.fadeTime): Promise<void> => {
    // Останавливаем текущую музыку
    if (state.currentMusic) {
      await stopMusic(fadeTime)
    }

    const sourceId = await playSound(id, {
      category: AudioCategory.MUSIC,
      loop: true,
      fadeIn: fadeTime,
      priority: 100, // Высокий приоритет для музыки
    })

    if (sourceId) {
      dispatch({ type: 'SET_CURRENT_MUSIC', payload: sourceId })
    }
  }, [state.currentMusic, state.settings.fadeTime, playSound])

  const stopMusic = useCallback(async (fadeTime: number = state.settings.fadeTime): Promise<void> => {
    if (state.currentMusic) {
      const source = state.sources.get(state.currentMusic)
      if (source) {
        if (fadeTime > 0) {
          source.howl.fade(source.volume, 0, fadeTime)
          setTimeout(() => {
            stopSound(state.currentMusic!)
            dispatch({ type: 'SET_CURRENT_MUSIC', payload: null })
          }, fadeTime)
        } else {
          stopSound(state.currentMusic)
          dispatch({ type: 'SET_CURRENT_MUSIC', payload: null })
        }
      }
    }
  }, [state.currentMusic, state.sources, state.settings.fadeTime, stopSound])

  const pauseMusic = useCallback(() => {
    if (state.currentMusic) {
      pauseSound(state.currentMusic)
    }
  }, [state.currentMusic, pauseSound])

  const resumeMusic = useCallback(() => {
    if (state.currentMusic) {
      resumeSound(state.currentMusic)
    }
  }, [state.currentMusic, resumeSound])

  // ==================== ЗВУКИ ОКРУЖЕНИЯ ====================

  const playAmbient = useCallback(async (id: string, fadeTime: number = state.settings.fadeTime): Promise<void> => {
    // Останавливаем текущий эмбиент
    if (state.currentAmbient) {
      await stopAmbient(fadeTime)
    }

    const sourceId = await playSound(id, {
      category: AudioCategory.AMBIENT,
      loop: true,
      fadeIn: fadeTime,
      priority: 80, // Высокий приоритет для эмбиента
    })

    if (sourceId) {
      dispatch({ type: 'SET_CURRENT_AMBIENT', payload: sourceId })
    }
  }, [state.currentAmbient, state.settings.fadeTime, playSound])

  const stopAmbient = useCallback(async (fadeTime: number = state.settings.fadeTime): Promise<void> => {
    if (state.currentAmbient) {
      const source = state.sources.get(state.currentAmbient)
      if (source) {
        if (fadeTime > 0) {
          source.howl.fade(source.volume, 0, fadeTime)
          setTimeout(() => {
            stopSound(state.currentAmbient!)
            dispatch({ type: 'SET_CURRENT_AMBIENT', payload: null })
          }, fadeTime)
        } else {
          stopSound(state.currentAmbient)
          dispatch({ type: 'SET_CURRENT_AMBIENT', payload: null })
        }
      }
    }
  }, [state.currentAmbient, state.sources, state.settings.fadeTime, stopSound])

  // ==================== 3D ЗВУК ====================

  const setListenerPosition = useCallback((position: Vector3) => {
    dispatch({ type: 'UPDATE_LISTENER_POSITION', payload: position })
    
    if (state.settings.spatialAudio && Howler.ctx) {
      Howler.pos(position.x, position.y, position.z)
    }
  }, [state.settings.spatialAudio])

  const setListenerOrientation = useCallback((orientation: Vector3) => {
    dispatch({ type: 'UPDATE_LISTENER_ORIENTATION', payload: orientation })
    
    if (state.settings.spatialAudio && Howler.ctx) {
      Howler.orientation(orientation.x, orientation.y, orientation.z, 0, 1, 0)
    }
  }, [state.settings.spatialAudio])

  const updateSoundPosition = useCallback((sourceId: string, position: Vector3) => {
    const source = state.sources.get(sourceId)
    if (source && source.spatial) {
      source.howl.pos(position.x, position.y, position.z)
      dispatch({ 
        type: 'UPDATE_SOURCE', 
        payload: { id: sourceId, updates: { position } } 
      })
    }
  }, [state.sources])

  // ==================== НАСТРОЙКИ ЗВУКА ====================

  const setMasterVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume))
    dispatch({ 
      type: 'UPDATE_SETTINGS', 
      payload: { masterVolume: clampedVolume } 
    })
    
    Howler.volume(state.settings.muted ? 0 : clampedVolume)
    saveSettings()
  }, [state.settings.muted])

  const setCategoryVolume = useCallback((category: AudioCategory, volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume))
    const settingKey = `${category}Volume` as keyof AudioSettings
    
    dispatch({ 
      type: 'UPDATE_SETTINGS', 
      payload: { [settingKey]: clampedVolume } 
    })
    
    // Обновляем громкость всех источников этой категории
    state.sources.forEach((source) => {
      if (source.category === category) {
        const newVolume = source.volume * clampedVolume
        source.howl.volume(newVolume)
      }
    })
    
    saveSettings()
  }, [state.sources])

  const setMuted = useCallback((muted: boolean) => {
    dispatch({ 
      type: 'UPDATE_SETTINGS', 
      payload: { muted } 
    })
    
    Howler.mute(muted)
    saveSettings()
  }, [])

  const setCategoryMuted = useCallback((category: AudioCategory, muted: boolean) => {
    const settingKey = `${category}Muted` as keyof AudioSettings
    
    dispatch({ 
      type: 'UPDATE_SETTINGS', 
      payload: { [settingKey]: muted } 
    })
    
    // Обновляем громкость всех источников этой категории
    state.sources.forEach((source) => {
      if (source.category === category) {
        source.howl.mute(muted)
      }
    })
    
    saveSettings()
  }, [state.sources])

  const updateSettings = useCallback((settings: Partial<AudioSettings>) => {
    dispatch({ 
      type: 'UPDATE_SETTINGS', 
      payload: settings 
    })
    saveSettings()
  }, [])

  // ==================== ПРЕДЗАГРУЗКА ====================

  const preloadSound = useCallback(async (id: string, url: string, category: AudioCategory): Promise<void> => {
    if (state.loadedSounds.has(id)) {
      return // Уже загружено
    }

    return new Promise((resolve, reject) => {
      const startTime = performance.now()
      
      const howl = new Howl({
        src: [url],
        preload: true,
        onload: () => {
          const loadTime = performance.now() - startTime
          dispatch({ type: 'ADD_LOADED_SOUND', payload: { id, howl } })
          dispatch({ type: 'UPDATE_STATS', payload: { loadTime } })
          resolve()
        },
        onloaderror: (soundId, error) => {
          console.error(`❌ Ошибка предзагрузки звука ${id}:`, error)
          reject(error)
        },
      })
    })
  }, [state.loadedSounds])

  const preloadSounds = useCallback(async (sounds: SoundDefinition[]): Promise<void> => {
    dispatch({ type: 'SOUND_LOADING' })
    
    const promises = sounds.map(async (sound, index) => {
      try {
        const url = sound.url || getSoundUrl(sound.id, sound.category)
        await preloadSound(sound.id, url, sound.category)
        
        const progress = (index + 1) / sounds.length * 100
        dispatch({ type: 'UPDATE_LOADING_PROGRESS', payload: progress })
      } catch (error) {
        console.warn(`⚠️ Не удалось предзагрузить звук ${sound.id}:`, error)
      }
    })

    await Promise.all(promises)
    dispatch({ type: 'SOUND_INITIALIZED' })
  }, [preloadSound])

  const unloadSound = useCallback((id: string) => {
    const howl = state.loadedSounds.get(id)
    if (howl) {
      howl.unload()
      dispatch({ type: 'REMOVE_LOADED_SOUND', payload: id })
    }
  }, [state.loadedSounds])

  const unloadAllSounds = useCallback(() => {
    state.loadedSounds.forEach((howl) => {
      howl.unload()
    })
    
    state.sources.forEach((source, id) => {
      dispatch({ type: 'REMOVE_SOURCE', payload: id })
    })
    
    dispatch({ type: 'REMOVE_LOADED_SOUND', payload: '' }) // Clear all
  }, [state.loadedSounds, state.sources])

  // ==================== УТИЛИТЫ ====================

  const isSoundPlaying = useCallback((sourceId: string): boolean => {
    const source = state.sources.get(sourceId)
    return source ? source.howl.playing() : false
  }, [state.sources])

  const getSoundDuration = useCallback((id: string): number => {
    const howl = state.loadedSounds.get(id)
    return howl ? howl.duration() : 0
  }, [state.loadedSounds])

  const getCurrentTime = useCallback((sourceId: string): number => {
    const source = state.sources.get(sourceId)
    return source ? source.howl.seek() as number : 0
  }, [state.sources])

  const setCurrentTime = useCallback((sourceId: string, time: number) => {
    const source = state.sources.get(sourceId)
    if (source) {
      source.howl.seek(time)
    }
  }, [state.sources])

  const fadeSound = useCallback((sourceId: string, volume: number, duration: number) => {
    const source = state.sources.get(sourceId)
    if (source) {
      source.howl.fade(source.howl.volume(), volume, duration)
      dispatch({ 
        type: 'UPDATE_SOURCE', 
        payload: { id: sourceId, updates: { volume } } 
      })
    }
  }, [state.sources])

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' })
  }, [])

  // ==================== СОХРАНЕНИЕ/ЗАГРУЗКА НАСТРОЕК ====================

  const saveSettings = useCallback(() => {
    storageService.setItem('audioSettings', state.settings)
  }, [state.settings])

  const loadSettings = useCallback(() => {
    const savedSettings = storageService.getItem('audioSettings')
    if (savedSettings) {
      dispatch({ 
        type: 'UPDATE_SETTINGS', 
        payload: { ...DEFAULT_SETTINGS, ...savedSettings } 
      })
    }
  }, [])

  const resetSettings = useCallback(() => {
    dispatch({ 
      type: 'UPDATE_SETTINGS', 
      payload: DEFAULT_SETTINGS 
    })
    saveSettings()
  }, [])

  // ==================== ЗНАЧЕНИЕ КОНТЕКСТА ====================

  const contextValue: SoundContextType = {
    // Состояние
    settings: state.settings,
    isInitialized: state.isInitialized,
    isLoading: state.isLoading,
    loadingProgress: state.loadingProgress,
    error: state.error,
    currentMusic: state.currentMusic,
    currentAmbient: state.currentAmbient,
    
    // Статистика
    totalSoundsPlayed: state.totalSoundsPlayed,
    totalLoadTime: state.totalLoadTime,
    memoryUsage: state.memoryUsage,
    
    // Основные методы
    playSound,
    stopSound,
    pauseSound,
    resumeSound,
    stopAllSounds,
    
    // Музыка
    playMusic,
    stopMusic,
    pauseMusic,
    resumeMusic,
    
    // Звуки окружения
    playAmbient,
    stopAmbient,
    
    // 3D звук
    setListenerPosition,
    setListenerOrientation,
    updateSoundPosition,
    
    // Настройки звука
    setMasterVolume,
    setCategoryVolume,
    setMuted,
    setCategoryMuted,
    updateSettings,
    
    // Предзагрузка
    preloadSound,
    preloadSounds,
    unloadSound,
    unloadAllSounds,
    
    // Утилиты
    isSoundPlaying,
    getSoundDuration,
    getCurrentTime,
    setCurrentTime,
    fadeSound,
    clearError,
    
    // Сохранение/загрузка настроек
    saveSettings,
    loadSettings,
    resetSettings,
  }

  return (
    <SoundContext.Provider value={contextValue}>
      {children}
    </SoundContext.Provider>
  )
}

// ==================== ХУКИ ====================

export const useSound = (): SoundContextType => {
  const context = useContext(SoundContext)
  
  if (context === undefined) {
    throw new Error('useSound должен использоваться внутри SoundProvider')
  }
  
  return context
}

// Хук для быстрого воспроизведения звуков
export const useQuickSound = () => {
  const { playSound } = useSound()
  
  return useCallback((id: string, category: AudioCategory = AudioCategory.EFFECTS, volume: number = 1) => {
    return playSound(id, { category, volume })
  }, [playSound])
}

// Хук для музыкального плеера
export const useMusicPlayer = () => {
  const { 
    playMusic, 
    stopMusic, 
    pauseMusic, 
    resumeMusic, 
    currentMusic,
    isSoundPlaying 
  } = useSound()
  
  const isPlaying = currentMusic ? isSoundPlaying(currentMusic) : false
  
  return {
    playMusic,
    stopMusic,
    pauseMusic,
    resumeMusic,
    currentMusic,
    isPlaying,
  }
}

export default SoundContext