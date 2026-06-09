import { useMemo } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { getVerticalSpec, listVerticalSpecs } from '@/lib/vertical-specs';
import { FilterPanel } from '@/components/vertical-wizard/FilterPanel';
import { useVerticalListings, type ActiveFilters } from '@/hooks/useVerticalListings';
import { LoadingState } from '@/components/uno/LoadingSpinner';
import { BackButton } from '@/components/uno/BackButton';
import { Star, MapPin } from 'lucide-react';

/**
 * Spec-driven public catalog for any vertical.
 * Route: /mc/catalog/:vertical (dev preview while we keep marketplace routes grandfathered).
 */
export default function VerticalCatalogPage() {
  const { vertical = 'restaurant' } = useParams<{ vertical: string }>();
  const { language } = useLanguage();
  const lang = (language === 'ru' ? 'ru' : 'en') as 'en' | 'ru';
  const [params] = useSearchParams();
  const spec = getVerticalSpec(vertical);

  const { filters, sort } = useMemo(() => {
    if (!spec) return { filters: {} as ActiveFilters, sort: undefined };
    const f: ActiveFilters = {};
    for (const fs of spec.filters) {
      if (fs.type === 'range') {
        const min = params.get(`${fs.key}_min`); const max = params.get(`${fs.key}_max`);
        if (min || max) f[fs.key] = { min: min ? Number(min) : undefined, max: max ? Number(max) : undefined };
      } else if (fs.type === 'daterange') {
        const from = params.get(`${fs.key}_from`); const to = params.get(`${fs.key}_to`);
        if (from || to) f[fs.key] = { from: from ?? undefined, to: to ?? undefined };
      } else if (fs.type === 'bool') {
        if (params.get(fs.key)) f[fs.key] = true;
      } else if (fs.type === 'distance') {
        const v = params.get(fs.key); if (v) f[fs.key] = Number(v);
      } else if (fs.type !== 'sort') {
        const v = params.get(fs.key);
        if (!v) continue;
        if (fs.type === 'enum' && fs.options && fs.options.length > 5) f[fs.key] = v.split(',').filter(Boolean);
        else f[fs.key] = v;
      }
    }
    return { filters: f, sort: params.get('sort') ?? undefined };
  }, [spec, params]);

  const { data: rows = [], isLoading } = useVerticalListings({
    spec: spec!,
    filters,
    sort,
    enabled: !!spec && spec.storage.kind === 'listings_vertical',
  });

  if (!spec) {
    return (
      <div className="container py-10 space-y-4">
        <BackButton />
        <p className="text-sm text-muted-foreground">
          {lang === 'ru' ? `Spec для «${vertical}» не подключён.` : `Spec for «${vertical}» not wired.`}
        </p>
        <div className="flex flex-wrap gap-2">
          {listVerticalSpecs().map((s) => (
            <Link
              key={s.id}
              to={`/mc/catalog/${s.id}`}
              className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
            >
              {s.label[lang]}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-4">
      <BackButton />
      <div className="grid gap-6 md:grid-cols-[280px,1fr]">
        <aside className="space-y-4 md:sticky md:top-4 md:self-start">
          <FilterPanel spec={spec} />
        </aside>

        <div className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h1 className="text-xl font-semibold">{spec.label[lang]}</h1>
            <span className="text-sm text-muted-foreground">
              {isLoading ? '…' : `${rows.length} ${lang === 'ru' ? 'результатов' : 'results'}`}
            </span>
          </div>

          {isLoading ? (
            <LoadingState />
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">
              {lang === 'ru' ? 'Ничего не найдено. Сбросьте фильтры.' : 'No results. Try clearing filters.'}
            </p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map((row) => {
                const attrs = (row.attributes ?? {}) as Record<string, unknown>;
                const title = (attrs.title as { en?: string; ru?: string }) ?? {};
                const name = title[lang] || row.name_en || row.name_ru || '—';
                return (
                  <li key={row.id} className="border border-border bg-card overflow-hidden">
                    <Link to={`/mc/catalog/${spec.id}/${row.id}`}>
                      <div className="aspect-[4/3] bg-muted overflow-hidden">
                        {row.cover_image ? (
                          <img src={row.cover_image} alt={name} className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <div className="h-full w-full bg-muted" />
                        )}
                      </div>
                      <div className="p-3 space-y-1">
                        <h3 className="font-medium text-sm line-clamp-1">{name}</h3>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {typeof row.rating === 'number' && row.rating > 0 && (
                            <span className="inline-flex items-center gap-0.5">
                              <Star className="h-3 w-3 fill-current" />
                              {row.rating.toFixed(1)}
                            </span>
                          )}
                          {row.district && (
                            <span className="inline-flex items-center gap-0.5">
                              <MapPin className="h-3 w-3" />
                              {row.district}
                            </span>
                          )}
                        </div>
                        {typeof row.price === 'number' && (
                          <p className="text-sm font-mono">฿ {row.price.toLocaleString()}</p>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
