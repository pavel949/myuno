/**
 * Index — LifeOS Dashboard
 * 
 * Desktop: Full-width sections, secondary content in 3-col grid at bottom
 * Mobile: Single column, unchanged
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
          
          {/* PWA Install — simplified */}
          <InstallBanner />

          {/* Hero row: greeting + smart widget side by side on desktop */}
          <div className="lg:flex lg:items-start lg:justify-between lg:gap-8 mb-6">
            <div className="flex-1">
              <HeroBlock />
            </div>
            {/* Smart Widget — inline on desktop */}
            <div className="mt-4 lg:mt-0 lg:w-[380px] lg:shrink-0">
              <Suspense fallback={null}>
                <SmartWidget />
              </Suspense>
            </div>
          </div>

          {/* Persona chips — role selector */}
          <div className="mb-4">
            <PersonaChips />
          </div>

          {/* Quick Actions — full-width ribbon on desktop */}
          <div className="mb-6 lg:mb-8">
            <QuickActionsGrid />
          </div>

          {/* Explore sections — full-width photo grid on desktop */}
          <div className="mb-6 lg:mb-8">
            <Suspense fallback={null}>
              <HomeExploreSections />
            </Suspense>
          </div>

          {/* Life situation — contextual, secondary */}
          {!hasContext && (
            <div className="mb-6">
              <Suspense fallback={null}>
                <LifeSituationSelector />
              </Suspense>
            </div>
          )}

          {/* Secondary content: stacked on mobile, 3-col grid on desktop */}
          <div className="space-y-6 lg:grid lg:grid-cols-3 lg:gap-6 lg:space-y-0">
            {/* LifeOS Focus Bar */}
            <div>
              <LifeOSFocusBar />
            </div>

            {/* When context is active → show status dashboard */}
            {hasContext ? (
              <div>
                <Suspense fallback={null}>
                  <LifeOSStatusBlock />
                </Suspense>
              </div>
            ) : (
              <div>
                <Suspense fallback={null}>
                  <ConciergeBanner />
                </Suspense>
              </div>
            )}

            {/* Emergency Quick Access */}
            <div>
              <EmergencyQuickAccess />
            </div>
          </div>

          {/* Trust signals — bottom */}
          <div className="mt-6">
            <Suspense fallback={null}>
              <TrustBanner />
            </Suspense>
          </div>

        </div>
      </PullToRefresh>
    </AppLayout>
  );
};

export default Index;
