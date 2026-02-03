import React, { useState, useCallback, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { SEOHead, createOrganizationSchema } from '@/components/seo';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { QuickActionsGrid } from '@/components/home/QuickActionsGrid';
import { HeroBanner } from '@/components/home/HeroBanner';
import { ContentModeToggle, ContentMode } from '@/components/home/ContentModeToggle';
import { SafetyBanner } from '@/components/home/SafetyBanner';
import { supabase } from '@/integrations/supabase/client';
import { InstallBanner } from '@/components/pwa/InstallBanner';
import { PWAWelcomeScreen } from '@/components/pwa/PWAWelcomeScreen';
import { InlineSearch } from '@/components/search/InlineSearch';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load heavier components
const SmartWidget = lazy(() => import('@/components/home/SmartWidget').then(m => ({ default: m.SmartWidget })));
const ExperiencesSection = lazy(() => import('@/components/home/ExperiencesSection').then(m => ({ default: m.ExperiencesSection })));
const RecommendedCarousel = lazy(() => import('@/components/home/RecommendedCarousel').then(m => ({ default: m.RecommendedCarousel })));
const HomeCategoryRibbon = lazy(() => import('@/components/home/HomeCategoryRibbon').then(m => ({ default: m.HomeCategoryRibbon })));
const HomeProductsSection = lazy(() => import('@/components/home/HomeProductsSection').then(m => ({ default: m.HomeProductsSection })));
const ContentPreviewRibbon = lazy(() => import('@/components/home/ContentPreviewRibbon').then(m => ({ default: m.ContentPreviewRibbon })));
const QuickAccessChips = lazy(() => import('@/components/home/QuickAccessChips').then(m => ({ default: m.QuickAccessChips })));

// Lazy load modals
const OnboardingModal = lazy(() => import('@/components/onboarding/OnboardingModal').then(m => ({ default: m.OnboardingModal })));

// Skeletons
const RibbonSkeleton = () => (
  <div className="space-y-2">
    <div className="flex gap-2 overflow-hidden">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-9 w-24 rounded-xl shrink-0" />
      ))}
    </div>
    <div className="flex gap-2 overflow-hidden">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-9 w-20 rounded-xl shrink-0" />
      ))}
    </div>
  </div>
);

const SectionSkeleton = () => (
  <div className="space-y-3">
    <Skeleton className="h-6 w-32" />
    <div className="flex gap-3 overflow-hidden">
      <Skeleton className="h-40 w-56 rounded-xl shrink-0" />
      <Skeleton className="h-40 w-56 rounded-xl shrink-0" />
      <Skeleton className="h-40 w-56 rounded-xl shrink-0" />
    </div>
  </div>
);

const WidgetSkeleton = () => (
  <Skeleton className="h-32 w-full rounded-xl" />
);

const Index = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('myuno-onboarding-complete');
  });
  const [contentMode, setContentMode] = useState<ContentMode>(() => {
    return (localStorage.getItem('myuno-content-mode') as ContentMode) || 'services';
  });

  const handleRefresh = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshKey(prev => prev + 1);
  }, []);

  // Prefetch owner dashboard data on hover
  const prefetchOwnerData = useCallback(() => {
    import('@/pages/owner/OwnerDashboard');
    
    if (!user?.id) return;
    
    queryClient.prefetchQuery({
      queryKey: ['user-active-context', user.id],
      queryFn: async () => {
        const { data } = await supabase
          .from('user_active_context')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        return data;
      },
      staleTime: 60000,
    });
    
    queryClient.prefetchQuery({
      queryKey: ['owner-properties', user.id],
      queryFn: async () => {
        const { data } = await supabase
          .from('owner_properties')
          .select('*')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false });
        return data || [];
      },
      staleTime: 60000,
    });
  }, [user?.id, queryClient]);

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

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="px-4 py-4 pb-24 space-y-4" key={refreshKey}>
          
          {/* ═══════════════════════════════════════════════════════════
              ABOVE THE FOLD (4-5 sections - no scroll needed)
              ═══════════════════════════════════════════════════════════ */}
          
          {/* 1. PWA Install Banner (conditional) */}
          <InstallBanner />

          {/* 2. Hero Banner - brand identity */}
          <HeroBanner />

          {/* 3. Search - primary action */}
          <div data-tour="search">
            <InlineSearch />
          </div>

          {/* 3. Safety Banner - trust marker */}
          <SafetyBanner />

          {/* 4. Content Mode Toggle */}
          <ContentModeToggle 
            value={contentMode} 
            onChange={setContentMode} 
          />

          {/* 5. Category Preview - context for selected mode */}
          <Suspense fallback={<RibbonSkeleton />}>
            {contentMode === 'services' ? (
              <ContentPreviewRibbon />
            ) : (
              <HomeCategoryRibbon />
            )}
          </Suspense>

          {/* 6. Smart Widget - personalized "Continue where you left off" */}
          <Suspense fallback={<WidgetSkeleton />}>
            <SmartWidget />
          </Suspense>

          {/* ═══════════════════════════════════════════════════════════
              BELOW THE FOLD (scroll to discover)
              ═══════════════════════════════════════════════════════════ */}

          {/* Visual Divider */}
          <div className="h-1 bg-gradient-to-r from-transparent via-border to-transparent rounded-full" />

          {contentMode === 'services' ? (
            <>
              {/* Quick Actions Grid */}
              <QuickActionsGrid />

              {/* Experiences Section */}
              <Suspense fallback={<SectionSkeleton />}>
                <ExperiencesSection />
              </Suspense>

              {/* Recommendations */}
              <div data-tour="recommended">
                <Suspense fallback={<SectionSkeleton />}>
                  <RecommendedCarousel />
                </Suspense>
              </div>

              {/* Visual Divider before B2B */}
              <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

              {/* B2B Section - For Owners/Partners (moved down) */}
              <Suspense fallback={<Skeleton className="h-12 w-full rounded-lg" />}>
                <QuickAccessChips />
              </Suspense>
            </>
          ) : (
            <>
              {/* Product Sections */}
              <Suspense fallback={<SectionSkeleton />}>
                <HomeProductsSection />
              </Suspense>

              {/* Visual Divider before B2B */}
              <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

              {/* B2B Section - For Owners/Partners (moved down) */}
              <Suspense fallback={<Skeleton className="h-12 w-full rounded-lg" />}>
                <QuickAccessChips />
              </Suspense>
            </>
          )}

        </div>
      </PullToRefresh>
    </AppLayout>
  );
};

export default Index;
