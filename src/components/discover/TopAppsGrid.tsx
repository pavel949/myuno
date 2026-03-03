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
    titleEn: 'Housing',
    titleRu: 'Жильё',
    descEn: 'Villas & Condos',
    descRu: 'Виллы и кондо',
    countLabel: 'Top',
    path: '/property',
    gradient: 'from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5',
    iconColor: 'text-primary',
  },
  {
    id: 'yachts',
    icon: <Sailboat className="w-7 h-7" />,
    titleEn: 'Yachts',
    titleRu: 'Яхты',
    descEn: 'Boats & Cruises',
    descRu: 'Катера и круизы',
    countLabel: 'Hot',
    path: '/yachts',
    gradient: 'from-accent/50 to-muted/50 dark:from-accent/30 dark:to-muted/30',
    iconColor: 'text-accent-foreground',
  },
  {
    id: 'transport',
    icon: <Car className="w-7 h-7" />,
    titleEn: 'Transport',
    titleRu: 'Транспорт',
    descEn: 'Cars & Bikes',
    descRu: 'Авто и мото',
    countLabel: 'New',
    path: '/transport',
    gradient: 'from-muted/50 to-accent/50 dark:from-muted/30 dark:to-accent/30',
    iconColor: 'text-primary',
  },
  {
    id: 'beauty',
    icon: <Sparkles className="w-7 h-7" />,
    titleEn: 'Beauty',
    titleRu: 'Красота',
    descEn: 'SPA & Wellness',
    descRu: 'СПА и массаж',
    countLabel: 'Top',
    path: '/beauty',
    gradient: 'from-primary/5 to-accent/50 dark:from-primary/10 dark:to-accent/30',
    iconColor: 'text-primary',
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
      type="button"
      className={cn(
        "relative flex flex-col items-start justify-between p-4 rounded-2xl",
        "bg-gradient-to-br border border-border/40",
        "hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5",
        "transition-all duration-200 active:scale-[0.98]",
        "aspect-[4/3] text-left group cursor-pointer",
        app.gradient
      )}
      style={{ touchAction: 'manipulation' }}
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
        <p className="text-xs text-foreground/60">
          {isRu ? app.descRu : app.descEn}
        </p>
      </div>
      
      {/* Count badge */}
      <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-card/90 dark:bg-card/60 shadow-sm border border-border/30">
        <Star className="w-3 h-3 text-primary fill-primary" />
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
