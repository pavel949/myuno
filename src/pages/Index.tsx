/**
 * Index — LifeOS Dashboard
 * 
 * Clean, calm, confident layout:
 * 1. Hero (greeting + weather + loyalty)
 * 2. Quick Actions (8 shortcuts)
 * 3. Smart tip (contextual, dismissable)
 * 4. Explore (visual cards)
 * 5. Secondary (concierge / emergency) — collapsed into a compact section
 */
import React, { useState, useCallback, lazy, Suspense } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLifeSituationContext } from '@/contexts/LifeSituationContext';
import { SEOHead, createOrganizationSchema } from '@/components/seo';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { HeroBlock } from '@/components/home/HeroBlock';
import { QuickActionsGrid } from '@/components/home/QuickActionsGrid';
import { HomeExploreSections } from '@/components/home/HomeExploreSections';
import { ActiveSituationBanner } from '@/components/life-os/ActiveSituationBanner';
import { PWAWelcomeScreen } from '@/components/pwa/PWAWelcomeScreen';
import { EmergencyQuickAccess } from '@/components/home/EmergencyQuickAccess';
import { HomeProductsSection } from '@/components/home/HomeProductsSection';
import { PostOrderReviewPrompt } from '@/components/reviews/PostOrderReviewPrompt';
import { usePostOrderReview } from '@/hooks/usePostOrderReview';
import { LifecycleSmartTip } from '@/components/home/LifecycleSmartTip';
import { DocumentExpiryNotifier } from '@/components/notifications/DocumentExpiryNotifier';

// Lazy load secondary components
const LifeOSStatusBlock = lazy(() => import('@/components/home/LifeOSStatusBlock'));
const ConciergeBanner = lazy(() => import('@/components/home/ConciergeBanner').then(m => ({ default: m.ConciergeBanner })));
const TrustBanner = lazy(() => import('@/components/home/TrustBanner').then(m => ({ default: m.TrustBanner })));
const OnboardingModal = lazy(() => import('@/components/onboarding/OnboardingModal').then(m => ({ default: m.OnboardingModal })));

const Index = () => {
  const { activeCode } = useLifeSituationContext();
  const [refreshKey, setRefreshKey] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('myuno-onboarding-complete');
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

      <PullToRefresh onRefresh={handleRefresh} key={refreshKey}>
        <div className="px-4 md:px-6 lg:px-8 py-5 pb-20 md:pb-8 w-full max-w-7xl mx-auto space-y-6 lg:space-y-12">
          
          {/* ─── SECTION 1: Hero ─── */}
          <HeroBlock />

          {/* ─── SECTION 2: Quick Actions ─── */}
          <QuickActionsGrid />

          {/* ─── SECTION 3: Smart Tip (contextual, dismissable) ─── */}
          <LifecycleSmartTip />

          {/* ─── SECTION 4: Explore — the visual heart ─── */}
          <Suspense fallback={null}>
            <HomeExploreSections />
          </Suspense>

          {/* ─── SECTION 5: Products ─── */}
          <HomeProductsSection />

          {/* ─── SECTION 6: Support layer ─── */}
          <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
            {hasContext ? (
              <Suspense fallback={null}>
                <LifeOSStatusBlock />
              </Suspense>
            ) : (
              <Suspense fallback={null}>
                <ConciergeBanner />
              </Suspense>
            )}
            <EmergencyQuickAccess />
          </div>

          {/* ─── SECTION 6: Trust ─── */}
          <Suspense fallback={null}>
            <TrustBanner />
          </Suspense>

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
