import React from 'react';
import { MenuItem } from '../types/menu';
import { formatPrice } from '../services/menuService';
import { Plus, Minus } from 'lucide-react';

interface MenuItemListRowProps {
  item: MenuItem;
  quantity?: number;
  onAddToCart?: (item: MenuItem) => void;
  onUpdateQuantity?: (itemId: string, delta: number) => void;
}

export const MenuItemListRow: React.FC<MenuItemListRowProps> = ({
  item,
  quantity = 0,
  onAddToCart,
  onUpdateQuantity
}) => {
  const isAvailable = item.availability;

  return (
    <div
      id={`dish-${item.id}`}
      className={`flex items-center justify-between py-2 px-3 rounded-xl border mb-1.5 transition scroll-mt-36 ${
        isAvailable
          ? (quantity > 0 ? 'bg-forest-900 border-gold-500/80 shadow-sm' : 'bg-forest-900/60 border-forest-800 hover:border-gold-500/30')
          : 'bg-forest-950/40 border-forest-900/80 opacity-50'
      }`}
    >
      
      {/* Left: Indicator + Name + Subcategory */}
      <div className="flex items-center space-x-2.5 min-w-0 pr-2 flex-1">
        <div className={`food-type-icon food-type-${item.type}`} />
        
        <div className="truncate">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-semibold text-cream-50 truncate">
              {item.name}
            </span>
            {!isAvailable && (
              <span className="text-[9px] bg-red-950 text-red-400 border border-red-800 px-1.5 py-0.2 rounded font-medium">
                Unavailable
              </span>
            )}
          </div>
          {item.subcategory && (
            <span className="text-[10px] text-gold-400/80">
              {item.subcategory}
            </span>
          )}
        </div>
      </div>

      {/* Right: Price + Selection Controls */}
      <div className="flex items-center space-x-2.5 flex-shrink-0">
        <span className="text-sm font-bold text-gold-400 font-serif min-w-[50px] text-right">
          {formatPrice(item.price)}
        </span>

        {/* Selection Stepper / Add button */}
        {isAvailable && (
          <div>
            {quantity > 0 ? (
              <div className="flex items-center bg-forest-950 border border-gold-500/80 rounded-lg p-0.5">
                <button
                  onClick={() => onUpdateQuantity && onUpdateQuantity(item.id, -1)}
                  className="w-6 h-6 flex items-center justify-center text-gold-400 hover:text-white rounded hover:bg-forest-800"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-5 text-center font-bold text-xs text-gold-300 font-mono">
                  {quantity}
                </span>
                <button
                  onClick={() => onUpdateQuantity && onUpdateQuantity(item.id, 1)}
                  className="w-6 h-6 flex items-center justify-center bg-gold-500 text-forest-950 rounded font-bold"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onAddToCart && onAddToCart(item)}
                className="px-2.5 py-1 rounded-lg bg-forest-950 hover:bg-forest-800 text-gold-400 border border-gold-500/40 text-xs font-bold transition flex items-center space-x-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add</span>
              </button>
            )}
          </div>
        )}
      </div>

    </div>
  );
};
