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
import { ActiveSituationBanner } from '@/components/life-os/ActiveSituationBanner';

import { FeaturedPropertiesCarousel } from '@/components/home/FeaturedPropertiesCarousel';
import { WhatsAppCTA } from '@/components/home/WhatsAppCTA';
import { TrustStats } from '@/components/home/TrustStats';
import { PostOrderReviewPrompt } from '@/components/reviews/PostOrderReviewPrompt';
import { usePostOrderReview } from '@/hooks/usePostOrderReview';
import { PropertyTourBanner } from '@/components/home/PropertyTourBanner';
import { HomeDiscoveryCarousel } from '@/components/home/HomeDiscoveryCarousel';
import { DocumentExpiryNotifier } from '@/components/notifications/DocumentExpiryNotifier';
import { useIsDesktop } from '@/hooks/use-desktop';
import { useAuth } from '@/contexts/AuthContext';
import { RevealOnScroll } from '@/components/ui/RevealOnScroll';
import { OfflineEmergencyCard } from '@/components/home/OfflineEmergencyCard';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { useUserPersonas } from '@/hooks/useUserPersonas';
import { WelcomeHero } from '@/components/home/WelcomeHero';
import { InlinePersonaSelector } from '@/components/home/InlinePersonaSelector';
import { ValuePropositionStrip } from '@/components/home/ValuePropositionStrip';

// Lazy load secondary components
const YourDayFeed = lazy(() => import('@/components/shared/YourDayFeed').then(m => ({ default: m.YourDayFeed })));
const TodayEventsFeed = lazy(() => import('@/components/home/TodayEventsFeed').then(m => ({ default: m.TodayEventsFeed })));

const Index = () => {
  const { activeCode } = useLifeSituationContext();
  const { user } = useAuth();
  const { isOffline } = useOfflineStatus();
  const isDesktop = useIsDesktop();
  const [refreshKey, setRefreshKey] = useState(0);
  const isFirstVisit = !localStorage.getItem('myuno-onboarding-complete') &&
                       !sessionStorage.getItem('myuno-onboarding-complete');
  const { pendingReview, isOpen: reviewOpen, setIsOpen: setReviewOpen, dismiss: dismissReview } = usePostOrderReview();

  const handleRefresh = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 800));
    setRefreshKey(prev => prev + 1);
  }, []);

  const { personas } = useUserPersonas();
  const hasContext = !!activeCode;
  const isLoggedIn = !!user;

  // Always show property sections — rentals are relevant to all personas
  const showPropertySections = true;

  return (
    <AppLayout showFooter>
      <SEOHead jsonLd={createOrganizationSchema()} />
      
      <DocumentExpiryNotifier />
      
      <ActiveSituationBanner />


      <PullToRefresh onRefresh={handleRefresh} key={refreshKey}>
        <div className="px-4 md:px-6 lg:px-8 xl:px-10 py-5 pb-20 md:pb-8 w-full max-w-[1536px] mx-auto space-y-6 lg:space-y-10">
          
          {/* ── HERO ── */}
          {isFirstVisit ? (
            <>
              <WelcomeHero />
              <InlinePersonaSelector isFirstVisit />
            </>
          ) : (
            <HeroBlock />
          )}

          {/* ── QUICK ACTIONS (primary CTA grid) ── */}
          <RevealOnScroll>
            <QuickActionsGrid />
          </RevealOnScroll>

          {/* ── VALUE PROPOSITION (first visit only — concrete services with prices) ── */}
          {isFirstVisit && (
            <RevealOnScroll>
              <ValuePropositionStrip />
            </RevealOnScroll>
          )}

          {/* ── FEATURED PROPERTIES (only for relevant personas) ── */}
          {showPropertySections && (
            <RevealOnScroll>
              <FeaturedPropertiesCarousel />
            </RevealOnScroll>
          )}

          {/* ── PROPERTY TOUR BANNER (only for investors/residents/owners) ── */}
          {showPropertySections && (
            <RevealOnScroll>
              <PropertyTourBanner />
            </RevealOnScroll>
          )}

          {/* ── DISCOVERY: restaurants, events, home services (all users) ── */}
          {showPropertySections && (
            <RevealOnScroll>
              <HomeDiscoveryCarousel />
            </RevealOnScroll>
          )}

          {/* ── PERSONALIZED CONTENT (logged-in users) ── */}
          {isLoggedIn && (
            <Suspense fallback={null}>
              <YourDayFeed compact />
            </Suspense>
          )}

          {/* ── WHATSAPP CTA ── */}
          <RevealOnScroll>
            <WhatsAppCTA />
          </RevealOnScroll>

          {/* ── EVENTS FEED (public, not logged in) ── */}
          {!isLoggedIn && (
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
