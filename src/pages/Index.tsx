/**
 * Index — LifeOS Dashboard
 * 
 * Clean, calm, confident layout:
 * 1. Hero (greeting + weather + loyalty)
 * 2. Quick Actions (8 role-adaptive shortcuts)
 * 3. Smart tip (contextual, dismissable)
 * 4. Products (marketplace carousel)
 * 5. Services (photo cards — non-duplicate categories)
 * 6. Support (concierge + compact emergency)
 * 7. Trust
 */
import React, { useState, useCallback, lazy, Suspense } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLifeSituationContext } from '@/contexts/LifeSituationContext';
import { SEOHead, createOrganizationSchema } from '@/components/seo';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { HeroBlock } from '@/components/home/HeroBlock';
import { QuickActionsGrid } from '@/components/home/QuickActionsGrid';
import { ActiveSituationBanner } from '@/components/life-os/ActiveSituationBanner';
import { PWAWelcomeScreen } from '@/components/pwa/PWAWelcomeScreen';
import { InstallBanner } from '@/components/pwa/InstallBanner';
import { EmergencyQuickAccess } from '@/components/home/EmergencyQuickAccess';
import { HomeProductsSection } from '@/components/home/HomeProductsSection';
import { PostOrderReviewPrompt } from '@/components/reviews/PostOrderReviewPrompt';
import { usePostOrderReview } from '@/hooks/usePostOrderReview';
import { LifecycleSmartTip } from '@/components/home/LifecycleSmartTip';
import { DocumentExpiryNotifier } from '@/components/notifications/DocumentExpiryNotifier';
import { PropertyTourBanner } from '@/components/home/PropertyTourBanner';
import { YourDayFeed } from '@/components/shared/YourDayFeed';
import { useIsDesktop } from '@/hooks/use-desktop';
import { RevealOnScroll } from '@/components/ui/RevealOnScroll';

// Lazy load secondary components
const LifeOSStatusBlock = lazy(() => import('@/components/home/LifeOSStatusBlock'));
const ConciergeBanner = lazy(() => import('@/components/home/ConciergeBanner').then(m => ({ default: m.ConciergeBanner })));
const TrustBanner = lazy(() => import('@/components/home/TrustBanner').then(m => ({ default: m.TrustBanner })));
const OnboardingModal = lazy(() => import('@/components/onboarding/OnboardingModal').then(m => ({ default: m.OnboardingModal })));

const Index = () => {
  const { activeCode } = useLifeSituationContext();
  const isDesktop = useIsDesktop();
  const [refreshKey, setRefreshKey] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('myuno-onboarding-complete') &&
           !sessionStorage.getItem('myuno-onboarding-complete');
  });
  const { pendingReview, isOpen: reviewOpen, setIsOpen: setReviewOpen, dismiss: dismissReview } = usePostOrderReview();

  const handleRefresh = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 800));
    setRefreshKey(prev => prev + 1);
  }, []);

  const hasContext = !!activeCode;

  return (
    <AppLayout showFooter>
      <SEOHead jsonLd={createOrganizationSchema()} />
      <PWAWelcomeScreen />
      <DocumentExpiryNotifier />
      
      {showOnboarding && (
        <Suspense fallback={null}>
          <OnboardingModal 
            open={showOnboarding} 
            onComplete={() => setShowOnboarding(false)} 
          />
        </Suspense>
      )}

      <ActiveSituationBanner />

      {/* ─── PWA Install Banner ─── */}
      <div className="px-4 md:px-6 lg:px-8 pt-3 w-full max-w-[1536px] mx-auto">
        <InstallBanner />
      </div>

      <PullToRefresh onRefresh={handleRefresh} key={refreshKey}>
        <div className="px-4 md:px-6 lg:px-8 py-5 pb-20 md:pb-8 w-full max-w-[1536px] mx-auto space-y-6 lg:space-y-16">
          
          {/* ─── SECTION 1: Hero (full width) ─── */}
          <HeroBlock />

          {/* ─── SECTION 2: Quick Actions (full width) ─── */}
          <RevealOnScroll>
            <QuickActionsGrid />
          </RevealOnScroll>

          {/* ─── SECTION 3: Content Grid — main + sidebar on desktop ─── */}
          {isDesktop ? (
            <div className="grid grid-cols-3 gap-8">
              {/* Main column (2/3) */}
              <div className="col-span-2 space-y-6">
                <Suspense fallback={null}>
                  <YourDayFeed compact />
                </Suspense>
              </div>
              {/* Sidebar (1/3) */}
              <div className="col-span-1 space-y-5 lg:sticky lg:top-24 self-start">
                <LifecycleSmartTip />
                {hasContext ? (
                  <Suspense fallback={null}>
                    <LifeOSStatusBlock />
                  </Suspense>
                ) : (
                  <Suspense fallback={null}>
                    <ConciergeBanner />
                  </Suspense>
                )}
                <PropertyTourBanner />
              </div>
            </div>
          ) : (
            <>
              <Suspense fallback={null}>
                <YourDayFeed compact />
              </Suspense>
              <LifecycleSmartTip />
              <PropertyTourBanner />
              {hasContext ? (
                <Suspense fallback={null}>
                  <LifeOSStatusBlock />
                </Suspense>
              ) : (
                <Suspense fallback={null}>
                  <ConciergeBanner />
                </Suspense>
              )}
            </>
          )}

          {/* ─── SECTION 4: Products / Solutions (full width) ─── */}
          <RevealOnScroll>
            <HomeProductsSection />
          </RevealOnScroll>

          {/* ─── SECTION 5: Trust + Emergency (unified strip) ─── */}
          <RevealOnScroll>
            <Suspense fallback={null}>
              <TrustBanner showEmergency />
            </Suspense>
          </RevealOnScroll>

        </div>
      </PullToRefresh>

      {/* Post-order review prompt */}
      {pendingReview && (
        <PostOrderReviewPrompt
          open={reviewOpen}
          onClose={dismissReview}
          orderId={pendingReview.orderId}
          entityType={pendingReview.entityType}
          entityId={pendingReview.entityId}
          entityName={pendingReview.entityName}
        />
      )}
    </AppLayout>
  );
};

export default Index;
