import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronRight,
  Flame,
  Sparkles,
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
import { PromoCarousel } from '@/components/market/PromoCarousel';
import { QuickCategoryIcons } from '@/components/market/QuickCategoryIcons';
import { FlashDealsSection } from '@/components/market/FlashDealsSection';
import { FeaturedVendorsCarousel } from '@/components/market/FeaturedVendorsCarousel';
import { RecentlyViewedProducts } from '@/components/market/RecentlyViewedProducts';
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
  
  // Calculate unique vendor count
  const uniqueVendorCount = useMemo(() => {
    const vendors = new Set(allProducts.map(p => p.vendor_name).filter(Boolean));
    return vendors.size || 1;
  }, [allProducts]);

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

  // Search results - products and categories
  const searchResults = useMemo(() => {
    if (searchQuery.length < 2) return { products: [], categories: [] };
    const query = searchQuery.toLowerCase();
    
    const matchedProducts = allProducts.filter(p => 
      p.name_en.toLowerCase().includes(query) ||
      p.name_ru.toLowerCase().includes(query) ||
      p.tags?.some(t => t.toLowerCase().includes(query))
    ).slice(0, 6);
    
    const matchedCategories = categories.filter(c => 
      c.name_en.toLowerCase().includes(query) ||
      c.name_ru.toLowerCase().includes(query)
    ).slice(0, 4);
    
    return { products: matchedProducts, categories: matchedCategories };
  }, [searchQuery, allProducts, categories]);

  const hasSearchResults = searchResults.products.length > 0 || searchResults.categories.length > 0;

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
  const renderSearchResults = () => {
    // No results found
    if (!hasSearchResults) {
      return (
        <div className="p-6 text-center">
          <p className="text-muted-foreground text-sm">
            {isRu ? 'Ничего не найдено' : 'Nothing found'}
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            {isRu ? 'Попробуйте изменить запрос' : 'Try a different search'}
          </p>
        </div>
      );
    }

    return (
      <>
        {/* Categories section */}
        {searchResults.categories.length > 0 && (
          <div className="border-b border-border/50">
            <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {isRu ? 'Категории' : 'Categories'}
            </div>
            {searchResults.categories.map(category => (
              <button
                key={category.id}
                className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 text-left transition-colors"
                onClick={() => {
                  navigate(`/market/category/${category.slug}`);
                  setSearchQuery('');
                }}
              >
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-xl">
                  {category.icon || getCategoryFallbackIcon(category.slug)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {isRu ? category.name_ru : category.name_en}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {productCounts[category.slug] || 0} {isRu ? 'товаров' : 'items'}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}

        {/* Products section */}
        {searchResults.products.length > 0 && (
          <>
            {searchResults.categories.length > 0 && (
              <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {isRu ? 'Товары' : 'Products'}
              </div>
            )}
            {searchResults.products.map(product => (
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
        )}
      </>
    );
  };

  const remainingCategoryCount = Math.max(0, activeCategories.length - 3);

  const isSearchActive = searchQuery.length >= 2;

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
      searchResults={isSearchActive ? renderSearchResults() : undefined}
      isSearching={isSearchActive}
      showHero={false}
      showCategories={false}
      showFilter={false}
    >
      {/* Filter Ribbon - Quick Actions Row */}
      <div className="sticky top-0 z-30 -mx-4 px-4 md:px-6 lg:px-8 bg-background/95 backdrop-blur-sm border-b border-border/30">
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

      <div className="pb-32">
        {/* 1. Quick Category Icons Grid first - Amazon style */}
        <div className="max-w-[1800px] mx-auto">
          <QuickCategoryIcons 
            categories={activeCategories} 
            productCounts={productCounts}
            maxItems={8}
          />
        </div>

        {/* 2. Hero Promo Carousel */}
        <div className="max-w-[1800px] mx-auto">
          <PromoCarousel />
        </div>

        {/* 3. Flash Deals Section with Countdown */}
        <div className="max-w-[1800px] mx-auto">
          <FlashDealsSection products={allProducts} />
        </div>

        {/* 4. Bestsellers Section */}
        {popularProducts.length > 0 && (
          <section className="py-3">
            <div className="px-4 md:px-6 lg:px-8 max-w-[1800px] mx-auto">
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

        {/* 5. Featured Vendors Carousel */}
        <div className="max-w-[1800px] mx-auto">
          <FeaturedVendorsCarousel />
        </div>

        {/* 6. New Arrivals Section */}
        {newProducts.length > 0 && (
          <section className="py-3 bg-muted/30">
            <div className="px-4 md:px-6 lg:px-8 max-w-[1800px] mx-auto">
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

        {/* 7. Categories with Products - Alternating background */}
        {activeCategories.slice(0, 6).map((category, index) => {
          const categoryProducts = allProducts
            .filter(p => p.category_slug === category.slug)
            .slice(0, 8);
          
          if (categoryProducts.length === 0) return null;
          
          const isMuted = index % 2 === 1;
          
          return (
            <section key={category.id} className={cn("py-3 border-t border-border/30", isMuted && "bg-muted/30")}>
              <div className="px-4 md:px-6 lg:px-8 max-w-[1800px] mx-auto">
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

        {/* 8. Recently Viewed Products */}
        <RecentlyViewedProducts />

        {/* 9. All Products Grid */}
        <section className="py-4 px-4 md:px-6 lg:px-8 max-w-[1800px] mx-auto">
          <UnifiedSectionHeader
            title={isRu ? 'Все товары' : 'All Products'}
            count={allProducts.length}
          />
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 md:gap-4">
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

        {/* 10. Cross-sell to other services */}
        <section className="py-6 max-w-7xl mx-auto">
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
