import { Request, Response, NextFunction } from 'express';
import  logger  from '../utils/logger';
import { ZodError } from 'zod';

export interface ApiError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export function errorHandler(
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log error
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.flatten().fieldErrors
    });
  }
  
  // Handle operational errors
  if (err.isOperational) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message
    });
  }
  
  // Handle unknown errors
  return res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
}

// Not found handler
export function notFoundHandler(req: Request, res: Response) {
  return res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`
  });
}
