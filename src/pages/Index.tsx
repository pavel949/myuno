import React, { useState, useCallback, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, UtensilsCrossed, Dumbbell, Stethoscope, 
  GraduationCap, Home, Car, Ticket, Flower2,
  ArrowRight, MapPin, Search, Wrench, AlertTriangle,
  Compass, Waves, Star, Shield, Scale, Building2, Calendar, BarChart3, Key, ShoppingBag
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { UnifiedCard } from '@/components/uno/UnifiedCard';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { triggerRipple } from '@/hooks/useRipple';
import { FadeInUp } from '@/components/layout/AnimatedList';
import { Button } from '@/components/ui/button';
import { QuickServicesSection } from '@/components/home/QuickServicesSection';

// Lazy load heavy components for faster initial load
const OnboardingModal = lazy(() => import('@/components/onboarding/OnboardingModal').then(m => ({ default: m.OnboardingModal })));
const GlobalSearchModal = lazy(() => import('@/components/search/GlobalSearchModal').then(m => ({ default: m.GlobalSearchModal })));
const ForYouSection = lazy(() => import('@/components/recommendations/ForYouSection').then(m => ({ default: m.ForYouSection })));
const RecentlyViewedSection = lazy(() => import('@/components/recommendations/RecentlyViewedSection').then(m => ({ default: m.RecentlyViewedSection })));
const PersonalizedOffersSection = lazy(() => import('@/components/notifications/PersonalizedOffersSection').then(m => ({ default: m.PersonalizedOffersSection })));
const ToursSection = lazy(() => import('@/components/home/ToursSection').then(m => ({ default: m.ToursSection })));
const WaterSection = lazy(() => import('@/components/home/WaterSection').then(m => ({ default: m.WaterSection })));

// Top categories - most popular for tourists in Phuket
const topCategories = [
  { id: 'real-estate', icon: Home, path: '/property', color: 'from-teal-500 to-emerald-500' },
  { id: 'transport', icon: Car, path: '/transport', color: 'from-indigo-500 to-blue-500' },
  { id: 'restaurants', icon: UtensilsCrossed, path: '/restaurants', color: 'from-orange-500 to-red-500' },
  { id: 'tours', icon: Compass, path: '/tours', color: 'from-amber-500 to-orange-500' },
];

// Other categories
const otherCategories = [
  { id: 'water', icon: Waves, path: '/water', color: 'from-cyan-500 to-blue-500' },
  { id: 'medical', icon: Stethoscope, path: '/medical', color: 'from-emerald-500 to-green-500' }, // Pharmacy is part of Medical
  { id: 'market', icon: ShoppingBag, path: '/market', color: 'from-amber-500 to-yellow-500' },
  { id: 'flowers', icon: Flower2, path: '/flowers', color: 'from-rose-500 to-pink-500' },
  { id: 'beauty-spa', icon: Sparkles, path: '/beauty', color: 'from-pink-500 to-purple-500' },
  { id: 'fitness', icon: Dumbbell, path: '/fitness', color: 'from-blue-500 to-cyan-500' },
  { id: 'legal', icon: Scale, path: '/legal', color: 'from-indigo-500 to-blue-600' },
  { id: 'services', icon: Wrench, path: '/services', color: 'from-slate-500 to-zinc-600' },
  { id: 'kids-education', icon: GraduationCap, path: '/education', color: 'from-yellow-500 to-orange-500' },
  { id: 'events', icon: Ticket, path: '/events', color: 'from-purple-500 to-pink-500' },
];

const featuredServices = [
  {
    id: 'featured-1',
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=80',
    title: 'Orchid Spa & Wellness',
    titleRu: 'Орхидея СПА и Велнес',
    rating: 4.9,
    reviewCount: 156,
    price: 1500,
    location: 'Kata Beach',
    locationRu: 'Ката Бич',
    isFeatured: true,
    isVerified: true,
    path: '/beauty',
  },
  {
    id: 'featured-2',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80',
    title: 'Ocean View Restaurant',
    titleRu: 'Ресторан с видом на океан',
    rating: 4.7,
    reviewCount: 89,
    price: 800,
    location: 'Patong',
    locationRu: 'Патонг',
    isNew: true,
    path: '/discover',
  },
  {
    id: 'featured-3',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80',
    title: 'Fitness First Phuket',
    titleRu: 'Фитнес Ферст Пхукет',
    rating: 4.8,
    reviewCount: 234,
    price: 2500,
    location: 'Rawai',
    locationRu: 'Равай',
    path: '/discover',
  },
];

const Index = () => {
  const { t, language } = useLanguage();
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
        <div className="px-4 py-6 space-y-8" key={refreshKey}>
        {/* Search Bar */}
        <div 
          onClick={() => setShowSearch(true)}
          className="relative cursor-pointer"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder={language === 'ru' ? 'Поиск услуг, мест, событий...' : 'Search services, places, events...'}
            className="pl-10 cursor-pointer"
            readOnly
          />
        </div>

        {/* Hero Section - Trust & Infrastructure */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-card to-card p-6 border border-border">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 mb-3">
                  <Shield className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-medium text-primary">
                    {language === 'ru' ? 'Проверено' : 'Verified'}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-2 leading-tight">
                  {language === 'ru' ? 'Дом там, где UNO' : 'Home is where UNO is'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {language === 'ru' ? 'Твоя жизнь за рубежом — проще' : 'Your life abroad, simplified'}
                </p>
                <div className="flex items-center gap-3 mt-4">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    <span>Phuket</span>
                  </div>
                  <div className="w-px h-3 bg-border" />
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Star className="w-3.5 h-3.5 text-amber-500" />
                    <span>500+ {language === 'ru' ? 'партнёров' : 'partners'}</span>
                  </div>
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="flex-shrink-0 gap-1.5 font-bold"
                onClick={() => navigate('/sos')}
              >
                <AlertTriangle className="w-4 h-4" />
                SOS
              </Button>
            </div>
          </div>
        </div>

        {/* Property Owner Section */}
        <FadeInUp delay={0.05}>
          <div 
            onClick={() => navigate('/owner')}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500/10 via-card to-emerald-500/5 p-5 border border-teal-500/20 cursor-pointer hover:border-teal-500/40 transition-all group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl" />
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground mb-0.5">
                  {language === 'ru' ? 'Владелец недвижимости?' : 'Property Owner?'}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {language === 'ru' 
                    ? 'Управляйте арендой, бронированиями и обслуживанием в одном месте' 
                    : 'Manage rentals, bookings & maintenance in one place'}
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-teal-500 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
            </div>
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border/50">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="w-3.5 h-3.5 text-teal-500" />
                <span>{language === 'ru' ? 'Календарь' : 'Calendar'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Key className="w-3.5 h-3.5 text-teal-500" />
                <span>{language === 'ru' ? 'Check-in' : 'Check-in'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <BarChart3 className="w-3.5 h-3.5 text-teal-500" />
                <span>{language === 'ru' ? 'Аналитика' : 'Analytics'}</span>
              </div>
            </div>
          </div>
        </FadeInUp>

        {/* Quick Services */}
        <FadeInUp delay={0.08}>
          <QuickServicesSection />
        </FadeInUp>

        {/* Top Categories - Large Cards */}
        <FadeInUp delay={0.1}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{language === 'ru' ? 'Популярное' : 'Popular'}</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {topCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={(e) => {
                    triggerRipple(e);
                    navigate(cat.path);
                  }}
                  className="relative overflow-hidden flex items-center gap-3 p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all group active:scale-[0.98]"
                >
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br flex-shrink-0",
                    cat.color,
                    "group-hover:scale-110 transition-transform"
                  )}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left min-w-0">
                    <span className="text-sm font-semibold block truncate">
                      {t(`category.${cat.id}`)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {language === 'ru' ? 'Открыть' : 'Explore'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </FadeInUp>

        {/* Other Categories - Compact Grid */}
        <FadeInUp delay={0.15}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-medium text-muted-foreground">{language === 'ru' ? 'Все сервисы' : 'All Services'}</h2>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {otherCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={(e) => {
                    triggerRipple(e);
                    navigate(cat.path);
                  }}
                  className="flex flex-col items-center p-2 rounded-xl hover:bg-card/50 transition-all group active:scale-95"
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

        {/* Lazy-loaded sections */}
        <Suspense fallback={<div className="h-24 animate-pulse bg-muted rounded-lg" />}>
          <FadeInUp delay={0.2}>
            <PersonalizedOffersSection />
          </FadeInUp>
        </Suspense>

        <Suspense fallback={<div className="h-24 animate-pulse bg-muted rounded-lg" />}>
          <FadeInUp delay={0.22}>
            <ForYouSection />
          </FadeInUp>
        </Suspense>

        <Suspense fallback={<div className="h-24 animate-pulse bg-muted rounded-lg" />}>
          <FadeInUp delay={0.24}>
            <RecentlyViewedSection />
          </FadeInUp>
        </Suspense>

        {/* Featured Services */}
        <FadeInUp delay={0.26}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{t('home.featuredServices')}</h2>
            <button 
              onClick={() => navigate('/discover')}
              className="text-sm text-primary flex items-center gap-1"
            >
              {t('action.viewAll')}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredServices.map((service) => (
              <UnifiedCard
                key={service.id}
                id={service.id}
                image={service.image}
                title={language === 'ru' ? service.titleRu : service.title}
                rating={service.rating}
                reviewCount={service.reviewCount}
                price={service.price}
                priceLabel={t('label.from')}
                location={language === 'ru' ? service.locationRu : service.location}
                isVerified={service.isVerified}
                isNew={service.isNew}
                isFeatured={service.isFeatured}
                onClick={() => navigate(service.path)}
              />
            ))}
          </div>
        </FadeInUp>

        {/* Tours Section - Lazy */}
        <Suspense fallback={<div className="h-48 animate-pulse bg-muted rounded-lg" />}>
          <FadeInUp delay={0.28}>
            <ToursSection />
          </FadeInUp>
        </Suspense>

        {/* Water Activities Section - Lazy */}
        <Suspense fallback={<div className="h-48 animate-pulse bg-muted rounded-lg" />}>
          <FadeInUp delay={0.3}>
            <WaterSection />
          </FadeInUp>
        </Suspense>

        {/* Trust Footer */}
        <FadeInUp delay={0.32}>
          <div className="flex items-center justify-center gap-6 py-4 border-t border-border/50">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="w-4 h-4 text-primary" />
              <span>{language === 'ru' ? 'Проверенные партнёры' : 'Verified partners'}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Star className="w-4 h-4 text-amber-500" />
              <span>{language === 'ru' ? 'Реальные отзывы' : 'Real reviews'}</span>
            </div>
          </div>
        </FadeInUp>
        </div>
      </PullToRefresh>
    </AppLayout>
  );
};

export default Index;
