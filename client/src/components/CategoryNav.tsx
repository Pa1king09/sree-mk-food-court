import React, { useRef } from 'react';
import { Category } from '../types/menu';

interface CategoryNavProps {
  categories: Category[];
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
  categoryItemCounts: Record<string, number>;
}

export const CategoryNav: React.FC<CategoryNavProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
  categoryItemCounts
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  return (
    <nav className="bg-forest-950 border-b border-forest-800/80 px-2 py-2 sticky top-[138px] z-20 shadow-md">
      <div
        ref={scrollContainerRef}
        className="max-w-6xl mx-auto flex items-center space-x-2 overflow-x-auto no-scrollbar scroll-smooth px-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <button
          onClick={() => onSelectCategory('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
            selectedCategoryId === 'all'
              ? 'bg-gold-500 text-forest-950 shadow-md scale-105'
              : 'bg-forest-900 text-cream-200 hover:bg-forest-800 border border-forest-700/60'
          }`}
        >
          <span>All Categories</span>
        </button>

        {categories.map((cat) => {
          const count = categoryItemCounts[cat.id] || 0;
          const isSelected = selectedCategoryId === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                isSelected
                  ? 'bg-gold-500 text-forest-950 shadow-md scale-105 font-bold'
                  : 'bg-forest-900 text-cream-200 hover:bg-forest-800 border border-forest-700/60'
              }`}
            >
              <span>{cat.name}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                isSelected ? 'bg-forest-950 text-gold-300' : 'bg-forest-800 text-cream-300'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
