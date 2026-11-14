import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { 
  useMarketplaceCategories, 
  useMarketplaceProducts,
} from '@/hooks/useMarketplace';
import { cn } from '@/lib/utils';
import { ChevronRight, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CategoryDrawer } from '@/components/market/CategoryDrawer';
import { withMarketAvailability } from '@/components/market/MarketAvailabilityGate';
import { PersonaFilterChip } from '@/components/landings/PersonaFilterChip';
import { GlobalPreferencesControls } from '@/components/uno/GlobalPreferencesControls';
import { UnifiedHeader } from '@/components/shared/UnifiedHeader';

// Fallback icons
const getCategoryIcon = (slug: string): string => {
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
  const [searchQuery, setSearchQuery] = useState('');
  
  const { categories, isLoading } = useMarketplaceCategories();
  const { products } = useMarketplaceProducts();

  // Count products per category
  const productCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach(p => {
      counts[p.category_slug] = (counts[p.category_slug] || 0) + 1;
    });
    return counts;
  }, [products]);

  // Sort and filter categories
  const sortedCategories = useMemo(() => {
    let cats = [...categories]
      .filter(c => c.is_active)
      .sort((a, b) => a.sort_order - b.sort_order);
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      cats = cats.filter(c => 
        c.name_en.toLowerCase().includes(query) ||
        c.name_ru.toLowerCase().includes(query)
      );
    }
    
    return cats;
  }, [categories, searchQuery]);

  return (
    <AppLayout showBottomNav>
      <div className="min-h-screen bg-background pb-24">
        <UnifiedHeader
          title={language === 'ru' ? 'Каталог' : 'Catalog'}
          subtitle={`${sortedCategories.length} ${language === 'ru' ? 'категорий' : 'categories'}`}
          showBack
          fallbackPath="/market"
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={language === 'ru' ? 'Найти категорию' : 'Find category'}
          rightAction={(
            <>
              <GlobalPreferencesControls size="sm" themeVariant="dropdown" />
              <CategoryDrawer
                trigger={
                  <Button variant="outline" size="icon" className="min-h-11 min-w-11" aria-label={language === 'ru' ? 'Каталог' : 'Catalog'}>
                    <Menu className="w-5 h-5" />
                  </Button>
                }
              />
            </>
          )}
        />

        {/* Categories List */}
        <div className="p-4">
          <PersonaFilterChip className="mb-3" />
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded-none" />
              ))}
            </div>
          ) : sortedCategories.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {language === 'ru' ? 'Категории не найдены' : 'No categories found'}
            </div>
          ) : (
            <div className="space-y-2">
              {sortedCategories.map((category, index) => {
                const count = productCounts[category.slug] || 0;
                
                return (
                  <button
                    key={category.id}
                    onClick={() => navigate(`/market/category/${category.slug}`)}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-none",
                      "bg-card hover:bg-muted/50 active:bg-muted",
                      "transition-colors duration-150",
                      "text-left"
                    )}
                  >
                    {/* Image or Icon */}
                    {category.image_url ? (
                      <img 
                        src={category.image_url} 
                        alt=""
                        className="w-12 h-12 rounded-none object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-none bg-muted flex items-center justify-center text-2xl shrink-0">
                        {category.icon || getCategoryIcon(category.slug)}
                      </div>
                    )}
                    
                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-base">
                        {language === 'ru' ? category.name_ru : category.name_en}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {count} {language === 'ru' ? 'товаров' : 'items'}
                      </p>
                    </div>
                    
                    {/* Arrow */}
                    <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

const AvailableMarketCatalogPage = withMarketAvailability(MarketCatalogPage);
export default AvailableMarketCatalogPage;
