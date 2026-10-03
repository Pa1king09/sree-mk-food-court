-- ==============================================================================
-- SREE MK FOOD COURT — SUPABASE POSTGRESQL SCHEMA & ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- 1. Helper function for automated updated_at timestamps
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'Utensils',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Menu Items Table
CREATE TABLE IF NOT EXISTS public.menu_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  original_name TEXT,
  category_id TEXT NOT NULL REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE CASCADE,
  category_name TEXT NOT NULL,
  subcategory TEXT DEFAULT '',
  price NUMERIC NOT NULL CHECK (price >= 0),
  type TEXT NOT NULL CHECK (type IN ('veg', 'non-veg', 'egg')),
  availability BOOLEAN NOT NULL DEFAULT true,
  description TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0,
  source_card TEXT DEFAULT '',
  needs_verification BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Restaurant Settings Table (Store restaurant info, branding, notice, etc.)
CREATE TABLE IF NOT EXISTS public.restaurant_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON public.menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_type ON public.menu_items(type);
CREATE INDEX IF NOT EXISTS idx_menu_items_availability ON public.menu_items(availability);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON public.categories(display_order);

-- 6. Trigger Bindings for updated_at
DROP TRIGGER IF EXISTS trigger_set_updated_at_categories ON public.categories;
CREATE TRIGGER trigger_set_updated_at_categories
BEFORE UPDATE ON public.categories
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trigger_set_updated_at_menu_items ON public.menu_items;
CREATE TRIGGER trigger_set_updated_at_menu_items
BEFORE UPDATE ON public.menu_items
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trigger_set_updated_at_settings ON public.restaurant_settings;
CREATE TRIGGER trigger_set_updated_at_settings
BEFORE UPDATE ON public.restaurant_settings
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all exposed tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- Policy 1: Customer Public Read-Only Access (SELECT)
-- Allows any visitor (anonymous or authenticated) to read menu items, categories, and settings
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public customer read-only for categories" ON public.categories;
CREATE POLICY "Public customer read-only for categories"
ON public.categories
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Public customer read-only for menu_items" ON public.menu_items;
CREATE POLICY "Public customer read-only for menu_items"
ON public.menu_items
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Public customer read-only for restaurant_settings" ON public.restaurant_settings;
CREATE POLICY "Public customer read-only for restaurant_settings"
ON public.restaurant_settings
FOR SELECT
TO anon, authenticated
USING (true);

-- ------------------------------------------------------------------------------
-- Policy 2: Authenticated Administrator Write Access (INSERT, UPDATE, DELETE)
-- Only verified staff/owners authenticated via Supabase Auth can modify records
-- ------------------------------------------------------------------------------

-- Categories Policies
DROP POLICY IF EXISTS "Admin insert on categories" ON public.categories;
CREATE POLICY "Admin insert on categories"
ON public.categories
FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin update on categories" ON public.categories;
CREATE POLICY "Admin update on categories"
ON public.categories
FOR UPDATE
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin delete on categories" ON public.categories;
CREATE POLICY "Admin delete on categories"
ON public.categories
FOR DELETE
TO authenticated
USING (auth.role() = 'authenticated');

-- Menu Items Policies
DROP POLICY IF EXISTS "Admin insert on menu_items" ON public.menu_items;
CREATE POLICY "Admin insert on menu_items"
ON public.menu_items
FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin update on menu_items" ON public.menu_items;
CREATE POLICY "Admin update on menu_items"
ON public.menu_items
FOR UPDATE
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin delete on menu_items" ON public.menu_items;
CREATE POLICY "Admin delete on menu_items"
ON public.menu_items
FOR DELETE
TO authenticated
USING (auth.role() = 'authenticated');

-- Settings Policies
DROP POLICY IF EXISTS "Admin insert on restaurant_settings" ON public.restaurant_settings;
CREATE POLICY "Admin insert on restaurant_settings"
ON public.restaurant_settings
FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin update on restaurant_settings" ON public.restaurant_settings;
CREATE POLICY "Admin update on restaurant_settings"
ON public.restaurant_settings
FOR UPDATE
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin delete on restaurant_settings" ON public.restaurant_settings;
CREATE POLICY "Admin delete on restaurant_settings"
ON public.restaurant_settings
FOR DELETE
TO authenticated
USING (auth.role() = 'authenticated');
-- ==============================================================================
-- SREE MK FOOD COURT — VERIFIED MENU SEED DATA FOR SUPABASE
-- Extracted from 5 physical menu cards (240 verified items, 17 categories)
-- ==============================================================================

