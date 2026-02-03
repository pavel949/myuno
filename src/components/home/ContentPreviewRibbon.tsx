import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Car, Anchor, Home as HomeIcon, Flower2, MoreHorizontal, 
  Stethoscope, Scissors, Briefcase, ChevronRight
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { triggerHaptic } from '@/hooks/useHapticFeedback';
import { cn } from '@/lib/utils';

interface ServiceCategory {
  id: string;
  icon: React.ElementType;
  emoji: string;
  label: string;
  labelRu: string;
  path: string;
  iconColor: string;
}

const SERVICE_CATEGORIES: ServiceCategory[] = [
  { 
    id: 'catalog',
    icon: Briefcase,
    emoji: '📋',
    label: 'Catalog', 
    labelRu: 'Каталог', 
    path: '/discover',
    iconColor: 'text-amber-600'
  },
  { 
    id: 'beauty', 
    icon: Scissors,
    emoji: '💅',
    label: 'Beauty', 
    labelRu: 'Красота', 
    path: '/beauty',
    iconColor: 'text-pink-500'
  },
  { 
    id: 'transport', 
    icon: Car,
    emoji: '🚗',
    label: 'Transport', 
    labelRu: 'Транспорт', 
    path: '/transport',
    iconColor: 'text-blue-500'
  },
  { 
    id: 'yachts', 
    icon: Anchor,
    emoji: '⚓',
    label: 'Yachts', 
    labelRu: 'Яхты', 
    path: '/yachts',
    iconColor: 'text-cyan-500'
  },
  { 
    id: 'property', 
    icon: HomeIcon,
    emoji: '🏠',
    label: 'Property', 
    labelRu: 'Жильё', 
    path: '/property',
    iconColor: 'text-teal-500'
  },
  { 
    id: 'flowers', 
    icon: Flower2,
    emoji: '🌸',
    label: 'Flowers', 
    labelRu: 'Цветы', 
    path: '/flowers',
    iconColor: 'text-rose-500'
  },
  { 
    id: 'medical', 
    icon: Stethoscope,
    emoji: '🏥',
    label: 'Medical', 
    labelRu: 'Медицина', 
    path: '/medical',
    iconColor: 'text-red-500'
  },
];

const MAX_VISIBLE = 6;

export const ContentPreviewRibbon = memo(function ContentPreviewRibbon() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const visibleCategories = SERVICE_CATEGORIES.slice(0, MAX_VISIBLE);
  const remainingCount = Math.max(0, SERVICE_CATEGORIES.length - MAX_VISIBLE);

  const handleCategoryClick = (path: string) => {
    triggerHaptic('light');
    navigate(path);
  };

  return (
    <div className="space-y-2">
      {/* Row: Service Categories */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide touch-pan-x pb-1">
        {visibleCategories.map((category, index) => {
          const label = isRu ? category.labelRu : category.label;
          const isFirst = index === 0;
          
          return (
            <motion.button
              key={category.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleCategoryClick(category.path)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium shrink-0",
                "transition-all",
                isFirst 
                  ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                  : "bg-muted/60 hover:bg-muted text-foreground"
              )}
            >
              <span className="text-base">{category.emoji}</span>
              <span className="whitespace-nowrap">{label}</span>
            </motion.button>
          );
        })}

        {remainingCount > 0 && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleCategoryClick('/discover')}
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
