import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { MarketplaceCategory } from '@/types/marketplace';
import { cn } from '@/lib/utils';

interface QuickCategoryIconsProps {
  categories: MarketplaceCategory[];
  productCounts?: Record<string, number>;
  maxItems?: number;
  className?: string;
}

// Fallback emoji icons for categories
const getCategoryEmoji = (slug: string): string => {
  const icons: Record<string, string> = {
    'fruits-vegetables': '🥬',
    'dairy-eggs': '🥛',
    'meat': '🥩',
    'seafood': '🦐',
    'bakery': '🥖',
    'beverages': '🥤',
    'snacks': '🍿',
    'organic': '🌿',
    'frozen': '❄️',
    'pantry': '🏺',
    'baby': '👶',
    'household': '🏠',
    'personal-care': '🧴',
    'pet-supplies': '🐕',
    'electronics': '📱',
    'fashion': '👔',
  };
  return icons[slug] || '📦';
};

export const QuickCategoryIcons: React.FC<QuickCategoryIconsProps> = ({
  categories,
  productCounts = {},
  maxItems = 8,
  className,
}) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const displayCategories = categories.slice(0, maxItems);

  const handleClick = (slug: string) => {
    navigate(`/market/category/${slug}`);
  };

  return (
    <div className={cn("py-2", className)}>
      <div className="grid grid-cols-4 gap-2 px-4 max-w-7xl mx-auto">
        {displayCategories.map((category) => {
          const emoji = category.icon || getCategoryEmoji(category.slug);
          const count = productCounts[category.slug] || 0;
          
          return (
            <button
              key={category.id}
              onClick={() => handleClick(category.slug)}
              className="flex flex-col items-center gap-1.5 group touch-manipulation"
            >
              {/* Icon Circle */}
              <div className={cn(
                "w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center",
                "bg-primary/10 hover:bg-primary/20",
                "shadow-sm hover:shadow-md",
                "transform transition-all duration-200",
                "group-hover:-translate-y-0.5 group-hover:scale-105",
                "group-active:scale-95"
              )}>
                {category.image_url ? (
                  <img 
                    src={category.image_url} 
                    alt=""
                    className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
                  />
                ) : (
                  <span className="text-xl sm:text-2xl">{emoji}</span>
                )}
              </div>
              
              {/* Label */}
              <div className="text-center">
                <p className={cn(
                  "text-[11px] sm:text-xs font-medium text-foreground leading-tight",
                  "line-clamp-2"
                )}>
                  {isRu ? category.name_ru : category.name_en}
                </p>
                {count > 0 && (
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground">
                    {count}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
