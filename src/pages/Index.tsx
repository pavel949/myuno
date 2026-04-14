/**
 * Index — myUNO Hub
 * 
 * Optimized layout for foreigners in Phuket:
 * 1. Hero (greeting + weather + persona + search)
 * 2. Quick Actions (role-adaptive shortcuts)
 * 3. Featured Properties (real prices, horizontal scroll)
 * 4. Cluster Hub (6 clusters)
 * 5. WhatsApp CTA (concierge)
 * 6. Trust Stats (real numbers)
 * 7. Emergency
 */
import React, { useState, useCallback, lazy, Suspense } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLifeSituationContext } from '@/contexts/LifeSituationContext';
import { SEOHead, createOrganizationSchema } from '@/components/seo';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { HeroBlock } from '@/components/home/HeroBlock';
import { QuickActionsGrid } from '@/components/home/QuickActionsGrid';
import { PersonaSmartFeed } from '@/components/home/PersonaSmartFeed';
import { ActiveSituationBanner } from '@/components/life-os/ActiveSituationBanner';
import { ClusterHub } from '@/components/home/ClusterHub';
import { FeaturedPropertiesCarousel } from '@/components/home/FeaturedPropertiesCarousel';
import { WhatsAppCTA } from '@/components/home/WhatsAppCTA';
import { TrustStats } from '@/components/home/TrustStats';
import { PostOrderReviewPrompt } from '@/components/reviews/PostOrderReviewPrompt';
import { usePostOrderReview } from '@/hooks/usePostOrderReview';
import { PropertyTourBanner } from '@/components/home/PropertyTourBanner';
import { DocumentExpiryNotifier } from '@/components/notifications/DocumentExpiryNotifier';
import { useIsDesktop } from '@/hooks/use-desktop';
import { useAuth } from '@/contexts/AuthContext';
import { RevealOnScroll } from '@/components/ui/RevealOnScroll';
import { PopularServicesStrip } from '@/components/home/PopularServicesStrip';
import { OfflineEmergencyCard } from '@/components/home/OfflineEmergencyCard';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { ProgressIndicator } from '@/components/home/ProgressIndicator';

// Lazy load secondary components
const LifeOSStatusBlock = lazy(() => import('@/components/home/LifeOSStatusBlock'));
const ConciergeBanner = lazy(() => import('@/components/home/ConciergeBanner').then(m => ({ default: m.ConciergeBanner })));
const TrustBanner = lazy(() => import('@/components/home/TrustBanner').then(m => ({ default: m.TrustBanner })));
const OnboardingModal = lazy(() => import('@/components/onboarding/OnboardingModal').then(m => ({ default: m.OnboardingModal })));
const YourDayFeed = lazy(() => import('@/components/shared/YourDayFeed').then(m => ({ default: m.YourDayFeed })));
const LifecycleSmartTip = lazy(() => import('@/components/home/LifecycleSmartTip').then(m => ({ default: m.LifecycleSmartTip })));
const ProactiveConcierge = lazy(() => import('@/components/home/ProactiveConcierge').then(m => ({ default: m.ProactiveConcierge })));
const TodayEventsFeed = lazy(() => import('@/components/home/TodayEventsFeed').then(m => ({ default: m.TodayEventsFeed })));

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

      <PullToRefresh onRefresh={handleRefresh} key={refreshKey}>
        <div className="px-4 md:px-6 lg:px-8 xl:px-10 py-5 pb-20 md:pb-8 w-full max-w-[1536px] mx-auto space-y-6 lg:space-y-10">
          
          {/* ── HERO ── */}
          <HeroBlock />

          {/* ── PROGRESS INDICATOR ── */}
          <RevealOnScroll>
            <ProgressIndicator />
          </RevealOnScroll>

          {/* ── PERSONA SMART FEED ── */}
          <RevealOnScroll>
            <PersonaSmartFeed />
          </RevealOnScroll>

          {/* ── QUICK ACTIONS ── */}
          <RevealOnScroll>
            <QuickActionsGrid />
          </RevealOnScroll>

          {/* ── FEATURED PROPERTIES (new — with real prices) ── */}
          <RevealOnScroll>
            <FeaturedPropertiesCarousel />
          </RevealOnScroll>

          {/* ── PROPERTY TOUR BANNER ── */}
          <RevealOnScroll>
            <PropertyTourBanner />
          </RevealOnScroll>

          {/* ── PERSONALIZED CONTENT (logged-in users) ── */}
          {isLoggedIn && (
            <Suspense fallback={null}>
              <YourDayFeed compact />
            </Suspense>
          )}

          {/* ── POPULAR SERVICES ── */}
          <RevealOnScroll>
            <PopularServicesStrip />
          </RevealOnScroll>

          {/* ── CLUSTER HUB ── */}
          <RevealOnScroll>
            <ClusterHub />
          </RevealOnScroll>

          {/* ── WHATSAPP CTA ── */}
          <RevealOnScroll>
            <WhatsAppCTA />
          </RevealOnScroll>

          {/* ── EVENTS (public) or Smart Tips (logged in) ── */}
          {isLoggedIn ? (
            <Suspense fallback={null}>
              {hasContext ? (
                <LifeOSStatusBlock />
              ) : (
                <ConciergeBanner />
              )}
            </Suspense>
          ) : (
            <Suspense fallback={null}>
              <TodayEventsFeed compact />
            </Suspense>
          )}

          {/* ── OFFLINE EMERGENCY ── */}
          {isOffline && (
            <RevealOnScroll>
              <OfflineEmergencyCard compact />
            </RevealOnScroll>
          )}

          {/* ── TRUST STATS ── */}
          <RevealOnScroll>
            <TrustStats />
          </RevealOnScroll>

          {/* ── TRUST BANNER + SOS ── */}
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
