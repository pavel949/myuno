import { publicAssetFilterIssue, clearPublicAssetFilters } from '@/lib/real-estate/publicAssetFilters';
import { PublicAssetFilterNotice } from '@/components/property/commercial/PublicAssetFilterNotice';
/**
 * Land plots landing — Phase 1 scaffold.
 * Reuses the commercial hooks with `asset_class = 'land'`.
 */
import { useSearchParams } from 'react-router-dom';
import { Trees } from 'lucide-react';
import { SEOHead } from '@/components/seo';
import { useLanguage } from '@/contexts/LanguageContext';
import { BackButton } from '@/components/uno/BackButton';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useLandPlots } from '@/hooks/useCommercialProperties';
import { LandPlotCard } from '@/components/property/commercial/LandPlotCard';
import { QueryRecovery } from '@/components/shared/QueryRecovery';
import { LAND_TYPES } from '@/lib/real-estate/commercialTaxonomy';
import { ECOSYSTEM_PAGE_CONTAINER } from '@/design-system/ecosystemLayout';

type Intent = 'rent' | 'sale';

export default function LandIndex() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [searchParams, setSearchParams] = useSearchParams();

  const filterIssue = publicAssetFilterIssue(searchParams, 'land');
  const resetPublicFilters = () => setSearchParams(clearPublicAssetFilters(searchParams));
  const intent: Intent = searchParams.get('intent') === 'rent' ? 'rent' : 'sale';
  const type = searchParams.get('type') || 'all';

  const { data, isLoading, error, refetch } = useLandPlots({ intent, propertyType: type });
  const items = data ?? [];

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === 'all' || !value) next.delete(key);
    else next.set(key, value);
    setSearchParams(next, { replace: true });
  };

  return (
    <>
      <SEOHead
        title={isRu ? 'Земельные участки в Пхукете — myUNO' : 'Land Plots Phuket — myUNO'}
        description={
          isRu
            ? 'Земельные участки на Пхукете: жилые, коммерческие, у моря. Уточняйте титул, зонирование и условия по объявлению.'
            : 'Land plots in Phuket: residential, commercial, beachfront. Confirm title, zoning and terms for each listing.'
        }
      />

      <div className={ECOSYSTEM_PAGE_CONTAINER}>
        <div className="px-4 pt-3 pb-2">
          <BackButton fallbackPath="/property" />
        </div>

        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 mb-1.5">
            <Trees className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">
              {isRu ? 'Земельные участки' : 'Land Plots'}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {isRu
              ? 'Жилые, коммерческие и пляжные участки. Титул и условия уточняются по объявлению.'
              : 'Residential, commercial and beachfront plots. Confirm the title and terms for each listing.'}
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

          {/* Type chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
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
            {LAND_TYPES.map((t) => (
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
              <Trees className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">
                {isRu ? 'Нет опубликованных участков по этим условиям' : 'No published plots match these filters'}
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                {isRu
                  ? 'Каждый участок проходит проверку титула и зонирования перед публикацией.'
                  : 'Every plot is title- and zoning-verified before publishing.'}
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
                <LandPlotCard key={p.id} property={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
