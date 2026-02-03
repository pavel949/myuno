import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronRight,
  Flame,
  Sparkles,
  Truck,
  Clock,
  Star,
  Menu,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { MiniAppLayout } from '@/components/miniapp/MiniAppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StickyCartBar } from '@/components/cart/StickyCartBar';
import { ProfessionalProductCard } from '@/components/market';
import { CategoryDrawer } from '@/components/market/CategoryDrawer';
import { useDeliverySettings } from '@/hooks/useMarketplace';
import { useMarketIndexData } from '@/hooks/useMarketIndexData';
import { MarketplaceProduct } from '@/types/marketplace';
import { useCartToast } from '@/hooks/useCartToast';
import { cn } from '@/lib/utils';
import { CrossSellSection } from '@/components/crosssell';

// Unified components
import { 
  UnifiedFilterRibbon, 
  UnifiedSectionHeader, 
  UnifiedScrollSection,
  UnifiedFiltersKlook,
  FilterRibbonItem 
} from '@/components/shared';

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

const MarketIndex = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { addItem, removeItem, getItemsByType } = useCart();
  const { showAddedToast } = useCartToast();
  const isRu = language === 'ru';
  
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

  // Quick action items for ribbon
  const quickActionItems: FilterRibbonItem[] = useMemo(() => [
    { id: 'deals', label: isRu ? 'Акции' : 'Deals', icon: Flame, variant: 'accent' as const },
    { id: 'popular', label: isRu ? 'Хиты' : 'Hits', icon: Star },
    { id: 'new', label: isRu ? 'Новинки' : 'New', icon: Sparkles },
  ], [isRu]);

  // Category items for ribbon (top 3)
  const categoryItems: FilterRibbonItem[] = useMemo(() => {
    return activeCategories.slice(0, 3).map(cat => ({
      id: cat.slug,
      label: isRu ? cat.name_ru : cat.name_en,
      emoji: cat.icon || getCategoryFallbackIcon(cat.slug),
    }));
  }, [activeCategories, isRu]);

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

  const handleQuickActionSelect = (id: string) => {
    navigate(`/market/category/${id}`);
  };

  const handleCategorySelect = (slug: string) => {
    navigate(`/market/category/${slug}`);
  };

  // Render search results dropdown
  const renderSearchResults = () => (
    <>
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
              {isRu ? product.name_ru : product.name_en}
            </p>
            <p className="text-sm font-bold text-primary">
              ฿{product.price.toLocaleString()}
            </p>
          </div>
        </button>
      ))}
    </>
  );

  const remainingCategoryCount = Math.max(0, activeCategories.length - 3);

  const isSearching = searchQuery.length >= 2 && searchResults.length > 0;

  return (
    <MiniAppLayout
      title={isRu ? 'Маркет' : 'Market'}
      subtitle={isRu 
        ? `${allProducts.length}+ товаров от проверенных продавцов`
        : `${allProducts.length}+ products from verified sellers`
      }
      fallbackPath="/"
      searchPlaceholder={isRu ? 'Искать на myUNO Market' : 'Search on myUNO Market'}
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchResults={searchResults.length > 0 ? renderSearchResults() : undefined}
      isSearching={isSearching}
      showHero={false}
      showCategories={false}
      showFilter={false}
    >
      {/* Filter Ribbon - Quick Actions Row */}
      <div className="sticky top-[124px] z-30 -mx-4 bg-background/95 backdrop-blur-sm">
        <UnifiedFilterRibbon
          items={quickActionItems}
          onSelect={handleQuickActionSelect}
          leadingAction={
            <CategoryDrawer
              trigger={
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 px-3 py-2 h-auto rounded-xl border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary font-medium shrink-0"
                >
                  <Menu className="w-4 h-4" />
                  <span className="text-xs">{isRu ? 'Каталог' : 'Catalog'}</span>
                </Button>
              }
            />
          }
          trailingAction={
            <>
              {categoryItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleCategorySelect(item.id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-muted/60 hover:bg-muted text-foreground transition-colors shrink-0"
                >
                  <span className="text-base">{item.emoji}</span>
                  <span className="whitespace-nowrap">{item.label}</span>
                </button>
              ))}
              {remainingCategoryCount > 0 && (
                <CategoryDrawer
                  trigger={
                    <Badge
                      variant="secondary"
                      className="px-3 py-2 text-xs font-medium cursor-pointer hover:bg-secondary/80 shrink-0"
                    >
                      +{remainingCategoryCount} {isRu ? 'ещё' : 'more'}
                    </Badge>
                  }
                />
              )}
            </>
          }
        />
      </div>

      <div className="pb-32 -mx-4 px-4">
        {/* Promo Banners - Compact - using semantic tokens */}
        <div className="py-3 max-w-7xl mx-auto">
          <div className="grid grid-cols-2 gap-2">
            {/* Free Delivery Banner */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-success/10 border border-success/20">
              <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center shrink-0">
                <Truck className="w-4 h-4 text-success" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-success">
                  {isRu ? 'Бесплатно' : 'Free delivery'}
                </p>
                <p className="text-[10px] text-success/80">
                  {isRu ? `от ฿${freeDeliveryThreshold}` : `from ฿${freeDeliveryThreshold}`}
                </p>
              </div>
            </div>

            {/* Fast Delivery Banner */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-info/10 border border-info/20">
              <div className="w-8 h-8 rounded-full bg-info/20 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-info" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-info">
                  {defaultZone?.estimated_time_minutes || 45} {isRu ? 'мин' : 'min'}
                </p>
                <p className="text-[10px] text-info/80">
                  {isRu ? 'экспресс' : 'express delivery'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Popular Products Section */}
        {popularProducts.length > 0 && (
          <section className="py-4">
            <div className="px-4 max-w-7xl mx-auto">
              <UnifiedSectionHeader
                icon={Flame}
                iconColor="text-orange-500"
                title={isRu ? 'Хиты продаж' : 'Bestsellers'}
                viewAllPath="/market/category/popular"
                viewAllLabel={isRu ? 'Все' : 'All'}
              />
            </div>
            
            <UnifiedScrollSection>
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
            </UnifiedScrollSection>
          </section>
        )}

        {/* New Arrivals Section */}
        {newProducts.length > 0 && (
          <section className="py-4 bg-muted/30">
            <div className="px-4 max-w-7xl mx-auto">
              <UnifiedSectionHeader
                icon={Sparkles}
                iconColor="text-purple-500"
                title={isRu ? 'Новинки' : 'New Arrivals'}
                viewAllPath="/market/category/new"
                viewAllLabel={isRu ? 'Все' : 'All'}
              />
            </div>
            
            <UnifiedScrollSection variant="muted">
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
            </UnifiedScrollSection>
          </section>
        )}

        {/* Categories with Products - Alternating background */}
        {activeCategories.slice(0, 6).map((category, index) => {
          const categoryProducts = allProducts
            .filter(p => p.category_slug === category.slug)
            .slice(0, 8);
          
          if (categoryProducts.length === 0) return null;
          
          const isMuted = index % 2 === 1;
          
          return (
            <section key={category.id} className={cn("py-4 border-t border-border/50", isMuted && "bg-muted/30")}>
              <div className="px-4 max-w-7xl mx-auto">
                <UnifiedSectionHeader
                  iconEmoji={category.icon || getCategoryFallbackIcon(category.slug)}
                  iconImage={category.image_url || undefined}
                  title={isRu ? category.name_ru : category.name_en}
                  count={productCounts[category.slug]}
                  viewAllPath={`/market/category/${category.slug}`}
                  viewAllLabel={isRu ? 'Все' : 'All'}
                />
              </div>
              
              <UnifiedScrollSection variant={isMuted ? 'muted' : 'default'}>
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
              </UnifiedScrollSection>
            </section>
          );
        })}

        {/* All Products Grid */}
        <section className="py-6 px-4 max-w-7xl mx-auto">
          <UnifiedSectionHeader
            title={isRu ? 'Все товары' : 'All Products'}
            count={allProducts.length}
          />
          
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
              {isRu ? 'Показать все товары' : 'Show All Products'}
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          )}
        </section>

        {/* Cross-sell to other services */}
        <section className="py-6 px-4 max-w-7xl mx-auto">
          <CrossSellSection currentVertical="marketplace" maxItems={4} />
        </section>

        {/* Sticky Cart Bar */}
        <StickyCartBar
          itemType="product"
          checkoutPath="/market/checkout"
        />
      </div>
    </MiniAppLayout>
  );
};

export default MarketIndex;
