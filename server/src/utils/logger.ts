import winston from 'winston';
import path from 'path';

const logDir = path.join(process.cwd(), 'logs');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  verbose: 'cyan',
  debug: 'blue',
  silly: 'gray',
};

winston.addColors(colors);

// Create format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? '\n' + info.stack : ''}`,
  ),
);

// Create transports
const transports: winston.transport[] = [];

// Console transport
if (process.env.NODE_ENV !== 'test') {
  transports.push(
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' ? format : consoleFormat,
    }),
  );
}

// File transports
if (process.env.NODE_ENV === 'production') {
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  );
}

// Create logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  levels,
  format,
  transports,
  exitOnError: false,
});

// Create stream for Morgan
export const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Game-specific loggers
export const gameLogger = {
  combat: (message: string, data?: any) => {
    logger.debug(`[COMBAT] ${message}`, data);
  },
  
  movement: (message: string, data?: any) => {
    logger.debug(`[MOVEMENT] ${message}`, data);
  },
  
  quest: (message: string, data?: any) => {
    logger.info(`[QUEST] ${message}`, data);
  },
  
  loot: (message: string, data?: any) => {
    logger.info(`[LOOT] ${message}`, data);
  },
  
  chat: (message: string, data?: any) => {
    logger.info(`[CHAT] ${message}`, data);
  },
  
  trade: (message: string, data?: any) => {
    logger.info(`[TRADE] ${message}`, data);
  },
  
  pvp: (message: string, data?: any) => {
    logger.info(`[PVP] ${message}`, data);
  },
  
  guild: (message: string, data?: any) => {
    logger.info(`[GUILD] ${message}`, data);
  },
  
  economy: (message: string, data?: any) => {
    logger.info(`[ECONOMY] ${message}`, data);
  },
  
  security: (message: string, data?: any) => {
    logger.warn(`[SECURITY] ${message}`, data);
  },
  
  performance: (message: string, data?: any) => {
    logger.info(`[PERFORMANCE] ${message}`, data);
  },
  
  error: (message: string, error?: any) => {
    logger.error(`[GAME ERROR] ${message}`, error);
  },
};

// Performance logging
export class PerformanceLogger {
  private static timers = new Map<string, number>();

  static start(label: string): void {
    this.timers.set(label, Date.now());
  }

  static end(label: string, threshold = 100): void {
    const start = this.timers.get(label);
    if (!start) {
      logger.warn(`Performance timer '${label}' was not started`);
      return;
    }

    const duration = Date.now() - start;
    this.timers.delete(label);

    if (duration > threshold) {
      gameLogger.performance(`${label} took ${duration}ms`, { duration, threshold });
    }
  }

  static async measure<T>(label: string, fn: () => Promise<T>, threshold = 100): Promise<T> {
    this.start(label);
    try {
      const result = await fn();
      return result;
    } finally {
      this.end(label, threshold);
    }
  }
}

// Audit logging
export const auditLogger = {
  playerAction: (playerId: string, action: string, details?: any) => {
    logger.info(`[AUDIT] Player ${playerId} performed ${action}`, {
      playerId,
      action,
      details,
      timestamp: new Date().toISOString(),
    });
  },
  
  adminAction: (adminId: string, action: string, targetId?: string, details?: any) => {
    logger.warn(`[ADMIN AUDIT] Admin ${adminId} performed ${action}`, {
      adminId,
      action,
      targetId,
      details,
      timestamp: new Date().toISOString(),
    });
  },
  
  systemAction: (action: string, details?: any) => {
    logger.info(`[SYSTEM AUDIT] System performed ${action}`, {
      action,
      details,
      timestamp: new Date().toISOString(),
    });
  },
};

// Export specific log functions for convenience
export const logError = (message: string, error?: any) => logger.error(message, error);
export const logWarn = (message: string, data?: any) => logger.warn(message, data);
export const logInfo = (message: string, data?: any) => logger.info(message, data);
export const logDebug = (message: string, data?: any) => logger.debug(message, data);