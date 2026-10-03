import React, { useState } from 'react';
import { X, Plus, Minus, Trash2, Receipt, CheckCircle2, RotateCcw, Utensils } from 'lucide-react';
import { SelectedOrderItem, RestaurantInfo } from '../types/menu';
import { formatPrice } from '../services/menuService';

interface OrderSummaryModalProps {
  selectedItems: SelectedOrderItem[];
  restaurant: RestaurantInfo;
  onUpdateQuantity: (itemId: string, delta: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearAll: () => void;
  onClose: () => void;
}

export const OrderSummaryModal: React.FC<OrderSummaryModalProps> = ({
  selectedItems,
  restaurant,
  onUpdateQuantity,
  onRemoveItem,
  onClearAll,
  onClose
}) => {
  const [waiterSlipMode, setWaiterSlipMode] = useState<boolean>(false);

  const totalQuantity = selectedItems.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalAmount = selectedItems.reduce((acc, curr) => acc + curr.quantity * curr.item.price, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative bg-forest-950 border border-gold-600/50 rounded-3xl max-w-lg w-full flex flex-col max-h-[92vh] shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-forest-900 border-b border-forest-800 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-forest-800 border border-gold-500/40 flex items-center justify-center text-gold-400">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-gold-400 leading-tight">
                {waiterSlipMode ? 'Table Order Slip' : 'Selected Items & Bill'}
              </h3>
              <p className="text-[11px] text-cream-300">
                {restaurant.name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-cream-300 hover:text-white rounded-lg hover:bg-forest-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Pills */}
        <div className="bg-forest-900/40 border-b border-forest-800/80 px-5 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setWaiterSlipMode(false)}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                !waiterSlipMode
                  ? 'bg-gold-500 text-forest-950 shadow'
                  : 'text-cream-300 hover:bg-forest-800'
              }`}
            >
              Interactive Bill
            </button>
            <button
              onClick={() => setWaiterSlipMode(true)}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                waiterSlipMode
                  ? 'bg-gold-500 text-forest-950 shadow'
                  : 'text-cream-300 hover:bg-forest-800'
              }`}
            >
              Show to Waiter
            </button>
          </div>

          {selectedItems.length > 0 && (
            <button
              onClick={onClearAll}
              className="text-[11px] text-red-400 hover:text-red-300 flex items-center space-x-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear All</span>
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          
          {selectedItems.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-forest-900 border border-forest-700 flex items-center justify-center mx-auto text-gold-400">
                <Utensils className="w-6 h-6" />
              </div>
              <p className="text-sm text-cream-100 font-semibold">No items selected yet</p>
              <p className="text-xs text-cream-300 max-w-xs mx-auto">
                Tap <strong>+ Add to Bill</strong> on any dish in the menu to automatically calculate your order total.
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-4 py-2 bg-gold-500 text-forest-950 font-bold rounded-xl text-xs"
              >
                Browse Menu
              </button>
            </div>
          ) : waiterSlipMode ? (
            /* ================= WAITER ORDER SLIP MODE ================= */
            <div className="space-y-4">
              <div className="p-3 bg-forest-900 border border-gold-600/40 rounded-xl text-center">
                <p className="text-xs font-semibold text-gold-300">
                  Show this clean slip to the service staff at your table:
                </p>
              </div>

              <div className="bg-forest-900/90 border border-forest-700 rounded-2xl p-4 divide-y divide-forest-800">
                {selectedItems.map((sel) => (
                  <div key={sel.item.id} className="py-2.5 flex items-center justify-between first:pt-0 last:pb-0">
                    <div className="flex items-center space-x-2">
                      <div className={`food-type-icon food-type-${sel.item.type}`} />
                      <div>
                        <div className="text-sm font-bold text-cream-50 leading-tight">
                          {sel.item.name}
                        </div>
                        <div className="text-[11px] text-gold-400">
                          {formatPrice(sel.item.price)} each
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-black text-gold-300 bg-forest-950 px-2.5 py-1 rounded-lg border border-forest-700">
                        x {sel.quantity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-forest-900 border border-gold-500/40 rounded-2xl text-center space-y-1">
                <div className="text-xs text-cream-300">
                  Total Items: <strong className="text-white">{totalQuantity}</strong>
                </div>
                <div className="text-xl sm:text-2xl font-black font-serif text-gold-400">
                  Total: {formatPrice(totalAmount)}
                </div>
              </div>
            </div>
          ) : (
            /* ================= INTERACTIVE BILL CALCULATOR MODE ================= */
            <div className="space-y-2.5">
              {selectedItems.map((sel) => {
                const itemSubtotal = sel.quantity * sel.item.price;

                return (
                  <div
                    key={sel.item.id}
                    className="p-3 bg-forest-900/80 border border-forest-800 rounded-2xl flex items-center justify-between gap-2 shadow-sm"
                  >
                    {/* Item details */}
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center space-x-1.5">
                        <div className={`food-type-icon food-type-${sel.item.type}`} />
                        <h4 className="text-sm font-bold text-cream-50 truncate">
                          {sel.item.name}
                        </h4>
                      </div>
                      <div className="text-[11px] text-cream-300 ml-6">
                        {formatPrice(sel.item.price)} x {sel.quantity} ={' '}
                        <strong className="text-gold-400 font-mono">{formatPrice(itemSubtotal)}</strong>
                      </div>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <div className="flex items-center bg-forest-950 border border-forest-700 rounded-xl p-0.5">
                        <button
                          onClick={() => onUpdateQuantity(sel.item.id, -1)}
                          className="w-7 h-7 flex items-center justify-center text-cream-200 hover:text-white rounded-lg hover:bg-forest-800 transition"
                          title="Decrease"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-7 text-center font-bold text-xs text-gold-400 font-mono">
                          {sel.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(sel.item.id, 1)}
                          className="w-7 h-7 flex items-center justify-center text-cream-200 hover:text-white rounded-lg hover:bg-forest-800 transition"
                          title="Increase"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => onRemoveItem(sel.item.id)}
                        className="p-1.5 text-red-400 hover:text-red-300 rounded-lg hover:bg-forest-950 transition"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Footer: Grand Total & Actions */}
        {selectedItems.length > 0 && (
          <div className="bg-forest-900 border-t border-forest-800 p-4 sm:p-5 space-y-3">
            
            {/* Calculation summary rows */}
            <div className="space-y-1.5 text-xs text-cream-200">
              <div className="flex justify-between">
                <span>Selected dishes:</span>
                <span className="font-bold text-white">{selectedItems.length} types ({totalQuantity} total qty)</span>
              </div>
              <div className="flex justify-between text-sm pt-1 border-t border-forest-800">
                <span className="font-bold text-cream-100">Calculated Total:</span>
                <span className="text-xl font-extrabold text-gold-400 font-serif">
                  {formatPrice(totalAmount)}
                </span>
              </div>
            </div>

            {/* Note & Close button */}
            <div className="text-[10px] text-cream-300 text-center italic">
              Estimated bill • Please place your order directly with your table waiter
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 bg-gold-500 hover:bg-gold-400 text-forest-950 font-bold rounded-xl text-xs shadow transition text-center"
              >
                Continue Adding Dishes
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
