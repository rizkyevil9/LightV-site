import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../data/database.db');

// Ensure data directory exists
if (!fs.existsSync(path.dirname(dbPath))) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

export const db = new (sqlite3.verbose()).Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
  }
});

export const initDb = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users Table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT,
          premium BOOLEAN DEFAULT 0,
          banned BOOLEAN DEFAULT 0,
          limit_count INTEGER DEFAULT 0,
          last_used INTEGER DEFAULT 0,
          level INTEGER DEFAULT 1,
          exp INTEGER DEFAULT 0
        )
      `);

      // Groups Table
      db.run(`
        CREATE TABLE IF NOT EXISTS groups (
          id TEXT PRIMARY KEY,
          name TEXT,
          welcome_msg TEXT,
          goodbye_msg TEXT,
          anti_link BOOLEAN DEFAULT 0,
          anti_badword BOOLEAN DEFAULT 0,
          muted BOOLEAN DEFAULT 0,
          banned BOOLEAN DEFAULT 0
        )
      `);

      // Plugins configuration table
      db.run(`
        CREATE TABLE IF NOT EXISTS plugins (
          name TEXT PRIMARY KEY,
          enabled BOOLEAN DEFAULT 1,
          options TEXT
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
};

export const getUser = (id) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
      if (err) reject(err);
      resolve(row);
    });
  });
};

export const addUser = (id, name = '') => {
  return new Promise((resolve, reject) => {
    db.run('INSERT OR IGNORE INTO users (id, name) VALUES (?, ?)', [id, name], (err) => {
      if (err) reject(err);
      resolve();
    });
  });
};

// Simple key-value store for other settings if needed
export const getSetting = (key) => {
    return new Promise((resolve, reject) => {
        db.get('SELECT options FROM plugins WHERE name = ?', [key], (err, row) => {
            if(err) reject(err);
            resolve(row ? JSON.parse(row.options) : null);
        });
    });
};

export const setSetting = (key, value) => {
    return new Promise((resolve, reject) => {
        const valStr = JSON.stringify(value);
        db.run('INSERT OR REPLACE INTO plugins (name, options) VALUES (?, ?)', [key, valStr], (err) => {
            if(err) reject(err);
            resolve();
        });
    });
}
