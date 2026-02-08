import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMarketplaceCategories, useMarketplaceProducts } from '@/hooks/useMarketplace';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Menu, Flame, Star, Sparkles } from 'lucide-react';
import { CategoryDrawer } from './CategoryDrawer';
import { cn } from '@/lib/utils';

// Fallback category icon mapping
const getCategoryFallbackIcon = (slug: string) => {
  const icons: Record<string, string> = {
    'fruits-vegetables': '🥬',
    'dairy-eggs': '🥛',
    'meat': '🥩',
    'seafood': '🦐',
    'bakery': '🥖',
    'beverages': '🥤',
    'snacks': '🍿',
    'organic': '🌿',
    'frozen': '❄️',
    'pantry': '🏺',
    'baby': '👶',
    'household': '🏠',
    'personal-care': '🧴',
    'pet-supplies': '🐕',
    'electronics': '📱',
    'fashion': '👔',
  };
  return icons[slug] || '📦';
};

const MAX_VISIBLE_CATEGORIES = 3;

interface CategoryRibbonButtonProps {
  icon?: React.ReactNode;
  emoji?: string;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'accent';
}

function RibbonButton({ icon, emoji, label, onClick, variant = 'default' }: CategoryRibbonButtonProps) {
  const variants = {
    default: 'bg-muted/60 hover:bg-muted text-foreground',
    primary: 'bg-primary/10 hover:bg-primary/20 text-primary',
    accent: 'bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 hover:from-orange-200 hover:to-amber-200 text-orange-700 dark:text-orange-300',
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors shrink-0",
        variants[variant]
      )}
    >
      {icon && <span className="w-4 h-4">{icon}</span>}
      {emoji && <span className="text-base">{emoji}</span>}
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}

export function CategoryRibbon() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { categories } = useMarketplaceCategories();
  const { products } = useMarketplaceProducts();

  // Count products per category
  const productCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach(p => {
      counts[p.category_slug] = (counts[p.category_slug] || 0) + 1;
    });
    return counts;
  }, [products]);

  // Active categories with products
  const activeCategories = React.useMemo(() => {
    return categories
      .filter(cat => productCounts[cat.slug] > 0)
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [categories, productCounts]);

  const visibleCategories = activeCategories.slice(0, MAX_VISIBLE_CATEGORIES);
  const remainingCount = Math.max(0, activeCategories.length - MAX_VISIBLE_CATEGORIES);

  return (
    <div className="bg-card border-b border-border/50">
      <div className="px-3 py-2.5 max-w-7xl mx-auto space-y-2">
        {/* Row 1: Quick Actions */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide touch-pan-y snap-x snap-proximity">
          {/* Catalog Button with Drawer */}
          <CategoryDrawer
            trigger={
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 px-3 py-2 h-auto rounded-xl border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary font-medium shrink-0"
              >
                <Menu className="w-4 h-4" />
                <span className="text-xs">{language === 'ru' ? 'Каталог' : 'Catalog'}</span>
              </Button>
            }
          />
          
          <div className="w-px h-6 bg-border" />

          <RibbonButton
            icon={<Flame className="w-4 h-4 text-orange-500" />}
            label={language === 'ru' ? 'Акции' : 'Deals'}
            onClick={() => navigate('/market/category/deals')}
            variant="accent"
          />
          <RibbonButton
            icon={<Star className="w-4 h-4 text-amber-500" />}
            label={language === 'ru' ? 'Хиты' : 'Hits'}
            onClick={() => navigate('/market/category/popular')}
          />
          <RibbonButton
            icon={<Sparkles className="w-4 h-4 text-purple-500" />}
            label={language === 'ru' ? 'Новинки' : 'New'}
            onClick={() => navigate('/market/category/new')}
          />
        </div>

        {/* Row 2: Top Categories */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide touch-pan-y snap-x snap-proximity">
          {visibleCategories.map(category => (
            <RibbonButton
              key={category.id}
              emoji={category.icon || getCategoryFallbackIcon(category.slug)}
              label={language === 'ru' ? category.name_ru : category.name_en}
              onClick={() => navigate(`/market/category/${category.slug}`)}
            />
          ))}
          
          {remainingCount > 0 && (
            <CategoryDrawer
              trigger={
                <Badge
                  variant="secondary"
                  className="px-3 py-2 text-xs font-medium cursor-pointer hover:bg-secondary/80 shrink-0"
                >
                  +{remainingCount} {language === 'ru' ? 'ещё' : 'more'}
                </Badge>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
