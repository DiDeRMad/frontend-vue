import Redis from 'ioredis';
import { logger } from '../utils/logger';

// Create Redis client
export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  retryStrategy: (times: number) => {
    if (times > 3) {
      logger.error('Redis connection failed after 3 retries');
      return null;
    }
    return Math.min(times * 100, 3000);
  },
  reconnectOnError: (err) => {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  },
});

// Create pub/sub clients
export const pubClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
export const subClient = pubClient.duplicate();

// Error handling
redis.on('error', (error) => {
  logger.error('Redis error:', error);
});

redis.on('connect', () => {
  logger.info('Redis connected successfully');
});

redis.on('ready', () => {
  logger.info('Redis ready to accept commands');
});

pubClient.on('error', (error) => {
  logger.error('Redis pub client error:', error);
});

subClient.on('error', (error) => {
  logger.error('Redis sub client error:', error);
});

// Cache utilities
export class CacheManager {
  private static readonly DEFAULT_TTL = 3600; // 1 hour

  static async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  static async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await redis.setex(key, ttl, serialized);
      } else {
        await redis.setex(key, this.DEFAULT_TTL, serialized);
      }
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
    }
  }

  static async delete(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
    }
  }

  static async deletePattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      logger.error(`Cache delete pattern error for ${pattern}:`, error);
    }
  }

  static async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  static async increment(key: string, amount = 1): Promise<number> {
    try {
      return await redis.incrby(key, amount);
    } catch (error) {
      logger.error(`Cache increment error for key ${key}:`, error);
      return 0;
    }
  }

  static async decrement(key: string, amount = 1): Promise<number> {
    try {
      return await redis.decrby(key, amount);
    } catch (error) {
      logger.error(`Cache decrement error for key ${key}:`, error);
      return 0;
    }
  }

  // List operations
  static async lpush(key: string, ...values: string[]): Promise<number> {
    try {
      return await redis.lpush(key, ...values);
    } catch (error) {
      logger.error(`Cache lpush error for key ${key}:`, error);
      return 0;
    }
  }

  static async rpush(key: string, ...values: string[]): Promise<number> {
    try {
      return await redis.rpush(key, ...values);
    } catch (error) {
      logger.error(`Cache rpush error for key ${key}:`, error);
      return 0;
    }
  }

  static async lrange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      return await redis.lrange(key, start, stop);
    } catch (error) {
      logger.error(`Cache lrange error for key ${key}:`, error);
      return [];
    }
  }

  // Set operations
  static async sadd(key: string, ...members: string[]): Promise<number> {
    try {
      return await redis.sadd(key, ...members);
    } catch (error) {
      logger.error(`Cache sadd error for key ${key}:`, error);
      return 0;
    }
  }

  static async srem(key: string, ...members: string[]): Promise<number> {
    try {
      return await redis.srem(key, ...members);
    } catch (error) {
      logger.error(`Cache srem error for key ${key}:`, error);
      return 0;
    }
  }

  static async smembers(key: string): Promise<string[]> {
    try {
      return await redis.smembers(key);
    } catch (error) {
      logger.error(`Cache smembers error for key ${key}:`, error);
      return [];
    }
  }

  static async sismember(key: string, member: string): Promise<boolean> {
    try {
      const result = await redis.sismember(key, member);
      return result === 1;
    } catch (error) {
      logger.error(`Cache sismember error for key ${key}:`, error);
      return false;
    }
  }

  // Hash operations
  static async hset(key: string, field: string, value: string): Promise<void> {
    try {
      await redis.hset(key, field, value);
    } catch (error) {
      logger.error(`Cache hset error for key ${key}:`, error);
    }
  }

  static async hget(key: string, field: string): Promise<string | null> {
    try {
      return await redis.hget(key, field);
    } catch (error) {
      logger.error(`Cache hget error for key ${key}:`, error);
      return null;
    }
  }

  static async hgetall(key: string): Promise<Record<string, string>> {
    try {
      return await redis.hgetall(key);
    } catch (error) {
      logger.error(`Cache hgetall error for key ${key}:`, error);
      return {};
    }
  }

  // Sorted set operations
  static async zadd(key: string, score: number, member: string): Promise<number> {
    try {
      return await redis.zadd(key, score, member);
    } catch (error) {
      logger.error(`Cache zadd error for key ${key}:`, error);
      return 0;
    }
  }

  static async zrange(key: string, start: number, stop: number, withScores?: boolean): Promise<string[]> {
    try {
      if (withScores) {
        return await redis.zrange(key, start, stop, 'WITHSCORES');
      }
      return await redis.zrange(key, start, stop);
    } catch (error) {
      logger.error(`Cache zrange error for key ${key}:`, error);
      return [];
    }
  }

  static async zrevrange(key: string, start: number, stop: number, withScores?: boolean): Promise<string[]> {
    try {
      if (withScores) {
        return await redis.zrevrange(key, start, stop, 'WITHSCORES');
      }
      return await redis.zrevrange(key, start, stop);
    } catch (error) {
      logger.error(`Cache zrevrange error for key ${key}:`, error);
      return [];
    }
  }

  static async zrem(key: string, ...members: string[]): Promise<number> {
    try {
      return await redis.zrem(key, ...members);
    } catch (error) {
      logger.error(`Cache zrem error for key ${key}:`, error);
      return 0;
    }
  }
}

// Cache key generators
export const CacheKeys = {
  player: (playerId: string) => `player:${playerId}`,
  character: (characterId: string) => `character:${characterId}`,
  characterLocation: (characterId: string) => `character:location:${characterId}`,
  zone: (zoneId: string) => `zone:${zoneId}`,
  zoneCharacters: (zoneId: string) => `zone:characters:${zoneId}`,
  item: (itemId: string) => `item:${itemId}`,
  guild: (guildId: string) => `guild:${guildId}`,
  session: (sessionId: string) => `session:${sessionId}`,
  inventory: (characterId: string) => `inventory:${characterId}`,
  skills: (characterId: string) => `skills:${characterId}`,
  buffs: (characterId: string) => `buffs:${characterId}`,
  party: (partyId: string) => `party:${partyId}`,
  raid: (raidId: string) => `raid:${raidId}`,
  auction: (auctionId: string) => `auction:${auctionId}`,
  mail: (characterId: string) => `mail:${characterId}`,
  friendsList: (playerId: string) => `friends:${playerId}`,
  ignoreList: (playerId: string) => `ignore:${playerId}`,
  chatHistory: (channel: string) => `chat:${channel}`,
  leaderboard: (type: string, season: number) => `leaderboard:${type}:${season}`,
  onlinePlayers: () => 'online:players',
  onlineCharacters: () => 'online:characters',
  instancePlayers: (instanceId: string) => `instance:players:${instanceId}`,
  questProgress: (characterId: string, questId: string) => `quest:${characterId}:${questId}`,
  cooldown: (characterId: string, skillId: string) => `cooldown:${characterId}:${skillId}`,
  pvpQueue: (type: string) => `pvp:queue:${type}`,
  worldBoss: (bossId: string) => `boss:${bossId}`,
  marketPrice: (itemId: string) => `market:${itemId}`,
};

// Health check
export async function checkRedisHealth(): Promise<boolean> {
  try {
    const pong = await redis.ping();
    return pong === 'PONG';
  } catch (error) {
    logger.error('Redis health check failed:', error);
    return false;
  }
}