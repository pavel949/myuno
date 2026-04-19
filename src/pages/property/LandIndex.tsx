/**
 * Land plots landing — Phase 1 scaffold.
 * Reuses the commercial hooks with `asset_class = 'land'`.
 */
import { useSearchParams } from 'react-router-dom';
import { Trees } from 'lucide-react';
import { SEOHead } from '@/components/seo';
import { useLanguage } from '@/contexts/LanguageContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/uno/BackButton';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useLandPlots } from '@/hooks/useCommercialProperties';
import { LandPlotCard } from '@/components/property/commercial/LandPlotCard';
import { PersonaGatePrompt } from '@/components/property/commercial/PersonaGatePrompt';
import { LAND_TYPES } from '@/lib/real-estate/commercialTaxonomy';
import { ECOSYSTEM_PAGE_CONTAINER } from '@/design-system/ecosystemLayout';

type Intent = 'rent' | 'sale';

export default function LandIndex() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [searchParams, setSearchParams] = useSearchParams();

  const intent = (searchParams.get('intent') as Intent) || 'sale';
  const type = searchParams.get('type') || 'all';

  const { data, isLoading, error } = useLandPlots({ intent, propertyType: type });
  const items = data ?? [];

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === 'all' || !value) next.delete(key);
    else next.set(key, value);
    setSearchParams(next, { replace: true });
  };

  return (
    <AppLayout>
      <SEOHead
        title={isRu ? 'Земельные участки в Пхукете — myUNO' : 'Land Plots Phuket — myUNO'}
        description={
          isRu
            ? 'Земельные участки на Пхукете: жилые, коммерческие, у моря. Чаноте, зонирование, фронтаж — проверенная информация.'
            : 'Land plots in Phuket: residential, commercial, beachfront. Chanote, zoning, frontage — verified info.'
        }
      />

      <div className={ECOSYSTEM_PAGE_CONTAINER}>
        <div className="px-4 pt-3 pb-2">
          <BackButton />
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
              ? 'Жилые, коммерческие и пляжные участки с проверенным титулом.'
              : 'Residential, commercial and beachfront plots with verified title.'}
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

          {/* Type chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
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
            {LAND_TYPES.map((t) => (
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
              {isRu ? 'Не удалось загрузить участки' : 'Failed to load plots'}
            </div>
          )}

          {!isLoading && !error && items.length === 0 && (
            <div className="text-center py-16 px-4 border border-dashed border-border rounded-2xl">
              <Trees className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">
                {isRu ? 'Подбираем эксклюзивные участки' : 'Curating exclusive plots'}
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

          {!isLoading && !error && items.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((p) => (
                <LandPlotCard key={p.id} property={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
