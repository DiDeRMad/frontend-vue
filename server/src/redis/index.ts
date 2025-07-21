import Redis from 'ioredis';
import { logger } from '../utils/logger';

let redis: Redis;
let subscriber: Redis;
let publisher: Redis;

export async function initializeRedis(): Promise<void> {
  const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    reconnectOnError: (err: Error) => {
      const targetError = 'READONLY';
      if (err.message.includes(targetError)) {
        return true;
      }
      return false;
    }
  };
  
  // Main Redis client
  redis = new Redis(redisConfig);
  
  // Pub/Sub clients
  subscriber = new Redis(redisConfig);
  publisher = new Redis(redisConfig);
  
  // Event handlers
  redis.on('connect', () => {
    logger.info('Redis connected');
  });
  
  redis.on('error', (error) => {
    logger.error('Redis error:', error);
  });
  
  redis.on('close', () => {
    logger.warn('Redis connection closed');
  });
  
  redis.on('reconnecting', () => {
    logger.info('Redis reconnecting...');
  });
  
  // Test connection
  try {
    await redis.ping();
    logger.info('Redis connection established');
  } catch (error) {
    logger.error('Redis connection failed:', error);
    throw error;
  }
}

export function getRedis(): Redis {
  if (!redis) {
    throw new Error('Redis not initialized. Call initializeRedis() first.');
  }
  return redis;
}

export function getSubscriber(): Redis {
  if (!subscriber) {
    throw new Error('Redis subscriber not initialized. Call initializeRedis() first.');
  }
  return subscriber;
}

export function getPublisher(): Redis {
  if (!publisher) {
    throw new Error('Redis publisher not initialized. Call initializeRedis() first.');
  }
  return publisher;
}

// Cache utilities
export class Cache {
  private static prefix = 'mmorpg:';
  
  static async get<T>(key: string): Promise<T | null> {
    const value = await redis.get(this.prefix + key);
    if (!value) return null;
    
    try {
      return JSON.parse(value);
    } catch {
      return value as T;
    }
  }
  
  static async set(key: string, value: any, ttl?: number): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    
    if (ttl) {
      await redis.setex(this.prefix + key, ttl, serialized);
    } else {
      await redis.set(this.prefix + key, serialized);
    }
  }
  
  static async delete(key: string): Promise<void> {
    await redis.del(this.prefix + key);
  }
  
  static async exists(key: string): Promise<boolean> {
    const result = await redis.exists(this.prefix + key);
    return result === 1;
  }
  
  static async expire(key: string, ttl: number): Promise<void> {
    await redis.expire(this.prefix + key, ttl);
  }
  
  static async keys(pattern: string): Promise<string[]> {
    const keys = await redis.keys(this.prefix + pattern);
    return keys.map(key => key.replace(this.prefix, ''));
  }
  
  static async flushPattern(pattern: string): Promise<void> {
    const keys = await redis.keys(this.prefix + pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
}

// Session management
export class SessionManager {
  private static prefix = 'session:';
  private static ttl = 86400; // 24 hours
  
  static async create(sessionId: string, data: any): Promise<void> {
    await Cache.set(this.prefix + sessionId, data, this.ttl);
  }
  
  static async get(sessionId: string): Promise<any> {
    return Cache.get(this.prefix + sessionId);
  }
  
  static async update(sessionId: string, data: any): Promise<void> {
    await Cache.set(this.prefix + sessionId, data, this.ttl);
  }
  
  static async destroy(sessionId: string): Promise<void> {
    await Cache.delete(this.prefix + sessionId);
  }
  
  static async extend(sessionId: string): Promise<void> {
    await Cache.expire(this.prefix + sessionId, this.ttl);
  }
}

// Leaderboard management
export class Leaderboard {
  static async addScore(leaderboard: string, playerId: string, score: number): Promise<void> {
    await redis.zadd(`leaderboard:${leaderboard}`, score, playerId);
  }
  
  static async getTop(leaderboard: string, count: number): Promise<{ playerId: string; score: number }[]> {
    const results = await redis.zrevrange(`leaderboard:${leaderboard}`, 0, count - 1, 'WITHSCORES');
    const leaderboardData: { playerId: string; score: number }[] = [];
    
    for (let i = 0; i < results.length; i += 2) {
      leaderboardData.push({
        playerId: results[i],
        score: parseFloat(results[i + 1])
      });
    }
    
    return leaderboardData;
  }
  
  static async getRank(leaderboard: string, playerId: string): Promise<number | null> {
    const rank = await redis.zrevrank(`leaderboard:${leaderboard}`, playerId);
    return rank !== null ? rank + 1 : null;
  }
  
  static async getScore(leaderboard: string, playerId: string): Promise<number | null> {
    const score = await redis.zscore(`leaderboard:${leaderboard}`, playerId);
    return score !== null ? parseFloat(score) : null;
  }
}

export default redis;