import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { triggerHaptic } from '@/hooks/useHapticFeedback';
import { cn } from '@/lib/utils';

interface QuickAction {
  id: string;
  emoji: string;
  label: string;
  labelRu: string;
  path: string;
}

interface ServiceCategory {
  id: string;
  emoji: string;
  label: string;
  labelRu: string;
  path: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: 'popular', emoji: '🔥', label: 'Popular', labelRu: 'Популярное', path: '/discover?filter=popular' },
  { id: 'nearby', emoji: '📍', label: 'Nearby', labelRu: 'Рядом', path: '/discover?filter=nearby' },
  { id: 'promo', emoji: '🎁', label: 'Promos', labelRu: 'Акции', path: '/discover?filter=promo' },
];

const SERVICE_CATEGORIES: ServiceCategory[] = [
  { id: 'beauty', emoji: '💅', label: 'Beauty', labelRu: 'Красота', path: '/beauty' },
  { id: 'transport', emoji: '🚗', label: 'Transport', labelRu: 'Транспорт', path: '/transport' },
  { id: 'yachts', emoji: '⚓', label: 'Yachts', labelRu: 'Яхты', path: '/yachts' },
  { id: 'property', emoji: '🏠', label: 'Property', labelRu: 'Жильё', path: '/property' },
  { id: 'flowers', emoji: '🌸', label: 'Flowers', labelRu: 'Цветы', path: '/flowers' },
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
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide touch-pan-x pb-1">
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

        {QUICK_ACTIONS.map((action) => (
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
              <span className="text-xs">{action.emoji}</span>
            </div>
            <span>{isRu ? action.labelRu : action.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Row 2: Top Categories */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide touch-pan-x pb-1">
        {visibleCategories.map((category) => (
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
              <span className="text-xs">{category.emoji}</span>
            </div>
            <span className="whitespace-nowrap">{isRu ? category.labelRu : category.label}</span>
          </motion.button>
        ))}

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
