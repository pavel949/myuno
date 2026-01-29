import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  Search, 
  Heart,
  ChevronRight,
  Package,
  Store,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { StickyCartBar } from '@/components/cart/StickyCartBar';
import { ProductSection, ProfessionalProductCard } from '@/components/market';
import { CategoryGrid } from '@/components/market/CategoryGrid';
import { FeaturedBanner } from '@/components/market/FeaturedBanner';
import { 
  useMarketplaceCategories, 
  useMarketplaceProducts,
  useMarketplaceSubcategories,
  useDeliverySettings,
  MarketplaceCategory,
} from '@/hooks/useMarketplace';
import { useVendors } from '@/hooks/useMarketplaceVendors';
import { MarketplaceProduct } from '@/types/marketplace';
import { useCartToast } from '@/hooks/useCartToast';
import { CrossSellSection } from '@/components/crosssell';
import { cn } from '@/lib/utils';

const MarketIndex = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { addItem, removeItem, getItemsByType } = useCart();
  const { showAddedToast } = useCartToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeTab, setActiveTab] = useState<'categories' | 'products' | 'vendors'>('categories');

  // Fetch data from database
  const { categories, isLoading: categoriesLoading } = useMarketplaceCategories();
  const { subcategories } = useMarketplaceSubcategories();
  const { products: allProducts, isLoading: productsLoading } = useMarketplaceProducts();
  const { products: popularProducts, isLoading: popularLoading } = useMarketplaceProducts({ popularOnly: true, limit: 12 });
  const { products: newProducts, isLoading: newLoading } = useMarketplaceProducts({ newOnly: true, limit: 8 });
  const { freeDeliveryThreshold, defaultZone } = useDeliverySettings();
  const { vendors, isLoading: vendorsLoading } = useVendors();

  const cartItems = getItemsByType('product');
  const cartItemCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  // Calculate product counts per category
  const productCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allProducts.forEach(p => {
      counts[p.category_slug] = (counts[p.category_slug] || 0) + 1;
    });
    return counts;
  }, [allProducts]);

  // Filter categories by group and hide empty ones
  const { foodCategories, nonFoodCategories, activeCategories } = useMemo(() => {
    const withProducts = categories.filter(cat => productCounts[cat.slug] > 0);
    
    const food = withProducts
      .filter(c => c.category_group === 'food')
      .sort((a, b) => a.sort_order - b.sort_order);
    
    const nonFood = withProducts
      .filter(c => c.category_group === 'non-food')
      .sort((a, b) => a.sort_order - b.sort_order);
    
    return { 
      foodCategories: food, 
      nonFoodCategories: nonFood, 
      activeCategories: [...food, ...nonFood] 
    };
  }, [categories, productCounts]);

  // Search results
  const searchResults = useMemo(() => {
    if (searchQuery.length < 2) return [];
    const query = searchQuery.toLowerCase();
    return allProducts.filter(p => 
      p.name_en.toLowerCase().includes(query) ||
      p.name_ru.toLowerCase().includes(query) ||
      p.description_en?.toLowerCase().includes(query) ||
      p.description_ru?.toLowerCase().includes(query) ||
      p.tags?.some(t => t.toLowerCase().includes(query))
    ).slice(0, 10);
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
    <AppLayout>
      <PageContainer className="pb-32">
        {/* Header */}
        <PageHeader
          title={language === 'ru' ? 'Маркет' : 'Market'}
          fallbackPath="/"
          showBack
          actions={
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate('/market/wishlist')}
                className="relative"
              >
                <Heart className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate('/cart')} 
                className="relative"
              >
                <ShoppingBag className="w-5 h-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </Button>
            </div>
          }
        />

        {/* Hero Banner */}
        <FeaturedBanner
          freeDeliveryThreshold={freeDeliveryThreshold}
          estimatedTime={defaultZone?.estimated_time_minutes}
          productCount={productsLoading ? 200 : allProducts.length}
          vendorCount={vendorsLoading ? 17 : vendors.length}
        />

        {/* Search */}
        <div className="relative my-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={language === 'ru' ? 'Найти товары, категории, продавцов...' : 'Search products, categories, vendors...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            className="pl-10 pr-4 h-12 rounded-xl bg-muted/50 border-0"
          />
          
          {/* Search Results Dropdown */}
          {isSearchFocused && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto">
              <div className="p-2 border-b border-border">
                <span className="text-xs text-muted-foreground px-2">
                  {searchResults.length} {language === 'ru' ? 'найдено' : 'found'}
                </span>
              </div>
              {searchResults.map(product => (
                <button
                  key={product.id}
                  className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 text-left transition-colors"
                  onClick={() => {
                    navigate(`/market/product/${product.id}`);
                    setSearchQuery('');
                  }}
                >
                  <img
                    src={product.cover_image || '/placeholder.svg'}
                    alt=""
                    className="w-14 h-14 rounded-xl object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">
                      {language === 'ru' ? product.name_ru : product.name_en}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {language === 'ru' ? product.vendor_name_ru : product.vendor_name}
                    </p>
                    <p className="text-sm text-primary font-bold mt-0.5">
                      ฿{product.price.toLocaleString()}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Main Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="mb-5">
          <TabsList className="w-full grid grid-cols-3 h-12 bg-muted/50 p-1 rounded-xl">
            <TabsTrigger 
              value="categories" 
              className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2"
            >
              <Package className="w-4 h-4" />
              <span className="text-xs font-medium">
                {language === 'ru' ? 'Категории' : 'Categories'}
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="products" 
              className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="text-xs font-medium">
                {language === 'ru' ? 'Товары' : 'Products'}
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="vendors" 
              className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2"
            >
              <Store className="w-4 h-4" />
              <span className="text-xs font-medium">
                {language === 'ru' ? 'Продавцы' : 'Vendors'}
              </span>
            </TabsTrigger>
          </TabsList>

          {/* Categories Tab */}
          <TabsContent value="categories" className="mt-5 space-y-6">
            {categoriesLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="aspect-[1.4/1] rounded-2xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                {/* Food Categories */}
                {foodCategories.length > 0 && (
                  <CategoryGrid
                    categories={foodCategories}
                    productCounts={productCounts}
                    title="🍽️ Food & Groceries"
                    titleRu="🍽️ Продукты питания"
                  />
                )}

                {/* Non-Food Categories */}
                {nonFoodCategories.length > 0 && (
                  <CategoryGrid
                    categories={nonFoodCategories}
                    productCounts={productCounts}
                    title="🛍️ Goods & Lifestyle"
                    titleRu="🛍️ Товары и стиль жизни"
                  />
                )}
              </>
            )}
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="mt-5 space-y-6">
            {/* Popular Products */}
            {popularProducts.length > 0 && (
              <ProductSection
                title="🔥 Bestsellers"
                titleRu="🔥 Хиты продаж"
                products={popularProducts}
                variant="scroll"
                maxItems={12}
                isLoading={popularLoading}
              />
            )}

            {/* New Arrivals */}
            {newProducts.length > 0 && (
              <ProductSection
                title="✨ New Arrivals"
                titleRu="✨ Новинки"
                products={newProducts}
                variant="scroll"
                maxItems={8}
                isLoading={newLoading}
              />
            )}

            {/* All Products Grid */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold">
                  {language === 'ru' ? 'Все товары' : 'All Products'}
                </h2>
                <Badge variant="secondary">
                  {allProducts.length} {language === 'ru' ? 'шт' : 'items'}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {allProducts.slice(0, 12).map(product => (
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
              
              {allProducts.length > 12 && (
                <Button 
                  variant="outline" 
                  className="w-full mt-4 rounded-xl h-11"
                  onClick={() => setActiveTab('categories')}
                >
                  {language === 'ru' 
                    ? 'Смотреть по категориям' 
                    : 'Browse by Categories'}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </TabsContent>

          {/* Vendors Tab */}
          <TabsContent value="vendors" className="mt-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold">
                  {language === 'ru' ? 'Продавцы' : 'Vendors'}
                </h2>
                <Badge variant="outline">
                  {vendors.length} {language === 'ru' ? 'продавцов' : 'vendors'}
                </Badge>
              </div>
              
              <div className="space-y-3">
                {vendors.map(vendor => {
                  const vendorProductCount = allProducts.filter(p => (p as any).vendor_id === vendor.id).length;
                  return (
                    <button
                      key={vendor.id}
                      onClick={() => navigate(`/market/vendor/${vendor.slug}`)}
                      className="w-full flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-md transition-all text-left group"
                    >
                      {/* Logo */}
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden shrink-0">
                        {vendor.logo_url ? (
                          <img 
                            src={vendor.logo_url} 
                            alt="" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Store className="w-6 h-6 text-primary" />
                        )}
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm truncate">
                            {language === 'ru' ? vendor.name_ru : vendor.name_en}
                          </h3>
                          {vendor.verified && (
                            <Badge className="bg-blue-500/10 text-blue-600 border-0 text-[10px] px-1.5 py-0">
                              ✓
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {vendor.rating && (
                            <span className="flex items-center gap-1">
                              ⭐ {vendor.rating.toFixed(1)}
                            </span>
                          )}
                          <span>{vendorProductCount} {language === 'ru' ? 'товаров' : 'products'}</span>
                        </div>
                      </div>
                      
                      {/* Arrow */}
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Cross-sell section (only on categories tab) */}
        {activeTab === 'categories' && (
          <CrossSellSection currentVertical="market" className="mt-6" />
        )}

        {/* Sticky Cart Bar */}
        <StickyCartBar
          itemType="product"
          checkoutPath="/market/checkout"
        />
      </PageContainer>
    </AppLayout>
  );
};

export default MarketIndex;
