import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  ShoppingBag, 
  Share2, 
  Star, 
  Truck, 
  Shield, 
  Plane,
  Plus,
  Minus,
  Package
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
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
import { cn } from '@/lib/utils';

const ProductDetailPage = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { addItem, removeItem, getItemsByType } = useCart();
  const { showAddedToast } = useCartToast();
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
  const unit = product ? (language === 'ru' ? product.unit_ru : product.unit) : '';
  const vendorName = product ? (language === 'ru' ? (product.vendor_name_ru || product.vendor_name) : product.vendor_name) : '';

  // Create image gallery (cover + additional images if available)
  const images = useMemo(() => {
    if (!product) return [];
    const gallery = product.cover_image ? [product.cover_image] : ['/placeholder.svg'];
    // Add placeholder images for gallery effect (in real app, these would come from product.images array)
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
          
          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-lg"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          {/* Action buttons */}
          <div className="absolute top-4 right-4 flex gap-2">
            <WishlistButton productId={productId!} />
            <button
              onClick={handleShare}
              className="w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-lg"
            >
              <Share2 className="h-5 w-5" />
            </button>
          </div>
          
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
              <Badge className="bg-sky-500 text-white text-xs font-semibold px-2.5 py-1 shadow-lg">
                <Plane className="w-3 h-3 mr-1" />
                {language === 'ru' ? 'Доставка домой' : 'Ship Home'}
              </Badge>
            )}
            {product.is_new && (
              <Badge className="bg-blue-500 text-white text-xs font-semibold px-2.5 py-1 shadow-lg">
                NEW
              </Badge>
            )}
            {product.is_popular && (
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold px-2.5 py-1 shadow-lg">
                🔥 BESTSELLER
              </Badge>
            )}
            {discount > 0 && (
              <Badge className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 shadow-lg">
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
              <div className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-full">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
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
            {unit && (
              <span className="text-sm text-muted-foreground">/ {unit}</span>
            )}
          </div>

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
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-green-500" />
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
                <div className="w-10 h-10 rounded-full bg-sky-500/10 flex items-center justify-center">
                  <Plane className="h-5 w-5 text-sky-500" />
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
          
          {/* Weight info for international */}
          {product.weight_kg && (
            <div className="text-sm text-muted-foreground mb-6">
              <span className="font-medium">{language === 'ru' ? 'Вес: ' : 'Weight: '}</span>
              {product.weight_kg} {language === 'ru' ? 'кг' : 'kg'}
            </div>
          )}

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
          <div className="max-w-lg mx-auto flex items-center gap-4">
            {/* Price */}
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold">฿{product.price.toLocaleString()}</span>
                {product.original_price && (
                  <span className="text-sm text-muted-foreground line-through">
                    ฿{product.original_price.toLocaleString()}
                  </span>
                )}
              </div>
              {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
            </div>
            
            {/* Cart Controls */}
            {quantity === 0 ? (
              <Button 
                size="lg" 
                className="gap-2 rounded-full px-8"
                onClick={handleAdd}
              >
                <ShoppingBag className="h-5 w-5" />
                {language === 'ru' ? 'В корзину' : 'Add to Cart'}
              </Button>
            ) : (
              <div className="flex items-center gap-3 bg-primary/10 rounded-full px-4 py-2">
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-10 w-10 rounded-full hover:bg-primary/20"
                  onClick={handleRemove}
                >
                  <Minus className="h-5 w-5" />
                </Button>
                <span className="text-lg font-bold w-8 text-center">{quantity}</span>
                <Button 
                  size="icon" 
                  className="h-10 w-10 rounded-full"
                  onClick={handleAdd}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </PageContainer>
    </AppLayout>
  );
};

export default ProductDetailPage;
