import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, SlidersHorizontal, Sparkles, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StickyCartBar } from '@/components/cart/StickyCartBar';
import { CategoryBannerGrid, ProductSection } from '@/components/market';
import {
  categoryBanners,
  marketplaceProducts,
  getPopularProducts,
  getNewProducts,
  searchProducts,
  MarketProduct,
} from '@/data/marketplaceProducts';
import { useCartToast } from '@/hooks/useCartToast';

const MarketIndex = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { items, addItem, removeItem, getItemsByType } = useCart();
  const { showAddedToast } = useCartToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const cartItems = getItemsByType('product');
  const cartItemCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const popularProducts = useMemo(() => getPopularProducts(), []);
  const newProducts = useMemo(() => getNewProducts(), []);

  const searchResults = useMemo(() => {
    if (searchQuery.length < 2) return [];
    return searchProducts(searchQuery, language as 'en' | 'ru');
  }, [searchQuery, language]);

  const getQuantity = (productId: string) => {
    return cartItems.find(i => i.id === productId)?.quantity || 0;
  };

  const handleAdd = (product: MarketProduct) => {
    const item = {
      id: product.id,
      type: 'product' as const,
      name: product.nameEn,
      nameRu: product.nameRu,
      price: product.price,
      currency: '฿',
      image: product.image,
      providerId: product.vendorId || 'marketplace',
      providerName: product.vendorName || 'myUNO Market',
      providerNameRu: product.vendorNameRu || 'myUNO Маркет',
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
              {searchResults.slice(0, 8).map(product => (
                <button
                  key={product.id}
                  className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 text-left"
                  onClick={() => {
                    handleAdd(product);
                    setSearchQuery('');
                  }}
                >
                  <img
                    src={product.image}
                    alt=""
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">
                      {language === 'ru' ? product.nameRu : product.nameEn}
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
        <section className="mb-8">
          <CategoryBannerGrid
            banners={categoryBanners}
            onCategoryClick={handleCategoryClick}
          />
        </section>

        {/* Popular Products */}
        <div className="mb-8">
          <ProductSection
            title="Popular"
            titleRu="Популярное"
            products={popularProducts}
            variant="scroll"
            maxItems={10}
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
          />
        </div>

        {/* Categories Quick Links */}
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

        {/* All Products Preview */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">
              {language === 'ru' ? 'Все товары' : 'All Products'}
            </h2>
            <Badge variant="secondary">
              {marketplaceProducts.length} {language === 'ru' ? 'товаров' : 'items'}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {marketplaceProducts.slice(0, 6).map(product => (
              <div key={product.id}>
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                  <div className="relative aspect-square">
                    <img
                      src={product.image}
                      alt={language === 'ru' ? product.nameRu : product.nameEn}
                      className="w-full h-full object-cover"
                    />
                    {product.isPopular && (
                      <Badge className="absolute top-2 left-2 bg-amber-500 text-[10px]">
                        🔥 HIT
                      </Badge>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-medium line-clamp-2 min-h-[2.5rem]">
                      {language === 'ru' ? product.nameRu : product.nameEn}
                    </h3>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-bold">฿{product.price}</span>
                      <Button
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => handleAdd(product)}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

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
