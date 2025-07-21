import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';
import { ERROR_CODES } from '@mmorpg/shared';

export class AppError extends Error {
  public statusCode: number;
  public errorCode: number;
  public isOperational: boolean;
  
  constructor(
    message: string,
    statusCode: number = 500,
    errorCode: number = ERROR_CODES.UNKNOWN_ERROR,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = err;
  
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const message = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    error = new AppError(message, 400, ERROR_CODES.INVALID_REQUEST);
  }
  
  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token', 401, ERROR_CODES.UNAUTHORIZED);
  }
  
  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token expired', 401, ERROR_CODES.UNAUTHORIZED);
  }
  
  // Default to AppError
  if (!(error instanceof AppError)) {
    error = new AppError(
      error.message || 'Internal server error',
      500,
      ERROR_CODES.UNKNOWN_ERROR
    );
  }
  
  const appError = error as AppError;
  
  // Log error
  if (!appError.isOperational) {
    logger.error('Unexpected error:', {
      error: appError,
      request: {
        method: req.method,
        url: req.originalUrl,
        params: req.params,
        query: req.query,
        body: req.body,
        headers: req.headers,
        ip: req.ip
      }
    });
  } else {
    logger.warn('Operational error:', {
      message: appError.message,
      statusCode: appError.statusCode,
      errorCode: appError.errorCode,
      url: req.originalUrl
    });
  }
  
  // Send error response
  res.status(appError.statusCode).json({
    success: false,
    error: {
      message: appError.message,
      code: appError.errorCode,
      ...(process.env.NODE_ENV === 'development' && { stack: appError.stack })
    }
  });
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};