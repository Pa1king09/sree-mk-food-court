import React from 'react';
import { QrCode, Shield, LayoutGrid, List, Wifi, WifiOff, Receipt } from 'lucide-react';

interface NavbarProps {
  onOpenQr: () => void;
  onOpenAdmin: () => void;
  isOnline: boolean;
  viewMode: 'cards' | 'list';
  onToggleViewMode: (mode: 'cards' | 'list') => void;
  selectedCount?: number;
  onOpenBill?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenQr,
  onOpenAdmin,
  isOnline,
  viewMode,
  onToggleViewMode,
  selectedCount = 0,
  onOpenBill
}) => {
  return (
    <header className="sticky top-0 z-40 bg-forest-950/95 backdrop-blur border-b border-gold-600/30 px-4 py-2.5">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        
        {/* Brand identity */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full border-2 border-gold-500 overflow-hidden bg-forest-900 flex items-center justify-center shadow-md">
            <img src="/icons/icon-192.svg" alt="Sree MK Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-serif font-bold text-gold-400 tracking-wide leading-tight">
              SREE MK
            </h1>
            <p className="text-[10px] sm:text-xs text-cream-200 tracking-wider font-semibold uppercase">
              FOOD COURT
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          
          {/* Bill / Calculator quick button if items selected */}
          {selectedCount > 0 && onOpenBill && (
            <button
              onClick={onOpenBill}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-gold-500 text-forest-950 font-extrabold text-xs shadow-md animate-pulse transition hover:scale-105"
              title="View Selected Bill"
            >
              <Receipt className="w-4 h-4" />
              <span>Bill ({selectedCount})</span>
            </button>
          )}

          {/* Offline / Local Wi-Fi Status badge */}
          <div className={`hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
            isOnline 
              ? 'bg-forest-800 text-emerald-300 border-emerald-500/40' 
              : 'bg-forest-900 text-gold-300 border-gold-600/40'
          }`}>
            {isOnline ? <Wifi className="w-3 h-3 text-emerald-400" /> : <WifiOff className="w-3 h-3 text-gold-400" />}
            <span>{isOnline ? 'Local Wi-Fi' : 'Offline Cached'}</span>
          </div>

          {/* View mode toggle */}
          <div className="bg-forest-800 p-0.5 rounded-lg border border-forest-600/40 flex items-center">
            <button
              onClick={() => onToggleViewMode('cards')}
              className={`p-1.5 rounded-md transition ${viewMode === 'cards' ? 'bg-gold-500 text-forest-950 shadow' : 'text-cream-200 hover:text-white'}`}
              title="Card View"
              aria-label="Card View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onToggleViewMode('list')}
              className={`p-1.5 rounded-md transition ${viewMode === 'list' ? 'bg-gold-500 text-forest-950 shadow' : 'text-cream-200 hover:text-white'}`}
              title="List View"
              aria-label="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Table QR Button */}
          <button
            onClick={onOpenQr}
            className="flex items-center space-x-1 bg-forest-800 hover:bg-forest-700 text-gold-400 border border-gold-500/40 px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow transition"
            title="Table QR Code"
          >
            <QrCode className="w-4 h-4" />
            <span className="hidden sm:inline">QR Code</span>
          </button>

          {/* Admin Dashboard */}
          <button
            onClick={onOpenAdmin}
            className="p-1.5 text-cream-200 hover:text-gold-400 bg-forest-800/80 hover:bg-forest-800 border border-forest-700 rounded-lg transition"
            title="Admin Login"
            aria-label="Admin Login"
          >
            <Shield className="w-4 h-4" />
          </button>

        </div>

      </div>
    </header>
  );
};
