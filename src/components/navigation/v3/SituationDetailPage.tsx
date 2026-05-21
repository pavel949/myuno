/**
 * SituationDetailPage — /discover/:code
 *
 * Lists services mapped to a life situation via `resolve_life_os_context` RPC.
 * Role-aware (uses `useLifeOSRole` automatically). Each service card links to
 * the entity-type-specific detail page resolved from `ENTITY_TYPES`.
 */
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, MapPin } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  useLifeSituations,
  useResolveLifeOSContext,
  type LifeOSCatalogItem,
} from '@/hooks/useLifeOS';
import { DynamicIcon } from '@/components/ui/dynamic-icon';
import { Skeleton } from '@/components/ui/skeleton';
import { getEntityType, getEntityTypeLabel } from '@/lib/config/entityTypes';
import { cn } from '@/lib/utils';

function resolveItemHref(item: LifeOSCatalogItem): string {
  const def = getEntityType(item.entity_type);
  if (def.detailRoute === null) return def.route;
  const base = def.detailRoute ?? def.route;
  return `${base}/${item.entity_id}`;
}

function formatPrice(item: LifeOSCatalogItem, isRu: boolean): string | null {
  if (item.price == null) return null;
  try {
    return new Intl.NumberFormat(isRu ? 'ru-RU' : 'en-US', {
      style: 'currency',
      currency: item.currency || 'THB',
      maximumFractionDigits: 0,
    }).format(item.price);
  } catch {
    return `${item.price} ${item.currency || 'THB'}`;
  }
}

function ServiceCard({ item, isRu }: { item: LifeOSCatalogItem; isRu: boolean }) {
  const def = getEntityType(item.entity_type);
  const TypeIcon = def.icon;
  const typeLabel = getEntityTypeLabel(item.entity_type, isRu ? 'ru' : 'en');
  const price = formatPrice(item, isRu);
  const isVerified = item.trust_level === 'verified';

  return (
    <Link
      to={resolveItemHref(item)}
      className={cn(
        'group flex flex-col gap-3 p-4 min-h-[140px]',
        'border border-border bg-card text-card-foreground',
        'transition-all duration-150',
        'hover:border-primary/40 hover:-translate-y-px',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
      )}
    >
      <div className="flex items-center gap-2">
        <TypeIcon className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
          {typeLabel}
        </span>
        {isVerified && (
          <ShieldCheck className="w-3.5 h-3.5 text-accent ml-auto" strokeWidth={1.75} />
        )}
      </div>

      <h3 className="text-[15px] font-semibold leading-snug tracking-[-0.005em] text-foreground line-clamp-2">
        {item.title_localized || item.title}
      </h3>

      <div className="mt-auto flex items-end justify-between gap-2 pt-2">
        {item.location && (
          <span className="inline-flex items-center gap-1 text-[12px] text-muted-foreground truncate">
            <MapPin className="w-3 h-3 shrink-0" strokeWidth={1.75} />
            <span className="truncate">{item.location}</span>
          </span>
        )}
        {price && (
          <span className="font-mono text-[12px] text-foreground shrink-0">
            {price}
          </span>
        )}
      </div>
    </Link>
  );
}

export default function SituationDetailPage() {
  const { code } = useParams<{ code: string }>();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const { data: situations, isLoading: situationsLoading } = useLifeSituations();
  const { data: items, isLoading: itemsLoading, isError } = useResolveLifeOSContext(code ?? null);

  const situation = situations?.find((s) => s.code === code);

  return (
    <AppLayout>
      <div className="px-4 pt-6 pb-24 md:px-6 md:pt-8 max-w-6xl mx-auto">
        <Link
          to="/discover"
          className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
          {isRu ? 'Все ситуации' : 'All situations'}
        </Link>

        {situationsLoading && (
          <div className="space-y-4 mb-8">
            <Skeleton className="h-16 w-16 rounded-none" />
            <Skeleton className="h-9 w-2/3 rounded-none" />
            <Skeleton className="h-5 w-1/2 rounded-none" />
          </div>
        )}

        {!situationsLoading && !situation && (
          <div className="py-16 text-center">
            <p className="text-foreground text-lg mb-2">
              {isRu ? 'Ситуация не найдена' : 'Situation not found'}
            </p>
            <p className="text-muted-foreground text-sm">
              {isRu ? `Код: ${code}` : `Code: ${code}`}
            </p>
          </div>
        )}

        {situation && (
          <>
            <header className="mb-8 md:mb-10">
              {(() => {
                const c = situation.color ?? null;
                const tint = c && c.startsWith('#') ? `${c}20` : 'hsl(var(--primary) / 0.12)';
                const iconColor = c ?? 'hsl(var(--primary))';
                return (
                  <div
                    className="w-16 h-16 flex items-center justify-center mb-5"
                    style={{ backgroundColor: tint }}
                  >
                    <DynamicIcon
                      name={situation.icon || 'Compass'}
                      className="w-8 h-8"
                      style={{ color: iconColor }}
                      strokeWidth={1.5}
                    />
                  </div>
                );
              })()}
              <h1 className="text-[28px] sm:text-[36px] font-serif font-semibold leading-[1.1] tracking-[-0.02em] text-foreground">
                {isRu ? situation.title_ru : situation.title_en}
              </h1>
              {(isRu ? situation.description_ru : situation.description_en) && (
                <p className="mt-3 text-[14px] sm:text-[15px] text-muted-foreground max-w-2xl leading-[1.5]">
                  {isRu ? situation.description_ru : situation.description_en}
                </p>
              )}
            </header>

            <section>
              <div className="flex items-baseline justify-between mb-4 pb-2 border-b border-border">
                <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  {isRu ? 'Сервисы' : 'Services'}
                </h2>
                {items && items.length > 0 && (
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {items.length}
                  </span>
                )}
              </div>

              {isError && (
                <div className="border border-destructive/40 bg-destructive/5 text-destructive p-4 text-sm">
                  {isRu ? 'Не удалось загрузить сервисы.' : 'Failed to load services.'}
                </div>
              )}

              {itemsLoading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-[140px] rounded-none" />
                  ))}
                </div>
              )}

              {!itemsLoading && items && items.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map((item) => (
                    <ServiceCard
                      key={`${item.entity_type}:${item.entity_id}`}
                      item={item}
                      isRu={isRu}
                    />
                  ))}
                </div>
              )}

              {!itemsLoading && items && items.length === 0 && (
                <div className="border border-dashed border-border p-10 text-center text-muted-foreground text-sm">
                  {isRu
                    ? 'Сервисы для этой ситуации пока не настроены.'
                    : 'No services mapped to this situation yet.'}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </AppLayout>
  );
}
