/**
 * Index — Airbnb-style Guest Home Screen
 * 
 * Structure:
 * 1. Search bar (Airbnb-style rounded)
 * 2. Quick category icons (horizontal)
 * 3. Featured properties grid (2-col, real data)
 * 4. Explore sections (contextual entry points)
 * 5. Life situation (contextual, not dominant)
 * 6. Support + Trust
 */
import React, { useState, useCallback, lazy, Suspense } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLifeSituationContext } from '@/contexts/LifeSituationContext';
import { SEOHead, createOrganizationSchema } from '@/components/seo';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { HomeSearchBar } from '@/components/home/HomeSearchBar';
import { QuickActionsGrid } from '@/components/home/QuickActionsGrid';
import { HomeFeaturedProperties } from '@/components/home/HomeFeaturedProperties';
import { HomeExploreSections } from '@/components/home/HomeExploreSections';
import { ActiveSituationBanner } from '@/components/life-os/ActiveSituationBanner';
import { InstallBanner } from '@/components/pwa/InstallBanner';
import { PWAWelcomeScreen } from '@/components/pwa/PWAWelcomeScreen';

// Lazy load secondary components
const LifeOSStatusBlock = lazy(() => import('@/components/home/LifeOSStatusBlock'));
const LifeSituationSelector = lazy(() => import('@/components/home/LifeSituationSelector'));
const ConciergeBanner = lazy(() => import('@/components/home/ConciergeBanner').then(m => ({ default: m.ConciergeBanner })));
const TrustBanner = lazy(() => import('@/components/home/TrustBanner').then(m => ({ default: m.TrustBanner })));
const OnboardingModal = lazy(() => import('@/components/onboarding/OnboardingModal').then(m => ({ default: m.OnboardingModal })));

const Index = () => {
  const { activeCode } = useLifeSituationContext();
  const [refreshKey, setRefreshKey] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('myuno-onboarding-complete');
  });

  const handleRefresh = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 800));
    setRefreshKey(prev => prev + 1);
  }, []);

  const hasContext = !!activeCode;

  return (
    <AppLayout showFooter>
      <SEOHead jsonLd={createOrganizationSchema()} />
      
      <PWAWelcomeScreen />
      
      {showOnboarding && (
        <Suspense fallback={null}>
          <OnboardingModal 
            open={showOnboarding} 
            onComplete={() => setShowOnboarding(false)} 
          />
        </Suspense>
      )}

      {/* Active situation banner — persists across navigation */}
      <ActiveSituationBanner />

      <PullToRefresh onRefresh={handleRefresh} key={refreshKey}>
        <div className="px-4 md:px-6 py-5 pb-24 md:pb-8 space-y-6 max-w-lg mx-auto w-full">
          
          {/* PWA Install — simplified */}
          <InstallBanner />

          {/* Search — Airbnb style */}
          <HomeSearchBar />

          {/* Quick Actions — role-adaptive icon row */}
          <QuickActionsGrid />

          {/* Featured Properties — real data, 2-col grid */}
          <HomeFeaturedProperties />

          {/* When context is active → show status dashboard */}
          {hasContext && (
            <Suspense fallback={null}>
              <LifeOSStatusBlock />
            </Suspense>
          )}

          {/* Explore other verticals */}
          <Suspense fallback={null}>
            <HomeExploreSections />
          </Suspense>

          {/* Life situation — contextual, secondary */}
          {!hasContext && (
            <Suspense fallback={null}>
              <LifeSituationSelector />
            </Suspense>
          )}

          {/* Support — always visible */}
          <Suspense fallback={null}>
            <ConciergeBanner />
          </Suspense>

          {/* Trust signals — subtle, bottom */}
          <Suspense fallback={null}>
            <TrustBanner />
          </Suspense>

        </div>
      </PullToRefresh>
    </AppLayout>
  );
};

export default Index;
