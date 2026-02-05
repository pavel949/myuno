/**
 * LifeFlowPage - LIFE OS resolver page
 * Per UX Contract §4.2: Header → Suggested Blocks → Explore More
 * Per UX Contract §4.1: NEVER show "No results" - always guided fallback
 * 
 * Enhanced with LIFE OS:
 * - Role-aware catalog resolution
 * - Locale-aware title display
 * - AI-readable context structure
 */
import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLifeSituationContext } from '@/contexts/LifeSituationContext';
import { 
  useLifeSituations, 
  useResolveLifeOSContext,
  getLifeOSAIContext,
  type LifeOSCatalogItem 
} from '@/hooks/useLifeOS';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { LifeSituationBadge } from '@/components/life-flow/LifeSituationBadge';
import { GuidedFallback } from '@/components/life-flow/GuidedFallback';
import { 
  ArrowLeft, Package, Compass, ArrowRight, ChevronRight, Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { getEntityType, isPrimaryEntityType } from '@/lib/config/entityTypes';

export default function LifeFlowPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const { setLifeSituation } = useLifeSituationContext();

  const { data: situations } = useLifeSituations();
  // Use enhanced LIFE OS resolver with role and locale support
  const { data: catalogItems, isLoading } = useResolveLifeOSContext(code || null, { limit: 50 });

  const currentSituation = situations?.find((s) => s.code === code);

  // Set context when page loads
  React.useEffect(() => {
    if (currentSituation) {
      const title = isRussian ? currentSituation.title_ru : currentSituation.title_en;
      setLifeSituation(currentSituation.code, title, currentSituation.color);
    }
  }, [currentSituation, isRussian, setLifeSituation]);

  // Log AI context for debugging/future AI integration
  React.useEffect(() => {
    if (currentSituation && catalogItems?.length) {
      const aiContext = getLifeOSAIContext(currentSituation, catalogItems);
      console.debug('[LIFE OS] AI Context:', aiContext);
    }
  }, [currentSituation, catalogItems]);

  // Group items by entity type and split by priority (UX Contract §4.3)
  const { primaryBlocks, secondaryBlocks } = React.useMemo(() => {
    if (!catalogItems) return { primaryBlocks: {}, secondaryBlocks: {} };
    
    const grouped = catalogItems.reduce((acc, item) => {
      if (!acc[item.entity_type]) {
        acc[item.entity_type] = [];
      }
      acc[item.entity_type].push(item);
      return acc;
    }, {} as Record<string, typeof catalogItems>);

    const primary: typeof grouped = {};
    const secondary: typeof grouped = {};

    Object.entries(grouped).forEach(([type, items]) => {
      if (isPrimaryEntityType(type)) {
        primary[type] = items;
      } else {
        secondary[type] = items;
      }
    });

    return { primaryBlocks: primary, secondaryBlocks: secondary };
  }, [catalogItems]);

  const getIcon = (iconName: string): LucideIcon => {
    const icons = LucideIcons as unknown as Record<string, LucideIcon>;
    return icons[iconName] || Compass;
  };

  const SituationIcon = currentSituation ? getIcon(currentSituation.icon) : Compass;
  const hasCatalogItems = Object.keys(primaryBlocks).length > 0 || Object.keys(secondaryBlocks).length > 0;

  // Render a suggested block section
  const renderBlock = (entityType: string, items: typeof catalogItems, isPrimaryBlock: boolean) => {
    const entityConfig = getEntityType(entityType);
    const EntityIcon = entityConfig.icon;

    return (
      <section key={entityType} className={cn("space-y-3", isPrimaryBlock && "bg-card rounded-2xl p-4 border")}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div 
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                isPrimaryBlock ? "bg-primary/10" : "bg-muted"
              )}
            >
              <EntityIcon className={cn("w-4 h-4", isPrimaryBlock ? "text-primary" : "text-muted-foreground")} />
            </div>
            <div>
              <h3 className={cn("font-semibold", isPrimaryBlock ? "text-base" : "text-sm")}>
                {isRussian ? entityConfig.pluralRu : entityConfig.pluralEn}
              </h3>
              <span className="text-xs text-muted-foreground">
                {items.length} {isRussian ? 'вариантов' : 'options'}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-xs"
            onClick={() => navigate(entityConfig.route)}
          >
            {isRussian ? 'Все' : 'View all'}
            <ChevronRight className="w-3 h-3" />
          </Button>
        </div>

        <div className={cn(
          "grid gap-3",
          isPrimaryBlock ? "grid-cols-2" : "grid-cols-3"
        )}>
          {items.slice(0, isPrimaryBlock ? 4 : 3).map((item) => (
            <button
              key={item.entity_id}
              onClick={() => navigate(`${entityConfig.route}/${item.entity_id}`)}
              className={cn(
                "p-3 rounded-xl border bg-background text-left",
                "hover:border-primary/30 hover:shadow-sm transition-all",
                isPrimaryBlock && "p-4"
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <EntityIcon className={cn(
                  "text-muted-foreground",
                  isPrimaryBlock ? "w-6 h-6" : "w-5 h-5"
                )} />
                {item.trust_level === 'verified' && (
                  <Shield className="w-3 h-3 text-primary" />
                )}
              </div>
              {/* UX Fix: Allow 2 lines instead of truncate for better readability */}
              <p className={cn(
                "font-medium line-clamp-2",
                isPrimaryBlock ? "text-sm" : "text-xs"
              )}>
                {item.title_localized || item.title || (isRussian ? entityConfig.labelRu : entityConfig.labelEn)}
              </p>
              {item.price && (
                <p className="text-xs text-muted-foreground mt-1">
                  {item.currency} {item.price.toLocaleString()}
                </p>
              )}
              {/* UX Fix: Add "Match" prefix for clarity */}
              <div className="mt-2 flex items-center gap-1">
                <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary/60"
                    style={{ width: `${item.weight}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {isRussian ? 'Релев.' : 'Match'} {item.weight}%
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>
    );
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        {/* ═══════════════════════════════════════════════════════════
            HEADER - Per UX Contract §4.2: Life Situation Header
            ═══════════════════════════════════════════════════════════ */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
          <div className="flex items-center gap-3 p-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            {currentSituation && (
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${currentSituation.color}15` }}
                >
                  <SituationIcon
                    className="w-5 h-5"
                    style={{ color: currentSituation.color }}
                  />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg font-semibold truncate">
                    {isRussian ? currentSituation.title_ru : currentSituation.title_en}
                  </h1>
                  {currentSituation.description_en && (
                    <p className="text-sm text-muted-foreground truncate">
                      {isRussian ? currentSituation.description_ru : currentSituation.description_en}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Context Badge - Per UX Contract §3.2 */}
          <div className="px-4 pb-3">
            <LifeSituationBadge />
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-4 space-y-6">
          {isLoading ? (
            // Loading state
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-6 w-32" />
                  <div className="grid grid-cols-2 gap-3">
                    <Skeleton className="h-28 rounded-xl" />
                    <Skeleton className="h-28 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : !hasCatalogItems ? (
            // ═══════════════════════════════════════════════════════════
            // GUIDED FALLBACK - Per UX Contract §4.1: Never "No results"
            // ═══════════════════════════════════════════════════════════
            <GuidedFallback 
              situationTitle={
                currentSituation 
                  ? (isRussian ? currentSituation.title_ru : currentSituation.title_en)
                  : undefined
              } 
            />
          ) : (
            <>
              {/* ═══════════════════════════════════════════════════════════
                  PRIMARY BLOCKS - Per UX Contract §4.3: 1-2 key blocks
                  ═══════════════════════════════════════════════════════════ */}
              {Object.entries(primaryBlocks).map(([type, items]) => 
                renderBlock(type, items, true)
              )}

              {/* ═══════════════════════════════════════════════════════════
                  SECONDARY BLOCKS - Per UX Contract §4.3: 1-3 supporting
                  ═══════════════════════════════════════════════════════════ */}
              {Object.keys(secondaryBlocks).length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-sm font-medium text-muted-foreground">
                    {isRussian ? 'Также может пригодиться' : 'You might also need'}
                  </h2>
                  {Object.entries(secondaryBlocks).slice(0, 3).map(([type, items]) => 
                    renderBlock(type, items, false)
                  )}
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════
                  EXPLORE MORE - Per UX Contract §4.2: Catalog access
                  ═══════════════════════════════════════════════════════════ */}
              <div className="pt-4 border-t">
                <Link 
                  to="/discover"
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl",
                    "bg-muted/50 hover:bg-muted transition-colors"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Compass className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {isRussian ? 'Исследовать каталог' : 'Explore Catalog'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isRussian ? 'Все услуги и товары' : 'All services and products'}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
