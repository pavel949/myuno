import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { MarketplaceCategory } from '@/types/marketplace';
import { IconBadge } from '@/components/ui/IconBadge';
import { cn } from '@/lib/utils';

interface QuickCategoryIconsProps {
  categories: MarketplaceCategory[];
  productCounts?: Record<string, number>;
  maxItems?: number;
  className?: string;
}

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
    <div className={cn("py-3", className)}>
      {/* Horizontal scrollable on mobile */}
      <div className="flex gap-4 px-4 overflow-x-auto scrollbar-hide snap-x snap-proximity touch-pan-y max-w-[1536px] mx-auto pb-2">
        {displayCategories.map((category) => {
          const count = productCounts[category.slug] || 0;
          
          return (
            <button
              key={category.id}
              onClick={() => handleClick(category.slug)}
              className="flex flex-col items-center gap-2 group touch-manipulation shrink-0 snap-start"
            >
              {/* Icon using IconBadge from design system */}
              <div className={cn(
                "relative",
                "transform transition-all duration-200",
                "group-hover:-translate-y-0.5",
                "group-active:scale-95"
              )}>
                {category.image_url ? (
                  <div className="w-14 h-14 rounded-none bg-primary/10 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                    <img 
                      src={category.image_url} 
                      alt=""
                      className="w-8 h-8 object-contain"
                    />
                  </div>
                ) : (
                  <IconBadge
                    icon={category.icon || '📦'}
                    size="xl"
                    variant="primary"
                    className="shadow-sm group-hover:shadow-md transition-shadow"
                  />
                )}
                {/* Product count badge */}
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </div>
              
              {/* Label */}
              <p className={cn(
                "text-xs font-medium text-foreground leading-tight text-center",
                "w-16 line-clamp-2"
              )}>
                {isRu ? category.name_ru : category.name_en}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
