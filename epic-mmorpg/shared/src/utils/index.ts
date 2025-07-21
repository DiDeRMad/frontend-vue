import { v4 as uuidv4 } from 'uuid';
import { GAME_CONFIG, CURRENCY_RATES } from '../constants/index.js';

// ID Generation
export const generateId = (): string => uuidv4();
export const generateShortId = (): string => uuidv4().split('-')[0];
export const generateNumericId = (): string => Date.now().toString(36) + Math.random().toString(36).substr(2);

// Math Utilities
export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

export const lerp = (start: number, end: number, t: number): number => {
  return start + (end - start) * t;
};

export const randomRange = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

export const randomInt = (min: number, max: number): number => {
  return Math.floor(randomRange(min, max + 1));
};

export const randomChoice = <T>(array: T[]): T => {
  return array[randomInt(0, array.length - 1)];
};

export const weightedRandom = <T>(items: Array<{ item: T; weight: number }>): T => {
  const totalWeight = items.reduce((sum, { weight }) => sum + weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const { item, weight } of items) {
    random -= weight;
    if (random <= 0) return item;
  }
  
  return items[items.length - 1].item;
};

export const rollDice = (sides: number, count: number = 1): number => {
  let total = 0;
  for (let i = 0; i < count; i++) {
    total += randomInt(1, sides);
  }
  return total;
};

export const chance = (percentage: number): boolean => {
  return Math.random() < percentage / 100;
};

// Vector Math
export const distance2D = (x1: number, y1: number, x2: number, y2: number): number => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

export const distance3D = (x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): number => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2) + Math.pow(z2 - z1, 2));
};

export const angle2D = (x1: number, y1: number, x2: number, y2: number): number => {
  return Math.atan2(y2 - y1, x2 - x1);
};

export const normalizeVector = (x: number, y: number, z: number = 0): { x: number; y: number; z: number } => {
  const magnitude = Math.sqrt(x * x + y * y + z * z);
  if (magnitude === 0) return { x: 0, y: 0, z: 0 };
  return {
    x: x / magnitude,
    y: y / magnitude,
    z: z / magnitude
  };
};

export const rotateVector2D = (x: number, y: number, angle: number): { x: number; y: number } => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: x * cos - y * sin,
    y: x * sin + y * cos
  };
};

// String Utilities
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const titleCase = (str: string): string => {
  return str.split(' ').map(capitalize).join(' ');
};

export const slugify = (str: string): string => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const truncate = (str: string, length: number, suffix: string = '...'): string => {
  if (str.length <= length) return str;
  return str.slice(0, length - suffix.length) + suffix;
};

export const formatNumber = (num: number, decimals: number = 0): string => {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

export const formatDuration = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
};

export const formatCurrency = (copper: number): string => {
  const gold = Math.floor(copper / (CURRENCY_RATES.COPPER_PER_SILVER * CURRENCY_RATES.SILVER_PER_GOLD));
  const silver = Math.floor((copper % (CURRENCY_RATES.COPPER_PER_SILVER * CURRENCY_RATES.SILVER_PER_GOLD)) / CURRENCY_RATES.COPPER_PER_SILVER);
  const remainingCopper = copper % CURRENCY_RATES.COPPER_PER_SILVER;

  const parts = [];
  if (gold > 0) parts.push(`${gold}g`);
  if (silver > 0) parts.push(`${silver}s`);
  if (remainingCopper > 0 || parts.length === 0) parts.push(`${remainingCopper}c`);

  return parts.join(' ');
};

// Array Utilities
export const shuffle = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const chunk = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

export const unique = <T>(array: T[]): T[] => {
  return Array.from(new Set(array));
};

export const groupBy = <T, K extends keyof any>(array: T[], getKey: (item: T) => K): Record<K, T[]> => {
  return array.reduce((groups, item) => {
    const key = getKey(item);
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
    return groups;
  }, {} as Record<K, T[]>);
};

export const sortBy = <T>(array: T[], getValue: (item: T) => number | string, desc: boolean = false): T[] => {
  return [...array].sort((a, b) => {
    const aVal = getValue(a);
    const bVal = getValue(b);
    if (aVal < bVal) return desc ? 1 : -1;
    if (aVal > bVal) return desc ? -1 : 1;
    return 0;
  });
};

// Object Utilities
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

export const deepMerge = <T extends Record<string, any>>(target: T, ...sources: Partial<T>[]): T => {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return deepMerge(target, ...sources);
};

