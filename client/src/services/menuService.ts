import { MenuApiResponse, MenuItem, Category, RestaurantInfo } from '../types/menu';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import initialMenuFallback from '../data/initial-menu.json';

const CACHE_KEY = 'sree_mk_cached_menu_data';

export async function fetchMenuData(): Promise<MenuApiResponse> {
  // 1. Try Supabase first if configured (Cloud-hosted public database)
  if (isSupabaseConfigured && supabase) {
    try {
      const [catsRes, itemsRes, settingsRes] = await Promise.all([
        supabase.from('categories').select('*').order('display_order', { ascending: true }),
        supabase.from('menu_items').select('*').order('display_order', { ascending: true }),
        supabase.from('restaurant_settings').select('value').eq('key', 'restaurant_info').maybeSingle()
      ]);

      if (itemsRes.data && itemsRes.data.length > 0) {
        const categories: Category[] = (catsRes.data || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          icon: c.icon || 'Utensils',
          displayOrder: c.display_order
        }));

        const items: MenuItem[] = itemsRes.data.map((it: any) => ({
          id: it.id,
          name: it.name,
          originalName: it.original_name,
          categoryId: it.category_id,
          category: it.category_name,
          subcategory: it.subcategory || '',
          price: Number(it.price),
          type: it.type as any,
          availability: it.availability !== false,
          description: it.description || '',
          imageUrl: it.image_url || '',
          displayOrder: it.display_order,
          sourceCard: it.source_card || '',
          needsVerification: Boolean(it.needs_verification)
        }));

        const restaurant: RestaurantInfo = settingsRes.data?.value || initialMenuFallback.restaurant;

        const result: MenuApiResponse = {
          success: true,
          restaurant,
          categories,
          items,
          count: items.length,
          lastUpdated: new Date().toISOString()
        };

        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(result));
        } catch (e) {
          console.warn('LocalStorage save error:', e);
        }

        return result;
      }
    } catch (err) {
      console.warn('Supabase fetch failed, falling back to local/cached sources:', err);
    }
  }

  // 2. Try Local Express API (if running locally)
  try {
    const response = await fetch('/api/menu', {
      headers: { 'Accept': 'application/json' },
      cache: 'no-cache'
    });

    if (response.ok) {
      const data: MenuApiResponse = await response.json();
      if (data && data.items && data.items.length > 0) {
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        } catch (e) {}
        return data;
      }
    }
  } catch (e) {
    // API not running or unreachable
  }

  // 3. Try LocalStorage cached menu
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed: MenuApiResponse = JSON.parse(cached);
      if (parsed && parsed.items && parsed.items.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}

  // 4. Guaranteed offline fallback from bundled initial-menu.json (240 verified items)
  const fallbackCategories: Category[] = (initialMenuFallback.categories || []).map((c: any) => ({
    id: c.id,
    name: c.name,
    icon: c.icon,
    displayOrder: c.order || 0
  }));

  const fallbackItems: MenuItem[] = (initialMenuFallback.items || []).map((it: any) => ({
    id: it.id,
    name: it.name,
    originalName: it.originalName,
    categoryId: it.categoryId,
    category: it.category,
    subcategory: it.subcategory,
    price: it.price,
    type: it.type as any,
    availability: it.availability !== false,
    description: it.description,
    imageUrl: it.imageUrl || it.image,
    displayOrder: it.displayOrder,
    sourceCard: it.sourceCard,
    needsVerification: it.needsVerification
  }));

  return {
    success: true,
    restaurant: initialMenuFallback.restaurant as RestaurantInfo,
    categories: fallbackCategories,
    items: fallbackItems,
    count: fallbackItems.length,
    lastUpdated: new Date().toISOString()
  };
}

export function formatPrice(price: number): string {
  return `₹${price}`;
}
