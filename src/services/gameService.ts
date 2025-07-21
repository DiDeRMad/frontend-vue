import { apiService } from './apiService';
import { notificationService } from './notificationService';
import { storageService } from './storageService';
import {
  Character,
  WorldState,
  GameConfig,
  Quest,
  Item,
  Combat,
  GameEvent,
  MapDataResponse,
  CharacterListResponse,
  CharacterCreateRequest,
  CharacterCreateResponse,
  CharacterSelectResponse,
  UpdateCharacterRequest,
  QuestListResponse,
  AcceptQuestRequest,
  CompleteQuestRequest,
  CompleteQuestResponse,
  AbandonQuestRequest,
  InventoryResponse,
  MoveItemRequest,
  UseItemRequest,
  DropItemRequest,
  ApiResponse
} from '@types/api';

export interface GameState {
  isInGame: boolean;
  currentCharacter: Character | null;
  characters: Character[];
  worldState: WorldState | null;
  gameConfig: GameConfig | null;
  activeQuests: Quest[];
  completedQuests: Quest[];
  inventory: Item[];
  currentCombat: Combat | null;
  currentMap: string | null;
  gameEvents: GameEvent[];
  isLoading: boolean;
  error: string | null;
  lastSave: number;
  serverTime: number;
  ping: number;
}

export interface GameMetrics {
  fps: number;
  ping: number;
  packetLoss: number;
  memoryUsage: number;
  renderTime: number;
  updateTime: number;
  networkLatency: number;
}

export interface GameSettings {
  graphics: {
    quality: 'low' | 'medium' | 'high' | 'ultra';
    resolution: string;
    fullscreen: boolean;
    vsync: boolean;
    antiAliasing: boolean;
    shadows: boolean;
    particles: boolean;
    postProcessing: boolean;
  };
  audio: {
    master: number;
    music: number;
    effects: number;
    voice: number;
    ambient: number;
  };
  gameplay: {
    autoRun: boolean;
    mouseLook: boolean;
    invertMouse: boolean;
    mouseSensitivity: number;
    autoTarget: boolean;
    showDamageNumbers: boolean;
    showPlayerNames: boolean;
    showGuildTags: boolean;
    combatText: boolean;
  };
  ui: {
    scale: number;
    theme: 'dark' | 'light' | 'auto';
    showMinimap: boolean;
    showHealthBars: boolean;
    showBuffs: boolean;
    showChat: boolean;
    chatOpacity: number;
    showTooltips: boolean;
    tooltipDelay: number;
  };
  controls: {
    keybinds: { [action: string]: string };
    gamepadEnabled: boolean;
    gamepadSensitivity: number;
  };
}

class GameService {
  private gameState: GameState = {
    isInGame: false,
    currentCharacter: null,
    characters: [],
    worldState: null,
    gameConfig: null,
    activeQuests: [],
    completedQuests: [],
    inventory: [],
    currentCombat: null,
    currentMap: null,
    gameEvents: [],
    isLoading: false,
    error: null,
    lastSave: 0,
    serverTime: 0,
    ping: 0
  };

  private subscribers: Set<(state: GameState) => void> = new Set();
  private metricsSubscribers: Set<(metrics: GameMetrics) => void> = new Set();
  private gameLoop: number | null = null;
  private saveInterval: NodeJS.Timeout | null = null;
  private syncInterval: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  
  private gameMetrics: GameMetrics = {
    fps: 0,
    ping: 0,
    packetLoss: 0,
    memoryUsage: 0,
    renderTime: 0,
    updateTime: 0,
    networkLatency: 0
  };

  private gameSettings: GameSettings = {
    graphics: {
      quality: 'high',
      resolution: '1920x1080',
      fullscreen: false,
      vsync: true,
      antiAliasing: true,
      shadows: true,
      particles: true,
      postProcessing: true
    },
    audio: {
      master: 0.8,
      music: 0.6,
      effects: 0.8,
      voice: 1.0,
      ambient: 0.4
    },
    gameplay: {
      autoRun: false,
      mouseLook: true,
      invertMouse: false,
      mouseSensitivity: 0.5,
      autoTarget: true,
      showDamageNumbers: true,
      showPlayerNames: true,
      showGuildTags: true,
      combatText: true
    },
    ui: {
      scale: 1.0,
      theme: 'dark',
      showMinimap: true,
      showHealthBars: true,
      showBuffs: true,
      showChat: true,
      chatOpacity: 0.8,
      showTooltips: true,
      tooltipDelay: 500
    },
    controls: {
      keybinds: {
        moveForward: 'KeyW',
        moveBackward: 'KeyS',
        moveLeft: 'KeyA',
        moveRight: 'KeyD',
        jump: 'Space',
        run: 'ShiftLeft',
        interact: 'KeyE',
        inventory: 'KeyI',
        character: 'KeyC',
        quests: 'KeyQ',
        map: 'KeyM',
        chat: 'Enter',
        attack: 'Mouse0',
        block: 'Mouse1',
        skill1: 'Digit1',
        skill2: 'Digit2',
        skill3: 'Digit3',
        skill4: 'Digit4',
        skill5: 'Digit5',
        potion: 'KeyR',
        mount: 'KeyX',
        autoRun: 'NumLock'
      },
      gamepadEnabled: false,
      gamepadSensitivity: 0.5
    }
  };

