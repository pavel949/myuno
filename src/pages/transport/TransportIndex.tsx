import '@/styles/public-commerce.css';
/**
 * TransportIndex — Premium vehicle rental catalog
 * Sixt/Hertz-level UX with myUNO trust architecture
 */
import { useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Car, Plane, ArrowUpDown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { MiniAppLayout } from '@/components/miniapp/MiniAppLayout';
import { Button } from '@/components/ui/button';
import { MarketplaceFilterSheet } from '@/components/services/MarketplaceFilterSheet';
import { pickLang } from '@/lib/i18n/pickLang';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/uno/EmptyState';
import { CrossSellSection } from '@/components/crosssell';
import { useVehicles } from '@/hooks/useVehicles';
import { ECOSYSTEM_PAGE_CONTAINER } from '@/design-system/ecosystemLayout';
import { normalizeVehicleType } from '@/lib/taxonomies';
import { cn } from '@/lib/utils';
import { TransportHeroSearch } from '@/components/transport/TransportHeroSearch';
import { VEHICLE_CLASSES, VehicleClassNav } from '@/components/transport/VehicleClassNav';
import { VehicleCard } from '@/components/transport/VehicleCard';
import {
  TransportFilterSidebar,
  applyTransportFilters,
  compareTransportDailyPrice,
  parseTransportPriceRange,
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

function writeQueryValue(params: URLSearchParams, key: string, value: string) {
  if (value) params.set(key, value);
  else params.delete(key);
}

function readTransportState(params: URLSearchParams) {
  const selectedClass = VEHICLE_CLASSES.find(option => option.id === params.get('vehicleClass'))?.id ?? 'all';
  const sortKey = SORT_OPTIONS.find(option => option.id === params.get('sort'))?.id ?? 'recommended';
  const seats = Number(params.get('seats'));
  const list = (key: string) => [...new Set(params.getAll(key).map(value => value.trim()).filter(Boolean))];
  return { selectedClass, sortKey, filters: {
    minPrice: params.get('minPrice') ?? '',
    maxPrice: params.get('maxPrice') ?? '',
    transmissions: list('transmission'),
    fuelTypes: list('fuel'),
    brands: list('brand'),
    minSeats: [2, 4, 7, 9].includes(seats) ? seats : null,
    deliveryOnly: params.get('delivery') === '1',
    withDriverOnly: params.get('withDriver') === '1',
  } satisfies TransportFilters };
}

const TRANSPORT_PANEL_KEYS = ['minPrice', 'maxPrice', 'seats', 'delivery', 'withDriver', 'transmission', 'fuel', 'brand'] as const;

function writeTransportFilters(params: URLSearchParams, filters: TransportFilters) {
  writeQueryValue(params, 'minPrice', filters.minPrice);
  writeQueryValue(params, 'maxPrice', filters.maxPrice);
  writeQueryValue(params, 'seats', filters.minSeats?.toString() ?? '');
  writeQueryValue(params, 'delivery', filters.deliveryOnly ? '1' : '');
  writeQueryValue(params, 'withDriver', filters.withDriverOnly ? '1' : '');
  for (const [key, values] of [['transmission', filters.transmissions], ['fuel', filters.fuelTypes], ['brand', filters.brands]] as const) {
    params.delete(key);
    for (const value of values) params.append(key, value);
  }
}

export default function TransportIndex() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const { vehicles, isLoading } = useVehicles();

  const location = useLocation();
  const t = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });
  const pending = useRef({ key: location.key, search: location.search });
  if (pending.current.key !== location.key) pending.current = { key: location.key, search: location.search };
  const { selectedClass, sortKey, filters } = useMemo(() => readTransportState(new URLSearchParams(location.search)), [location.search]);
  const changeSearch = (edit: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(pending.current.search);
    edit(params);
    const search = params.size ? `?${params.toString()}` : '';
    if (search === pending.current.search) return;
    pending.current.search = search;
    navigate({ search, hash: location.hash }, { state: location.state, preventScrollReset: true });
  };
  const setSelectedClass = (value: string) => changeSearch(params => writeQueryValue(params, 'vehicleClass', value === 'all' ? '' : value));
  const setSortKey = (value: string) => changeSearch(params => writeQueryValue(params, 'sort', value === 'recommended' ? '' : value));
  const setFilters = (values: TransportFilters) => changeSearch(params => writeTransportFilters(params, values));
  const [editing, setEditing] = useState<{ initial: TransportFilters; values: TransportFilters } | null>(null);
  const draft = editing?.values ?? filters;
  const draftPriceInvalid = !parseTransportPriceRange(draft).valid;
  const priceInvalid = !parseTransportPriceRange(filters).valid;
  const editDraft = (values: TransportFilters) => setEditing(previous => ({ initial: previous?.initial ?? filters, values }));
  const applyDraft = () => {
    if (!editing || draftPriceInvalid) return;
    const initial = new URLSearchParams();
    const next = new URLSearchParams();
    writeTransportFilters(initial, editing.initial);
    writeTransportFilters(next, editing.values);
    changeSearch(params => {
      // Rebase only changed keys onto the latest URL. Repeated values (brands,
      // fuel and transmissions) must round-trip, unlike single-value facets.
      for (const key of TRANSPORT_PANEL_KEYS) {
        const before = initial.getAll(key);
        const after = next.getAll(key);
        if (before.length === after.length && before.every((value, index) => value === after[index])) continue;
        params.delete(key);
        after.forEach(value => params.append(key, value));
      }
    });
  };
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
    if (filters.minPrice || filters.maxPrice) count++;
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
        case 'price_asc': return compareTransportDailyPrice(a, b, false);
        case 'price_desc': return compareTransportDailyPrice(a, b, true);
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
    <MiniAppLayout
      title={isRu ? 'Транспорт' : 'Transport'}
      subtitle={isRu ? `Найдено: ${filtered.length}` : `${filtered.length} results`}
      fallbackPath="/discover"
      showHero={false}
      showSearch={false}
      showFilter={false}
      showCategories={false}
      showEcosystemHint={false}
      contentClassName="public-commerce public-commerce--transport space-y-0 px-0 md:px-0 lg:px-0 xl:px-0"
    >
      {/* Hero Search */}
      <TransportHeroSearch onSearch={(params) => {
        const current = readTransportState(new URLSearchParams(pending.current.search));
        setFilters({ ...current.filters, deliveryOnly: params.delivery, withDriverOnly: params.withDriver });
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }} />

      {/* Quick Links */}
      <div className={cn(ECOSYSTEM_PAGE_CONTAINER, "py-3 flex gap-2")}>
        {QUICK_LINKS.map(link => (
          <button
            key={link.id}
            onClick={() => navigate(link.path)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-md border border-border bg-card hover:border-foreground/20 transition-colors"
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground whitespace-nowrap">
              {isRu ? `Найдено: ${filtered.length}` : `${filtered.length} results`}
            </p>
            <MarketplaceFilterSheet title={t('Фильтры транспорта', 'Vehicle filters', 'ตัวกรองยานพาหนะ')} showLabel activeCount={activeFilterCount}
              applyLabel={t('Показать транспорт', 'Show vehicles', 'แสดงยานพาหนะ')}
              onOpenChange={open => {
                const current = readTransportState(new URLSearchParams(pending.current.search)).filters;
                setEditing(open ? { initial: current, values: current } : null);
              }}
              onReset={() => editDraft(DEFAULT_FILTERS)} onApply={applyDraft} applyDisabled={draftPriceInvalid}>
              <TransportFilterSidebar filters={draft} onChange={editDraft} vehicles={vehicles} />
            </MarketplaceFilterSheet>
          </div>

          <Select value={sortKey} onValueChange={setSortKey}>
            <SelectTrigger className="w-auto shrink-0 gap-1.5 min-h-11 whitespace-nowrap text-xs border-border/50 bg-background" aria-label={isRu ? 'Сортировка' : 'Sort by'}>
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

      <div className={cn(ECOSYSTEM_PAGE_CONTAINER, "pb-24")}>
        <div className="min-w-0">
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
            ) : priceInvalid ? (
              <EmptyState icon={Car} title={t('Неверный диапазон цен', 'Invalid price range', 'ช่วงราคาไม่ถูกต้อง')}
                description={t('Укажите неотрицательные цены, от меньшей к большей.', 'Use non-negative amounts, from lowest to highest.', 'กรอกจำนวนเงินที่ไม่ติดลบ เรียงจากต่ำไปสูง')}
                action={<Button type="button" variant="outline" onClick={() => setFilters({ ...filters, minPrice: '', maxPrice: '' })}>{t('Сбросить диапазон цен', 'Clear price range', 'ล้างช่วงราคา')}</Button>} />
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={Car}
                title={isRu ? 'Транспорт не найден' : 'No vehicles found'}
                description={isRu ? 'Попробуйте изменить фильтры или выбрать другой класс' : 'Try adjusting filters or selecting a different class'}
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
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
    </MiniAppLayout>
  );
}
