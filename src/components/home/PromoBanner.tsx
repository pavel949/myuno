import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift, Percent, Sparkles, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

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
  gradient: string;
  icon: typeof Gift;
}

const promos: Promo[] = [
  {
    id: '1',
    type: 'cashback',
    title: '10% Cashback on Tours',
    titleRu: '10% кэшбэк на туры',
    subtitle: 'Book any island tour this week',
    subtitleRu: 'Бронируй любой тур на острова',
    badge: 'LIMITED',
    badgeRu: 'АКЦИЯ',
    path: '/tours',
    gradient: 'from-emerald-500 to-teal-500',
    icon: Percent,
  },
  {
    id: '2',
    type: 'discount',
    title: 'First Spa Visit -20%',
    titleRu: '-20% на первый визит в СПА',
    subtitle: 'New members exclusive offer',
    subtitleRu: 'Только для новых клиентов',
    badge: 'NEW',
    badgeRu: 'НОВОЕ',
    path: '/beauty',
    gradient: 'from-pink-500 to-rose-500',
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
    gradient: 'from-blue-500 to-indigo-500',
    icon: Gift,
  },
];

export function PromoBanner() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % promos.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused]);

  const currentPromo = promos[currentIndex];
  const Icon = currentPromo.icon;

  const goTo = (index: number) => {
    setCurrentIndex(index);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 10000);
  };

  const prev = () => goTo((currentIndex - 1 + promos.length) % promos.length);
  const next = () => goTo((currentIndex + 1) % promos.length);

  return (
    <div 
      className="relative overflow-hidden rounded-2xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background gradient */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-r transition-all duration-500",
        currentPromo.gradient
      )} />
      
      {/* Content */}
      <button
        onClick={() => navigate(currentPromo.path)}
        className="relative z-10 w-full p-4 text-left group"
      >
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <Icon className="w-6 h-6 text-white" />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold text-white uppercase tracking-wide">
                {language === 'ru' ? currentPromo.badgeRu : currentPromo.badge}
              </span>
            </div>
            <h3 className="text-base font-bold text-white line-clamp-1">
              {language === 'ru' ? currentPromo.titleRu : currentPromo.title}
            </h3>
            <p className="text-xs text-white/80 line-clamp-1">
              {language === 'ru' ? currentPromo.subtitleRu : currentPromo.subtitle}
            </p>
          </div>

          {/* Arrow */}
          <ArrowRight className="w-5 h-5 text-white/80 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
        </div>
      </button>

      {/* Navigation dots */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
        {promos.map((_, index) => (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              goTo(index);
            }}
            className={cn(
              "w-1.5 h-1.5 rounded-full transition-all",
              index === currentIndex 
                ? "w-4 bg-white" 
                : "bg-white/40 hover:bg-white/60"
            )}
          />
        ))}
      </div>

      {/* Navigation arrows (visible on hover) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          prev();
        }}
        className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-white/30 transition-all z-10"
      >
        <ChevronLeft className="w-4 h-4 text-white" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          next();
        }}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-white/30 transition-all z-10"
      >
        <ChevronRight className="w-4 h-4 text-white" />
      </button>
    </div>
  );
}
