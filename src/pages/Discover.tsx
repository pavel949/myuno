import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Package } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { EmptyState } from '@/components/uno/EmptyState';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

// Hooks
import { useServices } from '@/hooks/useServices';
import { useCategories, CategoryGroup, Category } from '@/hooks/useCategories';
import { useFeaturedCategories } from '@/hooks/useFeaturedCategories';
import { useCategoryCounts } from '@/hooks/useCategoryCounts';

// Components
import { MiniAppsGrid } from '@/components/discover/MiniAppsGrid';
import { FeaturedServicesGallery } from '@/components/discover/FeaturedServicesGallery';
import { CategoryGroupSection } from '@/components/discover/CategoryGroupSection';
import { AudienceFilterTabs, AudienceFilter, AUDIENCE_CATEGORIES } from '@/components/discover/AudienceFilterTabs';

export default function Discover() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const initialAudience = (searchParams.get('audience') as AudienceFilter) || 'all';
  const [audienceFilter, setAudienceFilter] = useState<AudienceFilter>(initialAudience);
  const [refreshKey, setRefreshKey] = useState(0);

  // Data hooks
  const { groups, getName, isLoading: categoriesLoading, refetch: refetchCategories } = useCategories();
  const { isFeatured } = useFeaturedCategories();
  const { getCount } = useCategoryCounts();
  const { services, isLoading: servicesLoading, refetch: refetchServices } = useServices({ limit: 20 });

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
  const handleAudienceChange = useCallback((value: AudienceFilter) => {
    setAudienceFilter(value);
    setSearchParams(prev => {
      const params = new URLSearchParams(prev);
      if (value === 'all') {
        params.delete('audience');
      } else {
        params.set('audience', value);
      }
      return params;
    });
  }, [setSearchParams]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([refetchCategories(), refetchServices()]);
    setRefreshKey(prev => prev + 1);
  }, [refetchCategories, refetchServices]);

  const isLoading = categoriesLoading;

  return (
    <AppLayout showBottomNav>
      <PageContainer className="pb-24">
        <PageHeader 
          title={language === 'ru' ? 'Услуги' : 'Services'}
          showBack
          fallbackPath="/"
        />
        
        {/* Search Bar - Navigate to dedicated search page */}
        <div 
          className="relative cursor-pointer mt-4 mb-4"
          onClick={() => navigate('/search')}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            placeholder={language === 'ru' ? 'Поиск услуг и провайдеров...' : 'Search services & providers...'}
            className="pl-11 h-12 text-base rounded-xl bg-muted/50 border-0 cursor-pointer"
            readOnly
          />
        </div>

        <PullToRefresh onRefresh={handleRefresh} className="min-h-0">
          <div key={refreshKey} className="space-y-8">
            
            {/* Audience Filter */}
            <AudienceFilterTabs 
              value={audienceFilter} 
              onChange={handleAudienceChange} 
              language={language} 
            />
            
            {isLoading ? (
              <LoadingSkeleton />
            ) : filteredGroups.length === 0 ? (
              <EmptyState
                icon={Package}
                title={language === 'ru' ? 'Ничего не найдено' : 'Nothing found'}
                description={language === 'ru' ? 'Попробуйте другой фильтр' : 'Try a different filter'}
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
      </PageContainer>
    </AppLayout>
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
