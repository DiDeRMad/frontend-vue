import { UserSettings, GameConfig } from '@types';

interface StorageOptions {
  encrypt?: boolean;
  ttl?: number; // Time to live in milliseconds
  compress?: boolean;
  version?: number;
}

interface StorageItem<T = any> {
  data: T;
  timestamp: number;
  ttl?: number;
  version: number;
  encrypted: boolean;
  compressed: boolean;
  checksum?: string;
}

interface CacheEntry<T = any> {
  key: string;
  data: T;
  expiry: number;
  size: number;
}

class StorageService {
  private readonly PREFIX = 'eternal_realms_';
  private readonly VERSION = 1;
  private readonly CRYPTO_KEY = 'eternal-realms-crypto-key-v1';
  private readonly MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB
  private cache = new Map<string, CacheEntry>();
  private cacheSize = 0;
  private dbInstance: IDBDatabase | null = null;
  private dbVersion = 1;
  private dbName = 'EternalRealmsDB';

  constructor() {
    this.initializeIndexedDB();
    this.cleanExpiredItems();
    this.setupStorageListener();
  }

  // IndexedDB initialization
  private async initializeIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.dbInstance = request.result;
        console.log('IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('gameData')) {
          const gameStore = db.createObjectStore('gameData', { keyPath: 'key' });
          gameStore.createIndex('timestamp', 'timestamp', { unique: false });
          gameStore.createIndex('category', 'category', { unique: false });
        }

        if (!db.objectStoreNames.contains('userSettings')) {
          db.createObjectStore('userSettings', { keyPath: 'userId' });
        }

        if (!db.objectStoreNames.contains('characters')) {
          const charStore = db.createObjectStore('characters', { keyPath: 'id' });
          charStore.createIndex('userId', 'userId', { unique: false });
          charStore.createIndex('lastPlayed', 'lastPlayed', { unique: false });
        }

        if (!db.objectStoreNames.contains('cache')) {
          const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
          cacheStore.createIndex('expiry', 'expiry', { unique: false });
          cacheStore.createIndex('category', 'category', { unique: false });
        }

