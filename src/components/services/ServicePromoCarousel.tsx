import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useServicePromotions } from '@/hooks/useServicePromotions';
import { UnifiedScrollSection } from '@/components/shared';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export function ServicePromoCarousel() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { data: promotions, isLoading } = useServicePromotions();

  if (isLoading) {
    return (
      <div className="px-4 py-4">
        <div className="flex gap-3 overflow-hidden">
          <Skeleton className="w-[280px] h-[140px] rounded-2xl shrink-0" />
          <Skeleton className="w-[280px] h-[140px] rounded-2xl shrink-0" />
        </div>
      </div>
    );
  }

  if (!promotions || promotions.length === 0) return null;

  return (
    <UnifiedScrollSection className="py-2">
      {promotions.map((promo) => (
        <button
          key={promo.id}
          onClick={() => navigate(promo.link_path)}
          className={cn(
            "w-[280px] h-[140px] shrink-0 snap-center",
            "relative rounded-2xl overflow-hidden",
            "group touch-manipulation"
          )}
        >
          {/* Background image */}
          <img
            src={promo.image_url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          
          {/* Gradient overlay */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-r",
            promo.gradient || 'from-primary/80 to-amber-500/60'
          )} />
          
          {/* Content */}
          <div className="absolute inset-0 p-4 flex flex-col justify-end text-white">
            <h3 className="text-lg font-bold leading-tight drop-shadow-md">
              {language === 'ru' ? promo.title_ru : promo.title_en}
            </h3>
            {(promo.subtitle_en || promo.subtitle_ru) && (
              <p className="text-sm opacity-90 mt-1 drop-shadow-sm">
                {language === 'ru' ? promo.subtitle_ru : promo.subtitle_en}
              </p>
            )}
            
            {/* CTA Arrow */}
            <div className="absolute right-3 bottom-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <ChevronRight className="w-5 h-5 text-white" />
            </div>
          </div>
        </button>
      ))}
    </UnifiedScrollSection>
  );
}
