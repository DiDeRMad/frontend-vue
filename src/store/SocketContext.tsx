import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react'
import io, { Socket } from 'socket.io-client'
import { SocketEvents } from '@types'
import { useAuth } from './AuthContext'
import { notificationService } from '@services/notificationService'
import { storageService } from '@services/storageService'

// ==================== ТИПЫ ====================

interface SocketState {
  socket: Socket | null
  isConnected: boolean
  isConnecting: boolean
  connectionAttempts: number
  lastConnected: Date | null
  error: string | null
  
  // Статистика
  latency: number
  packetsReceived: number
  packetsSent: number
  bytesReceived: number
  bytesSent: number
  
  // Настройки переподключения
  autoReconnect: boolean
  maxReconnectAttempts: number
  reconnectDelay: number
}

interface SocketContextType {
  // Состояние
  socket: Socket | null
  isConnected: boolean
  isConnecting: boolean
  connectionAttempts: number
  lastConnected: Date | null
  error: string | null
  latency: number
  
  // Статистика
  packetsReceived: number
  packetsSent: number
  bytesReceived: number
  bytesSent: number
  
  // Методы подключения
  connect: (force?: boolean) => Promise<void>
  disconnect: () => void
  reconnect: () => Promise<void>
  
  // Методы отправки сообщений
  emit: <K extends keyof SocketEvents>(event: K, data: SocketEvents[K]) => void
  emitWithAck: <K extends keyof SocketEvents>(event: K, data: SocketEvents[K], timeout?: number) => Promise<any>
  
  // Методы подписки на события
  on: <K extends keyof SocketEvents>(event: K, callback: (data: SocketEvents[K]) => void) => void
  off: <K extends keyof SocketEvents>(event: K, callback?: (data: SocketEvents[K]) => void) => void
  once: <K extends keyof SocketEvents>(event: K, callback: (data: SocketEvents[K]) => void) => void
  
  // Утилиты
  ping: () => Promise<number>
  clearError: () => void
  resetStats: () => void
  
  // Настройки
  setAutoReconnect: (enabled: boolean) => void
  setMaxReconnectAttempts: (attempts: number) => void
  setReconnectDelay: (delay: number) => void
}

// ==================== КОНСТАНТЫ ====================

const SOCKET_URL = process.env.NODE_ENV === 'production' 
  ? process.env.REACT_APP_SOCKET_URL || window.location.origin
  : 'http://localhost:3001'

const DEFAULT_RECONNECT_DELAY = 1000
const MAX_RECONNECT_ATTEMPTS = 10
const CONNECTION_TIMEOUT = 10000
const PING_INTERVAL = 30000

// ==================== КОНТЕКСТ ====================

const SocketContext = createContext<SocketContextType | undefined>(undefined)

// ==================== ПРОВАЙДЕР ====================

interface SocketProviderProps {
  children: ReactNode
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const { user, token, isAuthenticated } = useAuth()
  
  // Состояние
  const [state, setState] = useState<SocketState>({
    socket: null,
    isConnected: false,
    isConnecting: false,
    connectionAttempts: 0,
    lastConnected: null,
    error: null,
    latency: 0,
    packetsReceived: 0,
    packetsSent: 0,
    bytesReceived: 0,
    bytesSent: 0,
    autoReconnect: true,
    maxReconnectAttempts: MAX_RECONNECT_ATTEMPTS,
    reconnectDelay: DEFAULT_RECONNECT_DELAY,
  })
  
  // Рефы для таймеров
  const reconnectTimer = useRef<NodeJS.Timeout>()
  const pingTimer = useRef<NodeJS.Timeout>()
  const statsTimer = useRef<NodeJS.Timeout>()
  
  // Реф для отслеживания размонтирования
  const isMounted = useRef(true)
  
  // ==================== ЭФФЕКТЫ ====================
  
