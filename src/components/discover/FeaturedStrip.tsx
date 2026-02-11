import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { triggerHaptic } from '@/hooks/useHapticFeedback';
import { Sailboat, Sparkles, UtensilsCrossed, Palmtree, Car, Flower2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeaturedService {
  id: string;
  icon: React.ReactNode;
  titleEn: string;
  titleRu: string;
  subtitleEn: string;
  subtitleRu: string;
  path: string;
  bgColor: string;
  iconColor: string;
}

const FEATURED: FeaturedService[] = [
  {
    id: 'experiences',
    icon: <Palmtree className="w-7 h-7" />,
    titleEn: 'Experiences',
    titleRu: 'Впечатления',
    subtitleEn: 'Tours & Activities',
    subtitleRu: 'Туры и активности',
    path: '/experiences',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    id: 'yachts',
    icon: <Sailboat className="w-7 h-7" />,
    titleEn: 'Yachts',
    titleRu: 'Яхты',
    subtitleEn: 'Boats & Cruises',
    subtitleRu: 'Катера и круизы',
    path: '/yachts',
    bgColor: 'bg-sky-50 dark:bg-sky-950/30',
    iconColor: 'text-sky-600 dark:text-sky-400',
  },
  {
    id: 'beauty',
    icon: <Sparkles className="w-7 h-7" />,
    titleEn: 'Beauty',
    titleRu: 'Красота',
    subtitleEn: 'SPA & Wellness',
    subtitleRu: 'СПА и массаж',
    path: '/beauty',
    bgColor: 'bg-rose-50 dark:bg-rose-950/30',
    iconColor: 'text-rose-600 dark:text-rose-400',
  },
  {
    id: 'transport',
    icon: <Car className="w-7 h-7" />,
    titleEn: 'Transport',
    titleRu: 'Транспорт',
    subtitleEn: 'Cars & Bikes',
    subtitleRu: 'Авто и мото',
    path: '/transport',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  {
    id: 'restaurants',
    icon: <UtensilsCrossed className="w-7 h-7" />,
    titleEn: 'Dining',
    titleRu: 'Рестораны',
    subtitleEn: 'Best places to eat',
    subtitleRu: 'Лучшие заведения',
    path: '/restaurants',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    iconColor: 'text-orange-600 dark:text-orange-400',
  },
  {
    id: 'flowers',
    icon: <Flower2 className="w-7 h-7" />,
    titleEn: 'Flowers',
    titleRu: 'Цветы',
    subtitleEn: 'Fresh delivery',
    subtitleRu: 'Доставка букетов',
    path: '/flowers',
    bgColor: 'bg-pink-50 dark:bg-pink-950/30',
    iconColor: 'text-pink-600 dark:text-pink-400',
  },
];

export const FeaturedStrip = memo(function FeaturedStrip() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-foreground">
        {isRu ? 'Популярное' : 'Featured'}
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
        {FEATURED.map((item, i) => (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => { triggerHaptic('light'); navigate(item.path); }}
            className={cn(
              "flex-shrink-0 w-[140px] snap-start",
              "flex flex-col items-start gap-3 p-4 rounded-2xl",
              "border border-border/40 shadow-sm",
              "hover:shadow-md hover:-translate-y-0.5 transition-all duration-200",
              "text-left group cursor-pointer",
              item.bgColor
            )}
            style={{ touchAction: 'manipulation' }}
          >
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              "bg-white/80 dark:bg-white/10 shadow-sm",
              "group-hover:scale-105 transition-transform"
            )}>
              <span className={item.iconColor}>{item.icon}</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground leading-tight">
                {isRu ? item.titleRu : item.titleEn}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                {isRu ? item.subtitleRu : item.subtitleEn}
              </p>
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  );
});
