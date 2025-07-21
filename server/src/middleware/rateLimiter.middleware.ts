import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { redis } from '../config/redis.config';
import { logger } from '../utils/logger';

// Create different rate limiters for different endpoints
const generalLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:general',
  points: parseInt(process.env.RATE_LIMIT_MAX || '100'), // requests
  duration: parseInt(process.env.RATE_LIMIT_WINDOW || '900'), // per 15 minutes
  blockDuration: 900, // block for 15 minutes
});

const authLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:auth',
  points: 5, // 5 attempts
  duration: 900, // per 15 minutes
  blockDuration: 900, // block for 15 minutes
});

const apiLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:api',
  points: 200, // requests
  duration: 60, // per minute
  blockDuration: 60, // block for 1 minute
});

const chatLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:chat',
  points: 30, // messages
  duration: 60, // per minute
  blockDuration: 300, // block for 5 minutes
});

export function createRateLimiter(type: 'general' | 'auth' | 'api' | 'chat' = 'general') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = getKey(req);
      const limiter = getLimiter(type);
      
      await limiter.consume(key);
      next();
    } catch (rejRes: any) {
      const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
      res.set('Retry-After', String(secs));
      res.set('X-RateLimit-Limit', String(rejRes.points));
      res.set('X-RateLimit-Remaining', String(rejRes.remainingPoints || 0));
      res.set('X-RateLimit-Reset', new Date(Date.now() + rejRes.msBeforeNext).toISOString());
      
      logger.warn('Rate limit exceeded', {
        type,
        ip: req.ip,
        path: req.path,
        remainingPoints: rejRes.remainingPoints || 0
      });
      
      res.status(429).json({
        error: 'Too many requests',
        message: `Rate limit exceeded. Try again in ${secs} seconds.`,
        retryAfter: secs
      });
    }
  };
}

function getKey(req: Request): string {
  // Use user ID if authenticated, otherwise use IP
  const userId = (req as any).user?.id;
  return userId || req.ip || 'unknown';
}

function getLimiter(type: string): RateLimiterRedis {
  switch (type) {
    case 'auth':
      return authLimiter;
    case 'api':
      return apiLimiter;
    case 'chat':
      return chatLimiter;
    default:
      return generalLimiter;
  }
}

// Specific rate limiters for common endpoints
export const generalRateLimiter = createRateLimiter('general');
export const authRateLimiter = createRateLimiter('auth');
export const apiRateLimiter = createRateLimiter('api');
export const chatRateLimiter = createRateLimiter('chat');