  // Подключение при аутентификации
  useEffect(() => {
    if (isAuthenticated && token && !state.isConnected && !state.isConnecting) {
      connect()
    } else if (!isAuthenticated && state.socket) {
      disconnect()
    }
    
    return () => {
      isMounted.current = false
    }
  }, [isAuthenticated, token])
  
  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current)
      }
      if (pingTimer.current) {
        clearInterval(pingTimer.current)
      }
      if (statsTimer.current) {
        clearInterval(statsTimer.current)
      }
      
      if (state.socket) {
        state.socket.disconnect()
      }
    }
  }, [])
  
  // ==================== МЕТОДЫ ПОДКЛЮЧЕНИЯ ====================
  
  const connect = useCallback(async (force = false): Promise<void> => {
    if (!isMounted.current) return
    
    if (state.isConnected && !force) {
      console.log('🔌 Уже подключен к серверу')
      return
    }
    
    if (state.isConnecting) {
      console.log('🔌 Подключение уже в процессе')
      return
    }
    
    if (!isAuthenticated || !token) {
      console.warn('⚠️ Нет токена аутентификации для подключения')
      return
    }
    
    setState(prev => ({
      ...prev,
      isConnecting: true,
      error: null,
    }))
    
    try {
      console.log(`🔌 Подключение к серверу: ${SOCKET_URL}`)
      
      // Создаем новое подключение
      const newSocket = io(SOCKET_URL, {
        auth: {
          token,
          userId: user?.id,
          username: user?.username,
        },
        timeout: CONNECTION_TIMEOUT,
        forceNew: force,
        transports: ['websocket', 'polling'],
        upgrade: true,
        autoConnect: false,
      })
      
      // Подключаемся
      newSocket.connect()
      
      // Устанавливаем обработчики событий
      setupSocketHandlers(newSocket)
      
      // Ожидаем подключения
      await new Promise<void>((resolve, reject) => {
        const connectTimeout = setTimeout(() => {
          reject(new Error('Таймаут подключения'))
        }, CONNECTION_TIMEOUT)
        
        newSocket.once('connect', () => {
          clearTimeout(connectTimeout)
          resolve()
        })
        
        newSocket.once('connect_error', (error) => {
          clearTimeout(connectTimeout)
          reject(error)
        })
      })
      
      if (!isMounted.current) return
      
      setState(prev => ({
        ...prev,
        socket: newSocket,
        isConnected: true,
        isConnecting: false,
        connectionAttempts: 0,
        lastConnected: new Date(),
        error: null,
      }))
      
      // Запускаем пинги
      startPingInterval()
      
      // Запускаем статистику
      startStatsTracking()
      
      console.log('✅ Подключен к серверу игры')
      notificationService.showInfo('Подключен к серверу игры')
      
    } catch (error: any) {
      console.error('❌ Ошибка подключения:', error)
      
      if (!isMounted.current) return
      
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: error.message || 'Ошибка подключения',
        connectionAttempts: prev.connectionAttempts + 1,
      }))
      
      // Автоматическое переподключение
      if (state.autoReconnect && state.connectionAttempts < state.maxReconnectAttempts) {
        scheduleReconnect()
      } else {
        notificationService.showError('Не удалось подключиться к серверу игры')
      }
      
      throw error
    }
  }, [isAuthenticated, token, user, state.isConnected, state.isConnecting, state.autoReconnect, state.connectionAttempts, state.maxReconnectAttempts])
  
  const disconnect = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current)
    }
    if (pingTimer.current) {
      clearInterval(pingTimer.current)
    }
    if (statsTimer.current) {
      clearInterval(statsTimer.current)
    }
    
    if (state.socket) {
      state.socket.disconnect()
    }
    
    setState(prev => ({
      ...prev,
      socket: null,
      isConnected: false,
      isConnecting: false,
      error: null,
    }))
    
    console.log('🔌 Отключен от сервера')
  }, [state.socket])
  
  const reconnect = useCallback(async (): Promise<void> => {
    disconnect()
    await new Promise(resolve => setTimeout(resolve, 1000))
    await connect(true)
  }, [connect, disconnect])
  
  // ==================== ОБРАБОТЧИКИ SOCKET СОБЫТИЙ ====================
  
  const setupSocketHandlers = useCallback((socket: Socket) => {
    // Базовые события подключения
    socket.on('connect', () => {
      console.log('🎮 Подключен к игровому серверу')
    })
    
    socket.on('disconnect', (reason) => {
      console.log(`👋 Отключен от сервера: ${reason}`)
      
      if (!isMounted.current) return
      
      setState(prev => ({
        ...prev,
        isConnected: false,
        error: reason === 'io server disconnect' ? 'Сервер разорвал соединение' : null,
      }))
      
      if (pingTimer.current) {
        clearInterval(pingTimer.current)
      }
      if (statsTimer.current) {
        clearInterval(statsTimer.current)
      }
      
      // Автоматическое переподключение при разрыве
      if (state.autoReconnect && reason !== 'io client disconnect') {
        scheduleReconnect()
      }
    })
    
    socket.on('connect_error', (error) => {
      console.error('❌ Ошибка подключения:', error)
      
      if (!isMounted.current) return
      
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: error.message || 'Ошибка подключения',
        connectionAttempts: prev.connectionAttempts + 1,
      }))
    })
    
    // Системные события
    socket.on('server:shutdown', (data) => {
      console.warn('⚠️ Сервер завершает работу:', data.message)
      notificationService.showWarning(data.message)
      
      // Отключаем автопереподключение при выключении сервера
      setState(prev => ({ ...prev, autoReconnect: false }))
    })
    
    socket.on('server:maintenance', (data) => {
      console.warn('🔧 Сервер на техобслуживании:', data.message)
      notificationService.showInfo(data.message)
    })
    
    // Пинг-понг для измерения латентности
    socket.on('pong', (data) => {
      const latency = Date.now() - data
      setState(prev => ({ ...prev, latency }))
    })
    
    // Уведомления
    socket.on('notification', (data) => {
      const { notification } = data
      
      switch (notification.type) {
        case 'info':
          notificationService.showInfo(notification.message)
          break
        case 'success':
          notificationService.showSuccess(notification.message)
          break
        case 'warning':
          notificationService.showWarning(notification.message)
          break
        case 'error':
          notificationService.showError(notification.message)
          break
      }
    })
    
    // Ошибки
    socket.on('error', (data) => {
      console.error('🎮 Ошибка игрового сервера:', data)
      notificationService.showError(data.message || 'Ошибка сервера')
    })
    
    // Статистика пакетов
    const originalEmit = socket.emit.bind(socket)
    socket.emit = (...args: any[]) => {
      setState(prev => ({ 
        ...prev, 
        packetsSent: prev.packetsSent + 1,
        bytesSent: prev.bytesSent + JSON.stringify(args).length
      }))
      return originalEmit(...args)
    }
    
    // Перехватываем входящие пакеты
    const originalOnAny = socket.onAny.bind(socket)
    socket.onAny((event, ...args) => {
      setState(prev => ({ 
        ...prev, 
        packetsReceived: prev.packetsReceived + 1,
        bytesReceived: prev.bytesReceived + JSON.stringify([event, ...args]).length
      }))
    })
    
  }, [state.autoReconnect])
  
  // ==================== ПЕРЕПОДКЛЮЧЕНИЕ ====================
  
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current)
    }
    
    const delay = Math.min(
      state.reconnectDelay * Math.pow(2, state.connectionAttempts),
      30000 // Максимум 30 секунд
    )
    
    console.log(`🔄 Переподключение через ${delay}ms (попытка ${state.connectionAttempts + 1}/${state.maxReconnectAttempts})`)
    
    reconnectTimer.current = setTimeout(() => {
      if (isMounted.current && state.connectionAttempts < state.maxReconnectAttempts) {
        connect()
      }
    }, delay)
  }, [state.reconnectDelay, state.connectionAttempts, state.maxReconnectAttempts, connect])
  
  // ==================== ПИНГ И СТАТИСТИКА ====================
  
  const startPingInterval = useCallback(() => {
    if (pingTimer.current) {
      clearInterval(pingTimer.current)
    }
    
    pingTimer.current = setInterval(() => {
      if (state.socket?.connected) {
        state.socket.emit('ping', Date.now())
      }
    }, PING_INTERVAL)
  }, [state.socket])
  
  const startStatsTracking = useCallback(() => {
    if (statsTimer.current) {
      clearInterval(statsTimer.current)
    }
    
    // Сохраняем статистику каждые 30 секунд
    statsTimer.current = setInterval(() => {
      if (isMounted.current && state.isConnected) {
        storageService.setItem('socketStats', {
          packetsReceived: state.packetsReceived,
          packetsSent: state.packetsSent,
          bytesReceived: state.bytesReceived,
          bytesSent: state.bytesSent,
          lastUpdate: new Date(),
        })
      }
    }, 30000)
  }, [state.isConnected, state.packetsReceived, state.packetsSent, state.bytesReceived, state.bytesSent])
  
  // ==================== ПУБЛИЧНЫЕ МЕТОДЫ ====================
  
  const emit = useCallback(<K extends keyof SocketEvents>(event: K, data: SocketEvents[K]) => {
    if (state.socket?.connected) {
      state.socket.emit(event as string, data)
    } else {
      console.warn('⚠️ Попытка отправки сообщения без подключения:', event)
    }
  }, [state.socket])
  
  const emitWithAck = useCallback(async <K extends keyof SocketEvents>(
    event: K, 
    data: SocketEvents[K], 
    timeout = 5000
  ): Promise<any> => {
    if (!state.socket?.connected) {
      throw new Error('Нет подключения к серверу')
    }
    
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Таймаут ответа сервера'))
      }, timeout)
      
      state.socket!.emit(event as string, data, (response: any) => {
        clearTimeout(timer)
        resolve(response)
      })
    })
  }, [state.socket])
  
  const on = useCallback(<K extends keyof SocketEvents>(
    event: K, 
    callback: (data: SocketEvents[K]) => void
  ) => {
    if (state.socket) {
      state.socket.on(event as string, callback)
    }
  }, [state.socket])
  
  const off = useCallback(<K extends keyof SocketEvents>(
    event: K, 
    callback?: (data: SocketEvents[K]) => void
  ) => {
    if (state.socket) {
      if (callback) {
        state.socket.off(event as string, callback)
      } else {
        state.socket.off(event as string)
      }
    }
  }, [state.socket])
  
  const once = useCallback(<K extends keyof SocketEvents>(
    event: K, 
    callback: (data: SocketEvents[K]) => void
  ) => {
    if (state.socket) {
      state.socket.once(event as string, callback)
    }
  }, [state.socket])
  
  const ping = useCallback(async (): Promise<number> => {
    if (!state.socket?.connected) {
      throw new Error('Нет подключения к серверу')
    }
    
    const start = Date.now()
    await emitWithAck('ping' as any, start)
    return Date.now() - start
  }, [state.socket, emitWithAck])
  
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])
  
  const resetStats = useCallback(() => {
    setState(prev => ({
      ...prev,
      packetsReceived: 0,
      packetsSent: 0,
      bytesReceived: 0,
      bytesSent: 0,
    }))
    
    storageService.removeItem('socketStats')
  }, [])
  
  // ==================== НАСТРОЙКИ ====================
  
  const setAutoReconnect = useCallback((enabled: boolean) => {
    setState(prev => ({ ...prev, autoReconnect: enabled }))
  }, [])
  
  const setMaxReconnectAttempts = useCallback((attempts: number) => {
    setState(prev => ({ ...prev, maxReconnectAttempts: Math.max(1, attempts) }))
  }, [])
  
  const setReconnectDelay = useCallback((delay: number) => {
    setState(prev => ({ ...prev, reconnectDelay: Math.max(100, delay) }))
  }, [])
  
  // ==================== ЗНАЧЕНИЕ КОНТЕКСТА ====================
  
  const contextValue: SocketContextType = {
    // Состояние
    socket: state.socket,
    isConnected: state.isConnected,
    isConnecting: state.isConnecting,
    connectionAttempts: state.connectionAttempts,
    lastConnected: state.lastConnected,
    error: state.error,
    latency: state.latency,
    
    // Статистика
    packetsReceived: state.packetsReceived,
    packetsSent: state.packetsSent,
    bytesReceived: state.bytesReceived,
    bytesSent: state.bytesSent,
    
    // Методы подключения
    connect,
    disconnect,
    reconnect,
    
    // Методы отправки сообщений
    emit,
    emitWithAck,
    
    // Методы подписки на события
    on,
    off,
    once,
    
    // Утилиты
    ping,
    clearError,
    resetStats,
    
    // Настройки
    setAutoReconnect,
    setMaxReconnectAttempts,
    setReconnectDelay,
  }
  
  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  )
}

