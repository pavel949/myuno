import React, { useState, useCallback, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { SEOHead, createOrganizationSchema } from '@/components/seo';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { PromoBanner } from '@/components/home/PromoBanner';
import { QuickActionsGrid } from '@/components/home/QuickActionsGrid';
import { QuickAccessChips } from '@/components/home/QuickAccessChips';
import { ContentModeToggle, ContentMode } from '@/components/home/ContentModeToggle';
import { PersonaSelector } from '@/components/home/PersonaSelector';
import { SafetyBanner } from '@/components/home/SafetyBanner';
import { supabase } from '@/integrations/supabase/client';
import { HeroBanner } from '@/components/home/HeroBanner';
import { InstallBanner } from '@/components/pwa/InstallBanner';
import { PWAWelcomeScreen } from '@/components/pwa/PWAWelcomeScreen';
import { InlineSearch } from '@/components/search/InlineSearch';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load heavier components that fetch data
const SmartWidget = lazy(() => import('@/components/home/SmartWidget').then(m => ({ default: m.SmartWidget })));
const MarketplacePromoCarousel = lazy(() => import('@/components/home/MarketplacePromoCarousel').then(m => ({ default: m.MarketplacePromoCarousel })));
const ExperiencesSection = lazy(() => import('@/components/home/ExperiencesSection').then(m => ({ default: m.ExperiencesSection })));
const RecommendedCarousel = lazy(() => import('@/components/home/RecommendedCarousel').then(m => ({ default: m.RecommendedCarousel })));
const ForYouSection = lazy(() => import('@/components/recommendations/ForYouSection').then(m => ({ default: m.ForYouSection })));
const PersonalizedOffersSection = lazy(() => import('@/components/notifications/PersonalizedOffersSection').then(m => ({ default: m.PersonalizedOffersSection })));
const KnowledgeHubBanner = lazy(() => import('@/components/home/KnowledgeHubBanner').then(m => ({ default: m.KnowledgeHubBanner })));
const HomeCategoryRibbon = lazy(() => import('@/components/home/HomeCategoryRibbon').then(m => ({ default: m.HomeCategoryRibbon })));
const HomeProductsSection = lazy(() => import('@/components/home/HomeProductsSection').then(m => ({ default: m.HomeProductsSection })));
import { ListWithUsBanner } from '@/components/home/ListWithUsBanner';

// Lazy load modals (opened by user action)
const OnboardingModal = lazy(() => import('@/components/onboarding/OnboardingModal').then(m => ({ default: m.OnboardingModal })));

// Loading skeleton for lazy components
const SectionSkeleton = () => (
  <div className="space-y-3">
    <Skeleton className="h-6 w-32" />
    <div className="flex gap-3 overflow-hidden">
      <Skeleton className="h-40 w-56 rounded-xl flex-shrink-0" />
      <Skeleton className="h-40 w-56 rounded-xl flex-shrink-0" />
      <Skeleton className="h-40 w-56 rounded-xl flex-shrink-0" />
    </div>
  </div>
);

const WidgetSkeleton = () => (
  <Skeleton className="h-36 w-full rounded-xl" />
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
  // Removed showSearch state - using InlineSearch now
  const [contentMode, setContentMode] = useState<ContentMode>(() => {
    return (localStorage.getItem('myuno-content-mode') as ContentMode) || 'services';
  });

  const handleRefresh = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshKey(prev => prev + 1);
  }, []);

  // Prefetch owner dashboard data on hover for faster navigation
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
      <SEOHead 
        jsonLd={createOrganizationSchema()}
      />
      
      {/* PWA Welcome Screen - shows on first launch after installation */}
      <PWAWelcomeScreen />
      
      {/* Lazy Modals */}
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
          
          {/* PWA Install Banner - shows on mobile if not installed */}
          <InstallBanner />

          {/* Hero Banner - Platform positioning */}
          <HeroBanner />

          {/* Inline Search */}
          <div data-tour="search">
            <InlineSearch />
          </div>

          {/* Persona Selector - personalization by user type */}
          <PersonaSelector />

          {/* Content Mode Toggle */}
          <ContentModeToggle 
            value={contentMode} 
            onChange={setContentMode} 
          />

          {/* Conditional Content based on mode */}
          {contentMode === 'services' ? (
            /* Services Mode Content */
            <>
              {/* Safety Banner - always visible trust marker */}
              <SafetyBanner />

              {/* Quick Access Chips - Owner/Partner/Wallet - prominent position */}
              <QuickAccessChips />

              {/* Smart Widget & Quick Actions */}
              <div className="space-y-4">
                <Suspense fallback={<WidgetSkeleton />}>
                  <SmartWidget />
                </Suspense>
                <QuickActionsGrid />
              </div>

              {/* Visual Divider */}
              <div className="h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent rounded-full" />

              {/* Promotions */}
              <PromoBanner />

              {/* Marketplace Promo Carousel - in colored section */}
              <Suspense fallback={<SectionSkeleton />}>
                <MarketplacePromoCarousel />
              </Suspense>

              {/* Visual Divider */}
              <div className="h-1 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent rounded-full" />

              {/* Experiences Section - Featured Tours & Activities in colored section */}
              <Suspense fallback={<SectionSkeleton />}>
                <ExperiencesSection />
              </Suspense>

              {/* Knowledge Hub Banner */}
              <Suspense fallback={null}>
                <KnowledgeHubBanner />
              </Suspense>

              {/* List With Us CTA */}
              <ListWithUsBanner variant="compact" />

              {/* Visual Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

              {/* Recommendations */}
              <div className="space-y-5">
                <div data-tour="recommended">
                  <Suspense fallback={<SectionSkeleton />}>
                    <RecommendedCarousel />
                  </Suspense>
                </div>

                <Suspense fallback={<SectionSkeleton />}>
                  <PersonalizedOffersSection />
                </Suspense>

                <Suspense fallback={<SectionSkeleton />}>
                  <ForYouSection />
                </Suspense>
              </div>
            </>
          ) : (
            /* Products Mode Content */
            <>
              {/* Category Ribbon for products */}
              <Suspense fallback={<Skeleton className="h-12 w-full rounded-lg" />}>
                <HomeCategoryRibbon />
              </Suspense>

              {/* Visual Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

              {/* Quick Access Chips */}
              <QuickAccessChips />

              {/* Visual Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

              {/* Product Sections */}
              <Suspense fallback={<SectionSkeleton />}>
                <HomeProductsSection />
              </Suspense>
            </>
          )}

        </div>
      </PullToRefresh>
    </AppLayout>
  );
};

export default Index;
