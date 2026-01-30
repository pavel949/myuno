import React, { useState, useRef, useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Loader2, ArrowRight, Star, TrendingUp, Sparkles, Bot } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAISearch, AISearchResponse } from '@/hooks/useAISearch';
import { useGlobalSearch, SearchResult } from '@/hooks/useGlobalSearch';
import { searchTypeConfig, trendingSearches } from '@/lib/searchData';

// Category path mappings for AI suggestions
const categoryPaths: Record<string, string> = {
  yachts: '/yachts',
  tours: '/tours',
  property: '/property',
  transport: '/transport',
  beauty: '/beauty',
  medical: '/medical',
  restaurants: '/restaurants',
  events: '/events',
  water: '/water',
  legal: '/legal',
  education: '/education',
  services: '/services',
  cleaning: '/cleaning',
  visa: '/visa',
  flowers: '/flowers',
  market: '/market',
  pharmacy: '/pharmacy',
};

const categoryLabels: Record<string, { en: string; ru: string }> = {
  yachts: { en: 'Yachts', ru: 'Яхты' },
  tours: { en: 'Tours', ru: 'Туры' },
  property: { en: 'Property', ru: 'Недвижимость' },
  transport: { en: 'Transport', ru: 'Транспорт' },
  beauty: { en: 'Beauty & SPA', ru: 'Красота и SPA' },
  medical: { en: 'Medical', ru: 'Медицина' },
  restaurants: { en: 'Restaurants', ru: 'Рестораны' },
  events: { en: 'Events', ru: 'Мероприятия' },
  water: { en: 'Water Sports', ru: 'Водные развлечения' },
  legal: { en: 'Legal', ru: 'Юридические услуги' },
  education: { en: 'Education', ru: 'Образование' },
  services: { en: 'Services', ru: 'Услуги' },
  cleaning: { en: 'Cleaning', ru: 'Клининг' },
  visa: { en: 'Visa', ru: 'Визы' },
  flowers: { en: 'Flowers', ru: 'Цветы' },
  market: { en: 'Market', ru: 'Маркет' },
  pharmacy: { en: 'Pharmacy', ru: 'Аптеки' },
};

