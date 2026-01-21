import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { StickyCartBar } from '@/components/cart/StickyCartBar';
import { ProductCard } from '@/components/market';
import { useMarketplaceCategories, useMarketplaceProducts } from '@/hooks/useMarketplace';
import { MarketplaceProduct, subcategoriesByCategory } from '@/types/marketplace';
import { useCartToast } from '@/hooks/useCartToast';
import { FilterChip, FilterChipGroup } from '@/components/uno/FilterChip';
import { Skeleton } from '@/components/ui/skeleton';

const MarketCategoryPage = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { addItem, removeItem, getItemsByType } = useCart();
  const { showAddedToast } = useCartToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('all');

  // Fetch from database
  const { categories, isLoading: categoriesLoading } = useMarketplaceCategories();
  const { products: categoryProducts, isLoading: productsLoading } = useMarketplaceProducts({
    category: categoryId,
  });

  const category = categories.find(c => c.slug === categoryId);
  const subcategories = subcategoriesByCategory[categoryId || ''] || [];
  
  const cartItems = getItemsByType('product');
  const cartItemCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  const filteredProducts = useMemo(() => {
    return categoryProducts.filter(product => {
      // Subcategory filter
      if (selectedSubcategory !== 'all' && product.subcategory !== selectedSubcategory) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const name = language === 'ru' ? product.name_ru : product.name_en;
        const desc = language === 'ru' ? product.description_ru : product.description_en;
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

  const isLoading = categoriesLoading || productsLoading;

  if (!isLoading && !category) {
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

  return (
    <AppLayout>
      <PageContainer className="pb-32">
        {/* Header */}
        <PageHeader
          title={category ? (language === 'ru' ? category.name_ru : category.name_en) : '...'}
          fallbackPath="/market"
          showBack
          badge={!isLoading ? filteredProducts.length : undefined}
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
        {category && (
          <div className="relative rounded-2xl overflow-hidden mb-6 h-32">
            <img
              src={category.image_url || '/placeholder.svg'}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className={`absolute inset-0 bg-gradient-to-r ${category.gradient || 'from-primary/80 to-primary/40'}`} />
            <div className="absolute inset-0 p-4 flex items-end text-white">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{category.icon}</span>
                  <h1 className="text-xl font-bold">
                    {language === 'ru' ? category.name_ru : category.name_en}
                  </h1>
                </div>
                <p className="text-sm text-white/80">
                  {language === 'ru' ? category.description_ru : category.description_en}
                </p>
              </div>
            </div>
          </div>
        )}

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
        {subcategories.length > 1 && (
          <FilterChipGroup scrollable className="mb-4">
            {subcategories.map(sub => (
              <FilterChip
                key={sub.id}
                label={language === 'ru' ? sub.label_ru : sub.label_en}
                isActive={selectedSubcategory === sub.id}
                onClick={() => setSelectedSubcategory(sub.id)}
              />
            ))}
          </FilterChipGroup>
        )}

        {/* Results Count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {isLoading ? '...' : `${filteredProducts.length} ${language === 'ru' ? 'товаров' : 'products'}`}
          </p>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-card rounded-xl border border-border overflow-hidden">
                <Skeleton className="aspect-square" />
                <div className="p-3">
                  <Skeleton className="h-10 mb-2" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
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

        {/* Sticky Cart - filtered to show only product type items */}
        <StickyCartBar 
          itemType="product" 
          checkoutPath="/market/checkout" 
        />
      </PageContainer>
    </AppLayout>
  );
};

export default MarketCategoryPage;
