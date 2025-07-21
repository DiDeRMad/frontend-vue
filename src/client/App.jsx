import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';

// Store
import { store } from './store';

// Contexts
import { AuthProvider } from './contexts/AuthContext';
import { GameProvider } from './contexts/GameContext';
import { SocketProvider } from './contexts/SocketContext';
import { AudioProvider } from './contexts/AudioContext';
import { LocalizationProvider } from './contexts/LocalizationContext';

// Components
import { LoadingScreen } from './components/ui/LoadingScreen';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { PrivateRoute } from './components/ui/PrivateRoute';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { CharacterSelectPage } from './pages/CharacterSelectPage';
import { CharacterCreatePage } from './pages/CharacterCreatePage';
import { GamePage } from './pages/GamePage';
import { SettingsPage } from './pages/SettingsPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { NewsPage } from './pages/NewsPage';
import { ShopPage } from './pages/ShopPage';

// Styles
import './styles/global.css';
import './styles/animations.css';
import './styles/ui.css';

// Create query client
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            cacheTime: 10 * 60 * 1000, // 10 minutes
            retry: 3,
            refetchOnWindowFocus: false,
        },
    },
});

function App() {
    const [isLoading, setIsLoading] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [loadingMessage, setLoadingMessage] = useState('Initializing...');

    useEffect(() => {
        // Initialize app
        const initializeApp = async () => {
            try {
                // Load essential resources
                setLoadingMessage('Loading game assets...');
                setLoadingProgress(20);
                
                // Load configuration
                await loadConfiguration();
                setLoadingProgress(40);
                
                // Preload essential assets
                setLoadingMessage('Loading textures...');
                await preloadAssets();
                setLoadingProgress(60);
                
                // Initialize audio system
                setLoadingMessage('Initializing audio...');
                await initializeAudio();
                setLoadingProgress(80);
                
                // Check server status
                setLoadingMessage('Connecting to server...');
                await checkServerStatus();
                setLoadingProgress(100);
                
                // Small delay for smooth transition
                setTimeout(() => {
                    setIsLoading(false);
                }, 500);
                
            } catch (error) {
                console.error('Failed to initialize app:', error);
                setLoadingMessage('Failed to connect to server. Please try again later.');
            }
        };

        initializeApp();
    }, []);

    const loadConfiguration = async () => {
        // Load game configuration from server
        const response = await fetch('/api/config/client');
        const config = await response.json();
        window.gameConfig = config;
    };

    const preloadAssets = async () => {
        // Preload essential game assets
        const assetsToPreload = [
            '/assets/ui/logo.png',
            '/assets/ui/backgrounds/main-menu.jpg',
            '/assets/sounds/ui/click.ogg',
            '/assets/sounds/ui/hover.ogg',
            '/assets/fonts/medieval.woff2',
        ];

        const promises = assetsToPreload.map(asset => {
            if (asset.endsWith('.png') || asset.endsWith('.jpg')) {
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = asset;
                });
            } else if (asset.endsWith('.ogg') || asset.endsWith('.mp3')) {
                return new Promise((resolve, reject) => {
                    const audio = new Audio();
                    audio.oncanplaythrough = resolve;
                    audio.onerror = reject;
                    audio.src = asset;
                });
            } else if (asset.endsWith('.woff2')) {
                return fetch(asset);
            }
            return Promise.resolve();
        });

        await Promise.all(promises);
    };

    const initializeAudio = async () => {
        // Initialize Web Audio API context
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        if (window.AudioContext) {
            window.audioContext = new AudioContext();
        }
    };

    const checkServerStatus = async () => {
        const response = await fetch('/api/status');
        if (!response.ok) {
            throw new Error('Server is not responding');
        }
        const status = await response.json();
        window.serverStatus = status;
    };

    if (isLoading) {
        return (
            <LoadingScreen
                progress={loadingProgress}
                message={loadingMessage}
            />
        );
    }

    return (
        <ErrorBoundary>
            <Provider store={store}>
                <QueryClientProvider client={queryClient}>
                    <LocalizationProvider>
                        <AuthProvider>
                            <AudioProvider>
                                <Router>
                                    <AnimatePresence mode="wait">
                                        <Routes>
                                            {/* Public routes */}
                                            <Route path="/" element={<LandingPage />} />
                                            <Route path="/login" element={<LoginPage />} />
                                            <Route path="/register" element={<RegisterPage />} />
                                            <Route path="/news" element={<NewsPage />} />
                                            <Route path="/leaderboard" element={<LeaderboardPage />} />
                                            
                                            {/* Protected routes */}
                                            <Route element={<PrivateRoute />}>
                                                <Route path="/characters" element={<CharacterSelectPage />} />
                                                <Route path="/create-character" element={<CharacterCreatePage />} />
                                                <Route path="/settings" element={<SettingsPage />} />
                                                <Route path="/shop" element={<ShopPage />} />
                                                
                                                {/* Game route with socket provider */}
                                                <Route
                                                    path="/game"
                                                    element={
                                                        <SocketProvider>
                                                            <GameProvider>
                                                                <GamePage />
                                                            </GameProvider>
                                                        </SocketProvider>
                                                    }
                                                />
                                            </Route>
                                            
                                            {/* Fallback */}
                                            <Route path="*" element={<Navigate to="/" replace />} />
                                        </Routes>
                                    </AnimatePresence>
                                </Router>
                                
                                {/* Global UI elements */}
                                <Toaster
                                    position="top-right"
                                    toastOptions={{
                                        duration: 4000,
                                        style: {
                                            background: 'rgba(0, 0, 0, 0.9)',
                                            color: '#fff',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '4px',
                                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                                        },
                                        success: {
                                            iconTheme: {
                                                primary: '#4ade80',
                                                secondary: '#fff',
                                            },
                                        },
                                        error: {
                                            iconTheme: {
                                                primary: '#ef4444',
                                                secondary: '#fff',
                                            },
                                        },
                                    }}
                                />
                                
                                {/* Development tools */}
                                {process.env.NODE_ENV === 'development' && (
                                    <ReactQueryDevtools initialIsOpen={false} />
                                )}
                            </AudioProvider>
                        </AuthProvider>
                    </LocalizationProvider>
                </QueryClientProvider>
            </Provider>
        </ErrorBoundary>
    );
}

export default App;