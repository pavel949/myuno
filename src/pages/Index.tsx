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

import { InstallBanner } from '@/components/pwa/InstallBanner';
import { EmergencyQuickAccess } from '@/components/home/EmergencyQuickAccess';
import { ClusterHub } from '@/components/home/ClusterHub';
import { HomeProductsSection } from '@/components/home/HomeProductsSection';
import { PostOrderReviewPrompt } from '@/components/reviews/PostOrderReviewPrompt';
import { usePostOrderReview } from '@/hooks/usePostOrderReview';
import { LifecycleSmartTip } from '@/components/home/LifecycleSmartTip';
import { DocumentExpiryNotifier } from '@/components/notifications/DocumentExpiryNotifier';
import { PropertyTourBanner } from '@/components/home/PropertyTourBanner';
import { YourDayFeed } from '@/components/shared/YourDayFeed';
import { TodayEventsFeed } from '@/components/home/TodayEventsFeed';
import { useIsDesktop } from '@/hooks/use-desktop';
import { useAuth } from '@/contexts/AuthContext';
import { RevealOnScroll } from '@/components/ui/RevealOnScroll';
import { PopularServicesStrip } from '@/components/home/PopularServicesStrip';
import { OfflineEmergencyCard } from '@/components/home/OfflineEmergencyCard';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { ProactiveConcierge } from '@/components/home/ProactiveConcierge';

// Lazy load secondary components
const LifeOSStatusBlock = lazy(() => import('@/components/home/LifeOSStatusBlock'));
const ConciergeBanner = lazy(() => import('@/components/home/ConciergeBanner').then(m => ({ default: m.ConciergeBanner })));
const TrustBanner = lazy(() => import('@/components/home/TrustBanner').then(m => ({ default: m.TrustBanner })));
const OnboardingModal = lazy(() => import('@/components/onboarding/OnboardingModal').then(m => ({ default: m.OnboardingModal })));


const Index = () => {
  const { activeCode } = useLifeSituationContext();
  const { user } = useAuth();
  const { isOffline } = useOfflineStatus();
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
  const isLoggedIn = !!user;

  return (
    <AppLayout showFooter>
      <SEOHead jsonLd={createOrganizationSchema()} />
      
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
      <div className="px-4 md:px-6 lg:px-8 xl:px-10 pt-3 w-full max-w-[1536px] mx-auto">
        <InstallBanner />
      </div>

      <PullToRefresh onRefresh={handleRefresh} key={refreshKey}>
        <div className="px-4 md:px-6 lg:px-8 xl:px-10 py-5 pb-20 md:pb-8 w-full max-w-[1536px] mx-auto space-y-6 lg:space-y-10 xl:space-y-14">
          
          {/* ─── SECTION 1: Hero (full width) ─── */}
          <HeroBlock />

          {/* ─── SECTION 2: Quick Actions (full width) ─── */}
          <RevealOnScroll>
            <QuickActionsGrid />
          </RevealOnScroll>

          {/* ─── SECTION 2.5: Cluster Hub (Bible v2.0 — 6 clusters) ─── */}
          <RevealOnScroll>
            <ClusterHub />
          </RevealOnScroll>

          {/* ─── SECTION 3: Events feed (public) or YourDay (auth) ─── */}
          {isLoggedIn ? (
            isDesktop ? (
              <>
                {/* Row 1: YourDay full width */}
                <Suspense fallback={null}>
                  <YourDayFeed compact />
                </Suspense>

                {/* Row 2: Recommendations + Smart Tips — 2 equal columns */}
                <div className="grid grid-cols-2 gap-6">
                  <ProactiveConcierge />
                  <div className="space-y-5">
                    <LifecycleSmartTip />
                    {hasContext ? (
                      <Suspense fallback={null}><LifeOSStatusBlock /></Suspense>
                    ) : (
                      <Suspense fallback={null}><ConciergeBanner /></Suspense>
                    )}
                  </div>
                </div>

                <PropertyTourBanner />
              </>
            ) : (
              <>
                <Suspense fallback={null}>
                  <YourDayFeed compact />
                </Suspense>
                <ProactiveConcierge />
                <LifecycleSmartTip />
                <PropertyTourBanner />
                {hasContext ? (
                  <Suspense fallback={null}><LifeOSStatusBlock /></Suspense>
                ) : (
                  <Suspense fallback={null}><ConciergeBanner /></Suspense>
                )}
              </>
            )
          ) : (
            <>
              <TodayEventsFeed compact />
              <PopularServicesStrip />
              <PropertyTourBanner />
            </>
          )}

          {/* ─── SECTION 4: Products / Solutions (full width) ─── */}
          <RevealOnScroll>
            <HomeProductsSection />
          </RevealOnScroll>

          {/* ─── Offline Emergency Card ─── */}
          {isOffline && (
            <RevealOnScroll>
              <OfflineEmergencyCard compact />
            </RevealOnScroll>
          )}

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
