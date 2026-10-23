import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

process.env.NODE_ENV = 'test';
process.env.MOCK_OTP_ENABLED = 'true';

if (!process.env.TEST_DATABASE_URL) {
  throw new Error(
    'TEST_DATABASE_URL is missing. Create backend/.env from .env.example (or run npm run setup:db) and point TEST_DATABASE_URL at miniledger_test. Tests will not use miniledger_db.',
  );
}

if (process.env.TEST_DATABASE_URL.includes('miniledger_db') && !process.env.TEST_DATABASE_URL.includes('miniledger_test')) {
  throw new Error('Refusing to run tests against miniledger_db. Use miniledger_test instead.');
}

process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
  process.env.JWT_SECRET = 'miniledger_test_jwt_secret';
}
