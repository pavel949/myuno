/**
 * Index — LifeOS Dashboard
 * Calm, trust-first home screen.
 * NOT a marketplace landing. A personal companion dashboard.
 * 
 * Structure:
 * 1. Greeting + Search (HeroBlock)
 * 2. Active situation status (if context set)
 * 3. Life situation picker (if no context)
 * 4. Concierge support
 * 5. Trust signals
 */
import React, { useState, useCallback, lazy, Suspense } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLifeSituationContext } from '@/contexts/LifeSituationContext';
import { SEOHead, createOrganizationSchema } from '@/components/seo';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { HeroBlock } from '@/components/home/HeroBlock';
import { QuickActionsGrid } from '@/components/home/QuickActionsGrid';
import { LifeSituationSelector } from '@/components/home/LifeSituationSelector';
import { ActiveSituationBanner } from '@/components/life-os/ActiveSituationBanner';
import { InstallBanner } from '@/components/pwa/InstallBanner';
import { PWAWelcomeScreen } from '@/components/pwa/PWAWelcomeScreen';

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

          {/* Hero: Greeting + Search + SOS */}
          <HeroBlock />

          {/* Quick Actions — role-adaptive shortcuts */}
          <QuickActionsGrid />

          {/* When context is active → show status dashboard */}
          {hasContext && (
            <Suspense fallback={null}>
              <LifeOSStatusBlock />
            </Suspense>
          )}

          {/* When no context → show life situation picker */}
          {!hasContext && <LifeSituationSelector />}

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
