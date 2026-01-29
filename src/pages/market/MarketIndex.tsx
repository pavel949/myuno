import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  ChevronRight,
  Truck,
  Clock,
  Star,
  Flame,
  Sparkles,
  Grid3X3,
  ArrowRight,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { StickyCartBar } from '@/components/cart/StickyCartBar';
import { ProfessionalProductCard } from '@/components/market';
import { 
  useMarketplaceCategories, 
  useMarketplaceProducts,
  useDeliverySettings,
} from '@/hooks/useMarketplace';
import { useVendors } from '@/hooks/useMarketplaceVendors';
import { MarketplaceProduct } from '@/types/marketplace';
import { useCartToast } from '@/hooks/useCartToast';
import { cn } from '@/lib/utils';

// Category icon mapping
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

const MarketIndex = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { addItem, removeItem, getItemsByType } = useCart();
  const { showAddedToast } = useCartToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Fetch data
  const { categories, isLoading: categoriesLoading } = useMarketplaceCategories();
  const { products: allProducts, isLoading: productsLoading } = useMarketplaceProducts();
  const { products: popularProducts } = useMarketplaceProducts({ popularOnly: true, limit: 20 });
  const { products: newProducts } = useMarketplaceProducts({ newOnly: true, limit: 12 });
  const { freeDeliveryThreshold, defaultZone } = useDeliverySettings();
  const { vendors } = useVendors();

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

        {/* Categories Horizontal Scroll - Ozon Style */}
        <div className="bg-card border-b border-border/50">
          <ScrollArea className="w-full">
            <div className="flex items-center gap-1 px-4 py-3 max-w-7xl mx-auto">
              {/* All Categories Button */}
              <button
                onClick={() => navigate('/market/categories')}
                className="flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-muted/50 transition-colors shrink-0"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Grid3X3 className="w-6 h-6 text-primary" />
                </div>
                <span className="text-[11px] font-medium text-center whitespace-nowrap">
                  {language === 'ru' ? 'Каталог' : 'Catalog'}
                </span>
              </button>

              <div className="w-px h-12 bg-border mx-1" />

              {/* Category Pills */}
              {categoriesLoading ? (
                [...Array(8)].map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5 px-3 py-2 shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-muted animate-pulse" />
                    <div className="w-12 h-3 bg-muted animate-pulse rounded" />
                  </div>
                ))
              ) : (
                activeCategories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => navigate(`/market/category/${category.slug}`)}
                    className="flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-muted/50 transition-colors shrink-0 group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-muted/50 group-hover:bg-muted flex items-center justify-center text-2xl transition-colors">
                      {getCategoryIcon(category.slug)}
                    </div>
                    <span className="text-[11px] font-medium text-center whitespace-nowrap max-w-[60px] truncate">
                      {language === 'ru' ? category.name_ru : category.name_en}
                    </span>
                  </button>
                ))
              )}
            </div>
            <ScrollBar orientation="horizontal" className="invisible" />
          </ScrollArea>
        </div>

        {/* Promo Banners */}
        <div className="px-4 py-4 max-w-7xl mx-auto">
          <div className="grid grid-cols-2 gap-3">
            {/* Free Delivery Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 text-white">
              <Truck className="absolute -right-2 -bottom-2 w-16 h-16 opacity-20" />
              <div className="relative z-10">
                <p className="text-[10px] uppercase tracking-wide opacity-80 mb-1">
                  {language === 'ru' ? 'Доставка' : 'Delivery'}
                </p>
                <p className="text-lg font-bold leading-tight">
                  {language === 'ru' ? 'Бесплатно' : 'Free'}
                </p>
                <p className="text-xs opacity-90 mt-1">
                  {language === 'ru' ? `от ฿${freeDeliveryThreshold}` : `from ฿${freeDeliveryThreshold}`}
                </p>
              </div>
            </div>

            {/* Fast Delivery Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-4 text-white">
              <Clock className="absolute -right-2 -bottom-2 w-16 h-16 opacity-20" />
              <div className="relative z-10">
                <p className="text-[10px] uppercase tracking-wide opacity-80 mb-1">
                  {language === 'ru' ? 'Время' : 'Time'}
                </p>
                <p className="text-lg font-bold leading-tight">
                  {defaultZone?.estimated_time_minutes || 45} {language === 'ru' ? 'мин' : 'min'}
                </p>
                <p className="text-xs opacity-90 mt-1">
                  {language === 'ru' ? 'экспресс' : 'express'}
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
                    <span className="text-xl">{getCategoryIcon(category.slug)}</span>
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
