import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { 
  useMarketplaceCategories, 
  useMarketplaceProducts,
  useMarketplaceSubcategories,
} from '@/hooks/useMarketplace';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { 
  ChevronRight, 
  Search, 
  Grid3X3, 
  Sparkles, 
  Flame,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// Category gradient backgrounds by group
const categoryGradients: Record<string, string> = {
  'fruits-vegetables': 'from-green-500/20 to-emerald-500/10',
  'dairy-eggs': 'from-amber-500/20 to-yellow-500/10',
  'meat': 'from-red-500/20 to-rose-500/10',
  'seafood': 'from-blue-500/20 to-cyan-500/10',
  'bakery': 'from-orange-500/20 to-amber-500/10',
  'beverages': 'from-sky-500/20 to-blue-500/10',
  'snacks': 'from-purple-500/20 to-pink-500/10',
  'organic': 'from-lime-500/20 to-green-500/10',
  'frozen': 'from-cyan-500/20 to-sky-500/10',
  'pantry': 'from-amber-600/20 to-orange-500/10',
  'baby': 'from-pink-500/20 to-rose-500/10',
  'household': 'from-slate-500/20 to-gray-500/10',
  'personal-care': 'from-violet-500/20 to-purple-500/10',
  'pet-supplies': 'from-teal-500/20 to-emerald-500/10',
};

// Fallback icons
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

// Featured category card with image
const FeaturedCategoryCard = ({ 
  category, 
  productCount, 
  language, 
  onClick 
}: { 
  category: any; 
  productCount: number; 
  language: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "relative w-full aspect-[4/3] rounded-2xl overflow-hidden",
      "group transition-all duration-300 hover:shadow-xl active:scale-[0.98]"
    )}
  >
    {/* Background */}
    {category.image_url ? (
      <img 
        src={category.image_url} 
        alt=""
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
    ) : (
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br",
        categoryGradients[category.slug] || 'from-primary/20 to-primary/5'
      )} />
    )}
    
    {/* Overlay */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
    
    {/* Icon */}
    <div className="absolute top-3 left-3">
      <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-xl">
        {category.icon || getCategoryFallbackIcon(category.slug)}
      </div>
    </div>
    
    {/* Content */}
    <div className="absolute bottom-0 left-0 right-0 p-4">
      <h3 className="font-bold text-white text-lg text-left line-clamp-1">
        {language === 'ru' ? category.name_ru : category.name_en}
      </h3>
      <p className="text-white/80 text-sm text-left mt-0.5">
        {productCount} {language === 'ru' ? 'товаров' : 'items'}
      </p>
    </div>
    
    {/* Arrow */}
    <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
      <ChevronRight className="w-4 h-4 text-white" />
    </div>
  </button>
);

// Compact category card
const CategoryCard = ({ 
  category, 
  productCount, 
  language, 
  onClick 
}: { 
  category: any; 
  productCount: number; 
  language: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "relative flex items-center gap-3 p-3 rounded-xl text-left w-full",
      "bg-card border border-border/50 hover:border-primary/30",
      "transition-all duration-200 hover:shadow-md active:scale-[0.98]",
      "group"
    )}
  >
    {/* Image or Icon */}
    {category.image_url ? (
      <img 
        src={category.image_url} 
        alt=""
        className="w-14 h-14 rounded-xl object-cover shrink-0 group-hover:scale-105 transition-transform"
      />
    ) : (
      <div className={cn(
        "w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0 bg-gradient-to-br group-hover:scale-105 transition-transform",
        categoryGradients[category.slug] || 'from-muted to-muted/50'
      )}>
        {category.icon || getCategoryFallbackIcon(category.slug)}
      </div>
    )}
    
    <div className="flex-1 min-w-0">
      <h3 className="font-semibold text-sm line-clamp-1">
        {language === 'ru' ? category.name_ru : category.name_en}
      </h3>
      <p className="text-xs text-muted-foreground mt-0.5">
        {productCount} {language === 'ru' ? 'товаров' : 'items'}
      </p>
    </div>
    
    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
  </button>
);

