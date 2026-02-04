// Index page - Main home screen
import React, { useState, useCallback, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { SEOHead, createOrganizationSchema } from '@/components/seo';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { QuickActionsGrid } from '@/components/home/QuickActionsGrid';
import { HeroBlock } from '@/components/home/HeroBlock';
import { ContentModeToggle, ContentMode } from '@/components/home/ContentModeToggle';
import { supabase } from '@/integrations/supabase/client';
import { InstallBanner } from '@/components/pwa/InstallBanner';
import { PWAWelcomeScreen } from '@/components/pwa/PWAWelcomeScreen';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load components
const SmartWidget = lazy(() => import('@/components/home/SmartWidget').then(m => ({ default: m.SmartWidget })));
const DiscoveryCarousel = lazy(() => import('@/components/home/DiscoveryCarousel').then(m => ({ default: m.DiscoveryCarousel })));
const HomeCategoryRibbon = lazy(() => import('@/components/home/HomeCategoryRibbon').then(m => ({ default: m.HomeCategoryRibbon })));
const HomeProductsSection = lazy(() => import('@/components/home/HomeProductsSection').then(m => ({ default: m.HomeProductsSection })));
const ContentPreviewRibbon = lazy(() => import('@/components/home/ContentPreviewRibbon').then(m => ({ default: m.ContentPreviewRibbon })));
const QuickAccessChips = lazy(() => import('@/components/home/QuickAccessChips').then(m => ({ default: m.QuickAccessChips })));
const OffplanPromoSection = lazy(() => import('@/components/property/OffplanPromoSection').then(m => ({ default: m.OffplanPromoSection })));

// Lazy load modals
const OnboardingModal = lazy(() => import('@/components/onboarding/OnboardingModal').then(m => ({ default: m.OnboardingModal })));

// Skeletons for consistent loading states
const RibbonSkeleton = () => (
  <div className="flex gap-2 overflow-hidden">
    {[...Array(5)].map((_, i) => (
      <Skeleton key={i} className="h-9 w-24 rounded-xl shrink-0" />
    ))}
  </div>
);

const SectionSkeleton = () => (
  <div className="space-y-3">
    <Skeleton className="h-6 w-40" />
    <div className="flex gap-4 overflow-hidden">
      <Skeleton className="h-56 w-80 rounded-2xl shrink-0" />
      <Skeleton className="h-48 w-64 rounded-2xl shrink-0" />
      <Skeleton className="h-48 w-64 rounded-2xl shrink-0" />
    </div>
  </div>
);

const WidgetSkeleton = () => (
  <Skeleton className="h-28 w-full rounded-2xl" />
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
        <div className="px-4 py-4 pb-24 space-y-5" key={refreshKey}>
          
          {/* ═══════════════════════════════════════════════════════════
              BLOCK 1: PWA Install + Hero (Brand + Search + Safety)
              ═══════════════════════════════════════════════════════════ */}
          <InstallBanner />
          <HeroBlock />

          {/* ═══════════════════════════════════════════════════════════
              BLOCK 2: Mode Toggle + Category Ribbon
              ═══════════════════════════════════════════════════════════ */}
          <div className="space-y-3">
            <ContentModeToggle 
              value={contentMode} 
              onChange={setContentMode} 
            />
            
            <Suspense fallback={<RibbonSkeleton />}>
              {contentMode === 'services' ? (
                <ContentPreviewRibbon />
              ) : (
                <HomeCategoryRibbon />
              )}
            </Suspense>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              BLOCK 3: Smart Widget (personalized context)
              ═══════════════════════════════════════════════════════════ */}
          <Suspense fallback={<WidgetSkeleton />}>
            <SmartWidget />
          </Suspense>

          {/* Visual Divider */}
          <div className="h-1 bg-gradient-to-r from-transparent via-border to-transparent rounded-full" />

          {/* ═══════════════════════════════════════════════════════════
              BLOCK 4-6: Mode-specific content
              ═══════════════════════════════════════════════════════════ */}
          {contentMode === 'services' ? (
            <>
              {/* BLOCK 4: Quick Actions (6 items) */}
              <QuickActionsGrid />

              {/* BLOCK 5: Discovery Carousel (unified experiences) */}
              <Suspense fallback={<SectionSkeleton />}>
                <DiscoveryCarousel />
              </Suspense>

              {/* Visual Divider before B2B */}
              <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

              {/* BLOCK 6: Offplan Promo Section */}
              <Suspense fallback={<SectionSkeleton />}>
                <OffplanPromoSection />
              </Suspense>

              {/* BLOCK 7: B2B Section */}
              <Suspense fallback={<Skeleton className="h-12 w-full rounded-xl" />}>
                <QuickAccessChips />
              </Suspense>
            </>
          ) : (
            <>
              {/* Products Mode */}
              <Suspense fallback={<SectionSkeleton />}>
                <HomeProductsSection />
              </Suspense>

              {/* Visual Divider before B2B */}
              <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

              {/* B2B Section */}
              <Suspense fallback={<Skeleton className="h-12 w-full rounded-xl" />}>
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
