import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  Star, 
  CheckCircle, 
  Phone, 
  Mail, 
  Globe, 
  MapPin,
  Store,
  Package,
  Share2
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { StickyCartBar } from '@/components/cart/StickyCartBar';
import { ProductCard } from '@/components/market/ProductCard';
import { useVendor, useVendorProducts } from '@/hooks/useMarketplaceVendors';
import { useCartToast } from '@/hooks/useCartToast';
import { MarketComingSoonOverlay } from '@/components/market/MarketComingSoonOverlay';

const VendorPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { addItem, removeItem, getItemsByType } = useCart();
  const { showAddedToast } = useCartToast();
  
  const { vendor, isLoading: vendorLoading } = useVendor(slug);
  const { products, isLoading: productsLoading } = useVendorProducts(vendor?.id);
  const cartItems = getItemsByType('product');

  const name = vendor ? (language === 'ru' ? vendor.name_ru : vendor.name_en) : '';
  const description = vendor 
    ? (language === 'ru' ? (vendor.description_ru || vendor.description_en) : (vendor.description_en || vendor.description_ru))
    : '';
  const address = vendor 
    ? (language === 'ru' ? (vendor.address_ru || vendor.address) : vendor.address)
    : '';

  const handleShare = async () => {
    if (navigator.share && vendor) {
      try {
        await navigator.share({
          title: name,
          text: description || '',
          url: window.location.href,
        });
      } catch {
        // User cancelled
      }
    }
  };

  if (vendorLoading) {
    return (
      <AppLayout>
        <PageContainer className="pb-32 px-0">
          <Skeleton className="h-40 w-full" />
          <div className="px-4 pt-4">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-32 mb-4" />
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-xl" />
              ))}
            </div>
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  if (!vendor) {
    return (
      <AppLayout>
        <PageContainer>
          <div className="flex flex-col items-center justify-center py-20">
            <Store className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {language === 'ru' ? 'Продавец не найден' : 'Vendor not found'}
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
      <PageContainer className="pb-32 px-0">
        {/* Hero Banner */}
        <div className="relative h-36 bg-gradient-to-br from-primary/30 via-primary/20 to-primary/5">
          {vendor.cover_image && (
            <img 
              src={vendor.cover_image} 
              alt={name}
              className="w-full h-full object-cover"
            />
          )}
          
          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-lg"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* Share button */}
          <button
            onClick={handleShare}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-lg"
          >
            <Share2 className="h-5 w-5" />
          </button>

          {/* Logo */}
          <div className="absolute -bottom-8 left-4">
            <div className="w-20 h-20 rounded-2xl bg-background border-4 border-background shadow-xl flex items-center justify-center overflow-hidden">
              {vendor.logo_url ? (
                <img src={vendor.logo_url} alt={name} className="w-full h-full object-cover" />
              ) : (
                <Store className="w-10 h-10 text-muted-foreground" />
              )}
            </div>
          </div>
        </div>

        {/* Vendor Info */}
        <div className="px-4 pt-12">
          {/* Name and Verified */}
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-foreground">{name}</h1>
            {vendor.verified && (
              <Badge className="bg-primary/10 text-primary gap-1">
                <CheckCircle className="w-3.5 h-3.5" fill="currentColor" />
                {language === 'ru' ? 'Проверен' : 'Verified'}
              </Badge>
            )}
          </div>

          {/* Rating */}
          <div className="flex items-center gap-3 mb-4">
            {vendor.rating && (
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 px-2.5 py-1 rounded-full">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                  <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                    {vendor.rating}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  ({vendor.review_count} {language === 'ru' ? 'отзывов' : 'reviews'})
                </span>
              </div>
            )}
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Package className="w-4 h-4" />
              <span>{products.length} {language === 'ru' ? 'товаров' : 'products'}</span>
            </div>
          </div>

          {/* Description */}
          {description && (
            <p className="text-muted-foreground mb-6">{description}</p>
          )}

          {/* Contact Info */}
          {(vendor.phone || vendor.email || vendor.website || address) && (
            <Card className="mb-6 border-border/50">
              <CardContent className="p-4 space-y-3">
                {vendor.phone && (
                  <a 
                    href={`tel:${vendor.phone}`}
                    className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Phone className="w-4 h-4 text-primary" />
                    </div>
                    <span>{vendor.phone}</span>
                  </a>
                )}
                {vendor.email && (
                  <a 
                    href={`mailto:${vendor.email}`}
                    className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Mail className="w-4 h-4 text-primary" />
                    </div>
                    <span>{vendor.email}</span>
                  </a>
                )}
                {vendor.website && (
                  <a 
                    href={vendor.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Globe className="w-4 h-4 text-primary" />
                    </div>
                    <span>{vendor.website}</span>
                  </a>
                )}
                {address && (
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <span>{address}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Products Section */}
          <div>
            <h2 className="text-lg font-semibold mb-4">
              {language === 'ru' ? 'Товары продавца' : 'Products'}
            </h2>

            {productsLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-xl" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{language === 'ru' ? 'Нет товаров' : 'No products'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {products.map((product) => {
                  const quantity = cartItems.find(i => i.id === product.id)?.quantity || 0;
                  
                  const handleAdd = () => {
                    const item = {
                      id: product.id,
                      type: 'product' as const,
                      name: product.name_en,
                      nameRu: product.name_ru,
                      price: product.price,
                      currency: '฿',
                      image: product.cover_image || undefined,
                      providerId: 'marketplace',
                      providerName: vendor?.name_en || 'myUNO Market',
                      providerNameRu: vendor?.name_ru || 'myUNO Маркет',
                    };
                    addItem(item);
                    showAddedToast({ item, cartPath: '/market/checkout' });
                  };
                  
                  const handleRemove = () => {
                    removeItem(product.id);
                  };

                  return (
                    <ProductCard 
                      key={product.id} 
                      product={product}
                      quantity={quantity}
                      onAdd={handleAdd}
                      onRemove={handleRemove}
                      onClick={() => navigate(`/market/product/${product.id}`)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <StickyCartBar checkoutPath="/market/checkout" itemType="product" />
      </PageContainer>
      <MarketComingSoonOverlay />
    </AppLayout>
  );
};

export default VendorPage;
