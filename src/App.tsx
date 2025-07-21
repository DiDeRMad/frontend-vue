import React, { useEffect, useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box, CircularProgress, Snackbar, Alert } from '@mui/material';
import { QueryClient, QueryClientProvider } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';

// Game Client
import { GameClient } from './game/GameClient';
import { AudioManager } from './game/AudioManager';
import { InputManager } from './game/InputManager';
import { UIManager } from './game/UIManager';

// Components
import LoginScreen from './components/auth/LoginScreen';
import RegisterScreen from './components/auth/RegisterScreen';
import CharacterCreation from './components/character/CharacterCreation';
import CharacterSelection from './components/character/CharacterSelection';
import GameHUD from './components/game/GameHUD';
import GameWorld from './components/game/GameWorld';
import InventoryPanel from './components/inventory/InventoryPanel';
import SkillsPanel from './components/skills/SkillsPanel';
import QuestPanel from './components/quests/QuestPanel';
import ChatPanel from './components/chat/ChatPanel';
import MapPanel from './components/map/MapPanel';
import SettingsPanel from './components/settings/SettingsPanel';
import StorePanel from './components/store/StorePanel';
import GuildPanel from './components/guild/GuildPanel';
import PvPPanel from './components/pvp/PvPPanel';
import RaidPanel from './components/raid/RaidPanel';
import TournamentPanel from './components/tournament/TournamentPanel';
import AchievementsPanel from './components/achievements/AchievementsPanel';
import LeaderboardPanel from './components/leaderboard/LeaderboardPanel';
import LoadingScreen from './components/ui/LoadingScreen';
import ErrorBoundary from './components/ui/ErrorBoundary';
import NotificationManager from './components/ui/NotificationManager';

// Stores
import { useAuthStore } from './stores/authStore';
import { useGameStore } from './stores/gameStore';
import { useUIStore } from './stores/uiStore';
import { usePlayerStore } from './stores/playerStore';

// Utils
import { logger } from './utils/logger';
import { config } from './config/gameConfig';

// Styles
import './styles/App.css';
import './styles/animations.css';
import './styles/game.css';

// Create Material-UI theme
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#6366f1',
      light: '#818cf8',
      dark: '#4f46e5',
    },
    secondary: {
      main: '#ec4899',
      light: '#f472b6',
      dark: '#db2777',
    },
    background: {
      default: '#0f0f23',
      paper: '#1a1a2e',
    },
    text: {
      primary: '#e2e8f0',
      secondary: '#94a3b8',
    },
    success: {
      main: '#10b981',
    },
    warning: {
      main: '#f59e0b',
    },
    error: {
      main: '#ef4444',
    },
    info: {
      main: '#3b82f6',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 16px rgba(99, 102, 241, 0.3)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },
});

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

