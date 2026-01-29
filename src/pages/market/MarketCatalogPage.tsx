import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { useMarketplaceCategories, useMarketplaceProducts } from '@/hooks/useMarketplace';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ChevronRight } from 'lucide-react';

const getCategoryIcon = (slug: string) => {
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

const MarketCatalogPage = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { categories, isLoading } = useMarketplaceCategories();
  const { products } = useMarketplaceProducts();

  // Count products per category
  const productCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach(p => {
      counts[p.category_slug] = (counts[p.category_slug] || 0) + 1;
    });
    return counts;
  }, [products]);

  const sortedCategories = React.useMemo(() => {
    return [...categories].sort((a, b) => a.sort_order - b.sort_order);
  }, [categories]);

  return (
    <AppLayout showHeader={true} showBottomNav={true}>
      <PageContainer className="pt-0">
        <PageHeader
          title={language === 'ru' ? 'Каталог' : 'Catalog'}
          subtitle={language === 'ru' 
            ? `${categories.length} категорий` 
            : `${categories.length} categories`}
        />

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {sortedCategories.map(category => {
              const count = productCounts[category.slug] || 0;
              
              return (
                <button
                  key={category.id}
                  onClick={() => navigate(`/market/category/${category.slug}`)}
                  className={cn(
                    "relative flex items-center gap-3 p-4 rounded-2xl text-left",
                    "bg-card border border-border/50 hover:border-primary/30",
                    "transition-all duration-200 hover:shadow-md active:scale-[0.98]",
                    "group"
                  )}
                >
                  <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
                    {getCategoryIcon(category.slug)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm line-clamp-1">
                      {language === 'ru' ? category.name_ru : category.name_en}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {count} {language === 'ru' ? 'товаров' : 'items'}
                    </p>
                  </div>
                  
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </PageContainer>
    </AppLayout>
  );
};

export default MarketCatalogPage;
