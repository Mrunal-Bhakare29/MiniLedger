import type { Request, Response } from 'express';
import { phoneBodySchema, verifyOtpSchema } from './auth.validation';
import * as authService from './auth.service';
import { AppError } from '../../utils/AppError';

export async function sendOtp(req: Request, res: Response) {
  const body = phoneBodySchema.parse(req.body);
  const result = await authService.sendOtp(body.phone);
  res.status(200).json(result);
}

export async function verifyOtp(req: Request, res: Response) {
  const body = verifyOtpSchema.parse(req.body);
  const result = await authService.verifyOtp(body.phone, body.otp);
  res.status(200).json(result);
}

export async function me(req: Request, res: Response) {
  if (!req.user) {
    throw new AppError(401, 'Please log in to continue');
  }
  const user = await authService.getMe(req.user.id);
  res.status(200).json({ user });
}
