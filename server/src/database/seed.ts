import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'node:url';
import { db, initDatabase } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function seedMenuData(force = false) {
  initDatabase();

  const countRow = db.prepare('SELECT COUNT(*) as count FROM menu_items').get() as { count: number };
  if (countRow.count > 0 && !force) {
    console.log(`Database already contains ${countRow.count} items. Skipping seed. (Use force to overwrite)`);
    return;
  }

  const jsonPath = path.resolve(__dirname, '../../../menu-data/initial-menu.json');
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Seed file not found at ${jsonPath}`);
  }

  const rawData = fs.readFileSync(jsonPath, 'utf8');
  const data = JSON.parse(rawData);

  // Default admin credentials if not set
  const adminCheck = db.prepare('SELECT value FROM settings WHERE key = ?').get('admin_password_hash') as { value: string } | undefined;
  const adminUsername = process.env.ADMIN_USERNAME || 'SREE_MK';
  const adminPassword = process.env.ADMIN_PASSWORD || 'SREEMK@143';

  if (!adminCheck || force) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(adminPassword, salt);
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('admin_password_hash', hash);
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('admin_username', adminUsername);
    console.log(`Default admin initialized: username: ${adminUsername} / password: ${adminPassword}`);
  }

  // Restaurant details
  if (data.restaurant) {
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('restaurant_info', JSON.stringify(data.restaurant));
  }

  // Seed categories
  if (force) {
    db.prepare('DELETE FROM menu_items').run();
    db.prepare('DELETE FROM categories').run();
  }

  const insertCategory = db.prepare(`
    INSERT OR REPLACE INTO categories (id, name, icon, display_order)
    VALUES (?, ?, ?, ?)
  `);

  for (const cat of data.categories) {
    insertCategory.run(cat.id, cat.name, cat.icon || 'Utensils', cat.order || 0);
  }

  const insertItem = db.prepare(`
    INSERT OR REPLACE INTO menu_items (
      id, name, original_name, category_id, category_name, subcategory,
      price, type, availability, description, image_url, display_order, source_card, needs_verification
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const item of data.items) {
    insertItem.run(
      item.id,
      item.name,
      item.originalName || item.name,
      item.categoryId,
      item.category,
      item.subcategory || '',
      item.price,
      item.type,
      item.availability !== false ? 1 : 0,
      item.description || '',
      item.imageUrl || item.image || '',
      item.displayOrder || 0,
      item.sourceCard || '',
      item.needsVerification ? 1 : 0
    );
  }

  console.log(`Successfully seeded ${data.categories.length} categories and ${data.items.length} menu items into SQLite.`);
}

// When executed directly
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  seedMenuData(process.argv.includes('--force'));
}
