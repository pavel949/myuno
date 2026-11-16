import { publicAssetFilterIssue, publicAssetNumber, clearPublicAssetFilters } from '@/lib/real-estate/publicAssetFilters';
import { PublicAssetFilterNotice } from '@/components/property/commercial/PublicAssetFilterNotice';
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
import { QueryRecovery } from '@/components/shared/QueryRecovery';
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

  const filterIssue = publicAssetFilterIssue(searchParams, 'hotel');
  const resetPublicFilters = () => setSearchParams(clearPublicAssetFilters(searchParams));
  const mode: HotelMode = ['lease', 'management'].includes(searchParams.get('mode') || '') ? searchParams.get('mode') as HotelMode : 'buy';

  const filterValues: HotelFiltersValue = {
    minKeys: searchParams.get('minKeys') ?? undefined,
    maxKeys: searchParams.get('maxKeys') ?? undefined,
    minStars: searchParams.get('minStars') ?? undefined,
    licenseType: searchParams.get('license') ?? undefined,
    managementStatus: searchParams.get('mgmt') ?? undefined,
    minOccupancy: searchParams.get('minOcc') ?? undefined,
  };

  const { data, isLoading, error, refetch } = useHotelProperties({
    mode,
    minKeys: publicAssetNumber(searchParams, 'minKeys'),
    maxKeys: publicAssetNumber(searchParams, 'maxKeys'),
    minStars: publicAssetNumber(searchParams, 'minStars'),
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
            ? 'Готовый отельный бизнес: покупка, долгосрочная аренда здания, передача в управление бренду. Условия и операционные показатели уточняются по запросу.'
            : 'Turnkey hotel businesses: acquisition, long-term lease, hand-over to brand operators. Confirm terms and operating figures on request.'
        }
      />

      <div className={ECOSYSTEM_PAGE_CONTAINER}>
        <div className="px-4 pt-3 pb-2">
          <BackButton fallbackPath="/property" />
        </div>

        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 mb-1.5">
            <Hotel className="w-5 h-5 text-accent dark:text-accent" />
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

          {/* Hero with 4 use-cases */}
          <HotelHeroBanner onOpenHmaForm={() => setHmaOpen(true)} />

          {/* Mode tabs */}
          <div className="inline-flex p-1 rounded-full bg-muted" role="group" aria-label={isRu ? 'Тип предложения' : 'Offer type'}>
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)} aria-pressed={mode === m.id}
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

          {filterIssue && <PublicAssetFilterNotice issue={filterIssue} onReset={resetPublicFilters} />}
          {!filterIssue && mode === 'management' && <div className="space-y-3 border border-border p-5">
            <h2 className="text-lg font-semibold">{isRu ? 'Возможности для операторов — по запросу' : 'Operator opportunities — by enquiry'}</h2>
            <p className="text-sm text-muted-foreground">{isRu ? 'Обсудите объект и условия управления со специалистом. Публичный каталог не подтверждает наличие такого предложения.' : 'Discuss the property and management terms with a specialist. The public catalogue does not confirm an operator offer.'}</p>
            <Button onClick={() => setHmaOpen(true)}>{isRu ? 'Обсудить объект' : 'Discuss a property'}</Button>
          </div>}
          {/* Grid */}
          {!filterIssue && mode !== 'management' && isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[16/10] rounded-none" />
              ))}
            </div>
          )}

          {!filterIssue && mode !== 'management' && !isLoading && error && <QueryRecovery onRetry={refetch} />}

          {!filterIssue && mode !== 'management' && !isLoading && !error && items.length === 0 && (
            <div className="text-center py-16 px-4 border border-dashed border-border rounded-none">
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

          {!filterIssue && mode !== 'management' && !isLoading && !error && items.length > 0 && (
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
