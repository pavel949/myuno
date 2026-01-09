import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, SlidersHorizontal, X, Sparkles, UtensilsCrossed, 
  Dumbbell, Stethoscope, GraduationCap, Building, Car, 
  Ticket, ShoppingBag, Wrench, Clock, MapPin, Star, Check,
  ArrowUpDown, TrendingUp, ArrowDown, ArrowUp
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { UnifiedCard } from '@/components/uno/UnifiedCard';
import { FilterChip } from '@/components/uno/FilterChip';
import { SkeletonGrid } from '@/components/uno/SkeletonCard';
import { EmptyState } from '@/components/uno/EmptyState';
import { AnimatedGrid, AnimatedCard, FadeInUp } from '@/components/layout/AnimatedList';
import { useServices, useCategories, Service, SortOption } from '@/hooks/useServices';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ElementType> = {
  Sparkles,
  UtensilsCrossed,
  Dumbbell,
  Stethoscope,
  GraduationCap,
  Building,
  Car,
  Ticket,
  ShoppingBag,
  Wrench,
};

const PRICE_RANGES = [
  { label: 'Any', labelRu: 'Любая', min: 0, max: Infinity },
  { label: '< 1000 ฿', labelRu: '< 1000 ฿', min: 0, max: 1000 },
  { label: '1000-2000 ฿', labelRu: '1000-2000 ฿', min: 1000, max: 2000 },
  { label: '2000-5000 ฿', labelRu: '2000-5000 ฿', min: 2000, max: 5000 },
  { label: '> 5000 ฿', labelRu: '> 5000 ฿', min: 5000, max: Infinity },
];

const SORT_OPTIONS: { value: SortOption; label: string; labelRu: string; icon: React.ElementType }[] = [
  { value: 'popular', label: 'Popular', labelRu: 'Популярные', icon: TrendingUp },
  { value: 'price_asc', label: 'Price: Low to High', labelRu: 'Цена: по возрастанию', icon: ArrowUp },
  { value: 'price_desc', label: 'Price: High to Low', labelRu: 'Цена: по убыванию', icon: ArrowDown },
  { value: 'rating', label: 'Rating', labelRu: 'По рейтингу', icon: Star },
  { value: 'newest', label: 'Newest', labelRu: 'Новые', icon: Clock },
];

export default function Discover() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<{ min: number; max: number } | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const { categories, isLoading: categoriesLoading } = useCategories();
  const { services, isLoading: servicesLoading, refetch } = useServices({
    categoryId: selectedCategory || undefined,
    searchQuery: debouncedSearch || undefined,
    priceMin: priceRange?.min,
    priceMax: priceRange?.max === Infinity ? undefined : priceRange?.max,
    sortBy,
  });

  // Debounce search
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    const timer = setTimeout(() => setDebouncedSearch(value), 300);
    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    refetch();
    setRefreshKey(prev => prev + 1);
  }, [refetch]);

  const handleCategorySelect = useCallback((categoryId: string | null) => {
    setSelectedCategory(prev => prev === categoryId ? null : categoryId);
  }, []);

  const handleServiceClick = useCallback((service: Service) => {
    // Navigate based on category
    const slug = service.category?.slug || 'services';
    const pathMap: Record<string, string> = {
      'beauty-spa': '/beauty',
      'restaurants': '/food',
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

  const currentSort = SORT_OPTIONS.find(s => s.value === sortBy) || SORT_OPTIONS[0];

  const isLoading = categoriesLoading || servicesLoading;

  return (
    <AppLayout title={t('nav.discover')}>
      <PullToRefresh onRefresh={handleRefresh} className="h-[calc(100vh-8rem)]">
        <div className="p-4 space-y-4" key={refreshKey}>
          {/* Search & Filter Bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={language === 'ru' ? 'Поиск услуг...' : 'Search services...'}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); setDebouncedSearch(''); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                  <SlidersHorizontal className="w-5 h-5" />
                  {activeFiltersCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                      {activeFiltersCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>
                    {language === 'ru' ? 'Фильтры' : 'Filters'}
                  </SheetTitle>
                </SheetHeader>
                <div className="py-6 space-y-6">
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
                      {categories.map((cat) => {
                        const Icon = iconMap[cat.icon || ''] || Sparkles;
                        return (
                          <button
                            key={cat.id}
                            onClick={() => handleCategorySelect(cat.id)}
                            className={cn(
                              "w-full flex items-center gap-3 p-3 rounded-lg border transition-colors",
                              selectedCategory === cat.id
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-secondary border-border hover:border-primary/50"
                            )}
                          >
                            <Icon className="w-5 h-5" />
                            <span className="flex-1 text-left">
                              {language === 'ru' ? cat.name_ru : cat.name_en}
                            </span>
                            {selectedCategory === cat.id && <Check className="w-4 h-4" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Clear filters */}
                  {activeFiltersCount > 0 && (
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
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Sort & Category chips (horizontal scroll) */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
            {/* Sort button */}
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
            
            <div className="w-px h-6 bg-border self-center" />
            
            <FilterChip
              label={language === 'ru' ? 'Все' : 'All'}
              isActive={!selectedCategory}
              onToggle={() => setSelectedCategory(null)}
            />
            {categories.slice(0, 6).map((cat) => {
              const Icon = iconMap[cat.icon || ''] || Sparkles;
              return (
                <FilterChip
                  key={cat.id}
                  label={language === 'ru' ? cat.name_ru : cat.name_en}
                  isActive={selectedCategory === cat.id}
                  onToggle={() => handleCategorySelect(cat.id)}
                  icon={<Icon className="w-4 h-4" />}
                />
              );
            })}
          </div>

          {/* Active filters display */}
          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">
                {language === 'ru' ? 'Активные фильтры:' : 'Active filters:'}
              </span>
              {selectedCategory && (
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-sm"
                >
                  {categories.find(c => c.id === selectedCategory)?.[language === 'ru' ? 'name_ru' : 'name_en']}
                  <X className="w-3 h-3" />
                </button>
              )}
              {priceRange && (
                <button
                  onClick={() => setPriceRange(null)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-sm"
                >
                  {PRICE_RANGES.find(r => r.min === priceRange.min && r.max === priceRange.max)?.[language === 'ru' ? 'labelRu' : 'label']}
                  <X className="w-3 h-3" />
                </button>
              )}
              <button
                onClick={clearFilters}
                className="text-sm text-destructive hover:underline"
              >
                {language === 'ru' ? 'Сбросить все' : 'Clear all'}
              </button>
            </div>
          )}

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
                  <AnimatedCard key={service.id}>
                    <UnifiedCard
                      id={service.id}
                      image={service.images?.[0] || 'https://images.unsplash.com/photo-1540555700478-4be289fbec6c?w=600'}
                      title={language === 'ru' ? service.name_ru : service.name_en}
                      subtitle={service.provider?.name}
                      price={service.price || 0}
                      priceLabel={t('label.from')}
                      duration={service.duration_minutes ? `${service.duration_minutes} ${language === 'ru' ? 'мин' : 'min'}` : undefined}
                      location={service.category?.[language === 'ru' ? 'name_ru' : 'name_en']}
                      isVerified={service.provider?.is_verified}
                      onClick={() => handleServiceClick(service)}
                    />
                  </AnimatedCard>
                ))}
              </AnimatedGrid>
            </FadeInUp>
          )}
        </div>
      </PullToRefresh>
    </AppLayout>
  );
}
