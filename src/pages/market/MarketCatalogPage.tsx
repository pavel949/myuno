import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { 
  useMarketplaceCategories, 
  useMarketplaceProducts,
} from '@/hooks/useMarketplace';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Search, ArrowLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    <AppLayout showHeader={false} showBottomNav={true}>
      <div className="min-h-screen bg-background pb-24">
        
        {/* Clean Header */}
        <div className="sticky top-0 z-40 bg-background border-b border-border">
          {/* Title Row */}
          <div className="px-4 py-4 flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 -ml-2"
              onClick={() => navigate('/market')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            <div>
              <h1 className="text-xl font-bold">
                {language === 'ru' ? 'Каталог' : 'Catalog'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {sortedCategories.length} {language === 'ru' ? 'категорий' : 'categories'}
              </p>
            </div>
          </div>
          
          {/* Search */}
          <div className="px-4 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={language === 'ru' ? 'Найти категорию' : 'Find category'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 rounded-xl bg-muted border-0"
              />
            </div>
          </div>
        </div>

        {/* Categories List */}
        <div className="p-4">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />
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
                      "w-full flex items-center gap-4 p-4 rounded-xl",
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
                        className="w-12 h-12 rounded-xl object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-2xl shrink-0">
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

export default MarketCatalogPage;
