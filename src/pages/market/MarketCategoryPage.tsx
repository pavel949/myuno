import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, ShoppingBag } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StickyCartBar } from '@/components/cart/StickyCartBar';
import { ProductCard } from '@/components/market';
import {
  categoryBanners,
  subcategories,
  marketplaceProducts,
  MarketProduct,
  MarketCategory,
} from '@/data/marketplaceProducts';
import { useCartToast } from '@/hooks/useCartToast';
import { FilterChip, FilterChipGroup } from '@/components/uno/FilterChip';

const MarketCategoryPage = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { addItem, removeItem, getItemsByType } = useCart();
  const { showAddedToast } = useCartToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('all');

  const category = categoryBanners.find(c => c.id === categoryId);
  const categorySubcategories = subcategories[categoryId as MarketCategory] || [];
  
  const cartItems = getItemsByType('product');
  const cartItemCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  const categoryProducts = useMemo(() => {
    return marketplaceProducts.filter(p => p.category === categoryId);
  }, [categoryId]);

  const filteredProducts = useMemo(() => {
    return categoryProducts.filter(product => {
      // Subcategory filter
      if (selectedSubcategory !== 'all' && product.subcategory !== selectedSubcategory) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const name = language === 'ru' ? product.nameRu : product.nameEn;
        const desc = language === 'ru' ? product.descriptionRu : product.descriptionEn;
        if (!name.toLowerCase().includes(query) && 
            !(desc && desc.toLowerCase().includes(query))) {
          return false;
        }
      }

      return true;
    });
  }, [categoryProducts, selectedSubcategory, searchQuery, language]);

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

  if (!category) {
    return (
      <AppLayout>
        <PageContainer>
          <PageHeader 
            title={language === 'ru' ? 'Категория не найдена' : 'Category not found'}
            showBack
            fallbackPath="/market"
          />
        </PageContainer>
      </AppLayout>
    );
  }

  const subcategoryChips = categorySubcategories.map(sub => ({
    id: sub.id,
    labelEn: sub.labelEn,
    labelRu: sub.labelRu,
  }));

  return (
    <AppLayout>
      <PageContainer className="pb-32">
        {/* Header */}
        <PageHeader
          title={language === 'ru' ? category.labelRu : category.labelEn}
          fallbackPath="/market"
          showBack
          badge={filteredProducts.length}
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

        {/* Hero Banner */}
        <div className="relative rounded-2xl overflow-hidden mb-6 h-32">
          <img
            src={category.image}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className={`absolute inset-0 bg-gradient-to-r ${category.gradient}`} />
          <div className="absolute inset-0 p-4 flex items-end text-white">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{category.icon}</span>
                <h1 className="text-xl font-bold">
                  {language === 'ru' ? category.labelRu : category.labelEn}
                </h1>
              </div>
              <p className="text-sm text-white/80">
                {language === 'ru' ? category.descriptionRu : category.descriptionEn}
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={language === 'ru' ? 'Поиск в категории...' : 'Search in category...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 h-11 rounded-xl bg-muted/50"
          />
        </div>

        {/* Subcategory Chips */}
        {subcategoryChips.length > 1 && (
          <FilterChipGroup scrollable className="mb-4">
            {subcategoryChips.map(sub => (
              <FilterChip
                key={sub.id}
                label={language === 'ru' ? sub.labelRu : sub.labelEn}
                isActive={selectedSubcategory === sub.id}
                onClick={() => setSelectedSubcategory(sub.id)}
              />
            ))}
          </FilterChipGroup>
        )}

        {/* Results Count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {filteredProducts.length} {language === 'ru' ? 'товаров' : 'products'}
          </p>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {language === 'ru' ? 'Товары не найдены' : 'No products found'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                quantity={getQuantity(product.id)}
                onAdd={() => handleAdd(product)}
                onRemove={() => handleRemove(product.id)}
              />
            ))}
          </div>
        )}

        {/* Sticky Cart */}
        {cartItemCount > 0 && (
          <StickyCartBar checkoutPath="/market/checkout" />
        )}
      </PageContainer>
    </AppLayout>
  );
};

export default MarketCategoryPage;
