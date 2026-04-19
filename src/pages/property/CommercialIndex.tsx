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
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/uno/BackButton';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useCommercialProperties } from '@/hooks/useCommercialProperties';
import { CommercialPropertyCard } from '@/components/property/commercial/CommercialPropertyCard';
import { PersonaGatePrompt } from '@/components/property/commercial/PersonaGatePrompt';
import { CommercialFilters, type CommercialFiltersValue } from '@/components/property/commercial/CommercialFilters';
import { COMMERCIAL_TYPES, HOTEL_PROPERTY_TYPES } from '@/lib/real-estate/commercialTaxonomy';
import { ECOSYSTEM_PAGE_CONTAINER } from '@/design-system/ecosystemLayout';
import { APP_ROUTES } from '@/lib/config/routes';

type Intent = 'rent' | 'sale';

export default function CommercialIndex() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [searchParams, setSearchParams] = useSearchParams();

  const intent = (searchParams.get('intent') as Intent) || 'sale';
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

  const { data, isLoading, error } = useCommercialProperties({
    intent,
    propertyType: type,
    minPrice: filterValues.minPrice ? Number(filterValues.minPrice) : undefined,
    maxPrice: filterValues.maxPrice ? Number(filterValues.maxPrice) : undefined,
    minAreaSqm: filterValues.minAreaSqm ? Number(filterValues.minAreaSqm) : undefined,
    maxAreaSqm: filterValues.maxAreaSqm ? Number(filterValues.maxAreaSqm) : undefined,
  });

  const items = useMemo(() => {
    let list = data ?? [];
    if (filterValues.minCapRate) {
      const min = Number(filterValues.minCapRate);
      list = list.filter((p) => (p.cap_rate_pct ?? 0) >= min);
    }
    if (filterValues.chanoteOnly) {
      list = list.filter((p) => p.title_deed_type === 'chanote');
    }
    if (filterValues.withTenant) {
      list = list.filter((p) => (p.lease_remaining_months ?? 0) > 0);
    }
    return list;
  }, [data, filterValues.minCapRate, filterValues.chanoteOnly, filterValues.withTenant]);

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
    <AppLayout>
      <SEOHead
        title={isRu ? 'Коммерческая недвижимость в Пхукете — myUNO' : 'Commercial Real Estate Phuket — myUNO'}
        description={
          isRu
            ? 'Офисы, склады, рестораны, отели — аренда и продажа коммерческой недвижимости с метриками доходности (Cap Rate, NOI, Yield).'
            : 'Offices, warehouses, restaurants, hotels — rent and sale of commercial real estate with yield metrics (Cap Rate, NOI).'
        }
      />

      <div className={ECOSYSTEM_PAGE_CONTAINER}>
        <div className="px-4 pt-3 pb-2">
          <BackButton />
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
          <PersonaGatePrompt />

          {/* Intent toggle */}
          <div className="inline-flex p-1 rounded-full bg-muted">
            {(['sale', 'rent'] as Intent[]).map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setParam('intent', i)}
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
          <div className="flex items-center gap-2">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide flex-1">
              <button
                type="button"
                onClick={() => setParam('type', 'all')}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors',
                  type === 'all'
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-background text-muted-foreground border-border hover:text-foreground',
                )}
              >
                {isRu ? 'Все' : 'All'}
              </button>
              {COMMERCIAL_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setParam('type', t.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors',
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
            <CommercialFilters value={filterValues} onChange={updateFilters} />
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
              {isRu ? 'Не удалось загрузить листинги' : 'Failed to load listings'}
            </div>
          )}

          {!isLoading && !error && items.length === 0 && (
            <div className="text-center py-16 px-4 border border-dashed border-border rounded-2xl">
              <Building2 className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">
                {isRu ? 'Скоро здесь будут объекты' : 'Listings coming soon'}
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                {isRu
                  ? 'Мы собираем эксклюзивный пул коммерческих объектов с проверенной доходностью.'
                  : 'We are curating an exclusive pool of commercial assets with verified yield.'}
              </p>
              <Button size="sm" variant="outline" asChild>
                <a href="mailto:capital@myuno.app">
                  {isRu ? 'Связаться с Capital Advisory' : 'Contact Capital Advisory'}
                </a>
              </Button>
            </div>
          )}

          {!isLoading && !error && items.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((p) => (
                <CommercialPropertyCard key={p.id} property={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
