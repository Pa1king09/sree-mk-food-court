import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPath = path.resolve(__dirname, '../menu-data/initial-menu.json');
const outputPath = path.resolve(__dirname, '../supabase/seed.sql');

const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

function escapeSql(str) {
  if (str === null || str === undefined) return "''";
  return `'${String(str).replace(/'/g, "''")}'`;
}

let sql = `-- ==============================================================================
-- SREE MK FOOD COURT — VERIFIED MENU SEED DATA FOR SUPABASE
-- Extracted from 5 physical menu cards (240 verified items, 17 categories)
-- ==============================================================================

-- 1. Restaurant Settings
INSERT INTO public.restaurant_settings (key, value)
VALUES ('restaurant_info', ${escapeSql(JSON.stringify(data.restaurant))}::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 2. Categories (${data.categories.length} categories)
INSERT INTO public.categories (id, name, icon, display_order)
VALUES
`;

const catRows = data.categories.map((c, i) => {
  return `  (${escapeSql(c.id)}, ${escapeSql(c.name)}, ${escapeSql(c.icon || 'Utensils')}, ${c.order || i})`;
});

sql += catRows.join(',\n') + '\n';
sql += `ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  display_order = EXCLUDED.display_order;

-- 3. Menu Items (${data.items.length} verified items)
INSERT INTO public.menu_items (
  id, name, original_name, category_id, category_name, subcategory,
  price, type, availability, description, image_url, display_order, source_card, needs_verification
)
VALUES
`;

const itemRows = data.items.map((item, idx) => {
  return `  (${escapeSql(item.id)}, ${escapeSql(item.name)}, ${escapeSql(item.originalName || item.name)}, ${escapeSql(item.categoryId)}, ${escapeSql(item.category)}, ${escapeSql(item.subcategory || '')}, ${item.price}, ${escapeSql(item.type)}, ${item.availability !== false ? 'true' : 'false'}, ${escapeSql(item.description || '')}, ${escapeSql(item.imageUrl || item.image || '')}, ${item.displayOrder || idx}, ${escapeSql(item.sourceCard || '')}, ${item.needsVerification ? 'true' : 'false'})`;
});

sql += itemRows.join(',\n') + '\n';
sql += `ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  original_name = EXCLUDED.original_name,
  category_id = EXCLUDED.category_id,
  category_name = EXCLUDED.category_name,
  subcategory = EXCLUDED.subcategory,
  price = EXCLUDED.price,
  type = EXCLUDED.type,
  availability = EXCLUDED.availability,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  display_order = EXCLUDED.display_order,
  source_card = EXCLUDED.source_card,
  needs_verification = EXCLUDED.needs_verification;
`;

fs.writeFileSync(outputPath, sql, 'utf8');
console.log(`Generated ${outputPath} with ${data.categories.length} categories and ${data.items.length} items.`);
