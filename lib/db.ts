import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

// Pendant `next build`, Next.js importe ce module pour "collecter les
// données de page" de plusieurs routes en parallèle (des workers séparés).
// Si chacun ouvre en même temps le vrai fichier SQLite sur le volume monté,
// ça provoque des erreurs "database is locked" (SQLITE_BUSY) qui font
// planter le build. Pendant la phase de build, on utilise donc une base
// SQLite en mémoire (jetable, jamais lue) : aucun fichier partagé, donc
// aucun risque de verrou. En production réelle (au démarrage du serveur),
// NEXT_PHASE n'est pas défini à cette valeur et on utilise le vrai fichier.
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';

const DATA_DIR = process.env.DATA_DIR || './data';
const DB_PATH = isBuildPhase ? ':memory:' : path.join(DATA_DIR, 'recipes.db');
export const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

if (!isBuildPhase) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// On garde une instance unique sur `global`, en dev comme en prod : Next.js
// recharge ce module à chaque changement de fichier en dev, et en prod le
// serveur reste un seul processus long-vivant (pas de fonctions serverless
// isolées) donc réutiliser la même connexion évite d'ouvrir inutilement
// plusieurs handles sur le même fichier.
declare global {
  // eslint-disable-next-line no-var
  var __recipesDb: Database.Database | undefined;
}

function createConnection() {
  // `timeout` fait patienter better-sqlite3 (au lieu de lever immédiatement
  // SQLITE_BUSY) si la base est momentanément verrouillée par un autre accès.
  const db = new Database(DB_PATH, { timeout: 5000 });
  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 5000');
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
globalThis.__recipesDb = db;

export type { Recipe } from './types';
