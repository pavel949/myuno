import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  Truck, 
  Shield, 
  Plane,
  Plus,
  Minus,
  Package,
  Scale,
  Ruler,
  ShoppingBag,
  Zap,
  Share2
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { DetailPageHeader } from '@/components/uno/DetailPageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCartToast } from '@/hooks/useCartToast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { VendorInfo } from '@/components/market/VendorInfo';
import { useVendorById } from '@/hooks/useMarketplaceVendors';
import { WishlistButton } from '@/components/market/WishlistButton';
import { ReviewList } from '@/components/market/reviews/ReviewList';
import { ReviewForm } from '@/components/market/reviews/ReviewForm';
import { ProductAttributes } from '@/components/market/ProductAttributes';
import { cn } from '@/lib/utils';
import { formatProductUnit, formatPricePerUnit } from '@/utils/formatProductUnit';
import { useBuyNow } from '@/hooks/useBuyNow';
import { MarketplaceProduct } from '@/types/marketplace';
import { MarketComingSoonOverlay } from '@/components/market/MarketComingSoonOverlay';

const ProductDetailPage = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { addItem, removeItem, getItemsByType } = useCart();
  const { showAddedToast } = useCartToast();
  const { buyNow } = useBuyNow();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Fetch product from database
  const { data: product, isLoading } = useQuery({
    queryKey: ['marketplace-product', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketplace_products')
        .select('*')
        .eq('id', productId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });

  // Fetch vendor data if product has vendor_id
  const { vendor, isLoading: vendorLoading } = useVendorById(product?.vendor_id);

  const cartItems = getItemsByType('product');
  const quantity = useMemo(() => {
    return cartItems.find(i => i.id === productId)?.quantity || 0;
  }, [cartItems, productId]);

  const name = product ? (language === 'ru' ? product.name_ru : product.name_en) : '';
  const description = product ? (language === 'ru' ? product.description_ru : product.description_en) : '';
  const vendorName = product ? (language === 'ru' ? (product.vendor_name_ru || product.vendor_name) : product.vendor_name) : '';
  
  // Precise unit formatting
  const unitDisplay = product ? formatProductUnit(product, language as 'en' | 'ru') : '';
  const pricePerUnit = product ? formatPricePerUnit(product, language as 'en' | 'ru') : null;

  // Create image gallery (cover + additional images)
  const images = useMemo(() => {
    if (!product) return [];
    const gallery = product.cover_image ? [product.cover_image] : ['/placeholder.svg'];
    // Add additional images from product.images array if available
    if (product.images && Array.isArray(product.images)) {
      gallery.push(...product.images);
    }
    return gallery;
  }, [product]);

  const discount = product?.original_price 
    ? Math.round((1 - product.price / product.original_price) * 100) 
    : 0;

  const handleAdd = () => {
    if (!product) return;
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

  const handleRemove = () => {
    if (productId) {
      removeItem(productId);
    }
  };

  const handleShare = async () => {
    if (navigator.share && product) {
      try {
        await navigator.share({
          title: name,
          text: description || '',
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled or share failed
      }
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <PageContainer className="pb-32">
          <Skeleton className="aspect-square w-full rounded-2xl mb-4" />
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-4" />
          <Skeleton className="h-20 w-full" />
        </PageContainer>
      </AppLayout>
    );
  }

  if (!product) {
    return (
      <AppLayout>
        <PageContainer>
          <div className="flex flex-col items-center justify-center py-20">
            <Package className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {language === 'ru' ? 'Товар не найден' : 'Product not found'}
            </h2>
            <Button onClick={() => navigate('/market')}>
              {language === 'ru' ? 'Вернуться в маркет' : 'Back to Market'}
            </Button>
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageContainer className="pb-40 px-0">
        {/* Image Gallery */}
        <div className="relative aspect-square bg-muted">
          <img
            src={images[currentImageIndex]}
            alt={name}
            className="w-full h-full object-cover"
          />
          
          {/* Overlay Header with DetailPageHeader */}
          <DetailPageHeader 
            fallbackPath="/market"
            onShare={handleShare}
            actions={<WishlistButton productId={productId!} />}
          />
          
          {/* Gallery navigation */}
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-lg"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-lg"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              
              {/* Dots indicator */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-colors",
                      index === currentImageIndex ? "bg-primary" : "bg-background/60"
                    )}
                  />
                ))}
              </div>
            </>
          )}
          
          {/* Badges */}
          <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
            {product.is_shippable_international && (
              <Badge className="bg-info text-white text-xs font-semibold px-2.5 py-1 shadow-lg">
                <Plane className="w-3 h-3 mr-1" />
                {language === 'ru' ? 'Доставка домой' : 'Ship Home'}
              </Badge>
            )}
            {product.is_new && (
              <Badge className="bg-info text-white text-xs font-semibold px-2.5 py-1 shadow-lg">
                NEW
              </Badge>
            )}
            {product.is_popular && (
              <Badge className="bg-gradient-to-r from-warning to-warning text-white text-xs font-semibold px-2.5 py-1 shadow-lg">
                🔥 BESTSELLER
              </Badge>
            )}
            {discount > 0 && (
              <Badge className="bg-destructive text-white text-xs font-bold px-2.5 py-1 shadow-lg">
                -{discount}%
              </Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-4 pt-4">
          {/* Vendor */}
          {vendorName && (
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">
              {vendorName}
            </p>
          )}
          
          {/* Title */}
          <h1 className="text-xl font-bold text-foreground mb-2">{name}</h1>
          
          {/* Rating */}
          {product.rating && (
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1 bg-warning/10 px-2 py-1 rounded-full">
                <Star className="w-4 h-4 fill-warning text-warning" />
                <span className="text-sm font-semibold text-warning">
                  {product.rating}
                </span>
              </div>
              {product.review_count && (
                <span className="text-sm text-muted-foreground">
                  {product.review_count} {language === 'ru' ? 'отзывов' : 'reviews'}
                </span>
              )}
            </div>
          )}
          
          {/* Price */}
          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-2xl font-bold text-foreground">
              ฿{product.price.toLocaleString()}
            </span>
            {product.original_price && (
              <span className="text-lg text-muted-foreground line-through">
                ฿{product.original_price.toLocaleString()}
              </span>
            )}
            {unitDisplay && (
              <span className="text-sm text-muted-foreground">/ {unitDisplay}</span>
            )}
            {pricePerUnit && (
              <span className="text-xs text-muted-foreground ml-2">({pricePerUnit})</span>
            )}
          </div>

          {/* Product Specifications */}
          {(product.unit_value || product.weight_kg) && (
            <div className="bg-muted/30 rounded-xl p-4 mb-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Ruler className="h-4 w-4" />
                {language === 'ru' ? 'Характеристики' : 'Specifications'}
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {unitDisplay && (
                  <div className="flex items-center gap-2">
                    <Scale className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{language === 'ru' ? 'Объём:' : 'Size:'}</span>
                    <span className="font-medium">{unitDisplay}</span>
                  </div>
                )}
                {product.weight_kg && (
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{language === 'ru' ? 'Вес:' : 'Weight:'}</span>
                    <span className="font-medium">{product.weight_kg} {language === 'ru' ? 'кг' : 'kg'}</span>
                  </div>
                )}
                {pricePerUnit && (
                  <div className="flex items-center gap-2 col-span-2">
                    <span className="text-muted-foreground">{language === 'ru' ? 'Цена за ед.:' : 'Price per unit:'}</span>
                    <span className="font-medium">{pricePerUnit}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Vendor Info Card */}
          {(vendor || vendorLoading) && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3">
                {language === 'ru' ? 'Продавец' : 'Seller'}
              </h3>
              <VendorInfo vendor={vendor} isLoading={vendorLoading} />
            </div>
          )}
          
          {/* Description */}
          {description && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">
                {language === 'ru' ? 'Описание' : 'Description'}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {description}
              </p>
            </div>
          )}

          {/* Product Attributes/Specifications */}
          <div className="mb-6">
            <ProductAttributes productId={productId!} />
          </div>
          
          {/* Features */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {language === 'ru' ? 'Доставка' : 'Delivery'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {language === 'ru' ? 'от 1 часа' : 'from 1 hour'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
              <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {language === 'ru' ? 'Гарантия' : 'Guarantee'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {language === 'ru' ? 'Качество' : 'Quality'}
                </p>
              </div>
            </div>
            
            {product.is_shippable_international && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 col-span-2">
                <div className="w-10 h-10 rounded-full bg-info/10 flex items-center justify-center">
                  <Plane className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {language === 'ru' ? 'Международная доставка' : 'International Shipping'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {language === 'ru' ? 'Отправим домой в любую страну' : 'We ship worldwide'}
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Weight info for international - moved to specifications section */}
          
          {/* Reviews Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">
              {language === 'ru' ? 'Отзывы покупателей' : 'Customer Reviews'}
            </h3>
            <ReviewList 
              productId={productId!} 
              onWriteReview={() => setShowReviewForm(true)} 
            />
          </div>
        </div>

        {/* Review Form Dialog */}
        <ReviewForm
          productId={productId!}
          productName={name}
          isOpen={showReviewForm}
          onClose={() => setShowReviewForm(false)}
          onSuccess={() => {
            // Refresh reviews would happen automatically via re-render
          }}
        />

        {/* Fixed Bottom Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 z-50">
          <div className="max-w-lg mx-auto flex items-center gap-3">
            {/* Price */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold">฿{product.price.toLocaleString()}</span>
                {product.original_price && (
                  <span className="text-xs text-muted-foreground line-through">
                    ฿{product.original_price.toLocaleString()}
                  </span>
                )}
              </div>
              {unitDisplay && <span className="text-xs text-muted-foreground">{unitDisplay}</span>}
            </div>
            
            {/* Cart Controls */}
            {quantity === 0 ? (
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  size="lg" 
                  className="gap-2 rounded-full"
                  onClick={handleAdd}
                >
                  <ShoppingBag className="h-5 w-5" />
                  <span className="hidden sm:inline">{language === 'ru' ? 'В корзину' : 'Cart'}</span>
                </Button>
                <Button 
                  size="lg" 
                  className="gap-2 rounded-full bg-gradient-to-r from-primary to-primary/80"
                  onClick={() => buyNow(product as MarketplaceProduct)}
                >
                  <Zap className="h-5 w-5" />
                  {language === 'ru' ? 'Купить' : 'Buy Now'}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-primary/10 rounded-full px-3 py-1.5">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8 rounded-full hover:bg-primary/20"
                    onClick={handleRemove}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-base font-bold w-6 text-center">{quantity}</span>
                  <Button 
                    size="icon" 
                    className="h-8 w-8 rounded-full"
                    onClick={handleAdd}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <Button 
                  size="lg" 
                  className="gap-2 rounded-full bg-gradient-to-r from-primary to-primary/80"
                  onClick={() => buyNow(product as MarketplaceProduct)}
                >
                  <Zap className="h-5 w-5" />
                  {language === 'ru' ? 'Купить' : 'Buy'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </PageContainer>
      <MarketComingSoonOverlay />
    </AppLayout>
  );
};

export default ProductDetailPage;
