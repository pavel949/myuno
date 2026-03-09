/**
 * LifeFlowPage - LifeOS Guided Path
 * Structure: Intro (Recognition + Reassurance) → What Matters → Catalog Cards → Next Routes → Concierge
 * Philosophy: Brief empathetic intro, then real mapped services/products
 */
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLifeSituationContext } from '@/contexts/LifeSituationContext';
import { useLifeSituations, useResolveLifeOSContext } from '@/hooks/useLifeOS';
import { useLifeOSRoute } from '@/hooks/useLifeOSRoutes';
import { useEnrichCatalogItems } from '@/hooks/useEnrichCatalogItems';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { WhatsAppConciergeBlock } from '@/components/life-flow/WhatsAppConciergeBlock';
import { Skeleton } from '@/components/ui/skeleton';
import { GuidedFallback } from '@/components/life-flow/GuidedFallback';
import { RouteRecognitionBlock } from '@/components/life-flow/RouteRecognitionBlock';
import { RouteNextSteps } from '@/components/life-flow/RouteNextSteps';
import { LifeFlowCatalogGrid } from '@/components/life-flow/LifeFlowCatalogGrid';
import { InsurancePromptBlock, shouldShowInsurancePrompt } from '@/components/life-flow/InsurancePromptBlock';
import { ArrowLeft, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DynamicIcon } from '@/components/ui/dynamic-icon';
import { motion } from 'framer-motion';

export default function LifeFlowPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const { setLifeSituation } = useLifeSituationContext();

  const { data: situations } = useLifeSituations();
  const currentSituation = situations?.find((s) => s.code === code);

  const { data: route, isLoading: routeLoading } = useLifeOSRoute(currentSituation?.id || null);
  const { data: catalogItems } = useResolveLifeOSContext(code || null, { limit: 50 });
  const { data: enrichedItems } = useEnrichCatalogItems(catalogItems);

  React.useEffect(() => {
    if (currentSituation) {
      const title = isRussian ? currentSituation.title_ru : currentSituation.title_en;
      setLifeSituation(currentSituation.code, title, currentSituation.color);
    }
  }, [currentSituation, isRussian, setLifeSituation]);

  const situationIconName = currentSituation?.icon || 'compass';
  const isLoading = routeLoading;

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        {/* HEADER */}
        <div className="border-b border-border/50">
          <div className="flex items-center gap-3 p-4 max-w-5xl mx-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </div>

          {currentSituation && (
            <div className="px-4 pb-5 max-w-5xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
                  <SituationIcon className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <h1 className="text-xl font-bold">
                    {isRussian ? currentSituation.title_ru : currentSituation.title_en}
                  </h1>
                  {currentSituation.description_en && (
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      {isRussian ? currentSituation.description_ru : currentSituation.description_en}
                    </p>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </div>

        {/* CONTENT */}
        <div className="p-4 space-y-6 max-w-5xl mx-auto">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-32 w-full rounded-2xl mt-4" />
              <Skeleton className="h-32 w-full rounded-2xl" />
            </div>
          ) : !route && (!enrichedItems || enrichedItems.length === 0) ? (
            <GuidedFallback
              situationTitle={
                currentSituation
                  ? isRussian ? currentSituation.title_ru : currentSituation.title_en
                  : undefined
              }
            />
          ) : (
            <>
              {/* Recognition + Reassurance + What Matters — brief intro */}
              {route && (
                <RouteRecognitionBlock
                  recognition={isRussian ? route.recognition_ru : route.recognition_en}
                  reassurance={isRussian ? route.reassurance_ru : route.reassurance_en}
                  whatMatters={isRussian ? route.what_matters_ru : route.what_matters_en}
                  accentColor={currentSituation?.color}
                />
              )}

              {route && <div className="h-px bg-border/50" />}

              {/* Catalog cards grouped by entity_type */}
              {enrichedItems && enrichedItems.length > 0 && (
                <LifeFlowCatalogGrid
                  items={enrichedItems}
                  accentColor={currentSituation?.color}
                />
              )}

              {/* Insurance prompt */}
              {code && shouldShowInsurancePrompt(code) && (
                <InsurancePromptBlock
                  routeCode={code}
                  accentColor={currentSituation?.color}
                />
              )}

              {/* Next routes */}
              {route && (
                <RouteNextSteps
                  nextRoutes={route.next_routes}
                  labels={isRussian ? route.next_routes_labels_ru : route.next_routes_labels_en}
                  currentLabel={isRussian ? 'Что может понадобиться дальше' : 'What you may need next'}
                />
              )}

              {/* WhatsApp concierge */}
              <WhatsAppConciergeBlock context="trip" />

              {/* Footer */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-center text-xs text-muted-foreground/50 pt-4 pb-2"
              >
                {isRussian
                  ? 'Если нужна помощь — напишите. Отвечаем каждый день.'
                  : 'Need help? Write to us. We respond daily.'}
              </motion.p>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