interface AppState {
  isInitialized: boolean;
  gameClient: GameClient | null;
  audioManager: AudioManager | null;
  inputManager: InputManager | null;
  uiManager: UIManager | null;
  error: string | null;
  isLoading: boolean;
}

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>({
    isInitialized: false,
    gameClient: null,
    audioManager: null,
    inputManager: null,
    uiManager: null,
    error: null,
    isLoading: true,
  });

  // Store hooks
  const { isAuthenticated, user, token, login, logout } = useAuthStore();
  const { 
    gameState, 
    isConnected, 
    isLoading: gameLoading, 
    error: gameError,
    initializeGame,
    disconnectGame
  } = useGameStore();
  const { 
    activePanel, 
    notifications, 
    setActivePanel, 
    addNotification,
    removeNotification 
  } = useUIStore();
  const { player, setPlayer, updatePlayer } = usePlayerStore();

  // Initialize game systems
  const initializeGameSystems = useCallback(async () => {
    try {
      logger.info('Initializing game systems...');
      
      // Create game client
      const gameClient = new GameClient(config.server.url, {
        token: token,
        enableReconnection: true,
        maxReconnectAttempts: 5,
        reconnectDelay: 1000,
      });

      // Create audio manager
      const audioManager = new AudioManager({
        volume: {
          master: 0.8,
          music: 0.6,
          sfx: 0.8,
          ambient: 0.4,
          voice: 1.0,
        },
        enableSpatialAudio: true,
        audioFormat: 'webm',
        bufferSize: 4096,
      });

      // Create input manager
      const inputManager = new InputManager({
        keyBindings: config.controls.keyBindings,
        mouseSensitivity: config.controls.mouseSensitivity,
        enableGamepad: true,
        deadZone: 0.1,
      });

      // Create UI manager
      const uiManager = new UIManager({
        scale: 1.0,
        theme: 'dark',
        animations: true,
        accessibility: true,
      });

      // Initialize all systems
      await Promise.all([
        gameClient.initialize(),
        audioManager.initialize(),
        inputManager.initialize(),
        uiManager.initialize(),
      ]);

      // Set up event listeners
      setupGameEventListeners(gameClient, audioManager, inputManager, uiManager);

      // Update app state
      setAppState(prev => ({
        ...prev,
        isInitialized: true,
        gameClient,
        audioManager,
        inputManager,
        uiManager,
        isLoading: false,
      }));

      // Initialize game if authenticated
      if (isAuthenticated && token) {
        await initializeGame(gameClient);
      }

      logger.info('Game systems initialized successfully');

    } catch (error) {
      logger.error('Failed to initialize game systems:', error);
      setAppState(prev => ({
        ...prev,
        error: 'Failed to initialize game systems',
        isLoading: false,
      }));
    }
  }, [token, isAuthenticated, initializeGame]);

  // Set up game event listeners
  const setupGameEventListeners = useCallback((
    gameClient: GameClient,
    audioManager: AudioManager,
    inputManager: InputManager,
    uiManager: UIManager
  ) => {
    // Game connection events
    gameClient.on('connected', () => {
      addNotification({
        type: 'success',
        title: 'Connected',
        message: 'Connected to game server',
        duration: 3000,
      });
    });

    gameClient.on('disconnected', (reason: string) => {
      addNotification({
        type: 'warning',
        title: 'Disconnected',
        message: `Disconnected from server: ${reason}`,
        duration: 5000,
      });
    });

    gameClient.on('error', (error: Error) => {
      addNotification({
        type: 'error',
        title: 'Connection Error',
        message: error.message,
        duration: 5000,
      });
    });

    // Player events
    gameClient.on('playerJoined', (playerData: any) => {
      setPlayer(playerData);
      addNotification({
        type: 'success',
        title: 'Welcome!',
        message: `Welcome to the game, ${playerData.name}!`,
        duration: 3000,
      });
    });

    gameClient.on('playerUpdate', (updates: any) => {
      updatePlayer(updates);
    });

    gameClient.on('playerLevelUp', (newLevel: number) => {
      audioManager.playSound('levelup');
      addNotification({
        type: 'success',
        title: 'Level Up!',
        message: `Congratulations! You reached level ${newLevel}!`,
        duration: 5000,
      });
    });

    // Combat events
    gameClient.on('combatStart', (data: any) => {
      audioManager.playMusic('combat');
      uiManager.showCombatUI(data);
    });

    gameClient.on('combatEnd', (data: any) => {
      audioManager.playMusic('ambient');
      uiManager.hideCombatUI();
    });

    // Achievement events
    gameClient.on('achievementUnlocked', (achievement: any) => {
      audioManager.playSound('achievement');
      addNotification({
        type: 'info',
        title: 'Achievement Unlocked!',
        message: achievement.name,
        duration: 5000,
      });
    });

    // Social events
    gameClient.on('friendRequest', (data: any) => {
      addNotification({
        type: 'info',
        title: 'Friend Request',
        message: `${data.playerName} wants to be your friend`,
        duration: 10000,
        actions: [
          { label: 'Accept', action: () => gameClient.acceptFriendRequest(data.id) },
          { label: 'Decline', action: () => gameClient.declineFriendRequest(data.id) },
        ],
      });
    });

    // Guild events
    gameClient.on('guildInvite', (data: any) => {
      addNotification({
        type: 'info',
        title: 'Guild Invitation',
        message: `You've been invited to join ${data.guildName}`,
        duration: 15000,
        actions: [
          { label: 'Accept', action: () => gameClient.acceptGuildInvite(data.id) },
          { label: 'Decline', action: () => gameClient.declineGuildInvite(data.id) },
        ],
      });
    });

    // Trade events
    gameClient.on('tradeRequest', (data: any) => {
      addNotification({
        type: 'info',
        title: 'Trade Request',
        message: `${data.playerName} wants to trade with you`,
        duration: 10000,
        actions: [
          { label: 'Accept', action: () => gameClient.acceptTrade(data.id) },
          { label: 'Decline', action: () => gameClient.declineTrade(data.id) },
        ],
      });
    });

    // Input handling
    inputManager.on('keyPressed', (key: string) => {
      handleKeyPress(key, gameClient, uiManager);
    });

    inputManager.on('mouseClicked', (event: MouseEvent) => {
      handleMouseClick(event, gameClient);
    });

  }, [addNotification, setPlayer, updatePlayer]);

  // Handle key press events
  const handleKeyPress = useCallback((
    key: string, 
    gameClient: GameClient, 
    uiManager: UIManager
  ) => {
    switch (key) {
      case 'Escape':
        if (activePanel) {
          setActivePanel(null);
        } else {
          setActivePanel('settings');
        }
        break;
      case 'I':
      case 'KeyI':
        setActivePanel(activePanel === 'inventory' ? null : 'inventory');
        break;
      case 'K':
      case 'KeyK':
        setActivePanel(activePanel === 'skills' ? null : 'skills');
        break;
      case 'Q':
      case 'KeyQ':
        setActivePanel(activePanel === 'quests' ? null : 'quests');
        break;
      case 'M':
      case 'KeyM':
        setActivePanel(activePanel === 'map' ? null : 'map');
        break;
      case 'G':
      case 'KeyG':
        setActivePanel(activePanel === 'guild' ? null : 'guild');
        break;
      case 'Enter':
        setActivePanel(activePanel === 'chat' ? null : 'chat');
        break;
      case 'F1':
        uiManager.toggleUI();
        break;
      case 'F2':
        uiManager.takeScreenshot();
        break;
      default:
        gameClient.sendInput(key);
        break;
    }
  }, [activePanel, setActivePanel]);

  // Handle mouse click events
  const handleMouseClick = useCallback((
    event: MouseEvent, 
    gameClient: GameClient
  ) => {
    const target = {
      x: event.clientX,
      y: event.clientY,
      button: event.button,
      type: 'click',
    };
    
    gameClient.sendMouseInput(target);
  }, []);

  // Initialize app on mount
  useEffect(() => {
    initializeGameSystems();
    
    return () => {
      // Cleanup on unmount
      if (appState.gameClient) {
        disconnectGame();
      }
    };
  }, [initializeGameSystems]);

  // Handle authentication changes
  useEffect(() => {
    if (isAuthenticated && token && appState.gameClient && !isConnected) {
      initializeGame(appState.gameClient);
    } else if (!isAuthenticated && appState.gameClient && isConnected) {
      disconnectGame();
    }
  }, [isAuthenticated, token, appState.gameClient, isConnected, initializeGame, disconnectGame]);

  // Show loading screen during initialization
  if (appState.isLoading || !appState.isInitialized) {
    return (
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <LoadingScreen 
          message="Initializing game systems..."
          progress={appState.isLoading ? undefined : 100}
        />
      </ThemeProvider>
    );
  }

  // Show error screen if initialization failed
  if (appState.error) {
    return (
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="100vh"
          p={4}
        >
          <Alert severity="error" sx={{ mb: 2, maxWidth: 500 }}>
            {appState.error}
          </Alert>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#6366f1',
              color: 'white',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 600,
            }}
          >
            Reload Application
          </button>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <Router>
            <Box className="app-container" sx={{ minHeight: '100vh' }}>
              <AnimatePresence mode="wait">
                <Routes>
                  <Route 
                    path="/login" 
                    element={
                      !isAuthenticated ? 
                        <LoginScreen gameClient={appState.gameClient!} /> : 
                        <Navigate to="/game" replace />
                    } 
                  />
                  <Route 
                    path="/register" 
                    element={
                      !isAuthenticated ? 
                        <RegisterScreen gameClient={appState.gameClient!} /> : 
                        <Navigate to="/game" replace />
                    } 
                  />
                  <Route 
                    path="/character-creation" 
                    element={
                      isAuthenticated ? 
                        <CharacterCreation gameClient={appState.gameClient!} /> : 
                        <Navigate to="/login" replace />
                    } 
                  />
                  <Route 
                    path="/character-selection" 
                    element={
                      isAuthenticated ? 
                        <CharacterSelection gameClient={appState.gameClient!} /> : 
                        <Navigate to="/login" replace />
                    } 
                  />
                  <Route 
                    path="/game" 
                    element={
                      isAuthenticated && player ? 
                        <GameInterface 
                          gameClient={appState.gameClient!}
                          audioManager={appState.audioManager!}
                          inputManager={appState.inputManager!}
                          uiManager={appState.uiManager!}
                        /> : 
                        <Navigate to="/login" replace />
                    } 
                  />
                  <Route 
                    path="/" 
                    element={
                      <Navigate 
                        to={isAuthenticated ? "/game" : "/login"} 
                        replace 
                      />
                    } 
                  />
                </Routes>
              </AnimatePresence>

              {/* Global UI Components */}
              <NotificationManager 
                notifications={notifications}
                onRemove={removeNotification}
              />

              {/* Game Panels */}
              <AnimatePresence>
                {activePanel === 'inventory' && (
                  <InventoryPanel 
                    player={player}
                    gameClient={appState.gameClient!}
                    onClose={() => setActivePanel(null)}
                  />
                )}
                {activePanel === 'skills' && (
                  <SkillsPanel 
                    player={player}
                    gameClient={appState.gameClient!}
                    onClose={() => setActivePanel(null)}
                  />
                )}
                {activePanel === 'quests' && (
                  <QuestPanel 
                    player={player}
                    gameClient={appState.gameClient!}
                    onClose={() => setActivePanel(null)}
                  />
                )}
                {activePanel === 'map' && (
                  <MapPanel 
                    player={player}
                    gameClient={appState.gameClient!}
                    onClose={() => setActivePanel(null)}
                  />
                )}
                {activePanel === 'settings' && (
                  <SettingsPanel 
                    audioManager={appState.audioManager!}
                    inputManager={appState.inputManager!}
                    uiManager={appState.uiManager!}
                    onClose={() => setActivePanel(null)}
                  />
                )}
                {activePanel === 'guild' && (
                  <GuildPanel 
                    player={player}
                    gameClient={appState.gameClient!}
                    onClose={() => setActivePanel(null)}
                  />
                )}
                {activePanel === 'store' && (
                  <StorePanel 
                    player={player}
                    gameClient={appState.gameClient!}
                    onClose={() => setActivePanel(null)}
                  />
                )}
                {activePanel === 'pvp' && (
                  <PvPPanel 
                    player={player}
                    gameClient={appState.gameClient!}
                    onClose={() => setActivePanel(null)}
                  />
                )}
                {activePanel === 'achievements' && (
                  <AchievementsPanel 
                    player={player}
                    gameClient={appState.gameClient!}
                    onClose={() => setActivePanel(null)}
                  />
                )}
              </AnimatePresence>
            </Box>
          </Router>
        </ErrorBoundary>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

// Game Interface Component
interface GameInterfaceProps {
  gameClient: GameClient;
  audioManager: AudioManager;
  inputManager: InputManager;
  uiManager: UIManager;
}

const GameInterface: React.FC<GameInterfaceProps> = ({
  gameClient,
  audioManager,
  inputManager,
  uiManager,
}) => {
  const { player } = usePlayerStore();
  const { gameState, isConnected } = useGameStore();

  if (!isConnected || !player) {
    return (
      <LoadingScreen 
        message="Connecting to game world..."
        subMessage="Please wait while we establish connection..."
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="game-interface"
    >
      {/* Game World Rendering */}
      <GameWorld 
        gameClient={gameClient}
        audioManager={audioManager}
        inputManager={inputManager}
        uiManager={uiManager}
      />

      {/* Game HUD */}
      <GameHUD 
        player={player}
        gameState={gameState}
        gameClient={gameClient}
      />

      {/* Chat Panel (always visible) */}
      <ChatPanel 
        gameClient={gameClient}
        player={player}
      />
    </motion.div>
  );
};

export default App;