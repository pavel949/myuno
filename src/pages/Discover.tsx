import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Wrench, Sparkles, Plane, Users, Home as HomeIcon } from 'lucide-react';
import { MiniAppLayout } from '@/components/miniapp/MiniAppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { EmptyState } from '@/components/uno/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';

// Unified components
import { UnifiedFilterRibbon, FilterRibbonItem } from '@/components/shared';
import { CrossSellSection } from '@/components/crosssell';

// Hooks
import { useServices } from '@/hooks/useServices';
import { useCategories } from '@/hooks/useCategories';
import { useHomeServices } from '@/hooks/useHomeServices';

// New marketplace components
import {
  ServiceCategoryDrawer,
  ServicePromoCarousel,
  QuickServiceIcons,
  FeaturedProvidersCarousel,
  PopularServicesSection,
  RecentlyViewedServices,
  AllProvidersGrid,
} from '@/components/services';

// Legacy components (for filtered views)
import { MiniAppsGrid } from '@/components/discover/MiniAppsGrid';
import { ThematicSection, THEMATIC_SECTIONS } from '@/components/discover/ThematicSection';
import { useFeaturedCategories } from '@/hooks/useFeaturedCategories';
import { useCategoryCounts } from '@/hooks/useCategoryCounts';

export type AudienceFilter = 'all' | 'tourists' | 'residents' | 'owners';

const AUDIENCE_CATEGORIES: Record<AudienceFilter, Set<string>> = {
  all: new Set(),
  tourists: new Set(['yachts', 'tours', 'transport', 'restaurants', 'events', 'water-activities', 'beauty-spa']),
  residents: new Set(['legal', 'insurance', 'medical', 'banking', 'education', 'fitness', 'veterinary']),
  owners: new Set(['real-estate', 'cleaning', 'storage', 'maintenance', 'property-management']),
};

export default function Discover() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const isRu = language === 'ru';
  
  const initialAudience = (searchParams.get('audience') as AudienceFilter) || 'all';
  const [audienceFilter, setAudienceFilter] = useState<AudienceFilter>(initialAudience);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Data hooks
  const { groups, getName, isLoading: categoriesLoading, refetch: refetchCategories } = useCategories();
  const { isFeatured } = useFeaturedCategories();
  const { getCount } = useCategoryCounts();
  const { services, isLoading: servicesLoading, refetch: refetchServices } = useServices({ limit: 20 });
  const { providers, isLoading: providersLoading } = useHomeServices();

  // Filter items for ribbon
  const audienceItems: FilterRibbonItem[] = useMemo(() => [
    { id: 'all', label: isRu ? 'Все' : 'All', icon: Sparkles, variant: 'primary' as const },
    { id: 'tourists', label: isRu ? 'Туристам' : 'Tourists', icon: Plane },
    { id: 'residents', label: isRu ? 'Резидентам' : 'Residents', icon: Users },
    { id: 'owners', label: isRu ? 'Владельцам' : 'Owners', icon: HomeIcon },
  ], [isRu]);

  // Filter groups based on audience
  const filteredGroups = useMemo(() => {
    if (audienceFilter === 'all') return groups;
    
    const audienceCategories = AUDIENCE_CATEGORIES[audienceFilter];
    
    return groups
      .map(group => ({
        ...group,
        categories: (group.categories || []).filter(cat => 
          audienceCategories.has(cat.slug) || audienceCategories.has(cat.miniAppType || '')
        )
      }))
      .filter(group => group.categories.length > 0);
  }, [groups, audienceFilter]);

  // Filter thematic sections based on audience
  const filteredThematicSections = useMemo(() => {
    if (audienceFilter === 'all') return THEMATIC_SECTIONS;
    
    const audienceMap: Record<AudienceFilter, string[]> = {
      all: [],
      tourists: ['leisure'],
      residents: ['life'],
      owners: ['business', 'life'],
    };
    
    const allowedSections = audienceMap[audienceFilter];
    return THEMATIC_SECTIONS.filter(section => 
      allowedSections.length === 0 || allowedSections.includes(section.id)
    );
  }, [audienceFilter]);

  // Handlers
  const handleAudienceChange = useCallback((value: string) => {
    const filter = value as AudienceFilter;
    setAudienceFilter(filter);
    setSearchParams(prev => {
      const params = new URLSearchParams(prev);
      if (filter === 'all') {
        params.delete('audience');
      } else {
        params.set('audience', filter);
      }
      return params;
    });
  }, [setSearchParams]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([refetchCategories(), refetchServices()]);
    setRefreshKey(prev => prev + 1);
  }, [refetchCategories, refetchServices]);

  const isLoading = categoriesLoading;

  // Show marketplace view for "All" filter, legacy view for filtered
  const showMarketplaceView = audienceFilter === 'all';

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
      {/* Filter Ribbon with Category Drawer */}
      <div className="-mx-4 -mt-4 mb-4 sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border/30">
        <UnifiedFilterRibbon
          items={audienceItems}
          activeId={audienceFilter}
          onSelect={handleAudienceChange}
          leadingAction={<ServiceCategoryDrawer />}
          className="border-0"
        />
      </div>

      <PullToRefresh onRefresh={handleRefresh} className="min-h-0">
        <div key={refreshKey} className="space-y-6 pb-24">
          
          {isLoading ? (
            <LoadingSkeleton />
          ) : showMarketplaceView ? (
            /* MARKETPLACE VIEW - Full featured */
            <>
              {/* 1. Promo Carousel */}
              <ServicePromoCarousel />
              
              {/* 2. Quick Service Icons (4x2 grid) */}
              <QuickServiceIcons />
              
              {/* 3. Featured Providers Carousel */}
              <FeaturedProvidersCarousel />
              
              {/* 4. Popular Services Section */}
              <PopularServicesSection />
              
              {/* 5. Recently Viewed Services */}
              <RecentlyViewedServices />
              
              {/* 6. Thematic Sections (collapsible categories) */}
              <div className="space-y-2 px-4">
                <h2 className="text-lg font-bold text-foreground">
                  {isRu ? 'Все категории' : 'All Categories'}
                </h2>
                {THEMATIC_SECTIONS.map(section => (
                  <ThematicSection key={section.id} section={section} />
                ))}
              </div>
              
              {/* 7. All Providers Grid */}
              <AllProvidersGrid />
              
              {/* 8. Cross-Sell Section */}
              <CrossSellSection currentVertical="services" />
            </>
          ) : (
            /* FILTERED VIEW - Legacy structure */
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
      
      {/* Featured providers skeleton */}
      <div className="px-4">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="w-[200px] h-[220px] rounded-2xl shrink-0" />
          ))}
        </div>
      </div>
      
      {/* Popular services skeleton */}
      <div className="px-4">
        <Skeleton className="h-6 w-44 mb-4" />
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="w-[180px] h-[200px] rounded-2xl shrink-0" />
          ))}
        </div>
      </div>
    </div>
  );
}