        if (!db.objectStoreNames.contains('assets')) {
          const assetStore = db.createObjectStore('assets', { keyPath: 'url' });
          assetStore.createIndex('type', 'type', { unique: false });
          assetStore.createIndex('size', 'size', { unique: false });
        }
      };
    });
  }

  // Setup storage event listener for cross-tab synchronization
  private setupStorageListener(): void {
    window.addEventListener('storage', (event) => {
      if (event.key?.startsWith(this.PREFIX)) {
        const key = event.key.replace(this.PREFIX, '');
        
        // Remove from cache if changed in another tab
        if (this.cache.has(key)) {
          this.cache.delete(key);
        }

        // Emit custom event for components to listen
        window.dispatchEvent(new CustomEvent('storageChanged', {
          detail: { key, oldValue: event.oldValue, newValue: event.newValue }
        }));
      }
    });
  }

  // Encryption utilities
  private async generateKey(): Promise<CryptoKey> {
    const keyData = new TextEncoder().encode(this.CRYPTO_KEY);
    const hashBuffer = await crypto.subtle.digest('SHA-256', keyData);
    return crypto.subtle.importKey(
      'raw',
      hashBuffer,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );
  }

  private async encrypt(data: string): Promise<string> {
    try {
      const key = await this.generateKey();
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encodedData = new TextEncoder().encode(data);
      
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encodedData
      );

      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);

      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption failed:', error);
      return data; // Fallback to unencrypted
    }
  }

  private async decrypt(encryptedData: string): Promise<string> {
    try {
      const combined = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );

      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);

      const key = await this.generateKey();
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encrypted
      );

      return new TextDecoder().decode(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      return encryptedData; // Return as-is if decryption fails
    }
  }

  // Compression utilities
  private compress(data: string): string {
    // Simple LZ-string-like compression
    const dict: { [key: string]: number } = {};
    const result: (string | number)[] = [];
    let dictSize = 256;
    let w = '';

    for (let i = 0; i < data.length; i++) {
      const c = data.charAt(i);
      const wc = w + c;

      if (dict[wc]) {
        w = wc;
      } else {
        result.push(dict[w] ? dict[w] : w);
        dict[wc] = dictSize++;
        w = c;
      }
    }

    if (w) {
      result.push(dict[w] ? dict[w] : w);
    }

    return JSON.stringify(result);
  }

  private decompress(compressedData: string): string {
    try {
      const data = JSON.parse(compressedData) as (string | number)[];
      const dict: { [key: number]: string } = {};
      let dictSize = 256;
      let result = '';
      let w = String(data[0]);
      result += w;

      for (let i = 1; i < data.length; i++) {
        const k = data[i];
        let entry: string;

        if (typeof k === 'string') {
          entry = k;
        } else if (dict[k]) {
          entry = dict[k];
        } else if (k === dictSize) {
          entry = w + w.charAt(0);
        } else {
          throw new Error('Invalid compressed data');
        }

        result += entry;
        dict[dictSize++] = w + entry.charAt(0);
        w = entry;
      }

      return result;
    } catch (error) {
      console.error('Decompression failed:', error);
      return compressedData;
    }
  }

  // Checksum calculation
  private async calculateChecksum(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Cache management
  private updateCache<T>(key: string, data: T, ttl?: number): void {
    const expiry = ttl ? Date.now() + ttl : Date.now() + (24 * 60 * 60 * 1000); // Default 24h
    const dataSize = JSON.stringify(data).length * 2; // Rough size estimation

    // Remove old entry if exists
    if (this.cache.has(key)) {
      this.cacheSize -= this.cache.get(key)!.size;
      this.cache.delete(key);
    }

    // Check cache size limit
    while (this.cacheSize + dataSize > this.MAX_CACHE_SIZE && this.cache.size > 0) {
      this.evictOldestCacheEntry();
    }

    this.cache.set(key, { key, data, expiry, size: dataSize });
    this.cacheSize += dataSize;
  }

  private evictOldestCacheEntry(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache) {
      if (entry.expiry < oldestTime) {
        oldestTime = entry.expiry;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const entry = this.cache.get(oldestKey)!;
      this.cacheSize -= entry.size;
      this.cache.delete(oldestKey);
    }
  }

  private getCachedData<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (entry && entry.expiry > Date.now()) {
      return entry.data as T;
    }

    if (entry) {
      this.cache.delete(key);
      this.cacheSize -= entry.size;
    }

    return null;
  }

  // Core storage methods
  async setItem<T>(key: string, value: T, options: StorageOptions = {}): Promise<void> {
    const fullKey = this.PREFIX + key;
    const storageItem: StorageItem<T> = {
      data: value,
      timestamp: Date.now(),
      ttl: options.ttl,
      version: options.version || this.VERSION,
      encrypted: options.encrypt || false,
      compressed: options.compress || false
    };

    let serializedData = JSON.stringify(storageItem);

    // Calculate checksum before compression/encryption
    storageItem.checksum = await this.calculateChecksum(JSON.stringify(value));

    // Compress if requested
    if (options.compress) {
      serializedData = this.compress(serializedData);
    }

    // Encrypt if requested
    if (options.encrypt) {
      serializedData = await this.encrypt(serializedData);
    }

    // Update cache
    this.updateCache(key, value, options.ttl);

    // Store in localStorage
    try {
      localStorage.setItem(fullKey, serializedData);
    } catch (error) {
      console.error('Failed to store in localStorage:', error);
      // Fallback to sessionStorage
      try {
        sessionStorage.setItem(fullKey, serializedData);
      } catch (sessionError) {
        console.error('Failed to store in sessionStorage:', sessionError);
        throw new Error('Storage quota exceeded');
      }
    }
  }

  async getItem<T>(key: string): Promise<T | null> {
    // Check cache first
    const cachedData = this.getCachedData<T>(key);
    if (cachedData !== null) {
      return cachedData;
    }

    const fullKey = this.PREFIX + key;
    let serializedData = localStorage.getItem(fullKey) || sessionStorage.getItem(fullKey);

    if (!serializedData) {
      return null;
    }

    try {
      // Try to parse as-is first (unencrypted, uncompressed)
      let storageItem: StorageItem<T>;
      
      try {
        storageItem = JSON.parse(serializedData);
      } catch {
        // Might be encrypted
        serializedData = await this.decrypt(serializedData);
        try {
          storageItem = JSON.parse(serializedData);
        } catch {
          // Might be compressed
          serializedData = this.decompress(serializedData);
          storageItem = JSON.parse(serializedData);
        }
      }

      // Check TTL
      if (storageItem.ttl && Date.now() > storageItem.timestamp + storageItem.ttl) {
        this.removeItem(key);
        return null;
      }

      // Verify checksum if available
      if (storageItem.checksum) {
        const currentChecksum = await this.calculateChecksum(JSON.stringify(storageItem.data));
        if (currentChecksum !== storageItem.checksum) {
          console.warn('Data integrity check failed for key:', key);
          this.removeItem(key);
          return null;
        }
      }

      // Update cache
      this.updateCache(key, storageItem.data, storageItem.ttl);

      return storageItem.data;
    } catch (error) {
      console.error('Failed to parse stored data for key:', key, error);
      this.removeItem(key);
      return null;
    }
  }

  removeItem(key: string): void {
    const fullKey = this.PREFIX + key;
    localStorage.removeItem(fullKey);
    sessionStorage.removeItem(fullKey);
    this.cache.delete(key);
  }

  clear(): void {
    const keys = Object.keys(localStorage).filter(key => key.startsWith(this.PREFIX));
    keys.forEach(key => localStorage.removeItem(key));

    const sessionKeys = Object.keys(sessionStorage).filter(key => key.startsWith(this.PREFIX));
    sessionKeys.forEach(key => sessionStorage.removeItem(key));

    this.cache.clear();
    this.cacheSize = 0;
  }

  // Specialized methods for common game data
  async setToken(token: string): Promise<void> {
    await this.setItem('auth_token', token, { 
      encrypt: true, 
      ttl: 24 * 60 * 60 * 1000 // 24 hours
    });
  }

  async getToken(): Promise<string | null> {
    return this.getItem<string>('auth_token');
  }

  async setRefreshToken(token: string): Promise<void> {
    await this.setItem('refresh_token', token, { 
      encrypt: true, 
      ttl: 30 * 24 * 60 * 60 * 1000 // 30 days
    });
  }

  async getRefreshToken(): Promise<string | null> {
    return this.getItem<string>('refresh_token');
  }

  clearTokens(): void {
    this.removeItem('auth_token');
    this.removeItem('refresh_token');
  }

  async setUserSettings(settings: UserSettings): Promise<void> {
    await this.setItem('user_settings', settings, { compress: true });
  }

  async getUserSettings(): Promise<UserSettings | null> {
    return this.getItem<UserSettings>('user_settings');
  }

  async setGameConfig(config: GameConfig): Promise<void> {
    await this.setItem('game_config', config, { 
      compress: true,
      ttl: 60 * 60 * 1000 // 1 hour
    });
  }

  async getGameConfig(): Promise<GameConfig | null> {
    return this.getItem<GameConfig>('game_config');
  }

  // IndexedDB methods for large data
  async setLargeData(key: string, data: any, category = 'general'): Promise<void> {
    if (!this.dbInstance) {
      await this.initializeIndexedDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.dbInstance!.transaction(['gameData'], 'readwrite');
      const store = transaction.objectStore('gameData');

      const item = {
        key,
        data,
        category,
        timestamp: Date.now(),
        size: JSON.stringify(data).length
      };

      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getLargeData(key: string): Promise<any> {
    if (!this.dbInstance) {
      await this.initializeIndexedDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.dbInstance!.transaction(['gameData'], 'readonly');
      const store = transaction.objectStore('gameData');
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.data : null);
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Utility methods
  private cleanExpiredItems(): void {
    const keys = Object.keys(localStorage).filter(key => key.startsWith(this.PREFIX));
    
    keys.forEach(async (fullKey) => {
      const key = fullKey.replace(this.PREFIX, '');
      const item = await this.getItem(key);
      // getItem already handles TTL cleanup
    });

    // Clean cache
    for (const [key, entry] of this.cache) {
      if (entry.expiry <= Date.now()) {
        this.cache.delete(key);
        this.cacheSize -= entry.size;
      }
    }
  }

  getStorageInfo(): {
    localStorageUsed: number;
    localStorageQuota: number;
    cacheSize: number;
    cacheEntries: number;
  } {
    let localStorageUsed = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key) && key.startsWith(this.PREFIX)) {
        localStorageUsed += localStorage[key].length;
      }
    }

    return {
      localStorageUsed,
      localStorageQuota: 5 * 1024 * 1024, // Typical 5MB limit
      cacheSize: this.cacheSize,
      cacheEntries: this.cache.size
    };
  }

  // Migration utilities
  async migrateData(fromVersion: number, toVersion: number): Promise<void> {
    console.log(`Migrating data from version ${fromVersion} to ${toVersion}`);
    
    // Implement migration logic based on version differences
    if (fromVersion < 1 && toVersion >= 1) {
      // Example migration
      const oldSettings = localStorage.getItem('gameSettings');
      if (oldSettings) {
        try {
          const settings = JSON.parse(oldSettings);
          await this.setUserSettings(settings);
          localStorage.removeItem('gameSettings');
        } catch (error) {
          console.error('Migration failed:', error);
        }
      }
    }
  }

  // Export/Import functionality
  async exportData(): Promise<string> {
    const data: { [key: string]: any } = {};
    
    // Export localStorage data
    for (let key in localStorage) {
      if (key.startsWith(this.PREFIX)) {
        const cleanKey = key.replace(this.PREFIX, '');
        data[cleanKey] = await this.getItem(cleanKey);
      }
    }

    return JSON.stringify(data, null, 2);
  }

  async importData(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData);
      
      for (const [key, value] of Object.entries(data)) {
        await this.setItem(key, value);
      }
    } catch (error) {
      console.error('Failed to import data:', error);
      throw new Error('Invalid data format');
    }
  }
}

export const storageService = new StorageService();