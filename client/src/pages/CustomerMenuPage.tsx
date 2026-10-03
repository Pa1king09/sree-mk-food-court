import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from '../components/Navbar';
import { HeroBanner } from '../components/HeroBanner';
import { SearchBar } from '../components/SearchBar';
import { CategoryNav } from '../components/CategoryNav';
import { MenuItemCard } from '../components/MenuItemCard';
import { MenuItemListRow } from '../components/MenuItemListRow';
import { ShareQrModal } from '../components/ShareQrModal';
import { OrderCalculatorBar } from '../components/OrderCalculatorBar';
import { OrderSummaryModal } from '../components/OrderSummaryModal';
import { fetchMenuData } from '../services/menuService';
import { searchMenuItems } from '../services/searchService';
import { MenuItem, Category, RestaurantInfo, FoodType, SelectedOrderItem } from '../types/menu';
import { ArrowUp, UtensilsCrossed, AlertTriangle, RefreshCw } from 'lucide-react';

interface CustomerMenuPageProps {
  onOpenAdmin: () => void;
}

const STORAGE_ORDER_KEY = 'sree_mk_selected_order';

export const CustomerMenuPage: React.FC<CustomerMenuPageProps> = ({ onOpenAdmin }) => {
  const [restaurant, setRestaurant] = useState<RestaurantInfo>({
    name: "Sree MK Food Court",
    tagline: "Good Food. Good Mood.",
    phones: ["+91 9391046296", "+91 8341189085"],
    address: "Sree MK Food Court Restaurant",
    viewOnlyNotice: "This is a view-only digital menu. Please place your order directly with the service staff.",
    currencySymbol: "₹"
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<'all' | FoodType>('all');
  const [availableOnly, setAvailableOnly] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');

  // Interactive Order Selector / Bill Calculator State
  const [selectedItems, setSelectedItems] = useState<SelectedOrderItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ORDER_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);

  // Modals state
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);

  // Persist selected items to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ORDER_KEY, JSON.stringify(selectedItems));
    } catch (e) {}
  }, [selectedItems]);

  // Load menu data
  const loadMenu = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchMenuData();
      if (res.restaurant) setRestaurant(res.restaurant);
      if (res.categories) setCategories(res.categories);
      if (res.items) setItems(res.items);
    } catch (err: any) {
      console.error('Failed to load menu:', err);
      setError('Could not load menu. Tap retry to reload from local storage.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenu();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Category counts
  const categoryItemCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of items) {
      counts[item.categoryId] = (counts[item.categoryId] || 0) + 1;
    }
    return counts;
  }, [items]);

  // Fast map of selected item quantities
  const itemQuantities = useMemo(() => {
    const map = new Map<string, number>();
    for (const sel of selectedItems) {
      map.set(sel.item.id, sel.quantity);
    }
    return map;
  }, [selectedItems]);

  // Order calculation summary
  const totalSelectedQuantity = useMemo(() => {
    return selectedItems.reduce((acc, curr) => acc + curr.quantity, 0);
  }, [selectedItems]);

  const totalCalculatedAmount = useMemo(() => {
    return selectedItems.reduce((acc, curr) => acc + curr.quantity * curr.item.price, 0);
  }, [selectedItems]);

  // Order Handlers
  const handleAddToCart = (item: MenuItem) => {
    setSelectedItems((prev) => {
      const idx = prev.findIndex((i) => i.item.id === item.id);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx].quantity += 1;
        return copy;
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (itemId: string, delta: number) => {
    setSelectedItems((prev) => {
      return prev
        .map((i) => {
          if (i.item.id === itemId) {
            return { ...i, quantity: i.quantity + delta };
          }
          return i;
        })
        .filter((i) => i.quantity > 0);
    });
  };

  const handleRemoveItem = (itemId: string) => {
    setSelectedItems((prev) => prev.filter((i) => i.item.id !== itemId));
  };

  const handleClearAll = () => {
    setSelectedItems([]);
  };

  // Filtered items logic with spelling-aware search & ranking
  const filteredItems = useMemo(() => {
    // 1. Initial candidates filtered by dietary type & availability
    let candidates = items.filter((item) => {
      // Dietary type filter
      if (selectedType !== 'all' && item.type !== selectedType) {
        return false;
      }

      // Availability filter
      if (availableOnly && !item.availability) {
        return false;
      }

      return true;
    });

    // 2. If search query present, use spelling-aware fuzzy search across all items
    if (searchQuery.trim().length > 0) {
      return searchMenuItems(candidates, searchQuery);
    }

    // 3. Otherwise, filter by category tab if selected
    if (selectedCategoryId !== 'all') {
      return candidates.filter((item) => item.categoryId === selectedCategoryId);
    }

    return candidates;
  }, [items, selectedCategoryId, selectedType, availableOnly, searchQuery]);

  // Group filtered items for structured layout
  const groupedSections = useMemo(() => {
    // When actively searching, show all matching results together ordered by relevance
    if (searchQuery.trim().length > 0) {
      return [
        {
          category: {
            id: 'search-results',
            name: `Matches for "${searchQuery}"`,
            displayOrder: 0
          },
          items: filteredItems
        }
      ];
    }

    // Default: Group by Category
    const map = new Map<string, { category: Category; items: MenuItem[] }>();

    for (const item of filteredItems) {
      if (!map.has(item.categoryId)) {
        const cat = categories.find((c) => c.id === item.categoryId) || {
          id: item.categoryId,
          name: item.category || 'Specialties',
          displayOrder: 999
        };
        map.set(item.categoryId, { category: cat, items: [] });
      }
      map.get(item.categoryId)!.items.push(item);
    }

    return Array.from(map.values()).sort(
      (a, b) => (a.category.displayOrder || 0) - (b.category.displayOrder || 0)
    );
  }, [filteredItems, categories, searchQuery]);

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    // When user types in search, ensure category is set to 'all' so results aren't blocked
    if (q.trim().length > 0 && selectedCategoryId !== 'all') {
      setSelectedCategoryId('all');
    }
  };

  const handleSearchSubmit = () => {
    // 1. Dismiss mobile keyboard
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    // 2. Smoothly scroll down to results section
    setTimeout(() => {
      const el = document.getElementById('menu-content-anchor');
      if (el) {
        const yOffset = -140; // account for sticky header & search bar
        const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      }
    }, 60);
  };

  const handleSelectRecommendation = (dish: MenuItem) => {
    setSearchQuery(dish.name);
    setSelectedCategoryId('all');

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    setTimeout(() => {
      const dishEl = document.getElementById(`dish-${dish.id}`);
      if (dishEl) {
        dishEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        dishEl.classList.add('ring-4', 'ring-gold-400');
        setTimeout(() => {
          dishEl.classList.remove('ring-4', 'ring-gold-400');
        }, 2200);
      } else {
        const el = document.getElementById('menu-content-anchor');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }, 100);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-forest-900 text-cream-50 flex flex-col selection:bg-gold-500 selection:text-forest-950 pb-24">
      
      {/* Sticky Navigation */}
      <Navbar
        onOpenQr={() => setShowQrModal(true)}
        onOpenAdmin={onOpenAdmin}
        isOnline={isOnline}
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
        selectedCount={totalSelectedQuantity}
        onOpenBill={() => setShowSummaryModal(true)}
      />

      {/* Hero Header */}
      <HeroBanner restaurant={restaurant} totalItems={items.length} />

      {/* Search & Dietary Filters */}
      <SearchBar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        availableOnly={availableOnly}
        onToggleAvailableOnly={() => setAvailableOnly(!availableOnly)}
        filteredCount={filteredItems.length}
        recommendations={filteredItems}
        onSelectRecommendation={handleSelectRecommendation}
        onAddToCart={handleAddToCart}
        onUpdateQuantity={handleUpdateQuantity}
        itemQuantities={itemQuantities}
        onSearchSubmit={handleSearchSubmit}
      />

      {/* Horizontal Category Nav */}
      <CategoryNav
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={setSelectedCategoryId}
        categoryItemCounts={categoryItemCounts}
      />

      {/* Main Content Area */}
      <main id="menu-content-anchor" className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        
        {/* Loading State */}
        {loading && (
          <div className="py-20 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-gold-300 font-medium">Loading delicious menu...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="max-w-md mx-auto my-12 p-6 rounded-2xl bg-forest-950 border border-red-500/50 text-center space-y-4 shadow-xl">
            <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
            <h3 className="text-lg font-bold text-red-300">Menu Offline Notice</h3>
            <p className="text-xs text-cream-200">{error}</p>
            <button
              onClick={loadMenu}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-gold-500 hover:bg-gold-400 text-forest-950 font-bold rounded-lg text-xs transition"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Load</span>
            </button>
          </div>
        )}

        {/* Empty Search / Filter Result State */}
        {!loading && !error && filteredItems.length === 0 && (
          <div className="py-16 text-center max-w-md mx-auto space-y-3">
            <div className="w-16 h-16 rounded-full bg-forest-800/80 border border-forest-700 flex items-center justify-center mx-auto text-gold-400">
              <UtensilsCrossed className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-cream-100">No dishes found</h3>
            <p className="text-xs text-cream-300 leading-relaxed">
              We couldn't find any dishes matching "{searchQuery}". Try clearing filters or searching for biryani, noodles, starters, or shakes.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategoryId('all');
                setSelectedType('all');
                setAvailableOnly(false);
              }}
              className="mt-3 px-4 py-2 bg-forest-800 hover:bg-forest-700 text-gold-300 border border-gold-500/40 rounded-xl text-xs font-semibold transition"
            >
              Reset All Filters
            </button>
          </div>
        )}

        {/* Category Sections & Items */}
        {!loading && !error && groupedSections.map((section) => (
          <section key={section.category.id} className="mb-10 scroll-mt-36" id={`sec-${section.category.id}`}>
            
            {/* Section Category Header */}
            <div className="flex items-center justify-between border-b border-gold-600/30 pb-2.5 mb-4">
              <div className="flex items-center space-x-2.5">
                <span className="w-2.5 h-6 bg-gold-500 rounded-sm" />
                <h2 className="text-lg sm:text-2xl font-serif font-bold text-gold-300 tracking-wide">
                  {section.category.name}
                </h2>
                <span className="text-xs font-semibold text-cream-300 bg-forest-800 px-2 py-0.5 rounded-full border border-forest-700">
                  {section.items.length}
                </span>
              </div>
            </div>

            {/* Render Items: Grid Cards or Compact List */}
            {viewMode === 'cards' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                {section.items.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    quantity={itemQuantities.get(item.id) || 0}
                    onAddToCart={handleAddToCart}
                    onUpdateQuantity={handleUpdateQuantity}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {section.items.map((item) => (
                  <MenuItemListRow
                    key={item.id}
                    item={item}
                    quantity={itemQuantities.get(item.id) || 0}
                    onAddToCart={handleAddToCart}
                    onUpdateQuantity={handleUpdateQuantity}
                  />
                ))}
              </div>
            )}

          </section>
        ))}

      </main>

      {/* Floating Order Calculator Bar (Appears when items are selected) */}
      <OrderCalculatorBar
        totalItems={totalSelectedQuantity}
        totalAmount={totalCalculatedAmount}
        onOpenSummary={() => setShowSummaryModal(true)}
      />

      {/* Order Summary & Bill Calculation Modal */}
      {showSummaryModal && (
        <OrderSummaryModal
          selectedItems={selectedItems}
          restaurant={restaurant}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onClearAll={handleClearAll}
          onClose={() => setShowSummaryModal(false)}
        />
      )}

      {/* Restaurant Footer */}
      <footer className="bg-forest-950 border-t border-forest-800/80 py-8 px-4 text-center mt-12">
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="flex items-center justify-center space-x-2 text-gold-400 font-serif font-bold text-lg">
            <span>SREE MK FOOD COURT</span>
          </div>
          <p className="text-xs text-gold-300/80 italic font-serif">
            Good Food. Good Mood.
          </p>
          <div className="flex justify-center space-x-4 text-xs text-cream-200">
            {restaurant.phones.map((phone, idx) => (
              <a key={idx} href={`tel:${phone.replace(/\s+/g, '')}`} className="hover:text-gold-300 underline">
                {phone}
              </a>
            ))}
          </div>
          <p className="text-[11px] text-cream-400 pt-2">
            Local Offline QR Menu • Runs entirely on the restaurant's local Wi-Fi network without requiring internet.
          </p>
        </div>
      </footer>

      {/* Floating Scroll To Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className={`fixed right-6 p-3 rounded-full bg-gold-500 hover:bg-gold-400 text-forest-950 shadow-xl border border-gold-300 transition-all z-30 hover:scale-110 ${
            totalSelectedQuantity > 0 ? 'bottom-20' : 'bottom-6'
          }`}
          title="Back to Top"
        >
          <ArrowUp className="w-5 h-5 font-bold" />
        </button>
      )}

      {/* Table Share QR Modal */}
      {showQrModal && (
        <ShareQrModal onClose={() => setShowQrModal(false)} />
      )}

    </div>
  );
};
