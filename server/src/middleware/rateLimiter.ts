import rateLimit from 'express-rate-limit';
import { getRedis } from '../redis';
import { RATE_LIMITS, ERROR_CODES } from '@mmorpg/shared';
import { AppError } from './errorHandler';

// Redis store for rate limiting
class RedisStore {
  private redis = getRedis();
  private prefix = 'ratelimit:';
  
  async incr(key: string): Promise<{ totalHits: number; resetTime?: Date }> {
    const multi = this.redis.multi();
    const prefixedKey = this.prefix + key;
    
    multi.incr(prefixedKey);
    multi.ttl(prefixedKey);
    
    const results = await multi.exec();
    if (!results) {
      throw new Error('Redis transaction failed');
    }
    
    const totalHits = results[0][1] as number;
    const ttl = results[1][1] as number;
    
    return {
      totalHits,
      resetTime: ttl > 0 ? new Date(Date.now() + ttl * 1000) : undefined
    };
  }
  
  async decrement(key: string): Promise<void> {
    await this.redis.decr(this.prefix + key);
  }
  
  async resetKey(key: string): Promise<void> {
    await this.redis.del(this.prefix + key);
  }
  
  async resetAll(): Promise<void> {
    const keys = await this.redis.keys(this.prefix + '*');
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}

// Rate limiter configurations
const rateLimitConfigs = {
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    message: 'Too many authentication attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false
  },
  api: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute
    message: 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false
  },
  game: {
    windowMs: 1000, // 1 second
    max: 30, // 30 actions per second
    message: 'Too many game actions, please slow down',
    standardHeaders: true,
    legacyHeaders: false
  }
};

// Create rate limiter middleware
export const rateLimiter = (type: keyof typeof rateLimitConfigs) => {
  const config = rateLimitConfigs[type];
  
  return rateLimit({
    ...config,
    store: new RedisStore() as any,
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise IP
      return req.user?.id || req.ip;
    },
    handler: (req, res) => {
      throw new AppError(
        config.message,
        429,
        ERROR_CODES.RATE_LIMITED
      );
    },
    skip: (req) => {
      // Skip rate limiting for admins
      return req.user?.role === 'admin';
    }
  });
};

// Socket.IO rate limiter
export class SocketRateLimiter {
  private limits = new Map<string, Map<string, number[]>>();
  
  constructor(private config: typeof RATE_LIMITS) {}
  
  check(socketId: string, event: string): boolean {
    const eventConfig = this.config[event];
    if (!eventConfig) return true; // No limit configured
    
    const now = Date.now();
    const userLimits = this.limits.get(socketId) || new Map();
    const eventTimestamps = userLimits.get(event) || [];
    
    // Remove old timestamps
    const validTimestamps = eventTimestamps.filter(
      timestamp => now - timestamp < eventConfig.duration
    );
    
    // Check if limit exceeded
    if (validTimestamps.length >= eventConfig.points) {
      return false;
    }
    
    // Add current timestamp
    validTimestamps.push(now);
    userLimits.set(event, validTimestamps);
    this.limits.set(socketId, userLimits);
    
    return true;
  }
  
  reset(socketId: string, event?: string): void {
    if (event) {
      const userLimits = this.limits.get(socketId);
      if (userLimits) {
        userLimits.delete(event);
      }
    } else {
      this.limits.delete(socketId);
    }
  }
  
  cleanup(): void {
    const now = Date.now();
    
    for (const [socketId, userLimits] of this.limits) {
      for (const [event, timestamps] of userLimits) {
        const eventConfig = this.config[event];
        if (!eventConfig) continue;
        
        const validTimestamps = timestamps.filter(
          timestamp => now - timestamp < eventConfig.duration
        );
        
        if (validTimestamps.length === 0) {
          userLimits.delete(event);
        } else {
          userLimits.set(event, validTimestamps);
        }
      }
      
      if (userLimits.size === 0) {
        this.limits.delete(socketId);
      }
    }
  }
}

// Cleanup interval
setInterval(() => {
  // Cleanup will be handled by each SocketRateLimiter instance
}, 60000); // Every minute