import { api } from './client';
import type { User } from '../types';

export async function sendOtp(phone: string) {
  const { data } = await api.post('/api/auth/send-otp', { phone, countryCode: '+91' });
  return data as {
    message: string;
    phone: string;
    expiresInSeconds: number;
    resendAvailableInSeconds: number;
    mockAuth: boolean;
  };
}

export async function verifyOtp(phone: string, otp: string) {
  const { data } = await api.post('/api/auth/verify-otp', { phone, otp });
  return data as { token: string; user: User };
}

export async function fetchMe() {
  const { data } = await api.get('/api/auth/me');
  return data.user as User;
}
