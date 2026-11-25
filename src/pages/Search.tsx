import { useMemo } from 'react';
import { useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
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
import { useBrowseByType } from '@/hooks/useBrowseByType';
import { publicJourneyState } from '@/lib/real-estate/publicJourney';
import { searchTypeConfig, trendingSearches } from '@/lib/searchData';
import { groupResultsByType } from '@/lib/search/groupResults';

const RESULTS_PER_GROUP = 4;

function SearchResultRow({ item }: { item: SearchResult }) {
  const location = useLocation();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const config = searchTypeConfig[item.type];
  const Icon = config?.icon || SearchIcon;
  const title = isRu ? item.titleRu : item.titleEn;
  return (
    <Link
      to={item.path}
      state={publicJourneyState(location)}
      className="flex gap-3 p-3 rounded-md bg-card border border-border hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
    >
      {item.image ? (
        <img
          src={item.image}
          alt={title}
          loading="lazy"
          width={80}
          height={80}
          className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-20 h-20 rounded-lg flex items-center justify-center bg-muted flex-shrink-0">
          <Icon className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="secondary" className="text-xs gap-1">
            <Icon className="w-3 h-3" aria-hidden="true" />
            {isRu ? config?.label?.ru : config?.label?.en}
          </Badge>
          {item.rating && (
            <span className="text-xs text-muted-foreground flex items-center gap-0.5">
              <Star className="w-3 h-3 fill-warning text-warning" aria-hidden="true" />
              {item.rating}
            </span>
          )}
        </div>
        <h3 className="font-semibold truncate">{title}</h3>
        {(item.locationEn || item.locationRu) && (
          <p className="text-sm text-muted-foreground truncate">
            {isRu ? item.locationRu : item.locationEn}
          </p>
        )}
        {item.price && item.price > 0 && (
          <span className="text-sm font-medium text-primary font-mono tabular-nums">
            ฿{item.price.toLocaleString()}
          </span>
        )}
      </div>
    </Link>
  );
}

export default function Search() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { language } = useLanguage();
  const query = searchParams.get('q') || '';
  const selectedType = searchParams.get('type');
  const setQuery = (value: string) => setSearchParams(previous => {
    const next = new URLSearchParams(previous);
    if (value) next.set('q', value); else next.delete('q');
    return next;
  }, { replace: true });
  const setSelectedType = (value: string | null) => setSearchParams(previous => {
    const next = new URLSearchParams(previous);
    if (value) next.set('type', value); else next.delete('type');
    return next;
  }, { replace: true });
  const isRu = language === 'ru';

  const hasQuery = query.trim().length >= 2;

  // Real database search (when user types)
  const { results: dbResults, isLoading: searchLoading } = useGlobalSearch(query, hasQuery);
  // Browse-by-type fallback (when user picks a chip without typing)
  const { results: browseResults, isLoading: browseLoading } = useBrowseByType(
    !hasQuery ? selectedType : null,
    !hasQuery && !!selectedType,
  );

  const isLoading = hasQuery ? searchLoading : browseLoading;

  // Filter by selected type
  const filteredResults = useMemo(() => {
    const source = hasQuery ? dbResults : browseResults;
    if (!selectedType) return source;
    return source.filter(item => item.type === selectedType);
  }, [dbResults, browseResults, selectedType, hasQuery]);


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
                  aria-label={isRu ? 'Очистить' : 'Clear'}
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
                <AnimatedGrid className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-2 min-[420px]:gap-3" staggerDelay={0.06}>
                  {popularCategories.slice(0, 6).map(type => {
                    const config = searchTypeConfig[type];
                    if (!config) return null;
                    const Icon = config.icon;
                    return (
                      <AnimatedCard key={type}>
                        <button
                          onClick={() => setSelectedType(type)}
                          className="w-full min-h-14 flex items-center gap-2 p-2.5 rounded-md bg-card border border-border hover:border-primary/30 transition-all"
                        >
                          <div className={cn(
                            "w-8 h-8 shrink-0 rounded-none flex items-center justify-center bg-gradient-to-br",
                            config.color
                          )}>
                            <Icon className="w-4 h-4 text-primary-foreground" aria-hidden="true" />
                          </div>
                          <span className="min-w-0 text-left text-sm font-medium leading-tight break-words-ru">{config.label[language]}</span>
                        </button>
                      </AnimatedCard>
                    );
                  })}
                </AnimatedGrid>
              </div>
            </div>
          )}

          {/* Loading */}
          {isLoading && (hasQuery || selectedType) && (
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
                  <p className="text-sm text-muted-foreground mb-6">
                    {isRu
                      ? 'Попробуйте изменить запрос или выберите раздел ниже'
                      : 'Try different keywords or pick a section below'}
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {[
                      { ru: 'Виза', en: 'Visa', path: '/visa/quiz' },
                      { ru: 'Жильё', en: 'Stay', path: '/property' },
                      { ru: 'Услуги', en: 'Services', path: '/services' },
                      { ru: 'Транспорт', en: 'Transport', path: '/transport' },
                      { ru: 'Медицина', en: 'Medical', path: '/medical' },
                      { ru: 'Юристы', en: 'Legal', path: '/legal' },
                    ].map((c) => (
                      <button
                        key={c.path}
                        onClick={() => navigate(c.path)}
                        className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm hover:bg-primary/20 transition-colors"
                      >
                        {isRu ? c.ru : c.en}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                selectedType ? (
                  <AnimatedList className="space-y-3">
                    {filteredResults.map(item => (
                      <AnimatedItem key={item.id}>
                        <SearchResultRow item={item} />
                      </AnimatedItem>
                    ))}
                  </AnimatedList>
                ) : (
                  <div className="space-y-8">
                    {groupResultsByType(filteredResults, RESULTS_PER_GROUP).map(group => {
                      const config = searchTypeConfig[group.type];
                      const label = config ? config.label[isRu ? 'ru' : 'en'] : group.type;
                      return (
                        <section key={group.type} aria-labelledby={`search-group-${group.type}`}>
                          <div className="flex items-baseline justify-between gap-3 mb-3 border-b border-border pb-2">
                            <h2
                              id={`search-group-${group.type}`}
                              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                            >
                              {label} · <span className="font-mono tabular-nums">{group.total}</span>
                            </h2>
                            {group.total > group.items.length && config && (
                              <button
                                type="button"
                                onClick={() => setSelectedType(group.type)}
                                className="min-h-11 text-sm font-medium text-primary hover:underline"
                              >
                                {isRu ? `Все в разделе «${label}»` : `See all in ${label}`}
                              </button>
                            )}
                          </div>
                          <ul className="space-y-3">
                            {group.items.map(item => (
                              <li key={item.id}>
                                <SearchResultRow item={item} />
                              </li>
                            ))}
                          </ul>
                        </section>
                      );
                    })}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
