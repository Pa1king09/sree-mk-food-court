import React from 'react';
import { X, ExternalLink, Image as ImageIcon } from 'lucide-react';

interface OriginalCardModalProps {
  cardName: string;
  itemName: string;
  onClose: () => void;
}

export const OriginalCardModal: React.FC<OriginalCardModalProps> = ({ cardName, itemName, onClose }) => {
  const imageUrl = `/menu-cards/${cardName}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative bg-forest-950 border border-gold-600/50 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-forest-800 bg-forest-900">
          <div className="flex items-center space-x-2">
            <ImageIcon className="w-4 h-4 text-gold-400" />
            <div>
              <h3 className="text-sm font-bold text-cream-50 leading-tight">
                Original Printed Menu Card
              </h3>
              <p className="text-[11px] text-gold-300">
                Item: <span className="font-semibold text-white">{itemName}</span>
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

        {/* Card Image Display */}
        <div className="flex-1 overflow-auto p-2 bg-black/40 flex items-center justify-center">
          <img
            src={imageUrl}
            alt={`Menu Card for ${itemName}`}
            className="max-w-full max-h-[75vh] object-contain rounded-lg border border-forest-800"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-forest-900/90 border-t border-forest-800 text-center text-xs text-cream-300 flex items-center justify-between">
          <span className="font-mono text-[10px] text-cream-400">{cardName}</span>
          <span className="text-[11px] text-gold-400">Offline Source of Truth</span>
        </div>

      </div>
    </div>
  );
};
