import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, LayoutGrid, List, Flame, Star, Sparkles } from 'lucide-react';
import { resolveIcon } from '@/lib/iconMap';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { StickyCartBar } from '@/components/cart/StickyCartBar';
import { ProfessionalProductCard, SubcategoryChips } from '@/components/market';
import { useMarketplaceCategories, useMarketplaceProducts, useMarketplaceSubcategories } from '@/hooks/useMarketplace';
import { MarketplaceProduct, MarketplaceSubcategory } from '@/types/marketplace';
import { useCartToast } from '@/hooks/useCartToast';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { MarketComingSoonOverlay } from '@/components/market/MarketComingSoonOverlay';
import { PLACEHOLDER_IMAGES } from '@/lib/config/placeholders';

// Special virtual categories
const SPECIAL_CATEGORIES = {
  deals: {
    slug: 'deals',
    name_en: 'Deals & Discounts',
    name_ru: 'Акции и скидки',
    description_en: 'Best prices on popular products',
    description_ru: 'Лучшие цены на популярные товары',
    icon: '🔥',
    gradient: 'from-accent/90 to-red-500/80',
    image_url: PLACEHOLDER_IMAGES.marketCategories['hot'],
  },
  popular: {
    slug: 'popular',
    name_en: 'Bestsellers',
    name_ru: 'Хиты продаж',
    description_en: 'Most popular products',
    description_ru: 'Самые популярные товары',
    icon: '⭐',
    gradient: 'from-accent/90 to-accent/80',
    image_url: PLACEHOLDER_IMAGES.marketCategories['popular'],
  },
  new: {
    slug: 'new',
    name_en: 'New Arrivals',
    name_ru: 'Новинки',
    description_en: 'Fresh products just added',
    description_ru: 'Свежие товары только что добавлены',
    icon: '✨',
    gradient: 'from-primary/90 to-accent/80',
    image_url: PLACEHOLDER_IMAGES.marketCategories['new'],
  },
};

type SpecialCategorySlug = keyof typeof SPECIAL_CATEGORIES;

const MarketCategoryPage = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { addItem, removeItem, getItemsByType } = useCart();
  const { showAddedToast } = useCartToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'horizontal'>('grid');

  // Check if it's a special category
  const isSpecialCategory = categoryId && categoryId in SPECIAL_CATEGORIES;
  const specialCategory = isSpecialCategory ? SPECIAL_CATEGORIES[categoryId as SpecialCategorySlug] : null;

  // Fetch from database
  const { categories, isLoading: categoriesLoading } = useMarketplaceCategories();
  const { subcategories: dbSubcategories, isLoading: subcategoriesLoading } = useMarketplaceSubcategories(
    isSpecialCategory ? undefined : categoryId
  );
  
  // Determine product filter options based on category type
  const productOptions = useMemo(() => {
    if (categoryId === 'deals') {
      return { dealsOnly: true };
    }
    if (categoryId === 'popular') {
      return { popularOnly: true };
    }
    if (categoryId === 'new') {
      return { newOnly: true };
    }
    return { category: categoryId };
  }, [categoryId]);

  const { products: categoryProducts, isLoading: productsLoading } = useMarketplaceProducts(productOptions);

  // For regular categories, find from DB; for special, use virtual category
  const category = isSpecialCategory 
    ? specialCategory 
    : categories.find(c => c.slug === categoryId);

  // Use subcategories directly for new chips component (only for regular categories)
  const subcategoryChips = useMemo(() => {
    if (isSpecialCategory) return [];
    return dbSubcategories.map(sub => ({
      id: sub.slug,
      label_en: sub.name_en,
      label_ru: sub.name_ru,
      icon: sub.icon,
    }));
  }, [dbSubcategories, isSpecialCategory]);
  
  const cartItems = getItemsByType('product');
  const cartItemCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  const filteredProducts = useMemo(() => {
    return categoryProducts.filter(product => {
      // Subcategory filter (only for regular categories)
      if (!isSpecialCategory && selectedSubcategory !== 'all' && product.subcategory !== selectedSubcategory) {
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
  }, [categoryProducts, selectedSubcategory, searchQuery, language, isSpecialCategory]);

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

  const isLoading = categoriesLoading || productsLoading || (!isSpecialCategory && subcategoriesLoading);

  // For regular categories, show "not found" if category doesn't exist
  if (!isLoading && !category && !isSpecialCategory) {
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
          <div className="relative rounded-none overflow-hidden mb-6 h-32">
            <img
              src={category.image_url || '/placeholder.svg'}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className={`absolute inset-0 bg-gradient-to-r ${category.gradient || 'from-primary/80 to-primary/40'}`} />
            <div className="absolute inset-0 p-4 flex items-end text-white">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {(() => { const Icon = resolveIcon(category.icon); return <Icon className="w-6 h-6" />; })()}
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
            className="pl-10 pr-4 h-11 rounded-none bg-muted/50"
          />
        </div>

        {/* Subcategory Chips - only for regular categories */}
        {!isSpecialCategory && subcategoryChips.length > 0 && (
          <SubcategoryChips
            subcategories={subcategoryChips}
            selectedId={selectedSubcategory}
            onSelect={setSelectedSubcategory}
            className="mb-4"
          />
        )}

        {/* Results Count & View Toggle */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {isLoading ? '...' : `${filteredProducts.length} ${language === 'ru' ? 'товаров' : 'products'}`}
          </p>
          <div className="flex gap-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'horizontal' ? 'default' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('horizontal')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Products */}
        {isLoading ? (
          <div className={cn(
            "gap-3 md:gap-4",
            viewMode === 'grid' ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6" : "flex flex-col"
          )}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-card rounded-none border border-border overflow-hidden">
                <Skeleton className={viewMode === 'grid' ? "aspect-square" : "h-28 w-28"} />
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
          <div className={cn(
            "gap-3 md:gap-4",
            viewMode === 'grid' ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6" : "flex flex-col"
          )}>
            {filteredProducts.map(product => (
              <ProfessionalProductCard
                key={product.id}
                product={product}
                quantity={getQuantity(product.id)}
                onAdd={() => handleAdd(product)}
                onRemove={() => handleRemove(product.id)}
                onClick={() => navigate(`/market/product/${product.id}`)}
                variant={viewMode}
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
      <MarketComingSoonOverlay />
    </AppLayout>
  );
};

export default MarketCategoryPage;
