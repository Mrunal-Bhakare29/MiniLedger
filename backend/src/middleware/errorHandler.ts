import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';
import { env } from '../config/env';

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: 'Not found' });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      details: err.details,
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  const maybeMulter = err as { code?: string; message?: string };
  if (maybeMulter?.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Receipt must be 5 MB or smaller' });
  }

  if (env.NODE_ENV !== 'test') {
    console.error('[error]', err);
  }

  return res.status(500).json({ error: 'Something went wrong. Please try again.' });
}
