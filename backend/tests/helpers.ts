import request from 'supertest';
import { app } from '../src/app';
import { pool } from '../src/config/db';
import { runMigrations } from '../src/db/migrate';

export async function resetTestDatabase() {
  await runMigrations();
  await pool.query('TRUNCATE TABLE otp_challenges, loans, users CASCADE');
}

export function captureOtpFromLogs() {
  const lines: string[] = [];
  const spy = jest.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
    lines.push(args.map(String).join(' '));
  });
  return {
    restore() {
      spy.mockRestore();
    },
    readOtp() {
      const match = lines.join('\n').match(/=>\s(\d{6})/);
      if (!match) {
        throw new Error(`OTP was not printed in development logs. Captured: ${lines.join(' | ')}`);
      }
      return match[1];
    },
  };
}

export async function loginAs(phone: string) {
  const capture = captureOtpFromLogs();
  const send = await request(app).post('/api/auth/send-otp').send({ phone, countryCode: '+91' });
  const otp = capture.readOtp();
  capture.restore();
  const verify = await request(app).post('/api/auth/verify-otp').send({ phone, otp });
  return {
    token: verify.body.token as string,
    user: verify.body.user,
    send,
    verify,
    otp,
  };
}

export function auth(token: string) {
  return { Authorization: `Bearer ${token}` };
}
