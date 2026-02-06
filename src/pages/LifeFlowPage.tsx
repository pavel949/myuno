/**
 * LifeFlowPage - LIFE OS resolver page
 * Per UX Contract §4.2: Header → Suggested Blocks → Explore More
 * Per UX Contract §4.1: NEVER show "No results" - always guided fallback
 * 
 * Enhanced with LIFE OS:
 * - Role-aware catalog resolution
 * - Locale-aware title display
 * - AI-readable context structure
 * - Premium visual design
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
import { GuidedFallback } from '@/components/life-flow/GuidedFallback';
import { 
  ArrowLeft, Compass, ArrowRight, ChevronRight, Shield, Sparkles, Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { getEntityType, isPrimaryEntityType } from '@/lib/config/entityTypes';
import { motion } from 'framer-motion';

export default function LifeFlowPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const { setLifeSituation } = useLifeSituationContext();

  const { data: situations } = useLifeSituations();
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

  // Render a suggested block section with enhanced visuals
  const renderBlock = (entityType: string, items: LifeOSCatalogItem[], isPrimaryBlock: boolean, index: number) => {
    const entityConfig = getEntityType(entityType);
    const EntityIcon = entityConfig.icon;

    return (
      <motion.section 
        key={entityType} 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className={cn(
          "space-y-4",
          isPrimaryBlock && "bg-gradient-to-br from-card via-card to-muted/30 rounded-2xl p-5 border shadow-sm"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm",
                isPrimaryBlock 
                  ? "bg-gradient-to-br from-primary/20 to-primary/5" 
                  : "bg-muted"
              )}
            >
              <EntityIcon className={cn(
                "w-5 h-5", 
                isPrimaryBlock ? "text-primary" : "text-muted-foreground"
              )} />
            </div>
            <div>
              <h3 className={cn("font-semibold", isPrimaryBlock ? "text-lg" : "text-base")}>
                {isRussian ? entityConfig.pluralRu : entityConfig.pluralEn}
              </h3>
              <p className="text-xs text-muted-foreground">
                {items.length} {isRussian ? 'рекомендаций' : 'recommendations'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-sm font-medium text-primary hover:text-primary"
            onClick={() => navigate(entityConfig.route)}
          >
            {isRussian ? 'Все' : 'View all'}
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className={cn(
          "grid gap-3",
          isPrimaryBlock ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2 sm:grid-cols-3"
        )}>
          {items.slice(0, isPrimaryBlock ? 4 : 3).map((item, itemIndex) => (
            <motion.button
              key={item.entity_id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 + itemIndex * 0.05 }}
              onClick={() => navigate(`${entityConfig.route}/${item.entity_id}`)}
              className={cn(
                "group relative overflow-hidden rounded-xl border bg-card text-left transition-all duration-200",
                "hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5",
                isPrimaryBlock ? "p-4" : "p-3"
              )}
            >
              {/* Subtle gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative">
                <div className="flex items-start justify-between mb-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    isPrimaryBlock ? "bg-primary/10" : "bg-muted"
                  )}>
                    <EntityIcon className={cn(
                      isPrimaryBlock ? "w-5 h-5 text-primary" : "w-4 h-4 text-muted-foreground"
                    )} />
                  </div>
                  <div className="flex items-center gap-1">
                    {item.trust_level === 'verified' && (
                      <div className="p-1 rounded-full bg-primary/10">
                        <Shield className="w-3 h-3 text-primary" />
                      </div>
                    )}
                    {item.weight >= 80 && (
                      <div className="p-1 rounded-full bg-amber-500/10">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      </div>
                    )}
                  </div>
                </div>
                
                <p className={cn(
                  "font-medium line-clamp-2 mb-2",
                  isPrimaryBlock ? "text-sm" : "text-xs"
                )}>
                  {item.title_localized || item.title || (isRussian ? entityConfig.labelRu : entityConfig.labelEn)}
                </p>
                
                {item.price && (
                  <p className={cn(
                    "font-semibold text-primary",
                    isPrimaryBlock ? "text-base" : "text-sm"
                  )}>
                    {item.currency} {item.price.toLocaleString()}
                  </p>
                )}
                
                {/* Match indicator with improved design */}
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.weight}%` }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                      className={cn(
                        "h-full rounded-full",
                        item.weight >= 80 
                          ? "bg-gradient-to-r from-primary to-amber-500" 
                          : "bg-primary/60"
                      )}
                    />
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium whitespace-nowrap",
                    item.weight >= 80 ? "text-primary" : "text-muted-foreground"
                  )}>
                    {item.weight}%
                  </span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.section>
    );
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        {/* ═══════════════════════════════════════════════════════════
            HERO HEADER - Enhanced with gradient and visual depth
            ═══════════════════════════════════════════════════════════ */}
        <div 
          className="relative overflow-hidden"
          style={{
            background: currentSituation?.color 
              ? `linear-gradient(135deg, ${currentSituation.color}15 0%, ${currentSituation.color}05 50%, transparent 100%)`
              : undefined
          }}
        >
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-30">
            <div 
              className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl"
              style={{ backgroundColor: currentSituation?.color || 'hsl(var(--primary))' }}
            />
          </div>

          <div className="relative z-10">
            {/* Navigation */}
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
            
            {/* Situation info */}
            {currentSituation && (
              <div className="px-4 pb-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-4"
                >
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg"
                    style={{ 
                      background: `linear-gradient(135deg, ${currentSituation.color}30, ${currentSituation.color}10)`,
                      boxShadow: `0 8px 24px ${currentSituation.color}20`
                    }}
                  >
                    <SituationIcon
                      className="w-8 h-8"
                      style={{ color: currentSituation.color }}
                    />
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <h1 className="text-xl font-bold mb-1">
                      {isRussian ? currentSituation.title_ru : currentSituation.title_en}
                    </h1>
                    {currentSituation.description_en && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {isRussian ? currentSituation.description_ru : currentSituation.description_en}
                      </p>
                    )}
                  </div>
                </motion.div>

                {/* Quick stats */}
                {hasCatalogItems && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center gap-3 mt-4"
                  >
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/80 backdrop-blur-sm border text-xs font-medium">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      <span>
                        {catalogItems?.length || 0} {isRussian ? 'рекомендаций' : 'recommendations'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/80 backdrop-blur-sm border text-xs font-medium text-muted-foreground">
                      {isRussian ? 'Персонально для вас' : 'Personalized for you'}
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-4 space-y-6">
          {isLoading ? (
            // Loading state with improved skeletons
            <div className="space-y-6">
              {[1, 2].map((i) => (
                <div key={i} className="space-y-4 p-5 rounded-2xl bg-card border">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-xl" />
                    <div>
                      <Skeleton className="h-5 w-32 mb-1" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Skeleton className="h-32 rounded-xl" />
                    <Skeleton className="h-32 rounded-xl" />
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
              {/* PRIMARY BLOCKS */}
              {Object.entries(primaryBlocks).map(([type, items], index) => 
                renderBlock(type, items, true, index)
              )}

              {/* SECONDARY BLOCKS */}
              {Object.keys(secondaryBlocks).length > 0 && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs font-medium text-muted-foreground px-2">
                      {isRussian ? 'Также может пригодиться' : 'You might also need'}
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  {Object.entries(secondaryBlocks).slice(0, 3).map(([type, items], index) => 
                    renderBlock(type, items, false, Object.keys(primaryBlocks).length + index)
                  )}
                </div>
              )}

              {/* EXPLORE MORE CTA */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="pt-4"
              >
                <Link 
                  to="/discover"
                  className={cn(
                    "flex items-center justify-between p-5 rounded-2xl",
                    "bg-gradient-to-br from-primary/10 via-primary/5 to-transparent",
                    "border border-primary/20 hover:border-primary/40",
                    "hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Compass className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-base">
                        {isRussian ? 'Исследовать каталог' : 'Explore Full Catalog'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {isRussian ? 'Все услуги и товары платформы' : 'All platform services and products'}
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