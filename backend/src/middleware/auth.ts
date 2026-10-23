import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';

type TokenPayload = {
  sub: string;
  phone: string;
};

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new AppError(401, 'Please log in to continue'));
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    return next(new AppError(401, 'Please log in to continue'));
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    if (!payload.sub || !payload.phone) {
      return next(new AppError(401, 'Session is invalid. Please log in again'));
    }
    req.user = { id: payload.sub, phone: payload.phone };
    return next();
  } catch {
    return next(new AppError(401, 'Session expired. Please log in again'));
  }
}
