import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import { ErrorBoundary } from 'react-error-boundary'

import App from './App'
import { GameProvider } from '@store/GameContext'
import { AuthProvider } from '@store/AuthContext'
import { SocketProvider } from '@store/SocketContext'
import { SoundProvider } from '@store/SoundContext'
import { ThemeProvider } from '@store/ThemeContext'
import ErrorFallback from '@components/ui/ErrorFallback'
import { GlobalStyles } from '@components/ui/GlobalStyles'
import { GameConfigProvider } from '@store/GameConfigContext'

import '@assets/styles/global.css'
import '@assets/styles/game.css'
import '@assets/styles/animations.css'

// Инициализируем React Query клиент
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 минут
      cacheTime: 10 * 60 * 1000, // 10 минут
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
})

// Логгинг ошибок
const logError = (error: Error, errorInfo: any) => {
  console.error('🎮 Game Error:', error)
  console.error('Error Info:', errorInfo)
  
  // Отправляем ошибки на сервер в продакшене
  if (process.env.NODE_ENV === 'production') {
    // Здесь можно добавить отправку на Sentry или другой сервис
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: error.message,
        stack: error.stack,
        errorInfo,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      }),
    }).catch(() => {
      // Игнорируем ошибки при отправке логов
    })
  }
}

// Проверяем поддержку браузера
const checkBrowserSupport = () => {
  const requirements = {
    WebGL: !!window.WebGLRenderingContext,
    WebSocket: !!window.WebSocket,
    LocalStorage: !!window.localStorage,
    SessionStorage: !!window.sessionStorage,
    IndexedDB: !!window.indexedDB,
    Canvas: !!document.createElement('canvas').getContext,
    AudioContext: !!(window.AudioContext || (window as any).webkitAudioContext),
  }

  const unsupported = Object.entries(requirements)
    .filter(([, supported]) => !supported)
    .map(([feature]) => feature)

  if (unsupported.length > 0) {
    console.warn('⚠️ Неподдерживаемые функции браузера:', unsupported)
    
    if (unsupported.includes('WebGL') || unsupported.includes('WebSocket')) {
      alert(
        'Ваш браузер не поддерживает необходимые технологии для игры.\n' +
        'Пожалуйста, обновите браузер или используйте Chrome/Firefox/Safari последней версии.'
      )
      return false
    }
  }
  
  return true
}

// Инициализация игры
const initializeGame = async () => {
  console.log('🎮 Запуск ETERNAL REALMS v1.0.0')
  
  // Проверяем поддержку браузера
  if (!checkBrowserSupport()) {
    return
  }

  // Предзагружаем критические ресурсы
  const preloadPromises = [
    // Шрифты
    new FontFace('MedievalSharp', 'url(/fonts/MedievalSharp-Regular.woff2)').load(),
    new FontFace('Cinzel', 'url(/fonts/Cinzel-Regular.woff2)').load(),
    
    // Звуки
    new Promise(resolve => {
      const audio = new Audio('/sounds/ambient/menu.mp3')
      audio.addEventListener('canplaythrough', resolve)
      audio.load()
    }),
    
    // Текстуры
    new Promise(resolve => {
      const img = new Image()
      img.onload = resolve
      img.src = '/images/ui/loading-bg.webp'
    }),
  ]

  try {
    await Promise.all(preloadPromises)
    console.log('✅ Критические ресурсы предзагружены')
  } catch (error) {
    console.warn('⚠️ Ошибка предзагрузки ресурсов:', error)
  }

  // Рендерим приложение
  const container = document.getElementById('root')
  if (!container) {
    throw new Error('Root container not found')
  }

  const root = ReactDOM.createRoot(container)
  
  root.render(
    <React.StrictMode>
      <ErrorBoundary FallbackComponent={ErrorFallback} onError={logError}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <ThemeProvider>
              <GameConfigProvider>
                <AuthProvider>
                  <SocketProvider>
                    <SoundProvider>
                      <GameProvider>
                        <GlobalStyles />
                        <App />
                      </GameProvider>
                    </SoundProvider>
                  </SocketProvider>
                </AuthProvider>
              </GameConfigProvider>
            </ThemeProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </ErrorBoundary>
    </React.StrictMode>
  )
}

// Запускаем игру
initializeGame().catch((error) => {
  console.error('💥 Критическая ошибка при запуске игры:', error)
  document.body.innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background: linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%);
      color: #e0e0e0;
      font-family: Arial, sans-serif;
      text-align: center;
      padding: 20px;
    ">
      <h1 style="color: #ff6b6b; margin-bottom: 20px;">
        ⚠️ Ошибка загрузки игры
      </h1>
      <p style="margin-bottom: 20px; max-width: 600px;">
        Произошла критическая ошибка при запуске ETERNAL REALMS. 
        Пожалуйста, перезагрузите страницу или обратитесь в поддержку.
      </p>
      <button 
        onclick="window.location.reload()" 
        style="
          background: #4a90e2;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
        "
      >
        Перезагрузить игру
      </button>
      <details style="margin-top: 20px; max-width: 800px;">
        <summary style="cursor: pointer; color: #ccc;">Подробности ошибки</summary>
        <pre style="
          text-align: left; 
          background: rgba(0,0,0,0.3); 
          padding: 10px; 
          border-radius: 4px; 
          margin-top: 10px;
          overflow: auto;
          font-size: 12px;
        ">${error.stack}</pre>
      </details>
    </div>
  `
})