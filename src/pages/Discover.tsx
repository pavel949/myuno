import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Search, SlidersHorizontal, X, Sparkles, Package, 
  TrendingUp, ArrowDown, ArrowUp, Star, Clock, Check, ChevronRight,
  History, Crown, Flame, Layers, Users, Compass, Home
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { UnifiedCard } from '@/components/uno/UnifiedCard';
import { SkeletonGrid } from '@/components/uno/SkeletonCard';
import { EmptyState } from '@/components/uno/EmptyState';
import { AnimatedGrid, FadeInUp } from '@/components/layout/AnimatedList';
import { useServices, Service, SortOption, useCategories as useServiceCategories } from '@/hooks/useServices';
import { useCategories, CategoryGroup, Category } from '@/hooks/useCategories';
import { useViewHistory, ViewHistoryItem } from '@/hooks/useViewHistory';
import { useFeaturedCategories } from '@/hooks/useFeaturedCategories';
import { useCategoryCounts } from '@/hooks/useCategoryCounts';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type TabValue = 'all' | 'categories' | 'providers';
type AudienceFilter = 'all' | 'tourists' | 'residents' | 'owners';

// Category slugs for each audience
const AUDIENCE_CATEGORIES: Record<AudienceFilter, Set<string>> = {
  all: new Set(), // empty means show all
  tourists: new Set(['yachts', 'tours', 'transport', 'events', 'water', 'restaurants', 'flowers', 'beauty', 'beauty-spa']),
  residents: new Set(['legal', 'insurance', 'medical', 'banking', 'property', 'real-estate', 'education', 'visa', 'pharmacy', 'fitness']),
  owners: new Set(['property', 'real-estate', 'cleaning', 'services', 'legal', 'insurance', 'babysitter']),
};

const SORT_OPTIONS: { value: SortOption; label: string; labelRu: string; icon: React.ElementType }[] = [
  { value: 'popular', label: 'Popular', labelRu: 'Популярные', icon: TrendingUp },
  { value: 'price_asc', label: 'Price: Low to High', labelRu: 'Цена: по возрастанию', icon: ArrowUp },
  { value: 'price_desc', label: 'Price: High to Low', labelRu: 'Цена: по убыванию', icon: ArrowDown },
  { value: 'rating', label: 'Rating', labelRu: 'По рейтингу', icon: Star },
  { value: 'newest', label: 'Newest', labelRu: 'Новые', icon: Clock },
];

const PRICE_RANGES = [
  { label: 'Any', labelRu: 'Любая', min: 0, max: Infinity },
  { label: '< 1000 ฿', labelRu: '< 1000 ฿', min: 0, max: 1000 },
  { label: '1000-2000 ฿', labelRu: '1000-2000 ฿', min: 1000, max: 2000 },
  { label: '2000-5000 ฿', labelRu: '2000-5000 ฿', min: 2000, max: 5000 },
  { label: '> 5000 ฿', labelRu: '> 5000 ฿', min: 5000, max: Infinity },
];

