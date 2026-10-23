import { app } from './app';
import { env } from './config/env';
import { pool } from './config/db';
import { runMigrations } from './db/migrate';

async function start() {
  await pool.query('SELECT 1');
  await runMigrations();

  app.listen(env.PORT, '0.0.0.0', () => {
    console.log(`MiniLedger API listening on http://localhost:${env.PORT}`);
    if (env.NODE_ENV !== 'production') {
      console.log('Mock OTP authentication is for local development only. OTP codes are never returned in API responses.');
    }
  });
}

start().catch((error) => {
  console.error('Failed to start MiniLedger API');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
