import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from './stores/store';
import LoadingScreen from './components/ui/LoadingScreen';
import { useAuth } from './hooks/useAuth';

// Lazy load major components
const LoginPage = lazy(() => import('./pages/LoginPage'));
const CharacterSelect = lazy(() => import('./pages/CharacterSelect'));
const GameWorld = lazy(() => import('./pages/GameWorld'));
const CharacterCreation = lazy(() => import('./pages/CharacterCreation'));

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const App: React.FC = () => {
  const { theme } = useSelector((state: RootState) => state.settings);

  useEffect(() => {
    // Apply theme
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <Router>
      <div className="app">
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Protected routes */}
            <Route
              path="/character-select"
              element={
                <ProtectedRoute>
                  <CharacterSelect />
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
            <Route
              path="/game"
              element={
                <ProtectedRoute>
                  <GameWorld />
                </ProtectedRoute>
              }
            />
            
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
};

export default App;