export const pick = <T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  keys.forEach(key => {
    if (key in obj) result[key] = obj[key];
  });
  return result;
};

export const omit = <T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result;
};

// Type Guards
export const isObject = (item: any): item is Record<string, any> => {
  return item && typeof item === 'object' && !Array.isArray(item);
};

export const isString = (value: any): value is string => {
  return typeof value === 'string';
};

export const isNumber = (value: any): value is number => {
  return typeof value === 'number' && !isNaN(value);
};

export const isBoolean = (value: any): value is boolean => {
  return typeof value === 'boolean';
};

export const isArray = (value: any): value is any[] => {
  return Array.isArray(value);
};

export const isFunction = (value: any): value is Function => {
  return typeof value === 'function';
};

export const isNull = (value: any): value is null => {
  return value === null;
};

export const isUndefined = (value: any): value is undefined => {
  return value === undefined;
};

export const isNullOrUndefined = (value: any): value is null | undefined => {
  return isNull(value) || isUndefined(value);
};

// Validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidUsername = (username: string): boolean => {
  const usernameRegex = /^[a-zA-Z0-9_-]{3,16}$/;
  return usernameRegex.test(username);
};

export const isValidCharacterName = (name: string): boolean => {
  const nameRegex = /^[A-Za-z]{2,16}$/;
  return nameRegex.test(name) && 
         name.length >= GAME_CONFIG.MIN_NAME_LENGTH && 
         name.length <= GAME_CONFIG.MAX_NAME_LENGTH;
};

export const isValidGuildName = (name: string): boolean => {
  const nameRegex = /^[A-Za-z\s]{3,24}$/;
  return nameRegex.test(name) && 
         name.length >= GAME_CONFIG.MIN_GUILD_NAME_LENGTH && 
         name.length <= GAME_CONFIG.MAX_GUILD_NAME_LENGTH;
};

// Time Utilities
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

export const rateLimiter = (limit: number, window: number) => {
  const calls = new Map<string, number[]>();
  
  return (key: string): boolean => {
    const now = Date.now();
    const timestamps = calls.get(key) || [];
    const recentCalls = timestamps.filter(t => now - t < window);
    
    if (recentCalls.length >= limit) {
      return false;
    }
    
    recentCalls.push(now);
    calls.set(key, recentCalls);
    return true;
  };
};

// Cache Utilities
export class LRUCache<T> {
  private cache = new Map<string, { value: T; timestamp: number }>();
  
  constructor(
    private maxSize: number,
    private ttl?: number
  ) {}
  
  get(key: string): T | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;
    
    if (this.ttl && Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }
    
    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, item);
    
    return item.value;
  }
  
  set(key: string, value: T): void {
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, { value, timestamp: Date.now() });
  }
  
  delete(key: string): boolean {
    return this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  get size(): number {
    return this.cache.size;
  }
}

// Event Emitter
export class EventEmitter<T extends Record<string, any[]>> {
  private events = new Map<keyof T, Array<(...args: any[]) => void>>();
  
  on<K extends keyof T>(event: K, handler: (...args: T[K]) => void): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(handler);
    
    // Return unsubscribe function
    return () => this.off(event, handler);
  }
  
  off<K extends keyof T>(event: K, handler: (...args: T[K]) => void): void {
    const handlers = this.events.get(event);
    if (!handlers) return;
    
    const index = handlers.indexOf(handler);
    if (index !== -1) {
      handlers.splice(index, 1);
    }
  }
  
  emit<K extends keyof T>(event: K, ...args: T[K]): void {
    const handlers = this.events.get(event);
    if (!handlers) return;
    
    handlers.forEach(handler => handler(...args));
  }
  
  once<K extends keyof T>(event: K, handler: (...args: T[K]) => void): () => void {
    const wrappedHandler = (...args: T[K]) => {
      handler(...args);
      this.off(event, wrappedHandler);
    };
    return this.on(event, wrappedHandler);
  }
  
  clear(): void {
    this.events.clear();
  }
}

// Color Utilities
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

export const rgbToHex = (r: number, g: number, b: number): string => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

export const colorLerp = (color1: string, color2: string, t: number): string => {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  if (!rgb1 || !rgb2) return color1;
  
  const r = Math.round(lerp(rgb1.r, rgb2.r, t));
  const g = Math.round(lerp(rgb1.g, rgb2.g, t));
  const b = Math.round(lerp(rgb1.b, rgb2.b, t));
  
  return rgbToHex(r, g, b);
};

