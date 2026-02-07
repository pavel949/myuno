import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Briefcase, ChevronRight, Flame, MapPin, Gift, 
  Sparkles, Car, Anchor, Home, Flower2,
  type LucideIcon 
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { triggerHaptic } from '@/hooks/useHapticFeedback';
import { cn } from '@/lib/utils';

interface QuickAction {
  id: string;
  icon: LucideIcon;
  iconColor: string;
  label: string;
  labelRu: string;
  path: string;
}

interface ServiceCategory {
  id: string;
  icon: LucideIcon;
  iconColor: string;
  label: string;
  labelRu: string;
  path: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: 'popular', icon: Flame, iconColor: 'text-orange-500', label: 'Popular', labelRu: 'Популярное', path: '/discover?filter=popular' },
  { id: 'nearby', icon: MapPin, iconColor: 'text-red-500', label: 'Nearby', labelRu: 'Рядом', path: '/discover?filter=nearby' },
  { id: 'promo', icon: Gift, iconColor: 'text-pink-500', label: 'Promos', labelRu: 'Акции', path: '/discover?filter=promo' },
];

const SERVICE_CATEGORIES: ServiceCategory[] = [
  { id: 'beauty', icon: Sparkles, iconColor: 'text-pink-500', label: 'Beauty', labelRu: 'Красота', path: '/beauty' },
  { id: 'transport', icon: Car, iconColor: 'text-blue-500', label: 'Transport', labelRu: 'Транспорт', path: '/transport' },
  { id: 'yachts', icon: Anchor, iconColor: 'text-cyan-500', label: 'Charters', labelRu: 'Чартер', path: '/yachts' },
  { id: 'property', icon: Home, iconColor: 'text-emerald-500', label: 'Property', labelRu: 'Жильё', path: '/property' },
  { id: 'flowers', icon: Flower2, iconColor: 'text-rose-500', label: 'Flowers', labelRu: 'Цветы', path: '/flowers' },
];

const MAX_VISIBLE = 5;

export const ContentPreviewRibbon = memo(function ContentPreviewRibbon() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const visibleCategories = SERVICE_CATEGORIES.slice(0, MAX_VISIBLE);
  const remainingCount = Math.max(0, SERVICE_CATEGORIES.length - MAX_VISIBLE);

  const handleClick = (path: string) => {
    triggerHaptic('light');
    navigate(path);
  };

  return (
    <div className="space-y-2">
      {/* Row 1: Quick Actions */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide touch-pan-y pb-1">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => handleClick('/discover')}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium shrink-0",
            "bg-gradient-to-r from-amber-500/15 to-orange-500/15",
            "border border-amber-500/30 hover:border-amber-500/50",
            "text-amber-700 dark:text-amber-300",
            "shadow-sm hover:shadow-md transition-all duration-200"
          )}
        >
          <div className="w-5 h-5 rounded-md bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
            <Briefcase className="w-3 h-3 text-white" />
          </div>
          <span>{isRu ? 'Каталог' : 'Catalog'}</span>
        </motion.button>

        <div className="w-px h-6 bg-border/50 shrink-0" />

        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleClick(action.path)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium shrink-0",
                "bg-white/80 dark:bg-white/10",
                "backdrop-blur-md",
                "border border-white/50 dark:border-white/20",
                "shadow-sm hover:shadow-md",
                "transition-all duration-200"
              )}
            >
              <div className="w-5 h-5 rounded-md bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
                <Icon className={cn("w-3 h-3", action.iconColor)} />
              </div>
              <span>{isRu ? action.labelRu : action.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Row 2: Top Categories */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide touch-pan-y pb-1">
        {visibleCategories.map((category) => {
          const Icon = category.icon;
          return (
            <motion.button
              key={category.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleClick(category.path)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium shrink-0",
                "bg-white/80 dark:bg-white/10",
                "backdrop-blur-md",
                "border border-white/50 dark:border-white/20",
                "shadow-sm hover:shadow-md",
                "transition-all duration-200"
              )}
            >
              <div className="w-5 h-5 rounded-md bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
                <Icon className={cn("w-3 h-3", category.iconColor)} />
              </div>
              <span className="whitespace-nowrap">{isRu ? category.labelRu : category.label}</span>
            </motion.button>
          );
        })}

        {remainingCount > 0 && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleClick('/discover')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium shrink-0",
              "bg-gradient-to-r from-primary/10 to-amber-500/10",
              "border border-primary/20 hover:border-primary/40",
              "text-primary",
              "shadow-sm hover:shadow-md transition-all duration-200"
            )}
          >
            <span>+{remainingCount}</span>
            <ChevronRight className="w-3 h-3" />
          </motion.button>
        )}
      </div>
    </div>
  );
});
