/**
 * FlowersIndex — Airbnb-style flower delivery catalog
 */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flower2, Star, ShoppingCart, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useCart } from '@/contexts/CartContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/uno/BackButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/uno/EmptyState';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { useBouquets } from '@/hooks/useBouquets';
import { useFlowerFilterOptions } from '@/hooks/useDynamicFilterOptions';
import { cn } from '@/lib/utils';

export default function FlowersIndex() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { getItemsByType } = useCart();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const isRu = language === 'ru';

  const { categoryRibbon, isLoading: filtersLoading } = useFlowerFilterOptions();
  const categories = useMemo(() => categoryRibbon.map(opt => ({
    id: opt.id,
    labelEn: opt.labelEn,
    labelRu: opt.labelRu,
  })), [categoryRibbon]);

  const { bouquets, isLoading } = useBouquets({
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    onlyActive: true,
  });

  const filteredBouquets = useMemo(() => {
    if (!searchQuery) return bouquets;
    return bouquets.filter(b => {
      const name = isRu ? b.name_ru : b.name_en;
      return name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [bouquets, searchQuery, isRu]);

  const flowersInCart = getItemsByType('flowers');
  const totalItems = flowersInCart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <AppLayout showHeader={false} showBottomNav={false}>
      {/* Sticky header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <BackButton fallbackPath="/discover" variant="ghost" size="sm" />
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate">{isRu ? 'Доставка цветов' : 'Flower Delivery'}</h1>
            <p className="text-xs text-muted-foreground">{filteredBouquets.length} {isRu ? 'букетов' : 'bouquets'}</p>
          </div>
          {totalItems > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 relative"
              onClick={() => navigate('/cart')}
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            </Button>
          )}
        </div>

        {/* Category ribbon */}
        <div className="max-w-7xl mx-auto px-4 pb-2.5 flex gap-2 overflow-x-auto scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border",
                selectedCategory === cat.id
                  ? "bg-foreground text-background border-foreground"
                  : "bg-secondary text-foreground border-border hover:border-foreground/30"
              )}
            >
              {isRu ? cat.labelRu : cat.labelEn}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-4 pb-24">
        {isLoading || filtersLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[3/4] rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredBouquets.length === 0 ? (
          <EmptyState
            icon={Flower2}
            title={isRu ? 'Букеты не найдены' : 'No bouquets found'}
            description={isRu ? 'Попробуйте изменить фильтры' : 'Try adjusting your filters'}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredBouquets.map(bouquet => {
              const name = isRu ? bouquet.name_ru : bouquet.name_en;
              const hasVariants = bouquet.size_variants?.length;
              const displayPrice = hasVariants
                ? (bouquet.size_variants as any[])[0]?.price || bouquet.price
                : bouquet.price;
              return (
                <div
                  key={bouquet.id}
                  className="cursor-pointer group"
                  onClick={() => navigate(`/flowers/bouquet/${bouquet.id}`)}
                >
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-2">
                    <OptimizedImage
                      src={bouquet.image || 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=400'}
                      alt={name}
                      width={400}
                      height={533}
                      className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                      quality={80}
                    />
                    {bouquet.is_popular && (
                      <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px]">
                        {isRu ? 'Хит' : 'Popular'}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="font-semibold text-sm truncate">{name}</h3>
                    <p className="text-sm font-semibold">
                      {hasVariants ? `${isRu ? 'от' : 'from'} ` : ''}{formatPrice(displayPrice)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
