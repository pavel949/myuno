import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

const POPULAR_TAGS = [
  { labelEn: 'Transfers', labelRu: 'Трансферы', path: '/transport/airport-transfer' },
  { labelEn: 'Villas', labelRu: 'Виллы', path: '/property' },
  { labelEn: 'Yachts', labelRu: 'Яхты', path: '/yachts' },
  { labelEn: 'Tours', labelRu: 'Туры', path: '/experiences' },
  { labelEn: 'Property Management', labelRu: 'Управление недвижимостью', path: '/life/owner' },
];

export function VitrineHero() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const [query, setQuery] = useState('');

  const handleSearch = useCallback(() => {
    const q = query.trim();
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
  }, [query, navigate]);

  return (
    <section className="relative pt-28 pb-16 lg:pt-36 lg:pb-24">
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 text-center">
        {/* Wordmark */}
        <div className="flex items-baseline justify-center gap-1 mb-5">
          <span className="text-3xl lg:text-5xl font-light text-primary-light select-none" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            my
          </span>
          <span className="text-4xl lg:text-6xl font-bold text-navy font-display tracking-tight select-none">
            UNO
          </span>
        </div>

        {/* Tagline */}
        <h1 className="text-lg lg:text-xl font-medium text-muted-foreground mb-2">
          {isRu ? 'Ваша операционная система для жизни' : 'Your Life Operating System'}
        </h1>

        {/* Subtitle */}
        <p className="text-sm lg:text-base text-muted-foreground/70 mb-8 max-w-lg mx-auto">
          {isRu
            ? 'Каждый сервис проверен. Каждая транзакция защищена. Одна платформа для всего.'
            : 'Every service verified. Every transaction protected. One platform for everything.'}
        </p>

        {/* Search bar */}
        <div className="max-w-xl mx-auto mb-6">
          <div className={cn(
            "flex items-center gap-3 bg-card rounded-xl px-4 py-3 lg:py-3.5",
            "border border-border/60 shadow-sm",
            "focus-within:border-primary/40 focus-within:shadow-md transition-all"
          )}>
            <Search className="w-5 h-5 text-muted-foreground shrink-0" />
            <input
              className="flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground/60 outline-none"
              placeholder={isRu ? 'Что вам нужно?' : 'What do you need?'}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-primary-foreground shrink-0 hover:opacity-90 active:scale-95 transition-all"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Popular tags */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs text-muted-foreground/60 mr-1">
            {isRu ? 'Популярное:' : 'Popular:'}
          </span>
          {POPULAR_TAGS.map(tag => (
            <button
              key={tag.path}
              onClick={() => navigate(tag.path)}
              className="text-xs font-medium text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-full bg-muted/50 hover:bg-muted transition-colors"
            >
              {isRu ? tag.labelRu : tag.labelEn}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
