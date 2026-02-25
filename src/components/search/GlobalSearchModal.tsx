import React, { useState, useEffect, useRef, forwardRef, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Clock, TrendingUp, Star, ArrowRight, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useGlobalSearch, SearchResult } from '@/hooks/useGlobalSearch';
import { searchTypeConfig, trendingSearches, TypeConfig } from '@/lib/searchData';

interface GlobalSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const GlobalSearchModal = memo(forwardRef<HTMLDivElement, GlobalSearchModalProps>(
  function GlobalSearchModal({ open, onOpenChange }, ref) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('myuno-recent-searches');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Use real database search
  const { results: dbResults, isLoading } = useGlobalSearch(query, open);

  useEffect(() => {
    if (open && inputRef.current) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleSelect = (item: SearchResult) => {
    // Save to recent searches
    const newRecent = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem('myuno-recent-searches', JSON.stringify(newRecent));
    
    onOpenChange(false);
    setQuery('');
    navigate(item.path);
  };

  const handleQuickSearch = (term: string) => {
    setQuery(term);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('myuno-recent-searches');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent ref={ref} className="sm:max-w-lg p-0 gap-0 max-h-[80vh] overflow-hidden" hideCloseButton aria-describedby={undefined}>
        <VisuallyHidden>
          <DialogTitle>Search</DialogTitle>
        </VisuallyHidden>
        {/* Search Input */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder={language === 'ru' ? 'Поиск услуг, мест, событий...' : 'Search services, places, events...'}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-10 h-12 text-base"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[60vh]">
          <AnimatePresence mode="wait">
            {query ? (
              // Search Results
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-2"
              >
                {isLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 text-primary mx-auto mb-3 animate-spin" />
                    <p className="text-muted-foreground">
                      {language === 'ru' ? 'Поиск...' : 'Searching...'}
                    </p>
                  </div>
                ) : dbResults.length === 0 ? (
                  <div className="text-center py-8">
                    <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      {language === 'ru' ? 'Ничего не найдено' : 'No results found'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {dbResults.map((item, index) => {
                      const config = searchTypeConfig[item.type];
                      const Icon = config?.icon || Search;
                      return (
                        <motion.button
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => handleSelect(item)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors text-left"
                        >
                          {item.image ? (
                            <img
                              src={item.image}
                              alt=""
                              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-br flex-shrink-0", config?.color || 'from-gray-500 to-gray-600')}>
                              <Icon className="w-6 h-6 text-white" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                                <Icon className="w-3 h-3 mr-0.5" />
                                {language === 'ru' ? config?.label?.ru : config?.label?.en}
                              </Badge>
                              {item.rating && (
                                <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                                  <Star className="w-3 h-3 fill-warning text-warning" />
                                  {item.rating}
                                </span>
                              )}
                            </div>
                            <p className="font-medium truncate text-sm">
                              {language === 'ru' ? item.titleRu : item.titleEn}
                            </p>
                            {(item.locationEn || item.locationRu) && (
                              <p className="text-xs text-muted-foreground truncate">
                                {language === 'ru' ? item.locationRu : item.locationEn}
                              </p>
                            )}
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            ) : (
              // Suggestions
              <motion.div
                key="suggestions"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-4 space-y-6"
              >
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {language === 'ru' ? 'Недавние' : 'Recent'}
                      </h3>
                      <button
                        onClick={clearRecentSearches}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        {language === 'ru' ? 'Очистить' : 'Clear'}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((search, i) => (
                        <button
                          key={i}
                          onClick={() => handleQuickSearch(search)}
                          className="px-3 py-1.5 rounded-full bg-muted text-sm hover:bg-muted/80 transition-colors"
                        >
                          {search}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trending */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4" />
                    {language === 'ru' ? 'Популярное' : 'Trending'}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(trendingSearches[language as keyof typeof trendingSearches] || trendingSearches.en).map((search, i) => (
                      <button
                        key={i}
                        onClick={() => handleQuickSearch(search)}
                        className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm hover:bg-primary/20 transition-colors"
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Categories */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    {language === 'ru' ? 'Категории' : 'Categories'}
                  </h3>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(searchTypeConfig).slice(0, 8).map(([key, config]) => {
                      const Icon = config.icon;
                      return (
                        <button
                          key={key}
                          onClick={() => {
                            onOpenChange(false);
                            navigate(`/${key === 'property' ? 'property' : key}`);
                          }}
                          className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-muted transition-colors"
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br",
                            config.color
                          )}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-[10px] text-muted-foreground text-center line-clamp-1">
                            {language === 'ru' ? config.label.ru : config.label.en}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}));

GlobalSearchModal.displayName = 'GlobalSearchModal';