export default function Discover() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const initialTab = (searchParams.get('tab') as TabValue) || 'all';
  const initialAudience = (searchParams.get('audience') as AudienceFilter) || 'all';
  const [activeTab, setActiveTab] = useState<TabValue>(initialTab);
  const [audienceFilter, setAudienceFilter] = useState<AudienceFilter>(initialAudience);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<{ min: number; max: number } | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Hooks
  const { user } = useAuth();
  const { groups, getName, isLoading: categoriesLoading, refetch: refetchCategories } = useCategories();
  const { categories: serviceCategories, isLoading: serviceCategoriesLoading } = useServiceCategories();
  const { history, isLoading: historyLoading } = useViewHistory();
  const { isFeatured, getFeaturedPackage } = useFeaturedCategories();
  const { getCount } = useCategoryCounts();
  const { services, isLoading: servicesLoading, refetch: refetchServices } = useServices({
    categoryId: selectedCategory || undefined,
    searchQuery: debouncedSearch || undefined,
    priceMin: priceRange?.min,
    priceMax: priceRange?.max === Infinity ? undefined : priceRange?.max,
    sortBy,
  });

  // Recent categories from view history (last 4)
  const recentCategories = useMemo(() => {
    return history
      .filter(h => h.item_type === 'category' || h.item_type === 'tour' || h.item_type === 'property')
      .slice(0, 4);
  }, [history]);

  // Debounce search
  const searchTimerRef = useRef<NodeJS.Timeout>();
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    searchTimerRef.current = setTimeout(() => setDebouncedSearch(value), 300);
  }, []);

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value as TabValue);
    setSearchParams(prev => {
      const params = new URLSearchParams(prev);
      params.set('tab', value);
      return params;
    });
  }, [setSearchParams]);

  const handleAudienceChange = useCallback((value: AudienceFilter) => {
    setAudienceFilter(value);
    setSearchParams(prev => {
      const params = new URLSearchParams(prev);
      params.set('audience', value);
      return params;
    });
  }, [setSearchParams]);

  const handleRefresh = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    refetchCategories();
    refetchServices();
    setRefreshKey(prev => prev + 1);
  }, [refetchCategories, refetchServices]);

  const handleCategoryClick = useCallback((cat: Category) => {
    navigate(cat.path);
  }, [navigate]);

  const handleServiceClick = useCallback((service: Service) => {
    const slug = service.category?.slug || 'services';
    const pathMap: Record<string, string> = {
      'beauty-spa': '/beauty',
      'restaurants': '/restaurants',
      'fitness': '/fitness',
      'medical': '/medical',
      'kids-education': '/education',
      'real-estate': '/property',
      'transport': '/transport',
      'events': '/events',
      'services': '/services',
    };
    navigate(pathMap[slug] || '/services');
  }, [navigate]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory) count++;
    if (priceRange) count++;
    return count;
  }, [selectedCategory, priceRange]);

  const clearFilters = useCallback(() => {
    setSelectedCategory(null);
    setPriceRange(null);
    setSortBy('popular');
    setSearchQuery('');
    setDebouncedSearch('');
  }, []);

  const isLoading = categoriesLoading || servicesLoading;

  return (
    <AppLayout showBottomNav>
      <PageContainer className="pb-24">
        <PageHeader 
          title={language === 'ru' ? 'Каталог' : 'Catalog'}
          showBack
          fallbackPath="/"
        />
        
        {/* Search bar */}
        <div 
          className="relative cursor-pointer mt-4 mb-4"
          onClick={() => navigate('/search')}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            placeholder={language === 'ru' ? 'Поиск сервисов...' : 'Search services...'}
            className="pl-11 h-12 text-base rounded-xl bg-muted/50 border-0 cursor-pointer"
            readOnly
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-4">
            <TabsTrigger value="all">
              {language === 'ru' ? 'Все' : 'All'}
            </TabsTrigger>
            <TabsTrigger value="categories">
              {language === 'ru' ? 'Категории' : 'Categories'}
            </TabsTrigger>
            <TabsTrigger value="providers">
              {language === 'ru' ? 'Провайдеры' : 'Providers'}
            </TabsTrigger>
          </TabsList>

          {/* Tab: All - Category cards grouped */}
          <TabsContent value="all" className="mt-0">
            <PullToRefresh onRefresh={handleRefresh} className="min-h-0">
              <div key={refreshKey} className="space-y-6">
                {/* Audience Filter Tabs */}
                <AudienceFilterTabs 
                  value={audienceFilter} 
                  onChange={handleAudienceChange} 
                  language={language} 
                />
                
                {/* Recently Viewed Section */}
                {user && recentCategories.length > 0 && audienceFilter === 'all' && (
                  <RecentlyViewedCompact 
                    items={recentCategories} 
                    language={language} 
                  />
                )}
                
                {categoriesLoading ? (
                  <AllTabSkeleton />
                ) : (
                  <AllCategoriesView 
                    groups={groups} 
                    getName={getName} 
                    language={language}
                    onCategoryClick={handleCategoryClick}
                    isFeatured={isFeatured}
                    getCount={getCount}
                    audienceFilter={audienceFilter}
                  />
                )}
              </div>
            </PullToRefresh>
          </TabsContent>

          {/* Tab: Categories - Tree view */}
          <TabsContent value="categories" className="mt-0">
            <PullToRefresh onRefresh={handleRefresh} className="min-h-0">
              <div key={refreshKey}>
                {categoriesLoading ? (
                  <CategoriesTabSkeleton />
                ) : (
                  <CategoryTreeView 
                    groups={groups} 
                    getName={getName} 
                    language={language}
                    onCategoryClick={handleCategoryClick}
                    getCount={getCount}
                  />
                )}
              </div>
            </PullToRefresh>
          </TabsContent>

          {/* Tab: Providers - Services list with filters */}
          <TabsContent value="providers" className="mt-0">
            <ProvidersView 
              services={services}
              categories={serviceCategories}
              isLoading={servicesLoading}
              language={language}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              sortBy={sortBy}
              setSortBy={setSortBy}
              activeFiltersCount={activeFiltersCount}
              clearFilters={clearFilters}
              isFiltersOpen={isFiltersOpen}
              setIsFiltersOpen={setIsFiltersOpen}
              onServiceClick={handleServiceClick}
              onRefresh={handleRefresh}
              refreshKey={refreshKey}
            />
          </TabsContent>
        </Tabs>
      </PageContainer>
    </AppLayout>
  );
}

