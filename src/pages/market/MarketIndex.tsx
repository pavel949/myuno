import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, Sparkles, UtensilsCrossed, ShoppingBasket, Truck, Clock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StickyCartBar } from '@/components/cart/StickyCartBar';
import { ProductSection, ProfessionalProductCard, ProfessionalCategoryBanner } from '@/components/market';
import { 
  useMarketplaceCategories, 
  useMarketplaceProducts,
  useDeliverySettings,
  MarketplaceCategory,
} from '@/hooks/useMarketplace';
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
  const [activeTab, setActiveTab] = useState<'all' | 'food' | 'non-food'>('all');

  // Fetch data from database
  const { categories, isLoading: categoriesLoading } = useMarketplaceCategories();
  const { products: allProducts, isLoading: productsLoading } = useMarketplaceProducts();
  const { products: popularProducts, isLoading: popularLoading } = useMarketplaceProducts({ popularOnly: true, limit: 10 });
  const { products: newProducts, isLoading: newLoading } = useMarketplaceProducts({ newOnly: true, limit: 8 });
  const { freeDeliveryThreshold, defaultZone } = useDeliverySettings();

  const cartItems = getItemsByType('product');
  const cartItemCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // Filter categories by group and hide empty ones
  const { foodCategories, nonFoodCategories, filteredCategories } = useMemo(() => {
    const withProducts = categories.filter(cat => {
      const productCount = allProducts.filter(p => p.category_slug === cat.slug).length;
      return productCount > 0;
    });
    
    const food = withProducts
      .filter(c => c.category_group === 'food')
      .sort((a, b) => a.sort_order - b.sort_order);
    
    const nonFood = withProducts
      .filter(c => c.category_group === 'non-food')
      .sort((a, b) => a.sort_order - b.sort_order);
    
    let filtered: MarketplaceCategory[] = [];
    if (activeTab === 'all') filtered = [...food, ...nonFood];
    else if (activeTab === 'food') filtered = food;
    else filtered = nonFood;
    
    return { foodCategories: food, nonFoodCategories: nonFood, filteredCategories: filtered };
  }, [categories, allProducts, activeTab]);

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
    ).slice(0, 8);
  }, [searchQuery, allProducts]);

  // Products filtered by active tab
  const filteredProducts = useMemo(() => {
    if (activeTab === 'all') return allProducts;
    const categorySlugs = (activeTab === 'food' ? foodCategories : nonFoodCategories).map(c => c.slug);
    return allProducts.filter(p => categorySlugs.includes(p.category_slug));
  }, [allProducts, activeTab, foodCategories, nonFoodCategories]);

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

  const handleCategoryClick = (categorySlug: string) => {
    navigate(`/market/category/${categorySlug}`);
  };

  const isLoading = categoriesLoading || productsLoading;

  // Stats for display
  const foodProductCount = useMemo(() => {
    const slugs = foodCategories.map(c => c.slug);
    return allProducts.filter(p => slugs.includes(p.category_slug)).length;
  }, [allProducts, foodCategories]);

  const nonFoodProductCount = useMemo(() => {
    const slugs = nonFoodCategories.map(c => c.slug);
    return allProducts.filter(p => slugs.includes(p.category_slug)).length;
  }, [allProducts, nonFoodCategories]);

  return (
    <AppLayout>
      <PageContainer className="pb-32">
        {/* Header */}
        <PageHeader
          title={language === 'ru' ? 'Маркетплейс' : 'Marketplace'}
          fallbackPath="/"
          showBack
          actions={
            <Button variant="ghost" size="icon" onClick={() => navigate('/cart')} className="relative">
              <ShoppingBag className="w-5 h-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Button>
          }
        />

        {/* Hero Section */}
        <div className="relative rounded-2xl overflow-hidden mb-4 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-primary">
                {language === 'ru' ? 'Доставка по Пхукету' : 'Phuket Delivery'}
              </span>
            </div>
            <h1 className="text-xl font-bold mb-2">
              {language === 'ru' ? 'Свежие продукты и товары' : 'Fresh Food & Goods'}
            </h1>
            
            {/* Quick stats */}
            <div className="flex flex-wrap gap-3 mt-3">
              {freeDeliveryThreshold && (
                <div className="flex items-center gap-1.5 bg-green-500/10 text-green-600 dark:text-green-400 px-2.5 py-1 rounded-full text-xs font-medium">
                  <Truck className="w-3.5 h-3.5" />
                  {language === 'ru' ? `Бесплатно от ฿${freeDeliveryThreshold}` : `Free from ฿${freeDeliveryThreshold}`}
                </div>
              )}
              {defaultZone?.estimated_time_minutes && (
                <div className="flex items-center gap-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-full text-xs font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  {defaultZone.estimated_time_minutes} {language === 'ru' ? 'мин' : 'min'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="mb-4">
          <TabsList className="w-full grid grid-cols-3 h-11">
            <TabsTrigger value="all" className="text-xs sm:text-sm gap-1.5">
              <ShoppingBasket className="w-4 h-4" />
              {language === 'ru' ? 'Все' : 'All'}
              <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
                {allProducts.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="food" className="text-xs sm:text-sm gap-1.5">
              <UtensilsCrossed className="w-4 h-4" />
              {language === 'ru' ? 'Еда' : 'Food'}
              <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
                {foodProductCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="non-food" className="text-xs sm:text-sm gap-1.5">
              <ShoppingBag className="w-4 h-4" />
              {language === 'ru' ? 'Товары' : 'Goods'}
              <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
                {nonFoodProductCount}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={language === 'ru' ? 'Поиск товаров...' : 'Search products...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            className="pl-10 pr-4 h-11 rounded-xl bg-muted/50"
          />
          
          {/* Search Results Dropdown */}
          {isSearchFocused && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto">
              {searchResults.map(product => (
                <button
                  key={product.id}
                  className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 text-left"
                  onClick={() => {
                    handleAdd(product);
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
                    <p className="text-sm text-primary font-semibold">
                      ฿{product.price}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" className="shrink-0">
                    +
                  </Button>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Category Banners - Filtered by tab */}
        {!categoriesLoading && filteredCategories.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold">
                {activeTab === 'food' 
                  ? (language === 'ru' ? '🍽️ Продукты питания' : '🍽️ Food & Groceries')
                  : activeTab === 'non-food'
                  ? (language === 'ru' ? '🛍️ Непродовольственные' : '🛍️ Non-Food Items')
                  : (language === 'ru' ? 'Категории' : 'Categories')
                }
              </h2>
              <Badge variant="outline" className="text-xs">
                {filteredCategories.length} {language === 'ru' ? 'кат.' : 'cat.'}
              </Badge>
            </div>
            <ProfessionalCategoryBanner
              categories={filteredCategories}
              onCategoryClick={handleCategoryClick}
            />
          </section>
        )}

        {/* Popular Products */}
        {popularProducts.length > 0 && (
          <div className="mb-6">
            <ProductSection
              title="🔥 Popular"
              titleRu="🔥 Популярное"
              products={popularProducts}
              variant="scroll"
              maxItems={10}
              isLoading={popularLoading}
            />
          </div>
        )}

        {/* New Arrivals */}
        {newProducts.length > 0 && (
          <div className="mb-6">
            <ProductSection
              title="✨ New Arrivals"
              titleRu="✨ Новинки"
              products={newProducts}
              variant="scroll"
              maxItems={8}
              isLoading={newLoading}
            />
          </div>
        )}

        {/* Category Quick Links */}
        {filteredCategories.length > 0 && (
          <section className="mb-6">
            <h2 className="text-base font-bold mb-3">
              {language === 'ru' ? 'Быстрый доступ' : 'Quick Access'}
            </h2>
            <div className="flex flex-wrap gap-2">
              {filteredCategories.map(cat => {
                const count = allProducts.filter(p => p.category_slug === cat.slug).length;
                return (
                  <Button
                    key={cat.id}
                    variant="outline"
                    size="sm"
                    className="rounded-full h-9 gap-1.5"
                    onClick={() => handleCategoryClick(cat.slug)}
                  >
                    <span>{cat.icon}</span>
                    <span className="max-w-[100px] truncate">
                      {language === 'ru' ? cat.name_ru : cat.name_en}
                    </span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-0.5">
                      {count}
                    </Badge>
                  </Button>
                );
              })}
            </div>
          </section>
        )}

        {/* Products Grid - Filtered */}
        {!productsLoading && filteredProducts.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold">
                {activeTab === 'food' 
                  ? (language === 'ru' ? 'Продукты' : 'Food Products')
                  : activeTab === 'non-food'
                  ? (language === 'ru' ? 'Товары' : 'Products')
                  : (language === 'ru' ? 'Все товары' : 'All Products')
                }
              </h2>
              <Badge variant="secondary">
                {filteredProducts.length} {language === 'ru' ? 'шт.' : 'items'}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {filteredProducts.slice(0, 8).map(product => (
                <ProfessionalProductCard
                  key={product.id}
                  product={product}
                  quantity={getQuantity(product.id)}
                  onAdd={() => handleAdd(product)}
                  onRemove={() => handleRemove(product.id)}
                />
              ))}
            </div>
            
            {filteredProducts.length > 8 && (
              <Button 
                variant="outline" 
                className="w-full mt-4 rounded-xl"
                onClick={() => navigate('/market/all')}
              >
                {language === 'ru' 
                  ? `Показать все ${filteredProducts.length} товаров` 
                  : `View all ${filteredProducts.length} products`}
              </Button>
            )}
          </section>
        )}

        <CrossSellSection currentVertical="market" className="mt-8" />

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
