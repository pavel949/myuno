import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Sailboat, Car, Sparkles, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/hooks/useHapticFeedback';

interface TopApp {
  id: string;
  icon: React.ReactNode;
  titleEn: string;
  titleRu: string;
  countLabel: string;
  path: string;
  gradient: string;
  iconBg: string;
}

const TOP_APPS: TopApp[] = [
  {
    id: 'property',
    icon: <Home className="w-6 h-6 text-amber-600" />,
    titleEn: 'Property',
    titleRu: 'Аренда',
    countLabel: '1,200+',
    path: '/property',
    gradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
    iconBg: 'bg-amber-500/15',
  },
  {
    id: 'yachts',
    icon: <Sailboat className="w-6 h-6 text-sky-600" />,
    titleEn: 'Yachts',
    titleRu: 'Яхты',
    countLabel: '45+',
    path: '/yachts',
    gradient: 'from-sky-500/20 via-blue-500/10 to-transparent',
    iconBg: 'bg-sky-500/15',
  },
  {
    id: 'transport',
    icon: <Car className="w-6 h-6 text-emerald-600" />,
    titleEn: 'Transport',
    titleRu: 'Транспорт',
    countLabel: '100+',
    path: '/transport',
    gradient: 'from-emerald-500/20 via-green-500/10 to-transparent',
    iconBg: 'bg-emerald-500/15',
  },
  {
    id: 'beauty',
    icon: <Sparkles className="w-6 h-6 text-rose-600" />,
    titleEn: 'Beauty',
    titleRu: 'Красота',
    countLabel: '200+',
    path: '/beauty',
    gradient: 'from-rose-500/20 via-pink-500/10 to-transparent',
    iconBg: 'bg-rose-500/15',
  },
];

interface TopAppCardProps {
  app: TopApp;
  isRu: boolean;
  onClick: () => void;
}

const TopAppCard = memo(function TopAppCard({ app, isRu, onClick }: TopAppCardProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center justify-center p-4 rounded-2xl",
        "bg-gradient-to-br border border-border/50",
        "hover:border-primary/30 hover:shadow-md",
        "transition-all active:scale-[0.98]",
        "aspect-square",
        app.gradient
      )}
    >
      <div className={cn(
        "w-12 h-12 rounded-xl flex items-center justify-center mb-2",
        app.iconBg
      )}>
        {app.icon}
      </div>
      <span className="text-sm font-semibold text-foreground">
        {isRu ? app.titleRu : app.titleEn}
      </span>
      <span className="text-xs text-muted-foreground mt-0.5">
        {app.countLabel}
      </span>
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
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">
          {isRu ? 'Популярные сервисы' : 'Top Services'}
        </h2>
        <button 
          onClick={() => navigate('/discover')}
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          {isRu ? 'Все' : 'All'}
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* 2x2 Grid */}
      <div className="grid grid-cols-2 gap-3">
        {TOP_APPS.map((app) => (
          <TopAppCard
            key={app.id}
            app={app}
            isRu={isRu}
            onClick={() => handleClick(app.path)}
          />
        ))}
      </div>
    </div>
  );
});
