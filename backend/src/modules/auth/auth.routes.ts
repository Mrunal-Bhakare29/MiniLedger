import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { requireAuth } from '../../middleware/auth';
import * as controller from './auth.controller';

export const authRouter = Router();

authRouter.post('/send-otp', asyncHandler(controller.sendOtp));
authRouter.post('/verify-otp', asyncHandler(controller.verifyOtp));
authRouter.get('/me', requireAuth, asyncHandler(controller.me));
