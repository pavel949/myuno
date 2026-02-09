import { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift, Percent, Sparkles, ArrowRight } from 'lucide-react';
import Autoplay from 'embla-carousel-autoplay';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/hooks/useHapticFeedback';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';

interface Promo {
  id: string;
  type: 'cashback' | 'discount' | 'special';
  title: string;
  titleRu: string;
  subtitle: string;
  subtitleRu: string;
  badge: string;
  badgeRu: string;
  path: string;
  icon: typeof Gift;
}

const promos: Promo[] = [
  {
    id: '1',
    type: 'cashback',
    title: '10% Cashback on Tours',
    titleRu: '10% кэшбэк на туры',
    subtitle: 'Book any island tour this week',
    subtitleRu: 'Забронируйте любой тур на острова',
    badge: 'LIMITED',
    badgeRu: 'АКЦИЯ',
    path: '/experiences?type=tour',
    icon: Percent,
  },
  {
    id: '2',
    type: 'discount',
    title: 'First Spa Visit -20%',
    titleRu: '-20% на первый визит в СПА',
    subtitle: 'For new members',
    subtitleRu: 'Для новых клиентов',
    badge: 'NEW',
    badgeRu: 'НОВОЕ',
    path: '/beauty',
    icon: Sparkles,
  },
  {
    id: '3',
    type: 'special',
    title: 'Free Airport Pickup',
    titleRu: 'Бесплатный трансфер из аэропорта',
    subtitle: 'With any property booking 7+ days',
    subtitleRu: 'При бронировании жилья от 7 дней',
    badge: 'BONUS',
    badgeRu: 'БОНУС',
    path: '/property',
    icon: Gift,
  },
];

interface PromoSlideProps {
  promo: Promo;
  language: string;
  onNavigate: (path: string) => void;
}

const PromoSlide = memo(function PromoSlide({ promo, language, onNavigate }: PromoSlideProps) {
  const Icon = promo.icon;
  
  return (
    <button
      onClick={() => onNavigate(promo.path)}
      className="relative w-full overflow-hidden rounded-2xl bg-primary group"
    >
      {/* Content */}
      <div className="relative z-10 w-full p-4 text-left">
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className="w-12 h-12 rounded-xl bg-primary-foreground/15 flex items-center justify-center flex-shrink-0 group-hover:scale-[1.03] transition-transform duration-200">
            <Icon className="w-6 h-6 text-primary-foreground" />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full bg-primary-foreground/15 text-[10px] font-bold text-primary-foreground uppercase tracking-wide">
                {language === 'ru' ? promo.badgeRu : promo.badge}
              </span>
            </div>
            <h3 className="text-base font-bold text-primary-foreground line-clamp-1">
              {language === 'ru' ? promo.titleRu : promo.title}
            </h3>
            <p className="text-xs text-primary-foreground/70 line-clamp-1">
              {language === 'ru' ? promo.subtitleRu : promo.subtitle}
            </p>
          </div>

          {/* Arrow */}
          <ArrowRight className="w-5 h-5 text-primary-foreground/70 flex-shrink-0 group-hover:translate-x-1 transition-transform duration-200" />
        </div>
      </div>
    </button>
  );
});

export const PromoBanner = memo(function PromoBanner() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [api, setApi] = useState<CarouselApi>();
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const autoplayPlugin = useMemo(
    () =>
      Autoplay({
        delay: 8000,
        stopOnInteraction: true,
        stopOnMouseEnter: true,
      }),
    []
  );

  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      const newIndex = api.selectedScrollSnap();
      if (newIndex !== currentIndex) {
        setCurrentIndex(newIndex);
        triggerHaptic('light');
      }
    };

    api.on('select', onSelect);
    onSelect();

    return () => {
      api.off('select', onSelect);
    };
  }, [api, currentIndex]);

  const handleNavigate = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  const goToSlide = useCallback((index: number) => {
    api?.scrollTo(index);
  }, [api]);

  return (
    <div className="relative">
      <Carousel
        setApi={setApi}
        plugins={[autoplayPlugin]}
        opts={{
          loop: true,
          align: 'start',
          skipSnaps: false,
          dragFree: false,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-0">
          {promos.map((promo) => (
            <CarouselItem key={promo.id} className="pl-0">
              <PromoSlide
                promo={promo}
                language={language}
                onNavigate={handleNavigate}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Navigation dots */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
        {promos.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={cn(
              "w-1.5 h-1.5 rounded-full transition-all duration-200",
              index === currentIndex 
                ? "w-4 bg-primary-foreground" 
                : "bg-primary-foreground/40 hover:bg-primary-foreground/60"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
});

PromoBanner.displayName = 'PromoBanner';
