import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Truck, Zap, Shield } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';

interface PromoBanner {
  id: string;
  title_en: string;
  title_ru: string;
  subtitle_en: string;
  subtitle_ru: string;
  badge_en?: string;
  badge_ru?: string;
  gradient: string;
  icon: React.ElementType;
  link_path: string;
}

// Static promotional banners (can be replaced with DB data later)
const PROMO_BANNERS: PromoBanner[] = [
  {
    id: 'free-delivery',
    title_en: 'Free Delivery',
    title_ru: 'Бесплатная доставка',
    subtitle_en: 'On orders over ฿1,500',
    subtitle_ru: 'При заказе от ฿1,500',
    badge_en: 'Limited Time',
    badge_ru: 'Ограничено',
    gradient: 'from-emerald-500 via-emerald-600 to-teal-600',
    icon: Truck,
    link_path: '/market/category/deals',
  },
  {
    id: 'flash-deals',
    title_en: 'Flash Deals',
    title_ru: 'Молниеносные скидки',
    subtitle_en: 'Up to 50% off selected items',
    subtitle_ru: 'Скидки до 50% на избранные товары',
    badge_en: 'Hot',
    badge_ru: 'Горячо',
    gradient: 'from-orange-500 via-red-500 to-pink-500',
    icon: Zap,
    link_path: '/market/category/deals',
  },
  {
    id: 'quality-guarantee',
    title_en: 'Quality Guaranteed',
    title_ru: 'Гарантия качества',
    subtitle_en: 'Fresh products from verified vendors',
    subtitle_ru: 'Свежие продукты от проверенных продавцов',
    badge_en: 'Trust',
    badge_ru: 'Доверие',
    gradient: 'from-blue-500 via-indigo-500 to-purple-500',
    icon: Shield,
    link_path: '/market/vendors',
  },
];

interface PromoCarouselProps {
  className?: string;
}

export const PromoCarousel: React.FC<PromoCarouselProps> = ({ className }) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const plugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  );

  return (
    <div className={cn("px-4 py-3 max-w-7xl mx-auto", className)}>
      <Carousel
        opts={{ align: 'start', loop: true }}
        plugins={[plugin.current]}
        className="w-full"
      >
        <CarouselContent className="-ml-2">
          {PROMO_BANNERS.map((banner) => {
            const Icon = banner.icon;
            
            return (
              <CarouselItem key={banner.id} className="pl-2 basis-full">
                <button
                  onClick={() => navigate(banner.link_path)}
                  className={cn(
                    "relative w-full overflow-hidden rounded-2xl",
                    "bg-gradient-to-r",
                    banner.gradient,
                    "p-5 sm:p-6 text-left",
                    "shadow-lg hover:shadow-xl transition-shadow duration-300",
                    "group touch-manipulation"
                  )}
                >
                  {/* Decorative circles */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
                  
                  {/* Content */}
                  <div className="relative z-10">
                    {/* Badge */}
                    {(banner.badge_en || banner.badge_ru) && (
                      <Badge className="bg-white/20 backdrop-blur-sm border-0 text-white text-xs font-medium mb-3">
                        {isRu ? banner.badge_ru : banner.badge_en}
                      </Badge>
                    )}
                    
                    {/* Title Row */}
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold text-white">
                        {isRu ? banner.title_ru : banner.title_en}
                      </h3>
                    </div>
                    
                    {/* Subtitle */}
                    <p className="text-white/80 text-sm sm:text-base mb-4">
                      {isRu ? banner.subtitle_ru : banner.subtitle_en}
                    </p>
                    
                    {/* CTA */}
                    <div className="flex items-center gap-2 text-white font-medium text-sm group-hover:gap-3 transition-all">
                      <span>{isRu ? 'Смотреть' : 'View'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </button>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        
        {/* Pagination dots */}
        <div className="flex justify-center gap-1.5 mt-3">
          {PROMO_BANNERS.map((_, index) => (
            <div
              key={index}
              className="w-2 h-2 rounded-full bg-muted-foreground/30 transition-colors"
            />
          ))}
        </div>
      </Carousel>
    </div>
  );
};
