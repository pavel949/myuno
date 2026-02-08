// Index page - Clean Airbnb-style home screen
import React, { useState, useCallback, lazy, Suspense } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { SEOHead, createOrganizationSchema } from '@/components/seo';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { QuickActionsGrid } from '@/components/home/QuickActionsGrid';
import { HeroBlock } from '@/components/home/HeroBlock';
import { PersonaChips } from '@/components/home/PersonaChips';
import { supabase } from '@/integrations/supabase/client';
import { InstallBanner } from '@/components/pwa/InstallBanner';
import { PWAWelcomeScreen } from '@/components/pwa/PWAWelcomeScreen';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load components
const DiscoveryCarousel = lazy(() => import('@/components/home/DiscoveryCarousel').then(m => ({ default: m.DiscoveryCarousel })));

// Lazy load modals
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
  const [refreshKey, setRefreshKey] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('myuno-onboarding-complete');
  });

  const handleRefresh = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshKey(prev => prev + 1);
  }, []);

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

      <PullToRefresh onRefresh={handleRefresh} key={refreshKey}>
        <div className="px-4 py-5 pb-24 space-y-6 overflow-x-visible">
          
          {/* PWA Install */}
          <InstallBanner />

          {/* Hero: Brand + Search + SOS */}
          <HeroBlock />

          {/* Persona chips — compact "I'm here as:" */}
          <PersonaChips />

          {/* Quick Actions — persona-aware grid */}
          <QuickActionsGrid contentMode="services" />

          {/* Featured content */}
          <Suspense fallback={<SectionSkeleton />}>
            <DiscoveryCarousel />
          </Suspense>

        </div>
      </PullToRefresh>
    </AppLayout>
  );
};

export default Index;
