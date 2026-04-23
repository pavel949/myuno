import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import { MarketplaceCategory } from '@/types/marketplace';
import { Badge } from '@/components/ui/badge';
import { PLACEHOLDER_IMAGES } from '@/lib/config/placeholders';

interface CategoryGridProps {
  categories: MarketplaceCategory[];
  productCounts: Record<string, number>;
  title?: string;
  titleRu?: string;
  variant?: 'large' | 'compact';
}

const CATEGORY_IMAGES = PLACEHOLDER_IMAGES.marketCategories;

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  categories,
  productCounts,
  title,
  titleRu,
  variant = 'large',
}) => {
  const { language } = useLanguage();
  const navigate = useNavigate();

  const handleClick = (slug: string) => {
    navigate(`/market/category/${slug}`);
  };

  if (categories.length === 0) return null;

  if (variant === 'compact') {
    return (
      <div className="space-y-3">
        {title && (
          <h2 className="text-base font-bold">
            {language === 'ru' ? titleRu : title}
          </h2>
        )}
        <div className="grid grid-cols-4 gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleClick(cat.slug)}
              className="flex flex-col items-center gap-1.5 p-2 rounded-none hover:bg-muted/50 transition-colors group"
            >
              <div className={cn(
                "w-12 h-12 rounded-none flex items-center justify-center text-2xl",
                "bg-muted shadow-sm transition-transform group-hover:scale-105"
              )}>
                {cat.icon}
              </div>
              <span className="text-[10px] font-medium text-center line-clamp-2 leading-tight">
                {language === 'ru' ? cat.name_ru : cat.name_en}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {title && (
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">
            {language === 'ru' ? titleRu : title}
          </h2>
          <Badge variant="outline" className="text-xs">
            {categories.length} {language === 'ru' ? 'кат.' : 'cat.'}
          </Badge>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        {categories.map((cat) => {
          const count = productCounts[cat.slug] || 0;
          const image = cat.image_url || CATEGORY_IMAGES[cat.slug] || CATEGORY_IMAGES['groceries'];
          
          return (
            <button
              key={cat.id}
              onClick={() => handleClick(cat.slug)}
              className="relative overflow-hidden rounded-none text-left transition-all duration-300 hover:shadow-lg active:scale-[0.98] group"
            >
              <div className="aspect-[1.4/1] relative">
                {/* Background Image */}
                <img
                  src={image}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  loading="lazy"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/50" />
                
                {/* Content */}
                <div className="absolute inset-0 p-3 flex flex-col justify-between text-white">
                  {/* Product count */}
                  <div className="flex justify-end">
                    <Badge className="bg-white/20 text-white border-0 text-[10px] px-2 py-0.5">
                      {count} {language === 'ru' ? 'шт' : 'items'}
                    </Badge>
                  </div>
                  
                  {/* Title and icon */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl drop-shadow-lg">{cat.icon}</span>
                      <h3 className="font-bold text-sm drop-shadow-lg line-clamp-1">
                        {language === 'ru' ? cat.name_ru : cat.name_en}
                      </h3>
                    </div>
                    {cat.description_en && (
                      <p className="text-white/70 text-[10px] line-clamp-1">
                        {language === 'ru' ? cat.description_ru : cat.description_en}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Hover arrow */}
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
