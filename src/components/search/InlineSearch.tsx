import React, { useState, useRef, useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Loader2, ArrowRight, Star, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useGlobalSearch, SearchResult } from '@/hooks/useGlobalSearch';
import { searchTypeConfig, trendingSearches } from '@/lib/searchData';

export const InlineSearch = memo(function InlineSearch() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Use real database search
  const { results: dbResults, isLoading } = useGlobalSearch(query, isExpanded && query.length > 0);

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

  const handleQuickSearch = (term: string) => {
    setQuery(term);
    inputRef.current?.focus();
  };

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          placeholder={language === 'ru' ? 'Поиск услуг, мест...' : 'Search services, places...'}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          className="pl-10 pr-10 h-11"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute left-0 right-0 top-full mt-2 bg-background border border-border rounded-xl shadow-lg z-50 max-h-[60vh] overflow-hidden"
          >
            {query ? (
              // Search Results
              <div className="p-2 overflow-y-auto max-h-[50vh]">
                {isLoading ? (
                  <div className="text-center py-6">
                    <Loader2 className="w-6 h-6 text-primary mx-auto animate-spin" />
                    <p className="text-sm text-muted-foreground mt-2">
                      {language === 'ru' ? 'Поиск...' : 'Searching...'}
                    </p>
                  </div>
                ) : dbResults.length === 0 ? (
                  <div className="text-center py-6">
                    <Search className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {language === 'ru' ? 'Ничего не найдено' : 'No results found'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {dbResults.slice(0, 6).map((item, index) => {
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
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
