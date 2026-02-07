/**
 * LifeFlowPage - LIFE OS resolver page (Redesigned)
 * Features: Quick nav chips, photo-enriched cards, trust badges, category sections
 */
import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLifeSituationContext } from '@/contexts/LifeSituationContext';
import { 
  useLifeSituations, 
  useResolveLifeOSContext,
  getLifeOSAIContext,
} from '@/hooks/useLifeOS';
import { useEnrichCatalogItems, type EnrichedCatalogItem } from '@/hooks/useEnrichCatalogItems';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { GuidedFallback } from '@/components/life-flow/GuidedFallback';
import { LifeFlowCategoryChips } from '@/components/life-flow/LifeFlowCategoryChips';
import { LifeFlowEntityCard } from '@/components/life-flow/LifeFlowEntityCard';
import { 
  ArrowLeft, Compass, ArrowRight, ChevronRight, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { getEntityType } from '@/lib/config/entityTypes';
import { motion } from 'framer-motion';

export default function LifeFlowPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const { setLifeSituation } = useLifeSituationContext();
  const [activeFilter, setActiveFilter] = React.useState<string | null>(null);

  const { data: situations } = useLifeSituations();
  const { data: catalogItems, isLoading } = useResolveLifeOSContext(code || null, { limit: 50 });
  const { data: enrichedItems } = useEnrichCatalogItems(catalogItems);

  const currentSituation = situations?.find((s) => s.code === code);

  // Set context when page loads
  React.useEffect(() => {
    if (currentSituation) {
      const title = isRussian ? currentSituation.title_ru : currentSituation.title_en;
      setLifeSituation(currentSituation.code, title, currentSituation.color);
    }
  }, [currentSituation, isRussian, setLifeSituation]);

  // Log AI context
  React.useEffect(() => {
    if (currentSituation && catalogItems?.length) {
      console.debug('[LIFE OS] AI Context:', getLifeOSAIContext(currentSituation, catalogItems));
    }
  }, [currentSituation, catalogItems]);

  // Group enriched items by entity type, split primary/secondary by WEIGHT
  const { primaryBlocks, secondaryBlocks, allEntityTypes, itemCounts } = React.useMemo(() => {
    const items = enrichedItems || [];
    
    // Group by entity type and calculate average weight per group
    const grouped: Record<string, EnrichedCatalogItem[]> = {};
    const avgWeights: Record<string, number> = {};
    
    items.forEach(item => {
      if (!grouped[item.entity_type]) grouped[item.entity_type] = [];
      grouped[item.entity_type].push(item);
    });

    // Calculate average weight per entity type group
    Object.entries(grouped).forEach(([type, typeItems]) => {
      const totalWeight = typeItems.reduce((sum, item) => sum + (item.weight || 0), 0);
      avgWeights[type] = totalWeight / typeItems.length;
    });

    const PRIMARY_WEIGHT_THRESHOLD = 65;
    const primary: typeof grouped = {};
    const secondary: typeof grouped = {};
    const counts: Record<string, number> = {};

    // Sort entity types by average weight descending
    const sortedTypes = Object.keys(grouped).sort((a, b) => (avgWeights[b] || 0) - (avgWeights[a] || 0));

    sortedTypes.forEach(type => {
      counts[type] = grouped[type].length;
      // Sort items within each group by weight descending
      grouped[type].sort((a, b) => (b.weight || 0) - (a.weight || 0));
      
      if (avgWeights[type] >= PRIMARY_WEIGHT_THRESHOLD) {
        primary[type] = grouped[type];
      } else {
        secondary[type] = grouped[type];
      }
    });

    const allTypes = [...Object.keys(primary), ...Object.keys(secondary)];

    return { primaryBlocks: primary, secondaryBlocks: secondary, allEntityTypes: allTypes, itemCounts: counts };
  }, [enrichedItems]);

  const getIcon = (iconName: string): LucideIcon => {
    const icons = LucideIcons as unknown as Record<string, LucideIcon>;
    return icons[iconName] || Compass;
  };

  const SituationIcon = currentSituation ? getIcon(currentSituation.icon) : Compass;
  const hasCatalogItems = Object.keys(primaryBlocks).length > 0 || Object.keys(secondaryBlocks).length > 0;

  // Render a category section
  const renderSection = (entityType: string, items: EnrichedCatalogItem[], isPrimaryBlock: boolean, sectionIndex: number) => {
    if (activeFilter && activeFilter !== entityType) return null;
    
    const entityConfig = getEntityType(entityType);
    const EntityIcon = entityConfig.icon;

    return (
      <motion.section 
        key={entityType} 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: sectionIndex * 0.08 }}
        className="space-y-3"
        id={`section-${entityType}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center",
              isPrimaryBlock 
                ? "bg-gradient-to-br from-primary/20 to-primary/5" 
                : "bg-muted"
            )}>
              <EntityIcon className={cn(
                "w-4.5 h-4.5", 
                isPrimaryBlock ? "text-primary" : "text-muted-foreground"
              )} />
            </div>
            <div>
              <h3 className={cn("font-semibold leading-tight", isPrimaryBlock ? "text-base" : "text-sm")}>
                {isRussian ? entityConfig.pluralRu : entityConfig.pluralEn}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                {items.length} {isRussian ? 'вариантов' : 'options'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-xs font-medium text-primary hover:text-primary h-8"
            onClick={() => navigate(entityConfig.route)}
          >
            {isRussian ? 'Все' : 'View all'}
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Cards grid */}
        <div className={cn(
          "grid gap-3",
          isPrimaryBlock ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"
        )}>
          {items.slice(0, isPrimaryBlock ? 4 : 3).map((item, idx) => (
            <LifeFlowEntityCard
              key={item.entity_id}
              item={item}
              isPrimary={isPrimaryBlock}
              index={sectionIndex * 4 + idx}
            />
          ))}
        </div>
      </motion.section>
    );
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        {/* HERO HEADER */}
        <div 
          className="relative overflow-hidden"
          style={{
            background: currentSituation?.color 
              ? `linear-gradient(135deg, ${currentSituation.color}15 0%, ${currentSituation.color}05 50%, transparent 100%)`
              : undefined
          }}
        >
          <div className="absolute inset-0 opacity-30">
            <div 
              className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl"
              style={{ backgroundColor: currentSituation?.color || 'hsl(var(--primary))' }}
            />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 p-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="shrink-0 bg-background/80 backdrop-blur-sm"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </div>
            
            {currentSituation && (
              <div className="px-4 pb-5">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-4"
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg"
                    style={{ 
                      background: `linear-gradient(135deg, ${currentSituation.color}30, ${currentSituation.color}10)`,
                      boxShadow: `0 8px 24px ${currentSituation.color}20`
                    }}
                  >
                    <SituationIcon
                      className="w-7 h-7"
                      style={{ color: currentSituation.color }}
                    />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <h1 className="text-lg font-bold mb-0.5">
                      {isRussian ? currentSituation.title_ru : currentSituation.title_en}
                    </h1>
                    {currentSituation.description_en && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {isRussian ? currentSituation.description_ru : currentSituation.description_en}
                      </p>
                    )}
                    {hasCatalogItems && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs font-medium">
                          {enrichedItems?.length || catalogItems?.length || 0} {isRussian ? 'рекомендаций' : 'recommendations'}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-4 space-y-5">
          {isLoading ? (
            <div className="space-y-5">
              {[1, 2].map((i) => (
                <div key={i} className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <Skeleton className="w-9 h-9 rounded-xl" />
                    <div>
                      <Skeleton className="h-4 w-28 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Skeleton className="h-44 rounded-xl" />
                    <Skeleton className="h-44 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : !hasCatalogItems ? (
            <GuidedFallback 
              situationTitle={
                currentSituation 
                  ? (isRussian ? currentSituation.title_ru : currentSituation.title_en)
                  : undefined
              } 
            />
          ) : (
            <>
              {/* Quick Nav Chips */}
              <LifeFlowCategoryChips
                entityTypes={allEntityTypes}
                activeType={activeFilter}
                onSelect={setActiveFilter}
                itemCounts={itemCounts}
              />

              {/* PRIMARY BLOCKS */}
              {Object.keys(primaryBlocks).length > 0 && (
                <div className="space-y-5">
                  {Object.entries(primaryBlocks).map(([type, items], index) => 
                    renderSection(type, items, true, index)
                  )}
                </div>
              )}

              {/* SECONDARY BLOCKS */}
              {Object.keys(secondaryBlocks).length > 0 && !activeFilter && (
                <div className="space-y-5 pt-1">
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-[11px] font-medium text-muted-foreground px-2">
                      {isRussian ? 'Также пригодится' : 'Also useful'}
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  {Object.entries(secondaryBlocks).map(([type, items], index) => 
                    renderSection(type, items, false, Object.keys(primaryBlocks).length + index)
                  )}
                </div>
              )}

              {/* When filtering secondary, show them without separator */}
              {activeFilter && secondaryBlocks[activeFilter] && (
                <div className="space-y-5">
                  {renderSection(activeFilter, secondaryBlocks[activeFilter], false, 0)}
                </div>
              )}

              {/* EXPLORE MORE CTA */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="pt-2"
              >
                <Link 
                  to="/discover"
                  className={cn(
                    "flex items-center justify-between p-4 rounded-2xl",
                    "bg-gradient-to-br from-primary/10 via-primary/5 to-transparent",
                    "border border-primary/20 hover:border-primary/40",
                    "hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Compass className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">
                        {isRussian ? 'Исследовать каталог' : 'Explore Full Catalog'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isRussian ? 'Все услуги и товары' : 'All services and products'}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-primary" />
                </Link>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
