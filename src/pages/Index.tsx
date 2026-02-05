// Index page - Main home screen with contextual funnel architecture
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
import { PersonaSelectorBlock } from '@/components/home/PersonaSelectorBlock';
import { ContentModeToggle, ContentMode } from '@/components/home/ContentModeToggle';
import { supabase } from '@/integrations/supabase/client';
import { InstallBanner } from '@/components/pwa/InstallBanner';
import { PWAWelcomeScreen } from '@/components/pwa/PWAWelcomeScreen';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserPersonas } from '@/hooks/useUserPersonas';

// Lazy load components
const SmartWidget = lazy(() => import('@/components/home/SmartWidget').then(m => ({ default: m.SmartWidget })));
const DiscoveryCarousel = lazy(() => import('@/components/home/DiscoveryCarousel').then(m => ({ default: m.DiscoveryCarousel })));
const HomeCategoryRibbon = lazy(() => import('@/components/home/HomeCategoryRibbon').then(m => ({ default: m.HomeCategoryRibbon })));
const HomeProductsSection = lazy(() => import('@/components/home/HomeProductsSection').then(m => ({ default: m.HomeProductsSection })));
const ContentPreviewRibbon = lazy(() => import('@/components/home/ContentPreviewRibbon').then(m => ({ default: m.ContentPreviewRibbon })));
const QuickAccessChips = lazy(() => import('@/components/home/QuickAccessChips').then(m => ({ default: m.QuickAccessChips })));
const InvestorPromoCard = lazy(() => import('@/components/home/InvestorPromoCard').then(m => ({ default: m.InvestorPromoCard })));
const LifeSituationSelector = lazy(() => import('@/components/home/LifeSituationSelector'));

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
  <Skeleton className="h-40 w-full rounded-2xl" />
);

const Index = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { personas } = useUserPersonas();
  const [refreshKey, setRefreshKey] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('myuno-onboarding-complete');
  });
  const [contentMode, setContentMode] = useState<ContentMode>(() => {
    return (localStorage.getItem('myuno-content-mode') as ContentMode) || 'services';
  });

  // Check if investor persona is active
  const isInvestorActive = personas.includes('investor');

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

      <PullToRefresh onRefresh={handleRefresh} key={refreshKey}>
        <div className="px-4 py-4 pb-24 space-y-4">
          
          {/* ═══════════════════════════════════════════════════════════
              BLOCK 1: PWA Install + Hero (Brand + Search + SOS)
              Compact header - only essential elements
              ═══════════════════════════════════════════════════════════ */}
          <InstallBanner />
          <HeroBlock />

          {/* ═══════════════════════════════════════════════════════════
              BLOCK 2: Life Situation Selector
              "What do you need right now?" - contextual navigation
              ═══════════════════════════════════════════════════════════ */}
          <Suspense fallback={<RibbonSkeleton />}>
            <LifeSituationSelector />
          </Suspense>

          {/* ═══════════════════════════════════════════════════════════
              BLOCK 3: Smart Widget (Phuket Today + Quick Stats)
              Immediately visible context and quick actions
              ═══════════════════════════════════════════════════════════ */}
          <Suspense fallback={<WidgetSkeleton />}>
            <SmartWidget />
          </Suspense>

          {/* ═══════════════════════════════════════════════════════════
              BLOCK 4: Persona Selector
              Who are you? Tourist | Resident | Owner | Investor
              ═══════════════════════════════════════════════════════════ */}
          <PersonaSelectorBlock />

          {/* ═══════════════════════════════════════════════════════════
              BLOCK 5: Quick Actions (persona-driven)
              6 buttons that change based on active persona
              "More" button leads to /discover (services) or /market (products)
              ═══════════════════════════════════════════════════════════ */}
          <QuickActionsGrid contentMode={contentMode} />

          {/* ═══════════════════════════════════════════════════════════
              BLOCK 6: Content Toggle + Category Ribbon
              Services / Products mode switch
              ═══════════════════════════════════════════════════════════ */}
          <div className="space-y-3">
            {/* User guidance hint */}
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">
                {language === 'ru' ? 'Что вы ищете сегодня?' : 'What are you looking for today?'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {language === 'ru' ? 'Выберите: услуги или товары' : 'Choose: services or products'}
              </p>
            </div>
            
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
              BLOCK 7: Featured Content
              Mode-specific content sections
              ═══════════════════════════════════════════════════════════ */}
          {contentMode === 'services' ? (
            <>
              {/* Discovery Carousel (unified experiences) */}
              <Suspense fallback={<SectionSkeleton />}>
                <DiscoveryCarousel />
              </Suspense>

              {/* Investment CTA - only if investor persona is active */}
              {isInvestorActive && (
                <Suspense fallback={<WidgetSkeleton />}>
                  <InvestorPromoCard />
                </Suspense>
              )}

              {/* Visual Divider before B2B */}
              <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

              {/* B2B Section */}
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
