/**
 * TransportIndex — Premium vehicle rental catalog
 * Sixt/Hertz-level UX with myUNO trust architecture
 */
import { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, SlidersHorizontal, Plane, ArrowUpDown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/uno/EmptyState';
import { CrossSellSection } from '@/components/crosssell';
import { useVehicles } from '@/hooks/useVehicles';
import { ECOSYSTEM_PAGE_CONTAINER } from '@/design-system/ecosystemLayout';
import { normalizeVehicleType } from '@/lib/taxonomies';
import { cn } from '@/lib/utils';
import { TransportHeroSearch } from '@/components/transport/TransportHeroSearch';
import { VehicleClassNav } from '@/components/transport/VehicleClassNav';
import { VehicleCard } from '@/components/transport/VehicleCard';
import {
  TransportFilterSidebar,
  applyTransportFilters,
  DEFAULT_FILTERS,
  type TransportFilters,
} from '@/components/transport/TransportFilterSidebar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type SortKey = 'recommended' | 'price_asc' | 'price_desc' | 'rating' | 'newest';

const SORT_OPTIONS: { id: SortKey; labelEn: string; labelRu: string }[] = [
  { id: 'recommended', labelEn: 'Recommended', labelRu: 'Рекомендуемые' },
  { id: 'price_asc', labelEn: 'Lowest price', labelRu: 'Дешевле' },
  { id: 'price_desc', labelEn: 'Highest price', labelRu: 'Дороже' },
  { id: 'newest', labelEn: 'Newest model', labelRu: 'Новые модели' },
  { id: 'rating', labelEn: 'By rating', labelRu: 'По рейтингу' },
];

const QUICK_LINKS = [
  { id: 'taxi', labelEn: 'Taxi', labelRu: 'Такси', path: '/transport/taxi', icon: Car },
  { id: 'airport', labelEn: 'Airport Transfer', labelRu: 'Трансфер', path: '/transport/airport-transfer', icon: Plane },
];

export default function TransportIndex() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const { vehicles, isLoading } = useVehicles();

  const [selectedClass, setSelectedClass] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('recommended');
  const [filters, setFilters] = useState<TransportFilters>(DEFAULT_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Count vehicles per class
  const classCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    vehicles.forEach(v => {
      const type = normalizeVehicleType(v.vehicle_type) || 'other';
      counts[type] = (counts[type] || 0) + 1;
    });
    return counts;
  }, [vehicles]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 5000) count++;
    if (filters.transmissions.length > 0) count++;
    if (filters.fuelTypes.length > 0) count++;
    if (filters.brands.length > 0) count++;
    if (filters.minSeats) count++;
    if (filters.deliveryOnly) count++;
    if (filters.withDriverOnly) count++;
    return count;
  }, [filters]);

  // Filter by class, then apply sidebar filters, then sort
  const filtered = useMemo(() => {
    let results = vehicles.filter(v => {
      if (selectedClass === 'all') return true;
      return normalizeVehicleType(v.vehicle_type) === selectedClass;
    });

    // Apply sidebar filters
    results = applyTransportFilters(results, filters);

    // Sort
    results.sort((a, b) => {
      switch (sortKey) {
        case 'price_asc': return (a.price_per_day || 0) - (b.price_per_day || 0);
        case 'price_desc': return (b.price_per_day || 0) - (a.price_per_day || 0);
        case 'rating': return (b.rating || 0) - (a.rating || 0);
        case 'newest': return (b.year_built || 0) - (a.year_built || 0);
        case 'recommended':
        default:
          if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
          return (b.rating || 0) - (a.rating || 0);
      }
    });

    return results;
  }, [vehicles, selectedClass, sortKey, filters]);

  return (
    <AppLayout showHeader={false} showBottomNav>
      <div className="min-h-screen bg-background">
        {/* Hero Search */}
        <TransportHeroSearch onSearch={(params) => {
          setFilters(prev => ({
            ...prev,
            deliveryOnly: params.delivery,
            withDriverOnly: params.withDriver,
          }));
          resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }} />

        {/* Quick Links */}
        <div className={cn(ECOSYSTEM_PAGE_CONTAINER, "py-3 flex gap-2")}>
          {QUICK_LINKS.map(link => (
            <button
              key={link.id}
              onClick={() => navigate(link.path)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-none border border-border bg-card hover:border-foreground/20 transition-colors"
            >
              <link.icon className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium whitespace-nowrap">{isRu ? link.labelRu : link.labelEn}</span>
            </button>
          ))}
        </div>

        {/* Class Navigation */}
        <VehicleClassNav
          selected={selectedClass}
          onChange={setSelectedClass}
          counts={classCounts}
        />

        {/* Results bar */}
        <div ref={resultsRef} className={cn(ECOSYSTEM_PAGE_CONTAINER, "py-3")}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                {isRu ? `Найдено: ${filtered.length}` : `${filtered.length} results`}
              </p>
              {/* Filter button (mobile + visible toggle) */}
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "text-xs gap-1.5 h-8",
                  activeFilterCount > 0 && "border-primary text-primary"
                )}
                onClick={() => setFiltersOpen(!filtersOpen)}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                {isRu ? 'Фильтры' : 'Filters'}
                {activeFilterCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold ml-0.5">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </div>

            <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
              <SelectTrigger className="w-auto gap-1.5 h-8 text-xs border-border/50 bg-background">
                <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map(opt => (
                  <SelectItem key={opt.id} value={opt.id} className="text-xs">
                    {isRu ? opt.labelRu : opt.labelEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Main content with optional sidebar */}
        <div className={cn(ECOSYSTEM_PAGE_CONTAINER, "pb-24")}>
          <div className={cn("flex gap-6", filtersOpen && "lg:flex")}>
            {/* Filter Sidebar */}
            <TransportFilterSidebar
              filters={filters}
              onChange={setFilters}
              vehicles={vehicles}
              open={filtersOpen}
              onClose={() => setFiltersOpen(false)}
            />

            {/* Vehicle Grid */}
            <div className="flex-1 min-w-0">
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="rounded-none border border-border/50 overflow-hidden">
                      <Skeleton className="aspect-[4/3]" />
                      <div className="p-4 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                        <Skeleton className="h-3 w-full" />
                        <div className="pt-2 border-t border-border/50">
                          <Skeleton className="h-6 w-1/3" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <EmptyState
                  icon={Car}
                  title={isRu ? 'Транспорт не найден' : 'No vehicles found'}
                  description={isRu ? 'Попробуйте изменить фильтры или выбрать другой класс' : 'Try adjusting filters or selecting a different class'}
                />
              ) : (
                <div className={cn(
                  "grid gap-4 md:gap-6",
                  filtersOpen
                    ? "grid-cols-1 sm:grid-cols-2"
                    : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                )}>
                  {filtered.map(vehicle => (
                    <VehicleCard
                      key={vehicle.id}
                      vehicle={vehicle}
                      onClick={() => navigate(`/transport/vehicle/${vehicle.id}`)}
                    />
                  ))}
                </div>
              )}

              <CrossSellSection currentVertical="transport" className="mt-10" />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
