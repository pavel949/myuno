import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, X, Star, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '@/components/ui/input';
import { BackButton } from '@/components/uno/BackButton';
import { APP_ROUTES } from '@/lib/config/routes';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AnimatedList, AnimatedItem, AnimatedGrid, AnimatedCard } from '@/components/layout/AnimatedList';
import { useGlobalSearch, SearchResult } from '@/hooks/useGlobalSearch';
import { searchTypeConfig, trendingSearches } from '@/lib/searchData';

export default function Search() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const isRu = language === 'ru';

  // Real database search
  const { results: dbResults, isLoading } = useGlobalSearch(query, true);

  // Filter by selected type
  const filteredResults = useMemo(() => {
    if (!selectedType) return dbResults;
    return dbResults.filter(item => item.type === selectedType);
  }, [dbResults, selectedType]);

  const popularCategories = Object.keys(searchTypeConfig).filter(k => k !== 'category' && k !== 'marketCategory');

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        {/* Search Header */}
        <div className="sticky top-0 z-20 bg-background border-b border-border p-4">
          <div className="flex items-center gap-3">
            <BackButton fallbackPath={APP_ROUTES.HOME} variant="ghost" />
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder={isRu ? 'Поиск услуг, мест...' : 'Search services, places...'}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 pr-10"
                autoFocus
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            <Button
              variant={selectedType === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType(null)}
              className="flex-shrink-0"
            >
              {isRu ? 'Все' : 'All'}
            </Button>
            {popularCategories.slice(0, 12).map(type => {
              const config = searchTypeConfig[type];
              if (!config) return null;
              const Icon = config.icon;
              return (
                <Button
                  key={type}
                  variant={selectedType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType(type)}
                  className="flex-shrink-0"
                >
                  <Icon className="w-4 h-4 mr-1" />
                  {config.label[language]}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="p-4">
          {/* Show suggestions when no query */}
          {!query && !selectedType && (
            <div className="space-y-6">
              {/* Trending */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  {isRu ? 'Популярное' : 'Trending'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(trendingSearches[language] || trendingSearches.en).map(search => (
                    <button
                      key={search}
                      onClick={() => setQuery(search)}
                      className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm hover:bg-primary/20 transition-colors"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>

              {/* Popular Categories */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  {isRu ? 'Популярные категории' : 'Popular Categories'}
                </h3>
                <AnimatedGrid className="grid grid-cols-2 gap-3" staggerDelay={0.06}>
                  {popularCategories.slice(0, 6).map(type => {
                    const config = searchTypeConfig[type];
                    if (!config) return null;
                    const Icon = config.icon;
                    return (
                      <AnimatedCard key={type}>
                        <button
                          onClick={() => setSelectedType(type)}
                          className="w-full flex items-center gap-3 p-3 rounded-none bg-card border border-border hover:border-primary/30 transition-all"
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-none flex items-center justify-center bg-gradient-to-br",
                            config.color
                          )}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <span className="font-medium">{config.label[language]}</span>
                        </button>
                      </AnimatedCard>
                    );
                  })}
                </AnimatedGrid>
              </div>
            </div>
          )}

          {/* Loading */}
          {isLoading && query.trim().length >= 2 && (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 text-primary mx-auto mb-3 animate-spin" />
              <p className="text-muted-foreground">
                {isRu ? 'Поиск...' : 'Searching...'}
              </p>
            </div>
          )}

          {/* Search Results */}
          {!isLoading && (query || selectedType) && (
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                {isRu
                  ? `Найдено ${filteredResults.length} результатов`
                  : `Found ${filteredResults.length} results`}
              </p>

              {filteredResults.length === 0 ? (
                <div className="text-center py-12">
                  <SearchIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="font-semibold mb-1">
                    {isRu ? 'Ничего не найдено' : 'No results found'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {isRu
                      ? 'Попробуйте изменить запрос или фильтры'
                      : 'Try different keywords or filters'}
                  </p>
                </div>
              ) : (
                <AnimatedList className="space-y-3">
                  {filteredResults.map(item => {
                    const config = searchTypeConfig[item.type];
                    const Icon = config?.icon || SearchIcon;
                    return (
                      <AnimatedItem key={item.id}>
                        <div
                          onClick={() => navigate(item.path)}
                          className="flex gap-3 p-3 rounded-none bg-card border border-border hover:border-primary/30 transition-all cursor-pointer"
                        >
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={isRu ? item.titleRu : item.titleEn}
                              className="w-20 h-20 rounded-none object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className={cn(
                              "w-20 h-20 rounded-none flex items-center justify-center bg-gradient-to-br flex-shrink-0",
                              config?.color || 'from-gray-500 to-gray-600'
                            )}>
                              <Icon className="w-8 h-8 text-white" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="secondary" className="text-xs gap-1">
                                <Icon className="w-3 h-3" />
                                {language === 'ru' ? config?.label?.ru : config?.label?.en}
                              </Badge>
                              {item.rating && (
                                <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                                  <Star className="w-3 h-3 fill-warning text-warning" />
                                  {item.rating}
                                </span>
                              )}
                            </div>
                            <h3 className="font-semibold truncate">
                              {isRu ? item.titleRu : item.titleEn}
                            </h3>
                            {(item.locationEn || item.locationRu) && (
                              <p className="text-sm text-muted-foreground truncate">
                                {isRu ? item.locationRu : item.locationEn}
                              </p>
                            )}
                            {item.price && item.price > 0 && (
                              <span className="text-sm font-medium text-primary">
                                ฿{item.price.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </AnimatedItem>
                    );
                  })}
                </AnimatedList>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
