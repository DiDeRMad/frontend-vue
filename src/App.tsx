import React, { useEffect, useState, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import styled from 'styled-components'

import { useAuth } from '@store/AuthContext'
import { useSocket } from '@store/SocketContext'
import { useSound } from '@store/SoundContext'
import { useGameConfig } from '@store/GameConfigContext'

import LoadingScreen from '@components/ui/LoadingScreen'
import LoginScreen from '@components/auth/LoginScreen'
import RegisterScreen from '@components/auth/RegisterScreen'
import MainMenu from '@components/menu/MainMenu'
import CharacterSelection from '@components/character/CharacterSelection'
import CharacterCreation from '@components/character/CharacterCreation'
import GameWorld from '@components/game/GameWorld'
import Settings from '@components/settings/Settings'
import Leaderboards from '@components/leaderboards/Leaderboards'
import Guild from '@components/guild/Guild'
import Shop from '@components/shop/Shop'
import Inventory from '@components/inventory/Inventory'
import Skills from '@components/skills/Skills'
import Quests from '@components/quests/Quests'
import Chat from '@components/chat/Chat'
import PvPArena from '@components/pvp/PvPArena'
import Dungeon from '@components/dungeon/Dungeon'
import Crafting from '@components/crafting/Crafting'
import Trading from '@components/trading/Trading'
import AdminPanel from '@components/admin/AdminPanel'

import { GlobalOverlay } from '@components/ui/GlobalOverlay'
import { NotificationSystem } from '@components/ui/NotificationSystem'
import { ModalSystem } from '@components/ui/ModalSystem'
import { TooltipSystem } from '@components/ui/TooltipSystem'
import { HotkeysSystem } from '@components/ui/HotkeysSystem'

import ProtectedRoute from '@components/auth/ProtectedRoute'
import AdminRoute from '@components/auth/AdminRoute'

const AppContainer = styled.div`
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%);
  color: #e0e0e0;
  font-family: 'MedievalSharp', 'Cinzel', serif;
`

const RouteContainer = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
`

const App: React.FC = () => {
  const { user, isLoading: authLoading, error: authError } = useAuth()
  const { isConnected, connect, disconnect } = useSocket()
  const { playSound, setMasterVolume, isMuted } = useSound()
  const { config, updateConfig } = useGameConfig()
  const location = useLocation()

  const [isInitialized, setIsInitialized] = useState(false)
  const [gameState, setGameState] = useState<'menu' | 'loading' | 'playing'>('menu')

  // Инициализация приложения
  useEffect(() => {
    const initApp = async () => {
      try {
        console.log('🎮 Инициализация ETERNAL REALMS...')

        // Загружаем конфигурацию игры
        await updateConfig()

        // Подключаемся к серверу, если пользователь авторизован
        if (user && !isConnected) {
          await connect()
        }

        // Устанавливаем громкость из настроек
        if (config.sound?.masterVolume !== undefined) {
          setMasterVolume(config.sound.masterVolume)
        }

        // Проигрываем приветственную музыку
        if (location.pathname === '/' || location.pathname === '/menu') {
          playSound('ambient/menu', { loop: true, volume: 0.3 })
        }

        setIsInitialized(true)
        console.log('✅ Приложение инициализировано')
      } catch (error) {
        console.error('💥 Ошибка инициализации:', error)
      }
    }

    initApp()
  }, [user, isConnected, connect, setMasterVolume, playSound, location.pathname, config.sound?.masterVolume, updateConfig])

  // Обработка изменения маршрутов
  useEffect(() => {
    // Останавливаем звуки при смене экрана
    if (location.pathname.includes('/game')) {
      setGameState('playing')
      playSound('ambient/world', { loop: true, volume: 0.2 })
    } else if (location.pathname === '/menu' || location.pathname === '/') {
      setGameState('menu')
      playSound('ambient/menu', { loop: true, volume: 0.3 })
    } else {
      setGameState('loading')
    }
  }, [location.pathname, playSound])

  // Обработка отключения от сервера
  useEffect(() => {
    if (user && !isConnected) {
      console.warn('⚠️ Потеряно соединение с сервером, переподключение...')
      connect()
    }
  }, [user, isConnected, connect])

  // Cleanup при размонтировании
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  // Показываем загрузочный экран
  if (authLoading || !isInitialized) {
    return (
      <AppContainer>
        <LoadingScreen 
          message="Загрузка магических миров..." 
          progress={authLoading ? 50 : 90}
        />
      </AppContainer>
    )
  }

  // Показываем ошибку авторизации
  if (authError) {
    return (
      <AppContainer>
        <LoadingScreen 
          message="Ошибка подключения к серверу" 
          error={authError.message}
        />
      </AppContainer>
    )
  }

  return (
    <AppContainer>
      <RouteContainer>
        <AnimatePresence mode="wait">
          <Suspense fallback={<LoadingScreen message="Загрузка компонента..." />}>
            <Routes location={location} key={location.pathname}>
              {/* Публичные маршруты */}
              <Route 
                path="/login" 
                element={
                  user ? <Navigate to="/menu" replace /> : <LoginScreen />
                } 
              />
              <Route 
                path="/register" 
                element={
                  user ? <Navigate to="/menu" replace /> : <RegisterScreen />
                } 
              />

              {/* Защищенные маршруты */}
              <Route 
                path="/menu" 
                element={
                  <ProtectedRoute>
                    <MainMenu />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/character-select" 
                element={
                  <ProtectedRoute>
                    <CharacterSelection />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/character-create" 
                element={
                  <ProtectedRoute>
                    <CharacterCreation />
                  </ProtectedRoute>
                } 
              />

              {/* Игровые маршруты */}
              <Route 
                path="/game/world" 
                element={
                  <ProtectedRoute requireCharacter>
                    <GameWorld />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/game/pvp" 
                element={
                  <ProtectedRoute requireCharacter>
                    <PvPArena />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/game/dungeon/:dungeonId" 
                element={
                  <ProtectedRoute requireCharacter>
                    <Dungeon />
                  </ProtectedRoute>
                } 
              />

              {/* UI маршруты */}
              <Route 
                path="/inventory" 
                element={
                  <ProtectedRoute requireCharacter>
                    <Inventory />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/skills" 
                element={
                  <ProtectedRoute requireCharacter>
                    <Skills />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/quests" 
                element={
                  <ProtectedRoute requireCharacter>
                    <Quests />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/guild" 
                element={
                  <ProtectedRoute requireCharacter>
                    <Guild />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/shop" 
                element={
                  <ProtectedRoute requireCharacter>
                    <Shop />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/crafting" 
                element={
                  <ProtectedRoute requireCharacter>
                    <Crafting />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/trading" 
                element={
                  <ProtectedRoute requireCharacter>
                    <Trading />
                  </ProtectedRoute>
                } 
              />

              {/* Информационные маршруты */}
              <Route 
                path="/leaderboards" 
                element={
                  <ProtectedRoute>
                    <Leaderboards />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } 
              />

              {/* Админ панель */}
              <Route 
                path="/admin/*" 
                element={
                  <AdminRoute>
                    <AdminPanel />
                  </AdminRoute>
                } 
              />

              {/* Перенаправления */}
              <Route 
                path="/" 
                element={
                  user ? 
                    <Navigate to="/menu" replace /> : 
                    <Navigate to="/login" replace />
                } 
              />
              
              {/* 404 */}
              <Route 
                path="*" 
                element={<Navigate to="/" replace />} 
              />
            </Routes>
          </Suspense>
        </AnimatePresence>
      </RouteContainer>

      {/* Глобальные UI системы */}
      <GlobalOverlay gameState={gameState} />
      <NotificationSystem />
      <ModalSystem />
      <TooltipSystem />
      <HotkeysSystem />
      
      {/* Чат (показывается только в игре) */}
      {gameState === 'playing' && user && (
        <Chat />
      )}

      {/* Индикатор соединения */}
      {user && !isConnected && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 'rgba(255, 107, 107, 0.9)',
          color: 'white',
          padding: '10px 15px',
          borderRadius: '5px',
          zIndex: 10000,
          fontSize: '14px',
          fontWeight: 'bold',
        }}>
          ⚠️ Нет соединения с сервером
        </div>
      )}

      {/* Индикатор звука */}
      {isMuted && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          background: 'rgba(0, 0, 0, 0.7)',
          color: '#ccc',
          padding: '8px 12px',
          borderRadius: '4px',
          zIndex: 10000,
          fontSize: '12px',
        }}>
          🔇 Звук отключен
        </div>
      )}
    </AppContainer>
  )
}

export default App