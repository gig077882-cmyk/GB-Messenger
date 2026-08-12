import Database from 'better-sqlite3';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export function openDatabase(path: string) {
  if (path !== ':memory:') mkdirSync(dirname(resolve(path)), {recursive:true});
  const db = new Database(path);
  db.pragma('journal_mode = WAL'); db.pragma('foreign_keys = ON'); db.pragma('busy_timeout = 5000');
  // The ledger makes non-idempotent SQLite ALTER TABLE migrations safe on restart.
  db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)');
  for (const name of ['001_init.sql', '002_family_features.sql', '003_completion.sql']) {
    if (db.prepare('SELECT 1 FROM schema_migrations WHERE name=?').get(name)) continue;
    db.exec(readFileSync(resolve(process.cwd(),'db',name),'utf8'));
    db.prepare('INSERT INTO schema_migrations(name) VALUES(?)').run(name);
  }
  return db;
}
export type Db = ReturnType<typeof openDatabase>;
