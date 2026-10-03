import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const dbPath = path.join(dataDir, 'sree_mk_menu.db');
export const db = new DatabaseSync(dbPath);

// Initialize tables
export function initDatabase() {
  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT DEFAULT 'Utensils',
      display_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS menu_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      original_name TEXT,
      category_id TEXT NOT NULL,
      category_name TEXT NOT NULL,
      subcategory TEXT,
      price INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('veg', 'non-veg', 'egg')),
      availability INTEGER DEFAULT 1,
      description TEXT,
      image_url TEXT,
      display_order INTEGER DEFAULT 0,
      source_card TEXT,
      needs_verification INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(category_id) REFERENCES categories(id) ON UPDATE CASCADE ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_items_cat ON menu_items(category_id);
    CREATE INDEX IF NOT EXISTS idx_items_type ON menu_items(type);
    CREATE INDEX IF NOT EXISTS idx_items_avail ON menu_items(availability);
  `);
}
