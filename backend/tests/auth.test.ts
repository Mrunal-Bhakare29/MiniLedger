import request from 'supertest';
import { app } from '../src/app';
import { pool } from '../src/config/db';
import { auth, captureOtpFromLogs, loginAs, resetTestDatabase } from './helpers';

const PHONE = '9876543210';

beforeAll(async () => {
  await resetTestDatabase();
});

afterAll(async () => {
  await pool.end();
});

describe('authentication', () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  it('sends an OTP without returning the code in the response', async () => {
    const capture = captureOtpFromLogs();
    const res = await request(app).post('/api/auth/send-otp').send({ phone: PHONE });
    capture.restore();
    expect(res.status).toBe(200);
    expect(res.body.otp).toBeUndefined();
    expect(res.body.code).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toMatch(/\b\d{6}\b/);
    expect(res.body.message).toMatch(/sent/i);
  });

  it('rejects an invalid OTP', async () => {
    const capture = captureOtpFromLogs();
    await request(app).post('/api/auth/send-otp').send({ phone: PHONE });
    capture.restore();
    const res = await request(app).post('/api/auth/verify-otp').send({ phone: PHONE, otp: '000000' });
    expect(res.status).toBe(400);
    expect(res.body.token).toBeUndefined();
  });

  it('rejects an expired OTP', async () => {
    const capture = captureOtpFromLogs();
    await request(app).post('/api/auth/send-otp').send({ phone: PHONE });
    const otp = capture.readOtp();
    capture.restore();
    await pool.query(`UPDATE otp_challenges SET expires_at = NOW() - INTERVAL '1 minute' WHERE phone = $1`, [PHONE]);
    const res = await request(app).post('/api/auth/verify-otp').send({ phone: PHONE, otp });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/expired/i);
  });

  it('logs in with a valid OTP and returns a JWT', async () => {
    const { verify, token } = await loginAs(PHONE);
    expect(verify.status).toBe(200);
    expect(token).toEqual(expect.any(String));
    const me = await request(app).get('/api/auth/me').set(auth(token));
    expect(me.status).toBe(200);
    expect(me.body.user.phone).toBe(PHONE);
  });

  it('throttles OTP resend requests', async () => {
    await request(app).post('/api/auth/send-otp').send({ phone: PHONE });
    const res = await request(app).post('/api/auth/send-otp').send({ phone: PHONE });
    expect(res.status).toBe(429);
  });

  it('rejects an invalid Indian mobile number', async () => {
    const res = await request(app).post('/api/auth/send-otp').send({ phone: '12345' });
    expect(res.status).toBe(400);
  });
});
