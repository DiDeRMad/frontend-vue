import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useLoginMutation } from '../services/api';
import { loginSuccess } from '../stores/slices/authSlice';
import toast from 'react-hot-toast';
import './LoginPage.css';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const result = await login(formData).unwrap();
      dispatch(loginSuccess({
        player: result.player,
        token: result.token,
      }));
      toast.success('Login successful!');
      navigate('/character-select');
    } catch (error: any) {
      toast.error(error.data?.message || 'Login failed');
    }
  };

  return (
    <div className="login-page">
      <div className="login-background">
        <video autoPlay muted loop>
          <source src="/assets/videos/login-bg.mp4" type="video/mp4" />
        </video>
      </div>
      
      <div className="login-container">
        <div className="login-box">
          <h1 className="game-title">Epic MMORPG</h1>
          <h2 className="login-subtitle">
            {isRegisterMode ? 'Create Account' : 'Welcome Back'}
          </h2>
          
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>
            
            {isRegisterMode && (
              <div className="form-group">
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  required
                  className="form-input"
                />
              </div>
            )}
            
            <button
              type="submit"
              disabled={isLoading}
              className="login-button"
            >
              {isLoading ? 'Loading...' : (isRegisterMode ? 'Create Account' : 'Login')}
            </button>
          </form>
          
          <div className="login-footer">
            <p>
              {isRegisterMode ? 'Already have an account?' : "Don't have an account?"}
              <button
                onClick={() => setIsRegisterMode(!isRegisterMode)}
                className="toggle-mode-button"
              >
                {isRegisterMode ? 'Login' : 'Register'}
              </button>
            </p>
          </div>
        </div>
        
        <div className="game-info">
          <div className="server-status">
            <h3>Server Status</h3>
            <div className="status-item">
              <span className="status-dot online"></span>
              <span>Realm 1 - Online</span>
              <span className="player-count">2,451 players</span>
            </div>
            <div className="status-item">
              <span className="status-dot online"></span>
              <span>Realm 2 - Online</span>
              <span className="player-count">1,873 players</span>
            </div>
          </div>
          
          <div className="latest-news">
            <h3>Latest News</h3>
            <div className="news-item">
              <span className="news-date">Dec 25</span>
              <span className="news-title">Winter Festival Event Now Live!</span>
            </div>
            <div className="news-item">
              <span className="news-date">Dec 20</span>
              <span className="news-title">Patch 1.2.0: The Dark Citadel</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;