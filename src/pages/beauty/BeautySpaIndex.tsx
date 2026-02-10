/**
 * BeautySpaIndex — Airbnb-style beauty & spa catalog
 */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scissors, Star, MapPin, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useSalons } from '@/hooks/useSalons';
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/uno/BackButton';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/uno/EmptyState';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { matchesPriceLevel, isOpenNow } from '@/lib/filterUtils';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { id: 'all', labelEn: 'All', labelRu: 'Все' },
  { id: 'spa', labelEn: 'Spa', labelRu: 'Спа' },
  { id: 'massage', labelEn: 'Massage', labelRu: 'Массаж' },
  { id: 'beauty_salon', labelEn: 'Beauty', labelRu: 'Красота' },
  { id: 'hair_salon', labelEn: 'Hair', labelRu: 'Волосы' },
  { id: 'nail_salon', labelEn: 'Nails', labelRu: 'Ногти' },
  { id: 'barber', labelEn: 'Barber', labelRu: 'Барбер' },
];

export default function BeautySpaIndex() {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const isRu = language === 'ru';

  const { salons, isLoading } = useSalons(selectedCategory === 'all' ? undefined : selectedCategory);

  const filteredSalons = useMemo(() => {
    if (!searchQuery) return salons;
    return salons.filter(s => {
      const name = isRu ? s.name_ru : s.name_en;
      return name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [salons, searchQuery, isRu]);

  return (
    <AppLayout showHeader={false} showBottomNav>
      {/* Sticky header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <BackButton fallbackPath="/discover" variant="ghost" size="sm" />
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate">{isRu ? 'Красота и СПА' : 'Beauty & Spa'}</h1>
            <p className="text-xs text-muted-foreground">{filteredSalons.length} {isRu ? 'салонов' : 'salons'}</p>
          </div>
        </div>

        {/* Category ribbon */}
        <div className="max-w-7xl mx-auto px-4 pb-2.5 flex gap-2 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map(cat => (
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
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[4/3] rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredSalons.length === 0 ? (
          <EmptyState
            icon={Scissors}
            title={isRu ? 'Салоны не найдены' : 'No salons found'}
            description={isRu ? 'Попробуйте изменить фильтры' : 'Try adjusting your filters'}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredSalons.map(salon => {
              const name = isRu ? salon.name_ru : salon.name_en;
              const isOpen = isOpenNow(salon.working_hours);
              return (
                <div
                  key={salon.id}
                  className="cursor-pointer group"
                  onClick={() => navigate(`/beauty/salon/${salon.id}`)}
                >
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-2">
                    <OptimizedImage
                      src={salon.cover_image || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400'}
                      alt={name}
                      width={400}
                      height={300}
                      className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                      quality={80}
                    />
                    {salon.is_featured && (
                      <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px]">
                        {isRu ? 'Топ' : 'Featured'}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="font-semibold text-sm truncate">{name}</h3>
                      {salon.rating > 0 && (
                        <span className="flex items-center gap-0.5 text-xs font-medium shrink-0">
                          <Star className="w-3 h-3 fill-foreground" />
                          {salon.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                    {(salon.services || []).length > 0 && (
                      <p className="text-xs text-muted-foreground truncate">
                        {salon.services!.slice(0, 3).join(' · ')}
                      </p>
                    )}
                    {salon.district && (
                      <p className="text-xs text-muted-foreground flex items-center gap-0.5">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {salon.district}
                      </p>
                    )}
                    <p className="text-sm font-semibold">
                      {salon.price_from ? `${isRu ? 'от' : 'from'} ${formatPrice(salon.price_from)}` : ''}
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
