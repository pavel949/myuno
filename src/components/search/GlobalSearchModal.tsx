import React, { useState, useEffect, useRef, forwardRef, memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Clock, TrendingUp, Star, ArrowRight, Loader2, Sparkles, Mic, MicOff, Compass } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useGlobalSearch, SearchResult } from '@/hooks/useGlobalSearch';
import { searchTypeConfig, trendingSearches } from '@/lib/searchData';

interface GlobalSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Web Speech API typings (browser-only, optional)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionCtor = any;

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export const GlobalSearchModal = memo(forwardRef<HTMLDivElement, GlobalSearchModalProps>(
  function GlobalSearchModal({ open, onOpenChange }, ref) {
    const navigate = useNavigate();
    const { language } = useLanguage();
    const [query, setQuery] = useState('');
    const [listening, setListening] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognitionRef = useRef<any>(null);
    const [recentSearches, setRecentSearches] = useState<string[]>(() => {
      try {
        const saved = localStorage.getItem('myuno-recent-searches');
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    });

    const { results: dbResults, isLoading, aiAnswer, aiLoading } = useGlobalSearch(query, open);

    useEffect(() => {
      if (open && inputRef.current) {
        const timer = setTimeout(() => inputRef.current?.focus(), 100);
        return () => clearTimeout(timer);
      }
    }, [open]);

    // Stop voice recognition when modal closes
    useEffect(() => {
      if (!open && recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch { /* noop */ }
        setListening(false);
      }
    }, [open]);

    const handleSelect = useCallback((item: SearchResult) => {
      const newRecent = [query, ...recentSearches.filter((s) => s !== query)]
        .filter((s) => s.trim().length > 0)
        .slice(0, 5);
      setRecentSearches(newRecent);
      try {
        localStorage.setItem('myuno-recent-searches', JSON.stringify(newRecent));
      } catch { /* storage full */ }

      onOpenChange(false);
      setQuery('');
      navigate(item.path);
    }, [query, recentSearches, navigate, onOpenChange]);

    const handleQuickSearch = (term: string) => setQuery(term);

    const clearRecentSearches = () => {
      setRecentSearches([]);
      try { localStorage.removeItem('myuno-recent-searches'); } catch { /* noop */ }
    };

    const toggleVoice = () => {
      const Ctor = getSpeechRecognition();
      if (!Ctor) return;
      if (listening) {
        try { recognitionRef.current?.stop(); } catch { /* noop */ }
        setListening(false);
        return;
      }
      const rec = new Ctor();
      rec.lang = language === 'ru' ? 'ru-RU' : 'en-US';
      rec.interimResults = true;
      rec.continuous = false;
      rec.onresult = (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => {
        let transcript = '';
        for (let i = 0; i < e.results.length; i++) {
          transcript += e.results[i][0].transcript;
        }
        setQuery(transcript);
      };
      rec.onerror = () => setListening(false);
      rec.onend = () => setListening(false);
      recognitionRef.current = rec;
      try {
        rec.start();
        setListening(true);
      } catch {
        setListening(false);
      }
    };

    // Split results into sections — actions / categories / entities
    const actions = dbResults.filter((r) => r.isAction);
    const categories = dbResults.filter((r) => !r.isAction && r.isCategory);
    const entities = dbResults.filter((r) => !r.isAction && !r.isCategory);

    const voiceSupported = !!getSpeechRecognition();

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent ref={ref} className="sm:max-w-lg p-0 gap-0 max-h-[85vh] overflow-hidden" hideCloseButton aria-describedby={undefined}>
          <VisuallyHidden>
            <DialogTitle>Search</DialogTitle>
          </VisuallyHidden>

          {/* Input */}
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder={language === 'ru' ? 'Спросите или найдите что угодно...' : 'Ask or find anything...'}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 pr-20 h-12 text-base"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {voiceSupported && (
                  <button
                    type="button"
                    onClick={toggleVoice}
                    aria-label={language === 'ru' ? 'Голосовой ввод' : 'Voice input'}
                    className={cn(
                      'p-1.5 rounded-none hover:bg-muted transition-colors',
                      listening && 'bg-primary/10 text-primary',
                    )}
                  >
                    {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-muted-foreground" />}
                  </button>
                )}
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    aria-label={language === 'ru' ? 'Очистить' : 'Clear'}
                    className="p-1.5 hover:bg-muted rounded-none"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[65vh]">
            <AnimatePresence mode="wait">
              {query ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-3 space-y-4"
                >
                  {/* AI ANSWER */}
                  {(aiAnswer || aiLoading) && (
                    <section className="rounded-none border border-primary/30 bg-primary/5 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                          {language === 'ru' ? 'AI-консьерж' : 'AI Concierge'}
                        </span>
                      </div>
                      {aiLoading && !aiAnswer ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          {language === 'ru' ? 'Думаю...' : 'Thinking...'}
                        </div>
                      ) : aiAnswer ? (
                        <>
                          <p className="text-sm text-foreground leading-snug whitespace-pre-line">
                            {aiAnswer.answer}
                          </p>
                          {aiAnswer.suggestedServices.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {aiAnswer.suggestedServices.slice(0, 3).map((svc, i) => (
                                <button
                                  key={i}
                                  onClick={() => setQuery(svc.query)}
                                  className="text-[11px] px-2 py-1 bg-background border border-border hover:bg-muted transition-colors text-foreground"
                                >
                                  {svc.query}
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      ) : null}
                    </section>
                  )}

                  {/* LOADING DB */}
                  {isLoading && dbResults.length === 0 && (
                    <div className="text-center py-6">
                      <Loader2 className="w-7 h-7 text-primary mx-auto mb-2 animate-spin" />
                      <p className="text-sm text-muted-foreground">
                        {language === 'ru' ? 'Поиск...' : 'Searching...'}
                      </p>
                    </div>
                  )}

                  {/* ACTIONS (navigation) */}
                  {actions.length > 0 && (
                    <ResultSection
                      title={language === 'ru' ? 'Действия' : 'Actions'}
                      icon={<Compass className="w-3.5 h-3.5" />}
                    >
                      {actions.map((item, i) => (
                        <ActionRow key={item.id} item={item} language={language} index={i} onSelect={handleSelect} />
                      ))}
                    </ResultSection>
                  )}

                  {/* CATEGORIES */}
                  {categories.length > 0 && (
                    <ResultSection title={language === 'ru' ? 'Категории' : 'Categories'}>
                      {categories.map((item, i) => (
                        <EntityRow key={item.id} item={item} language={language} index={i} onSelect={handleSelect} />
                      ))}
                    </ResultSection>
                  )}

                  {/* ENTITIES */}
                  {entities.length > 0 && (
                    <ResultSection title={language === 'ru' ? 'Каталог' : 'Catalogue'}>
                      {entities.map((item, i) => (
                        <EntityRow key={item.id} item={item} language={language} index={i} onSelect={handleSelect} />
                      ))}
                    </ResultSection>
                  )}

                  {/* ZERO STATE */}
                  {!isLoading && !aiLoading && dbResults.length === 0 && !aiAnswer && (
                    <div className="text-center py-8">
                      <Search className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-muted-foreground text-sm">
                        {language === 'ru' ? 'Ничего не найдено' : 'No results found'}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {language === 'ru' ? 'Попробуйте задать вопрос — AI поможет' : 'Try asking a question — AI will help'}
                      </p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="suggestions"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-4 space-y-6"
                >
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

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">
                      {language === 'ru' ? 'Спросите AI' : 'Ask AI'}
                    </h3>
                    <div className="grid grid-cols-1 gap-2">
                      {(language === 'ru'
                        ? ['Как продлить туристическую визу?', 'Где найти няню англоязычную?', 'Сколько стоит аренда виллы у моря?']
                        : ['How do I extend a tourist visa?', 'Where can I find an English-speaking nanny?', 'How much is a beachfront villa rental?']
                      ).map((q, i) => (
                        <button
                          key={i}
                          onClick={() => handleQuickSearch(q)}
                          className="text-left px-3 py-2 text-sm text-foreground hover:bg-muted/60 border border-border flex items-start gap-2"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                          <span>{q}</span>
                        </button>
                      ))}
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

// ─── helpers ──────────────────────────────────────────────────────────────

interface ResultSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}
function ResultSection({ title, icon, children }: ResultSectionProps) {
  return (
    <section>
      <div className="px-1 mb-1.5 flex items-center gap-1.5">
        {icon}
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</h4>
      </div>
      <div className="space-y-1">{children}</div>
    </section>
  );
}

interface RowProps {
  item: SearchResult;
  language: string;
  index: number;
  onSelect: (item: SearchResult) => void;
}

function ActionRow({ item, language, index, onSelect }: RowProps) {
  const title = language === 'ru' ? item.titleRu : item.titleEn;
  const desc = language === 'ru' ? item.descriptionRu : item.descriptionEn;
  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 6) * 0.03 }}
      onClick={() => onSelect(item)}
      className="w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors text-left border border-transparent hover:border-border"
    >
      <div className="w-10 h-10 bg-primary/10 border border-primary/25 flex items-center justify-center flex-shrink-0">
        <ArrowRight className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-foreground truncate">{title}</p>
        {desc && <p className="text-xs text-muted-foreground truncate">{desc}</p>}
      </div>
      <span className="text-[10px] text-muted-foreground font-mono opacity-60">↵</span>
    </motion.button>
  );
}

function EntityRow({ item, language, index, onSelect }: RowProps) {
  const config = searchTypeConfig[item.type];
  const Icon = config?.icon || Search;
  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.03 }}
      onClick={() => onSelect(item)}
      className="w-full flex items-center gap-3 p-2.5 hover:bg-muted transition-colors text-left"
    >
      {item.image ? (
        <img src={item.image} alt="" className="w-11 h-11 object-cover flex-shrink-0" />
      ) : (
        <div className={cn('w-11 h-11 flex items-center justify-center bg-gradient-to-br flex-shrink-0', config?.color || 'from-muted to-muted')}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
            <Icon className="w-3 h-3 mr-0.5" />
            {language === 'ru' ? config?.label?.ru : config?.label?.en}
          </Badge>
          {item.rating != null && (
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
}
