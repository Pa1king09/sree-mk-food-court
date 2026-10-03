import React, { useState, useRef, useEffect } from 'react';
import { Search, X, CheckCircle2, Sparkles, Plus, Minus, ArrowRight, CornerDownLeft } from 'lucide-react';
import { FoodType, MenuItem } from '../types/menu';
import { formatPrice } from '../services/menuService';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedType: 'all' | FoodType;
  onTypeChange: (type: 'all' | FoodType) => void;
  availableOnly: boolean;
  onToggleAvailableOnly: () => void;
  filteredCount: number;
  recommendations?: MenuItem[];
  onSelectRecommendation?: (item: MenuItem) => void;
  onAddToCart?: (item: MenuItem) => void;
  onUpdateQuantity?: (itemId: string, delta: number) => void;
  itemQuantities?: Map<string, number>;
  onSearchSubmit?: () => void;
}

const POPULAR_SUGGESTIONS = [
  'Chicken Biryani',
  'Fried Rice',
  'Chicken 65',
  'Pizza',
  'Noodles',
  'Veg Biryani',
  'Mojito',
  'Falooda',
  'Milkshake'
];

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedType,
  onTypeChange,
  availableOnly,
  onToggleAvailableOnly,
  filteredCount,
  recommendations = [],
  onSelectRecommendation,
  onAddToCart,
  onUpdateQuantity,
  itemQuantities = new Map(),
  onSearchSubmit
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when tapping/clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, []);

  // Trigger search submit: dismisses mobile keyboard and scrolls to results
  const handlePerformSearch = () => {
    setIsOpen(false);
    if (inputRef.current) {
      inputRef.current.blur();
    }
    if (onSearchSubmit) {
      onSearchSubmit();
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handlePerformSearch();
  };

  const handleSelectDish = (dish: MenuItem) => {
    setIsOpen(false);
    if (inputRef.current) {
      inputRef.current.blur();
    }
    if (onSelectRecommendation) {
      onSelectRecommendation(dish);
    } else {
      onSearchChange(dish.name);
      if (onSearchSubmit) onSearchSubmit();
    }
  };

  const displayedRecommendations = recommendations.slice(0, 8);

  return (
    <div
      ref={containerRef}
      className="bg-forest-950/90 border-b border-forest-800 p-3 sm:p-4 sticky top-[57px] z-40 backdrop-blur-md shadow-lg"
    >
      <div className="max-w-4xl mx-auto space-y-2.5">
        
        {/* Search Input Box & Submit Button Form */}
        <form
          onSubmit={handleFormSubmit}
          action="javascript:void(0);"
          role="search"
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gold-400">
              <Search className="w-4 h-4" />
            </div>

            <input
              ref={inputRef}
              type="search"
              inputMode="search"
              enterKeyHint="search"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              value={searchQuery}
              onFocus={() => setIsOpen(true)}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setIsOpen(true);
              }}
              placeholder="Search 240+ dishes, biryani, pizzas, mojitos..."
              className="w-full bg-forest-900 border border-forest-700 focus:border-gold-500 rounded-xl pl-10 pr-9 py-2.5 text-sm text-cream-50 placeholder-cream-300/60 focus:outline-none focus:ring-1 focus:ring-gold-500 shadow-inner"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  onSearchChange('');
                  inputRef.current?.focus();
                  setIsOpen(true);
                }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-cream-300 hover:text-cream-50"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Prominent Search Action Button */}
          <button
            type="submit"
            aria-label="Search Menu"
            className="bg-gold-500 hover:bg-gold-400 active:bg-gold-600 text-forest-950 px-3 sm:px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md transition-all active:scale-95 flex-shrink-0"
          >
            <Search className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden xs:inline sm:inline">Search</span>
          </button>
        </form>

        {/* ========================================================================= */}
        {/* Recommended Food Items Floating Dropdown (Appears Directly Below Search)  */}
        {/* ========================================================================= */}
        {isOpen && (
          <div className="relative">
            <div className="absolute top-1 left-0 right-0 z-50 bg-forest-950 border border-gold-500/50 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150 max-h-[60vh] flex flex-col divide-y divide-forest-800/80">
              
              {/* Header inside Dropdown */}
              <div className="px-3.5 py-2 bg-forest-900/90 flex items-center justify-between text-xs">
                <span className="font-bold text-gold-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-gold-400" />
                  {searchQuery.trim().length > 0
                    ? `Recommended Dishes (${displayedRecommendations.length})`
                    : 'Popular Recommendations'}
                </span>
                <span className="text-[10px] text-cream-400 hidden xs:inline">
                  Tap to view or add
                </span>
              </div>

              {/* Suggestions List */}
              <div className="overflow-y-auto divide-y divide-forest-800/60 max-h-[45vh] overscroll-contain">
                {searchQuery.trim().length > 0 ? (
                  displayedRecommendations.length > 0 ? (
                    displayedRecommendations.map((item) => {
                      const qty = itemQuantities.get(item.id) || 0;
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleSelectDish(item)}
                          className="px-3 py-2.5 hover:bg-forest-900/80 active:bg-forest-900 flex items-center justify-between gap-2.5 cursor-pointer transition"
                        >
                          {/* Left: Food Type + Name + Category + Price */}
                          <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                            <div className={`food-type-icon food-type-${item.type} !w-3.5 !h-3.5`} />
                            
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-semibold text-cream-50 truncate block">
                                  {item.name}
                                </span>
                                {!item.availability && (
                                  <span className="text-[9px] bg-red-950 text-red-400 border border-red-800 px-1 rounded flex-shrink-0">
                                    Unavailable
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-2 text-[11px] text-cream-300">
                                <span className="text-gold-400 font-medium">{item.category}</span>
                                <span>•</span>
                                <span className="font-bold text-gold-300">{formatPrice(item.price)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Right: Quick Add to Bill Button in Dropdown */}
                          {item.availability && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="flex-shrink-0 pl-1"
                            >
                              {qty > 0 ? (
                                <div className="flex items-center space-x-1.5 bg-forest-900 border border-gold-500 rounded-lg p-0.5">
                                  <button
                                    type="button"
                                    onClick={() => onUpdateQuantity && onUpdateQuantity(item.id, -1)}
                                    className="w-6 h-6 flex items-center justify-center rounded bg-forest-800 hover:bg-forest-700 text-gold-300 active:scale-95"
                                    aria-label="Decrease quantity"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="w-5 text-center text-xs font-bold text-gold-300">
                                    {qty}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => onUpdateQuantity && onUpdateQuantity(item.id, 1)}
                                    className="w-6 h-6 flex items-center justify-center rounded bg-gold-500 hover:bg-gold-400 text-forest-950 font-bold active:scale-95"
                                    aria-label="Increase quantity"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => onAddToCart && onAddToCart(item)}
                                  className="px-2.5 py-1 bg-gold-500 hover:bg-gold-400 active:bg-gold-600 text-forest-950 rounded-lg text-xs font-bold flex items-center space-x-1 shadow transition active:scale-95"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Add</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-6 px-4 text-center space-y-1">
                      <p className="text-xs font-semibold text-cream-200">No dishes found matching "{searchQuery}"</p>
                      <p className="text-[11px] text-cream-400">Try checking spelling or search for "biryani", "fried rice", "paneer"</p>
                    </div>
                  )
                ) : (
                  /* When user taps input with empty query, show trending / quick picks */
                  <div className="p-3">
                    <p className="text-[11px] text-cream-400 mb-2">Quick dish suggestions:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {POPULAR_SUGGESTIONS.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            onSearchChange(tag);
                            if (inputRef.current) inputRef.current.focus();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-forest-900 hover:bg-forest-800 border border-forest-700 text-gold-300 text-xs font-medium transition active:scale-95"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom bar inside dropdown: "View all matching dishes in menu" */}
              {searchQuery.trim().length > 0 && displayedRecommendations.length > 0 && (
                <button
                  type="button"
                  onClick={handlePerformSearch}
                  className="w-full py-2.5 px-3 bg-forest-900/90 hover:bg-forest-800 text-center text-xs font-bold text-gold-400 border-t border-forest-800 flex items-center justify-center gap-1.5 transition"
                >
                  <span>View all {filteredCount} matching dishes in menu</span>
                  <CornerDownLeft className="w-3.5 h-3.5" />
                </button>
              )}

            </div>
          </div>
        )}

        {/* Dietary Filters & Counter Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
          
          {/* Dietary Filters */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => onTypeChange('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                selectedType === 'all'
                  ? 'bg-gold-500 text-forest-950 shadow'
                  : 'bg-forest-900 hover:bg-forest-800 text-cream-200 border border-forest-700'
              }`}
            >
              All
            </button>

            <button
              type="button"
              onClick={() => onTypeChange('veg')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
                selectedType === 'veg'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-forest-900 hover:bg-forest-800 text-cream-200 border border-forest-700'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border border-emerald-300" />
              <span>Veg</span>
            </button>

            <button
              type="button"
              onClick={() => onTypeChange('non-veg')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
                selectedType === 'non-veg'
                  ? 'bg-red-600 text-white shadow'
                  : 'bg-forest-900 hover:bg-forest-800 text-cream-200 border border-forest-700'
              }`}
            >
              <span className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] border-b-red-400" />
              <span>Non-Veg</span>
            </button>

            <button
              type="button"
              onClick={() => onTypeChange('egg')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
                selectedType === 'egg'
                  ? 'bg-amber-600 text-white shadow'
                  : 'bg-forest-900 hover:bg-forest-800 text-cream-200 border border-forest-700'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-amber-300" />
              <span>Egg</span>
            </button>
          </div>

          {/* Right side: Available Only Filter + Result Count */}
          <div className="flex items-center space-x-3 ml-auto">
            <button
              type="button"
              onClick={onToggleAvailableOnly}
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition ${
                availableOnly
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                  : 'bg-forest-900/60 border-forest-700 text-cream-300 hover:text-white'
              }`}
            >
              <CheckCircle2 className={`w-3.5 h-3.5 ${availableOnly ? 'text-emerald-400' : 'text-cream-400'}`} />
              <span>Available Only</span>
            </button>

            <span className="text-[11px] text-cream-300 whitespace-nowrap">
              <strong className="text-gold-400">{filteredCount}</strong> items
            </span>
          </div>

        </div>

      </div>
    </div>
  );
};
