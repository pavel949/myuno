import React, { useState, useMemo, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  ChevronRight,
  Flame,
  Sparkles,
  ArrowRight,
  Truck,
  Clock,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { StickyCartBar } from '@/components/cart/StickyCartBar';
import { ProfessionalProductCard, CategoryRibbon } from '@/components/market';
import { MarketHero } from '@/components/market/MarketHero';
import { useDeliverySettings } from '@/hooks/useMarketplace';
import { useMarketIndexData } from '@/hooks/useMarketIndexData';
import { MarketplaceProduct } from '@/types/marketplace';
import { useCartToast } from '@/hooks/useCartToast';
import { cn } from '@/lib/utils';

// Fallback category icon mapping (used when no image available)
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

// Category Image Component - with forwardRef to avoid React warnings
interface CategoryImageProps {
  category: { slug: string; image_url: string | null; icon: string | null }; 
  size?: 'sm' | 'md' | 'lg';
}

const CategoryImage = forwardRef<HTMLDivElement, CategoryImageProps>(
  ({ category, size = 'md' }, ref) => {
    const sizeClasses = {
      sm: 'w-10 h-10',
      md: 'w-12 h-12',
      lg: 'w-16 h-16',
    };
    
    if (category.image_url) {
      return (
        <div ref={ref}>
          <img 
            src={category.image_url} 
            alt="" 
            className={cn(sizeClasses[size], "rounded-xl object-cover")}
          />
        </div>
      );
    }
    
    // Fallback to icon or emoji
    return (
      <div 
        ref={ref}
        className={cn(
          sizeClasses[size],
          "rounded-xl bg-muted/50 flex items-center justify-center text-2xl"
        )}
      >
        {category.icon || getCategoryFallbackIcon(category.slug)}
      </div>
    );
  }
);
CategoryImage.displayName = 'CategoryImage';

const MarketIndex = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { addItem, removeItem, getItemsByType } = useCart();
  const { showAddedToast } = useCartToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Fetch data - optimized: single fetch for products, derive popular/new client-side
  const { 
    allProducts, 
    popularProducts, 
    newProducts, 
    categories, 
    isLoading: dataLoading 
  } = useMarketIndexData();
  const { freeDeliveryThreshold, defaultZone } = useDeliverySettings();

  const cartItems = getItemsByType('product');

  // Product counts per category
  const productCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allProducts.forEach(p => {
      counts[p.category_slug] = (counts[p.category_slug] || 0) + 1;
    });
    return counts;
  }, [allProducts]);

  // Active categories with products
  const activeCategories = useMemo(() => {
    return categories
      .filter(cat => productCounts[cat.slug] > 0)
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [categories, productCounts]);

  // Search results
  const searchResults = useMemo(() => {
    if (searchQuery.length < 2) return [];
    const query = searchQuery.toLowerCase();
    return allProducts.filter(p => 
      p.name_en.toLowerCase().includes(query) ||
      p.name_ru.toLowerCase().includes(query) ||
      p.tags?.some(t => t.toLowerCase().includes(query))
    ).slice(0, 8);
  }, [searchQuery, allProducts]);

  const getQuantity = (productId: string) => {
    return cartItems.find(i => i.id === productId)?.quantity || 0;
  };

  const handleAdd = (product: MarketplaceProduct) => {
    const item = {
      id: product.id,
      type: 'product' as const,
      name: product.name_en,
      nameRu: product.name_ru,
      price: product.price,
      currency: '฿',
      image: product.cover_image || undefined,
      providerId: 'marketplace',
      providerName: product.vendor_name || 'myUNO Market',
      providerNameRu: product.vendor_name_ru || 'myUNO Маркет',
    };
    addItem(item);
    showAddedToast({ item, cartPath: '/market/checkout' });
  };

  const handleRemove = (productId: string) => {
    removeItem(productId);
  };

  return (
    <AppLayout showHeader={true} showBottomNav={true}>
      <div className="min-h-screen bg-background pb-32">
        
        {/* Search Bar - Sticky */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 py-3">
          <div className="relative max-w-7xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder={language === 'ru' ? 'Искать на myUNO Market' : 'Search on myUNO Market'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              className="pl-12 pr-4 h-12 rounded-full bg-muted/60 border-0 text-base"
            />
            
            {/* Search Dropdown */}
            {isSearchFocused && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden">
                {searchResults.map(product => (
                  <button
                    key={product.id}
                    className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 text-left transition-colors border-b border-border/50 last:border-0"
                    onClick={() => {
                      navigate(`/market/product/${product.id}`);
                      setSearchQuery('');
                    }}
                  >
                    <img
                      src={product.cover_image || '/placeholder.svg'}
                      alt=""
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">
                        {language === 'ru' ? product.name_ru : product.name_en}
                      </p>
                      <p className="text-sm font-bold text-primary">
                        ฿{product.price.toLocaleString()}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Hero Banner */}
        <MarketHero 
          totalProducts={allProducts.length}
          totalCategories={activeCategories.length}
          freeDeliveryThreshold={freeDeliveryThreshold}
        />

        {/* 2-Row Category Ribbon - Ozon Style */}
        <CategoryRibbon />

        {/* Promo Banners - Compact */}
        <div className="px-4 py-3 max-w-7xl mx-auto">
          <div className="grid grid-cols-2 gap-2">
            {/* Free Delivery Banner */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/50 dark:border-emerald-800/50">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                <Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  {language === 'ru' ? 'Бесплатно' : 'Free delivery'}
                </p>
                <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80">
                  {language === 'ru' ? `от ฿${freeDeliveryThreshold}` : `from ฿${freeDeliveryThreshold}`}
                </p>
              </div>
            </div>

            {/* Fast Delivery Banner */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-800/50">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                  {defaultZone?.estimated_time_minutes || 45} {language === 'ru' ? 'мин' : 'min'}
                </p>
                <p className="text-[10px] text-blue-600/80 dark:text-blue-400/80">
                  {language === 'ru' ? 'экспресс' : 'express delivery'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Popular Products Section */}
        {popularProducts.length > 0 && (
          <section className="py-4">
            <div className="px-4 max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  <h2 className="text-lg font-bold">
                    {language === 'ru' ? 'Хиты продаж' : 'Bestsellers'}
                  </h2>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-primary gap-1"
                  onClick={() => navigate('/market/category/popular')}
                >
                  {language === 'ru' ? 'Все' : 'All'}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <ScrollArea className="w-full">
              <div className="flex gap-3 px-4 pb-2 max-w-7xl mx-auto">
                {popularProducts.slice(0, 12).map(product => (
                  <div key={product.id} className="w-[160px] shrink-0">
                    <ProfessionalProductCard
                      product={product}
                      quantity={getQuantity(product.id)}
                      onAdd={() => handleAdd(product)}
                      onRemove={() => handleRemove(product.id)}
                      onClick={() => navigate(`/market/product/${product.id}`)}
                      compact
                    />
                  </div>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="invisible" />
            </ScrollArea>
          </section>
        )}

        {/* New Arrivals Section */}
        {newProducts.length > 0 && (
          <section className="py-4 bg-muted/30">
            <div className="px-4 max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  <h2 className="text-lg font-bold">
                    {language === 'ru' ? 'Новинки' : 'New Arrivals'}
                  </h2>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-primary gap-1"
                  onClick={() => navigate('/market/category/new')}
                >
                  {language === 'ru' ? 'Все' : 'All'}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <ScrollArea className="w-full">
              <div className="flex gap-3 px-4 pb-2 max-w-7xl mx-auto">
                {newProducts.slice(0, 10).map(product => (
                  <div key={product.id} className="w-[160px] shrink-0">
                    <ProfessionalProductCard
                      product={product}
                      quantity={getQuantity(product.id)}
                      onAdd={() => handleAdd(product)}
                      onRemove={() => handleRemove(product.id)}
                      onClick={() => navigate(`/market/product/${product.id}`)}
                      compact
                    />
                  </div>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="invisible" />
            </ScrollArea>
          </section>
        )}

        {/* Categories with Products - Ozon Style */}
        {activeCategories.slice(0, 6).map(category => {
          const categoryProducts = allProducts
            .filter(p => p.category_slug === category.slug)
            .slice(0, 8);
          
          if (categoryProducts.length === 0) return null;
          
          return (
            <section key={category.id} className="py-4 border-t border-border/50">
              <div className="px-4 max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CategoryImage category={category} size="sm" />
                    <h2 className="text-lg font-bold">
                      {language === 'ru' ? category.name_ru : category.name_en}
                    </h2>
                    <Badge variant="secondary" className="text-xs">
                      {productCounts[category.slug]}
                    </Badge>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-primary gap-1"
                    onClick={() => navigate(`/market/category/${category.slug}`)}
                  >
                    {language === 'ru' ? 'Все' : 'All'}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <ScrollArea className="w-full">
                <div className="flex gap-3 px-4 pb-2 max-w-7xl mx-auto">
                  {categoryProducts.map(product => (
                    <div key={product.id} className="w-[160px] shrink-0">
                      <ProfessionalProductCard
                        product={product}
                        quantity={getQuantity(product.id)}
                        onAdd={() => handleAdd(product)}
                        onRemove={() => handleRemove(product.id)}
                        onClick={() => navigate(`/market/product/${product.id}`)}
                        compact
                      />
                    </div>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" className="invisible" />
              </ScrollArea>
            </section>
          );
        })}

        {/* All Products Grid */}
        <section className="py-6 px-4 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">
              {language === 'ru' ? 'Все товары' : 'All Products'}
            </h2>
            <Badge variant="outline">
              {allProducts.length} {language === 'ru' ? 'товаров' : 'items'}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {allProducts.slice(0, 20).map(product => (
              <ProfessionalProductCard
                key={product.id}
                product={product}
                quantity={getQuantity(product.id)}
                onAdd={() => handleAdd(product)}
                onRemove={() => handleRemove(product.id)}
                onClick={() => navigate(`/market/product/${product.id}`)}
              />
            ))}
          </div>
          
          {allProducts.length > 20 && (
            <Button 
              variant="outline" 
              className="w-full mt-6 h-12 rounded-xl text-base font-medium"
              onClick={() => navigate('/market/categories')}
            >
              {language === 'ru' ? 'Показать все товары' : 'Show All Products'}
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          )}
        </section>

        {/* Sticky Cart Bar */}
        <StickyCartBar
          itemType="product"
          checkoutPath="/market/checkout"
        />
      </div>
    </AppLayout>
  );
};

export default MarketIndex;
