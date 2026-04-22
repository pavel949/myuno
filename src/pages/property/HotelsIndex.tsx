/**
 * HotelsIndex — dedicated landing for operational hotel listings.
 * Tabs: Buy / Lease / Management opportunities.
 *
 * Visible to all (URL-open), but most useful to investor/business personas.
 */
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Hotel, Building2 } from 'lucide-react';
import { SEOHead } from '@/components/seo';
import { useLanguage } from '@/contexts/LanguageContext';
import { BackButton } from '@/components/uno/BackButton';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useHotelProperties, type HotelMode } from '@/hooks/useHotelProperties';
import { HotelPropertyCard } from '@/components/property/commercial/HotelPropertyCard';
import { HotelHeroBanner } from '@/components/property/commercial/HotelHeroBanner';
import { HotelManagementLeadSheet } from '@/components/property/commercial/HotelManagementLeadSheet';
import { HotelFiltersSheet, type HotelFiltersValue } from '@/components/property/commercial/HotelFilters';
import { PersonaGatePrompt } from '@/components/property/commercial/PersonaGatePrompt';
import { ECOSYSTEM_PAGE_CONTAINER } from '@/design-system/ecosystemLayout';

const MODES: { id: HotelMode; labelEn: string; labelRu: string }[] = [
  { id: 'buy', labelEn: 'Buy', labelRu: 'Купить' },
  { id: 'lease', labelEn: 'Lease', labelRu: 'Аренда' },
  { id: 'management', labelEn: 'Operator opportunities', labelRu: 'Под оператора' },
];

export default function HotelsIndex() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [searchParams, setSearchParams] = useSearchParams();
  const [hmaOpen, setHmaOpen] = useState(false);

  const mode = (searchParams.get('mode') as HotelMode) || 'buy';

  const filterValues: HotelFiltersValue = {
    minKeys: searchParams.get('minKeys') ?? undefined,
    maxKeys: searchParams.get('maxKeys') ?? undefined,
    minStars: searchParams.get('minStars') ?? undefined,
    licenseType: searchParams.get('license') ?? undefined,
    managementStatus: searchParams.get('mgmt') ?? undefined,
    minOccupancy: searchParams.get('minOcc') ?? undefined,
  };

  const { data, isLoading, error } = useHotelProperties({
    mode,
    minKeys: filterValues.minKeys ? Number(filterValues.minKeys) : undefined,
    maxKeys: filterValues.maxKeys ? Number(filterValues.maxKeys) : undefined,
    minStars: filterValues.minStars ? Number(filterValues.minStars) : undefined,
    licenseType: filterValues.licenseType,
    managementStatus: filterValues.managementStatus,
    minOccupancy: filterValues.minOccupancy ? Number(filterValues.minOccupancy) : undefined,
  });

  const items = data ?? [];

  const setMode = (m: HotelMode) => {
    const next = new URLSearchParams(searchParams);
    next.set('mode', m);
    setSearchParams(next, { replace: true });
  };

  const updateFilters = (next: HotelFiltersValue) => {
    const sp = new URLSearchParams(searchParams);
    const setOrDel = (k: string, v?: string) => {
      if (!v) sp.delete(k);
      else sp.set(k, v);
    };
    setOrDel('minKeys', next.minKeys);
    setOrDel('maxKeys', next.maxKeys);
    setOrDel('minStars', next.minStars);
    setOrDel('license', next.licenseType);
    setOrDel('mgmt', next.managementStatus);
    setOrDel('minOcc', next.minOccupancy);
    setSearchParams(sp, { replace: true });
  };

  const headerLabel = useMemo(() => {
    const m = MODES.find((x) => x.id === mode);
    if (!m) return '';
    return isRu ? m.labelRu : m.labelEn;
  }, [mode, isRu]);

  return (
    <>
      <SEOHead
        title={
          isRu
            ? 'Отели на Пхукете — купить, арендовать, передать в управление | myUNO'
            : 'Hotels in Phuket — buy, lease, hand over to operator | myUNO'
        }
        description={
          isRu
            ? 'Готовый отельный бизнес: покупка, долгосрочная аренда здания, передача в управление бренду. ADR, RevPAR, occupancy.'
            : 'Turnkey hotel businesses: acquisition, long-term lease, hand-over to brand operators. ADR, RevPAR, occupancy.'
        }
      />

      <div className={ECOSYSTEM_PAGE_CONTAINER}>
        <div className="px-4 pt-3 pb-2">
          <BackButton />
        </div>

        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 mb-1.5">
            <Hotel className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h1 className="text-2xl font-bold text-foreground">
              {isRu ? 'Отели' : 'Hotels'}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {isRu
              ? 'Купить, арендовать здание или передать отель в управление бренду.'
              : 'Buy, lease the building, or hand over to a brand operator.'}
          </p>
        </div>

        <div className="px-4 space-y-4">
          <PersonaGatePrompt />

          {/* Hero with 4 use-cases */}
          <HotelHeroBanner onOpenHmaForm={() => setHmaOpen(true)} />

          {/* Mode tabs */}
          <div className="inline-flex p-1 rounded-full bg-muted">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={cn(
                  'px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
                  mode === m.id
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {isRu ? m.labelRu : m.labelEn}
              </button>
            ))}
          </div>

          {/* Filters bar */}
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {isLoading
                ? isRu
                  ? 'Загрузка...'
                  : 'Loading...'
                : isRu
                ? `${items.length} объект(ов) · ${headerLabel}`
                : `${items.length} listing(s) · ${headerLabel}`}
            </p>
            <HotelFiltersSheet value={filterValues} onChange={updateFilters} />
          </div>

          {/* Grid */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[16/10] rounded-2xl" />
              ))}
            </div>
          )}

          {!isLoading && error && (
            <div className="text-sm text-destructive p-4 rounded-xl bg-destructive/5">
              {isRu ? 'Не удалось загрузить отели' : 'Failed to load hotels'}
            </div>
          )}

          {!isLoading && !error && items.length === 0 && (
            <div className="text-center py-16 px-4 border border-dashed border-border rounded-2xl">
              <Building2 className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">
                {isRu ? 'Пока нет объектов' : 'No listings yet'}
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                {isRu
                  ? 'Мы формируем закрытый пул отельных активов. Свяжитесь, чтобы получить доступ к черновику пайплайна.'
                  : 'We are curating a private pool of hotel assets. Reach out for early pipeline access.'}
              </p>
              <Button size="sm" variant="outline" onClick={() => setHmaOpen(true)}>
                {isRu ? 'Опубликовать отель' : 'Submit a hotel'}
              </Button>
            </div>
          )}

          {!isLoading && !error && items.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((p) => (
                <HotelPropertyCard key={p.id} property={p} />
              ))}
            </div>
          )}
        </div>
      </div>

      <HotelManagementLeadSheet open={hmaOpen} onOpenChange={setHmaOpen} />
    </>
  );
}
