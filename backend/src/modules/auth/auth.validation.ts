import { z } from 'zod';
import { isValidIndianMobile, normalizeIndianPhone } from '../../utils/phone';

export const phoneBodySchema = z.object({
  phone: z
    .string({ required_error: 'Phone number is required' })
    .trim()
    .transform(normalizeIndianPhone)
    .refine(isValidIndianMobile, 'Enter a valid 10-digit Indian mobile number'),
  countryCode: z.string().trim().optional(),
});

export const verifyOtpSchema = phoneBodySchema.extend({
  otp: z
    .string({ required_error: 'OTP is required' })
    .trim()
    .regex(/^\d{6}$/, 'OTP must be a 6-digit code'),
});
