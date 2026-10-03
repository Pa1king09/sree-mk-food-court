import React from 'react';
import { Phone, UtensilsCrossed, Info } from 'lucide-react';
import { RestaurantInfo } from '../types/menu';

interface HeroBannerProps {
  restaurant: RestaurantInfo;
  totalItems: number;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ restaurant, totalItems }) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-forest-950 via-forest-900 to-forest-950 border-b border-gold-600/20 py-6 px-4">
      {/* Background ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-gold-500/10 blur-3xl pointer-events-none rounded-full" />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        
        {/* Decorative Badge */}
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-forest-800/80 border border-gold-500/30 text-gold-300 text-xs font-semibold mb-3">
          <UtensilsCrossed className="w-3.5 h-3.5 text-gold-400" />
          <span>Authentic Indian & Multi-Cuisine Diner</span>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-serif font-black tracking-tight text-gold-gradient mb-1">
          {restaurant.name}
        </h1>

        {/* Tagline */}
        <p className="text-sm sm:text-base italic text-gold-300/90 font-serif tracking-widest mb-4">
          “ {restaurant.tagline} ”
        </p>

        {/* Contact Numbers */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-5 text-xs sm:text-sm">
          {restaurant.phones.map((phone, idx) => (
            <a
              key={idx}
              href={`tel:${phone.replace(/\s+/g, '')}`}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-forest-800/90 hover:bg-forest-700 text-cream-100 hover:text-gold-300 border border-forest-600/50 shadow-sm transition"
            >
              <Phone className="w-3.5 h-3.5 text-gold-400" />
              <span className="font-semibold">{phone}</span>
            </a>
          ))}
        </div>

        {/* View-Only Digital Menu Notice */}
        <div className="inline-flex items-center space-x-2 bg-gold-950/60 border border-gold-600/40 text-gold-200 px-4 py-2 rounded-xl text-xs sm:text-sm max-w-xl shadow-inner">
          <Info className="w-4 h-4 text-gold-400 flex-shrink-0" />
          <p className="text-left font-medium">
            {restaurant.viewOnlyNotice || 'This is a view-only digital menu. Please place your order directly with the service staff.'}
          </p>
        </div>

        {/* Total items stats summary */}
        <div className="mt-3 text-[11px] text-cream-300 font-medium">
          Featuring <span className="text-gold-400 font-bold">{totalItems}</span> freshly prepared dishes & beverages
        </div>

      </div>
    </section>
  );
};
