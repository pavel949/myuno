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
            "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium shrink-0",
            "bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/20"
          )}
        >
          <Briefcase className="w-4 h-4" />
          <span>{isRu ? 'Каталог' : 'Catalog'}</span>
        </motion.button>

        <div className="w-px h-6 bg-border shrink-0" />

        {QUICK_ACTIONS.map((action) => (
          <motion.button
            key={action.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleClick(action.path)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium shrink-0 bg-muted/60 hover:bg-muted text-foreground"
          >
            <span className="text-base">{action.emoji}</span>
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
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium shrink-0 bg-muted/60 hover:bg-muted text-foreground"
          >
            <span className="text-base">{category.emoji}</span>
            <span className="whitespace-nowrap">{isRu ? category.labelRu : category.label}</span>
          </motion.button>
        ))}

        {remainingCount > 0 && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleClick('/discover')}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium shrink-0 bg-secondary hover:bg-secondary/80 text-secondary-foreground"
          >
            <span>+{remainingCount}</span>
            <ChevronRight className="w-3 h-3" />
          </motion.button>
        )}
      </div>
    </div>
  );
});
