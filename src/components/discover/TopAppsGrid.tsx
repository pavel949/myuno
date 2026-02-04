import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Sailboat, Car, Sparkles, ChevronRight, Star } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/hooks/useHapticFeedback';

interface TopApp {
  id: string;
  icon: React.ReactNode;
  titleEn: string;
  titleRu: string;
  descEn: string;
  descRu: string;
  countLabel: string;
  path: string;
  gradient: string;
  iconColor: string;
}

const TOP_APPS: TopApp[] = [
  {
    id: 'property',
    icon: <Home className="w-7 h-7" />,
    titleEn: 'Property',
    titleRu: 'Аренда',
    descEn: 'Villas & Condos',
    descRu: 'Виллы и кондо',
    countLabel: '1,200+',
    path: '/property',
    gradient: 'from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  {
    id: 'yachts',
    icon: <Sailboat className="w-7 h-7" />,
    titleEn: 'Yachts',
    titleRu: 'Яхты',
    descEn: 'Boats & Cruises',
    descRu: 'Катера и круизы',
    countLabel: '45+',
    path: '/yachts',
    gradient: 'from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30',
    iconColor: 'text-sky-600 dark:text-sky-400',
  },
  {
    id: 'transport',
    icon: <Car className="w-7 h-7" />,
    titleEn: 'Transport',
    titleRu: 'Транспорт',
    descEn: 'Cars & Bikes',
    descRu: 'Авто и мото',
    countLabel: '100+',
    path: '/transport',
    gradient: 'from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    id: 'beauty',
    icon: <Sparkles className="w-7 h-7" />,
    titleEn: 'Beauty',
    titleRu: 'Красота',
    descEn: 'SPA & Wellness',
    descRu: 'СПА и массаж',
    countLabel: '200+',
    path: '/beauty',
    gradient: 'from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30',
    iconColor: 'text-rose-600 dark:text-rose-400',
  },
];

interface TopAppCardProps {
  app: TopApp;
  isRu: boolean;
  onClick: () => void;
  index: number;
}

const TopAppCard = memo(function TopAppCard({ app, isRu, onClick, index }: TopAppCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-start justify-between p-4 rounded-2xl",
        "bg-gradient-to-br border border-border/40",
        "hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5",
        "transition-all duration-200 active:scale-[0.98]",
        "aspect-[4/3] text-left group",
        app.gradient
      )}
    >
      {/* Icon */}
      <div className={cn(
        "w-14 h-14 rounded-xl flex items-center justify-center",
        "bg-white/80 dark:bg-white/10 shadow-sm",
        "group-hover:scale-105 transition-transform"
      )}>
        <span className={app.iconColor}>{app.icon}</span>
      </div>
      
      {/* Content */}
      <div className="space-y-0.5 mt-auto">
        <h3 className="text-base font-bold text-foreground">
          {isRu ? app.titleRu : app.titleEn}
        </h3>
        <p className="text-xs text-muted-foreground">
          {isRu ? app.descRu : app.descEn}
        </p>
      </div>
      
      {/* Count badge */}
      <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-white/90 dark:bg-black/40 shadow-sm">
        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
        <span className="text-[10px] font-semibold text-foreground">
          {app.countLabel}
        </span>
      </div>
    </motion.button>
  );
});

export const TopAppsGrid = memo(function TopAppsGrid() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const handleClick = (path: string) => {
    triggerHaptic('light');
    navigate(path);
  };

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-primary/15 to-primary/5 rounded-xl">
            <Star className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {isRu ? 'Топ сервисы' : 'Top Services'}
            </h2>
            <p className="text-xs text-muted-foreground">
              {isRu ? 'Самые популярные' : 'Most popular'}
            </p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/services')}
          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          {isRu ? 'Все' : 'All'}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 2x2 Grid */}
      <div className="grid grid-cols-2 gap-3">
        {TOP_APPS.map((app, index) => (
          <TopAppCard
            key={app.id}
            app={app}
            isRu={isRu}
            onClick={() => handleClick(app.path)}
            index={index}
          />
        ))}
      </div>
    </section>
  );
});
