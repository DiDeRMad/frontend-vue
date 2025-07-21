import React from 'react';
import './LoadingScreen.css';

interface LoadingScreenProps {
  message?: string;
  progress?: number;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = 'Loading...', progress }) => {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="loading-logo">
          <h1>Epic MMORPG</h1>
        </div>
        
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
        
        <div className="loading-message">{message}</div>
        
        {progress !== undefined && (
          <div className="loading-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="progress-text">{Math.round(progress)}%</div>
          </div>
        )}
        
        <div className="loading-tips">
          <p className="tip">Tip: Press TAB to target the nearest enemy</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;