import { createHash, randomInt, timingSafeEqual } from 'crypto';

export function generateSixDigitOtp(): string {
  return String(randomInt(100000, 1000000));
}

export function hashOtp(phone: string, otp: string): string {
  return createHash('sha256').update(`${phone}:${otp}`).digest('hex');
}

export function otpHashesMatch(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return timingSafeEqual(leftBuffer, rightBuffer);
}
