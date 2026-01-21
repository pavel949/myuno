import React, { useState, useCallback, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { 
  Home, Car, Compass, Waves, Star, Shield, Scale,
  Sparkles, UtensilsCrossed, Dumbbell, Stethoscope, 
  GraduationCap, Ticket, Flower2, ShoppingBag, Wrench,
  ArrowRight, Search, Building2
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { SEOHead, createOrganizationSchema } from '@/components/seo';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { triggerRipple } from '@/hooks/useRipple';
import { triggerHaptic } from '@/hooks/useHapticFeedback';
import { playSound } from '@/hooks/useSoundEffects';
import { getFeedbackSettings } from '@/hooks/useFeedbackSettings';
import { SmartWidget } from '@/components/home/SmartWidget';
import { PromoBanner } from '@/components/home/PromoBanner';
import { QuickActionsGrid } from '@/components/home/QuickActionsGrid';
import { RecommendedCarousel } from '@/components/home/RecommendedCarousel';
import { ForYouSection } from '@/components/recommendations/ForYouSection';
import { PersonalizedOffersSection } from '@/components/notifications/PersonalizedOffersSection';
import { supabase } from '@/integrations/supabase/client';
import { QuickListingFAB } from '@/components/listing/QuickListingFAB';

// Lazy load only modals (opened by user action)
const OnboardingModal = lazy(() => import('@/components/onboarding/OnboardingModal').then(m => ({ default: m.OnboardingModal })));
const GlobalSearchModal = lazy(() => import('@/components/search/GlobalSearchModal').then(m => ({ default: m.GlobalSearchModal })));

// All service categories - prioritized by demand
const allCategories = [
  // Most popular first
  { id: 'transport', icon: Car, path: '/transport', color: 'from-indigo-500 to-blue-500' },
  { id: 'flowers', icon: Flower2, path: '/flowers', color: 'from-rose-500 to-pink-500' },
  { id: 'water', icon: Waves, path: '/water', color: 'from-cyan-500 to-blue-500' },
  { id: 'real-estate', icon: Home, path: '/property', color: 'from-teal-500 to-emerald-500' },
  { id: 'restaurants', icon: UtensilsCrossed, path: '/restaurants', color: 'from-orange-500 to-red-500' },
  // Secondary services
  { id: 'tours', icon: Compass, path: '/tours', color: 'from-amber-500 to-orange-500' },
  { id: 'beauty-spa', icon: Sparkles, path: '/beauty', color: 'from-pink-500 to-purple-500' },
  { id: 'medical', icon: Stethoscope, path: '/medical', color: 'from-emerald-500 to-green-500' },
  { id: 'legal', icon: Scale, path: '/legal', color: 'from-indigo-500 to-blue-600' },
  { id: 'insurance', icon: Shield, path: '/insurance', color: 'from-violet-500 to-purple-500' },
  { id: 'fitness', icon: Dumbbell, path: '/fitness', color: 'from-blue-500 to-cyan-500' },
  { id: 'market', icon: ShoppingBag, path: '/market', color: 'from-amber-500 to-yellow-500' },
  { id: 'kids-education', icon: GraduationCap, path: '/education', color: 'from-yellow-500 to-orange-500' },
  { id: 'events', icon: Ticket, path: '/events', color: 'from-purple-500 to-pink-500' },
  { id: 'services', icon: Wrench, path: '/services', color: 'from-slate-500 to-zinc-600' },
];

const Index = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
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
    // Prefetch the module first for faster code loading
    import('@/pages/owner/OwnerDashboard');
    
    if (!user?.id) return;
    
    // Prefetch user context data
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
    
    // Prefetch owner properties
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
    
    // Prefetch property care stats
    queryClient.prefetchQuery({
      queryKey: ['property-care-stats', user.id],
      queryFn: async () => {
        const [properties, inspections, requests, financials] = await Promise.all([
          supabase.from('owner_properties').select('id, status').eq('owner_id', user.id),
          supabase.from('property_inspections').select('id, status').eq('owner_id', user.id),
          supabase.from('property_service_requests').select('id, status').eq('owner_id', user.id),
          supabase.from('property_financials').select('amount, transaction_type').eq('owner_id', user.id),
        ]);

        const income = (financials.data || [])
          .filter((f: any) => f.transaction_type === 'income')
          .reduce((sum: number, f: any) => sum + Number(f.amount), 0);
        
        const expenses = (financials.data || [])
          .filter((f: any) => f.transaction_type === 'expense')
          .reduce((sum: number, f: any) => sum + Number(f.amount), 0);

        return {
          totalProperties: properties.data?.length || 0,
          activeProperties: properties.data?.filter((p: any) => p.status === 'active').length || 0,
          pendingInspections: inspections.data?.filter((i: any) => i.status === 'scheduled').length || 0,
          completedInspections: inspections.data?.filter((i: any) => i.status === 'completed').length || 0,
          pendingRequests: requests.data?.filter((r: any) => ['pending', 'confirmed', 'in_progress'].includes(r.status)).length || 0,
          totalIncome: income,
          totalExpenses: expenses,
          netIncome: income - expenses,
        };
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
      <Suspense fallback={null}>
        <OnboardingModal 
          open={showOnboarding} 
          onComplete={() => setShowOnboarding(false)} 
        />
        <GlobalSearchModal 
          open={showSearch} 
          onOpenChange={setShowSearch} 
        />
      </Suspense>

      {/* Quick Listing FAB */}
      <QuickListingFAB />

      <PullToRefresh onRefresh={handleRefresh} className="min-h-[calc(100vh-8rem)]">
        <div className="px-4 py-5 pb-24 space-y-6" key={refreshKey}>
          
          {/* ===== GROUP 1: Hero & Search ===== */}
          <div className="space-y-3">
            {/* Hero Section - myUNO Logo */}
            <motion.button
              onClick={(e) => {
                triggerRipple(e);
                const settings = getFeedbackSettings();
                if (settings.hapticEnabled) triggerHaptic('light');
                if (settings.soundEnabled) playSound('click');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="relative overflow-hidden w-full text-center space-y-3 p-4 rounded-2xl bg-gradient-to-br from-card via-card to-primary/5 border border-border/50 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
              aria-label="Scroll to top"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium group-hover:bg-primary/20 transition-colors">
                <Shield className="w-3.5 h-3.5" aria-hidden="true" />
                {t('home.trustBadge')}
              </div>
              <h1 className="text-3xl font-bold">
                <span className="text-muted-foreground">my</span>
                <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">UNO</span>
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                {t('home.heroSubtitle')}
              </p>
            </motion.button>

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
          </div>

          {/* ===== GROUP 2: Smart Widget & Quick Actions ===== */}
          <div className="space-y-3">
            <SmartWidget />
            <QuickActionsGrid />
          </div>

          {/* Visual Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

          {/* ===== GROUP 3: Promotions & Owner CTA ===== */}
          <div className="space-y-3">
            <PromoBanner />

            {/* Property Owner CTA */}
            <button 
              onClick={(e) => {
                triggerRipple(e);
                const settings = getFeedbackSettings();
                if (settings.hapticEnabled) triggerHaptic('light');
                if (settings.soundEnabled) playSound('click');
                navigate('/owner/landing');
              }}
              onMouseEnter={prefetchOwnerData}
              onTouchStart={prefetchOwnerData}
              className="w-full relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 p-4 shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 transition-all group text-left active:scale-95"
              aria-label={t('home.listProperty')}
            >
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNCAxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNCAxNHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA1Ii8+PC9nPjwvc3ZnPg==')] opacity-30 pointer-events-none" aria-hidden="true" />
              <div className="relative flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Building2 className="w-6 h-6 text-white" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-white/80 bg-white/20 px-2 py-0.5 rounded-full">
                      {t('home.forOwners')}
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-base leading-tight">
                    {t('home.listProperty')}
                  </h3>
                  <p className="text-xs text-white/80 line-clamp-1">
                    {t('home.listPropertyDesc')}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-white flex-shrink-0 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </div>
            </button>

            {/* Quick Listing CTA - Provider Onboarding */}
            <button 
              onClick={(e) => {
                triggerRipple(e);
                const settings = getFeedbackSettings();
                if (settings.hapticEnabled) triggerHaptic('light');
                if (settings.soundEnabled) playSound('click');
                navigate('/provider/onboarding');
              }}
              className="w-full relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-4 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all group text-left active:scale-95"
              aria-label={t('home.quickListing')}
            >
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNCAxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNCAxNHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA1Ii8+PC9nPjwvc3ZnPg==')] opacity-30 pointer-events-none" aria-hidden="true" />
              <div className="relative flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-6 h-6 text-white" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-white/80 bg-white/20 px-2 py-0.5 rounded-full">
                      {t('home.quickListingBadge')}
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-base leading-tight">
                    {t('home.quickListingTitle')}
                  </h3>
                  <p className="text-xs text-white/80 line-clamp-1">
                    {t('home.quickListingDesc')}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-white flex-shrink-0 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </div>
            </button>
          </div>

          {/* Visual Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

          {/* ===== GROUP 4: All Services ===== */}
          <div data-tour="categories">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-semibold">{t('home.allServices')}</h2>
              <button 
                onClick={(e) => {
                  triggerRipple(e);
                  const settings = getFeedbackSettings();
                  if (settings.hapticEnabled) triggerHaptic('light');
                  if (settings.soundEnabled) playSound('click');
                  navigate('/discover');
                }}
                className="relative overflow-hidden text-xs text-primary flex items-center gap-1 active:scale-95 min-h-[44px] px-2"
                aria-label={t('action.viewAll')}
              >
                {t('action.viewAll')}
                <ArrowRight className="w-3 h-3" aria-hidden="true" />
              </button>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {allCategories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={(e) => {
                      triggerRipple(e);
                      const settings = getFeedbackSettings();
                      if (settings.hapticEnabled) triggerHaptic('light');
                      if (settings.soundEnabled) playSound('click');
                      navigate(cat.path);
                    }}
                    className="relative overflow-hidden flex flex-col items-center p-2 rounded-xl hover:bg-card/80 transition-all group active:scale-95 min-h-[72px]"
                    aria-label={t(`category.${cat.id}`)}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center mb-1 bg-gradient-to-br",
                      cat.color,
                      "group-hover:scale-110 transition-transform"
                    )}>
                      <Icon className="w-5 h-5 text-white" aria-hidden="true" />
                    </div>
                    <span className="text-[10px] font-medium text-center leading-tight text-muted-foreground group-hover:text-foreground transition-colors line-clamp-2">
                      {t(`category.${cat.id}`)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Visual Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

          {/* ===== GROUP 5: Recommendations ===== */}
          <div className="space-y-5">
            {/* Recommended Carousel */}
            <div data-tour="recommended">
              <RecommendedCarousel />
            </div>

            {/* Personalized offers */}
            <PersonalizedOffersSection />

            {/* For You Section */}
            <ForYouSection />

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
