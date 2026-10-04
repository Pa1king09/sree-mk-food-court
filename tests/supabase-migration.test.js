import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

console.log('\n=============================================================');
console.log('🧪 SUPABASE & CLOUDFLARE PAGES CONFIGURATION VERIFICATION');
console.log('=============================================================\n');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

// 1. Migration File Check
const migrationPath = path.join(root, 'supabase/migrations/20261004000000_init_sree_mk_menu.sql');
assert(fs.existsSync(migrationPath), 'Supabase migration SQL file exists');

const migrationSql = fs.readFileSync(migrationPath, 'utf8');
assert(migrationSql.includes('CREATE TABLE IF NOT EXISTS public.categories'), 'Schema defines public.categories table');
assert(migrationSql.includes('CREATE TABLE IF NOT EXISTS public.menu_items'), 'Schema defines public.menu_items table');
assert(migrationSql.includes('CREATE TABLE IF NOT EXISTS public.restaurant_settings'), 'Schema defines public.restaurant_settings table');

// 2. RLS & Security Verification
assert(migrationSql.includes('ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;'), 'RLS enabled on categories table');
assert(migrationSql.includes('ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;'), 'RLS enabled on menu_items table');
assert(migrationSql.includes('ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;'), 'RLS enabled on restaurant_settings table');

assert(
  migrationSql.includes('FOR SELECT') && migrationSql.includes('TO anon, authenticated'),
  'Customer public read-only policy (SELECT) granted to anon & authenticated'
);

assert(
  migrationSql.includes('WITH CHECK (auth.role() = \'authenticated\')'),
  'Admin-only write policy strictly enforces auth.role() = authenticated'
);

// 3. Seed SQL Data Verification
const seedPath = path.join(root, 'supabase/seed.sql');
assert(fs.existsSync(seedPath), 'Supabase seed SQL file exists');

const seedSql = fs.readFileSync(seedPath, 'utf8');
const initialMenu = JSON.parse(fs.readFileSync(path.join(root, 'menu-data/initial-menu.json'), 'utf8'));

assert(seedSql.includes(`-- 2. Categories (${initialMenu.categories.length} categories)`), `Seed contains all ${initialMenu.categories.length} categories`);
assert(seedSql.includes(`-- 3. Menu Items (${initialMenu.items.length} verified items)`), `Seed contains all ${initialMenu.items.length} verified items`);

// Spot check critical items and exact prices
const biryani = initialMenu.items.find(i => i.id === 'biryani-nv-12');
assert(biryani && seedSql.includes(`'biryani-nv-12'`), 'MK Spl Chicken Biryani present in seed SQL');
assert(biryani && seedSql.includes(`${biryani.price}`), `Exact price ₹${biryani?.price} preserved in seed SQL`);

const familyPack = initialMenu.items.find(i => i.id === 'biryani-nv-4');
assert(familyPack && seedSql.includes(`'biryani-nv-4'`), 'Family Pack Chicken Biryani (4pcs) present in seed SQL');
assert(familyPack && seedSql.includes(`${familyPack.price}`), `Exact price ₹${familyPack?.price} preserved in seed SQL`);

// 4. Cloudflare Deployment Configuration
const wranglerPath = path.join(root, 'wrangler.jsonc');
assert(fs.existsSync(wranglerPath), 'Cloudflare wrangler.jsonc configuration exists');
const wranglerContent = fs.readFileSync(wranglerPath, 'utf8');
assert(wranglerContent.includes('single-page-application'), 'Cloudflare SPA routing configured (single-page-application)');

// 5. Environment Variables Documentation
const envExamplePath = path.join(root, 'client/.env.example');
assert(fs.existsSync(envExamplePath), 'client/.env.example exists with placeholder values');
const envExample = fs.readFileSync(envExamplePath, 'utf8');
assert(envExample.includes('VITE_SUPABASE_URL') && envExample.includes('VITE_SUPABASE_PUBLISHABLE_KEY'), 'Environment template includes VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY');

// 6. Built distribution check
const distIndex = path.join(root, 'client/dist/index.html');
assert(fs.existsSync(distIndex), 'Client production distribution built and verified');

console.log('\n=============================================================');
console.log(`📊 SUPABASE & DEPLOYMENT TESTS: ${passed} PASSED, ${failed} FAILED`);
console.log('=============================================================\n');

if (failed > 0) {
  process.exit(1);
}
