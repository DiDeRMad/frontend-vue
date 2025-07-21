import { apiService } from './apiService';
import { storageService } from './storageService';
import { notificationService } from './notificationService';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  TwoFactorSetupRequest,
  TwoFactorSetupResponse,
  TwoFactorVerifyRequest,
  User,
  ApiResponse
} from '@types/api';

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  permissions: string[];
  sessionId: string | null;
  twoFactorRequired: boolean;
  verificationRequired: boolean;
  loginAttempts: number;
  lockoutUntil: number | null;
}

export interface SecuritySettings {
  passwordMinLength: number;
  requireTwoFactor: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  requireEmailVerification: boolean;
  allowMultipleSessions: boolean;
}

class AuthService {
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
  private readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
  private readonly REFRESH_TOKEN_LIFETIME = 30 * 24 * 60 * 60 * 1000; // 30 days
  
  private authState: AuthState = {
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    permissions: [],
    sessionId: null,
    twoFactorRequired: false,
    verificationRequired: false,
    loginAttempts: 0,
    lockoutUntil: null
  };

  private subscribers: Set<(state: AuthState) => void> = new Set();
  private refreshTimer: NodeJS.Timeout | null = null;
  private sessionCheckTimer: NodeJS.Timeout | null = null;
  private securitySettings: SecuritySettings = {
    passwordMinLength: 8,
    requireTwoFactor: false,
    sessionTimeout: this.SESSION_TIMEOUT,
    maxLoginAttempts: this.MAX_LOGIN_ATTEMPTS,
    lockoutDuration: this.LOCKOUT_DURATION,
    requireEmailVerification: true,
    allowMultipleSessions: false
  };

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    this.setLoading(true);
    
