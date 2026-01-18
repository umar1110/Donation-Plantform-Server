/**
 * Async handler wrapper to catch errors and pass them to Express error middleware.
 */
import { Request, Response, NextFunction } from 'express';

type AsyncFunction = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<any>;

/**
 * Wraps an async route handler to automatically catch errors and pass them to error middleware.
 *
 * @param fn - Async route handler function
 * @returns Wrapped function that catches errors
 */
export function asyncHandler(fn: AsyncFunction) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}


