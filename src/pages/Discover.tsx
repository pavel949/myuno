/**
 * Discover Page - Klook-style Super-App Service Marketplace
 * Structure:
 * 1. Hero Promo Carousel
 * 2. Quick Category Icons (IconBadge)
 * 3. Flash Deals with urgency
 * 4. Vertical Showcases (Yachts, Property, Beauty)
 * 5. Featured Providers with trust signals
 * 6. Partner CTA
 * 7. Popular Services
 * 8. Recently Viewed
 * 9. Cross-sell
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, Sparkles, Flame, Star, TrendingUp, Menu } from 'lucide-react';
import { MiniAppLayout } from '@/components/miniapp/MiniAppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { EmptyState } from '@/components/uno/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Unified components
import { CrossSellSection } from '@/components/crosssell';
import { 
  UnifiedFilterRibbon,
  FilterRibbonItem,
} from '@/components/shared';

// Hooks
import { useServices } from '@/hooks/useServices';
import { useCategories } from '@/hooks/useCategories';
import { useHomeServices } from '@/hooks/useHomeServices';
import { useUserPersonas, UserPersona } from '@/hooks/useUserPersonas';
import { useFeaturedCategories } from '@/hooks/useSuperAppCatalog';

// Service marketplace components
import {
  ServiceCategoryDrawer,
  ServicePromoCarousel,
  QuickServiceIcons,
  FeaturedProvidersCarousel,
  PopularServicesSection,
  RecentlyViewedServices,
  FlashServicesSection,
  VerticalShowcaseSection,
  PartnerCTACard,
} from '@/components/services';

// Legacy components (for filtered views only)
import { MiniAppsGrid } from '@/components/discover/MiniAppsGrid';
import { ThematicSection, THEMATIC_SECTIONS } from '@/components/discover/ThematicSection';
import { useFeaturedCategories as useLegacyFeaturedCategories } from '@/hooks/useFeaturedCategories';
import { useCategoryCounts } from '@/hooks/useCategoryCounts';

// Map UserPersona to audience filter for category filtering
const PERSONA_TO_CATEGORIES: Record<UserPersona, Set<string>> = {
  tourist: new Set(['yachts', 'tours', 'transport', 'restaurants', 'events', 'water-activities', 'beauty-spa']),
  resident: new Set(['legal', 'insurance', 'medical', 'banking', 'education', 'fitness', 'veterinary']),
  property_owner: new Set(['real-estate', 'cleaning', 'storage', 'maintenance', 'property-management']),
  investor: new Set(['real-estate', 'banking', 'legal', 'insurance']),
};

export default function Discover() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isRu = language === 'ru';
  
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Get saved persona from global state
  const { personas } = useUserPersonas();
  
  // Data hooks
  const { groups, getName, isLoading: categoriesLoading, refetch: refetchCategories } = useCategories();
  const { isFeatured } = useLegacyFeaturedCategories();
  const { getCount } = useCategoryCounts();
  const { services, isLoading: servicesLoading, refetch: refetchServices } = useServices({ limit: 20 });
  const { providers, isLoading: providersLoading } = useHomeServices();
  const { featured: featuredCategories } = useFeaturedCategories();

  // Determine if we should show filtered view based on saved personas
  const hasSpecificPersona = personas.length > 0;
  
  // Get combined categories for all selected personas
  const personaCategories = useMemo(() => {
    if (personas.length === 0) return new Set<string>();
    
    const combined = new Set<string>();
    personas.forEach(persona => {
      PERSONA_TO_CATEGORIES[persona]?.forEach(cat => combined.add(cat));
    });
    return combined;
  }, [personas]);

  // Filter groups based on saved personas (only if personas selected)
  const filteredGroups = useMemo(() => {
    if (!hasSpecificPersona) return groups;
    
    return groups
      .map(group => ({
        ...group,
        categories: (group.categories || []).filter(cat => 
          personaCategories.has(cat.slug) || personaCategories.has(cat.miniAppType || '')
        )
      }))
      .filter(group => group.categories.length > 0);
  }, [groups, hasSpecificPersona, personaCategories]);

  // Filter thematic sections based on personas
  const filteredThematicSections = useMemo(() => {
    if (!hasSpecificPersona) return THEMATIC_SECTIONS;
    
    const personaSectionMap: Record<UserPersona, string[]> = {
      tourist: ['leisure'],
      resident: ['life'],
      property_owner: ['business', 'life'],
      investor: ['business'],
    };
    
    const allowedSections = new Set<string>();
    personas.forEach(persona => {
      personaSectionMap[persona]?.forEach(s => allowedSections.add(s));
    });
    
    return THEMATIC_SECTIONS.filter(section => allowedSections.has(section.id));
  }, [hasSpecificPersona, personas]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([refetchCategories(), refetchServices()]);
    setRefreshKey(prev => prev + 1);
  }, [refetchCategories, refetchServices]);

  const isLoading = categoriesLoading;

  // Always show marketplace view (no filter ribbon needed - persona is set on home page)
  const showMarketplaceView = true;

  // Quick action items for ribbon - consistent with Market
  const quickActionItems: FilterRibbonItem[] = useMemo(() => [
    { id: 'deals', label: isRu ? 'Акции' : 'Deals', icon: Flame, variant: 'accent' as const },
    { id: 'popular', label: isRu ? 'Топ' : 'Top', icon: Star },
    { id: 'new', label: isRu ? 'Новое' : 'New', icon: Sparkles },
  ], [isRu]);

  // Category items for ribbon (top 3 from featured)
  const categoryItems: FilterRibbonItem[] = useMemo(() => {
    return featuredCategories.slice(0, 3).map(cat => ({
      id: cat.vertical,
      label: cat.label,
      emoji: cat.icon,
    }));
  }, [featuredCategories]);

  const handleQuickActionSelect = (id: string) => {
    navigate(`/services?filter=${id}`);
  };

  const handleCategorySelect = (vertical: string) => {
    const cat = featuredCategories.find(c => c.vertical === vertical);
    if (cat) {
      navigate(cat.path);
    }
  };

  const remainingCategoryCount = Math.max(0, featuredCategories.length - 3);

  return (
    <MiniAppLayout
      title={isRu ? 'Услуги' : 'Services'}
      subtitle={isRu ? 'Все сервисы для жизни в Таиланде' : 'All services for life in Thailand'}
      fallbackPath="/"
      searchPlaceholder={isRu ? 'Поиск услуг...' : 'Search services...'}
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      showHero={false}
      showCategories={false}
      showFilter={false}
    >
      {/* Filter Ribbon - Consistent with Market */}
      <div className="sticky top-0 z-30 -mx-4 bg-background/95 backdrop-blur-sm border-b border-border/30">
        <UnifiedFilterRibbon
          items={quickActionItems}
          onSelect={handleQuickActionSelect}
          leadingAction={<ServiceCategoryDrawer />}
          trailingAction={
            <>
              {categoryItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleCategorySelect(item.id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-muted/60 hover:bg-muted text-foreground transition-colors shrink-0"
                >
                  <span className="text-base">{item.emoji}</span>
                  <span className="whitespace-nowrap">{item.label}</span>
                </button>
              ))}
              {remainingCategoryCount > 0 && (
                <Badge
                  variant="secondary"
                  className="px-3 py-2 text-xs font-medium cursor-pointer hover:bg-secondary/80 shrink-0"
                  onClick={() => {
                    // Open catalog drawer programmatically - for now navigate
                    navigate('/services');
                  }}
                >
                  +{remainingCategoryCount} {isRu ? 'ещё' : 'more'}
                </Badge>
              )}
            </>
          }
        />
      </div>

      <PullToRefresh onRefresh={handleRefresh} className="min-h-0">
        <div key={refreshKey} className="space-y-4 pb-24">
          
          {isLoading ? (
            <LoadingSkeleton />
          ) : showMarketplaceView ? (
            /* KLOOK-STYLE MARKETPLACE VIEW */
            <>
              {/* 1. Hero Promo Carousel */}
              <ServicePromoCarousel />
              
              {/* 2. Quick Category Icons with IconBadge */}
              <QuickServiceIcons />
              
              {/* 3. Flash Deals with urgency */}
              <FlashServicesSection />
              
              {/* 4. Premium Vertical Showcases */}
              <VerticalShowcaseSection />
              
              {/* 5. Featured Providers with trust signals */}
              <FeaturedProvidersCarousel />
              
              {/* 6. Partner CTA - attract providers */}
              <PartnerCTACard />
              
              {/* 7. Popular Services */}
              <PopularServicesSection />
              
              {/* 8. Recently Viewed */}
              <RecentlyViewedServices />
              
              {/* 9. Cross-sell to other verticals */}
              <CrossSellSection currentVertical="services" />
            </>
          ) : (
            /* FILTERED VIEW - Legacy structure for audience segments */
            <>
              {filteredGroups.length === 0 && filteredThematicSections.length === 0 ? (
                <EmptyState
                  icon={Wrench}
                  title={isRu ? 'Ничего не найдено' : 'Nothing found'}
                  description={isRu ? 'Попробуйте другой фильтр' : 'Try a different filter'}
                />
              ) : (
                <>
                  {/* Mini-Apps Grid (filtered by audience) */}
                  <MiniAppsGrid
                    groups={filteredGroups}
                    getName={getName}
                    language={language}
                    isFeatured={isFeatured}
                    getCount={getCount}
                  />

                  {/* Thematic Sections (filtered) */}
                  <div className="space-y-2 px-4">
                    <h2 className="text-lg font-bold text-foreground">
                      {isRu ? 'Категории' : 'Categories'}
                    </h2>
                    {filteredThematicSections.map(section => (
                      <ThematicSection key={section.id} section={section} />
                    ))}
                  </div>
                </>
              )}
              
              {/* Cross-Sell */}
              <CrossSellSection currentVertical="services" />
            </>
          )}
        </div>
      </PullToRefresh>
    </MiniAppLayout>
  );
}

// Loading skeleton
function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Promo carousel skeleton */}
      <div className="px-4">
        <div className="flex gap-3 overflow-hidden">
          <Skeleton className="w-[280px] h-[140px] rounded-2xl shrink-0" />
          <Skeleton className="w-[280px] h-[140px] rounded-2xl shrink-0" />
        </div>
      </div>
      
      {/* Quick icons skeleton */}
      <div className="px-4">
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Skeleton className="w-12 h-12 rounded-xl" />
              <Skeleton className="w-10 h-2" />
            </div>
          ))}
        </div>
      </div>
      
      {/* Flash deals skeleton */}
      <div className="px-4">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="w-[160px] h-[180px] rounded-2xl shrink-0" />
          ))}
        </div>
      </div>
      
      {/* Vertical showcases skeleton */}
      <div className="px-4 space-y-3">
        <Skeleton className="h-[120px] rounded-2xl" />
        <Skeleton className="h-[120px] rounded-2xl" />
        <Skeleton className="h-[120px] rounded-2xl" />
      </div>
      
      {/* Featured providers skeleton */}
      <div className="px-4">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="w-[200px] h-[220px] rounded-2xl shrink-0" />
          ))}
        </div>
      </div>
    </div>
  );
}
