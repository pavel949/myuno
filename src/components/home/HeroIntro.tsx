import React, { useState, useCallback } from 'react';
import { Search, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * HeroIntro — clean entry point for new users.
 * One question: «what do you need now?». One field: search.
 */
export function HeroIntro() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const handleSearch = useCallback(() => {
    const q = query.trim();
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
  }, [query, navigate]);

  return (
    <section className="px-4 pt-2 pb-5">
      <h1 className="font-display text-[24px] leading-[1.15] font-bold text-foreground tracking-[-0.02em]">
        {isRu ? 'Сервисы для жизни на Пхукете' : 'Services for life in Phuket'}
      </h1>
      <p className="text-[13.5px] text-muted-foreground mt-1.5 leading-snug">
        {isRu
          ? 'Жильё, услуги, документы — в одном приложении.'
          : 'Housing, services, documents — in one app.'}
      </p>

      <div
        className="mt-4 flex items-center gap-2 rounded-[14px] px-3.5 py-2.5 bg-card border border-border focus-within:border-border-strong transition-colors"
      >
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <input
          className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground/70 outline-none min-w-0"
          placeholder={isRu ? 'Поиск сервиса или услуги' : 'Search a service'}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          aria-label={isRu ? 'Поиск' : 'Search'}
        />
        <button
          onClick={handleSearch}
          aria-label={isRu ? 'Поиск' : 'Search'}
          className="flex items-center justify-center w-9 h-9 rounded-[10px] bg-foreground text-background shrink-0 active:scale-95 transition-transform"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
}
