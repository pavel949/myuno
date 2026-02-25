import React, { useState, useRef, useEffect, memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Loader2, ArrowRight, Star, TrendingUp, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAISearch } from '@/hooks/useAISearch';
import { SearchResult } from '@/hooks/useGlobalSearch';
import { searchTypeConfig, trendingSearches } from '@/lib/searchData';

export const InlineSearch = memo(function InlineSearch() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { 
    searchResults, 
    isSearching,
    aiResponse,
    isAILoading,
    triggerAI,
  } = useAISearch(query, isExpanded && query.length > 0);

  // Handle click outside
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

  const handleSelect = (item: SearchResult) => {
    setIsExpanded(false);
    setQuery('');
    navigate(item.path);
  };

  const handleQuickSearch = (term: string) => {
    setQuery(term);
    inputRef.current?.focus();
  };

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  // Group results by type for Super Search
  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    searchResults.forEach(item => {
      const key = item.type;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return groups;
  }, [searchResults]);

  const hasResults = searchResults.length > 0;
  const showAIHint = query.trim().split(/\s+/).length >= 4 && !aiResponse && !isAILoading;

  return (
    <div ref={containerRef} className="relative">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          placeholder={language === 'ru' ? 'Ищите что угодно...' : 'Search anything...'}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsExpanded(true)}
          className="pl-10 pr-10 h-11"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && (
            <button onClick={handleClear} className="p-1 hover:bg-muted rounded">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full mt-2 bg-background border border-border rounded-xl shadow-lg z-50 overflow-hidden"
          >
            {query.trim() ? (
              <div className="overflow-y-auto max-h-[65vh] min-h-[80px]">
                {/* Loading state */}
                {isSearching && !hasResults && (
                  <div className="text-center py-6">
                    <Loader2 className="w-5 h-5 text-primary mx-auto animate-spin" />
                    <p className="text-xs text-muted-foreground mt-2">
                      {language === 'ru' ? 'Поиск...' : 'Searching...'}
                    </p>
                  </div>
                )}

                {/* AI Response (when triggered) */}
                {aiResponse?.answer && (
                  <div className="mx-2 mt-2 bg-primary/5 border border-primary/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      <span className="text-xs font-medium text-primary">UNO AI</span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">{aiResponse.answer}</p>
                  </div>
                )}

                {isAILoading && (
                  <div className="mx-2 mt-2 bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    <span className="text-xs text-primary">
                      {language === 'ru' ? 'AI думает...' : 'AI is thinking...'}
                    </span>
                  </div>
                )}

                {/* Grouped search results */}
                {hasResults && (
                  <div className="p-1.5">
                    {Object.entries(groupedResults).map(([type, items]) => {
                      const config = searchTypeConfig[type];
                      const Icon = config?.icon || Search;
                      return (
                        <div key={type}>
                          {/* Section header */}
                          <div className="px-2 pt-2 pb-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                              {language === 'ru' ? config?.label?.ru : config?.label?.en}
                            </span>
                          </div>
                          {items.slice(0, 3).map((item) => (
                            <button
                              key={item.id}
                              onClick={() => handleSelect(item)}
                              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left"
                            >
                              {item.image ? (
                                <img src={item.image} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                              ) : (
                                <div className={cn(
                                  "w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br flex-shrink-0",
                                  config?.color || 'from-gray-500 to-gray-600'
                                )}>
                                  <Icon className="w-4 h-4 text-white" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                {item.isCategory && (
                                  <Badge variant="secondary" className="text-[9px] py-0 px-1 mb-0.5">
                                    {language === 'ru' ? 'Категория' : 'Category'}
                                  </Badge>
                                )}
                                <p className="font-medium truncate text-sm">
                                  {language === 'ru' ? item.titleRu : item.titleEn}
                                </p>
                                {item.rating && (
                                  <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                                    <Star className="w-3 h-3 fill-warning text-warning" />
                                    {item.rating}
                                  </span>
                                )}
                              </div>
                              <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            </button>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* No results */}
                {!isSearching && !hasResults && !aiResponse && (
                  <div className="text-center py-6">
                    <Search className="w-7 h-7 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {language === 'ru' ? 'Ничего не найдено' : 'No results found'}
                    </p>
                  </div>
                )}

                {/* Ask AI CTA — shows for long queries */}
                {showAIHint && (
                  <div className="border-t border-border mx-2 mt-1">
                    <button
                      onClick={triggerAI}
                      className="w-full flex items-center gap-2 p-2.5 text-left hover:bg-primary/5 rounded-lg transition-colors"
                    >
                      <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-xs text-primary font-medium">
                        {language === 'ru' ? 'Спросить AI-ассистента' : 'Ask AI assistant'}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Trending when empty */
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
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    {language === 'ru' 
                      ? 'Задайте вопрос — AI подскажет' 
                      : 'Ask a question — AI will help'}
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
