import { publicAssetFilterIssue, publicAssetNumber, clearPublicAssetFilters } from '@/lib/real-estate/publicAssetFilters';
import { PublicAssetFilterNotice } from '@/components/property/commercial/PublicAssetFilterNotice';
/**
 * Commercial RE landing — Phase 1.
 * Shows intent toggle (Rent/Sale), type chips, and a featured grid.
 * Persona-gated visibility lives in PropertyHubTabs; URL access stays open.
 */
import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Briefcase, Building2, Hotel } from 'lucide-react';
import { SEOHead } from '@/components/seo';
import { useLanguage } from '@/contexts/LanguageContext';
import { BackButton } from '@/components/uno/BackButton';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useCommercialProperties } from '@/hooks/useCommercialProperties';
import { CommercialPropertyCard } from '@/components/property/commercial/CommercialPropertyCard';
import { QueryRecovery } from '@/components/shared/QueryRecovery';
import { CommercialFilters, type CommercialFiltersValue } from '@/components/property/commercial/CommercialFilters';
import { COMMERCIAL_TYPES, HOTEL_PROPERTY_TYPES } from '@/lib/real-estate/commercialTaxonomy';
import { ECOSYSTEM_PAGE_CONTAINER } from '@/design-system/ecosystemLayout';
import { APP_ROUTES } from '@/lib/config/routes';

type Intent = 'rent' | 'sale';

