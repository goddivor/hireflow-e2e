import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

export type User = {
  id: number;
  email: string;
  password_hash: string;
  verified: number;
};

export type Task = {
  id: number;
  user_id: number;
  title: string;
  done: number;
  created_at: string;
};

export function openDb(file: string): DatabaseSync {
  if (file !== ":memory:") mkdirSync(dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY,
      email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      verified      INTEGER NOT NULL DEFAULT 0
    );

    -- One row per emailed secret: a 6-digit signup code, or a password-reset token.
    CREATE TABLE IF NOT EXISTS tokens (
      token      TEXT PRIMARY KEY,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      kind       TEXT NOT NULL CHECK (kind IN ('verify', 'reset')),
      expires_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id      TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id         INTEGER PRIMARY KEY,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title      TEXT NOT NULL,
      done       INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  return db;
}
