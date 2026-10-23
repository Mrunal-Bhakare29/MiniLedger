import fs from 'fs';
import path from 'path';
import { pool } from '../config/db';

export async function runMigrations(): Promise<void> {
  const migrationsDir = path.resolve(process.cwd(), 'migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  for (const file of files) {
    const applied = await pool.query('SELECT 1 FROM schema_migrations WHERE filename = $1', [file]);
    if ((applied.rowCount ?? 0) > 0) {
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    await pool.query('BEGIN');
    try {
      await pool.query(sql);
      await pool.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
      await pool.query('COMMIT');
      console.log(`[migrate] applied ${file}`);
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  }
}

if (require.main === module) {
  runMigrations()
    .then(async () => {
      console.log('[migrate] complete');
      await pool.end();
    })
    .catch(async (error) => {
      console.error('[migrate] failed', error);
      await pool.end();
      process.exit(1);
    });
}
