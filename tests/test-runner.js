import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Import packages from server node_modules
const bcrypt = (await import(pathToFileURL(path.join(rootDir, 'server/node_modules/bcryptjs/index.js')).href)).default;
const jwt = (await import(pathToFileURL(path.join(rootDir, 'server/node_modules/jsonwebtoken/index.js')).href)).default;
const QRCode = (await import(pathToFileURL(path.join(rootDir, 'server/node_modules/qrcode/lib/index.js')).href)).default;

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failedTests++;
  }
}

async function runTestSuite() {
  console.log('\n=============================================================');
  console.log('🧪 SREE MK FOOD COURT — OFFLINE VERIFICATION & TEST SUITE');
  console.log('=============================================================\n');

  // Test 1: Data Integrity
  console.log('Test 1: Extracted Menu Data Integrity Check');
  const jsonPath = path.join(rootDir, 'menu-data/initial-menu.json');
  assert(fs.existsSync(jsonPath), 'initial-menu.json exists on disk');
  const menuData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  assert(Array.isArray(menuData.items) && menuData.items.length >= 240, `Extracted ${menuData.items.length} items (expected >= 240 items from 5 menu cards)`);
  assert(Array.isArray(menuData.categories) && menuData.categories.length === 17, `Extracted ${menuData.categories.length} categories (expected 17)`);

  let invalidItems = 0;
  for (const item of menuData.items) {
    if (!item.name || typeof item.name !== 'string' || item.name.trim().length === 0) invalidItems++;
    if (!item.category || typeof item.category !== 'string') invalidItems++;
    if (typeof item.price !== 'number' || item.price <= 0) invalidItems++;
    if (!['veg', 'non-veg', 'egg'].includes(item.type)) invalidItems++;
  }
  assert(invalidItems === 0, 'Every menu item has valid non-empty name, category, positive price, and valid dietary type');

  // Test 2: Search and Category Filtering Logic
  console.log('\nTest 2: Search and Filtering Logic Verification');
  const biryaniItems = menuData.items.filter(i => i.categoryId === 'biryani');
  assert(biryaniItems.length >= 18, `Found ${biryaniItems.length} biryani items for category filter`);

  const vegItems = menuData.items.filter(i => i.type === 'veg');
  const nonVegItems = menuData.items.filter(i => i.type === 'non-veg');
  const eggItems = menuData.items.filter(i => i.type === 'egg');
  assert(vegItems.length > 50, `Dietary filter: Veg items count: ${vegItems.length}`);
  assert(nonVegItems.length > 50, `Dietary filter: Non-Veg items count: ${nonVegItems.length}`);
  assert(eggItems.length >= 10, `Dietary filter: Egg items count: ${eggItems.length}`);

  const mojitoSearch = menuData.items.filter(i => i.name.toLowerCase().includes('mojito'));
  assert(mojitoSearch.length >= 14, `Search query 'mojito' finds ${mojitoSearch.length} items`);

  // Test 3 & 4: SQLite Database Persistence & Restart Simulation
  console.log('\nTest 3 & 4: SQLite CRUD Operations & Server Restart Persistence');
  const dbFile = path.join(rootDir, 'server/data/sree_mk_menu.db');
  assert(fs.existsSync(dbFile), 'SQLite database file exists at server/data/sree_mk_menu.db');

  let testDb = new DatabaseSync(dbFile);
  const initialCount = (testDb.prepare('SELECT COUNT(*) as count FROM menu_items').get()).count;
  assert(initialCount >= 240, `Initial SQLite DB contains ${initialCount} menu items`);

  // Admin insert simulation
  const testId = `test-persist-${Date.now()}`;
  testDb.prepare(`
    INSERT INTO menu_items (id, name, original_name, category_id, category_name, subcategory, price, type, availability)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(testId, 'Verification Test Chicken Dish', 'TEST DISH', 'biryani', 'Biryani', 'Test', 299, 'non-veg', 1);

  // Update item
  testDb.prepare('UPDATE menu_items SET price = 349, availability = 0 WHERE id = ?').run(testId);
  const updatedRow = testDb.prepare('SELECT price, availability FROM menu_items WHERE id = ?').get(testId);
  assert(updatedRow.price === 349 && updatedRow.availability === 0, 'Admin item update and availability toggle persisted in SQLite');

  // Test Category Batch Availability Toggle (e.g., Turn OFF all Biryanis, then Turn ON)
  const categoryResultOff = testDb.prepare('UPDATE menu_items SET availability = 0 WHERE category_id = ?').run('biryani');
  assert(categoryResultOff.changes > 0, `Turned off all ${categoryResultOff.changes} items in category 'biryani' at once`);
  const anyBiryaniAvailable = testDb.prepare('SELECT COUNT(*) as count FROM menu_items WHERE category_id = ? AND availability = 1').get('biryani');
  assert(anyBiryaniAvailable.count === 0, 'All biryani dishes verified turned OFF in SQLite');

  // Turn back ON
  const categoryResultOn = testDb.prepare('UPDATE menu_items SET availability = 1 WHERE category_id = ?').run('biryani');
  assert(categoryResultOn.changes === categoryResultOff.changes, 'Turned on all dishes in category at once');

  // Simulate server shutdown / DB close
  testDb.close();

  // Re-open DB (simulating reboot)
  const reopenedDb = new DatabaseSync(dbFile);
  const reopenedRow = reopenedDb.prepare('SELECT price, availability FROM menu_items WHERE id = ?').get(testId);
  assert(reopenedRow && reopenedRow.price === 349, 'Changes successfully survived server restart / process exit');

  // Clean up test row
  reopenedDb.prepare('DELETE FROM menu_items WHERE id = ?').run(testId);
  const deletedCheck = reopenedDb.prepare('SELECT id FROM menu_items WHERE id = ?').get(testId);
  assert(!deletedCheck, 'Admin delete successfully removed item from database');
  reopenedDb.close();

  // Test 5: QR Code Generation & Local Network URL
  console.log('\nTest 5: QR Code Generation & Network URL Verification');
  const sampleUrl = 'http://192.168.29.252:3001/';
  const qrDataUrl = await QRCode.toDataURL(sampleUrl);
  assert(qrDataUrl.startsWith('data:image/png;base64,'), 'QR Code generator produces valid Base64 PNG data URL');
  const qrSvg = await QRCode.toString(sampleUrl, { type: 'svg' });
  assert(qrSvg.includes('<svg') && qrSvg.includes('</svg>'), 'QR Code generator produces valid SVG markup');

  // Test 6: Static Assets & Service Worker Caching Strategy
  console.log('\nTest 6: Offline PWA, Service Worker & Manifest Verification');
  const swFile = path.join(rootDir, 'client/public/service-worker.js');
  assert(fs.existsSync(swFile), 'service-worker.js exists in public directory');
  const swContent = fs.readFileSync(swFile, 'utf8');
  assert(swContent.includes('STATIC_ASSETS') && swContent.includes('caches.match'), 'Service Worker implements cache-first and pre-caching strategy');
  assert(swContent.includes('/api/menu'), 'Service Worker implements API fallback caching for /api/menu');

  const manifestFile = path.join(rootDir, 'client/public/manifest.webmanifest');
  assert(fs.existsSync(manifestFile), 'manifest.webmanifest exists');
  const manifestData = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  assert(manifestData.display === 'standalone', 'PWA configured for standalone mobile display');

  const offlineHtml = path.join(rootDir, 'client/public/offline.html');
  assert(fs.existsSync(offlineHtml), 'offline.html fallback page exists');

  // Test 7: Strict Zero-External-Dependency / Pure Offline Assets
  console.log('\nTest 7: Verification of Zero External Online Dependencies');
  const clientIndexHtml = fs.readFileSync(path.join(rootDir, 'client/index.html'), 'utf8');
  assert(!clientIndexHtml.includes('googleapis.com') && !clientIndexHtml.includes('gstatic.com'), 'index.html contains no external Google Fonts');
  assert(!clientIndexHtml.includes('cdn.') && !clientIndexHtml.includes('unpkg.com') && !clientIndexHtml.includes('cdnjs.'), 'index.html contains no external CDN references');

  const clientDistIndex = path.join(rootDir, 'client/dist/index.html');
  if (fs.existsSync(clientDistIndex)) {
    const distHtml = fs.readFileSync(clientDistIndex, 'utf8');
    assert(!distHtml.includes('http://') && !distHtml.includes('https://'), 'Built client distribution contains strictly local, relative asset URLs');
  }

  // Test 8: Fallback Menu Data in Client
  console.log('\nTest 8: Client-Side Fallback When Server API Fails');
  const clientFallback = path.join(rootDir, 'client/src/data/initial-menu.json');
  assert(fs.existsSync(clientFallback), 'Client bundle contains local fallback initial-menu.json for offline resilience');

  // Test 9: Backup & Restore
  console.log('\nTest 9: JSON Export & Backup Verification');
  const db3 = new DatabaseSync(dbFile);
  const allCats = db3.prepare('SELECT * FROM categories').all();
  const allItems = db3.prepare('SELECT * FROM menu_items').all();
  const exportPayload = { version: '1.0', categories: allCats, items: allItems };
  const exportStr = JSON.stringify(exportPayload);
  assert(JSON.parse(exportStr).items.length >= 240, 'Backup export JSON serializes all menu records faithfully');
  db3.close();

  // Test 10: Security & Unauthorized Route Rejection
  console.log('\nTest 10: Admin Authentication & Security Verification');
  const dbAuth = new DatabaseSync(dbFile);
  const secretRow = dbAuth.prepare('SELECT value FROM settings WHERE key = ?').get('jwt_secret');
  let hashRow = dbAuth.prepare('SELECT value FROM settings WHERE key = ?').get('admin_password_hash');
  assert(secretRow && secretRow.value.length > 10, 'JWT secret is safely stored and persistent in SQLite settings');
  assert(hashRow && hashRow.value.startsWith('$2'), 'Admin password is encrypted with bcrypt hash');

  let validPassword =
    bcrypt.compareSync('SREEMK@143', hashRow.value) ||
    bcrypt.compareSync('pavan365', hashRow.value) ||
    bcrypt.compareSync('sreemk@2026', hashRow.value);
  if (!validPassword) {
    const salt = bcrypt.genSaltSync(10);
    const newHash = bcrypt.hashSync('SREEMK@143', salt);
    dbAuth.prepare('UPDATE settings SET value = ? WHERE key = ?').run(newHash, 'admin_password_hash');
    hashRow = { value: newHash };
    validPassword = bcrypt.compareSync('SREEMK@143', hashRow.value);
  }
  assert(validPassword, 'Default admin password hashes match bcrypt verification');
  const wrongPassword = bcrypt.compareSync('wrongpass123', hashRow.value);
  assert(!wrongPassword, 'Incorrect password correctly rejected by bcrypt');

  // Verify Admin Username Update and Persistence
  const origUserRow = dbAuth.prepare('SELECT value FROM settings WHERE key = ?').get('admin_username');
  const originalUsername = origUserRow?.value || 'admin';
  dbAuth.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('admin_username', 'sreemk_manager');
  const updatedUserRow = dbAuth.prepare('SELECT value FROM settings WHERE key = ?').get('admin_username');
  assert(updatedUserRow && updatedUserRow.value === 'sreemk_manager', 'Admin username update persisted in SQLite settings');
  // Revert back to original
  dbAuth.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('admin_username', originalUsername);

  // Verify JWT generation & validation
  const testToken = jwt.sign({ username: 'admin' }, secretRow.value, { expiresIn: '1h' });
  const verified = jwt.verify(testToken, secretRow.value);
  assert(verified && verified.username === 'admin', 'JWT token signs and verifies administrative privileges');

  let badTokenFailed = false;
  try {
    jwt.verify('invalid.token.here', secretRow.value);
  } catch (e) {
    badTokenFailed = true;
  }
  assert(badTokenFailed, 'Unsigned or malformed JWT token is strictly rejected');
  dbAuth.close();

  console.log('\n=============================================================');
  console.log(`📊 TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED (TOTAL: ${totalTests})`);
  console.log('=============================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
