import React, { useState, useCallback, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Star, Shield, Search } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { SEOHead, createOrganizationSchema } from '@/components/seo';
import { Input } from '@/components/ui/input';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { SmartWidget } from '@/components/home/SmartWidget';
import { PromoBanner } from '@/components/home/PromoBanner';
import { QuickActionsGrid } from '@/components/home/QuickActionsGrid';
import { QuickAccessChips } from '@/components/home/QuickAccessChips';
import { RecommendedCarousel } from '@/components/home/RecommendedCarousel';
import { ForYouSection } from '@/components/recommendations/ForYouSection';
import { PersonalizedOffersSection } from '@/components/notifications/PersonalizedOffersSection';
import { ProductSection } from '@/components/market/ProductSection';
import { useMarketplaceProducts } from '@/hooks/useMarketplace';
import { supabase } from '@/integrations/supabase/client';
import { QuickListingFAB } from '@/components/listing/QuickListingFAB';

// Lazy load only modals (opened by user action)
const OnboardingModal = lazy(() => import('@/components/onboarding/OnboardingModal').then(m => ({ default: m.OnboardingModal })));
const GlobalSearchModal = lazy(() => import('@/components/search/GlobalSearchModal').then(m => ({ default: m.GlobalSearchModal })));

const Index = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { products: popularProducts, isLoading: productsLoading } = useMarketplaceProducts({ 
    popularOnly: true, 
    limit: 8 
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('myuno-onboarding-complete');
  });
  const [showSearch, setShowSearch] = useState(false);

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
      
      {/* Lazy Modals */}
      {showOnboarding && (
        <Suspense fallback={null}>
          <OnboardingModal 
            open={showOnboarding} 
            onComplete={() => setShowOnboarding(false)} 
          />
        </Suspense>
      )}
      {showSearch && (
        <Suspense fallback={null}>
          <GlobalSearchModal 
            open={showSearch} 
            onOpenChange={setShowSearch} 
          />
        </Suspense>
      )}

      {/* Quick Listing FAB */}
      <QuickListingFAB />

      <PullToRefresh onRefresh={handleRefresh} className="min-h-[calc(100vh-8rem)]">
        <div className="px-4 py-4 pb-24 space-y-4" key={refreshKey}>
          
          {/* Search Bar */}
          <div 
            onClick={() => setShowSearch(true)}
            className="relative cursor-pointer"
            data-tour="search"
            role="button"
            tabIndex={0}
            aria-label={t('action.search')}
            onKeyDown={(e) => e.key === 'Enter' && setShowSearch(true)}
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder={t('action.search') + '...'}
              className="pl-10 cursor-pointer"
              readOnly
              tabIndex={-1}
            />
          </div>

          {/* Smart Widget & Quick Actions */}
          <div className="space-y-3">
            <SmartWidget />
            <QuickActionsGrid />
          </div>

          {/* Visual Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

          {/* Promotions */}
          <PromoBanner />

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

            {(productsLoading || popularProducts.length > 0) && (
              <ProductSection
                title="Popular Products"
                titleRu="Популярные товары"
                products={popularProducts}
                seeAllPath="/market"
                maxItems={8}
                variant="scroll"
                isLoading={productsLoading}
                icon="trending"
              />
            )}

            {/* Trust Footer */}
            <div className="flex items-center justify-center gap-6 py-3 border-t border-border/50">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="w-4 h-4 text-primary" aria-hidden="true" />
                <span>{t('home.verifiedPartners')}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Star className="w-4 h-4 text-amber-500" aria-hidden="true" />
                <span>{t('home.realReviews')}</span>
              </div>
            </div>
          </div>
        </div>
      </PullToRefresh>
    </AppLayout>
  );
};

export default Index;
