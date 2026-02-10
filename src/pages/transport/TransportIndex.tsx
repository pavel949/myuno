/**
 * TransportIndex — Airbnb-style vehicle catalog
 * Clean header, category pills, sort, responsive grid
 */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, SlidersHorizontal, MapPin, Loader2, Plane, Bike } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/uno/BackButton';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/uno/EmptyState';
import { CrossSellSection } from '@/components/crosssell';
import { useVehicles } from '@/hooks/useVehicles';
import { normalizeVehicleType } from '@/lib/taxonomies';
import { mapVehicleToCardProps } from '@/lib/adapters/vehicleAdapters';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { cn } from '@/lib/utils';

type SortKey = 'price_asc' | 'price_desc' | 'rating';

const CATEGORIES = [
  { id: 'all', labelEn: 'All', labelRu: 'Все' },
  { id: 'car', labelEn: 'Cars', labelRu: 'Авто' },
  { id: 'suv', labelEn: 'SUV', labelRu: 'Внедорожники' },
  { id: 'motorcycle', labelEn: 'Moto', labelRu: 'Мото' },
  { id: 'scooter', labelEn: 'Scooters', labelRu: 'Скутеры' },
];

const QUICK_LINKS = [
  { id: 'taxi', labelEn: 'Taxi', labelRu: 'Такси', path: '/transport/taxi', icon: Car },
  { id: 'airport', labelEn: 'Airport Transfer', labelRu: 'Трансфер', path: '/transport/airport-transfer', icon: Plane },
  { id: 'bikes', labelEn: 'Bikes', labelRu: 'Велосипеды', path: '/transport', icon: Bike },
];

const SORT_OPTIONS: { id: SortKey; labelEn: string; labelRu: string }[] = [
  { id: 'price_asc', labelEn: 'Price ↑', labelRu: 'Цена ↑' },
  { id: 'price_desc', labelEn: 'Price ↓', labelRu: 'Цена ↓' },
  { id: 'rating', labelEn: 'Top Rated', labelRu: 'Рейтинг' },
];

export default function TransportIndex() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const { vehicles, isLoading } = useVehicles();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('price_asc');
  const [showSort, setShowSort] = useState(false);

  const filtered = useMemo(() => {
    let results = vehicles.filter(v => {
      if (selectedCategory === 'all') return true;
      return normalizeVehicleType(v.vehicle_type) === selectedCategory;
    });

    results.sort((a, b) => {
      switch (sortKey) {
        case 'price_asc': return (a.price_per_day || 0) - (b.price_per_day || 0);
        case 'price_desc': return (b.price_per_day || 0) - (a.price_per_day || 0);
        case 'rating': return (b.rating || 0) - (a.rating || 0);
        default: return 0;
      }
    });

    return results;
  }, [vehicles, selectedCategory, sortKey]);

  return (
    <AppLayout showHeader={false} showBottomNav>
      <div className="min-h-screen bg-background">
        {/* Sticky Header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b space-y-3 pb-3">
          <div className="container max-w-7xl mx-auto px-4 pt-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <BackButton fallbackPath="/" variant="ghost" size="sm" />
                <h1 className="text-lg font-bold truncate">
                  {isRu ? 'Транспорт' : 'Transport'}
                </h1>
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div className="container max-w-7xl mx-auto px-4">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {QUICK_LINKS.map(link => (
                <button
                  key={link.id}
                  onClick={() => navigate(link.path)}
                  className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-card hover:border-foreground/30 transition-colors"
                >
                  <link.icon className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium whitespace-nowrap">{isRu ? link.labelRu : link.labelEn}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Category pills */}
          <div className="container max-w-7xl mx-auto px-4">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap",
                    selectedCategory === cat.id
                      ? "bg-foreground text-background border-foreground"
                      : "bg-background text-foreground border-border hover:border-foreground/50"
                  )}
                >
                  {isRu ? cat.labelRu : cat.labelEn}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Results count + sort */}
        <div className="container max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {filtered.length} {isRu ? 'вариантов' : 'options'}
            </p>
            <div className="relative">
              <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => setShowSort(!showSort)}>
                <SlidersHorizontal className="w-3.5 h-3.5" />
                {isRu ? SORT_OPTIONS.find(s => s.id === sortKey)?.labelRu : SORT_OPTIONS.find(s => s.id === sortKey)?.labelEn}
              </Button>
              {showSort && (
                <div className="absolute right-0 top-full mt-1 z-20 bg-popover border rounded-xl shadow-lg py-1 min-w-[160px]">
                  {SORT_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors",
                        sortKey === opt.id && "text-primary font-medium"
                      )}
                      onClick={() => { setSortKey(opt.id); setShowSort(false); }}
                    >
                      {isRu ? opt.labelRu : opt.labelEn}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Grid */}
        <main className="container max-w-7xl mx-auto px-4 pb-24">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-6">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-[4/3] rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Car}
              title={isRu ? 'Транспорт не найден' : 'No vehicles found'}
              description={isRu ? 'Попробуйте изменить фильтры' : 'Try adjusting your filters'}
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-6">
              {filtered.map((vehicle) => {
                const card = mapVehicleToCardProps(vehicle, language);
                return (
                  <div
                    key={vehicle.id}
                    className="cursor-pointer group"
                    onClick={() => navigate(`/transport/vehicle/${vehicle.id}`)}
                  >
                    <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-2">
                      <OptimizedImage
                        src={card.image || ''}
                        alt={card.title}
                        width={400}
                        height={300}
                        className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                        quality={80}
                      />
                      {card.isVerified && (
                        <span className="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px] font-medium px-2 py-0.5 rounded-full">
                          ✓ {isRu ? 'Проверено' : 'Verified'}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {card.rating && card.rating > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <span className="text-warning">★</span>
                          <span className="font-medium text-foreground">{card.rating.toFixed(1)}</span>
                        </div>
                      )}
                      <h3 className="font-medium text-sm leading-tight line-clamp-2">{card.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-1">{card.subtitle}</p>
                      <p className="text-sm font-semibold text-foreground">
                        {card.currency}{card.price?.toLocaleString()}
                        <span className="text-xs font-normal text-muted-foreground ml-1">
                          {card.priceLabel}
                        </span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <CrossSellSection currentVertical="transport" className="mt-8" />
        </main>
      </div>
    </AppLayout>
  );
}
