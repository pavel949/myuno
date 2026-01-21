import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StickyCartBar } from '@/components/cart/StickyCartBar';
import { CategoryBannerGrid, CategoryBannerData, ProductSection, ProductCard } from '@/components/market';
import { 
  useMarketplaceCategories, 
  useMarketplaceProducts,
  useDeliverySettings,
} from '@/hooks/useMarketplace';
import { MarketplaceProduct } from '@/types/marketplace';
import { useCartToast } from '@/hooks/useCartToast';

const MarketIndex = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { addItem, removeItem, getItemsByType } = useCart();
  const { showAddedToast } = useCartToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Fetch data from database
  const { categories, isLoading: categoriesLoading } = useMarketplaceCategories();
  const { products: allProducts, isLoading: productsLoading } = useMarketplaceProducts();
  const { products: popularProducts, isLoading: popularLoading } = useMarketplaceProducts({ popularOnly: true, limit: 10 });
  const { products: newProducts, isLoading: newLoading } = useMarketplaceProducts({ newOnly: true, limit: 8 });
  const { freeDeliveryThreshold, amountToFreeDelivery } = useDeliverySettings();

  const cartItems = getItemsByType('product');
  const cartItemCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

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

  // Map categories to banner format
  const categoryBanners = useMemo(() => categories.map(cat => ({
    id: cat.slug,
    labelEn: cat.name_en,
    labelRu: cat.name_ru,
    descriptionEn: cat.description_en || '',
    descriptionRu: cat.description_ru || '',
    icon: cat.icon || '📦',
    image: cat.image_url || '/placeholder.svg',
    gradient: cat.gradient || 'from-primary/80 to-primary/40',
  })), [categories]);

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

  const handleCategoryClick = (categoryId: string) => {
    navigate(`/market/category/${categoryId}`);
  };

  const isLoading = categoriesLoading || productsLoading;

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
        <div className="relative rounded-2xl overflow-hidden mb-6 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-primary">
                {language === 'ru' ? 'Онлайн магазин' : 'Online Shop'}
              </span>
            </div>
            <h1 className="text-2xl font-bold mb-1">
              {language === 'ru' ? 'Доставка по Пхукету' : 'Phuket Delivery'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {language === 'ru' 
                ? 'Продукты, косметика, сувениры и декор' 
                : 'Groceries, cosmetics, souvenirs & decor'}
            </p>
            {/* Free delivery banner */}
            {freeDeliveryThreshold && (
              <div className="mt-3 inline-flex items-center gap-1.5 bg-green-500/10 text-green-600 dark:text-green-400 px-3 py-1.5 rounded-full text-xs font-medium">
                🚚 {language === 'ru' 
                  ? `Бесплатная доставка от ฿${freeDeliveryThreshold}` 
                  : `Free delivery from ฿${freeDeliveryThreshold}`}
              </div>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={language === 'ru' ? 'Поиск товаров...' : 'Search products...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            className="pl-10 pr-4 h-12 rounded-xl bg-muted/50"
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

        {/* Category Banners */}
        {!categoriesLoading && categoryBanners.length > 0 && (
          <section className="mb-8">
            <CategoryBannerGrid
              banners={categoryBanners}
              onCategoryClick={handleCategoryClick}
            />
          </section>
        )}

        {/* Popular Products */}
        <div className="mb-8">
          <ProductSection
            title="Popular"
            titleRu="Популярное"
            products={popularProducts}
            variant="scroll"
            maxItems={10}
            isLoading={popularLoading}
          />
        </div>

        {/* New Arrivals */}
        <div className="mb-8">
          <ProductSection
            title="New Arrivals"
            titleRu="Новинки"
            products={newProducts}
            variant="scroll"
            maxItems={8}
            isLoading={newLoading}
          />
        </div>

        {/* Categories Quick Links */}
        {categoryBanners.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold mb-3">
              {language === 'ru' ? 'Категории' : 'Categories'}
            </h2>
            <div className="flex flex-wrap gap-2">
              {categoryBanners.map(cat => (
                <Button
                  key={cat.id}
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => handleCategoryClick(cat.id)}
                >
                  <span className="mr-1.5">{cat.icon}</span>
                  {language === 'ru' ? cat.labelRu : cat.labelEn}
                </Button>
              ))}
            </div>
          </section>
        )}

        {/* All Products Preview */}
        {!productsLoading && allProducts.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold">
                {language === 'ru' ? 'Все товары' : 'All Products'}
              </h2>
              <Badge variant="secondary">
                {allProducts.length} {language === 'ru' ? 'товаров' : 'items'}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {allProducts.slice(0, 6).map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  quantity={getQuantity(product.id)}
                  onAdd={() => handleAdd(product)}
                  onRemove={() => handleRemove(product.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Sticky Cart Bar */}
        {cartItemCount > 0 && (
          <StickyCartBar
            checkoutPath="/market/checkout"
          />
        )}
      </PageContainer>
    </AppLayout>
  );
};

export default MarketIndex;
