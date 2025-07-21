import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database.config';
import { CacheManager, CacheKeys } from '../config/redis.config';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
  };
  session?: {
    id: string;
    token: string;
  };
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractToken(req);
    
    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    // Check if token is in cache
    const cachedSession = await CacheManager.get(CacheKeys.session(token));
    if (cachedSession) {
      req.user = cachedSession.user;
      req.session = cachedSession.session;
      return next();
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // Get session from database
    const session = await prisma.session.findUnique({
      where: { token },
      include: {
        player: {
          select: {
            id: true,
            email: true,
            username: true,
            status: true
          }
        }
      }
    });

    if (!session || session.expiresAt < new Date()) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    if (session.player.status !== 'active') {
      res.status(403).json({ error: 'Account is not active' });
      return;
    }

    // Update last activity
    await prisma.session.update({
      where: { id: session.id },
      data: { lastActivity: new Date() }
    });

    // Cache session
    const sessionData = {
      user: {
        id: session.player.id,
        email: session.player.email,
        username: session.player.username
      },
      session: {
        id: session.id,
        token: session.token
      }
    };
    
    await CacheManager.set(CacheKeys.session(token), sessionData, 300); // 5 minutes

    req.user = sessionData.user;
    req.session = sessionData.session;
    
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
}

export async function optionalAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return next();
    }

    // Try to authenticate but don't fail if it doesn't work
    await authenticate(req, res, () => {});
    next();
  } catch (error) {
    // Ignore errors for optional auth
    next();
  }
}

function extractToken(req: Request): string | null {
  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check cookie
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }

  // Check query parameter (for WebSocket connections)
  if (req.query.token && typeof req.query.token === 'string') {
    return req.query.token;
  }

  return null;
}