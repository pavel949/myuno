import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Package, Users, Plane, Home as HomeIcon, Sparkles } from 'lucide-react';
import { MiniAppLayout } from '@/components/miniapp/MiniAppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { EmptyState } from '@/components/uno/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';

// Unified components
import { UnifiedFilterRibbon, FilterRibbonItem } from '@/components/shared';

// Hooks
import { useServices } from '@/hooks/useServices';
import { useCategories, CategoryGroup, Category } from '@/hooks/useCategories';
import { useFeaturedCategories } from '@/hooks/useFeaturedCategories';
import { useCategoryCounts } from '@/hooks/useCategoryCounts';

// Components
import { MiniAppsGrid } from '@/components/discover/MiniAppsGrid';
import { FeaturedServicesGallery } from '@/components/discover/FeaturedServicesGallery';
import { CategoryGroupSection } from '@/components/discover/CategoryGroupSection';

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

  // Data hooks
  const { groups, getName, isLoading: categoriesLoading, refetch: refetchCategories } = useCategories();
  const { isFeatured } = useFeaturedCategories();
  const { getCount } = useCategoryCounts();
  const { services, isLoading: servicesLoading, refetch: refetchServices } = useServices({ limit: 20 });

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

  // Inline search state
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <MiniAppLayout
      title={isRu ? 'Услуги' : 'Services'}
      subtitle={isRu ? 'Все сервисы для жизни в Таиланде' : 'All services for life in Thailand'}
      fallbackPath="/"
      searchPlaceholder={isRu ? 'Поиск услуг и провайдеров...' : 'Search services & providers...'}
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      showHero={false}
      showCategories={false}
      showFilter={false}
    >
      {/* Audience Filter Ribbon */}
      <div className="sticky top-[124px] z-30 -mx-4 bg-background/95 backdrop-blur-sm border-b border-border/30">
        <UnifiedFilterRibbon
          items={audienceItems}
          activeId={audienceFilter}
          onSelect={handleAudienceChange}
          className="px-4 py-2 border-0"
        />
      </div>

      <div className="pt-2">
          <PullToRefresh onRefresh={handleRefresh} className="min-h-0">
            <div key={refreshKey} className="space-y-6 pt-4">
              
              {isLoading ? (
                <LoadingSkeleton />
              ) : filteredGroups.length === 0 ? (
                <EmptyState
                  icon={Package}
                  title={isRu ? 'Ничего не найдено' : 'Nothing found'}
                  description={isRu ? 'Попробуйте другой фильтр' : 'Try a different filter'}
                />
              ) : (
                <>
                  {/* 1. Mini-Apps Grid (full booking experience) */}
                  <MiniAppsGrid
                    groups={filteredGroups}
                    getName={getName}
                    language={language}
                    isFeatured={isFeatured}
                    getCount={getCount}
                  />
                  
                  {/* 2. Featured Services Gallery */}
                  {audienceFilter === 'all' && (
                    <FeaturedServicesGallery
                      services={services}
                      isLoading={servicesLoading}
                      viewAllPath="/services"
                    />
                  )}
                  
                  {/* 3. Other Categories (non-mini-app) grouped */}
                  <div className="space-y-6">
                    {filteredGroups.map(group => (
                      <CategoryGroupSection
                        key={group.id}
                        group={group}
                        getName={getName}
                        language={language}
                        getCount={getCount}
                        excludeMiniApps={true}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </PullToRefresh>
        </div>
    </MiniAppLayout>
  );
}

// Loading skeleton
function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      {/* Mini-apps skeleton */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div className="space-y-1">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-2xl" />
          ))}
        </div>
      </div>
      
      {/* Services skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <div className="flex gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="w-[180px] h-[180px] rounded-2xl shrink-0" />
          ))}
        </div>
      </div>
      
      {/* Categories skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
