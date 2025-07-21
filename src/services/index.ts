// Core Services
export { apiService } from './apiService';
export { storageService } from './storageService';
export { notificationService } from './notificationService';
export { authService } from './authService';
export { gameService } from './gameService';
export { characterService } from './characterService';

// Service Types
export type { AuthState, SecuritySettings } from './authService';
export type { GameState, GameMetrics, GameSettings } from './gameService';
export type { 
  CharacterState, 
  CharacterProgression, 
  CharacterBuild,
  SkillUpgradeResult,
  StatUpgradeResult 
} from './characterService';
export type { 
  NotificationType, 
  NotificationOptions, 
  NotificationAction, 
  NotificationGroup 
} from './notificationService';

// Re-export commonly used service instances
export {
  apiService as api,
  storageService as storage,
  notificationService as notifications,
  authService as auth,
  gameService as game,
  characterService as character
};