export const InlineSearch = memo(function InlineSearch() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Use AI-enhanced search
  const { 
    searchResults, 
    isSearching,
    aiResponse, 
    isAILoading, 
    aiError,
    mode 
  } = useAISearch(query, isExpanded && query.length > 0);

  // Use search results from useAISearch for AI mode fallback (no separate call needed)
  // dbResults are only needed when we have AI response with categories
  const dbResults = searchResults;
  const isDbLoading = isSearching;

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    };
    
    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isExpanded]);

  const handleFocus = () => {
    setIsExpanded(true);
  };

  const handleSelect = (item: SearchResult) => {
    setIsExpanded(false);
    setQuery('');
    navigate(item.path);
  };

  const handleCategoryClick = (category: string) => {
    setIsExpanded(false);
    setQuery('');
    const path = categoryPaths[category] || `/${category}`;
    navigate(path);
  };

  const handleServiceClick = (service: { type: string; query: string }) => {
    setIsExpanded(false);
    setQuery('');
    const path = categoryPaths[service.type] || `/${service.type}`;
    navigate(`${path}?search=${encodeURIComponent(service.query)}`);
  };

  const handleQuickSearch = (term: string) => {
    setQuery(term);
    inputRef.current?.focus();
  };

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  const isLoading = isSearching || isAILoading || isDbLoading;

  return (
    <div ref={containerRef} className="relative">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          placeholder={language === 'ru' ? 'Поиск или задайте вопрос...' : 'Search or ask a question...'}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          className="pl-10 pr-16 h-11"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {mode === 'ai' && query && (
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          )}
          {query && (
            <button
              onClick={handleClear}
              className="p-1 hover:bg-muted rounded"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Dropdown Results */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute left-0 right-0 top-full mt-2 bg-background border border-border rounded-xl shadow-lg z-50 max-h-[70vh] overflow-hidden"
          >
            {query ? (
              <div className="p-2 overflow-y-auto max-h-[65vh]">
                {isLoading ? (
                  <div className="text-center py-6">
                    <Loader2 className="w-6 h-6 text-primary mx-auto animate-spin" />
                    <p className="text-sm text-muted-foreground mt-2">
                      {mode === 'ai' 
                        ? (language === 'ru' ? 'AI думает...' : 'AI is thinking...') 
                        : (language === 'ru' ? 'Поиск...' : 'Searching...')}
                    </p>
                  </div>
                ) : mode === 'ai' && aiResponse?.answer ? (
                  // AI Response Mode
                  <div className="space-y-3">
                    {/* AI Answer */}
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Bot className="w-4 h-4 text-primary" />
                        <span className="text-xs font-medium text-primary">
                          UNO Assistant
                        </span>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">
                        {aiResponse.answer}
                      </p>
                    </div>

                    {/* Suggested Categories */}
                    {aiResponse.suggestedCategories.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground mb-2 px-1">
                          {language === 'ru' ? 'Категории' : 'Categories'}
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {aiResponse.suggestedCategories.map((cat) => (
                            <button
                              key={cat}
                              onClick={() => handleCategoryClick(cat)}
                              className="px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground text-xs hover:bg-secondary/80 transition-colors"
                            >
                              {categoryLabels[cat]?.[language as 'en' | 'ru'] || cat}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Suggested Services */}
                    {aiResponse.suggestedServices.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground mb-2 px-1">
                          {language === 'ru' ? 'Рекомендации' : 'Recommendations'}
                        </h4>
                        <div className="space-y-1">
                          {aiResponse.suggestedServices.map((service, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleServiceClick(service)}
                              className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-colors text-left"
                            >
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Sparkles className="w-4 h-4 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">
                                  {service.query}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {service.reason}
                                </p>
                              </div>
                              <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Show regular results too if available */}
                    {dbResults.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground mb-2 px-1">
                          {language === 'ru' ? 'Найдено в каталоге' : 'Found in catalog'}
                        </h4>
                        <div className="space-y-1">
                          {dbResults.slice(0, 4).map((item) => {
                            const config = searchTypeConfig[item.type];
                            const Icon = config?.icon || Search;
                            return (
                              <button
                                key={item.id}
                                onClick={() => handleSelect(item)}
                                className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-colors text-left"
                              >
                                {item.image ? (
                                  <img
                                    src={item.image}
                                    alt=""
                                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                                  />
                                ) : (
                                  <div className={cn(
                                    "w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br flex-shrink-0",
                                    config?.color || 'from-gray-500 to-gray-600'
                                  )}>
                                    <Icon className="w-5 h-5 text-white" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate text-sm">
                                    {language === 'ru' ? item.titleRu : item.titleEn}
                                  </p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : searchResults.length === 0 && !aiError ? (
                  <div className="text-center py-6">
                    <Search className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {language === 'ru' ? 'Ничего не найдено' : 'No results found'}
                    </p>
                  </div>
                ) : aiError ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-destructive">{aiError}</p>
                  </div>
                ) : (
                  // Regular Search Results
                  <div className="space-y-1">
                    {searchResults.slice(0, 6).map((item) => {
                      const config = searchTypeConfig[item.type];
                      const Icon = config?.icon || Search;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelect(item)}
                          className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-colors text-left"
                        >
                          {item.image ? (
                            <img
                              src={item.image}
                              alt=""
                              className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br flex-shrink-0",
                              config?.color || 'from-gray-500 to-gray-600'
                            )}>
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <Badge variant="secondary" className="text-[9px] py-0 px-1">
                                {language === 'ru' ? config?.label?.ru : config?.label?.en}
                              </Badge>
                              {item.rating && (
                                <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                  {item.rating}
                                </span>
                              )}
                            </div>
                            <p className="font-medium truncate text-sm">
                              {language === 'ru' ? item.titleRu : item.titleEn}
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              // Trending Suggestions
              <div className="p-3">
                <h3 className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-2">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {language === 'ru' ? 'Популярное' : 'Trending'}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {(trendingSearches[language as keyof typeof trendingSearches] || trendingSearches.en).slice(0, 6).map((search, i) => (
                    <button
                      key={i}
                      onClick={() => handleQuickSearch(search)}
                      className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs hover:bg-primary/20 transition-colors"
                    >
                      {search}
                    </button>
                  ))}
                </div>
                
                {/* AI hint */}
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    {language === 'ru' 
                      ? 'Попробуйте: "Куда сходить с детьми?"' 
                      : 'Try asking: "Where to go with kids?"'}
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
