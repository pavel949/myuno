import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, Flame, Star, Sparkles, ChevronRight,
  Leaf, Milk, Beef, Fish, Croissant, CupSoda, Cookie,
  Snowflake, Box, Baby, Home, Droplets, Dog, Smartphone, Shirt,
  type LucideIcon
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMarketplaceCategories } from '@/hooks/useMarketplace';
import { triggerHaptic } from '@/hooks/useHapticFeedback';
import { cn } from '@/lib/utils';
import { getIconForEmoji, isEmoji } from '@/lib/iconMap';

// Lucide icon mapping for categories
const categoryIconMap: Record<string, LucideIcon> = {
  'fruits-vegetables': Leaf,
  'dairy-eggs': Milk,
  'meat': Beef,
  'seafood': Fish,
  'bakery': Croissant,
  'beverages': CupSoda,
  'snacks': Cookie,
  'organic': Leaf,
  'frozen': Snowflake,
  'pantry': Box,
  'baby': Baby,
  'household': Home,
  'personal-care': Droplets,
  'pet-supplies': Dog,
  'electronics': Smartphone,
  'fashion': Shirt,
};

const getCategoryIcon = (slug: string): LucideIcon => {
  return categoryIconMap[slug] || Box;
};

const MAX_VISIBLE_CATEGORIES = 5;

// Helper to render icon from string or use Lucide
const renderCategoryIcon = (iconStr: string | null, slug: string) => {
  // If icon string exists and is an emoji, try to map it
  if (iconStr && isEmoji(iconStr)) {
    const LucideIcon = getIconForEmoji(iconStr);
    if (LucideIcon) {
      return <LucideIcon className="w-4 h-4" />;
    }
  }
  // Fallback to slug-based mapping
  const Icon = getCategoryIcon(slug);
  return <Icon className="w-4 h-4" />;
};

export function HomeCategoryRibbon() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { categories, isLoading } = useMarketplaceCategories();

  // Get active categories sorted by sort_order
  const activeCategories = React.useMemo(() => {
    return categories
      .filter(cat => cat.is_active)
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [categories]);

  const visibleCategories = activeCategories.slice(0, MAX_VISIBLE_CATEGORIES);
  const remainingCount = Math.max(0, activeCategories.length - MAX_VISIBLE_CATEGORIES);

  const handleCategoryClick = (slug: string) => {
    triggerHaptic('light');
    navigate(`/market/category/${slug}`);
  };

  const handleQuickAction = (path: string) => {
    triggerHaptic('light');
    navigate(path);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {/* Quick actions skeleton */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-9 w-20 rounded-xl bg-muted animate-pulse shrink-0" />
          ))}
        </div>
        {/* Categories skeleton */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-9 w-24 rounded-xl bg-muted animate-pulse shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Row 1: Quick Actions */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => handleQuickAction('/market')}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium shrink-0",
            "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
          )}
        >
          <Menu className="w-4 h-4" />
          <span>{isRu ? 'Каталог' : 'Catalog'}</span>
        </motion.button>

        <div className="w-px h-6 bg-border shrink-0" />

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => handleQuickAction('/market/category/deals')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium shrink-0 bg-muted/60 hover:bg-muted text-foreground"
        >
          <Flame className="w-4 h-4 text-orange-500" />
          <span>{isRu ? 'Акции' : 'Deals'}</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => handleQuickAction('/market/category/popular')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium shrink-0 bg-muted/60 hover:bg-muted text-foreground"
        >
          <Star className="w-4 h-4 text-amber-500" />
          <span>{isRu ? 'Хиты' : 'Hits'}</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => handleQuickAction('/market/category/new')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium shrink-0 bg-muted/60 hover:bg-muted text-foreground"
        >
          <Sparkles className="w-4 h-4 text-blue-500" />
          <span>{isRu ? 'Новинки' : 'New'}</span>
        </motion.button>
      </div>

      {/* Row 2: Top Categories */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
        {visibleCategories.map((category) => (
          <motion.button
            key={category.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleCategoryClick(category.slug)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium shrink-0 bg-muted/60 hover:bg-muted text-foreground"
          >
            {renderCategoryIcon(category.icon, category.slug)}
            <span className="whitespace-nowrap">{isRu ? category.name_ru : category.name_en}</span>
          </motion.button>
        ))}

        {remainingCount > 0 && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleQuickAction('/market')}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium shrink-0 bg-secondary hover:bg-secondary/80 text-secondary-foreground"
          >
            <span>+{remainingCount}</span>
            <ChevronRight className="w-3 h-3" />
          </motion.button>
        )}
      </div>
    </div>
  );
}
