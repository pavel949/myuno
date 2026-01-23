import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, X, ArrowLeft } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AnimatedList, AnimatedItem, AnimatedGrid, AnimatedCard } from '@/components/layout/AnimatedList';
import { searchDemoData, searchTypeConfig, getSearchCategories, filterSearchItems } from '@/lib/searchData';

export default function Search() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const filteredResults = useMemo(() => {
    return filterSearchItems(searchDemoData, query, selectedType, language as 'en' | 'ru');
  }, [query, selectedType, language]);

  const recentSearches = ['massage', 'villa', 'thai food', 'english course'];
  const popularCategories = getSearchCategories();

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        {/* Search Header */}
        <div className="sticky top-0 z-20 bg-background border-b border-border p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder={language === 'ru' ? 'Поиск услуг, мест...' : 'Search services, places...'}
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
          <div className="flex gap-2 mt-3 overflow-x-auto pb-2 -mx-4 px-4">
            <Button
              variant={selectedType === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType(null)}
              className="flex-shrink-0"
            >
              {language === 'ru' ? 'Все' : 'All'}
            </Button>
            {popularCategories.map(type => {
              const config = searchTypeConfig[type];
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
              {/* Recent Searches */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  {language === 'ru' ? 'Недавние поиски' : 'Recent Searches'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map(search => (
                    <button
                      key={search}
                      onClick={() => setQuery(search)}
                      className="px-3 py-1.5 rounded-full bg-muted text-sm hover:bg-muted/80 transition-colors"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>

              {/* Popular Categories */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  {language === 'ru' ? 'Популярные категории' : 'Popular Categories'}
                </h3>
                <AnimatedGrid className="grid grid-cols-2 gap-3" staggerDelay={0.06}>
                  {popularCategories.slice(0, 6).map(type => {
                    const config = searchTypeConfig[type];
                    const Icon = config.icon;
                    return (
                      <AnimatedCard key={type}>
                        <button
                          onClick={() => setSelectedType(type)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-all"
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br",
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

          {/* Search Results */}
          {(query || selectedType) && (
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                {language === 'ru' 
                  ? `Найдено ${filteredResults.length} результатов` 
                  : `Found ${filteredResults.length} results`}
              </p>
              
              {filteredResults.length === 0 ? (
                <div className="text-center py-12">
                  <SearchIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="font-semibold mb-1">
                    {language === 'ru' ? 'Ничего не найдено' : 'No results found'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ru' 
                      ? 'Попробуйте изменить запрос или фильтры' 
                      : 'Try different keywords or filters'}
                  </p>
                </div>
              ) : (
                <AnimatedList className="space-y-3">
                  {filteredResults.map(item => {
                    const config = searchTypeConfig[item.type];
                    const Icon = config.icon;
                    return (
                      <AnimatedItem key={item.id}>
                        <div
                          onClick={() => navigate(item.path)}
                          className="flex gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-all cursor-pointer"
                        >
                          <img
                            src={item.image}
                            alt={language === 'ru' ? item.title_ru : item.title_en}
                            className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge 
                                variant="secondary" 
                                className={cn("text-xs gap-1")}
                              >
                                <Icon className="w-3 h-3" />
                                {config.label[language]}
                              </Badge>
                            </div>
                            <h3 className="font-semibold truncate">
                              {language === 'ru' ? item.title_ru : item.title_en}
                            </h3>
                            <p className="text-sm text-muted-foreground truncate">
                              {language === 'ru' ? item.location_ru : item.location}
                            </p>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-sm font-medium text-primary">
                                {item.price > 0 ? `฿${item.price.toLocaleString()}` : (language === 'ru' ? 'Бесплатно' : 'Free')}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ⭐ {item.rating}
                              </span>
                            </div>
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