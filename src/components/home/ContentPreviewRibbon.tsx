import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Car, Anchor, Home, Flower2, MoreHorizontal, Stethoscope, Scissors } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { triggerHaptic } from '@/hooks/useHapticFeedback';
import { cn } from '@/lib/utils';

interface ServiceCategory {
  id: string;
  icon: React.ElementType;
  label: string;
  labelRu: string;
  path: string;
  gradient: string;
}

const SERVICE_CATEGORIES: ServiceCategory[] = [
  { 
    id: 'beauty', 
    icon: Scissors, 
    label: 'Beauty', 
    labelRu: 'Красота', 
    path: '/beauty', 
    gradient: 'from-pink-500 to-rose-600' 
  },
  { 
    id: 'transport', 
    icon: Car, 
    label: 'Transport', 
    labelRu: 'Транспорт', 
    path: '/transport', 
    gradient: 'from-blue-500 to-indigo-600' 
  },
  { 
    id: 'yachts', 
    icon: Anchor, 
    label: 'Yachts', 
    labelRu: 'Яхты', 
    path: '/yachts', 
    gradient: 'from-cyan-500 to-blue-600' 
  },
  { 
    id: 'property', 
    icon: Home, 
    label: 'Property', 
    labelRu: 'Жильё', 
    path: '/property', 
    gradient: 'from-teal-500 to-emerald-600' 
  },
  { 
    id: 'flowers', 
    icon: Flower2, 
    label: 'Flowers', 
    labelRu: 'Цветы', 
    path: '/flowers', 
    gradient: 'from-rose-500 to-pink-600' 
  },
  { 
    id: 'medical', 
    icon: Stethoscope, 
    label: 'Medical', 
    labelRu: 'Медицина', 
    path: '/medical', 
    gradient: 'from-red-500 to-rose-600' 
  },
  { 
    id: 'more', 
    icon: MoreHorizontal, 
    label: 'More', 
    labelRu: 'Ещё', 
    path: '/discover', 
    gradient: 'from-slate-500 to-slate-600' 
  },
];

export const ContentPreviewRibbon = memo(function ContentPreviewRibbon() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const handleCategoryClick = (path: string) => {
    triggerHaptic('light');
    navigate(path);
  };

  return (
    <div className="space-y-2">
      {/* Row: Popular Categories */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide touch-pan-x pb-1">
        {SERVICE_CATEGORIES.map((category) => {
          const Icon = category.icon;
          const label = isRu ? category.labelRu : category.label;
          
          return (
            <motion.button
              key={category.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleCategoryClick(category.path)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium shrink-0",
                "bg-gradient-to-r text-white shadow-sm",
                "hover:shadow-md transition-shadow",
                category.gradient
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="whitespace-nowrap">{label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
});
