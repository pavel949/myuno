import React, { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/hooks/useHapticFeedback';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export interface ThematicCategory {
  id: string;
  slug: string;
  nameEn: string;
  nameRu: string;
  icon?: string;
  path: string;
  count?: number;
}

export interface ThematicSectionData {
  id: string;
  titleEn: string;
  titleRu: string;
  emoji: string;
  categories: ThematicCategory[];
  defaultOpen?: boolean;
}

interface ThematicSectionProps {
  section: ThematicSectionData;
}

const CategoryRow = memo(function CategoryRow({ 
  category, 
  isRu, 
  onClick 
}: { 
  category: ThematicCategory; 
  isRu: boolean; 
  onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "flex items-center justify-between w-full p-3 rounded-xl",
        "bg-background/50 border border-border/30",
        "hover:border-primary/30 hover:bg-background/80",
        "transition-all text-left"
      )}
    >
      <div className="flex items-center gap-3">
        {category.icon && (
          <span className="text-lg">{category.icon}</span>
        )}
        <span className="text-sm font-medium text-foreground">
          {isRu ? category.nameRu : category.nameEn}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {category.count !== undefined && (
          <span className="text-xs text-muted-foreground">
            {category.count}
          </span>
        )}
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>
    </motion.button>
  );
});

export const ThematicSection = memo(function ThematicSection({ section }: ThematicSectionProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [isOpen, setIsOpen] = useState(section.defaultOpen ?? true);

  const handleCategoryClick = (path: string) => {
    triggerHaptic('light');
    navigate(path);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            "flex items-center justify-between w-full py-2",
            "text-left group"
          )}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{section.emoji}</span>
            <span className="text-sm font-semibold text-foreground">
              {isRu ? section.titleRu : section.titleEn}
            </span>
            <span className="text-xs text-muted-foreground">
              ({section.categories.length})
            </span>
          </div>
          <ChevronDown 
            className={cn(
              "w-4 h-4 text-muted-foreground transition-transform",
              isOpen && "rotate-180"
            )} 
          />
        </button>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <AnimatePresence>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2 pt-2"
          >
            {section.categories.map((category) => (
              <CategoryRow
                key={category.id}
                category={category}
                isRu={isRu}
                onClick={() => handleCategoryClick(category.path)}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </CollapsibleContent>
    </Collapsible>
  );
});

// Predefined thematic sections for Discovery page
export const THEMATIC_SECTIONS: ThematicSectionData[] = [
  {
    id: 'leisure',
    titleEn: 'For Leisure',
    titleRu: 'Для отдыха',
    emoji: '🌴',
    defaultOpen: true,
    categories: [
      { id: 'yachts', slug: 'yachts', nameEn: 'Yachts & Boats', nameRu: 'Яхты и катера', icon: '⛵', path: '/yachts', count: 45 },
      { id: 'tours', slug: 'tours', nameEn: 'Tours & Excursions', nameRu: 'Туры и экскурсии', icon: '🗺️', path: '/tours', count: 120 },
      { id: 'restaurants', slug: 'restaurants', nameEn: 'Restaurants', nameRu: 'Рестораны', icon: '🍽️', path: '/restaurants', count: 200 },
      { id: 'events', slug: 'events', nameEn: 'Events', nameRu: 'События', icon: '🎉', path: '/events', count: 30 },
      { id: 'beauty', slug: 'beauty', nameEn: 'Beauty & SPA', nameRu: 'Красота и SPA', icon: '💆', path: '/beauty', count: 150 },
    ],
  },
  {
    id: 'life',
    titleEn: 'For Life',
    titleRu: 'Для жизни',
    emoji: '🏠',
    defaultOpen: false,
    categories: [
      { id: 'property', slug: 'property', nameEn: 'Property Rental', nameRu: 'Аренда жилья', icon: '🏡', path: '/property', count: 1200 },
      { id: 'transport', slug: 'transport', nameEn: 'Transport', nameRu: 'Транспорт', icon: '🚗', path: '/transport', count: 100 },
      { id: 'medical', slug: 'medical', nameEn: 'Medical', nameRu: 'Медицина', icon: '🏥', path: '/medical', count: 50 },
      { id: 'education', slug: 'education', nameEn: 'Education', nameRu: 'Образование', icon: '📚', path: '/education', count: 25 },
      { id: 'fitness', slug: 'fitness', nameEn: 'Fitness', nameRu: 'Фитнес', icon: '💪', path: '/fitness', count: 40 },
    ],
  },
  {
    id: 'business',
    titleEn: 'For Business',
    titleRu: 'Для бизнеса',
    emoji: '💼',
    defaultOpen: false,
    categories: [
      { id: 'legal', slug: 'legal', nameEn: 'Legal Services', nameRu: 'Юридические услуги', icon: '⚖️', path: '/legal', count: 30 },
      { id: 'insurance', slug: 'insurance', nameEn: 'Insurance', nameRu: 'Страхование', icon: '🛡️', path: '/insurance', count: 15 },
      { id: 'banking', slug: 'banking', nameEn: 'Banking', nameRu: 'Банки', icon: '🏦', path: '/banking', count: 10 },
      { id: 'accounting', slug: 'accounting', nameEn: 'Accounting', nameRu: 'Бухгалтерия', icon: '📊', path: '/accounting', count: 20 },
    ],
  },
];