// Experience Calculation
export const calculateLevel = (experience: number): number => {
  for (let level = GAME_CONFIG.MAX_LEVEL; level >= 1; level--) {
    if (experience >= getExperienceForLevel(level)) {
      return level;
    }
  }
  return 1;
};

export const getExperienceForLevel = (level: number): number => {
  if (level <= 1) return 0;
  return Math.floor((8 * level + Math.pow(level, 2) - 4) * (5 * Math.pow(level, 2) - 5 * level - 20));
};

export const getExperienceToNextLevel = (currentExp: number, currentLevel: number): number => {
  if (currentLevel >= GAME_CONFIG.MAX_LEVEL) return 0;
  return getExperienceForLevel(currentLevel + 1) - currentExp;
};

export const getExperiencePercentage = (currentExp: number, currentLevel: number): number => {
  if (currentLevel >= GAME_CONFIG.MAX_LEVEL) return 100;
  
  const currentLevelExp = getExperienceForLevel(currentLevel);
  const nextLevelExp = getExperienceForLevel(currentLevel + 1);
  const progressExp = currentExp - currentLevelExp;
  const neededExp = nextLevelExp - currentLevelExp;
  
  return (progressExp / neededExp) * 100;
};

// Combat Calculations
export const calculateDamageReduction = (armor: number, attackerLevel: number): number => {
  const constant = 7500; // Armor constant
  return armor / (armor + constant + 85 * attackerLevel);
};

export const calculateCritChance = (rating: number, level: number): number => {
  const ratingPerPercent = 35; // At max level
  return (rating / ratingPerPercent) / 100;
};

export const calculateHitChance = (rating: number, targetLevel: number, attackerLevel: number): number => {
  const baseMissChance = 0.05 + 0.01 * Math.max(0, targetLevel - attackerLevel);
  const hitFromRating = rating / 30 / 100; // 30 rating = 1%
  return Math.min(1, 1 - baseMissChance + hitFromRating);
};

// Network Utilities
export const compress = (data: string): string => {
  // Simple compression placeholder - in real implementation would use actual compression
  return btoa(data);
};

export const decompress = (data: string): string => {
  // Simple decompression placeholder
  return atob(data);
};

export const hash = (data: string): string => {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
};

// Error Handling
export class GameError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'GameError';
  }
}

export const tryExecute = async <T>(
  func: () => Promise<T>,
  fallback?: T
): Promise<T | undefined> => {
  try {
    return await func();
  } catch (error) {
    console.error('Error in tryExecute:', error);
    return fallback;
  }
};

// Localization
export const translate = (key: string, params?: Record<string, any>): string => {
  // Placeholder for translation system
  let translated = key;
  
  if (params) {
    Object.entries(params).forEach(([param, value]) => {
      translated = translated.replace(`{${param}}`, String(value));
    });
  }
  
  return translated;
};

// Performance Monitoring
export const measurePerformance = async <T>(
  name: string,
  func: () => Promise<T>
): Promise<T> => {
  const start = performance.now();
  try {
    return await func();
  } finally {
    const end = performance.now();
    console.debug(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
  }
};

// Queue Implementation
export class Queue<T> {
  private items: T[] = [];
  
  enqueue(item: T): void {
    this.items.push(item);
  }
  
  dequeue(): T | undefined {
    return this.items.shift();
  }
  
  peek(): T | undefined {
    return this.items[0];
  }
  
  get size(): number {
    return this.items.length;
  }
  
  isEmpty(): boolean {
    return this.items.length === 0;
  }
  
  clear(): void {
    this.items = [];
  }
}

// Priority Queue
export class PriorityQueue<T> {
  private items: Array<{ item: T; priority: number }> = [];
  
  enqueue(item: T, priority: number): void {
    const queueItem = { item, priority };
    let added = false;
    
    for (let i = 0; i < this.items.length; i++) {
      if (priority > this.items[i].priority) {
        this.items.splice(i, 0, queueItem);
        added = true;
        break;
      }
    }
    
    if (!added) {
      this.items.push(queueItem);
    }
  }
  
  dequeue(): T | undefined {
    return this.items.shift()?.item;
  }
  
  peek(): T | undefined {
    return this.items[0]?.item;
  }
  
  get size(): number {
    return this.items.length;
  }
  
  isEmpty(): boolean {
    return this.items.length === 0;
  }
  
  clear(): void {
    this.items = [];
  }
}