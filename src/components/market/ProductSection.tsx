import React, { forwardRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Sparkles, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useCartToast } from '@/hooks/useCartToast';
import { MarketplaceProduct } from '@/types/marketplace';
import { ProfessionalProductCard } from './ProfessionalProductCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { useState, useEffect } from 'react';

interface ProductSectionProps {
  title: string;
  titleRu: string;
  products: MarketplaceProduct[];
  seeAllPath?: string;
  maxItems?: number;
  variant?: 'scroll' | 'grid';
  isLoading?: boolean;
  icon?: 'sparkles' | 'trending';
}

function useDotButton(emblaApi: ReturnType<typeof useEmblaCarousel>[1]) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    setScrollSnaps(emblaApi.scrollSnapList());
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', () => {
      setScrollSnaps(emblaApi.scrollSnapList());
      onSelect();
    });
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  return { selectedIndex, scrollSnaps };
}

export const ProductSection = forwardRef<HTMLElement, ProductSectionProps>(function ProductSection({
  title,
  titleRu,
  products,
  seeAllPath,
  maxItems = 6,
  variant = 'scroll',
  isLoading = false,
  icon,
}, ref) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { addItem, removeItem, getItemsByType } = useCart();
  const { showAddedToast } = useCartToast();

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: 'start', skipSnaps: false, slidesToScroll: 1 },
    [Autoplay({ delay: 3500, stopOnInteraction: true, stopOnMouseEnter: true })]
  );

  const { selectedIndex, scrollSnaps } = useDotButton(emblaApi);

  const displayProducts = products.slice(0, maxItems);
  const cartItems = getItemsByType('product');

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

  if (isLoading) {
    return (
      <section className="space-y-4">
        <div className="h-7 w-40 bg-muted rounded-lg animate-pulse" />
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-[170px] shrink-0">
              <div className="aspect-square bg-muted rounded-2xl mb-3 animate-pulse" />
              <div className="h-4 bg-muted rounded w-3/4 mb-2 animate-pulse" />
              <div className="h-5 bg-muted rounded w-1/2 animate-pulse" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (displayProducts.length === 0) return null;

  const IconComponent = icon === 'sparkles' ? Sparkles : icon === 'trending' ? TrendingUp : null;

  return (
    <section ref={ref} className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {IconComponent && (
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <IconComponent className="w-4 h-4 text-primary" />
            </div>
          )}
          <h2 className="text-lg font-bold text-foreground">
            {language === 'ru' ? titleRu : title}
          </h2>
        </div>
        {seeAllPath && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary hover:text-primary/80 font-medium -mr-2"
            onClick={() => navigate(seeAllPath)}
          >
            {language === 'ru' ? 'Все' : 'See all'}
            <ChevronRight className="w-4 h-4 ml-0.5" />
          </Button>
        )}
      </div>

      {/* Products */}
      {variant === 'scroll' ? (
        <div className="space-y-3">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-3">
              {displayProducts.map((product) => (
                <div 
                  key={product.id} 
                  className="shrink-0 min-w-0 basis-[160px] sm:basis-[180px] lg:basis-[200px] xl:basis-[220px]"
                >
                  <ProfessionalProductCard
                    product={product}
                    quantity={getQuantity(product.id)}
                    onAdd={() => handleAdd(product)}
                    onRemove={() => handleRemove(product.id)}
                    onClick={() => navigate(`/market/product/${product.id}`)}
                    variant="grid"
                  />
                </div>
              ))}
            </div>
          </div>
          
          {/* Dot indicators */}
          {scrollSnaps.length > 1 && (
            <div className="flex justify-center gap-1.5">
              {scrollSnaps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => emblaApi?.scrollTo(index)}
                  className={cn(
                    "rounded-full transition-all duration-300",
                    index === selectedIndex
                      ? "w-5 h-2 bg-primary"
                      : "w-2 h-2 bg-muted-foreground/25 hover:bg-muted-foreground/40"
                  )}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {displayProducts.map(product => (
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
      )}
    </section>
  );
});