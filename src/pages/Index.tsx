import React, { useState, useCallback, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { SEOHead, createOrganizationSchema } from '@/components/seo';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { SmartWidget } from '@/components/home/SmartWidget';
import { PromoBanner } from '@/components/home/PromoBanner';
import { QuickActionsGrid } from '@/components/home/QuickActionsGrid';
import { MarketplacePromoCarousel } from '@/components/home/MarketplacePromoCarousel';
import { QuickAccessChips } from '@/components/home/QuickAccessChips';
import { RecommendedCarousel } from '@/components/home/RecommendedCarousel';
import { ForYouSection } from '@/components/recommendations/ForYouSection';
import { PersonalizedOffersSection } from '@/components/notifications/PersonalizedOffersSection';
import { ContentModeToggle, ContentMode } from '@/components/home/ContentModeToggle';
import { PersonaSelector } from '@/components/home/PersonaSelector';
import { HomeCategoryRibbon } from '@/components/home/HomeCategoryRibbon';
import { HomeProductsSection } from '@/components/home/HomeProductsSection';
import { KnowledgeHubBanner } from '@/components/home/KnowledgeHubBanner';
import { SafetyBanner } from '@/components/home/SafetyBanner';
import { supabase } from '@/integrations/supabase/client';
import { HeroBanner } from '@/components/home/HeroBanner';
import { InstallBanner } from '@/components/pwa/InstallBanner';
import { PWAWelcomeScreen } from '@/components/pwa/PWAWelcomeScreen';
import { InlineSearch } from '@/components/search/InlineSearch';

// Lazy load only modals (opened by user action)
const OnboardingModal = lazy(() => import('@/components/onboarding/OnboardingModal').then(m => ({ default: m.OnboardingModal })));

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

              {/* Smart Widget & Quick Actions */}
              <div className="space-y-3">
                <SmartWidget />
                <QuickActionsGrid />
              </div>

              {/* Visual Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

              {/* Promotions */}
              <PromoBanner />

              {/* Marketplace Promo Carousel */}
              <MarketplacePromoCarousel />

              {/* Knowledge Hub Banner */}
              <KnowledgeHubBanner />

              {/* Quick Access Chips - Owner/Partner/Wallet */}
              <QuickAccessChips />

              {/* Visual Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

              {/* Recommendations */}
              <div className="space-y-5">
                <div data-tour="recommended">
                  <RecommendedCarousel />
                </div>

                <PersonalizedOffersSection />

                <ForYouSection />
              </div>
            </>
          ) : (
            /* Products Mode Content */
            <>
              {/* Category Ribbon for products */}
              <HomeCategoryRibbon />

              {/* Visual Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

              {/* Quick Access Chips */}
              <QuickAccessChips />

              {/* Visual Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

              {/* Product Sections */}
              <HomeProductsSection />
            </>
          )}

          {/* Footer - minimal */}
          <div className="text-center py-3 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              © 2025 myUNO · {t('home.verifiedPartners')}
            </p>
          </div>
        </div>
      </PullToRefresh>
    </AppLayout>
  );
};

export default Index;
