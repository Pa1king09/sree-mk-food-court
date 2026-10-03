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
