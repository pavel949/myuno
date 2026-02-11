import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { triggerHaptic } from '@/hooks/useHapticFeedback';
import { Sailboat, Sparkles, UtensilsCrossed, Palmtree, Car, Flower2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeaturedService {
  id: string;
  icon: React.ReactNode;
  titleEn: string;
  titleRu: string;
  subtitleEn: string;
  subtitleRu: string;
  path: string;
  accentFrom: string;
  accentTo: string;
  iconColor: string;
  emoji: string;
}

const FEATURED: FeaturedService[] = [
  {
    id: 'experiences',
    icon: <Palmtree className="w-6 h-6" />,
    titleEn: 'Experiences',
    titleRu: 'Впечатления',
    subtitleEn: 'Tours & Activities',
    subtitleRu: 'Туры и активности',
    path: '/experiences',
    accentFrom: 'from-emerald-500',
    accentTo: 'to-teal-600',
    iconColor: 'text-white',
    emoji: '🌴',
  },
  {
    id: 'yachts',
    icon: <Sailboat className="w-6 h-6" />,
    titleEn: 'Yachts',
    titleRu: 'Яхты',
    subtitleEn: 'Boats & Cruises',
    subtitleRu: 'Катера и круизы',
    path: '/yachts',
    accentFrom: 'from-sky-500',
    accentTo: 'to-blue-600',
    iconColor: 'text-white',
    emoji: '⛵',
  },
  {
    id: 'beauty',
    icon: <Sparkles className="w-6 h-6" />,
    titleEn: 'Beauty',
    titleRu: 'Красота',
    subtitleEn: 'SPA & Wellness',
    subtitleRu: 'СПА и массаж',
    path: '/beauty',
    accentFrom: 'from-rose-400',
    accentTo: 'to-pink-600',
    iconColor: 'text-white',
    emoji: '✨',
  },
  {
    id: 'transport',
    icon: <Car className="w-6 h-6" />,
    titleEn: 'Transport',
    titleRu: 'Транспорт',
    subtitleEn: 'Cars & Bikes',
    subtitleRu: 'Авто и мото',
    path: '/transport',
    accentFrom: 'from-amber-500',
    accentTo: 'to-orange-600',
    iconColor: 'text-white',
    emoji: '🚗',
  },
  {
    id: 'restaurants',
    icon: <UtensilsCrossed className="w-6 h-6" />,
    titleEn: 'Dining',
    titleRu: 'Рестораны',
    subtitleEn: 'Best places',
    subtitleRu: 'Лучшие заведения',
    path: '/restaurants',
    accentFrom: 'from-orange-500',
    accentTo: 'to-red-500',
    iconColor: 'text-white',
    emoji: '🍽️',
  },
  {
    id: 'flowers',
    icon: <Flower2 className="w-6 h-6" />,
    titleEn: 'Flowers',
    titleRu: 'Цветы',
    subtitleEn: 'Fresh delivery',
    subtitleRu: 'Доставка букетов',
    path: '/flowers',
    accentFrom: 'from-pink-400',
    accentTo: 'to-fuchsia-600',
    iconColor: 'text-white',
    emoji: '💐',
  },
];

export const FeaturedStrip = memo(function FeaturedStrip() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">
          {isRu ? 'Популярное' : 'Featured'}
        </h2>
        <button
          onClick={() => navigate('/catalog')}
          className="flex items-center gap-1 text-xs font-medium text-primary"
        >
          {isRu ? 'Все сервисы' : 'All services'}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
        {FEATURED.map((item, i) => (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { triggerHaptic('light'); navigate(item.path); }}
            className={cn(
              "flex-shrink-0 w-[150px] snap-start relative",
              "flex flex-col justify-end rounded-2xl overflow-hidden",
              "shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300",
              "text-left group cursor-pointer h-[180px]",
              "bg-gradient-to-br",
              item.accentFrom, item.accentTo,
            )}
            style={{ touchAction: 'manipulation' }}
          >
            {/* Large emoji background */}
            <div className="absolute top-3 right-3 text-4xl opacity-30 group-hover:opacity-50 group-hover:scale-110 transition-all duration-300">
              {item.emoji}
            </div>

            {/* Icon circle */}
            <div className="absolute top-4 left-4">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20">
                <span className={item.iconColor}>{item.icon}</span>
              </div>
            </div>

            {/* Content at bottom */}
            <div className="relative p-4 pt-0">
              <h3 className="text-[15px] font-bold text-white leading-tight">
                {isRu ? item.titleRu : item.titleEn}
              </h3>
              <p className="text-[11px] text-white/70 mt-0.5">
                {isRu ? item.subtitleRu : item.subtitleEn}
              </p>
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  );
});