// ==================== ХУКИ ====================

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext)
  
  if (context === undefined) {
    throw new Error('useSocket должен использоваться внутри SocketProvider')
  }
  
  return context
}

// Хук для автоматической подписки на события
export const useSocketEvent = <K extends keyof SocketEvents>(
  event: K,
  callback: (data: SocketEvents[K]) => void,
  deps: React.DependencyList = []
) => {
  const { on, off } = useSocket()
  
  useEffect(() => {
    on(event, callback)
    return () => off(event, callback)
  }, [event, on, off, ...deps])
}

// Хук для отправки сообщений с автоматическим переподключением
export const useSocketEmit = () => {
  const { emit, emitWithAck, isConnected, connect } = useSocket()
  
  const safeEmit = useCallback(async <K extends keyof SocketEvents>(
    event: K, 
    data: SocketEvents[K],
    options: { 
      requireConnection?: boolean
      autoReconnect?: boolean
      timeout?: number
    } = {}
  ) => {
    const { requireConnection = true, autoReconnect = true, timeout } = options
    
    if (!isConnected) {
      if (autoReconnect) {
        await connect()
      } else if (requireConnection) {
        throw new Error('Нет подключения к серверу')
      }
    }
    
    if (timeout !== undefined) {
      return emitWithAck(event, data, timeout)
    } else {
      emit(event, data)
    }
  }, [emit, emitWithAck, isConnected, connect])
  
  return safeEmit
}

// Хук для мониторинга статуса подключения
export const useConnectionStatus = () => {
  const { isConnected, isConnecting, error, latency, connectionAttempts } = useSocket()
  
  const status = isConnected ? 'connected' : 
                 isConnecting ? 'connecting' : 
                 error ? 'error' : 'disconnected'
  
  return {
    status,
    isConnected,
    isConnecting,
    error,
    latency,
    connectionAttempts,
  }
}

export default SocketContext