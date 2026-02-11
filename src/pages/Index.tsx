/**
 * Index — LifeOS Dashboard
 * 
 * Structure:
 * 1. HeroBlock (greeting, location, search, SOS)
 * 2. Quick Actions (role-adaptive)
 * 3. LifeOS Focus Bar (active situation)
 * 4. LifeOS Status Block (contextual checklist)
 * 5. Explore sections (vertical entry points)
 * 6. Life situation selector (when no context)
 * 7. Support + Trust
 */
import React, { useState, useCallback, lazy, Suspense } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLifeSituationContext } from '@/contexts/LifeSituationContext';
import { SEOHead, createOrganizationSchema } from '@/components/seo';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { HeroBlock } from '@/components/home/HeroBlock';
import { QuickActionsGrid } from '@/components/home/QuickActionsGrid';
import { HomeExploreSections } from '@/components/home/HomeExploreSections';
import { PersonaChips } from '@/components/home/PersonaChips';
import { ActiveSituationBanner } from '@/components/life-os/ActiveSituationBanner';
import { InstallBanner } from '@/components/pwa/InstallBanner';
import { PWAWelcomeScreen } from '@/components/pwa/PWAWelcomeScreen';
import { LifeOSFocusBar } from '@/components/home/LifeOSFocusBar';
import { EmergencyQuickAccess } from '@/components/home/EmergencyQuickAccess';

// Lazy load secondary components
const SmartWidget = lazy(() => import('@/components/home/SmartWidget').then(m => ({ default: m.SmartWidget })));
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
        <div className="px-4 md:px-6 lg:px-8 py-5 pb-24 md:pb-8 w-full max-w-7xl mx-auto">
          
          {/* Desktop: 2-column grid layout / Mobile: single column */}
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            
            {/* Left column — primary content (8 cols on desktop) */}
            <div className="lg:col-span-8 space-y-6">
              {/* PWA Install — simplified */}
              <InstallBanner />

              {/* Hero — greeting, location, search, SOS */}
              <HeroBlock />

              {/* Persona chips — role selector */}
              <PersonaChips />

              {/* Quick Actions — role-adaptive icon row */}
              <QuickActionsGrid />

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
            </div>

            {/* Right column — widgets & support (4 cols on desktop, stacked below on mobile) */}
            <div className="lg:col-span-4 space-y-6 mt-6 lg:mt-0">
              {/* Smart Widget — weather, events, recommendations */}
              <Suspense fallback={null}>
                <SmartWidget />
              </Suspense>

              {/* LifeOS Focus Bar — top-priority active route */}
              <LifeOSFocusBar />

              {/* When context is active → show status dashboard */}
              {hasContext && (
                <Suspense fallback={null}>
                  <LifeOSStatusBlock />
                </Suspense>
              )}

              {/* Emergency Quick Access — always visible */}
              <EmergencyQuickAccess />

              {/* Support — always visible */}
              <Suspense fallback={null}>
                <ConciergeBanner />
              </Suspense>

              {/* Trust signals — subtle, bottom */}
              <Suspense fallback={null}>
                <TrustBanner />
              </Suspense>
            </div>
          </div>

        </div>
      </PullToRefresh>
    </AppLayout>
  );
};

export default Index;
