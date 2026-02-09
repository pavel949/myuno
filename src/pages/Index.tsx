/**
 * Index page — P0.1: LifeOS-First Home
 * Primary entry: Life Situations ("What's happening in your life?")
 * Secondary: Vertical access always visible, situation prompt is non-blocking
 */
import React, { useState, useCallback, lazy, Suspense } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLifeSituationContext } from '@/contexts/LifeSituationContext';
import { SEOHead, createOrganizationSchema } from '@/components/seo';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { HeroBlock } from '@/components/home/HeroBlock';
import { LifeSituationSelector } from '@/components/home/LifeSituationSelector';
import { ActiveSituationBanner } from '@/components/life-os/ActiveSituationBanner';
import { InstallBanner } from '@/components/pwa/InstallBanner';
import { PWAWelcomeScreen } from '@/components/pwa/PWAWelcomeScreen';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load secondary components
const QuickActionsGrid = lazy(() => import('@/components/home/QuickActionsGrid').then(m => ({ default: m.QuickActionsGrid })));
const DiscoveryCarousel = lazy(() => import('@/components/home/DiscoveryCarousel').then(m => ({ default: m.DiscoveryCarousel })));
const PersonaChips = lazy(() => import('@/components/home/PersonaChips').then(m => ({ default: m.PersonaChips })));
const OnboardingModal = lazy(() => import('@/components/onboarding/OnboardingModal').then(m => ({ default: m.OnboardingModal })));

const SectionSkeleton = () => (
  <div className="space-y-3">
    <Skeleton className="h-6 w-40" />
    <div className="flex gap-4 overflow-hidden">
      <Skeleton className="h-56 w-80 rounded-2xl shrink-0" />
      <Skeleton className="h-48 w-64 rounded-2xl shrink-0" />
    </div>
  </div>
);

const Index = () => {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { activeCode } = useLifeSituationContext();
  const [refreshKey, setRefreshKey] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('myuno-onboarding-complete');
  });

  const handleRefresh = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
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
        <div className="px-4 md:px-6 lg:px-8 py-5 pb-24 md:pb-8 space-y-6 md:space-y-8 overflow-x-visible max-w-7xl mx-auto w-full">
          
          {/* PWA Install */}
          <InstallBanner />

          {/* Hero: Brand + Search + SOS */}
          <HeroBlock />

          {/* Life Situation prompt — non-blocking suggestion */}
          {!hasContext && <LifeSituationSelector />}

          {/* Persona chips when context is active */}
          {hasContext && (
            <Suspense fallback={null}>
              <PersonaChips />
            </Suspense>
          )}

          {/* Quick Actions & Discovery — always visible */}
          <Suspense fallback={<SectionSkeleton />}>
            <QuickActionsGrid contentMode="services" />
          </Suspense>

          <Suspense fallback={<SectionSkeleton />}>
            <DiscoveryCarousel />
          </Suspense>

        </div>
      </PullToRefresh>
    </AppLayout>
  );
};

export default Index;
