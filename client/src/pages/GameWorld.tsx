import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../stores/store';
import { GameEngine } from '../game/GameEngine';
import { gameSocket } from '../services/socket';
import LoadingScreen from '../components/ui/LoadingScreen';
import GameUI from '../components/game/GameUI';
import './GameWorld.css';

const GameWorld: React.FC = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  const { currentCharacter } = useSelector((state: RootState) => state.character);
  const { currentZone } = useSelector((state: RootState) => state.game);
  const { token } = useSelector((state: RootState) => state.auth);
  const { graphics } = useSelector((state: RootState) => state.settings);

  useEffect(() => {
    if (!currentCharacter || !token) {
      navigate('/character-select');
      return;
    }

    let isMounted = true;

    const initializeGame = async () => {
      try {
        // Connect to game server
        setLoadingProgress(10);
        gameSocket.connect(token);
        
        // Wait for connection
        await new Promise((resolve) => {
          const checkConnection = setInterval(() => {
            if (gameSocket.isConnected()) {
              clearInterval(checkConnection);
              resolve(true);
            }
          }, 100);
        });
        
        setLoadingProgress(30);

        // Initialize game engine
        if (containerRef.current && !engineRef.current) {
          engineRef.current = new GameEngine({
            container: containerRef.current,
            quality: graphics.quality,
            showStats: process.env.NODE_ENV === 'development',
          });
          
          setLoadingProgress(50);

          // Load initial zone
          if (currentZone) {
            engineRef.current.loadZone(currentZone);
          }
          
          setLoadingProgress(70);

          // Set player character
          engineRef.current.setPlayerCharacter(currentCharacter);
          
          setLoadingProgress(90);

          // Join zone
          gameSocket.joinZone(currentCharacter.zoneId);
          
          // Start game engine
          engineRef.current.start();
          
          setLoadingProgress(100);
          
          // Hide loading screen after a short delay
          setTimeout(() => {
            if (isMounted) {
              setIsLoading(false);
            }
          }, 500);
        }
      } catch (error) {
        console.error('Failed to initialize game:', error);
        navigate('/character-select');
      }
    };

    initializeGame();

    return () => {
      isMounted = false;
      
      // Cleanup
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
      }
      
      if (currentCharacter) {
        gameSocket.leaveZone(currentCharacter.zoneId);
      }
      
      gameSocket.disconnect();
    };
  }, [currentCharacter, currentZone, token, graphics.quality, navigate]);

  // Handle window focus/blur for performance
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (engineRef.current) {
        if (document.hidden) {
          engineRef.current.stop();
        } else {
          engineRef.current.start();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  if (isLoading) {
    return (
      <LoadingScreen 
        message="Entering world..." 
        progress={loadingProgress}
      />
    );
  }

  return (
    <div className="game-world">
      <div ref={containerRef} className="game-viewport" />
      <GameUI />
    </div>
  );
};

export default GameWorld;