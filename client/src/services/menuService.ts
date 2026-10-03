import { MenuApiResponse, MenuItem, Category, RestaurantInfo } from '../types/menu';
import initialMenuFallback from '../data/initial-menu.json';

const CACHE_KEY = 'sree_mk_cached_menu_data';

export async function fetchMenuData(): Promise<MenuApiResponse> {
  try {
    const response = await fetch('/api/menu', {
      headers: { 'Accept': 'application/json' },
      cache: 'no-cache'
    });

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }

    const data: MenuApiResponse = await response.json();
    if (data && data.items && data.items.length > 0) {
      // Save freshest data to localStorage for 100% offline persistence
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      } catch (e) {
        console.warn('LocalStorage quota or unavailable:', e);
      }
      return data;
    }
    throw new Error('Empty menu returned from server');
  } catch (err) {
    console.warn('Network / API fetch failed, checking localStorage fallback:', err);

    // 1. Try LocalStorage
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed: MenuApiResponse = JSON.parse(cached);
        if (parsed && parsed.items && parsed.items.length > 0) {
          console.log('Successfully loaded menu from browser offline localStorage cache.');
          return parsed;
        }
      }
    } catch (e) {}

    // 2. Try Bundled JSON fallback
    console.log('Falling back to bundled initial-menu.json');
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
}

export function formatPrice(price: number): string {
  return `₹${price}`;
}
