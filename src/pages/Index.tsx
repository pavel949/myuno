import React, { useState, useCallback, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, Car, Compass, Waves, Star, Shield, Scale,
  Sparkles, UtensilsCrossed, Dumbbell, Stethoscope, 
  GraduationCap, Ticket, Flower2, ShoppingBag, Wrench,
  ArrowRight, MapPin, Search, Building2
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { triggerRipple } from '@/hooks/useRipple';
import { FadeInUp } from '@/components/layout/AnimatedList';
import { SmartWidget } from '@/components/home/SmartWidget';
import { PromoBanner } from '@/components/home/PromoBanner';
import { QuickActionsGrid } from '@/components/home/QuickActionsGrid';
import { RecommendedCarousel } from '@/components/home/RecommendedCarousel';

// Lazy load heavy components
const OnboardingModal = lazy(() => import('@/components/onboarding/OnboardingModal').then(m => ({ default: m.OnboardingModal })));
const GlobalSearchModal = lazy(() => import('@/components/search/GlobalSearchModal').then(m => ({ default: m.GlobalSearchModal })));
const ForYouSection = lazy(() => import('@/components/recommendations/ForYouSection').then(m => ({ default: m.ForYouSection })));
const PersonalizedOffersSection = lazy(() => import('@/components/notifications/PersonalizedOffersSection').then(m => ({ default: m.PersonalizedOffersSection })));

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
  const [refreshKey, setRefreshKey] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('uno-onboarding-complete');
  });
  const [showSearch, setShowSearch] = useState(false);

  const handleRefresh = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshKey(prev => prev + 1);
  }, []);

  return (
    <AppLayout showFooter>
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

      <PullToRefresh onRefresh={handleRefresh} className="h-[calc(100vh-8rem)]">
        <div className="px-4 py-6 space-y-6" key={refreshKey}>
          
          {/* Hero Section - What is UNO */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
              <Shield className="w-3.5 h-3.5" />
              {t('home.trustBadge')}
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text">
              UNO
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
              {t('home.heroSubtitle')}
            </p>
          </div>

          {/* Search Bar */}
          <div 
            onClick={() => setShowSearch(true)}
            className="relative cursor-pointer"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder={t('action.search') + '...'}
              className="pl-10 cursor-pointer"
              readOnly
            />
          </div>

          {/* Smart Widget - Weather, Event, Recommendation */}
          <FadeInUp delay={0.05}>
            <SmartWidget />
          </FadeInUp>

          {/* Quick Actions - Large prominent buttons */}
          <FadeInUp delay={0.08}>
            <QuickActionsGrid />
          </FadeInUp>

          {/* Promo Banner */}
          <FadeInUp delay={0.1}>
            <PromoBanner />
          </FadeInUp>

          {/* Property Owner CTA - Prominent */}
          <FadeInUp delay={0.12}>
            <button 
              onClick={() => navigate('/owner')}
              className="w-full relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 p-5 shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 transition-all group text-left"
            >
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNCAxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNCAxNHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA1Ii8+PC9nPjwvc3ZnPg==')] opacity-30" />
              <div className="relative flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-white/80 bg-white/20 px-2 py-0.5 rounded-full">
                      {t('home.forOwners')}
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-base">
                    {t('home.listProperty')}
                  </h3>
                  <p className="text-xs text-white/80 line-clamp-1">
                    {t('home.listPropertyDesc')}
                  </p>
                </div>
                <ArrowRight className="w-6 h-6 text-white flex-shrink-0 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </FadeInUp>

          {/* All Services Grid */}
          <FadeInUp delay={0.14}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold">{t('home.allServices')}</h2>
              <button 
                onClick={() => navigate('/discover')}
                className="text-xs text-primary flex items-center gap-1"
              >
                {t('action.viewAll')}
                <ArrowRight className="w-3 h-3" />
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
                      navigate(cat.path);
                    }}
                    className="flex flex-col items-center p-2 rounded-xl hover:bg-card/80 transition-all group active:scale-95"
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center mb-1.5 bg-gradient-to-br",
                      cat.color,
                      "group-hover:scale-110 transition-transform"
                    )}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[10px] font-medium text-center leading-tight text-muted-foreground group-hover:text-foreground transition-colors line-clamp-2">
                      {t(`category.${cat.id}`)}
                    </span>
                  </button>
                );
              })}
            </div>
          </FadeInUp>

          {/* Recommended Carousel - Combined Tours/Water/Featured */}
          <FadeInUp delay={0.16}>
            <RecommendedCarousel />
          </FadeInUp>

          {/* Personalized offers (shows only if available) */}
          <Suspense fallback={<div className="h-24 animate-pulse bg-muted rounded-lg" />}>
            <FadeInUp delay={0.18}>
              <PersonalizedOffersSection />
            </FadeInUp>
          </Suspense>

          {/* For You Section (personalized recommendations) */}
          <Suspense fallback={<div className="h-24 animate-pulse bg-muted rounded-lg" />}>
            <FadeInUp delay={0.2}>
              <ForYouSection />
            </FadeInUp>
          </Suspense>

          {/* Trust Footer */}
          <FadeInUp delay={0.22}>
            <div className="flex items-center justify-center gap-6 py-4 border-t border-border/50">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="w-4 h-4 text-primary" />
                <span>{t('home.verifiedPartners')}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Star className="w-4 h-4 text-amber-500" />
                <span>{t('home.realReviews')}</span>
              </div>
            </div>
          </FadeInUp>
        </div>
      </PullToRefresh>
    </AppLayout>
  );
};

export default Index;
