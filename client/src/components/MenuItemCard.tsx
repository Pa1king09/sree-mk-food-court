import React from 'react';
import { MenuItem } from '../types/menu';
import { formatPrice } from '../services/menuService';
import { AlertCircle, Plus, Minus } from 'lucide-react';

interface MenuItemCardProps {
  item: MenuItem;
  quantity?: number;
  onAddToCart?: (item: MenuItem) => void;
  onUpdateQuantity?: (itemId: string, delta: number) => void;
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({
  item,
  quantity = 0,
  onAddToCart,
  onUpdateQuantity
}) => {
  const isAvailable = item.availability;

  return (
    <div
      id={`dish-${item.id}`}
      className={`relative flex flex-col justify-between bg-forest-900/90 rounded-2xl p-4 border transition-all duration-200 shadow-md hover:shadow-gold-500/5 hover:border-gold-500/50 scroll-mt-36 ${
        isAvailable ? (quantity > 0 ? 'border-gold-500 bg-forest-900' : 'border-forest-700/70') : 'border-red-900/40 opacity-60 bg-forest-950/70'
      }`}
    >
      
      <div>
        {/* Top Header: Dietary icon + Subcategory tag + Availability */}
        <div className="flex items-center justify-between gap-2 mb-2">
          
          <div className="flex items-center space-x-2">
            {/* Dietary symbol */}
            <div className={`food-type-icon food-type-${item.type}`} title={item.type.toUpperCase()} />
            
            {item.subcategory && (
              <span className="text-[10px] font-semibold text-gold-400/90 bg-forest-950 px-2 py-0.5 rounded border border-gold-600/30">
                {item.subcategory}
              </span>
            )}
          </div>

          {/* Availability badge */}
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center space-x-1 ${
            isAvailable 
              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60' 
              : 'bg-red-950 text-red-400 border border-red-800/60'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-emerald-400' : 'bg-red-400'}`} />
            <span>{isAvailable ? 'Available' : 'Unavailable'}</span>
          </span>
        </div>

        {/* Item Name */}
        <h3 className="text-base sm:text-lg font-bold text-cream-50 leading-snug tracking-tight mb-1">
          {item.name}
        </h3>

        {/* Item Description */}
        {item.description && (
          <p className="text-xs text-cream-200/80 line-clamp-2 leading-relaxed mb-3">
            {item.description}
          </p>
        )}
      </div>

      {/* Bottom Footer: Price & Order Selector */}
      <div className="pt-3 border-t border-forest-800 flex flex-col gap-2.5 mt-auto">
        
        <div className="flex items-center justify-between gap-2">
          {/* Price */}
          <div className="flex items-baseline space-x-1">
            <span className="text-xl font-extrabold text-gold-400 font-serif">
              {formatPrice(item.price)}
            </span>
          </div>

          {item.needsVerification && (
            <span className="text-[10px] text-amber-400 flex items-center space-x-1" title="Marked for manual verification">
              <AlertCircle className="w-3 h-3" />
              <span>Verify</span>
            </span>
          )}
        </div>

        {/* ================= SELECTION & BILL CALCULATOR CONTROLS ================= */}
        <div className="pt-1">
          {!isAvailable ? (
            <div className="w-full py-1.5 px-3 rounded-xl bg-forest-950/60 border border-forest-800 text-center text-xs text-cream-400 font-medium cursor-not-allowed">
              Currently Unavailable
            </div>
          ) : quantity > 0 ? (
            <div className="w-full flex items-center justify-between bg-gold-500/10 border-2 border-gold-500 rounded-xl p-1 shadow-sm">
              <button
                onClick={() => onUpdateQuantity && onUpdateQuantity(item.id, -1)}
                className="w-8 h-8 rounded-lg bg-forest-900 hover:bg-forest-800 text-gold-300 border border-gold-600/40 flex items-center justify-center transition active:scale-95"
                title="Decrease"
              >
                <Minus className="w-4 h-4" />
              </button>

              <div className="text-center">
                <span className="text-xs font-mono font-bold text-gold-400">
                  {quantity} in Bill
                </span>
                <span className="block text-[10px] text-cream-200">
                  ({formatPrice(quantity * item.price)})
                </span>
              </div>

              <button
                onClick={() => onUpdateQuantity && onUpdateQuantity(item.id, 1)}
                className="w-8 h-8 rounded-lg bg-gold-500 hover:bg-gold-400 text-forest-950 font-bold flex items-center justify-center transition active:scale-95 shadow"
                title="Increase"
              >
                <Plus className="w-4 h-4 font-bold" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onAddToCart && onAddToCart(item)}
              className="w-full py-2 px-3 rounded-xl bg-forest-950 hover:bg-forest-800 text-gold-400 hover:text-gold-300 border border-gold-500/50 hover:border-gold-400 font-bold text-xs flex items-center justify-center space-x-1.5 shadow-sm transition active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 text-gold-400" />
              <span>Add to Bill</span>
            </button>
          )}
        </div>

      </div>

    </div>
  );
};
