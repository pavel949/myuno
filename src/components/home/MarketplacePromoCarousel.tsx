import { useRef, useState, useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, ShoppingCart, Star } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMarketplaceProducts } from '@/hooks/useMarketplace';
import { useCart } from '@/contexts/CartContext';
import { useCartToast } from '@/hooks/useCartToast';
import { cn } from '@/lib/utils';

export const MarketplacePromoCarousel = memo(function MarketplacePromoCarousel() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const { products, isLoading } = useMarketplaceProducts({ popularOnly: true, limit: 8 });
  const { addItem, items, updateQuantity } = useCart();
  const { showAddedToast } = useCartToast();

  const getQuantity = useCallback((productId: string) => {
    const item = items.find(i => i.id === productId);
    return item?.quantity || 0;
  }, [items]);

  const handleAdd = useCallback((product: typeof products[0]) => {
    const existingItem = items.find(i => i.id === product.id);
    if (existingItem) {
      updateQuantity(existingItem.id, existingItem.quantity + 1);
    } else {
      const newItem = {
        id: product.id,
        type: 'product' as const,
        name: product.name_en,
        nameRu: product.name_ru,
        price: product.price,
        currency: product.currency,
        image: product.cover_image || undefined,
      };
      addItem(newItem);
      showAddedToast({ item: newItem });
    }
  }, [items, addItem, updateQuantity, showAddedToast]);

  const checkScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  }, []);

  useEffect(() => {
    checkScroll();
  }, [products, checkScroll]);

  const scroll = useCallback((direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 180;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-6 w-40 bg-muted rounded animate-pulse" />
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-36 h-48 rounded-xl bg-muted animate-pulse flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className="relative -mx-4 px-4 py-5 bg-gradient-to-br from-emerald-50/80 via-teal-50/40 to-transparent dark:from-emerald-950/20 dark:via-teal-950/10 dark:to-transparent rounded-3xl space-y-3">
      {/* Header with gradient accent */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
            <ShoppingCart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {language === 'ru' ? 'Свежие продукты' : 'Fresh Products'}
            </h2>
            <p className="text-xs text-muted-foreground">
              {language === 'ru' ? 'Доставка до двери' : 'Delivered to your door'}
            </p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/market')}
          className="text-sm text-primary flex items-center gap-1 hover:underline font-semibold"
        >
          {language === 'ru' ? 'В магазин' : 'Shop'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Carousel container */}
      <div className="relative group">
        {/* Scroll buttons */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-background/95 border border-border shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-background/95 border border-border shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* Scrollable content */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 touch-pan-x"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {products.map((product, index) => {
            const quantity = getQuantity(product.id);
            const hasDiscount = product.original_price && product.original_price > product.price;
            const discountPercent = hasDiscount 
              ? Math.round((1 - product.price / product.original_price!) * 100)
              : 0;
            const isHero = index === 0;

            return (
              <div
                key={product.id}
                className={cn(
                  "flex-shrink-0 rounded-2xl overflow-hidden bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all group/card touch-manipulation",
                  isHero ? "w-44" : "w-36"
                )}
                style={{ scrollSnapAlign: 'start' }}
              >
                {/* Image with click handler */}
                <button
                  onClick={() => navigate(`/market/product/${product.id}`)}
                  className="relative w-full h-28 overflow-hidden block"
                >
                  <img
                    src={product.cover_image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300'}
                    alt={language === 'ru' ? product.name_ru : product.name_en}
                    className="w-full h-full object-cover group-hover/card:scale-[1.03] transition-transform duration-300"
                    loading="lazy"
                  />
                  
                  {/* Badges */}
                  <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
                    {isHero && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 shadow-sm">
                        {language === 'ru' ? 'ХИТ' : 'HOT'}
                      </span>
                    )}
                    {product.is_new && !isHero && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white bg-blue-500 uppercase">
                        NEW
                      </span>
                    )}
                    {hasDiscount && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white bg-red-500">
                        -{discountPercent}%
                      </span>
                    )}
                  </div>

                  {/* Rating */}
                  {product.rating && product.rating > 0 && (
                    <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 bg-black/60 backdrop-blur-sm rounded px-1 py-0.5">
                      <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                      <span className="text-[10px] text-white font-medium">{product.rating.toFixed(1)}</span>
                    </div>
                  )}
                </button>

                {/* Content */}
                <div className="p-2 space-y-1.5">
                  <button
                    onClick={() => navigate(`/market/product/${product.id}`)}
                    className="text-left w-full"
                  >
                    <h3 className="font-medium text-xs text-foreground line-clamp-2 leading-tight min-h-[2rem]">
                      {language === 'ru' ? product.name_ru : product.name_en}
                    </h3>
                  </button>

                  {/* Price row */}
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-foreground">
                      ฿{product.price.toLocaleString()}
                    </span>
                    {hasDiscount && (
                      <span className="text-[10px] text-muted-foreground line-through">
                        ฿{product.original_price!.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* Unit info */}
                  <p className="text-[10px] text-muted-foreground">
                    {product.unit_value && product.unit_measure 
                      ? `${product.unit_value} ${product.unit_measure}`
                      : (language === 'ru' ? product.unit_ru : product.unit)
                    }
                  </p>

                  {/* Add to cart button */}
                  {quantity === 0 ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleAdd(product); }}
                      className={cn(
                        "w-full py-1.5 rounded-lg text-xs font-medium transition-colors",
                        "bg-primary text-primary-foreground hover:bg-primary/90",
                        "flex items-center justify-center gap-1"
                      )}
                    >
                      <ShoppingCart className="w-3 h-3" />
                      {language === 'ru' ? 'В корзину' : 'Add'}
                    </button>
                  ) : (
                    <div className="flex items-center justify-center gap-2 py-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const item = items.find(i => i.id === product.id);
                          if (item && item.quantity > 1) {
                            updateQuantity(item.id, item.quantity - 1);
                          } else if (item) {
                            updateQuantity(item.id, 0);
                          }
                        }}
                        className="w-6 h-6 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80"
                      >
                        <span className="text-sm font-medium">−</span>
                      </button>
                      <span className="text-sm font-semibold min-w-[1.5rem] text-center">{quantity}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAdd(product); }}
                        className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90"
                      >
                        <span className="text-sm font-medium">+</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
