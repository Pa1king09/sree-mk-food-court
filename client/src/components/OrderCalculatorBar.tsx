import React from 'react';
import { Calculator, ChevronRight, Receipt } from 'lucide-react';
import { formatPrice } from '../services/menuService';

interface OrderCalculatorBarProps {
  totalItems: number;
  totalAmount: number;
  onOpenSummary: () => void;
}

export const OrderCalculatorBar: React.FC<OrderCalculatorBarProps> = ({
  totalItems,
  totalAmount,
  onOpenSummary
}) => {
  if (totalItems === 0) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 p-3 sm:p-4 bg-gradient-to-t from-black via-forest-950/95 to-transparent pointer-events-none animate-in slide-in-from-bottom duration-300">
      <div className="max-w-xl mx-auto pointer-events-auto">
        <button
          onClick={onOpenSummary}
          className="w-full bg-gradient-to-r from-gold-500 via-gold-400 to-amber-500 hover:from-gold-400 hover:to-gold-500 text-forest-950 rounded-2xl px-4 py-3 sm:py-3.5 shadow-2xl flex items-center justify-between border-2 border-gold-300/80 transition-all transform hover:scale-[1.01] active:scale-[0.99]"
        >
          {/* Left: Icon & Count */}
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-forest-950/90 text-gold-400 flex items-center justify-center shadow">
              <Receipt className="w-4 h-4" />
            </div>
            <div className="text-left leading-tight">
              <div className="text-[11px] font-bold uppercase tracking-wider text-forest-900">
                Selected Items
              </div>
              <div className="text-sm font-black text-forest-950">
                {totalItems} {totalItems === 1 ? 'dish' : 'dishes'}
              </div>
            </div>
          </div>

          {/* Right: Calculated Price & CTA */}
          <div className="flex items-center space-x-2.5">
            <div className="text-right leading-tight">
              <div className="text-[10px] font-bold uppercase tracking-wider text-forest-900">
                Total Amount
              </div>
              <div className="text-lg sm:text-xl font-extrabold font-serif text-forest-950">
                {formatPrice(totalAmount)}
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-forest-950 text-gold-400 flex items-center justify-center shadow">
              <ChevronRight className="w-5 h-5 font-bold" />
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};
