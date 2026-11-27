/**
 * SituationDetailPage — /discover/:code
 *
 * Lists services mapped to a life situation via `resolve_life_os_context` RPC.
 * Role-aware (uses `useLifeOSRole` automatically). Each service card links to
 * the entity-type-specific detail page resolved from `ENTITY_TYPES`.
 */
import React, { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, ShieldCheck, MapPin } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  useLifeSituations,
  useResolveLifeOSContext,
  useLifeScenarios,
  scenarioSlug,
  type LifeOSCatalogItem,
  type LifeSituation,
} from '@/hooks/useLifeOS';
import { useUserPersonas, type UserPersona } from '@/hooks/useUserPersonas';
import { useSituationServiceCounts } from '@/hooks/useSituationServiceCounts';
import { rankSituationsByPersonas } from '@/lib/situationBlend';
import { CLUSTER_LIFE_SITUATIONS, type ClusterId } from '@/lib/catalog/taxonomy';
import { buildSituationListUrl } from '@/lib/navigation/situationUrls';
import { useSituationTracking } from './useSituationTracking';
import { formatServices } from '@/lib/i18n/pluralize';
import { hexTint, accentColor } from '@/lib/ui/colorTint';
import { DynamicIcon } from '@/components/ui/dynamic-icon';
import { Skeleton } from '@/components/ui/skeleton';
import { getEntityType, getEntityTypeLabel, resolveEntityDestination } from '@/lib/config/entityTypes';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ConciergeHelpSheet } from '@/components/concierge/ConciergeHelpSheet';
import { APP_ROUTES } from '@/lib/config/routes';
import { LifeOsPageHeader, LIFE_OS_CONTAINER, LIFE_OS_SECTION_TITLE } from './LifeOsPageHeader';

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
  const destination = resolveEntityDestination(item.entity_type, item.entity_id);
  const href = destination.status === 'resolved' ? destination.href : null;
  const title = item.title_localized || item.title;

  if (!title) return null;
  if (!href) return (
    <article className="flex flex-col gap-3 p-4 min-h-[140px] border border-border bg-card text-card-foreground">
      <h3 className="text-body font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">
        {isRu ? 'Переход к этому предложению пока недоступен.' : 'This offering is not available to open yet.'}
      </p>
    </article>
  );

  return (
    <Link
      to={href}
      className={cn(
        'group flex flex-col gap-3 p-4 min-h-[140px]',
        'border border-border bg-card text-card-foreground',
        'transition-[border-color,transform] duration-150',
        'hover:border-primary/40 hover:-translate-y-px',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
      )}
    >
      <div className="flex items-center gap-2">
        <TypeIcon aria-hidden="true" className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
          {typeLabel}
        </span>
        {isVerified && (
          <ShieldCheck
            className="w-3.5 h-3.5 text-accent ml-auto"
            strokeWidth={1.75}
            aria-label={isRu ? 'Проверено' : 'Verified'}
          />
        )}
      </div>

      <h3 className="text-[15px] font-semibold leading-snug tracking-[-0.005em] text-foreground line-clamp-2">
        {title}
      </h3>

      <div className="mt-auto flex items-end justify-between gap-2 pt-2">
        {item.location && (
          <span className="inline-flex items-center gap-1 text-[12px] text-muted-foreground truncate">
            <MapPin aria-hidden="true" className="w-3 h-3 shrink-0" strokeWidth={1.75} />
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

/**
 * Pick the top-3 situations related to `current` by:
 *  1. Same primary cluster (sibling life-situations)
 *  2. Higher-weight neighbours from the SSOT bridge table
 *  3. Persona-aware ranking on the remainder
 *
 * Falls back to "by priority" when SSOT lookup misses (e.g. legacy codes).
 */
function pickRelatedSituations(
  current: LifeSituation,
  all: LifeSituation[],
  effectivePersonas: UserPersona[],
  limit = 3,
): LifeSituation[] {
  if (!all || all.length <= 1) return [];

  // SSOT-driven: clusters the current situation belongs to (any link).
  const currentClusterLinks = CLUSTER_LIFE_SITUATIONS.filter(
    (l) => l.situationCode === current.code,
  );
  const currentClusters = new Set<ClusterId>(
    currentClusterLinks.map((l) => l.clusterId),
  );

  const siblingCodes = new Set<string>(
    CLUSTER_LIFE_SITUATIONS
      .filter((l) => currentClusters.has(l.clusterId) && l.situationCode !== current.code)
      .map((l) => l.situationCode),
  );

  const candidates = all.filter(
    (s) => s.code !== current.code && (siblingCodes.has(s.code) || siblingCodes.size === 0),
  );

  return rankSituationsByPersonas(candidates, effectivePersonas).slice(0, limit);
}

export default function SituationDetailPage() {
  const { code } = useParams<{ code: string }>();
  const [helpOpen, setHelpOpen] = useState(false);
  const { data: lifeSituationsAll } = useLifeSituations();
  const scenarioQuery = useLifeScenarios(lifeSituationsAll?.find(s => s.code === code)?.id);
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const { data: situations, isLoading: situationsLoading } = useLifeSituations();
  const { data: items, isLoading: itemsLoading, isError } = useResolveLifeOSContext(code ?? null);
  const { data: counts } = useSituationServiceCounts();
  const { effectivePersonas } = useUserPersonas();

  const situation = situations?.find((s) => s.code === code);

  // Situation-derived view values (computed once; avoids in-JSX IIFE/double-eval)
  const sTitle = situation ? (isRu ? situation.title_ru : situation.title_en) : '';
  const sDesc = situation ? (isRu ? situation.description_ru : situation.description_en) : null;
  const sTint = hexTint(situation?.color, 0.125);
  const sIconColor = accentColor(situation?.color);

  const relatedSituations = useMemo(() => {
    if (!situation || !situations) return [];
    return pickRelatedSituations(situation, situations, effectivePersonas, 3);
  }, [situation, situations, effectivePersonas]);

  // Same analytics layer as SituationList / SituationCard.
  const relatedCodes = useMemo(
    () => relatedSituations.map((s) => s.code),
    [relatedSituations],
  );
  const { containerRef: relatedRef, onSituationClick } = useSituationTracking({
    codes: relatedCodes,
    source: 'related_situations',
    variant: 'compact',
    context: { from_situation: code },
  });

  return (
    <AppLayout>
      <div className={LIFE_OS_CONTAINER}>
        {!situation && <LifeOsPageHeader current={isRu ? "Ситуация" : "Situation"} title={situationsLoading ? "" : (isRu ? "Ситуация не найдена" : "Situation not found")} />}
        {situationsLoading && (
          <div className="space-y-4 mb-8">
            <Skeleton className="h-16 w-16 rounded-none" />
            <Skeleton className="h-9 w-2/3 rounded-none" />
            <Skeleton className="h-5 w-1/2 rounded-none" />
          </div>
        )}

        {!situationsLoading && !situation && (
          <div className="py-16 text-center">
            <Link className="ds-focus inline-flex min-h-11 items-center underline underline-offset-4" to={APP_ROUTES.DISCOVER_SITUATIONS}>{isRu ? 'Все жизненные ситуации' : 'All life situations'}</Link>
            <p className="text-muted-foreground text-sm">
              {null}
            </p>
          </div>
        )}

        {situation && (
          <>
            <LifeOsPageHeader
              current={sTitle}
              title={sTitle}
              lead={sDesc}
              icon={<div className="flex size-14 shrink-0 items-center justify-center rounded-[var(--bible-radius-card)]" style={{ backgroundColor: sTint }}>
                <DynamicIcon name={situation.icon || 'Compass'} aria-hidden="true" className="size-7" style={{ color: sIconColor }} strokeWidth={1.5} />
              </div>}
            />

            {(scenarioQuery.data ?? []).length > 0 && (
              <section className="mb-10" aria-labelledby="situation-scenarios-title">
                <h2 id="situation-scenarios-title" className={cn(LIFE_OS_SECTION_TITLE, 'mb-4 pb-2 border-b border-border')}>{isRu ? 'С чего начать' : 'Where to start'}</h2>
                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {(scenarioQuery.data ?? []).map((sc) => (
                    <li key={sc.id}>
                      <Link to={`/discover/${code}/${scenarioSlug(sc.code)}`} className="ds-focus flex h-full min-h-11 items-start justify-between gap-3 rounded-[var(--bible-radius-card)] border border-border bg-card p-4 text-foreground transition-colors hover:border-primary">
                        <span className="min-w-0"><span className="block font-medium">{isRu ? sc.title_ru : sc.title_en}</span>{(isRu ? sc.description_ru : sc.description_en) && <span className="mt-1 block text-sm text-muted-foreground line-clamp-2">{isRu ? sc.description_ru : sc.description_en}</span>}</span>
                        <ArrowUpRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section id="situation-services" className="scroll-mt-24">
              <div className="flex items-baseline justify-between mb-4 pb-2 border-b border-border">
                <h2 className={LIFE_OS_SECTION_TITLE}>
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
                    <Skeleton key={`service-skeleton-${i}`} className="h-[140px] rounded-none" />
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
                <div className="rounded-[var(--bible-radius-card)] border border-border bg-card p-6 md:p-8">
                  <p className="font-medium text-foreground">{isRu ? 'Подборка для этой ситуации ещё готовится' : 'This situation is still being prepared'}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{isRu ? 'Опишите задачу — команда myUNO подскажет, с чего начать, и предложит проверенных специалистов.' : 'Describe your task and the myUNO team will suggest where to start and who can help.'}</p>
                  <Button className="mt-4 min-h-11" onClick={() => setHelpOpen(true)}>{isRu ? 'Оставить заявку команде' : 'Ask the team'}</Button>
                </div>
              )}
            </section>

            {relatedSituations.length > 0 && (
              <section className="mt-10 md:mt-14">
                <div className="flex items-baseline justify-between mb-4 pb-2 border-b border-border">
                  <h2 className={LIFE_OS_SECTION_TITLE}>
                    {isRu ? 'Похожие ситуации' : 'Related situations'}
                  </h2>
                </div>
                <div ref={relatedRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {relatedSituations.map((rel) => {
                    const tint = hexTint(rel.color, 0.10);
                    const iconColor = accentColor(rel.color);
                    const count = counts?.[rel.id];
                    const href = buildSituationListUrl(rel.code);
                    return (
                      <Link
                        key={rel.id}
                        to={href}
                        onClick={() => onSituationClick(rel.code, { href, count })}
                        className={cn(
                          'group flex items-start gap-3 p-4 min-h-[88px]',
                          'border border-border bg-card text-card-foreground',
                          'transition-[border-color,transform] duration-150',
                          'hover:border-primary/40 hover:-translate-y-px',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                        )}
                      >
                        <div
                          className="w-10 h-10 flex items-center justify-center shrink-0"
                          style={{ backgroundColor: tint }}
                        >
                          <DynamicIcon
                            name={rel.icon || 'Compass'}
                            aria-hidden="true"
                            className="w-5 h-5"
                            style={{ color: iconColor }}
                            strokeWidth={1.75}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-[14px] font-semibold leading-snug tracking-[-0.005em] text-foreground line-clamp-2">
                              {isRu ? rel.title_ru : rel.title_en}
                            </span>
                            <ArrowUpRight
                              aria-hidden="true"
                              className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-[color,transform] shrink-0"
                              strokeWidth={2}
                            />
                          </div>
                          {typeof count === 'number' && count > 0 && (
                            <span className="mt-1 inline-block font-mono text-[10px] text-muted-foreground">
                              {formatServices(count, language)}
                            </span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </div>
      {situation && helpOpen && <ConciergeHelpSheet open={helpOpen} onOpenChange={setHelpOpen} topic={code === 'relocation' || code === 'relocate' ? 'relocation' : 'general'} initialSubject={sTitle} sourceData={{ source: 'life_os_situation', situation_code: code }} />}
    </AppLayout>
  );
}
