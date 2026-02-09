/**
 * LifeFlowPage - LifeOS Guided Path
 * Structure: Recognition → Reassurance → What Matters → Recommended → Alternatives → CTA → Next Routes
 * Philosophy: Pain relief & friction removal, not catalog browsing
 * 
 * Visual: Calm, no gradients, no decorative shadows, trust-first.
 */
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { ArrowLeft, Compass, ArrowRight, Car, Palmtree, Home, Plus, Sparkles, Calendar, Banknote } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

function PropertyQuickAction({ icon: Icon, title, subtitle, onClick, accent }: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  onClick: () => void;
  accent?: boolean;
}) {
  return (
    <button
      className="w-full rounded-2xl border border-border/60 bg-card p-4 text-left hover:shadow-sm active:scale-[0.99] transition-all touch-manipulation"
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
          accent ? "bg-primary/8" : "bg-muted"
        )}>
          <Icon className={cn("w-5 h-5", accent ? "text-primary" : "text-muted-foreground")} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
      </div>
    </button>
  );
}

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
        {/* HEADER — calm, no gradients */}
        <div className="border-b border-border/50">
          <div className="flex items-center gap-3 p-4">
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
            <div className="px-4 pb-5">
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
                </div>
              </motion.div>
            </div>
          )}
        </div>

        {/* GUIDED PATH CONTENT */}
        <div className="p-4 space-y-6 max-w-lg mx-auto">
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
              {/* Recognition → Reassurance → What Matters */}
              <RouteRecognitionBlock
                recognition={isRussian ? route.recognition_ru : route.recognition_en}
                reassurance={isRussian ? route.reassurance_ru : route.reassurance_en}
                whatMatters={isRussian ? route.what_matters_ru : route.what_matters_en}
                accentColor={currentSituation?.color}
              />

              <div className="h-px bg-border/50" />

              {/* Recommended + Alternatives */}
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

              {/* Insurance prompt */}
              {code && shouldShowInsurancePrompt(code) && (
                <InsurancePromptBlock
                  routeCode={code}
                  accentColor={currentSituation?.color}
                />
              )}

              {/* Next routes */}
              <RouteNextSteps
                nextRoutes={route.next_routes}
                labels={isRussian ? route.next_routes_labels_ru : route.next_routes_labels_en}
                currentLabel={isRussian ? 'Что может понадобиться дальше' : 'What you may need next'}
              />

              {/* Quick actions — context-dependent */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-2"
              >
                {code === 'property' ? (
                  <>
                    <PropertyQuickAction
                      icon={Home}
                      title={isRussian ? 'Управление объектами' : 'Manage Properties'}
                      subtitle={isRussian ? 'Все ваши объекты в одном месте' : 'All your properties in one place'}
                      onClick={() => navigate('/owner')}
                      accent
                    />
                    <PropertyQuickAction
                      icon={Plus}
                      title={isRussian ? 'Добавить объект' : 'Add Property'}
                      subtitle={isRussian ? 'Зарегистрировать новую недвижимость' : 'Register a new property'}
                      onClick={() => navigate('/owner/properties/new')}
                    />
                    <PropertyQuickAction
                      icon={Sparkles}
                      title={isRussian ? 'Заказать уборку' : 'Order Cleaning'}
                      subtitle={isRussian ? 'Клининг перед заездом или после выезда' : 'Cleaning before check-in or after check-out'}
                      onClick={() => navigate('/owner/service-request?type=cleaning')}
                    />
                    <PropertyQuickAction
                      icon={Calendar}
                      title={isRussian ? 'Календарь бронирований' : 'Booking Calendar'}
                      subtitle={isRussian ? 'Расписание заездов и выездов' : 'Check-in and check-out schedule'}
                      onClick={() => navigate('/owner/calendar')}
                    />
                    <PropertyQuickAction
                      icon={Banknote}
                      title={isRussian ? 'Финансы и расходы' : 'Financials & Expenses'}
                      subtitle={isRussian ? 'Доходы, налоги, депозиты' : 'Income, taxes, deposits'}
                      onClick={() => navigate('/owner/financials')}
                    />
                  </>
                ) : (
                  <>
                    <button
                      className="w-full rounded-2xl border border-border/60 bg-card p-4 text-left hover:shadow-sm active:scale-[0.99] transition-all touch-manipulation"
                      onClick={() => navigate('/transport/airport-transfer')}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
                          <Car className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold">
                            {isRussian ? 'Забронировать трансфер' : 'Book Airport Transfer'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {isRussian ? 'Машина будет ждать вас у выхода' : 'Your car will be waiting at the exit'}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                      </div>
                    </button>
                    <button
                      className="w-full rounded-2xl border border-border/60 bg-card p-4 text-left hover:shadow-sm active:scale-[0.99] transition-all touch-manipulation"
                      onClick={() => navigate('/trip-planner')}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                          <Palmtree className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold">
                            {isRussian ? 'Полный план поездки' : 'Full Trip Planner'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {isRussian ? 'Билеты, страховка, Arrival Card — всё в одном месте' : 'Flights, insurance, Arrival Card — all in one place'}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                      </div>
                    </button>
                  </>
                )}
              </motion.div>

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
                  ? 'Мы рядом. Если нужна помощь — напишите нам в любое время.'
                  : "We're here for you. Reach out anytime you need help."}
              </motion.p>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}