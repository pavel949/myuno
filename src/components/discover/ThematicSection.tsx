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
        "flex items-center justify-between w-full p-3.5 rounded-xl",
        "bg-card border border-border/40",
        "hover:border-primary/40 hover:bg-accent/50 hover:shadow-sm",
        "transition-all duration-150 text-left group"
      )}
    >
      <div className="flex items-center gap-3">
        {category.icon && (
          <span className="text-xl w-8 h-8 flex items-center justify-center bg-muted rounded-lg">
            {category.icon}
          </span>
        )}
        <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
          {isRu ? category.nameRu : category.nameEn}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {category.count !== undefined && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {category.count}
          </span>
        )}
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
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
            "flex items-center justify-between w-full py-3 px-1",
            "text-left group rounded-lg hover:bg-muted/50 transition-colors"
          )}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{section.emoji}</span>
            <div>
              <span className="text-base font-bold text-foreground">
                {isRu ? section.titleRu : section.titleEn}
              </span>
              <span className="text-xs text-muted-foreground ml-2">
                ({section.categories.length})
              </span>
            </div>
          </div>
          <ChevronDown 
            className={cn(
              "w-5 h-5 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-180"
            )} 
          />
        </button>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <AnimatePresence>
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 pt-2 pb-4"
          >
            {section.categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <CategoryRow
                  category={category}
                  isRu={isRu}
                  onClick={() => handleCategoryClick(category.path)}
                />
              </motion.div>
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
      { id: 'yachts', slug: 'yachts', nameEn: 'Yachts & Boats', nameRu: 'Яхты и катера', icon: '⛵', path: '/yachts' },
      { id: 'experiences', slug: 'experiences', nameEn: 'Tours & Experiences', nameRu: 'Туры и впечатления', icon: '🗺️', path: '/experiences' },
      { id: 'restaurants', slug: 'restaurants', nameEn: 'Restaurants', nameRu: 'Рестораны', icon: '🍽️', path: '/restaurants' },
      { id: 'events', slug: 'events', nameEn: 'Events', nameRu: 'События', icon: '🎉', path: '/events' },
      { id: 'beauty', slug: 'beauty', nameEn: 'Beauty & SPA', nameRu: 'Красота и SPA', icon: '💆', path: '/beauty' },
    ],
  },
  {
    id: 'life',
    titleEn: 'For Life',
    titleRu: 'Для жизни',
    emoji: '🏠',
    defaultOpen: false,
    categories: [
      { id: 'property', slug: 'property', nameEn: 'Property Rental', nameRu: 'Аренда жилья', icon: '🏡', path: '/property' },
      { id: 'transport', slug: 'transport', nameEn: 'Transport', nameRu: 'Транспорт', icon: '🚗', path: '/transport' },
      { id: 'medical', slug: 'medical', nameEn: 'Medical', nameRu: 'Медицина', icon: '🏥', path: '/medical' },
      { id: 'education', slug: 'education', nameEn: 'Education', nameRu: 'Образование', icon: '📚', path: '/education' },
      { id: 'fitness', slug: 'fitness', nameEn: 'Fitness', nameRu: 'Фитнес', icon: '💪', path: '/fitness' },
    ],
  },
  {
    id: 'business',
    titleEn: 'For Business',
    titleRu: 'Для бизнеса',
    emoji: '💼',
    defaultOpen: false,
    categories: [
      { id: 'legal', slug: 'legal', nameEn: 'Legal Services', nameRu: 'Юридические услуги', icon: '⚖️', path: '/legal' },
      { id: 'insurance', slug: 'insurance', nameEn: 'Insurance', nameRu: 'Страхование', icon: '🛡️', path: '/insurance' },
      { id: 'banking', slug: 'banking', nameEn: 'Banking', nameRu: 'Банки', icon: '🏦', path: '/banking' },
      { id: 'services', slug: 'services', nameEn: 'Business Services', nameRu: 'Бизнес-услуги', icon: '📊', path: '/services?category=business' },
    ],
  },
];
