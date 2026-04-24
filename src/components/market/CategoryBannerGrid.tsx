import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { resolveIcon } from '@/lib/iconMap';
import { ChevronRight } from 'lucide-react';

export interface CategoryBannerData {
  id: string;
  labelEn: string;
  labelRu: string;
  descriptionEn: string;
  descriptionRu: string;
  icon: string;
  image: string;
  gradient: string;
}

interface CategoryBannerGridProps {
  banners: CategoryBannerData[];
  onCategoryClick?: (categoryId: string) => void;
}

export const CategoryBannerGrid: React.FC<CategoryBannerGridProps> = ({
  banners,
  onCategoryClick,
}) => {
  const { language } = useLanguage();
  const navigate = useNavigate();

  const handleClick = (categoryId: string) => {
    if (onCategoryClick) {
      onCategoryClick(categoryId);
    } else {
      navigate(`/market/category/${categoryId}`);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {banners.map((banner, index) => (
        <button
          key={banner.id}
          onClick={() => handleClick(banner.id)}
          className={cn(
            "relative overflow-hidden rounded-none text-left transition-transform ",
            index === 0 ? "col-span-2 aspect-[2.5/1]" : "aspect-[1.2/1]"
          )}
        >
          {/* Background Image */}
          <img
            src={banner.image}
            alt={language === 'ru' ? banner.labelRu : banner.labelEn}
            className="absolute inset-0 w-full h-full object-cover"
          />
          
          {/* Gradient Overlay */}
          <div 
            className={cn(
              "absolute inset-0 bg-gradient-to-r",
              banner.gradient
            )}
          />
          
          {/* Content */}
          <div className="absolute inset-0 p-4 flex flex-col justify-end text-white">
            <div className="flex items-center gap-2 mb-1">
              {(() => { const Icon = resolveIcon(banner.icon); return <Icon className="w-6 h-6" />; })()}
              <h3 className={cn(
                "font-bold",
                index === 0 ? "text-xl" : "text-base"
              )}>
                {language === 'ru' ? banner.labelRu : banner.labelEn}
              </h3>
            </div>
            <p className={cn(
              "text-white/80 line-clamp-1",
              index === 0 ? "text-sm" : "text-xs"
            )}>
              {language === 'ru' ? banner.descriptionRu : banner.descriptionEn}
            </p>
            
            {/* Arrow indicator */}
            <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <ChevronRight className="w-4 h-4 text-white" />
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};