-- 1. Restaurant Settings
INSERT INTO public.restaurant_settings (key, value)
VALUES ('restaurant_info', '{"name":"Sree MK Food Court","tagline":"Good Food. Good Mood.","phones":["+91 9391046296","+91 8341189085"],"address":"Sree MK Food Court Restaurant, Local Hub","wifiSsidInstructions":"Connect your phone to Sree MK Food Court local Wi-Fi to browse without internet.","viewOnlyNotice":"This is a view-only digital menu. Please place your order directly with the service staff.","currencySymbol":"₹"}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 2. Categories (17 categories)
INSERT INTO public.categories (id, name, icon, display_order)
VALUES
  ('biryani', 'Biryani', 'Utensils', 1),
  ('fried-rice', 'Fried Rice', 'Bowl', 2),
  ('noodles', 'Noodles', 'Wheat', 3),
  ('starters', 'Starters', 'Flame', 4),
  ('seafood', 'Seafood Snacks', 'Fish', 5),
  ('rolls-wraps', 'Rolls & Wraps', 'Sandwich', 6),
  ('main-course', 'Main Course', 'Beef', 7),
  ('pasta', 'Pasta', 'CookingPot', 8),
  ('pizza', 'Pizza', 'Pizza', 9),
  ('burgers-sandwiches', 'Burgers & Sandwiches', 'Sandwich', 10),
  ('bits-nuggets', 'Bits & Nuggets', 'Cookie', 11),
  ('soups', 'Soups', 'Soup', 12),
  ('shakes-beverages', 'Shakes & Beverages', 'CupSoda', 13),
  ('mocktails', 'Mocktails', 'GlassWater', 14),
  ('juices-salads', 'Juices & Salads', 'Apple', 15),
  ('falooda-desserts', 'Falooda & Desserts', 'IceCream', 16),
  ('fries', 'French Fries', 'Sparkles', 17)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  display_order = EXCLUDED.display_order;

-- 3. Menu Items (240 verified items)
INSERT INTO public.menu_items (
  id, name, original_name, category_id, category_name, subcategory,
  price, type, availability, description, image_url, display_order, source_card, needs_verification
)
VALUES
  ('biryani-veg-1', 'Veg Biryani', 'VEG BIRYANI', 'biryani', 'Biryani', 'Veg Biryani', 149, 'veg', true, 'Aromatic basmati rice cooked with fresh seasonal vegetables and special royal spices.', '', 1, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('biryani-veg-2', 'Mushroom Biryani', 'MUSHROOM BIRYANI', 'biryani', 'Biryani', 'Veg Biryani', 149, 'veg', true, 'Tender button mushrooms infused with flavorful biryani masala and herbs.', '', 2, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('biryani-veg-3', 'Paneer Biryani', 'PANEER BIRYANI', 'biryani', 'Biryani', 'Veg Biryani', 199, 'veg', true, 'Rich cottage cheese cubes layered with spiced saffron basmati rice.', '', 3, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('biryani-veg-4', 'Chilli Paneer Biryani', 'CHILLI PANEER BIRYANI', 'biryani', 'Biryani', 'Veg Biryani', 199, 'veg', true, 'Zesty Indo-Chinese chilli paneer tossed with aromatic Dum biryani rice.', '', 4, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('biryani-nv-1', 'Egg Biryani', 'EGG BIRYANI', 'biryani', 'Biryani', 'Non-Veg Biryani', 109, 'egg', true, 'Boiled spiced eggs roasted in signature gravy served with long-grain biryani rice.', '', 5, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('biryani-nv-2', 'Chicken Biryani', 'CHICKEN BIRYANI', 'biryani', 'Biryani', 'Non-Veg Biryani', 129, 'non-veg', true, 'Traditional chicken dum biryani prepared with authentic fragrant spices.', '', 6, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('biryani-nv-3', 'Plate Chicken Biryani', 'PLATE CHICKEN BIRYANI', 'biryani', 'Biryani', 'Non-Veg Biryani', 249, 'non-veg', true, 'Hearty full plate portion of succulent chicken biryani with mirchi ka salan and raita.', '', 7, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('biryani-nv-4', 'Family Pack Chicken Biryani (4pcs)', 'FAMILY PACK CHICKEN BIRYANI', 'biryani', 'Biryani', 'Non-Veg Biryani', 479, 'non-veg', true, 'Grand family-sized biryani platter with 4 pieces of dum chicken for sharing', '', 8, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('biryani-nv-5', 'Lollipop Chicken Biryani (2 Pcs)', 'LOLLIPOP CHICKEN BIRYANI 2 PS', 'biryani', 'Biryani', 'Non-Veg Biryani', 149, 'non-veg', true, 'Crispy chicken lollipops served on a bed of seasoned biryani rice.', '', 9, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('biryani-nv-6', 'Chicken Wings Biryani (3 Pcs)', 'CHICKEN WINGS BIRYANI 3 PS', 'biryani', 'Biryani', 'Non-Veg Biryani', 159, 'non-veg', true, 'Tender spiced chicken wings combined with flavorful Dum biryani.', '', 10, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('biryani-nv-7', 'Chicken 65 Biryani (10 Pcs)', 'CHICKEN 65 BIRYANI 10 PS', 'biryani', 'Biryani', 'Non-Veg Biryani', 169, 'non-veg', true, 'Crisp spicy Chicken 65 boneless bites topped over fragrant biryani rice.', '', 11, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('biryani-nv-8', 'Chilli Chicken Biryani (10 Pcs)', 'CHILLI CHICKEN BIRYANI 10 PS', 'biryani', 'Biryani', 'Non-Veg Biryani', 169, 'non-veg', true, 'Spicy chilli chicken pieces blended with aromatic Dum rice.', '', 12, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('biryani-nv-9', 'Chicken 555 Biryani (10 Pcs)', 'CHICKEN 555 BIRYANI 10 PS', 'biryani', 'Biryani', 'Non-Veg Biryani', 169, 'non-veg', true, 'Signature Chicken 555 spiced strips paired with authentic biryani.', '', 13, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('biryani-nv-10', 'Chicken Fry Piece Biryani (4 Pcs)', 'CHICKEN FRY PIECE BIRYANI 4 PS', 'biryani', 'Biryani', 'Non-Veg Biryani', 169, 'non-veg', true, 'Traditional Andhra style fried chicken pieces served on fragrant biryani rice.', '', 14, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('biryani-nv-11', 'Chicken Pulao Biryani', 'CHICKEN PULAO BIRYANI', 'biryani', 'Biryani', 'Non-Veg Biryani', 179, 'non-veg', true, 'Homestyle aromatic spiced chicken pulao crafted with pure ghee and herbs.', '', 15, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('biryani-nv-12', 'MK Spl Chicken Biryani (10 Pcs)', 'MK SPLCHICKEN BIRYANI 10 PS', 'biryani', 'Biryani', 'Non-Veg Biryani', 179, 'non-veg', true, 'Chef''s special recipe biryani featuring 10 marinated tender chicken delicacies.', '', 16, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('biryani-nv-13', 'Fish Biryani (10 Pcs)', 'FISH BIRYANI 10 PS', 'biryani', 'Biryani', 'Non-Veg Biryani', 199, 'non-veg', true, 'Freshly marinated fish cubes delicately cooked with coastal spiced biryani rice.', '', 17, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('biryani-nv-14', 'Prawns Biryani (10 Pcs)', 'PRAWNS BIRYANI 10 PS', 'biryani', 'Biryani', 'Non-Veg Biryani', 199, 'non-veg', true, 'Juicy sea prawns tossed in house masala layered with aged basmati rice.', '', 18, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('fried-rice-veg-1', 'Veg Fried Rice', 'VEG FRIED RICE', 'fried-rice', 'Fried Rice', 'Veg Fried Rice', 79, 'veg', true, 'Wok-tossed rice with crisp garden vegetables, spring onions, and light soy seasoning.', '', 19, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('fried-rice-veg-2', 'Chilli Garlic Veg Rice', 'CHILLI GARLIC VEG RICE', 'fried-rice', 'Fried Rice', 'Veg Fried Rice', 89, 'veg', true, 'Stir-fried rice loaded with golden burnt garlic and spicy red chillies.', '', 20, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('fried-rice-veg-3', 'Jeera Veg Rice', 'JEERA VEG RICE', 'fried-rice', 'Fried Rice', 'Veg Fried Rice', 89, 'veg', true, 'Fluffy rice tempered with roasted cumin seeds and fresh coriander.', '', 21, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('fried-rice-veg-4', 'Sezwan Veg Rice', 'SEZWAN VEG RICE', 'fried-rice', 'Fried Rice', 'Veg Fried Rice', 99, 'veg', true, 'Fiery Schezwan style fried rice cooked with fresh seasonal vegetables.', '', 22, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('fried-rice-veg-5', 'Paneer Fried Rice', 'PANEER FRID RICE', 'fried-rice', 'Fried Rice', 'Veg Fried Rice', 99, 'veg', true, 'Tender paneer cubes wok-tossed with rice and Chinese sauces.', '', 23, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('fried-rice-veg-6', 'Sezwan Paneer Veg Rice', 'SEZWAN PANER VEG RICE', 'fried-rice', 'Fried Rice', 'Veg Fried Rice', 119, 'veg', true, 'Spicy Schezwan fried rice with paneer chunks and fresh bell peppers.', '', 24, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('fried-rice-veg-7', 'Mushroom Veg Rice', 'MUSHROOM VEG RICE', 'fried-rice', 'Fried Rice', 'Veg Fried Rice', 99, 'veg', true, 'Fresh sliced button mushrooms tossed in oriental spiced fried rice.', '', 25, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('fried-rice-egg-1', 'Egg Fried Rice', 'EGG FRIED RICE', 'fried-rice', 'Fried Rice', 'Egg Fried Rice', 89, 'egg', true, 'Classic stir-fried rice with fluffy scrambled eggs and veggies.', '', 26, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('fried-rice-egg-2', 'Double Egg Fried Rice', 'DOUBLE EGG FRIED RICE', 'fried-rice', 'Fried Rice', 'Egg Fried Rice', 99, 'egg', true, 'Double portion of scrambled eggs tossed with seasoned fragrant rice.', '', 27, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('fried-rice-egg-3', 'Sezwan Egg Fried Rice', 'SEZWAN EGG FRIED RICE', 'fried-rice', 'Fried Rice', 'Egg Fried Rice', 109, 'egg', true, 'Zesty spicy Schezwan sauce tossed with eggs and long-grain rice.', '', 28, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('fried-rice-egg-4', 'Sezwan Double Egg Fried Rice', 'SEZWAN DOUBLE EGG FRIED RICE', 'fried-rice', 'Fried Rice', 'Egg Fried Rice', 119, 'egg', true, 'Extra egg portion tossed with fiery red Schezwan sauce and rice.', '', 29, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('fried-rice-egg-5', 'Hot Garlic Egg Fried Rice', 'HOT GARLIC EGG FRIED RICE', 'fried-rice', 'Fried Rice', 'Egg Fried Rice', 129, 'egg', true, 'Spicy garlic paste and red chilli relish stir-fried with eggs and rice.', '', 30, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('fried-rice-chk-1', 'Chicken Fried Rice', 'CHICKEN FRIED RICE', 'fried-rice', 'Fried Rice', 'Chicken Fried Rice', 99, 'non-veg', true, 'Tender shredded chicken stir-fried in a hot wok with rice and seasonings.', '', 31, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('fried-rice-chk-2', 'Chicken Double Fried Rice', 'CHICKEN DOUBLE FRIED RICE', 'fried-rice', 'Fried Rice', 'Chicken Fried Rice', 109, 'non-veg', true, 'Generous serving of double-portion chicken pieces tossed with rice.', '', 32, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('fried-rice-chk-3', 'Chicken Double Egg Fried Rice', 'CHICKEN DOUBLE EGG FRIED RICE', 'fried-rice', 'Fried Rice', 'Chicken Fried Rice', 109, 'non-veg', true, 'Loaded combination of tender chicken and double scrambled eggs.', '', 33, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('fried-rice-chk-4', 'Sezwan Chicken Fried Rice', 'SEZWAN CHICKEN FRIED RICE', 'fried-rice', 'Fried Rice', 'Chicken Fried Rice', 119, 'non-veg', true, 'Spicy Schezwan chicken fried rice bursting with smoky wok aromas.', '', 34, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('fried-rice-chk-5', 'Chilli Garlic Chicken Rice', 'CHILLI GARLIC CHICKEN RICE', 'fried-rice', 'Fried Rice', 'Chicken Fried Rice', 129, 'non-veg', true, 'Fragrant garlic, crushed chillies, and juicy chicken tossed with rice.', '', 35, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('fried-rice-chk-6', 'Hot Garlic Chicken Fried Rice', 'HOT GARLIC CHICKEN FRIED RICE', 'fried-rice', 'Fried Rice', 'Chicken Fried Rice', 129, 'non-veg', true, 'Intense hot garlic sauce with tender chicken pieces and spring onions.', '', 36, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('fried-rice-chk-7', 'Mancho Chicken Fried Rice', 'MANCHO CHICKEN FRIED RICE', 'fried-rice', 'Fried Rice', 'Chicken Fried Rice', 139, 'non-veg', true, 'Manchow style spiced chicken fried rice with crisp fried noodles topping.', '', 37, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('fried-rice-chk-8', 'MK Spl Chicken Fried Rice', 'MK SPL CHICKEN FRIED RICE', 'fried-rice', 'Fried Rice', 'Chicken Fried Rice', 149, 'non-veg', true, 'Chef''s signature fried rice loaded with special marinated chicken and sauces.', '', 38, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('noodles-veg-1', 'Veg Soft Noodles', 'VEG SAFT NOODELES', 'noodles', 'Noodles', 'Veg Noodles', 69, 'veg', true, 'Classic soft wok-tossed noodles with shredded cabbage, carrots, and capsicum.', '', 39, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('noodles-veg-2', 'Veg Sezwan Noodles', 'VEG SEZWAN NOODELES', 'noodles', 'Noodles', 'Veg Noodles', 79, 'veg', true, 'Spicy Schezwan noodles cooked with fresh vegetables and aromatic garlic.', '', 40, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('noodles-veg-3', 'Veg Chilli Garlic Noodles', 'VEG CHILLI GARLIC NOODELES', 'noodles', 'Noodles', 'Veg Noodles', 79, 'veg', true, 'Flavorsome noodles infused with burnt garlic and spicy red chilli paste.', '', 41, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('noodles-veg-4', 'Veg Hot Garlic Noodles', 'VEG HOT GARLIC NOODELES', 'noodles', 'Noodles', 'Veg Noodles', 99, 'veg', true, 'Tangy and spicy hot garlic sauce tossed with fresh vegetable noodles.', '', 42, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('noodles-veg-5', 'Veg Mushroom Noodles', 'VEG MUSHROOM NOODELES', 'noodles', 'Noodles', 'Veg Noodles', 99, 'veg', true, 'Juicy mushrooms stir-fried with vegetables and soft Hakka noodles.', '', 43, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('noodles-nv-1', 'Egg Noodles', 'EGG NOODELES', 'noodles', 'Noodles', 'Non-Veg Noodles', 79, 'egg', true, 'Scrambled egg ribbons stir-fried with noodles, soy sauce, and greens.', '', 44, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('noodles-nv-2', 'Double Egg Noodles', 'DOUBLE EGG NOODELES', 'noodles', 'Noodles', 'Non-Veg Noodles', 89, 'egg', true, 'Double dose of fluffy scrambled egg tossed with street-style noodles.', '', 45, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('noodles-nv-3', 'Sezwan Egg Noodles', 'SEZWAN EGG NOODELES', 'noodles', 'Noodles', 'Non-Veg Noodles', 89, 'egg', true, 'Spicy Schezwan egg noodles with crunchy vegetables.', '', 46, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('noodles-nv-4', 'Chilli Garlic Egg Noodles', 'CHILLI GARLIC EGG NOODELES', 'noodles', 'Noodles', 'Non-Veg Noodles', 99, 'egg', true, 'Garlicky egg noodles tossed with fresh green chillies and pepper.', '', 47, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('noodles-nv-5', 'Chicken Noodles', 'CHICKEN NOODELES', 'noodles', 'Noodles', 'Non-Veg Noodles', 99, 'non-veg', true, 'Succulent shredded chicken pieces wok-tossed with soft noodles.', '', 48, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('noodles-nv-6', 'Double Egg Chicken Noodles', 'DOUBLE EGG CHICKEN NOODELES', 'noodles', 'Noodles', 'Non-Veg Noodles', 109, 'non-veg', true, 'Hearty mix of chicken and double scrambled eggs in savory noodles.', '', 49, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('noodles-nv-7', 'Ginger Chicken Noodles', 'GINGEER CHICKEN NOODELES', 'noodles', 'Noodles', 'Non-Veg Noodles', 119, 'non-veg', true, 'Fresh ginger infused chicken tossed with savory oriental noodles.', '', 50, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('noodles-nv-8', 'Sezwan Chicken Noodles', 'SEZWAN CHICKEN NOODELES', 'noodles', 'Noodles', 'Non-Veg Noodles', 129, 'non-veg', true, 'Spicy Schezwan chicken noodles with red peppers and spring onions.', '', 51, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('noodles-nv-9', 'Hot Garlic Chicken Noodles', 'HOT GARLIC CHICKEN NOODELES', 'noodles', 'Noodles', 'Non-Veg Noodles', 139, 'non-veg', true, 'Noodles tossed with spicy hot garlic chicken and crispy scallions.', '', 52, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('starter-veg-1', 'Veg Manchurian', 'VEG MANCHURIAN', 'starters', 'Starters', 'Veg Starters', 99, 'veg', true, 'Crispy vegetable dumplings tossed in tangy and spicy Manchurian sauce.', '', 53, 'card-2-starters-rolls-seafood.jpg', false),
  ('starter-veg-2', 'Crispy Corn', 'CRISPY CORN', 'starters', 'Starters', 'Veg Starters', 109, 'veg', true, 'Golden fried sweet corn kernels tossed with spices, onion, and herbs.', '', 54, 'card-2-starters-rolls-seafood.jpg', false),
  ('starter-veg-3', 'Crispy Veg', 'CRISPY VEG', 'starters', 'Starters', 'Veg Starters', 109, 'veg', true, 'Batter-fried assortment of crisp vegetables tossed in tangy seasoning.', '', 55, 'card-2-starters-rolls-seafood.jpg', false),
  ('starter-veg-4', 'Baby Corn 65', 'BABY CORN 65', 'starters', 'Starters', 'Veg Starters', 159, 'veg', true, 'Tender baby corn spears deep-fried in spicy South Indian 65 masala.', '', 56, 'card-2-starters-rolls-seafood.jpg', false),
  ('starter-veg-5', 'Butter Garlic Baby Corn', 'BUTTER GARLIC BABY CORN', 'starters', 'Starters', 'Veg Starters', 179, 'veg', true, 'Baby corn sautéed in rich garlic butter with ground black pepper.', '', 57, 'card-2-starters-rolls-seafood.jpg', false),
  ('starter-veg-6', 'Gobi Manchurian', 'GOBI MANCHURIAN', 'starters', 'Starters', 'Veg Starters', 109, 'veg', true, 'Crisp cauliflower florets tossed in zesty Indo-Chinese Manchurian glaze.', '', 58, 'card-2-starters-rolls-seafood.jpg', false),
  ('starter-veg-7', 'Chilli Gobi', 'CHILLI GOBI', 'starters', 'Starters', 'Veg Starters', 109, 'veg', true, 'Spicy fried cauliflower tossed with green chillies, capsicum, and onion.', '', 59, 'card-2-starters-rolls-seafood.jpg', false),
  ('starter-veg-8', 'Mushroom Manchurian', 'MUSHROOM MANCHURIAN', 'starters', 'Starters', 'Veg Starters', 169, 'veg', true, 'Juicy mushrooms crisp-fried and tossed in dark soy Manchurian gravy.', '', 60, 'card-2-starters-rolls-seafood.jpg', false),
  ('starter-veg-9', 'Chilli Mushroom', 'CHILLI MUSHROOM', 'starters', 'Starters', 'Veg Starters', 179, 'veg', true, 'Fresh mushrooms stir-fried with bell peppers and hot chilli sauce.', '', 61, 'card-2-starters-rolls-seafood.jpg', false),
  ('starter-veg-10', 'Paneer Manchurian', 'PANEER MANCHURIAN', 'starters', 'Starters', 'Veg Starters', 169, 'veg', true, 'Soft cottage cheese cubes cooked in spicy Manchurian masala.', '', 62, 'card-2-starters-rolls-seafood.jpg', false),
  ('starter-veg-11', 'Chilli Paneer', 'CHILLI PANEER', 'starters', 'Starters', 'Veg Starters', 169, 'veg', true, 'Classic Indo-Chinese starter with paneer, crunchy capsicum, and spicy soya sauce.', '', 63, 'card-2-starters-rolls-seafood.jpg', false),
  ('starter-veg-12', 'Paneer 65', 'PANEER 65', 'starters', 'Starters', 'Veg Starters', 179, 'veg', true, 'Crisp fried paneer cubes tempered with curry leaves and mustard seeds.', '', 64, 'card-2-starters-rolls-seafood.jpg', false),
  ('starter-veg-13', 'Lemon Pepper Paneer', 'LEMON PEPPER PANEER', 'starters', 'Starters', 'Veg Starters', 189, 'veg', true, 'Paneer cubes tossed with zesty lemon juice and freshly cracked black pepper.', '', 65, 'card-2-starters-rolls-seafood.jpg', false),
  ('starter-veg-14', 'Hongkong Paneer', 'HONGKONG PANEER', 'starters', 'Starters', 'Veg Starters', 189, 'veg', true, 'Exotic Hong Kong style spicy sauce with tender paneer and scallions.', '', 66, 'card-2-starters-rolls-seafood.jpg', false),
  ('starter-veg-15', 'Sezwan Paneer', 'SEZWAN PANEER', 'starters', 'Starters', 'Veg Starters', 189, 'veg', true, 'Fiery Schezwan chilli gravy coating golden fried cottage cheese.', '', 67, 'card-2-starters-rolls-seafood.jpg', false),
  ('starter-veg-16', 'Honey Fried Paneer', 'HONEY FRIED PANEER', 'starters', 'Starters', 'Veg Starters', 199, 'veg', true, 'Crispy paneer glazed with pure honey, toasted sesame seeds, and mild spice.', '', 68, 'card-2-starters-rolls-seafood.jpg', false),
  ('starter-egg-1', 'Egg Manchurian', 'EGG MANCHURIAN', 'starters', 'Starters', 'Egg Starters', 109, 'egg', true, 'Boiled egg chunks coated in batter and tossed with savoury Manchurian sauce.', '', 69, 'card-2-starters-rolls-seafood.jpg', false),
  ('starter-egg-2', 'Egg 65', 'EGG 65', 'starters', 'Starters', 'Egg Starters', 109, 'egg', true, 'Spicy egg starter seasoned with South Indian spices and fried curry leaves.', '', 70, 'card-2-starters-rolls-seafood.jpg', false),
  ('starter-egg-3', 'Chilli Egg', 'CHILLI EGG', 'starters', 'Starters', 'Egg Starters', 109, 'egg', true, 'Golden fried egg slices tossed in fiery chilli garlic sauce with capsicum.', '', 71, 'card-2-starters-rolls-seafood.jpg', false),
  ('starter-nv-1', 'Chicken Manchurian', 'CHICKEN MANCHURIAN', 'starters', 'Starters', 'Non Veg Starters', 159, 'non-veg', true, 'Tender chicken morsels cooked in tangy soy, ginger, and garlic Manchurian sauce.', '', 72, 'card-2-starters-rolls-seafood.jpg', false),
  ('starter-nv-2', 'Chilli Chicken', 'CHILLI CHICKEN', 'starters', 'Starters', 'Non Veg Starters', 169, 'non-veg', true, 'All-time favorite crispy chicken tossed with green chillies, onions, and bell peppers.', '', 73, 'card-2-starters-rolls-seafood.jpg', false),
  ('starter-nv-3', 'Chicken 65', 'CHICKEN 65', 'starters', 'Starters', 'Non Veg Starters', 169, 'non-veg', true, 'Crispy, spicy bite-sized chicken marinated with crushed peppercorns and curry leaves.', '', 74, 'card-2-starters-rolls-seafood.jpg', false),
  ('starter-nv-4', 'Lemon Chicken', 'LEMON CHICKEN', 'starters', 'Starters', 'Non Veg Starters', 169, 'non-veg', true, 'Tangy chicken starter tossed with zesty lemon essence and subtle herbs.', '', 75, 'card-2-starters-rolls-seafood.jpg', false),
  ('starter-nv-5', 'Spicy Chicken Wings', 'SPICY CHICKEN WINGES', 'starters', 'Starters', 'Non Veg Starters', 169, 'non-veg', true, 'Crispy chicken wings glazed in our house fiery hot pepper glaze.', '', 76, 'card-2-starters-rolls-seafood.jpg', false),
  ('starter-nv-6', 'Chicken Lollipop', 'CHICKEN LOLIPOP', 'starters', 'Starters', 'Non Veg Starters', 179, 'non-veg', true, 'French-trimmed chicken drumettes fried to perfection with hot Schezwan dip.', '', 77, 'card-2-starters-rolls-seafood.jpg', false),
  ('starter-nv-7', 'Black Pepper Chicken', 'BLACK PEPPER CHICKEN', 'starters', 'Starters', 'Non Veg Starters', 189, 'non-veg', true, 'Juicy chicken pieces tossed in freshly crushed Malabar black pepper.', '', 78, 'card-2-starters-rolls-seafood.jpg', false),
  ('starter-nv-8', 'Lemon Pepper Chicken', 'LEMON PEPPER CHICKEN', 'starters', 'Starters', 'Non Veg Starters', 179, 'non-veg', true, 'Chicken tossed in zesty lemon juice and fragrant cracked pepper.', '', 79, 'card-2-starters-rolls-seafood.jpg', false),
  ('starter-nv-9', 'Honking Chicken', 'HONKING CHICKEN', 'starters', 'Starters', 'Non Veg Starters', 179, 'non-veg', true, 'Hong Kong style sweet, sour, and spicy chicken delight.', '', 80, 'card-2-starters-rolls-seafood.jpg', false),
  ('starter-nv-10', 'Singapur Chicken', 'SINGAPUR CHICKEN', 'starters', 'Starters', 'Non Veg Starters', 179, 'non-veg', true, 'Singapore style chicken starter tossed with mild curry aromatics and chillies.', '', 81, 'card-2-starters-rolls-seafood.jpg', false),
  ('starter-nv-11', 'Chicken Majestic', 'CHICKEN MAGESTIC', 'starters', 'Starters', 'Non Veg Starters', 189, 'non-veg', true, 'Hyderabadi delicacy: tender chicken strips tossed in spiced curd and mint gravy.', '', 82, 'card-2-starters-rolls-seafood.jpg', false),
  ('starter-nv-12', 'Chicken 555', 'CHICKEN 555', 'starters', 'Starters', 'Non Veg Starters', 189, 'non-veg', true, 'Crispy battered chicken fingers tossed with garlic, ginger, and red spicy sauce.', '', 83, 'card-2-starters-rolls-seafood.jpg', false),
  ('starter-nv-13', 'Pepper Chicken', 'PEPPER CHICKEN', 'starters', 'Starters', 'Non Veg Starters', 189, 'non-veg', true, 'Dry roasted chicken tossed with fragrant black pepper and curry leaves.', '', 84, 'card-2-starters-rolls-seafood.jpg', false),
  ('starter-nv-14', 'Mancho Dragon Chicken', 'MANCHO DRAGON CHICKEN', 'starters', 'Starters', 'Non Veg Starters', 199, 'non-veg', true, 'Fiery dragon chicken with cashews, red peppers, and tangy Schezwan seasoning.', '', 85, 'card-2-starters-rolls-seafood.jpg', false),
  ('starter-nv-15', 'Hot Garlic Chicken', 'HOT GARLIC CHICKEN', 'starters', 'Starters', 'Non Veg Starters', 189, 'non-veg', true, 'Chicken chunks tossed in pungent, rich garlic paste and hot chillies.', '', 86, 'card-2-starters-rolls-seafood.jpg', false),
  ('starter-nv-16', 'Chicken 999', 'CHICKEN 999', 'starters', 'Starters', 'Non Veg Starters', 199, 'non-veg', true, 'Special Andhra restaurant preparation of spiced deep-fried chicken bites.', '', 87, 'card-2-starters-rolls-seafood.jpg', false),
  ('starter-nv-17', 'Deville Chicken', 'DEVILLE CHICKEN', 'starters', 'Starters', 'Non Veg Starters', 199, 'non-veg', true, 'Extra spicy ''deviled'' chicken tossed in dark red chilli paste and capsicum.', '', 88, 'card-2-starters-rolls-seafood.jpg', false),
  ('starter-nv-18', 'Cashew Chicken', 'CASHEW CHICKEN', 'starters', 'Starters', 'Non Veg Starters', 199, 'non-veg', true, 'Juicy chicken wok-tossed with roasted whole cashew nuts in a rich savory sauce.', '', 89, 'card-2-starters-rolls-seafood.jpg', false),
  ('starter-nv-19', 'Thaifai Chicken', 'THAIFAI CHICKEN', 'starters', 'Starters', 'Non Veg Starters', 199, 'non-veg', true, 'Thai-inspired fried chicken infused with aromatic lemongrass and galangal hints.', '', 90, 'card-2-starters-rolls-seafood.jpg', false),
  ('starter-nv-20', 'MK Spl Wings', 'MK SPL WINGS', 'starters', 'Starters', 'Non Veg Starters', 209, 'non-veg', true, 'Chef''s signature chicken wings spiced to perfection and served sizzling.', '', 91, 'card-2-starters-rolls-seafood.jpg', false),
  ('starter-nv-21', 'MK Spl Chicken', 'MK SPL CHICKEN', 'starters', 'Starters', 'Non Veg Starters', 209, 'non-veg', true, 'House special chicken starter with secret recipe spices and crispy coating.', '', 92, 'card-2-starters-rolls-seafood.jpg', false),
  ('starter-nv-22', 'Honey Fried Chicken', 'HONEY FRIED CHICKEN', 'starters', 'Starters', 'Non Veg Starters', 209, 'non-veg', true, 'Crispy fried chicken tossed in sweet natural honey and toasted sesame glaze.', '', 93, 'card-2-starters-rolls-seafood.jpg', false),
  ('seafood-1', 'Apollo Fish', 'APOLLO FISH', 'seafood', 'Seafood Snacks', 'Seafood Snacks', 179, 'non-veg', true, 'Famous boneless fish cubes marinated in spiced curd and tempered with curry leaves.', '', 94, 'card-2-starters-rolls-seafood.jpg', false),
  ('seafood-2', 'Chilli Fish', 'CHILLI FISH', 'seafood', 'Seafood Snacks', 'Seafood Snacks', 169, 'non-veg', true, 'Fish fillets tossed with green chillies, diced onions, and spicy soy sauce.', '', 95, 'card-2-starters-rolls-seafood.jpg', false),
  ('seafood-3', 'Lemon Fish', 'LEMON FISH', 'seafood', 'Seafood Snacks', 'Seafood Snacks', 169, 'non-veg', true, 'Pan-seared fish fillets flavoured with tangy lemon juice and herbs.', '', 96, 'card-2-starters-rolls-seafood.jpg', false),
  ('seafood-4', 'Spicy Fried Fish', 'SPICY FRID FISH', 'seafood', 'Seafood Snacks', 'Seafood Snacks', 169, 'non-veg', true, 'Crispy fried fish marinated in Andhra-style spicy red masala.', '', 97, 'card-2-starters-rolls-seafood.jpg', false),
  ('seafood-5', 'Ginger Prawns', 'GINGEER PRAWNS', 'seafood', 'Seafood Snacks', 'Seafood Snacks', 169, 'non-veg', true, 'Fresh prawns stir-fried in aromatic fresh ginger and mild garlic sauce.', '', 98, 'card-2-starters-rolls-seafood.jpg', false),
  ('seafood-6', 'Chilli Prawns', 'CHILLI PRAWNS', 'seafood', 'Seafood Snacks', 'Seafood Snacks', 169, 'non-veg', true, 'Plump prawns cooked with bell peppers, hot chillies, and soy glaze.', '', 99, 'card-2-starters-rolls-seafood.jpg', false),
  ('seafood-7', 'Prawns 65', 'PRAWNS 65', 'seafood', 'Seafood Snacks', 'Seafood Snacks', 169, 'non-veg', true, 'Crispy battered prawns tossed with South Indian 65 seasonings and curry leaves.', '', 100, 'card-2-starters-rolls-seafood.jpg', false),
  ('seafood-8', 'Loose Prawns', 'LOOSE PRAWNS', 'seafood', 'Seafood Snacks', 'Seafood Snacks', 179, 'non-veg', true, 'Crunchy golden fried prawns tossed with chopped garlic and spring onions.', '', 101, 'card-2-starters-rolls-seafood.jpg', false),
  ('seafood-9', 'Butter Garlic Prawns', 'BUTTER GARLIC PRAWNS', 'seafood', 'Seafood Snacks', 'Seafood Snacks', 179, 'non-veg', true, 'Succulent prawns sautéed gently in rich butter and freshly minced garlic.', '', 102, 'card-2-starters-rolls-seafood.jpg', false),
  ('roll-veg-1', 'Veg Wrap', 'VEG WRAP', 'rolls-wraps', 'Rolls & Wraps', 'Veg Rolls', 59, 'veg', true, 'Warm flatbread rolled with fresh shredded vegetables and creamy mint dressing.', '', 103, 'card-2-starters-rolls-seafood.jpg', false),
  ('roll-veg-2', 'Veg Manchurian Roll', 'VEG MANCHURIAN ROLL', 'rolls-wraps', 'Rolls & Wraps', 'Veg Rolls', 69, 'veg', true, 'Veg Manchurian balls tossed in sauce, wrapped inside a flaky paratha.', '', 104, 'card-2-starters-rolls-seafood.jpg', false),
  ('roll-veg-3', 'Veg 65 Roll', 'VEG 65 ROLL', 'rolls-wraps', 'Rolls & Wraps', 'Veg Rolls', 69, 'veg', true, 'Spicy crisp vegetable 65 filling rolled with fresh sliced onions and chutneys.', '', 105, 'card-2-starters-rolls-seafood.jpg', false),
  ('roll-veg-4', 'Paneer Wrap', 'PANEER WRAP', 'rolls-wraps', 'Rolls & Wraps', 'Veg Rolls', 79, 'veg', true, 'Tender spiced paneer cubes stuffed in a soft toasted roll with herbs.', '', 106, 'card-2-starters-rolls-seafood.jpg', false),
  ('roll-egg-1', 'Egg Salad Roll', 'EGG SALAD ROLL', 'rolls-wraps', 'Rolls & Wraps', 'Egg Rolls', 79, 'egg', true, 'Boiled egg salad tossed in light mayonnaise dressing inside a fresh roll.', '', 107, 'card-2-starters-rolls-seafood.jpg', false),
  ('roll-egg-2', 'Cheese Omelette Roll', 'CHEESE OMELETTE ROLL', 'rolls-wraps', 'Rolls & Wraps', 'Egg Rolls', 79, 'egg', true, 'Fluffy egg omelette with melted cheese rolled in a warm flatbread.', '', 108, 'card-2-starters-rolls-seafood.jpg', false),
  ('roll-egg-3', 'Cheese Omelette Peppercorn Roll', 'CHEESE OMELETTE PEPPER CORN ROLL', 'rolls-wraps', 'Rolls & Wraps', 'Egg Rolls', 89, 'egg', true, 'Cheesy omelette spiced with cracked peppercorns and rolled hot.', '', 109, 'card-2-starters-rolls-seafood.jpg', false),
  ('roll-nv-1', 'Chicken Salad Roll', 'CHICKEN SALAD ROLL', 'rolls-wraps', 'Rolls & Wraps', 'Non-Veg Rolls', 79, 'non-veg', true, 'Seasoned chicken breast tossed with crisp lettuce and wrapped in paratha.', '', 110, 'card-2-starters-rolls-seafood.jpg', false),
  ('roll-nv-2', 'Chicken Cheese Roll', 'CHICKEN CHEESE ROLL', 'rolls-wraps', 'Rolls & Wraps', 'Non-Veg Rolls', 89, 'non-veg', true, 'Juicy chicken bites mixed with gooey melted cheese in a toasted roll.', '', 111, 'card-2-starters-rolls-seafood.jpg', false),
  ('roll-nv-3', 'Chicken 65 Roll', 'CHICKEN 65 ROLL', 'rolls-wraps', 'Rolls & Wraps', 'Non-Veg Rolls', 99, 'non-veg', true, 'Fiery Chicken 65 chunks wrapped with mint spread and sliced onions.', '', 112, 'card-2-starters-rolls-seafood.jpg', false),
  ('roll-nv-4', 'Spicy Chicken Corn Roll', 'SPICY CHICKEN CORN ROLL', 'rolls-wraps', 'Rolls & Wraps', 'Non-Veg Rolls', 99, 'non-veg', true, 'Spiced chicken cubes paired with sweet corn and chipotle mayonnaise.', '', 113, 'card-2-starters-rolls-seafood.jpg', false),
  ('main-1', 'Egg Bhurji', 'EGG BHURJI', 'main-course', 'Main Course', 'Main Course', 89, 'egg', true, 'Indian style spiced scrambled eggs cooked with chopped onions, tomatoes, and green chillies.', '', 114, 'card-1-pizzas-pastas-moctils.jpg', false),
  ('main-2', 'Maken Cheese Balls', 'MAKEN CHEESE BALLS', 'main-course', 'Main Course', 'Main Course', 139, 'veg', true, 'Golden crumbed melted cheese balls with mild seasoning, served hot.', '', 115, 'card-1-pizzas-pastas-moctils.jpg', false),
  ('main-3', 'Chicken Cheese Balls', 'CHICKEN CHEESE BALLS', 'main-course', 'Main Course', 'Main Course', 169, 'non-veg', true, 'Savory minced chicken balls stuffed with a molten cheesy center.', '', 116, 'card-1-pizzas-pastas-moctils.jpg', false),
  ('main-4', 'Chicken Sticks', 'CHICKEN STICS', 'main-course', 'Main Course', 'Main Course', 129, 'non-veg', true, 'Crispy coated chicken skewers seasoned with Italian herbs and paprika.', '', 117, 'card-1-pizzas-pastas-moctils.jpg', false),
  ('main-5', 'Chicken Kheema Bhurji', 'CHICKEN KHEEMA BHURJI', 'main-course', 'Main Course', 'Main Course', 119, 'non-veg', true, 'Finely minced chicken simmered with aromatic spices, onions, and fresh coriander.', '', 118, 'card-1-pizzas-pastas-moctils.jpg', false),
  ('main-6', 'Grilled Chicken', 'GRILD CHICKEN', 'main-course', 'Main Course', 'Main Course', 169, 'non-veg', true, 'Herb-marinated chicken breast grilled to tender perfection with smoky charred edges.', '', 119, 'card-1-pizzas-pastas-moctils.jpg', false),
  ('main-7', 'Grilled Fish', 'GRILD FISH', 'main-course', 'Main Course', 'Main Course', 199, 'non-veg', true, 'Fresh fish fillets seasoned with ground spices and grilled delicately.', '', 120, 'card-1-pizzas-pastas-moctils.jpg', false),
  ('main-8', 'Lemon Butter Grilled Fish', 'LEMON BUTTER GRILD FISH', 'main-course', 'Main Course', 'Main Course', 229, 'non-veg', true, 'Pan-grilled fish served with a velvety lemon-butter garlic reduction.', '', 121, 'card-1-pizzas-pastas-moctils.jpg', false),
  ('pasta-veg-1', 'Penne Veg White Sauce Pasta', 'PENE VEG WHITE SAUSE PASTA', 'pasta', 'Pasta', 'Veg Pastas', 119, 'veg', true, 'Penne pasta enveloped in creamy Béchamel sauce with bell peppers and broccoli.', '', 122, 'card-1-pizzas-pastas-moctils.jpg', false),
  ('pasta-veg-2', 'Penne Veg Red Sauce Pasta', 'PENE VEG RED SAUSE PASTA', 'pasta', 'Pasta', 'Veg Pastas', 119, 'veg', true, 'Penne tossed in tangy Arrabiata tomato herb sauce with exotic vegetables.', '', 123, 'card-1-pizzas-pastas-moctils.jpg', false),
  ('pasta-veg-3', 'Penne Veg Red & White Sauce Pasta', 'PENE VEG RED & WHITE SAUSE PASTA', 'pasta', 'Pasta', 'Veg Pastas', 139, 'veg', true, 'Penne pasta in luxurious pink sauce blending rich cream and tangy pomodoro.', '', 124, 'card-1-pizzas-pastas-moctils.jpg', false),
  ('pasta-veg-4', 'Macaroni (Meken) Veg White Sauce Pasta', 'MEKEN VEG WHITE SAUSE PASTA', 'pasta', 'Pasta', 'Veg Pastas', 119, 'veg', true, 'Macaroni pasta simmered in rich creamy white cheese sauce with garden veggies.', '', 125, 'card-1-pizzas-pastas-moctils.jpg', false),
  ('pasta-veg-5', 'Macaroni (Meken) Veg Red Sauce Pasta', 'MEKEN VEG RED SAUSE PASTA', 'pasta', 'Pasta', 'Veg Pastas', 119, 'veg', true, 'Macaroni pasta tossed in zesty Italian herb-infused tomato sauce.', '', 126, 'card-1-pizzas-pastas-moctils.jpg', false),
  ('pasta-veg-6', 'Macaroni (Meken) Veg Red & White Sauce Pasta', 'MEKEN VEG RED &WHITESOUSEPASTA', 'pasta', 'Pasta', 'Veg Pastas', 139, 'veg', true, 'Macaroni in luscious mixed pink sauce with oregano and mozzarella.', '', 127, 'card-1-pizzas-pastas-moctils.jpg', false),
  ('pasta-nv-1', 'Penne Chicken Red Sauce Pasta', 'PENE CHICKEN RED SAUSE PASTA PENE', 'pasta', 'Pasta', 'Non Veg Pastas', 149, 'non-veg', true, 'Penne pasta with grilled chicken pieces tossed in fiery Italian red sauce.', '', 128, 'card-1-pizzas-pastas-moctils.jpg', false),
  ('pasta-nv-2', 'Chicken White Sauce Pasta', 'CHICKEN WHITE SAUSE PASTA', 'pasta', 'Pasta', 'Non Veg Pastas', 149, 'non-veg', true, 'Creamy Alfredo style pasta packed with juicy chicken chunks and garlic.', '', 129, 'card-1-pizzas-pastas-moctils.jpg', false),
  ('pasta-nv-3', 'Penne Chicken Red & White Sauce Pasta', 'PENE CHICKEN RED & WHITE SAUSE PASTA', 'pasta', 'Pasta', 'Non Veg Pastas', 179, 'non-veg', true, 'Penne and chicken tossed in our chef''s signature creamy pink sauce.', '', 130, 'card-1-pizzas-pastas-moctils.jpg', false),
  ('pasta-nv-4', 'Macaroni (Meken) Chicken White Sauce Pasta', 'MEKEN CHICKEN WHITE SAUSE PASTA', 'pasta', 'Pasta', 'Non Veg Pastas', 149, 'non-veg', true, 'Macaroni pasta with chicken folded in smooth white Béchamel cream sauce.', '', 131, 'card-1-pizzas-pastas-moctils.jpg', false),
  ('pasta-nv-5', 'Macaroni (Meken) Chicken Red Sauce Pasta', 'MEKEN CHICKEN RED SAUSE PASTA', 'pasta', 'Pasta', 'Non Veg Pastas', 149, 'non-veg', true, 'Savory macaroni pasta in rich tomato sauce cooked with seasoned chicken.', '', 132, 'card-1-pizzas-pastas-moctils.jpg', false),
  ('pasta-nv-6', 'Macaroni (Meken) Chicken Red & White Sauce Pasta', 'MEKEN CHICKEN RED & WHITE SAUSE PASTA', 'pasta', 'Pasta', 'Non Veg Pastas', 179, 'non-veg', true, 'Signature pink pasta cooked with macaroni, shredded chicken, and melted cheese.', '', 133, 'card-1-pizzas-pastas-moctils.jpg', false),
  ('pizza-veg-1', 'Classic Margherita Pizza', 'CLASSIC MARGHRITA PIZZA', 'pizza', 'Pizza', 'Veg Pizzas Time', 129, 'veg', true, 'Crispy thin crust topped with rich pizza sauce, fresh basil, and generous mozzarella.', '', 134, 'card-1-pizzas-pastas-moctils.jpg', false),
  ('pizza-veg-2', 'Mexican Veg Pizza', 'MEXICAN VEG PIZZA', 'pizza', 'Pizza', 'Veg Pizzas Time', 139, 'veg', true, 'Topped with jalapenos, onions, tomatoes, sweet corn, and Mexican herb seasoning.', '', 135, 'card-1-pizzas-pastas-moctils.jpg', false),
  ('pizza-veg-3', 'Sweet Corn Cheese Pizza', 'SWEET CORN CHEESE PIZZA', 'pizza', 'Pizza', 'Veg Pizzas Time', 139, 'veg', true, 'Loaded with sweet American corn kernels smothered under melted mozzarella.', '', 136, 'card-1-pizzas-pastas-moctils.jpg', false),
  ('pizza-veg-4', 'Paneer Pizza', 'PANEER PIZZA', 'pizza', 'Pizza', 'Veg Pizzas Time', 159, 'veg', true, 'Tender spiced paneer cubes, capsicum, and onions baked with golden cheese.', '', 137, 'card-1-pizzas-pastas-moctils.jpg', false),
  ('pizza-veg-5', 'Peri Peri Paneer Pizza', 'PERI PERI PANEER PIZZA', 'pizza', 'Pizza', 'Veg Pizzas Time', 159, 'veg', true, 'Spicy Peri-Peri paneer cubes, red peppers, and fiery herb seasoning.', '', 138, 'card-1-pizzas-pastas-moctils.jpg', false),
  ('pizza-veg-6', 'MK Spl Veg Pizza', 'MK SPL VEG PIZZA', 'pizza', 'Pizza', 'Veg Pizzas Time', 169, 'veg', true, 'Chef''s special loaded vegetarian pizza with paneer, olives, corn, and triple cheese.', '', 139, 'card-1-pizzas-pastas-moctils.jpg', false),
  ('pizza-nv-1', 'Chicken Corn Pizza', 'CHICKEN CORN PIZZA', 'pizza', 'Pizza', 'Nonveg Pizzas Time', 139, 'non-veg', true, 'Combination of savory grilled chicken and sweet juicy corn over melted mozzarella.', '', 140, 'card-1-pizzas-pastas-moctils.jpg', false),
  ('pizza-nv-2', 'Chicken Cheese Pizza', 'CHICKEN CHEESE PIZZA', 'pizza', 'Pizza', 'Nonveg Pizzas Time', 149, 'non-veg', true, 'Abundant diced chicken buried under extra molten mozzarella cheese.', '', 141, 'card-1-pizzas-pastas-moctils.jpg', false),
  ('pizza-nv-3', 'Chicken BBQ Pizza', 'CHICKEN BBQ PIZZA', 'pizza', 'Pizza', 'Nonveg Pizzas Time', 159, 'non-veg', true, 'Smoky barbecue glazed chicken, red onions, and gooey cheese on a crispy crust.', '', 142, 'card-1-pizzas-pastas-moctils.jpg', false),
  ('pizza-nv-4', 'Peri Peri Chicken Pizza', 'PERI PERI CHICKEN PIZZA', 'pizza', 'Pizza', 'Nonveg Pizzas Time', 159, 'non-veg', true, 'Zesty Peri Peri chicken chunks with capsicum and spicy chilli flakes.', '', 143, 'card-1-pizzas-pastas-moctils.jpg', false),
  ('pizza-nv-5', 'Chicken Tikka Pizza Double', 'CHICKEN TIKA PIZZA DOUBLE', 'pizza', 'Pizza', 'Nonveg Pizzas Time', 159, 'non-veg', true, 'Double loaded roasted tandoori chicken tikka pieces with onions and capsicum.', '', 144, 'card-1-pizzas-pastas-moctils.jpg', false),
  ('pizza-nv-6', 'Cheese Chicken Pizza', 'CHEESE CHICKEN PIZZA', 'pizza', 'Pizza', 'Nonveg Pizzas Time', 169, 'non-veg', true, 'Premium cheese blend covering savory seasoned chicken chunks.', '', 145, 'card-1-pizzas-pastas-moctils.jpg', false),
  ('pizza-nv-7', 'MK Spl Chicken Pizza', 'MK SPL CHICKEN PIZZA', 'pizza', 'Pizza', 'Nonveg Pizzas Time', 169, 'non-veg', true, 'House special pizza loaded with BBQ chicken, tikka chicken, olives, and double cheese.', '', 146, 'card-1-pizzas-pastas-moctils.jpg', false),
  ('burger-1', 'Classic Veg Burger', 'CLASSIC VEG BURGER', 'burgers-sandwiches', 'Burgers & Sandwiches', 'Burgers Item', 79, 'veg', true, 'Crispy seasoned vegetable patty with fresh tomatoes, lettuce, and creamy sauce.', '', 147, 'card-3-shakes-burgers-lassi-juices.jpg', false),
  ('burger-2', 'Cheesy Paneer Burger', 'CHEESY PANEER BURGER', 'burgers-sandwiches', 'Burgers & Sandwiches', 'Burgers Item', 89, 'veg', true, 'Golden fried spiced paneer patty topped with melted cheese slice and mayo.', '', 148, 'card-3-shakes-burgers-lassi-juices.jpg', false),
  ('burger-3', 'Classic Chicken Burger', 'CLASSIC CHICKEN BURGER', 'burgers-sandwiches', 'Burgers & Sandwiches', 'Burgers Item', 89, 'non-veg', true, 'Juicy chicken patty grilled with onions, tomatoes, and house dressing.', '', 149, 'card-3-shakes-burgers-lassi-juices.jpg', false),
  ('burger-4', 'Crunch Chicken Burger', 'CRUNCH CHICKEN BURGER', 'burgers-sandwiches', 'Burgers & Sandwiches', 'Burgers Item', 99, 'non-veg', true, 'Extra crispy crumb-fried chicken fillet with spicy mayonnaise and crisp lettuce.', '', 150, 'card-3-shakes-burgers-lassi-juices.jpg', false),
  ('burger-5', 'MK Spl Chicken Burger', 'MK SPL CHICKEN BURGER', 'burgers-sandwiches', 'Burgers & Sandwiches', 'Burgers Item', 109, 'non-veg', true, 'Signature double-decker chicken burger with melted cheese and chef''s secret sauce.', '', 151, 'card-3-shakes-burgers-lassi-juices.jpg', false),
  ('sandwich-1', 'Veg Cheese Sandwich', 'VEG CHEESE SANDWICH', 'burgers-sandwiches', 'Burgers & Sandwiches', 'Sandwich Item', 69, 'veg', true, 'Toasted bread stuffed with cucumbers, tomatoes, bell peppers, and melted cheese.', '', 152, 'card-3-shakes-burgers-lassi-juices.jpg', false),
  ('sandwich-2', 'Paneer Sandwich', 'PANEER SANDWICH', 'burgers-sandwiches', 'Burgers & Sandwiches', 'Sandwich Item', 79, 'veg', true, 'Grilled sandwich loaded with spiced cottage cheese and tangy green chutney.', '', 153, 'card-3-shakes-burgers-lassi-juices.jpg', false),
  ('sandwich-3', 'Egg Sandwich', 'EGG SANDWICH', 'burgers-sandwiches', 'Burgers & Sandwiches', 'Sandwich Item', 79, 'egg', true, 'Toasted bread filled with seasoned egg omelette or creamy boiled egg filling.', '', 154, 'card-3-shakes-burgers-lassi-juices.jpg', false),
  ('sandwich-4', 'Chicken Cheese Sandwich', 'CHICKEN CHEESE SANDWICH', 'burgers-sandwiches', 'Burgers & Sandwiches', 'Sandwich Item', 89, 'non-veg', true, 'Tender spiced chicken shreds layered with generous melted cheese inside grilled bread.', '', 155, 'card-3-shakes-burgers-lassi-juices.jpg', false),
  ('sandwich-5', 'MK Spl Veg Sandwich', 'MK SPL VEG SANDWICH', 'burgers-sandwiches', 'Burgers & Sandwiches', 'Sandwich Item', 89, 'veg', true, 'Triple-layered club sandwich with paneer, sweet corn, veggies, and herb butter.', '', 156, 'card-3-shakes-burgers-lassi-juices.jpg', false),
  ('bits-veg-1', 'Veg Nuggets', 'VEG NUGGETS', 'bits-nuggets', 'Bits & Nuggets', 'Veg Bits', 100, 'veg', true, 'Crispy golden crumb-coated vegetable nuggets served with tangy dip.', '', 157, 'card-1-pizzas-pastas-moctils.jpg', false),
  ('bits-veg-2', 'Paneer Fingers', 'PANEER FINGERS', 'bits-nuggets', 'Bits & Nuggets', 'Veg Bits', 100, 'veg', true, 'Crisp seasoned cottage cheese fingers served with mint mayo dip.', '', 158, 'card-1-pizzas-pastas-moctils.jpg', false),
  ('bits-nv-1', 'Chicken Nuggets', 'CHICKEN NUGGETS', 'bits-nuggets', 'Bits & Nuggets', 'Non Veg Bits', 120, 'non-veg', true, 'Bite-sized chicken nuggets fried crisp on outside, juicy and tender inside.', '', 159, 'card-1-pizzas-pastas-moctils.jpg', false),
  ('bits-nv-2', 'Chicken Popcorns', 'CHICKEN POP CORNS', 'bits-nuggets', 'Bits & Nuggets', 'Non Veg Bits', 120, 'non-veg', true, 'Crunchy bite-sized chicken pops tossed in aromatic seasoning powder.', '', 160, 'card-1-pizzas-pastas-moctils.jpg', false),
  ('bits-nv-3', 'Chicken Fingers', 'CHICKEN FINGGERS', 'bits-nuggets', 'Bits & Nuggets', 'Non Veg Bits', 120, 'non-veg', true, 'Tender strips of chicken breast coated in seasoned breadcrumbs and deep-fried.', '', 161, 'card-1-pizzas-pastas-moctils.jpg', false),
  ('soup-veg-1', 'Tomato Cream Soup', 'TOMOTO CREAM SOUP', 'soups', 'Soups', 'Veg Soups', 79, 'veg', true, 'Rich and velvety ripe tomato soup topped with fresh cream and crispy croutons.', '', 162, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('soup-veg-2', 'Veg Sweet Corn Soup', 'VEG SWEET CORN SOUP', 'soups', 'Soups', 'Veg Soups', 79, 'veg', true, 'Comforting Chinese broth filled with sweet corn kernels and minced vegetables.', '', 163, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('soup-veg-3', 'Lemon Coriander Soup', 'LEMON CORIANDER SOUP', 'soups', 'Soups', 'Veg Soups', 79, 'veg', true, 'Clear vegetable broth infused with refreshing lemon juice and fresh coriander leaves.', '', 164, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('soup-veg-4', 'Veg Manchow Soup', 'VEG MANCHOW SOUP', 'soups', 'Soups', 'Veg Soups', 89, 'veg', true, 'Dark, spicy, and garlicky vegetable soup topped with crispy fried noodles.', '', 165, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('soup-veg-5', 'MK Spl Veg Soup', 'MK SPL VEG SOUP', 'soups', 'Soups', 'Veg Soups', 89, 'veg', true, 'Chef''s signature spicy vegetable soup simmered with fine exotic greens.', '', 166, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('soup-nv-1', 'Sweet Corn Chicken Soup', 'SWEET CORN CHICKEN SOUP', 'soups', 'Soups', 'Non Veg Soups', 89, 'non-veg', true, 'Soothing golden soup with crushed sweet corn and tender chicken shreds.', '', 167, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('soup-nv-2', 'Hot & Sour Chicken Soup', 'HOT & SOUR CHICKEN SOUP', 'soups', 'Soups', 'Non Veg Soups', 89, 'non-veg', true, 'Classic spicy and tangy chicken soup with black pepper, mushrooms, and egg drops.', '', 168, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('soup-nv-3', 'Manchow Chicken Soup', 'MANCHO CHICKEN SOUP', 'soups', 'Soups', 'Non Veg Soups', 89, 'non-veg', true, 'Spicy dark broth loaded with shredded chicken, garlic, ginger, and fried noodles.', '', 169, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('soup-nv-4', 'Lemon Coriander Chicken Soup', 'LEMON CORIANDER CHICKEN SOUP', 'soups', 'Soups', 'Non Veg Soups', 89, 'non-veg', true, 'Zesty clear chicken broth scented with fresh green coriander and lemon squeeze.', '', 170, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('soup-nv-5', 'MK Spl Chicken Soup', 'MK SPL CHICKEN SOUP', 'soups', 'Soups', 'Non Veg Soups', 99, 'non-veg', true, 'House special rich chicken soup crafted with bone broth and delicate spices.', '', 171, 'card-5-biryani-fried-rice-noodles-soups.jpg', false),
  ('shake-thick-1', 'Chocolate Thickshake', 'CHOCOLATE THICKSHAKE', 'shakes-beverages', 'Shakes & Beverages', 'Thickshakes', 129, 'veg', true, 'Ultra-rich thick blended chocolate ice cream shake topped with chocolate syrup.', '', 172, 'card-3-shakes-burgers-lassi-juices.jpg', false),
  ('shake-thick-2', 'Butterscotch Thickshake', 'BUTTERSCOTCH THICKSHAKE', 'shakes-beverages', 'Shakes & Beverages', 'Thickshakes', 129, 'veg', true, 'Creamy butterscotch ice cream shake with crunchy praline bits.', '', 173, 'card-3-shakes-burgers-lassi-juices.jpg', false),
  ('shake-thick-3', 'Mango Thickshake', 'MANGO THICKSHAKE', 'shakes-beverages', 'Shakes & Beverages', 'Thickshakes', 139, 'veg', true, 'Tropical Alphonso mango pulp churned with rich dairy cream.', '', 174, 'card-3-shakes-burgers-lassi-juices.jpg', false),
  ('shake-thick-4', 'Oreo Thickshake', 'OREO THICKSHAKE', 'shakes-beverages', 'Shakes & Beverages', 'Thickshakes', 149, 'veg', true, 'Crushed Oreo cookies blended thick with vanilla ice cream.', '', 175, 'card-3-shakes-burgers-lassi-juices.jpg', false),
  ('shake-thick-5', 'Kitkat Thickshake', 'KITKAT THICKSHAKE', 'shakes-beverages', 'Shakes & Beverages', 'Thickshakes', 149, 'veg', true, 'Crispy KitKat wafer bars blended into a decadent chocolate thickshake.', '', 176, 'card-3-shakes-burgers-lassi-juices.jpg', false),
  ('shake-thick-6', 'Banana Thickshake', 'BANANA THICKSHAKE', 'shakes-beverages', 'Shakes & Beverages', 'Thickshakes', 149, 'veg', true, 'Fresh sweet bananas blended with rich vanilla ice cream and full cream milk.', '', 177, 'card-3-shakes-burgers-lassi-juices.jpg', false),
  ('shake-thick-7', 'Dairy Milk Thickshake', 'DAIRY MILK THICKSHAKE', 'shakes-beverages', 'Shakes & Beverages', 'Thickshakes', 149, 'veg', true, 'Classic Cadbury Dairy Milk chocolate blended velvety thick.', '', 178, 'card-3-shakes-burgers-lassi-juices.jpg', false),
  ('shake-thick-8', 'Belgium Thickshake', 'BELGIUM THICKSHAKE', 'shakes-beverages', 'Shakes & Beverages', 'Thickshakes', 149, 'veg', true, 'Dark premium Belgian cocoa blended with rich chocolate ice cream.', '', 179, 'card-3-shakes-burgers-lassi-juices.jpg', false),
  ('shake-thick-9', 'Nutella Thickshake', 'NUTELLA THICKSHAKE', 'shakes-beverages', 'Shakes & Beverages', 'Thickshakes', 149, 'veg', true, 'Creamy hazelnut Nutella spread blended into thick frozen bliss.', '', 180, 'card-3-shakes-burgers-lassi-juices.jpg', false),
  ('shake-milk-1', 'Vanilla Milkshake', 'VANNILA MILK SHAKE', 'shakes-beverages', 'Shakes & Beverages', 'Milkshakes', 59, 'veg', true, 'Classic chilled milkshake made with pure vanilla essence.', '', 181, 'card-3-shakes-burgers-lassi-juices.jpg', false),
  ('shake-milk-2', 'Strawberry Milkshake', 'STRAWBERRY MILK SHAKE', 'shakes-beverages', 'Shakes & Beverages', 'Milkshakes', 69, 'veg', true, 'Refreshing pink strawberry shake made with real fruit crush.', '', 182, 'card-3-shakes-burgers-lassi-juices.jpg', false),
  ('shake-milk-3', 'Mango Milkshake', 'MANGO MILK SHAKE', 'shakes-beverages', 'Shakes & Beverages', 'Milkshakes', 69, 'veg', true, 'Sweet mango milkshake crafted with aromatic fruit pulp.', '', 183, 'card-3-shakes-burgers-lassi-juices.jpg', false),
  ('shake-milk-4', 'Butterscotch Milkshake', 'BUTTERSCOTCH MILKSHAKE', 'shakes-beverages', 'Shakes & Beverages', 'Milkshakes', 69, 'veg', true, 'Sweet caramel butterscotch shake with crispy crunchies.', '', 184, 'card-3-shakes-burgers-lassi-juices.jpg', false),
  ('shake-milk-5', 'Banana Milkshake', 'BANANA MILKSHAKE', 'shakes-beverages', 'Shakes & Beverages', 'Milkshakes', 69, 'veg', true, 'Smooth energy-boosting fresh banana milkshake.', '', 185, 'card-3-shakes-burgers-lassi-juices.jpg', false),
  ('shake-milk-6', 'Blackcurrant Milkshake', 'BLACKCURRANT MILKSHAKE', 'shakes-beverages', 'Shakes & Beverages', 'Milkshakes', 69, 'veg', true, 'Tangy and sweet wild blackcurrant milkshake.', '', 186, 'card-3-shakes-burgers-lassi-juices.jpg', false),
  ('shake-milk-7', 'Chocolate Milkshake', 'CHOCOLATE MILKSHAKE', 'shakes-beverages', 'Shakes & Beverages', 'Milkshakes', 69, 'veg', true, 'All-time favorite chocolate milk shake served ice chilled.', '', 187, 'card-3-shakes-burgers-lassi-juices.jpg', false),
  ('shake-milk-8', 'Belgium Chocolate Milkshake', 'BELGIUMCHOCOLATE MILKSHAKE', 'shakes-beverages', 'Shakes & Beverages', 'Milkshakes', 89, 'veg', true, 'Rich dark Belgian chocolate flavor blended smoothly with chilled milk.', '', 188, 'card-3-shakes-burgers-lassi-juices.jpg', false),
  ('shake-milk-9', 'Nutella Milkshake', 'NUTELLA MILKSHAKE', 'shakes-beverages', 'Shakes & Beverages', 'Milkshakes', 89, 'veg', true, 'Hazelnut spread shaken with creamy milk and chocolate drizzle.', '', 189, 'card-3-shakes-burgers-lassi-juices.jpg', false),
  ('shake-milk-10', 'Oreo Milkshake', 'OREO MILKSHAKE', 'shakes-beverages', 'Shakes & Beverages', 'Milkshakes', 89, 'veg', true, 'Crunchy Oreo cookies crushed and blended with milk.', '', 190, 'card-3-shakes-burgers-lassi-juices.jpg', false),
  ('shake-milk-11', 'Kitkat Milkshake', 'KITKAT MILKSHAKE', 'shakes-beverages', 'Shakes & Beverages', 'Milkshakes', 89, 'veg', true, 'Delicious KitKat fingers blended into a creamy milkshake.', '', 191, 'card-3-shakes-burgers-lassi-juices.jpg', false),
  ('shake-milk-12', 'Dairy Milk Milkshake', 'DAIRYMILK MILKSHAKE', 'shakes-beverages', 'Shakes & Beverages', 'Milkshakes', 89, 'veg', true, 'Silky Dairy Milk chocolate shaken with milk.', '', 192, 'card-3-shakes-burgers-lassi-juices.jpg', false),
  ('shake-df-1', 'Badam Milk', 'BADAM MILK', 'shakes-beverages', 'Shakes & Beverages', 'Dry Fruit Shakes', 69, 'veg', true, 'Traditional chilled almond milk with saffron notes and almond slivers.', '', 193, 'card-3-shakes-burgers-lassi-juices.jpg', false),
  ('shake-df-2', 'Badam Milk Shake', 'BADAM MILK SHAEK', 'shakes-beverages', 'Shakes & Beverages', 'Dry Fruit Shakes', 69, 'veg', true, 'Creamy almond shake with rich nuts and crushed ice.', '', 194, 'card-3-shakes-burgers-lassi-juices.jpg', false),
  ('shake-df-3', 'Pista Shake', 'PISTA SHAEK', 'shakes-beverages', 'Shakes & Beverages', 'Dry Fruit Shakes', 69, 'veg', true, 'Green pistachio nutty delight infused with fragrant cardamom.', '', 195, 'card-3-shakes-burgers-lassi-juices.jpg', false),
  ('shake-df-4', 'Kaju Badam Shake', 'KAJU BADAM SHAEK', 'shakes-beverages', 'Shakes & Beverages', 'Dry Fruit Shakes', 69, 'veg', true, 'Nutritious shake packed with rich cashews and wholesome almonds.', '', 196, 'card-3-shakes-burgers-lassi-juices.jpg', false),
  ('shake-df-5', 'Anjeer Badam Shake', 'ANJEER BADAM SHAEK', 'shakes-beverages', 'Shakes & Beverages', 'Dry Fruit Shakes', 69, 'veg', true, 'Natural dried figs (anjeer) and almonds blended with cold milk.', '', 197, 'card-3-shakes-burgers-lassi-juices.jpg', false),
  ('shake-df-6', 'Kesari Badam Shake', 'KESARI BADAM SHAEK', 'shakes-beverages', 'Shakes & Beverages', 'Dry Fruit Shakes', 79, 'veg', true, 'Royal saffron-infused almond shake rich with Kashmiri kesar.', '', 198, 'card-3-shakes-burgers-lassi-juices.jpg', false),
  ('shake-df-7', 'Dates Shake', 'DATES SHAEK', 'shakes-beverages', 'Shakes & Beverages', 'Dry Fruit Shakes', 99, 'veg', true, 'Wholesome Arabian dates blended into a sweet natural milkshake.', '', 199, 'card-3-shakes-burgers-lassi-juices.jpg', false),
  ('shake-df-8', 'Dry Fruit Banana Shake', 'DRY FRUIT BANANA SHAEK', 'shakes-beverages', 'Shakes & Beverages', 'Dry Fruit Shakes', 99, 'veg', true, 'Power shake combining fresh ripe bananas with mixed dried fruits.', '', 200, 'card-3-shakes-burgers-lassi-juices.jpg', false),
  ('shake-df-9', 'MK Spl Mixed Dry Fruit Shake', 'MK SPL MIXED DRY FRUIT SHAEK', 'shakes-beverages', 'Shakes & Beverages', 'Dry Fruit Shakes', 119, 'veg', true, 'House special shake loaded with cashews, almonds, pistachios, anjeer, and dates.', '', 201, 'card-3-shakes-burgers-lassi-juices.jpg', false),
  ('lassi-1', 'Sweet Lassi', 'SWEET LASSI', 'shakes-beverages', 'Shakes & Beverages', 'Famous Lassi', 49, 'veg', true, 'Thick churned fresh curd sweetened and chilled to perfection.', '', 202, 'card-3-shakes-burgers-lassi-juices.jpg', false),
  ('lassi-2', 'Strawberry Lassi', 'STRAWBERRY LASSI', 'shakes-beverages', 'Shakes & Beverages', 'Famous Lassi', 59, 'veg', true, 'Creamy curd blended with sweet strawberry crush.', '', 203, 'card-3-shakes-burgers-lassi-juices.jpg', false),
  ('lassi-3', 'Mango Lassi', 'MANOG LASSI', 'shakes-beverages', 'Shakes & Beverages', 'Famous Lassi', 59, 'veg', true, 'Classic mango pulp churned with rich sweet yogurt.', '', 204, 'card-3-shakes-burgers-lassi-juices.jpg', false),
  ('lassi-4', 'Dry Fruit Lassi', 'DRY FRUIT LASSI', 'shakes-beverages', 'Shakes & Beverages', 'Famous Lassi', 89, 'veg', true, 'Rich Punjabi lassi topped with roasted dry fruit shavings.', '', 205, 'card-3-shakes-burgers-lassi-juices.jpg', false),
  ('lassi-5', 'Rose Milk', 'ROSE MILK', 'shakes-beverages', 'Shakes & Beverages', 'Famous Lassi', 59, 'veg', true, 'Fragrant sweet rose syrup infused with chilled full cream milk.', '', 206, 'card-3-shakes-burgers-lassi-juices.jpg', false),
  ('mocktail-1', 'Sweet Lemonade', 'SWEET LEMONADE', 'mocktails', 'Mocktails', 'Mocktails', 59, 'veg', true, 'Freshly squeezed lemon juice sweetened with sugar syrup and iced soda.', '', 207, 'card-1-pizzas-pastas-moctils.jpg', false),
  ('mocktail-2', 'Salt Lemonade', 'SALT LEMONADE', 'mocktails', 'Mocktails', 'Mocktails', 59, 'veg', true, 'Refreshing lemon soda with black salt and cumin notes.', '', 208, 'card-1-pizzas-pastas-moctils.jpg', false),
  ('mocktail-3', 'Sweet & Salt Lemonade', 'SWEET & SALT LEMONADE', 'mocktails', 'Mocktails', 'Mocktails', 59, 'veg', true, 'Balanced sweet and salty fresh lemon soda.', '', 209, 'card-1-pizzas-pastas-moctils.jpg', false),
  ('mocktail-4', 'Fresh Mint Mojito', 'FRESH MINT MOJITO', 'mocktails', 'Mocktails', 'Mocktails', 59, 'veg', true, 'Muddled fresh garden mint leaves, lime wedges, and sparkling soda.', '', 210, 'card-1-pizzas-pastas-moctils.jpg', false),
  ('mocktail-5', 'Virgin Mojito', 'VIRGIN MOJITO', 'mocktails', 'Mocktails', 'Mocktails', 59, 'veg', true, 'Classic Cuban-style non-alcoholic mojito with lime and mint.', '', 211, 'card-1-pizzas-pastas-moctils.jpg', false),
  ('mocktail-6', 'Green Sea Mojito', 'GREEN SEA MOJITO', 'mocktails', 'Mocktails', 'Mocktails', 59, 'veg', true, 'Cooling emerald green mojito with ocean-fresh citrus flavors.', '', 212, 'card-1-pizzas-pastas-moctils.jpg', false),
  ('mocktail-7', 'Orange Colour Mojito', 'ORENGE COLOUR MOJITO', 'mocktails', 'Mocktails', 'Mocktails', 59, 'veg', true, 'Vibrant zesty orange infused sparkling mint cooler.', '', 213, 'card-1-pizzas-pastas-moctils.jpg', false),
  ('mocktail-8', 'Litchi Mojito', 'LECHI MOJITO', 'mocktails', 'Mocktails', 'Mocktails', 59, 'veg', true, 'Sweet exotic litchi essence combined with crushed mint and fizz.', '', 214, 'card-1-pizzas-pastas-moctils.jpg', false),
  ('mocktail-9', 'Green Apple Mojito', 'GREEN APPLE MOJITO', 'mocktails', 'Mocktails', 'Mocktails', 69, 'veg', true, 'Crisp tart green apple syrup muddled with mint and soda.', '', 215, 'card-1-pizzas-pastas-moctils.jpg', false),
  ('mocktail-10', 'Kiwi Mojito', 'KIWI MOJITO', 'mocktails', 'Mocktails', 'Mocktails', 59, 'veg', true, 'Tropical kiwi flavor with tangy lime and mint leaves.', '', 216, 'card-1-pizzas-pastas-moctils.jpg', false),
  ('mocktail-11', 'Mango Mojito', 'MANGO MOJITO', 'mocktails', 'Mocktails', 'Mocktails', 69, 'veg', true, 'Sweet luscious mango crush shaken with mint and ice.', '', 217, 'card-1-pizzas-pastas-moctils.jpg', false),
  ('mocktail-12', 'Strawberry Mojito', 'STAWBERRY MOJITO', 'mocktails', 'Mocktails', 'Mocktails', 69, 'veg', true, 'Berry-rich sweet strawberry cooler with refreshing mint.', '', 218, 'card-1-pizzas-pastas-moctils.jpg', false),
  ('mocktail-13', 'Blueberry Mojito', 'BLUE BERRY MOJITO', 'mocktails', 'Mocktails', 'Mocktails', 69, 'veg', true, 'Antioxidant-rich ripe blueberry flavor blended into icy fizz.', '', 219, 'card-1-pizzas-pastas-moctils.jpg', false),
  ('mocktail-14', 'Blackcurrant Mojito', 'BLACK CURRANT MOJITO', 'mocktails', 'Mocktails', 'Mocktails', 69, 'veg', true, 'Deep purple blackcurrant syrup with chilled soda and mint.', '', 220, 'card-1-pizzas-pastas-moctils.jpg', false),
  ('mocktail-15', 'Blue Curacao Mojito', 'BLU CURACAO MOJITO', 'mocktails', 'Mocktails', 'Mocktails', 69, 'veg', true, 'Electrifying blue citrus mocktail with bubbly soda and lime.', '', 221, 'card-1-pizzas-pastas-moctils.jpg', false),
  ('mocktail-16', 'Watermelon Mojito', 'WATER MELON MOJITO', 'mocktails', 'Mocktails', 'Mocktails', 69, 'veg', true, 'Hydrating sweet watermelon juice muddled with garden mint.', '', 222, 'card-1-pizzas-pastas-moctils.jpg', false),
  ('mocktail-17', 'Pina Colada Mojito', 'PINA COLADA MOJITO', 'mocktails', 'Mocktails', 'Mocktails', 99, 'veg', true, 'Velvety blend of coconut cream, pineapple juice, and mint freshness.', '', 223, 'card-1-pizzas-pastas-moctils.jpg', false),
  ('juice-1', 'Apple Juice', 'APPLE', 'juices-salads', 'Juices & Salads', 'Fruit Juice', 69, 'veg', true, 'Crisp and refreshing cold-pressed sweet apple juice.', '', 224, 'card-3-shakes-burgers-lassi-juices.jpg', false),
  ('juice-2', 'Orange Juice', 'ORENGE', 'juices-salads', 'Juices & Salads', 'Fruit Juice', 69, 'veg', true, 'Freshly squeezed vitamin-C rich sweet orange juice.', '', 225, 'card-3-shakes-burgers-lassi-juices.jpg', false),
  ('juice-3', 'Pineapple Juice', 'PAINEAPPLE', 'juices-salads', 'Juices & Salads', 'Fruit Juice', 69, 'veg', true, 'Tangy sweet fresh pineapple juice served chilled.', '', 226, 'card-3-shakes-burgers-lassi-juices.jpg', false),
  ('juice-4', 'Muskmelon Juice', 'MUSKMELON', 'juices-salads', 'Juices & Salads', 'Fruit Juice', 69, 'veg', true, 'Fragrant sweet cantaloupe/muskmelon juice.', '', 227, 'card-3-shakes-burgers-lassi-juices.jpg', false),
  ('juice-5', 'Watermelon Juice', 'WATTER MELON', 'juices-salads', 'Juices & Salads', 'Fruit Juice', 69, 'veg', true, 'Pure cooling watermelon juice without added water.', '', 228, 'card-3-shakes-burgers-lassi-juices.jpg', false),
  ('juice-6', 'Chikoo Juice', 'CHIKOO', 'juices-salads', 'Juices & Salads', 'Fruit Juice', 79, 'veg', true, 'Rich and creamy sweet sapodilla (chikoo) shake/juice.', '', 229, 'card-3-shakes-burgers-lassi-juices.jpg', false),
  ('salad-1', 'Custard Fruit Salad', 'CUSTARD FRUIT SALAD', 'juices-salads', 'Juices & Salads', 'Fruit Salad', 79, 'veg', true, 'Assorted freshly cut fruits served in rich vanilla custard sauce.', '', 230, 'card-3-shakes-burgers-lassi-juices.jpg', false),
  ('salad-2', 'Vanilla Fruit Salad', 'VANNELA SALAD', 'juices-salads', 'Juices & Salads', 'Fruit Salad', 89, 'veg', true, 'Crisp seasonal fruit bowl topped with a scoop of vanilla ice cream.', '', 231, 'card-3-shakes-burgers-lassi-juices.jpg', false),
  ('salad-3', 'Mango Masti Salad', 'MANGO MASTI SALAD', 'juices-salads', 'Juices & Salads', 'Fruit Salad', 89, 'veg', true, 'Exotic fruit salad immersed in sweet Alphonso mango cream.', '', 232, 'card-3-shakes-burgers-lassi-juices.jpg', false),
  ('salad-4', 'MK Spl Fruit Salad', 'MK SPL FRUIT SALAD', 'juices-salads', 'Juices & Salads', 'Fruit Salad', 99, 'veg', true, 'Signature fruit platter with premium nuts, honey drizzle, and ice cream scoop.', '', 233, 'card-3-shakes-burgers-lassi-juices.jpg', false),
  ('falooda-1', 'Classic Falooda', 'FALOODA', 'falooda-desserts', 'Falooda & Desserts', 'Falooda Time', 69, 'veg', true, 'Layered rose syrup, sweet sabja basil seeds, falooda sev, chilled milk, and ice cream.', '', 234, 'card-3-shakes-burgers-lassi-juices.jpg', false),
  ('falooda-2', 'Mango Dreams Falooda', 'MANGO DREAM,S FALOODA', 'falooda-desserts', 'Falooda & Desserts', 'Falooda Time', 79, 'veg', true, 'Mango-flavored falooda layered with mango pulp, jelly, basil seeds, and mango ice cream.', '', 235, 'card-3-shakes-burgers-lassi-juices.jpg', false),
  ('falooda-3', 'Kesar Pista Falooda', 'KESAR PISTA FALOODA', 'falooda-desserts', 'Falooda & Desserts', 'Falooda Time', 99, 'veg', true, 'Royal saffron and pistachio falooda with chopped dry fruits and rich kulfi ice cream.', '', 236, 'card-3-shakes-burgers-lassi-juices.jpg', false),
  ('falooda-4', 'MK Spl Falooda', 'MK SPL FALOODA', 'falooda-desserts', 'Falooda & Desserts', 'Falooda Time', 109, 'veg', true, 'Chef''s grand falooda glass with double ice cream scoops, dry fruits, cherries, and jelly.', '', 237, 'card-3-shakes-burgers-lassi-juices.jpg', false),
  ('fries-1', 'French Fries Salted', 'FRENCH FRIES SALTED', 'fries', 'French Fries', 'Favorite Fries', 89, 'veg', true, 'Classic golden crisp potato fries sprinkled with fine sea salt.', '', 238, 'card-3-shakes-burgers-lassi-juices.jpg', false),
  ('fries-2', 'French Fries Masala', 'FRENCH FRIES MASALA', 'fries', 'French Fries', 'Favorite Fries', 99, 'veg', true, 'Crispy fries tossed in aromatic spicy chatpata Indian masala.', '', 239, 'card-3-shakes-burgers-lassi-juices.jpg', false),
  ('fries-3', 'French Fries Peri Peri', 'FRENCH FRIES PERI PERI', 'fries', 'French Fries', 'Favorite Fries', 109, 'veg', true, 'Crunchy fries shaken in spicy Peri-Peri seasoning powder.', '', 240, 'card-3-shakes-burgers-lassi-juices.jpg', false)
ON CONFLICT (id) DO UPDATE SET
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
