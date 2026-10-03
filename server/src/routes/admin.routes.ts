import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { db, dbPath } from '../database/db.js';
import { requireAdminAuth, loginRateLimiter, resetLoginAttempts, getJwtSecret, AuthenticatedRequest } from '../middleware/auth.js';

export const adminRouter = Router();

const upload = multer({ dest: path.resolve(process.cwd(), 'uploads_temp') });

// Admin Login
adminRouter.post('/login', loginRateLimiter, (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  const storedUsernameRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('admin_username') as { value: string } | undefined;
  const storedHashRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('admin_password_hash') as { value: string } | undefined;

  const validUsername = storedUsernameRow?.value || 'admin';
  const validHash = storedHashRow?.value;

  if (username !== validUsername || !validHash) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const match = bcrypt.compareSync(password, validHash);
  if (!match) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  resetLoginAttempts(clientIp);

  const token = jwt.sign({ username }, getJwtSecret(), { expiresIn: '7d' });

  db.prepare('INSERT INTO audit_logs (action, details) VALUES (?, ?)').run('ADMIN_LOGIN', `Admin logged in from IP ${clientIp}`);

  res.json({
    success: true,
    token,
    user: { username }
  });
});

// Verify token
adminRouter.get('/verify', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true, user: req.adminUser });
});

// Change Password
adminRouter.post('/change-password', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'Current password and new password are required' });
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({ error: 'New password must be at least 6 characters long' });
    return;
  }

  const storedHashRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('admin_password_hash') as { value: string } | undefined;
  if (!storedHashRow) {
    res.status(500).json({ error: 'Password hash not initialized' });
    return;
  }

  const matches = bcrypt.compareSync(currentPassword, storedHashRow.value);
  if (!matches) {
    res.status(401).json({ error: 'Current password is incorrect' });
    return;
  }

  const salt = bcrypt.genSaltSync(10);
  const newHash = bcrypt.hashSync(newPassword, salt);
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('admin_password_hash', newHash);

  db.prepare('INSERT INTO audit_logs (action, details) VALUES (?, ?)').run('PASSWORD_CHANGE', 'Admin password updated');

  res.json({ success: true, message: 'Password changed successfully' });
});

