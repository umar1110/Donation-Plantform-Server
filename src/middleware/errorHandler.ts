import { Request, Response, NextFunction } from 'express';
import  logger  from '../utils/logger';
import { ZodError } from 'zod';
import { ApiError } from '../utils/apiError';

export function errorHandler(
  err: Error,
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
      errors: err.issues,
      message: err.issues.map(issue => issue.message).flat().join(', ')
    });
  }
  
  // Handle ApiError (operational errors)
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors.length > 0 && { errors: err.errors })
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