    try {
      // Load stored authentication data
      await this.loadStoredAuth();
      
      // Validate session if we have tokens
      if (this.authState.token) {
        await this.validateSession();
      }
      
      // Setup automatic token refresh
      this.setupTokenRefresh();
      
      // Setup session monitoring
      this.setupSessionMonitoring();
      
      // Load security settings
      await this.loadSecuritySettings();
      
    } catch (error) {
      console.error('Auth initialization failed:', error);
      this.clearAuth();
    } finally {
      this.setLoading(false);
    }
  }

  private async loadStoredAuth(): Promise<void> {
    try {
      const token = await storageService.getToken();
      const refreshToken = await storageService.getRefreshToken();
      const userData = await storageService.getItem<User>('user_data');
      const sessionId = await storageService.getItem<string>('session_id');
      const loginAttempts = await storageService.getItem<number>('login_attempts') || 0;
      const lockoutUntil = await storageService.getItem<number>('lockout_until');

      if (token && refreshToken && userData) {
        this.updateAuthState({
          user: userData,
          token,
          refreshToken,
          sessionId,
          isAuthenticated: true,
          permissions: userData.permissions || [],
          loginAttempts,
          lockoutUntil
        });
      }
    } catch (error) {
      console.error('Failed to load stored auth:', error);
    }
  }

  private async validateSession(): Promise<boolean> {
    try {
      const response = await apiService.get<User>('/auth/me');
      
      if (response.success && response.data) {
        this.updateAuthState({
          user: response.data,
          isAuthenticated: true,
          permissions: response.data.permissions || []
        });
        
        await storageService.setItem('user_data', response.data);
        return true;
      } else {
        throw new Error('Session validation failed');
      }
    } catch (error) {
      console.error('Session validation failed:', error);
      await this.handleSessionExpired();
      return false;
    }
  }

  private setupTokenRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }

    // Check token expiry every 5 minutes
    this.refreshTimer = setInterval(async () => {
      if (this.authState.token && this.authState.refreshToken) {
        await this.checkAndRefreshToken();
      }
    }, 5 * 60 * 1000);
  }

  private setupSessionMonitoring(): void {
    if (this.sessionCheckTimer) {
      clearInterval(this.sessionCheckTimer);
    }

    // Check session validity every 10 minutes
    this.sessionCheckTimer = setInterval(async () => {
      if (this.authState.isAuthenticated) {
        const isValid = await this.validateSession();
        if (!isValid) {
          notificationService.showWarning('Your session has expired. Please log in again.');
        }
      }
    }, 10 * 60 * 1000);

    // Handle page visibility changes
    document.addEventListener('visibilitychange', async () => {
      if (!document.hidden && this.authState.isAuthenticated) {
        await this.validateSession();
      }
    });

    // Handle online/offline status
    window.addEventListener('online', async () => {
      if (this.authState.isAuthenticated) {
        await this.validateSession();
      }
    });
  }

  private async loadSecuritySettings(): Promise<void> {
    try {
      const settings = await storageService.getItem<SecuritySettings>('security_settings');
      if (settings) {
        this.securitySettings = { ...this.securitySettings, ...settings };
      }
    } catch (error) {
      console.error('Failed to load security settings:', error);
    }
  }

  private async checkAndRefreshToken(): Promise<void> {
    try {
      if (!this.authState.refreshToken) {
        throw new Error('No refresh token available');
      }

      // Check if token needs refresh (expires within 10 minutes)
      const tokenData = this.parseJWT(this.authState.token!);
      const expiresAt = tokenData.exp * 1000;
      const refreshThreshold = 10 * 60 * 1000; // 10 minutes

      if (Date.now() + refreshThreshold >= expiresAt) {
        await this.refreshAccessToken();
      }
    } catch (error) {
      console.error('Token refresh check failed:', error);
      await this.handleSessionExpired();
    }
  }

  private parseJWT(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      throw new Error('Invalid JWT token');
    }
  }

  private async handleSessionExpired(): Promise<void> {
    await this.clearAuth();
    notificationService.showWarning('Your session has expired. Please log in again.');
    
    // Redirect to login page if not already there
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
  }

  private updateAuthState(updates: Partial<AuthState>): void {
    this.authState = { ...this.authState, ...updates };
    this.notifySubscribers();
  }

  private setLoading(isLoading: boolean): void {
    this.updateAuthState({ isLoading });
  }

  private setError(error: string | null): void {
    this.updateAuthState({ error });
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => {
      callback({ ...this.authState });
    });
  }

  // Public API
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    this.setLoading(true);
    this.setError(null);

    try {
      // Check for lockout
      if (this.isLockedOut()) {
        const remainingTime = Math.ceil((this.authState.lockoutUntil! - Date.now()) / (60 * 1000));
        throw new Error(`Account locked. Try again in ${remainingTime} minutes.`);
      }

      const response = await apiService.post<LoginResponse>('/auth/login', credentials);

      if (response.success && response.data) {
        const { user, token, refreshToken, sessionId, requireTwoFactor, requireVerification } = response.data;

        // Reset login attempts on successful login
        await this.resetLoginAttempts();

        if (requireTwoFactor) {
          this.updateAuthState({
            twoFactorRequired: true,
            verificationRequired: false
          });
          return response.data;
        }

        if (requireVerification) {
          this.updateAuthState({
            twoFactorRequired: false,
            verificationRequired: true
          });
          return response.data;
        }

        // Complete login
        await this.completeLogin(user, token, refreshToken, sessionId);
        
        notificationService.showSuccess('Welcome back to Eternal Realms!');
        
        return response.data;
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      await this.handleLoginFailure();
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      this.setError(errorMessage);
      notificationService.showError(errorMessage);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    this.setLoading(true);
    this.setError(null);

    try {
      // Validate password strength
      this.validatePassword(userData.password);

      const response = await apiService.post<RegisterResponse>('/auth/register', userData);

      if (response.success && response.data) {
        if (this.securitySettings.requireEmailVerification) {
          this.updateAuthState({
            verificationRequired: true
          });
          notificationService.showInfo('Please check your email to verify your account.');
        } else {
          // Auto-login if verification not required
          const { user, token, refreshToken, sessionId } = response.data;
          await this.completeLogin(user, token, refreshToken, sessionId);
          notificationService.showSuccess('Welcome to Eternal Realms!');
        }

        return response.data;
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      this.setError(errorMessage);
      notificationService.showError(errorMessage);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  async logout(): Promise<void> {
    this.setLoading(true);

    try {
      // Notify server about logout
      if (this.authState.token) {
        await apiService.post('/auth/logout', {
          sessionId: this.authState.sessionId
        });
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      await this.clearAuth();
      notificationService.showInfo('You have been logged out.');
      this.setLoading(false);
    }
  }

  async refreshAccessToken(): Promise<void> {
    if (!this.authState.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await apiService.post<RefreshTokenResponse>('/auth/refresh', {
        refreshToken: this.authState.refreshToken
      });

      if (response.success && response.data) {
        const { token, refreshToken } = response.data;
        
        this.updateAuthState({ token, refreshToken });
        
        // Save new tokens
        await storageService.setToken(token);
        await storageService.setRefreshToken(refreshToken);
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      await this.handleSessionExpired();
      throw error;
    }
  }

  async forgotPassword(email: string): Promise<void> {
    this.setLoading(true);
    this.setError(null);

    try {
      const response = await apiService.post('/auth/forgot-password', { email });

      if (response.success) {
        notificationService.showSuccess('Password reset instructions sent to your email.');
      } else {
        throw new Error(response.message || 'Failed to send reset email');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send reset email';
      this.setError(errorMessage);
      notificationService.showError(errorMessage);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    this.setLoading(true);
    this.setError(null);

    try {
      this.validatePassword(newPassword);

      const response = await apiService.post('/auth/reset-password', {
        token,
        password: newPassword
      });

      if (response.success) {
        notificationService.showSuccess('Password reset successfully. Please log in with your new password.');
      } else {
        throw new Error(response.message || 'Password reset failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
      this.setError(errorMessage);
      notificationService.showError(errorMessage);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    this.setLoading(true);
    this.setError(null);

    try {
      this.validatePassword(newPassword);

      const response = await apiService.post('/auth/change-password', {
        currentPassword,
        newPassword
      });

      if (response.success) {
        notificationService.showSuccess('Password changed successfully.');
      } else {
        throw new Error(response.message || 'Password change failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password change failed';
      this.setError(errorMessage);
      notificationService.showError(errorMessage);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  async setupTwoFactor(): Promise<TwoFactorSetupResponse> {
    try {
      const response = await apiService.post<TwoFactorSetupResponse>('/auth/2fa/setup');

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || '2FA setup failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '2FA setup failed';
      notificationService.showError(errorMessage);
      throw error;
    }
  }

  async verifyTwoFactor(code: string, rememberDevice = false): Promise<void> {
    this.setLoading(true);
    this.setError(null);

    try {
      const response = await apiService.post('/auth/2fa/verify', {
        code,
        rememberDevice
      });

      if (response.success) {
        this.updateAuthState({
          twoFactorRequired: false
        });
        notificationService.showSuccess('Two-factor authentication verified.');
      } else {
        throw new Error(response.message || '2FA verification failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '2FA verification failed';
      this.setError(errorMessage);
      notificationService.showError(errorMessage);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  async disableTwoFactor(password: string): Promise<void> {
    try {
      const response = await apiService.post('/auth/2fa/disable', { password });

      if (response.success) {
        notificationService.showSuccess('Two-factor authentication disabled.');
      } else {
        throw new Error(response.message || '2FA disable failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '2FA disable failed';
      notificationService.showError(errorMessage);
      throw error;
    }
  }

  async verifyEmail(token: string): Promise<void> {
    this.setLoading(true);
    this.setError(null);

    try {
      const response = await apiService.post('/auth/verify-email', { token });

      if (response.success) {
        this.updateAuthState({
          verificationRequired: false
        });
        notificationService.showSuccess('Email verified successfully.');
      } else {
        throw new Error(response.message || 'Email verification failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Email verification failed';
      this.setError(errorMessage);
      notificationService.showError(errorMessage);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  async resendVerificationEmail(): Promise<void> {
    try {
      const response = await apiService.post('/auth/resend-verification');

      if (response.success) {
        notificationService.showSuccess('Verification email sent.');
      } else {
        throw new Error(response.message || 'Failed to resend verification email');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to resend verification email';
      notificationService.showError(errorMessage);
      throw error;
    }
  }

  // Helper methods
  private async completeLogin(
    user: User,
    token: string,
    refreshToken: string,
    sessionId?: string
  ): Promise<void> {
    this.updateAuthState({
      user,
      token,
      refreshToken,
      sessionId,
      isAuthenticated: true,
      permissions: user.permissions || [],
      twoFactorRequired: false,
      verificationRequired: false
    });

    // Save to storage
    await Promise.all([
      storageService.setToken(token),
      storageService.setRefreshToken(refreshToken),
      storageService.setItem('user_data', user),
      sessionId ? storageService.setItem('session_id', sessionId) : Promise.resolve()
    ]);

    // Setup automatic refresh
    this.setupTokenRefresh();
  }

  private async clearAuth(): Promise<void> {
    // Clear timers
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
    if (this.sessionCheckTimer) {
      clearInterval(this.sessionCheckTimer);
      this.sessionCheckTimer = null;
    }

    // Clear state
    this.updateAuthState({
      user: null,
      token: null,
      refreshToken: null,
      sessionId: null,
      isAuthenticated: false,
      permissions: [],
      twoFactorRequired: false,
      verificationRequired: false,
      error: null
    });

    // Clear storage
    storageService.clearTokens();
    await storageService.removeItem('user_data');
    await storageService.removeItem('session_id');
  }

  private async handleLoginFailure(): Promise<void> {
    const attempts = this.authState.loginAttempts + 1;
    await storageService.setItem('login_attempts', attempts);

    if (attempts >= this.securitySettings.maxLoginAttempts) {
      const lockoutUntil = Date.now() + this.securitySettings.lockoutDuration;
      await storageService.setItem('lockout_until', lockoutUntil);
      this.updateAuthState({ lockoutUntil });
    }

    this.updateAuthState({ loginAttempts: attempts });
  }

  private async resetLoginAttempts(): Promise<void> {
    await storageService.removeItem('login_attempts');
    await storageService.removeItem('lockout_until');
    this.updateAuthState({ loginAttempts: 0, lockoutUntil: null });
  }

  private isLockedOut(): boolean {
    return this.authState.lockoutUntil !== null && Date.now() < this.authState.lockoutUntil;
  }

  private validatePassword(password: string): void {
    if (password.length < this.securitySettings.passwordMinLength) {
      throw new Error(`Password must be at least ${this.securitySettings.passwordMinLength} characters long`);
    }

    // Additional password validation rules
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      throw new Error('Password must contain uppercase, lowercase, numbers, and special characters');
    }
  }

  // Public getters
  getAuthState(): AuthState {
    return { ...this.authState };
  }

  isAuthenticated(): boolean {
    return this.authState.isAuthenticated;
  }

  getCurrentUser(): User | null {
    return this.authState.user;
  }

  hasPermission(permission: string): boolean {
    return this.authState.permissions.includes(permission);
  }

  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }

  getSecuritySettings(): SecuritySettings {
    return { ...this.securitySettings };
  }

  // Subscription management
  subscribe(callback: (state: AuthState) => void): () => void {
    this.subscribers.add(callback);
    
    // Immediately call with current state
    callback({ ...this.authState });
    
    return () => {
      this.subscribers.delete(callback);
    };
  }

  // Cleanup
  destroy(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    if (this.sessionCheckTimer) {
      clearInterval(this.sessionCheckTimer);
    }
    this.subscribers.clear();
  }
}

export const authService = new AuthService();