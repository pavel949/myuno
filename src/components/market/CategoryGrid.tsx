import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import { MarketplaceCategory } from '@/types/marketplace';
import { Badge } from '@/components/ui/badge';

interface CategoryGridProps {
  categories: MarketplaceCategory[];
  productCounts: Record<string, number>;
  title?: string;
  titleRu?: string;
  variant?: 'large' | 'compact';
}

const CATEGORY_IMAGES: Record<string, string> = {
  'groceries': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80',
  'thai-fashion': 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400&q=80',
  'cosmetics': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&q=80',
  'souvenirs': 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&q=80',
  'home-decor': 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400&q=80',
  'baby-kids': 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&q=80',
  'health-pharmacy': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80',
  'seafood': 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=400&q=80',
  'organic': 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=400&q=80',
  'meat': 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&q=80',
  'drinks': 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80',
  'thai-delicacies': 'https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?w=400&q=80',
};

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
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-muted/50 transition-colors group"
            >
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center text-2xl",
                "bg-gradient-to-br shadow-sm transition-transform group-hover:scale-105",
                cat.gradient || "from-primary/20 to-primary/10"
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
              className="relative overflow-hidden rounded-2xl text-left transition-all duration-300 hover:shadow-lg active:scale-[0.98] group"
            >
              <div className="aspect-[1.4/1] relative">
                {/* Background Image */}
                <img
                  src={image}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                
                {/* Gradient Overlay */}
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-t opacity-90",
                  "from-black/80 via-black/40 to-transparent"
                )} />
                
                {/* Content */}
                <div className="absolute inset-0 p-3 flex flex-col justify-between text-white">
                  {/* Product count */}
                  <div className="flex justify-end">
                    <Badge className="bg-white/20 backdrop-blur-sm text-white border-0 text-[10px] px-2 py-0.5">
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
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
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
