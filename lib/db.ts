import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = process.env.DATA_DIR || './data';
const DB_PATH = path.join(DATA_DIR, 'recipes.db');
export const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// En dev, Next.js recharge ce module à chaque changement de fichier ; on
// garde une instance unique sur `global` pour ne pas rouvrir la base sans
// arrêt et éviter les erreurs "database is locked".
declare global {
  // eslint-disable-next-line no-var
  var __recipesDb: Database.Database | undefined;
}

function createConnection() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'autre',
      tags TEXT NOT NULL DEFAULT '',
      prep_time TEXT NOT NULL DEFAULT '',
      difficulty TEXT NOT NULL DEFAULT '',
      ingredients TEXT NOT NULL DEFAULT '[]',
      steps TEXT NOT NULL DEFAULT '[]',
      submitter_name TEXT NOT NULL DEFAULT '',
      photo_filename TEXT,
      validated INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  return db;
}

export const db = globalThis.__recipesDb ?? createConnection();
if (process.env.NODE_ENV !== 'production') {
  globalThis.__recipesDb = db;
}

export type { Recipe } from './types';