// ============ Tab Components ============

// Recently Viewed Compact Section for Catalog
interface RecentlyViewedCompactProps {
  items: ViewHistoryItem[];
  language: string;
}

function RecentlyViewedCompact({ items, language }: RecentlyViewedCompactProps) {
  const navigate = useNavigate();
  
  const typeRoutes: Record<string, string> = {
    tour: '/tours',
    property: '/property',
    event: '/events',
    category: '/discover',
  };

  const handleClick = (item: ViewHistoryItem) => {
    const baseRoute = typeRoutes[item.item_type] || '/discover';
    navigate(`${baseRoute}/${item.item_id}`);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg">
          <History className="w-4 h-4 text-primary" />
        </div>
        <h3 className="text-sm font-semibold">
          {language === 'ru' ? 'Недавние' : 'Recent'}
        </h3>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {items.map((item) => {
          const data = item.item_data || {};
          const title = language === 'ru' 
            ? (data.name_ru || data.name || 'Без названия')
            : (data.name_en || data.name || 'Untitled');
          
          return (
            <button
              key={item.id}
              onClick={() => handleClick(item)}
              className={cn(
                "flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl",
                "bg-card border border-border/50",
                "hover:border-primary/40 hover:shadow-sm",
                "active:scale-95 transition-all"
              )}
            >
              {data.image && (
                <img 
                  src={data.image} 
                  alt="" 
                  className="w-8 h-8 rounded-lg object-cover"
                />
              )}
              <span className="text-xs font-medium whitespace-nowrap max-w-[100px] truncate">
                {title}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Audience Filter Tabs Component
interface AudienceFilterTabsProps {
  value: AudienceFilter;
  onChange: (value: AudienceFilter) => void;
  language: string;
}

function AudienceFilterTabs({ value, onChange, language }: AudienceFilterTabsProps) {
  const tabs: { id: AudienceFilter; label: string; labelRu: string; icon: React.ElementType }[] = [
    { id: 'all', label: 'All', labelRu: 'Все', icon: Layers },
    { id: 'tourists', label: 'Tourists', labelRu: 'Туристам', icon: Compass },
    { id: 'residents', label: 'Residents', labelRu: 'Резидентам', icon: Users },
    { id: 'owners', label: 'Owners', labelRu: 'Владельцам', icon: Home },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = value === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
              isActive 
                ? "bg-primary text-primary-foreground shadow-md" 
                : "bg-card border border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            <Icon className="w-4 h-4" />
            {language === 'ru' ? tab.labelRu : tab.label}
          </button>
        );
      })}
    </div>
  );
}


interface AllCategoriesViewProps {
  groups: CategoryGroup[];
  getName: (item: Category | CategoryGroup) => string;
  language: string;
  onCategoryClick: (cat: Category) => void;
  isFeatured?: (entityId: string, entityType?: string) => boolean;
  getCount?: (slugOrType: string) => number | undefined;
  audienceFilter?: AudienceFilter;
}

function AllCategoriesView({ groups, getName, language, onCategoryClick, isFeatured, getCount, audienceFilter = 'all' }: AllCategoriesViewProps) {
  // Filter groups and categories based on audience
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

  if (filteredGroups.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title={language === 'ru' ? 'Категории не найдены' : 'No categories found'}
        description={language === 'ru' ? 'Попробуйте обновить страницу' : 'Try refreshing the page'}
      />
    );
  }

  return (
    <div className="space-y-8">
      {filteredGroups.map((group) => (
        <div key={group.id}>
          {/* Group Header - Enhanced */}
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              {getName(group)}
              <span className="text-[10px] font-normal px-1.5 py-0.5 rounded-full bg-muted">
                {group.categories?.length || 0}
              </span>
            </h3>
            <div className="h-px flex-1 bg-gradient-to-l from-border to-transparent" />
          </div>
          
          {/* Category Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(group.categories || []).map((cat) => {
              const Icon = cat.icon || Package;
              const featured = isFeatured?.(cat.id, 'category');
              const itemCount = getCount?.(cat.slug) ?? getCount?.(cat.miniAppType || '');
              
              return (
                <button
                  key={cat.id}
                  onClick={() => onCategoryClick(cat)}
                  className={cn(
                    "relative flex items-center gap-4 p-4 rounded-2xl overflow-hidden",
                    "bg-card/80 backdrop-blur-sm",
                    "border transition-all duration-300",
                    featured 
                      ? "border-amber-400/50 shadow-[0_0_20px_rgba(251,191,36,0.15)]" 
                      : cat.hasMiniApp
                        ? "border-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.08)]"
                        : "border-border/40 hover:border-border",
                    "hover:shadow-lg hover:-translate-y-0.5",
                    "active:scale-[0.98] active:shadow-md",
                    "group text-left"
                  )}
                >
                  {/* Background Gradient Decoration */}
                  <div className={cn(
                    "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                    featured 
                      ? "bg-gradient-to-br from-amber-500/5 via-transparent to-amber-500/5"
                      : cat.hasMiniApp
                        ? "bg-gradient-to-br from-primary/5 via-transparent to-primary/5"
                        : "bg-gradient-to-br from-muted/50 via-transparent to-muted/30"
                  )} />
                  
                  {/* Featured/PRO Badge */}
                  {featured && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] px-2 py-1 rounded-full font-bold bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-md">
                      <Crown className="w-3 h-3" />
                      PRO
                    </div>
                  )}
                  
                  {/* Mini-App Badge */}
                  {!featured && cat.hasMiniApp && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] px-2 py-1 rounded-full font-bold bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md">
                      <Layers className="w-3 h-3" />
                      APP
                    </div>
                  )}
                  
                  {/* New/Hot Badge */}
                  {!featured && !cat.hasMiniApp && (cat.isNew || cat.isHot) && (
                    <div className={cn(
                      "absolute top-2 right-2 flex items-center gap-1 text-[10px] px-2 py-1 rounded-full font-bold shadow-md",
                      cat.isNew 
                        ? "bg-gradient-to-r from-emerald-400 to-emerald-500 text-white" 
                        : "bg-gradient-to-r from-orange-400 to-red-500 text-white"
                    )}>
                      {cat.isNew ? (
                        <>
                          <Sparkles className="w-3 h-3" />
                          NEW
                        </>
                      ) : (
                        <>
                          <Flame className="w-3 h-3" />
                          {language === 'ru' ? 'ТОП' : 'HOT'}
                        </>
                      )}
                    </div>
                  )}
                  
                  {/* Icon Container */}
                  <div className={cn(
                    "relative w-14 h-14 rounded-2xl flex items-center justify-center shrink-0",
                    "bg-gradient-to-br shadow-lg",
                    cat.color || "from-primary/80 to-primary",
                    "group-hover:scale-105 group-hover:shadow-xl transition-all duration-300"
                  )}>
                    {/* Shine effect */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/20 to-transparent" />
                    <Icon className="w-7 h-7 text-white drop-shadow-sm relative z-10" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0 relative z-10">
                    <h4 className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {getName(cat)}
                    </h4>
                    
                    {/* Meta info */}
                    <div className="flex items-center gap-2 mt-1">
                      {itemCount !== undefined && itemCount > 0 ? (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {itemCount} {language === 'ru' ? 'услуг' : 'services'}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/60">
                          {language === 'ru' ? 'Открыть каталог' : 'Browse catalog'}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Arrow */}
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    "bg-muted/50 group-hover:bg-primary/10 transition-colors",
                    "group-hover:translate-x-0.5 transition-transform"
                  )}>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

interface CategoryTreeViewProps {
  groups: CategoryGroup[];
  getName: (item: Category | CategoryGroup) => string;
  language: string;
  onCategoryClick: (cat: Category) => void;
  getCount?: (slugOrType: string) => number | undefined;
}

function CategoryTreeView({ groups, getName, language, onCategoryClick, getCount }: CategoryTreeViewProps) {
  if (groups.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title={language === 'ru' ? 'Категории не найдены' : 'No categories found'}
        description={language === 'ru' ? 'Попробуйте обновить страницу' : 'Try refreshing the page'}
      />
    );
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <div key={group.id}>
          {/* Group Header - Minimal */}
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-base font-bold">{getName(group)}</h2>
            <div className="h-px flex-1 bg-border/50" />
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {group.categories?.length || 0}
            </span>
          </div>
          
          {/* Category Grid - Compact Icons */}
          <div className="grid grid-cols-4 xs:grid-cols-5 sm:grid-cols-6 gap-3">
            {(group.categories || []).map((cat) => {
              const Icon = cat.icon || Package;
              const itemCount = getCount?.(cat.slug) ?? getCount?.(cat.miniAppType || '');
              
              return (
                <button
                  key={cat.id}
                  onClick={() => onCategoryClick(cat)}
                  className={cn(
                    "relative flex flex-col items-center justify-start",
                    "rounded-2xl p-3 min-h-[90px]",
                    "bg-card/60 backdrop-blur-sm border",
                    cat.hasMiniApp 
                      ? "border-primary/20 bg-gradient-to-b from-primary/5 to-transparent" 
                      : "border-border/30",
                    "hover:border-primary/40 hover:bg-card hover:shadow-lg hover:-translate-y-1",
                    "active:scale-95",
                    "transition-all duration-200",
                    "group"
                  )}
                >
                  {/* APP Badge - Subtle dot */}
                  {cat.hasMiniApp && (
                    <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary shadow-sm shadow-primary/50" />
                  )}
                  
                  {/* New/Hot Badge */}
                  {!cat.hasMiniApp && (cat.isNew || cat.isHot) && (
                    <div className={cn(
                      "absolute -top-1 -right-1 text-[8px] px-1.5 py-0.5 rounded-full font-bold",
                      cat.isNew 
                        ? "bg-emerald-500 text-white" 
                        : "bg-gradient-to-r from-orange-400 to-red-500 text-white"
                    )}>
                      {cat.isNew ? 'NEW' : '🔥'}
                    </div>
                  )}
                  
                  {/* Icon */}
                  <div className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center mb-2",
                    "bg-gradient-to-br shadow-md",
                    cat.color || "from-primary/80 to-primary",
                    "group-hover:scale-110 group-hover:shadow-lg transition-all duration-200"
                  )}>
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-white/15 to-transparent" />
                    <Icon className="w-5 h-5 text-white drop-shadow-sm relative z-10" />
                  </div>
                  
                  {/* Name */}
                  <span className="text-[10px] sm:text-[11px] font-medium text-center leading-tight line-clamp-2 px-0.5 text-foreground/80 group-hover:text-foreground transition-colors">
                    {getName(cat)}
                  </span>
                  
                  {/* Item Count - Minimal */}
                  {itemCount !== undefined && itemCount > 0 && (
                    <span className="text-[9px] text-muted-foreground mt-auto pt-1">
                      {itemCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

interface ProvidersViewProps {
  services: Service[];
  categories: { id: string; name_en: string; name_ru: string; icon?: string }[];
  isLoading: boolean;
  language: string;
  selectedCategory: string | null;
  setSelectedCategory: (id: string | null) => void;
  priceRange: { min: number; max: number } | null;
  setPriceRange: (range: { min: number; max: number } | null) => void;
  sortBy: SortOption;
  setSortBy: (sort: SortOption) => void;
  activeFiltersCount: number;
  clearFilters: () => void;
  isFiltersOpen: boolean;
  setIsFiltersOpen: (open: boolean) => void;
  onServiceClick: (service: Service) => void;
  onRefresh: () => Promise<void>;
  refreshKey: number;
}

function ProvidersView({
  services,
  categories,
  isLoading,
  language,
  selectedCategory,
  setSelectedCategory,
  priceRange,
  setPriceRange,
  sortBy,
  setSortBy,
  activeFiltersCount,
  clearFilters,
  isFiltersOpen,
  setIsFiltersOpen,
  onServiceClick,
  onRefresh,
  refreshKey,
}: ProvidersViewProps) {
  const currentSort = SORT_OPTIONS.find(s => s.value === sortBy) || SORT_OPTIONS[0];

  return (
    <PullToRefresh onRefresh={onRefresh} className="min-h-0">
      <div className="space-y-4" key={refreshKey}>
        {/* Filters button */}
        <div className="flex items-center gap-2">
          <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="relative gap-2">
                <SlidersHorizontal className="w-4 h-4" />
                {language === 'ru' ? 'Фильтры' : 'Filters'}
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="flex flex-col h-full max-h-screen overflow-hidden">
              <SheetHeader className="flex-shrink-0">
                <SheetTitle>
                  {language === 'ru' ? 'Фильтры' : 'Filters'}
                </SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto py-6 space-y-6 -mx-6 px-6">
                {/* Sort options */}
                <div>
                  <h4 className="font-medium mb-3">
                    {language === 'ru' ? 'Сортировка' : 'Sort by'}
                  </h4>
                  <div className="space-y-2">
                    {SORT_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.value}
                          onClick={() => setSortBy(option.value)}
                          className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-lg border transition-colors",
                            sortBy === option.value
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-secondary border-border hover:border-primary/50"
                          )}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="flex-1 text-left">
                            {language === 'ru' ? option.labelRu : option.label}
                          </span>
                          {sortBy === option.value && <Check className="w-4 h-4" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Price filter */}
                <div>
                  <h4 className="font-medium mb-3">
                    {language === 'ru' ? 'Цена' : 'Price'}
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {PRICE_RANGES.map((range, idx) => (
                      <button
                        key={idx}
                        onClick={() => setPriceRange(
                          priceRange?.min === range.min && priceRange?.max === range.max 
                            ? null 
                            : { min: range.min, max: range.max }
                        )}
                        className={cn(
                          "p-3 rounded-lg border text-sm transition-colors",
                          priceRange?.min === range.min && priceRange?.max === range.max
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-secondary border-border hover:border-primary/50"
                        )}
                      >
                        {language === 'ru' ? range.labelRu : range.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category filter */}
                <div>
                  <h4 className="font-medium mb-3">
                    {language === 'ru' ? 'Категория' : 'Category'}
                  </h4>
                  <div className="space-y-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-lg border transition-colors",
                          selectedCategory === cat.id
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-secondary border-border hover:border-primary/50"
                        )}
                      >
                        <span className="flex-1 text-left">
                          {language === 'ru' ? cat.name_ru : cat.name_en}
                        </span>
                        {selectedCategory === cat.id && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Clear filters */}
              {activeFiltersCount > 0 && (
                <div className="flex-shrink-0 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      clearFilters();
                      setIsFiltersOpen(false);
                    }}
                  >
                    {language === 'ru' ? 'Сбросить фильтры' : 'Clear filters'}
                  </Button>
                </div>
              )}
            </SheetContent>
          </Sheet>

          {/* Sort chip */}
          <button
            onClick={() => setIsFiltersOpen(true)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border",
              "bg-secondary border-border hover:border-primary/50"
            )}
          >
            <currentSort.icon className="w-4 h-4" />
            {language === 'ru' ? currentSort.labelRu : currentSort.label}
          </button>

          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-sm text-destructive hover:underline"
            >
              {language === 'ru' ? 'Сбросить' : 'Clear'}
            </button>
          )}
        </div>

        {/* Results count */}
        {!isLoading && services.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {language === 'ru' 
              ? `Найдено: ${services.length}` 
              : `Found: ${services.length}`}
          </p>
        )}

        {/* Services Grid */}
        {isLoading ? (
          <SkeletonGrid count={6} />
        ) : services.length === 0 ? (
          <EmptyState
            icon={Search}
            title={language === 'ru' ? 'Ничего не найдено' : 'Nothing found'}
            description={
              language === 'ru' 
                ? 'Попробуйте изменить параметры поиска или сбросить фильтры' 
                : 'Try changing your search or clearing filters'
            }
            action={
              <Button variant="outline" onClick={clearFilters}>
                {language === 'ru' ? 'Сбросить фильтры' : 'Clear filters'}
              </Button>
            }
          />
        ) : (
          <FadeInUp>
            <AnimatedGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" staggerDelay={0.05}>
              {services.map((service) => (
                <UnifiedCard
                  key={service.id}
                  id={service.id}
                  title={language === 'ru' ? service.name_ru : service.name_en}
                  subtitle={service.category?.[language === 'ru' ? 'name_ru' : 'name_en']}
                  image={service.images?.[0]}
                  price={service.price ?? undefined}
                  currency={service.currency}
                  rating={service.rating ?? undefined}
                  reviewCount={service.review_count ?? undefined}
                  isVerified={service.provider?.is_verified}
                  onClick={() => onServiceClick(service)}
                />
              ))}
            </AnimatedGrid>
          </FadeInUp>
        )}
      </div>
    </PullToRefresh>
  );
}

// ============ Skeletons ============

function AllTabSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, gi) => (
        <div key={gi}>
          <Skeleton className="h-4 w-32 mb-3" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Array.from({ length: 4 }).map((_, ci) => (
              <Skeleton key={ci} className="h-20 rounded-2xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function CategoriesTabSkeleton() {
  return (
    <div className="space-y-8">
      {Array.from({ length: 3 }).map((_, gi) => (
        <div key={gi}>
          <Skeleton className="h-5 w-40 mb-4" />
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, ci) => (
              <Skeleton key={ci} className="aspect-square rounded-2xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