export default function CommercialIndex() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const filterIssue = publicAssetFilterIssue(searchParams, 'commercial');
  const resetPublicFilters = () => setSearchParams(clearPublicAssetFilters(searchParams));
  const intent: Intent = searchParams.get('intent') === 'rent' ? 'rent' : 'sale';
  const type = searchParams.get('type') || 'all';

  const filterValues: CommercialFiltersValue = {
    minPrice: searchParams.get('minPrice') ?? undefined,
    maxPrice: searchParams.get('maxPrice') ?? undefined,
    minAreaSqm: searchParams.get('minArea') ?? undefined,
    maxAreaSqm: searchParams.get('maxArea') ?? undefined,
    minCapRate: searchParams.get('minCap') ?? undefined,
    chanoteOnly: searchParams.get('chanote') === '1' || undefined,
    withTenant: searchParams.get('tenant') === '1' || undefined,
  };

  // Exclude hotels from generic Commercial feed unless a hotel sub-type is explicitly chosen.
  const isHotelTypeSelected = (HOTEL_PROPERTY_TYPES as string[]).includes(type);

  const { data, isLoading, error, refetch } = useCommercialProperties({
    intent,
    propertyType: type,
    minPrice: intent === 'sale' ? publicAssetNumber(searchParams, 'minPrice') : undefined,
    maxPrice: intent === 'sale' ? publicAssetNumber(searchParams, 'maxPrice') : undefined,
    minAreaSqm: publicAssetNumber(searchParams, 'minArea'),
    maxAreaSqm: publicAssetNumber(searchParams, 'maxArea'),
    excludeHotels: type === 'all' && !isHotelTypeSelected,
  });

  const items = useMemo(() => {
    let list = data ?? [];
    if (filterValues.minCapRate) {
      const min = Number(filterValues.minCapRate);
      list = list.filter((p) => typeof p.cap_rate_pct === 'number' && Number.isFinite(p.cap_rate_pct) && p.cap_rate_pct >= min);
    }
    if (filterValues.chanoteOnly) {
      list = list.filter((p) => p.title_deed_type === 'chanote');
    }
    return list;
  }, [data, filterValues.minCapRate, filterValues.chanoteOnly]);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === 'all' || !value) next.delete(key);
    else next.set(key, value);
    setSearchParams(next, { replace: true });
  };

  const updateFilters = (next: CommercialFiltersValue) => {
    const sp = new URLSearchParams(searchParams);
    const setOrDel = (k: string, v?: string | boolean) => {
      if (v === undefined || v === '' || v === false) sp.delete(k);
      else sp.set(k, v === true ? '1' : String(v));
    };
    setOrDel('minPrice', next.minPrice);
    setOrDel('maxPrice', next.maxPrice);
    setOrDel('minArea', next.minAreaSqm);
    setOrDel('maxArea', next.maxAreaSqm);
    setOrDel('minCap', next.minCapRate);
    setOrDel('chanote', next.chanoteOnly);
    setOrDel('tenant', next.withTenant);
    setSearchParams(sp, { replace: true });
  };

  return (
    <>
      <SEOHead
        title={isRu ? 'Коммерческая недвижимость в Пхукете — myUNO' : 'Commercial Real Estate Phuket — myUNO'}
        description={
          isRu
            ? 'Офисы, склады, рестораны, отели — аренда и продажа коммерческой недвижимости Условия и показатели уточняются по объявлению.'
            : 'Offices, warehouses, restaurants, hotels — rent and sale of commercial real estate Confirm terms and recorded figures for each listing.'
        }
      />

      <div className={ECOSYSTEM_PAGE_CONTAINER}>
        <div className="px-4 pt-3 pb-2">
          <BackButton fallbackPath="/property" />
        </div>

        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 mb-1.5">
            <Briefcase className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">
              {isRu ? 'Коммерческая недвижимость' : 'Commercial Real Estate'}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {isRu
              ? 'Офисы, ритейл, склады, F&B, отели — с фокусом на доходность.'
              : 'Offices, retail, warehouses, F&B, hotels — yield-focused listings.'}
          </p>
        </div>

        <div className="px-4 space-y-4">

          {/* Intent toggle */}
          <div className="inline-flex p-1 rounded-full bg-muted" role="group" aria-label={isRu ? 'Тип предложения' : 'Offer type'}>
            {(['sale', 'rent'] as Intent[]).map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setParam('intent', i)}
                aria-pressed={intent === i}
                className={cn(
                  'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                  intent === i
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {i === 'sale' ? (isRu ? 'Продажа' : 'Sale') : isRu ? 'Аренда' : 'Rent'}
              </button>
            ))}
          </div>

          {/* Type chips + filters drawer */}
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex min-w-0 gap-2 overflow-x-auto pb-1 scrollbar-hide flex-1">
              <button
                type="button"
                onClick={() => setParam('type', 'all')}
                aria-pressed={type === 'all'}
                className={cn(
                  'shrink-0 min-h-11 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors',
                  type === 'all'
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-background text-muted-foreground border-border hover:text-foreground',
                )}
              >
                {isRu ? 'Все' : 'All'}
              </button>
              {/* Hotels — dedicated sub-vertical, navigates to /property/hotels for SEO */}
              <button
                type="button"
                onClick={() => navigate(APP_ROUTES.HOTELS)}
                className={cn(
                  'shrink-0 min-h-11 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors',
                  'bg-accent/10 text-accent dark:text-accent border-accent/40 hover:bg-accent/20',
                )}
              >
                <Hotel className="inline w-3 h-3 mr-1" />
                {isRu ? 'Отели' : 'Hotels'}
                <span className="ml-1.5 text-[10px] opacity-70">PRO</span>
              </button>
              {COMMERCIAL_TYPES.filter((t) => !(HOTEL_PROPERTY_TYPES as string[]).includes(t.id)).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setParam('type', t.id)}
                  aria-pressed={type === t.id}
                  className={cn(
                    'shrink-0 min-h-11 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors',
                    type === t.id
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-background text-muted-foreground border-border hover:text-foreground',
                  )}
                >
                  <span className="mr-1">{t.icon}</span>
                  {isRu ? t.labelRu : t.labelEn}
                </button>
              ))}
            </div>
            <CommercialFilters value={filterValues} onChange={updateFilters} priceEnabled={intent === 'sale'} />
          </div>

          {filterIssue && <PublicAssetFilterNotice issue={filterIssue} onReset={resetPublicFilters} />}
          {/* Grid */}
          {!filterIssue && isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[16/10] rounded-none" />
              ))}
            </div>
          )}

          {!filterIssue && !isLoading && error && <QueryRecovery onRetry={refetch} />}

          {!filterIssue && !isLoading && !error && items.length === 0 && (
            <div className="text-center py-16 px-4 border border-dashed border-border rounded-none">
              <Building2 className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">
                {isRu ? 'Нет опубликованных предложений по этим условиям' : 'No published offers match these filters'}
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                {isRu
                  ? 'Измените условия поиска или уточните доступные варианты.'
                  : 'Change the search criteria or enquire about available options.'}
              </p>
              <Button size="sm" variant="outline" asChild>
                <a href="mailto:capital@myuno.app">
                  {isRu ? 'Связаться с Capital Advisory' : 'Contact Capital Advisory'}
                </a>
              </Button>
            </div>
          )}

          {!filterIssue && !isLoading && !error && items.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((p) => (
                <CommercialPropertyCard key={p.id} property={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
