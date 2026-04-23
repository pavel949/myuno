import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { resolveIcon } from '@/lib/iconMap';
import { ChevronRight, ArrowRight } from 'lucide-react';
import { MarketplaceCategory, MarketplaceProduct } from '@/types/marketplace';
import { Badge } from '@/components/ui/badge';

// Editorial-style category images
import groceriesImg from '@/assets/categories/groceries.webp';
import thaiFashionImg from '@/assets/categories/thai-fashion.webp';
import cosmeticsImg from '@/assets/categories/cosmetics.webp';
import souvenirsImg from '@/assets/categories/souvenirs.webp';
import homeDecorImg from '@/assets/categories/home-decor.webp';
import babyKidsImg from '@/assets/categories/baby-kids.webp';
import healthPharmacyImg from '@/assets/categories/health-pharmacy.webp';
import seafoodImg from '@/assets/categories/seafood.webp';
import organicImg from '@/assets/categories/organic.webp';
import meatImg from '@/assets/categories/meat.webp';
import defaultMarketImg from '@/assets/categories/default-market.webp';

interface ProfessionalCategoryBannerProps {
  categories: MarketplaceCategory[];
  products?: MarketplaceProduct[];
  onCategoryClick?: (categorySlug: string) => void;
}

export const ProfessionalCategoryBanner: React.FC<ProfessionalCategoryBannerProps> = ({
  categories,
  products = [],
  onCategoryClick,
}) => {
  const { language } = useLanguage();
  const navigate = useNavigate();

  // Get product count for a category
  const getProductCount = (slug: string) => {
    return products.filter(p => p.category_slug === slug).length;
  };

  const handleClick = (categorySlug: string) => {
    if (onCategoryClick) {
      onCategoryClick(categorySlug);
    } else {
      navigate(`/market/category/${categorySlug}`);
    }
  };

  // Editorial-style category images
  const getCategoryImage = (slug: string) => {
    const images: Record<string, string> = {
      'groceries': groceriesImg,
      'thai-fashion': thaiFashionImg,
      'cosmetics': cosmeticsImg,
      'souvenirs': souvenirsImg,
      'home-decor': homeDecorImg,
      'baby-kids': babyKidsImg,
      'health-pharmacy': healthPharmacyImg,
      'seafood': seafoodImg,
      'organic': organicImg,
      'meat': meatImg,
    };
    return images[slug] || defaultMarketImg;
  };

  if (categories.length === 0) return null;

  // Take first category as hero, rest as grid
  const [heroCategory, ...gridCategories] = categories;

  return (
    <div className="space-y-3">
      {/* Hero Category */}
      <button
        onClick={() => handleClick(heroCategory.slug)}
        className="w-full relative overflow-hidden rounded-none text-left transition-all duration-300 hover:shadow-xl active:scale-[0.99] group"
      >
        <div className="aspect-[2.2/1] relative">
          {/* Background Image */}
          <img
            src={heroCategory.image_url || getCategoryImage(heroCategory.slug)}
            alt=""
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
          
          {/* Gradient Overlay */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-r opacity-90",
            heroCategory.gradient || 'from-primary/90 to-primary/50'
          )} />
          
          {/* Content */}
          <div className="absolute inset-0 p-5 flex flex-col justify-end text-white">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {(() => { const Icon = resolveIcon(heroCategory.icon); return <Icon className="w-6 h-6 drop-shadow-lg" />; })()}
                  <h2 className="text-xl font-bold drop-shadow-lg">
                    {language === 'ru' ? heroCategory.name_ru : heroCategory.name_en}
                  </h2>
                  {products.length > 0 && (
                    <Badge className="bg-white/20 backdrop-blur-sm text-white border-0 text-xs">
                      {getProductCount(heroCategory.slug)} {language === 'ru' ? 'шт' : 'items'}
                    </Badge>
                  )}
                </div>
                <p className="text-white/90 text-xs max-w-xs leading-relaxed">
                  {language === 'ru' ? heroCategory.description_ru : heroCategory.description_en}
                </p>
              </div>
              
              {/* Arrow indicator */}
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center transition-all duration-300 group-hover:bg-white/30 group-hover:scale-110">
                <ArrowRight className="w-5 h-5 text-white transition-transform duration-300 group-hover:translate-x-0.5" />
              </div>
            </div>
          </div>
        </div>
      </button>

      {/* Category Grid */}
      <div className="grid grid-cols-2 gap-3">
        {gridCategories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleClick(category.slug)}
            className="relative overflow-hidden rounded-none text-left transition-all duration-300 hover:shadow-lg active:scale-[0.98] group"
          >
            <div className="aspect-[1.3/1] relative">
              {/* Background Image */}
              <img
                src={category.image_url || getCategoryImage(category.slug)}
                alt=""
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
              
              {/* Gradient Overlay */}
              <div className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-85",
                category.gradient || 'from-primary/85 to-primary/40'
              )} />
              
              {/* Content */}
              <div className="absolute inset-0 p-3 flex flex-col justify-between text-white">
                {/* Product count badge */}
                {products.length > 0 && (
                  <div className="flex justify-end">
                    <Badge className="bg-white/20 backdrop-blur-sm text-white border-0 text-[10px] px-1.5 py-0.5">
                      {getProductCount(category.slug)}
                    </Badge>
                  </div>
                )}
                
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {(() => { const Icon = resolveIcon(category.icon); return <Icon className="w-5 h-5 drop-shadow" />; })()}
                    <h3 className="font-semibold text-sm drop-shadow line-clamp-1">
                      {language === 'ru' ? category.name_ru : category.name_en}
                    </h3>
                  </div>
                  <p className="text-white/80 text-[10px] line-clamp-2 leading-tight">
                    {language === 'ru' ? category.description_ru : category.description_en}
                  </p>
                </div>
              </div>
              
              {/* Subtle arrow */}
              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="w-3 h-3 text-white" />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