  private frameCount = 0;
  private lastFpsUpdate = 0;
  private lastFrameTime = 0;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    this.setLoading(true);
    
    try {
      // Load game settings
      await this.loadGameSettings();
      
      // Load game configuration
      await this.loadGameConfig();
      
      // Setup intervals
      this.setupSaveInterval();
      this.setupSyncInterval();
      this.setupPingMeasurement();
      
      // Start performance monitoring
      this.startPerformanceMonitoring();
      
    } catch (error) {
      console.error('Game service initialization failed:', error);
      this.setError('Failed to initialize game service');
    } finally {
      this.setLoading(false);
    }
  }

  private async loadGameSettings(): Promise<void> {
    try {
      const settings = await storageService.getItem<GameSettings>('game_settings');
      if (settings) {
        this.gameSettings = { ...this.gameSettings, ...settings };
      }
    } catch (error) {
      console.error('Failed to load game settings:', error);
    }
  }

  private async loadGameConfig(): Promise<void> {
    try {
      // Try to load from cache first
      let config = await storageService.getGameConfig();
      
      if (!config) {
        // Fetch from server
        const response = await apiService.get<GameConfig>('/game/config');
        if (response.success && response.data) {
          config = response.data;
          await storageService.setGameConfig(config);
        }
      }
      
      if (config) {
        this.updateGameState({ gameConfig: config });
      }
    } catch (error) {
      console.error('Failed to load game config:', error);
    }
  }

  private setupSaveInterval(): void {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
    }

    // Auto-save every 5 minutes
    this.saveInterval = setInterval(async () => {
      if (this.gameState.isInGame && this.gameState.currentCharacter) {
        await this.saveGame();
      }
    }, 5 * 60 * 1000);
  }

  private setupSyncInterval(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    // Sync with server every 30 seconds
    this.syncInterval = setInterval(async () => {
      if (this.gameState.isInGame) {
        await this.syncServerTime();
      }
    }, 30 * 1000);
  }

  private setupPingMeasurement(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    // Measure ping every 10 seconds
    this.pingInterval = setInterval(async () => {
      if (this.gameState.isInGame) {
        await this.measurePing();
      }
    }, 10 * 1000);
  }

  private startPerformanceMonitoring(): void {
    const updateMetrics = () => {
      const now = performance.now();
      
      // Calculate FPS
      this.frameCount++;
      if (now - this.lastFpsUpdate >= 1000) {
        this.gameMetrics.fps = this.frameCount;
        this.frameCount = 0;
        this.lastFpsUpdate = now;
      }

      // Calculate frame time
      if (this.lastFrameTime > 0) {
        const frameTime = now - this.lastFrameTime;
        this.gameMetrics.renderTime = frameTime;
      }
      this.lastFrameTime = now;

      // Memory usage (if available)
      if ('memory' in performance) {
        const memInfo = (performance as any).memory;
        this.gameMetrics.memoryUsage = memInfo.usedJSHeapSize / 1024 / 1024; // MB
      }

      this.notifyMetricsSubscribers();
      
      if (this.gameState.isInGame) {
        this.gameLoop = requestAnimationFrame(updateMetrics);
      }
    };

    if (this.gameState.isInGame) {
      this.gameLoop = requestAnimationFrame(updateMetrics);
    }
  }

  // Character Management
  async loadCharacters(): Promise<Character[]> {
    this.setLoading(true);
    
    try {
      const response = await apiService.get<CharacterListResponse>('/game/characters');
      
      if (response.success && response.data) {
        const characters = response.data.characters;
        this.updateGameState({ characters });
        return characters;
      } else {
        throw new Error(response.message || 'Failed to load characters');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load characters';
      this.setError(errorMessage);
      notificationService.showError(errorMessage);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  async createCharacter(characterData: CharacterCreateRequest): Promise<Character> {
    this.setLoading(true);
    
    try {
      const response = await apiService.post<CharacterCreateResponse>('/game/characters', characterData);
      
      if (response.success && response.data) {
        const character = response.data.character;
        const updatedCharacters = [...this.gameState.characters, character];
        this.updateGameState({ characters: updatedCharacters });
        
        notificationService.showSuccess('Character created successfully!');
        return character;
      } else {
        throw new Error(response.message || 'Failed to create character');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create character';
      this.setError(errorMessage);
      notificationService.showError(errorMessage);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  async selectCharacter(characterId: string): Promise<void> {
    this.setLoading(true);
    
    try {
      const response = await apiService.post<CharacterSelectResponse>('/game/characters/select', {
        characterId
      });
      
      if (response.success && response.data) {
        const { character, worldState } = response.data;
        
        this.updateGameState({
          currentCharacter: character,
          worldState,
          isInGame: true
        });
        
        // Load character-specific data
        await Promise.all([
          this.loadQuests(),
          this.loadInventory(),
          this.loadMapData(worldState.currentMap)
        ]);
        
        // Start game loops
        this.startPerformanceMonitoring();
        
        notificationService.showSuccess(`Welcome back, ${character.name}!`);
      } else {
        throw new Error(response.message || 'Failed to select character');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to select character';
      this.setError(errorMessage);
      notificationService.showError(errorMessage);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  async deleteCharacter(characterId: string): Promise<void> {
    this.setLoading(true);
    
    try {
      const response = await apiService.delete(`/game/characters/${characterId}`);
      
      if (response.success) {
        const updatedCharacters = this.gameState.characters.filter(c => c.id !== characterId);
        this.updateGameState({ characters: updatedCharacters });
        
        notificationService.showSuccess('Character deleted successfully.');
      } else {
        throw new Error(response.message || 'Failed to delete character');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete character';
      this.setError(errorMessage);
      notificationService.showError(errorMessage);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  async updateCharacter(updates: UpdateCharacterRequest): Promise<void> {
    try {
      const response = await apiService.patch('/game/characters/current', updates);
      
      if (response.success && response.data) {
        const updatedCharacter = response.data.character;
        this.updateGameState({ currentCharacter: updatedCharacter });
      } else {
        throw new Error(response.message || 'Failed to update character');
      }
    } catch (error) {
      console.error('Failed to update character:', error);
      throw error;
    }
  }

  // World and Map Management
  async loadMapData(mapId: string): Promise<void> {
    try {
      const response = await apiService.get<MapDataResponse>(`/game/maps/${mapId}`);
      
      if (response.success && response.data) {
        const mapData = response.data.map;
        this.updateGameState({ currentMap: mapId });
        
        // Cache map data
        await storageService.setLargeData(`map_${mapId}`, mapData, 'maps');
      } else {
        throw new Error(response.message || 'Failed to load map data');
      }
    } catch (error) {
      console.error('Failed to load map data:', error);
      throw error;
    }
  }

  async changeMap(mapId: string, x: number, y: number): Promise<void> {
    this.setLoading(true);
    
    try {
      const response = await apiService.post('/game/world/change-map', {
        mapId,
        position: { x, y }
      });
      
      if (response.success) {
        await this.loadMapData(mapId);
        this.updateGameState({ currentMap: mapId });
        
        // Update character position
        if (this.gameState.currentCharacter) {
          const updatedCharacter = {
            ...this.gameState.currentCharacter,
            position: { x, y, mapId }
          };
          this.updateGameState({ currentCharacter: updatedCharacter });
        }
      } else {
        throw new Error(response.message || 'Failed to change map');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to change map';
      this.setError(errorMessage);
      notificationService.showError(errorMessage);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  // Quest Management
  async loadQuests(): Promise<void> {
    try {
      const response = await apiService.get<QuestListResponse>('/game/quests');
      
      if (response.success && response.data) {
        const { activeQuests, completedQuests } = response.data;
        this.updateGameState({ activeQuests, completedQuests });
      } else {
        throw new Error(response.message || 'Failed to load quests');
      }
    } catch (error) {
      console.error('Failed to load quests:', error);
      throw error;
    }
  }

  async acceptQuest(questId: string): Promise<void> {
    try {
      const response = await apiService.post<CompleteQuestResponse>('/game/quests/accept', {
        questId
      });
      
      if (response.success && response.data) {
        const quest = response.data.quest;
        const updatedActiveQuests = [...this.gameState.activeQuests, quest];
        this.updateGameState({ activeQuests: updatedActiveQuests });
        
        notificationService.showQuestUpdate(`Quest accepted: ${quest.title}`);
      } else {
        throw new Error(response.message || 'Failed to accept quest');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to accept quest';
      notificationService.showError(errorMessage);
      throw error;
    }
  }

  async completeQuest(questId: string): Promise<void> {
    try {
      const response = await apiService.post<CompleteQuestResponse>('/game/quests/complete', {
        questId
      });
      
      if (response.success && response.data) {
        const { quest, rewards } = response.data;
        
        // Move quest from active to completed
        const updatedActiveQuests = this.gameState.activeQuests.filter(q => q.id !== questId);
        const updatedCompletedQuests = [...this.gameState.completedQuests, quest];
        
        this.updateGameState({
          activeQuests: updatedActiveQuests,
          completedQuests: updatedCompletedQuests
        });
        
        // Show rewards
        if (rewards) {
          notificationService.showSuccess(`Quest completed: ${quest.title}`);
          
          if (rewards.experience) {
            notificationService.showInfo(`+${rewards.experience} Experience`);
          }
          
          if (rewards.gold) {
            notificationService.showInfo(`+${rewards.gold} Gold`);
          }
          
          if (rewards.items && rewards.items.length > 0) {
            rewards.items.forEach(item => {
              notificationService.showInfo(`Received: ${item.name} x${item.quantity}`);
            });
          }
        }
      } else {
        throw new Error(response.message || 'Failed to complete quest');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to complete quest';
      notificationService.showError(errorMessage);
      throw error;
    }
  }

  async abandonQuest(questId: string): Promise<void> {
    try {
      const response = await apiService.post('/game/quests/abandon', { questId });
      
      if (response.success) {
        const updatedActiveQuests = this.gameState.activeQuests.filter(q => q.id !== questId);
        this.updateGameState({ activeQuests: updatedActiveQuests });
        
        notificationService.showWarning('Quest abandoned');
      } else {
        throw new Error(response.message || 'Failed to abandon quest');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to abandon quest';
      notificationService.showError(errorMessage);
      throw error;
    }
  }

  // Inventory Management
  async loadInventory(): Promise<void> {
    try {
      const response = await apiService.get<InventoryResponse>('/game/inventory');
      
      if (response.success && response.data) {
        const inventory = response.data.items;
        this.updateGameState({ inventory });
      } else {
        throw new Error(response.message || 'Failed to load inventory');
      }
    } catch (error) {
      console.error('Failed to load inventory:', error);
      throw error;
    }
  }

  async moveItem(fromSlot: number, toSlot: number): Promise<void> {
    try {
      const response = await apiService.post('/game/inventory/move', {
        fromSlot,
        toSlot
      });
      
      if (response.success) {
        await this.loadInventory(); // Refresh inventory
      } else {
        throw new Error(response.message || 'Failed to move item');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to move item';
      notificationService.showError(errorMessage);
      throw error;
    }
  }

  async useItem(itemId: string, quantity = 1): Promise<void> {
    try {
      const response = await apiService.post('/game/inventory/use', {
        itemId,
        quantity
      });
      
      if (response.success) {
        await this.loadInventory(); // Refresh inventory
        
        // Update character if item affects stats
        if (response.data?.characterUpdate) {
          this.updateGameState({ currentCharacter: response.data.characterUpdate });
        }
      } else {
        throw new Error(response.message || 'Failed to use item');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to use item';
      notificationService.showError(errorMessage);
      throw error;
    }
  }

  async dropItem(itemId: string, quantity = 1): Promise<void> {
    try {
      const response = await apiService.post('/game/inventory/drop', {
        itemId,
        quantity
      });
      
      if (response.success) {
        await this.loadInventory(); // Refresh inventory
        notificationService.showInfo('Item dropped');
      } else {
        throw new Error(response.message || 'Failed to drop item');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to drop item';
      notificationService.showError(errorMessage);
      throw error;
    }
  }

  // Game Loop and Utilities
  async saveGame(): Promise<void> {
    if (!this.gameState.currentCharacter) return;
    
    try {
      const response = await apiService.post('/game/save', {
        characterId: this.gameState.currentCharacter.id,
        gameState: {
          position: this.gameState.currentCharacter.position,
          stats: this.gameState.currentCharacter.stats,
          lastSave: Date.now()
        }
      });
      
      if (response.success) {
        this.updateGameState({ lastSave: Date.now() });
      }
    } catch (error) {
      console.error('Failed to save game:', error);
    }
  }

  private async syncServerTime(): Promise<void> {
    try {
      const start = Date.now();
      const response = await apiService.get('/game/time');
      const end = Date.now();
      
      if (response.success && response.data) {
        const serverTime = response.data.timestamp;
        const networkLatency = (end - start) / 2;
        const adjustedServerTime = serverTime + networkLatency;
        
        this.updateGameState({ serverTime: adjustedServerTime });
        this.gameMetrics.networkLatency = networkLatency;
      }
    } catch (error) {
      console.error('Failed to sync server time:', error);
    }
  }

  private async measurePing(): Promise<void> {
    try {
      const start = performance.now();
      const response = await apiService.get('/game/ping');
      const end = performance.now();
      
      if (response.success) {
        const ping = Math.round(end - start);
        this.updateGameState({ ping });
        this.gameMetrics.ping = ping;
      }
    } catch (error) {
      console.error('Failed to measure ping:', error);
    }
  }

  // Settings Management
  async saveGameSettings(): Promise<void> {
    try {
      await storageService.setItem('game_settings', this.gameSettings);
    } catch (error) {
      console.error('Failed to save game settings:', error);
    }
  }

  updateGameSettings(updates: Partial<GameSettings>): void {
    this.gameSettings = { ...this.gameSettings, ...updates };
    this.saveGameSettings();
  }

  getGameSettings(): GameSettings {
    return { ...this.gameSettings };
  }

  // State Management
  private updateGameState(updates: Partial<GameState>): void {
    this.gameState = { ...this.gameState, ...updates };
    this.notifySubscribers();
  }

  private setLoading(isLoading: boolean): void {
    this.updateGameState({ isLoading });
  }

  private setError(error: string | null): void {
    this.updateGameState({ error });
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => {
      callback({ ...this.gameState });
    });
  }

  private notifyMetricsSubscribers(): void {
    this.metricsSubscribers.forEach(callback => {
      callback({ ...this.gameMetrics });
    });
  }

  // Public Getters
  getGameState(): GameState {
    return { ...this.gameState };
  }

  getGameMetrics(): GameMetrics {
    return { ...this.gameMetrics };
  }

  isInGame(): boolean {
    return this.gameState.isInGame;
  }

  getCurrentCharacter(): Character | null {
    return this.gameState.currentCharacter;
  }

  // Event Management
  addGameEvent(event: GameEvent): void {
    const updatedEvents = [event, ...this.gameState.gameEvents].slice(0, 100); // Keep last 100 events
    this.updateGameState({ gameEvents: updatedEvents });
  }

  clearGameEvents(): void {
    this.updateGameState({ gameEvents: [] });
  }

  // Subscription Management
  subscribe(callback: (state: GameState) => void): () => void {
    this.subscribers.add(callback);
    
    // Immediately call with current state
    callback({ ...this.gameState });
    
    return () => {
      this.subscribers.delete(callback);
    };
  }

  subscribeToMetrics(callback: (metrics: GameMetrics) => void): () => void {
    this.metricsSubscribers.add(callback);
    
    // Immediately call with current metrics
    callback({ ...this.gameMetrics });
    
    return () => {
      this.metricsSubscribers.delete(callback);
    };
  }

  // Cleanup
  async exitGame(): Promise<void> {
    this.setLoading(true);
    
    try {
      // Save game before exiting
      await this.saveGame();
      
      // Notify server
      if (this.gameState.currentCharacter) {
        await apiService.post('/game/exit', {
          characterId: this.gameState.currentCharacter.id
        });
      }
      
      // Clear game state
      this.updateGameState({
        isInGame: false,
        currentCharacter: null,
        worldState: null,
        currentCombat: null,
        currentMap: null
      });
      
      // Stop game loop and intervals
      if (this.gameLoop) {
        cancelAnimationFrame(this.gameLoop);
        this.gameLoop = null;
      }
      
    } catch (error) {
      console.error('Failed to exit game cleanly:', error);
    } finally {
      this.setLoading(false);
    }
  }

  destroy(): void {
    // Clear all intervals
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
    }
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    if (this.gameLoop) {
      cancelAnimationFrame(this.gameLoop);
    }

    // Clear subscribers
    this.subscribers.clear();
    this.metricsSubscribers.clear();
  }
}

export const gameService = new GameService();