// Subcategory pill
const SubcategoryPill = ({ 
  subcategory, 
  language, 
  onClick 
}: { 
  subcategory: any; 
  language: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="px-4 py-2 rounded-full bg-muted/50 hover:bg-muted text-sm font-medium whitespace-nowrap transition-colors"
  >
    {subcategory.icon && <span className="mr-1.5">{subcategory.icon}</span>}
    {language === 'ru' ? subcategory.name_ru : subcategory.name_en}
  </button>
);

const MarketCatalogPage = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  
  const { categories, isLoading: categoriesLoading } = useMarketplaceCategories();
  const { products } = useMarketplaceProducts();
  const { subcategories } = useMarketplaceSubcategories();

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
    return [...categories]
      .filter(c => c.is_active)
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [categories]);

  // Featured categories (top 4 with most products)
  const featuredCategories = useMemo(() => {
    return [...sortedCategories]
      .sort((a, b) => (productCounts[b.slug] || 0) - (productCounts[a.slug] || 0))
      .slice(0, 4);
  }, [sortedCategories, productCounts]);

  // Other categories
  const otherCategories = useMemo(() => {
    const featuredSlugs = new Set(featuredCategories.map(c => c.slug));
    return sortedCategories.filter(c => !featuredSlugs.has(c.slug));
  }, [sortedCategories, featuredCategories]);

  // Search filter
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const query = searchQuery.toLowerCase();
    return sortedCategories.filter(c => 
      c.name_en.toLowerCase().includes(query) ||
      c.name_ru.toLowerCase().includes(query)
    );
  }, [sortedCategories, searchQuery]);

  // Group subcategories by category
  const subcategoriesByCategory = useMemo(() => {
    const grouped: Record<string, typeof subcategories> = {};
    subcategories.forEach(sub => {
      if (!grouped[sub.category_slug]) {
        grouped[sub.category_slug] = [];
      }
      grouped[sub.category_slug].push(sub);
    });
    return grouped;
  }, [subcategories]);

  return (
    <AppLayout showHeader={false} showBottomNav={true}>
      <div className="min-h-screen bg-background pb-24">
        
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50">
          <div className="px-4 py-3 flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => navigate('/market')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={language === 'ru' ? 'Поиск категории...' : 'Search category...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 rounded-full bg-muted/60 border-0"
              />
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="px-4 pb-3 flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Grid3X3 className="w-4 h-4" />
              <span>{categories.length} {language === 'ru' ? 'категорий' : 'categories'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Sparkles className="w-4 h-4" />
              <span>{products.length} {language === 'ru' ? 'товаров' : 'products'}</span>
            </div>
          </div>
        </div>

        {/* Search Results */}
        {filteredCategories && (
          <div className="p-4">
            <h2 className="text-lg font-bold mb-3">
              {language === 'ru' ? 'Результаты поиска' : 'Search Results'}
            </h2>
            
            {filteredCategories.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {language === 'ru' ? 'Ничего не найдено' : 'Nothing found'}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {filteredCategories.map(category => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    productCount={productCounts[category.slug] || 0}
                    language={language}
                    onClick={() => navigate(`/market/category/${category.slug}`)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Main Content */}
        {!filteredCategories && (
          <>
            {categoriesLoading ? (
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="aspect-[4/3] bg-muted animate-pulse rounded-2xl" />
                  ))}
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-6">
                
                {/* Featured Categories */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Flame className="w-5 h-5 text-orange-500" />
                    <h2 className="text-lg font-bold">
                      {language === 'ru' ? 'Популярные' : 'Popular'}
                    </h2>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {featuredCategories.map(category => (
                      <FeaturedCategoryCard
                        key={category.id}
                        category={category}
                        productCount={productCounts[category.slug] || 0}
                        language={language}
                        onClick={() => navigate(`/market/category/${category.slug}`)}
                      />
                    ))}
                  </div>
                </section>

                {/* All Categories */}
                <section>
                  <h2 className="text-lg font-bold mb-3">
                    {language === 'ru' ? 'Все категории' : 'All Categories'}
                  </h2>
                  
                  <div className="space-y-4">
                    {sortedCategories.map(category => {
                      const subs = subcategoriesByCategory[category.slug] || [];
                      
                      return (
                        <div key={category.id} className="space-y-2">
                          <CategoryCard
                            category={category}
                            productCount={productCounts[category.slug] || 0}
                            language={language}
                            onClick={() => navigate(`/market/category/${category.slug}`)}
                          />
                          
                          {/* Subcategories */}
                          {subs.length > 0 && (
                            <ScrollArea className="w-full">
                              <div className="flex gap-2 pl-4 pb-1">
                                {subs.slice(0, 6).map(sub => (
                                  <SubcategoryPill
                                    key={sub.id}
                                    subcategory={sub}
                                    language={language}
                                    onClick={() => navigate(`/market/category/${category.slug}?sub=${sub.slug}`)}
                                  />
                                ))}
                                {subs.length > 6 && (
                                  <button
                                    onClick={() => navigate(`/market/category/${category.slug}`)}
                                    className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium whitespace-nowrap"
                                  >
                                    +{subs.length - 6}
                                  </button>
                                )}
                              </div>
                              <ScrollBar orientation="horizontal" className="invisible" />
                            </ScrollArea>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default MarketCatalogPage;
