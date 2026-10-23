import jwt, { type SignOptions } from 'jsonwebtoken';
import { env, isMockOtpEnabled } from '../../config/env';
import { query } from '../../config/db';
import { AppError } from '../../utils/AppError';
import { generateSixDigitOtp, hashOtp, otpHashesMatch } from '../../utils/otp';
import { toE164In } from '../../utils/phone';

type UserRow = {
  id: string;
  phone: string;
  created_at: Date;
};

type OtpRow = {
  id: string;
  phone: string;
  code_hash: string;
  expires_at: Date;
  attempt_count: number;
  last_sent_at: Date;
  consumed_at: Date | null;
};

export async function sendOtp(phone: string) {
  const existing = await query<OtpRow>(
    `SELECT * FROM otp_challenges
     WHERE phone = $1 AND consumed_at IS NULL
     ORDER BY created_at DESC
     LIMIT 1`,
    [phone],
  );

  const latest = existing.rows[0];
  if (latest) {
    const elapsedMs = Date.now() - new Date(latest.last_sent_at).getTime();
    const waitMs = env.OTP_RESEND_SECONDS * 1000 - elapsedMs;
    if (waitMs > 0) {
      throw new AppError(429, 'Please wait before requesting another OTP', {
        retryAfterSeconds: Math.ceil(waitMs / 1000),
      });
    }
  }

  const otp = generateSixDigitOtp();
  const codeHash = hashOtp(phone, otp);
  const expiresAt = new Date(Date.now() + env.OTP_TTL_SECONDS * 1000);

  await query('UPDATE otp_challenges SET consumed_at = NOW() WHERE phone = $1 AND consumed_at IS NULL', [phone]);
  await query(
    `INSERT INTO otp_challenges (phone, code_hash, expires_at, attempt_count, last_sent_at)
     VALUES ($1, $2, $3, 0, NOW())`,
    [phone, codeHash, expiresAt],
  );

  if (isMockOtpEnabled) {
    console.log(`[MiniLedger][DEV OTP] +91${phone} => ${otp}`);
  }

  return {
  message: 'OTP sent successfully',
  expiresInSeconds: env.OTP_TTL_SECONDS,
  resendAvailableInSeconds: env.OTP_RESEND_SECONDS,
  mockAuth: isMockOtpEnabled,
  ...(isMockOtpEnabled ? { mockOtp: otp } : {}),
};
}

export async function verifyOtp(phone: string, otp: string) {
  const existing = await query<OtpRow>(
    `SELECT * FROM otp_challenges
     WHERE phone = $1 AND consumed_at IS NULL
     ORDER BY created_at DESC
     LIMIT 1`,
    [phone],
  );
  const challenge = existing.rows[0];

  if (!challenge) {
    throw new AppError(400, 'No active OTP found. Please request a new code');
  }

  if (new Date(challenge.expires_at).getTime() <= Date.now()) {
    await query('UPDATE otp_challenges SET consumed_at = NOW() WHERE id = $1 AND consumed_at IS NULL', [challenge.id]);
    throw new AppError(400, 'OTP has expired. Please request a new code');
  }

  if (challenge.attempt_count >= env.OTP_MAX_ATTEMPTS) {
    await query('UPDATE otp_challenges SET consumed_at = NOW() WHERE id = $1 AND consumed_at IS NULL', [challenge.id]);
    throw new AppError(429, 'Too many incorrect attempts. Please request a new OTP');
  }

  const expected = hashOtp(phone, otp);
  if (!otpHashesMatch(expected, challenge.code_hash)) {
    await query('UPDATE otp_challenges SET attempt_count = attempt_count + 1 WHERE id = $1', [challenge.id]);
    const remaining = env.OTP_MAX_ATTEMPTS - challenge.attempt_count - 1;
    throw new AppError(400, 'Incorrect OTP', { remainingAttempts: Math.max(remaining, 0) });
  }

  await query('UPDATE otp_challenges SET consumed_at = NOW() WHERE id = $1', [challenge.id]);

  const upserted = await query<UserRow>(
    `INSERT INTO users (phone)
     VALUES ($1)
     ON CONFLICT (phone) DO UPDATE SET phone = EXCLUDED.phone
     RETURNING id, phone, created_at`,
    [phone],
  );
  const user = upserted.rows[0];

  const token = jwt.sign({ sub: user.id, phone: user.phone }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as SignOptions);

  return {
    token,
    user: serializeUser(user),
  };
}

export async function getMe(userId: string) {
  const result = await query<UserRow>('SELECT id, phone, created_at FROM users WHERE id = $1', [userId]);
  const user = result.rows[0];
  if (!user) {
    throw new AppError(401, 'Account not found. Please log in again');
  }
  return serializeUser(user);
}

function serializeUser(user: UserRow) {
  return {
    id: user.id,
    phone: user.phone,
    displayPhone: toE164In(user.phone),
    createdAt: user.created_at,
  };
}