// Change Username
adminRouter.post('/change-username', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { newUsername, currentPassword } = req.body;
    if (!newUsername || !currentPassword) {
      res.status(400).json({ error: 'New username and current password are required' });
      return;
    }

    const cleanUsername = String(newUsername).trim();
    if (cleanUsername.length < 3) {
      res.status(400).json({ error: 'New username must be at least 3 characters long' });
      return;
    }

    if (!/^[a-zA-Z0-9_.-]+$/.test(cleanUsername)) {
      res.status(400).json({ error: 'Username can only contain letters, numbers, underscores, dots, and hyphens' });
      return;
    }

    const storedHashRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('admin_password_hash') as { value: string } | undefined;
    if (!storedHashRow) {
      res.status(500).json({ error: 'Password hash not initialized' });
      return;
    }

    const matches = bcrypt.compareSync(currentPassword, storedHashRow.value);
    if (!matches) {
      res.status(401).json({ error: 'Current password is incorrect' });
      return;
    }

    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('admin_username', cleanUsername);
    db.prepare('INSERT INTO audit_logs (action, details) VALUES (?, ?)').run(
      'USERNAME_CHANGE',
      `Admin username changed to "${cleanUsername}"`
    );

    const token = jwt.sign({ username: cleanUsername }, getJwtSecret(), { expiresIn: '7d' });

    res.json({
      success: true,
      message: `Admin username changed to "${cleanUsername}" successfully`,
      username: cleanUsername,
      token
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Add Menu Item
adminRouter.post('/items', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, categoryId, subcategory, price, type, availability, description, imageUrl, displayOrder } = req.body;

    if (!name || !categoryId || price === undefined || !type) {
      res.status(400).json({ error: 'Name, Category, Price, and Type are required' });
      return;
    }

    const catRow = db.prepare('SELECT name FROM categories WHERE id = ?').get(categoryId) as { name: string } | undefined;
    if (!catRow) {
      res.status(400).json({ error: 'Specified category does not exist' });
      return;
    }

    const id = req.body.id || `${categoryId}-${Date.now()}`;
    const parsedPrice = parseInt(price, 10);
    const parsedAvailability = availability === false ? 0 : 1;
    const parsedOrder = displayOrder ? parseInt(displayOrder, 10) : 0;

    db.prepare(`
      INSERT INTO menu_items (
        id, name, original_name, category_id, category_name, subcategory,
        price, type, availability, description, image_url, display_order, needs_verification, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
    `).run(
      id,
      name.trim(),
      name.trim(),
      categoryId,
      catRow.name,
      subcategory ? subcategory.trim() : '',
      parsedPrice,
      type,
      parsedAvailability,
      description ? description.trim() : '',
      imageUrl || '',
      parsedOrder
    );

    db.prepare('INSERT INTO audit_logs (action, details) VALUES (?, ?)').run('ITEM_CREATED', `Added item ${name} (ID: ${id})`);

    res.json({ success: true, id, message: 'Item created successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Menu Item
adminRouter.put('/items/:id', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, categoryId, subcategory, price, type, availability, description, imageUrl, displayOrder, needsVerification } = req.body;

    const existing = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(id) as any;
    if (!existing) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    let categoryName = existing.category_name;
    if (categoryId && categoryId !== existing.category_id) {
      const catRow = db.prepare('SELECT name FROM categories WHERE id = ?').get(categoryId) as { name: string } | undefined;
      if (catRow) categoryName = catRow.name;
    }

    db.prepare(`
      UPDATE menu_items SET
        name = ?,
        category_id = ?,
        category_name = ?,
        subcategory = ?,
        price = ?,
        type = ?,
        availability = ?,
        description = ?,
        image_url = ?,
        display_order = ?,
        needs_verification = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name !== undefined ? name.trim() : existing.name,
      categoryId !== undefined ? categoryId : existing.category_id,
      categoryName,
      subcategory !== undefined ? subcategory.trim() : existing.subcategory,
      price !== undefined ? parseInt(price, 10) : existing.price,
      type !== undefined ? type : existing.type,
      availability !== undefined ? (availability ? 1 : 0) : existing.availability,
      description !== undefined ? description.trim() : existing.description,
      imageUrl !== undefined ? imageUrl : existing.image_url,
      displayOrder !== undefined ? parseInt(displayOrder, 10) : existing.display_order,
      needsVerification !== undefined ? (needsVerification ? 1 : 0) : existing.needs_verification,
      id
    );

    db.prepare('INSERT INTO audit_logs (action, details) VALUES (?, ?)').run('ITEM_UPDATED', `Updated item ID: ${id}`);

    res.json({ success: true, message: 'Item updated successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Fast Toggle Availability
adminRouter.patch('/items/:id/availability', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { availability } = req.body;
    const availInt = availability ? 1 : 0;

    const result = db.prepare('UPDATE menu_items SET availability = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(availInt, id);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    db.prepare('INSERT INTO audit_logs (action, details) VALUES (?, ?)').run('ITEM_AVAILABILITY_CHANGED', `Item ${id} set to ${availInt}`);
    res.json({ success: true, availability: Boolean(availInt) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk Toggle Availability for Selected Items
adminRouter.patch('/items/bulk/availability', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { itemIds, availability } = req.body;
    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      res.status(400).json({ error: 'itemIds array is required' });
      return;
    }

    const availInt = availability ? 1 : 0;
    const placeholders = itemIds.map(() => '?').join(',');
    const stmt = db.prepare(`UPDATE menu_items SET availability = ?, updated_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`);
    const result = stmt.run(availInt, ...itemIds);

    db.prepare('INSERT INTO audit_logs (action, details) VALUES (?, ?)').run(
      'BULK_ITEM_AVAILABILITY_CHANGED',
      `Set ${result.changes} items to ${availInt}`
    );

    res.json({
      success: true,
      availability: Boolean(availInt),
      updatedCount: result.changes,
      message: `Updated ${result.changes} items to ${availInt ? 'Available' : 'Unavailable'}`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk Toggle Availability for Entire Category
adminRouter.patch('/categories/:id/availability', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { availability } = req.body;
    const availInt = availability ? 1 : 0;

    const catRow = db.prepare('SELECT name FROM categories WHERE id = ?').get(id) as { name: string } | undefined;
    if (!catRow) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    const result = db.prepare(
      'UPDATE menu_items SET availability = ?, updated_at = CURRENT_TIMESTAMP WHERE category_id = ?'
    ).run(availInt, id);

    db.prepare('INSERT INTO audit_logs (action, details) VALUES (?, ?)').run(
      'CATEGORY_AVAILABILITY_CHANGED',
      `Set all items in "${catRow.name}" (${id}) to ${availInt} (${result.changes} items affected)`
    );

    res.json({
      success: true,
      categoryId: id,
      categoryName: catRow.name,
      availability: Boolean(availInt),
      updatedCount: result.changes,
      message: `Turned ${availInt ? 'ON' : 'OFF'} all ${result.changes} dishes in ${catRow.name}`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Menu Item
adminRouter.delete('/items/:id', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT name FROM menu_items WHERE id = ?').get(id) as { name: string } | undefined;
    if (!existing) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    db.prepare('DELETE FROM menu_items WHERE id = ?').run(id);
    db.prepare('INSERT INTO audit_logs (action, details) VALUES (?, ?)').run('ITEM_DELETED', `Deleted item ${existing.name} (ID: ${id})`);

    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Category Management
adminRouter.post('/categories', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id, name, icon, displayOrder } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Category name is required' });
      return;
    }

    const catId = id ? id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-') : name.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const order = displayOrder !== undefined ? parseInt(displayOrder, 10) : 99;

    db.prepare(`
      INSERT INTO categories (id, name, icon, display_order)
      VALUES (?, ?, ?, ?)
    `).run(catId, name.trim(), icon || 'Utensils', order);

    db.prepare('INSERT INTO audit_logs (action, details) VALUES (?, ?)').run('CATEGORY_CREATED', `Created category ${name} (${catId})`);
    res.json({ success: true, id: catId, message: 'Category created' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.put('/categories/:id', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, icon, displayOrder } = req.body;

    const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as any;
    if (!existing) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    db.prepare(`
      UPDATE categories SET
        name = ?,
        icon = ?,
        display_order = ?
      WHERE id = ?
    `).run(
      name !== undefined ? name.trim() : existing.name,
      icon !== undefined ? icon : existing.icon,
      displayOrder !== undefined ? parseInt(displayOrder, 10) : existing.display_order,
      id
    );

    // If name changed, update category_name on menu_items
    if (name && name.trim() !== existing.name) {
      db.prepare('UPDATE menu_items SET category_name = ? WHERE category_id = ?').run(name.trim(), id);
    }

    db.prepare('INSERT INTO audit_logs (action, details) VALUES (?, ?)').run('CATEGORY_UPDATED', `Updated category ${id}`);
    res.json({ success: true, message: 'Category updated' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.delete('/categories/:id', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT name FROM categories WHERE id = ?').get(id) as { name: string } | undefined;
    if (!existing) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    // Count items in category
    const itemCount = db.prepare('SELECT COUNT(*) as count FROM menu_items WHERE category_id = ?').get(id) as { count: number };
    db.prepare('DELETE FROM menu_items WHERE category_id = ?').run(id);
    db.prepare('DELETE FROM categories WHERE id = ?').run(id);

    db.prepare('INSERT INTO audit_logs (action, details) VALUES (?, ?)').run(
      'CATEGORY_DELETED',
      `Deleted category ${existing.name} along with ${itemCount.count} items`
    );

    res.json({ success: true, message: `Category and ${itemCount.count} items deleted` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// JSON Export
adminRouter.get('/export', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const categories = db.prepare('SELECT * FROM categories ORDER BY display_order ASC').all();
    const items = db.prepare('SELECT * FROM menu_items ORDER BY display_order ASC').all();
    const restaurantSetting = db.prepare('SELECT value FROM settings WHERE key = ?').get('restaurant_info') as { value: string } | undefined;

    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      restaurant: restaurantSetting ? JSON.parse(restaurantSetting.value) : {},
      categories,
      items
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=sree-mk-menu-export-${Date.now()}.json`);
    res.send(JSON.stringify(exportData, null, 2));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// JSON Import & Validation
adminRouter.post('/import', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = req.body;
    if (!data || !Array.isArray(data.categories) || !Array.isArray(data.items)) {
      res.status(400).json({ error: 'Invalid JSON format: must contain categories and items arrays' });
      return;
    }

    // Save current backup copy before overwriting
    db.exec('BEGIN TRANSACTION;');
    try {
      db.prepare('DELETE FROM menu_items').run();
      db.prepare('DELETE FROM categories').run();

      const insertCat = db.prepare('INSERT INTO categories (id, name, icon, display_order) VALUES (?, ?, ?, ?)');
      for (const cat of data.categories) {
        insertCat.run(cat.id, cat.name, cat.icon || 'Utensils', cat.display_order || cat.order || 0);
      }

      const insertItem = db.prepare(`
        INSERT INTO menu_items (
          id, name, original_name, category_id, category_name, subcategory,
          price, type, availability, description, image_url, display_order, source_card, needs_verification
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of data.items) {
        insertItem.run(
          item.id,
          item.name,
          item.original_name || item.name,
          item.category_id || item.categoryId,
          item.category_name || item.category,
          item.subcategory || '',
          parseInt(item.price, 10),
          item.type || 'veg',
          item.availability === 0 || item.availability === false ? 0 : 1,
          item.description || '',
          item.image_url || item.imageUrl || '',
          item.display_order || item.displayOrder || 0,
          item.source_card || item.sourceCard || '',
          item.needs_verification || item.needsVerification ? 1 : 0
        );
      }

      if (data.restaurant) {
        db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('restaurant_info', JSON.stringify(data.restaurant));
      }

      db.exec('COMMIT;');
      db.prepare('INSERT INTO audit_logs (action, details) VALUES (?, ?)').run('MENU_IMPORTED', `Imported ${data.items.length} items from JSON`);

      res.json({ success: true, count: data.items.length, message: `Successfully imported ${data.items.length} items` });
    } catch (importErr: any) {
      db.exec('ROLLBACK;');
      throw importErr;
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Database Download (Backup)
adminRouter.get('/backup-db', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!fs.existsSync(dbPath)) {
      res.status(404).json({ error: 'Database file not found' });
      return;
    }
    res.download(dbPath, `sree_mk_menu_backup_${Date.now()}.db`);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Settings Get and Update
adminRouter.get('/settings', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const settingsRows = db.prepare('SELECT key, value FROM settings WHERE key != "admin_password_hash" AND key != "jwt_secret"').all();
    const settingsMap: Record<string, any> = {};
    for (const row of settingsRows as any[]) {
      try {
        settingsMap[row.key] = JSON.parse(row.value);
      } catch (e) {
        settingsMap[row.key] = row.value;
      }
    }
    res.json({ success: true, settings: settingsMap });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.put('/settings', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { restaurant, preferredIp } = req.body;
    if (restaurant) {
      db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('restaurant_info', JSON.stringify(restaurant));
    }
    if (preferredIp !== undefined) {
      db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('preferred_ip', preferredIp);
    }
    db.prepare('INSERT INTO audit_logs (action, details) VALUES (?, ?)').run('SETTINGS_UPDATED', 'Updated restaurant settings');
    res.json({ success: true, message: 'Settings saved' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
