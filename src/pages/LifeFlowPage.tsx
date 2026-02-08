/**
 * LifeFlowPage - LifeOS Guided Path
 * Structure: Recognition → Reassurance → What Matters → Recommended → Alternatives → CTA → Next Routes
 * Philosophy: Pain relief & friction removal, not catalog browsing
 */
import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLifeSituationContext } from '@/contexts/LifeSituationContext';
import { useLifeSituations, useResolveLifeOSContext } from '@/hooks/useLifeOS';
import { useLifeOSRoute } from '@/hooks/useLifeOSRoutes';
import { useEnrichCatalogItems, type EnrichedCatalogItem } from '@/hooks/useEnrichCatalogItems';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { WhatsAppConciergeBlock } from '@/components/life-flow/WhatsAppConciergeBlock';
import { Skeleton } from '@/components/ui/skeleton';
import { GuidedFallback } from '@/components/life-flow/GuidedFallback';
import { RouteRecognitionBlock } from '@/components/life-flow/RouteRecognitionBlock';
import { RouteRecommendedBlock } from '@/components/life-flow/RouteRecommendedBlock';
import { RouteNextSteps } from '@/components/life-flow/RouteNextSteps';
import { InsurancePromptBlock, shouldShowInsurancePrompt } from '@/components/life-flow/InsurancePromptBlock';
import { ArrowLeft, Compass, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LifeFlowPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const { setLifeSituation } = useLifeSituationContext();

  const { data: situations } = useLifeSituations();
  const currentSituation = situations?.find((s) => s.code === code);

  // Fetch route data
  const { data: route, isLoading: routeLoading } = useLifeOSRoute(currentSituation?.id || null);
  
  // Fetch catalog items for enriching recommended + alternatives
  const { data: catalogItems } = useResolveLifeOSContext(code || null, { limit: 50 });
  const { data: enrichedItems } = useEnrichCatalogItems(catalogItems);

  // Set context when page loads
  React.useEffect(() => {
    if (currentSituation) {
      const title = isRussian ? currentSituation.title_ru : currentSituation.title_en;
      setLifeSituation(currentSituation.code, title, currentSituation.color);
    }
  }, [currentSituation, isRussian, setLifeSituation]);

  // Find recommended and alternative items from enriched data
  const recommendedItem = React.useMemo(() => {
    if (!route?.recommended_entity_id || !enrichedItems) return null;
    return enrichedItems.find(item => item.entity_id === route.recommended_entity_id) || null;
  }, [route, enrichedItems]);

  const alternativeItems = React.useMemo(() => {
    if (!route?.alternative_entity_ids?.length || !enrichedItems) return [];
    return route.alternative_entity_ids
      .map(id => enrichedItems.find(item => item.entity_id === id))
      .filter(Boolean) as EnrichedCatalogItem[];
  }, [route, enrichedItems]);

  const getIcon = (iconName: string): LucideIcon => {
    const icons = LucideIcons as unknown as Record<string, LucideIcon>;
    return icons[iconName] || Compass;
  };

  const SituationIcon = currentSituation ? getIcon(currentSituation.icon) : Compass;
  const isLoading = routeLoading;

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        {/* HERO HEADER — compact, empathetic */}
        <div
          className="relative overflow-hidden"
          style={{
            background: currentSituation?.color
              ? `linear-gradient(135deg, ${currentSituation.color}15 0%, ${currentSituation.color}05 50%, transparent 100%)`
              : undefined,
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
                      boxShadow: `0 8px 24px ${currentSituation.color}20`,
                    }}
                  >
                    <SituationIcon className="w-7 h-7" style={{ color: currentSituation.color }} />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <h1 className="text-lg font-bold mb-0.5">
                      {isRussian ? currentSituation.title_ru : currentSituation.title_en}
                    </h1>
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        </div>

        {/* GUIDED PATH CONTENT */}
        <div className="p-4 space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="space-y-2 pt-2">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
              </div>
              <Skeleton className="h-52 w-full rounded-2xl mt-4" />
            </div>
          ) : !route ? (
            <GuidedFallback
              situationTitle={
                currentSituation
                  ? isRussian ? currentSituation.title_ru : currentSituation.title_en
                  : undefined
              }
            />
          ) : (
            <>
              {/* 1-3: Recognition → Reassurance → What Matters */}
              <RouteRecognitionBlock
                recognition={isRussian ? route.recognition_ru : route.recognition_en}
                reassurance={isRussian ? route.reassurance_ru : route.reassurance_en}
                whatMatters={isRussian ? route.what_matters_ru : route.what_matters_en}
                accentColor={currentSituation?.color}
              />

              {/* Soft separator */}
              <div className="h-px bg-border" />

              {/* 4-5: Recommended + Alternatives */}
              <RouteRecommendedBlock
                title={isRussian ? route.recommended_title_ru : route.recommended_title_en}
                why={isRussian ? route.recommended_why_ru : route.recommended_why_en}
                ctaText={isRussian ? route.cta_text_ru : route.cta_text_en}
                ctaType={route.cta_type}
                ctaTarget={route.cta_target}
                accentColor={currentSituation?.color}
                recommendedItem={recommendedItem}
                alternatives={alternativeItems}
              />

              {/* Insurance prompt — contextual, between recommended and next steps */}
              {code && shouldShowInsurancePrompt(code) && (
                <InsurancePromptBlock
                  routeCode={code}
                  accentColor={currentSituation?.color}
                />
              )}

              {/* 7: Next routes */}
              <RouteNextSteps
                nextRoutes={route.next_routes}
                labels={isRussian ? route.next_routes_labels_ru : route.next_routes_labels_en}
                currentLabel={isRussian ? 'После этого вам может понадобиться' : 'After this, you may need'}
              />

              {/* Quick actions: Transfer + Trip Planner */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="space-y-2"
              >
                {/* Book Transfer CTA */}
                <div
                  className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-4 cursor-pointer hover:shadow-md hover:border-primary/40 transition-all"
                  onClick={() => navigate('/transport/airport-transfer')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-primary/15">
                      <LucideIcons.Car className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">
                        {isRussian ? 'Забронировать трансфер' : 'Book Airport Transfer'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isRussian
                          ? 'Машина будет ждать вас у выхода из аэропорта'
                          : 'Your car will be waiting at the airport exit'}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-primary shrink-0" />
                  </div>
                </div>

                {/* Trip Planner CTA */}
                <div
                  className="rounded-2xl border border-border bg-card p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate('/trip-planner')}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        background: currentSituation?.color
                          ? `linear-gradient(135deg, ${currentSituation.color}25, ${currentSituation.color}10)`
                          : undefined,
                      }}
                    >
                      <LucideIcons.Palmtree className="w-5 h-5" style={{ color: currentSituation?.color || 'hsl(var(--primary))' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">
                        {isRussian ? 'Полный план поездки' : 'Full Trip Planner'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isRussian
                          ? 'Билеты, страховка, Arrival Card — всё в одном месте'
                          : 'Flights, insurance, Arrival Card — all in one place'}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                  </div>
                </div>
              </motion.div>

              {/* WhatsApp concierge CTA */}
              <WhatsAppConciergeBlock context="trip" />

              {/* Quiet footer — not a CTA, just an escape hatch */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-center text-xs text-muted-foreground/60 pt-4 pb-2"
              >
                {isRussian 
                  ? 'Мы с вами. Если нужна помощь — напишите нам.'
                  : "We're with you. If you need help — reach out."}
              </motion.p>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
