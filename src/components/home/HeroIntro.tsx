import React, { useState, useCallback } from 'react';
import { Search, ArrowRight, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePopularTasks, trackTaskOpen } from '@/hooks/home/usePopularTasks';

/**
 * HeroIntro — clean entry point for new users.
 * One question: «what do you need now?». One field: search.
 *
 * Desktop (lg+): two-column layout — hero + search on the left, top-3
 * popular tasks on the right (GOV.UK Start-page pattern). Mobile is
 * untouched — the full PopularTasks grid renders below.
 */
export function HeroIntro() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const { data: tasks } = usePopularTasks();
  const top3 = tasks.slice(0, 3);

  const handleSearch = useCallback(() => {
    const q = query.trim();
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
  }, [query, navigate]);

  return (
    <section className="px-4 pt-2 pb-5 lg:grid lg:grid-cols-[1.2fr_1fr] lg:gap-10 lg:items-start">
      {/* Left column — hero copy + search */}
      <div>
        <h1 className="font-display text-[24px] lg:text-[34px] leading-[1.15] font-bold text-foreground tracking-[-0.02em]">
          {isRu ? 'Сервисы для жизни на Пхукете' : 'Services for life in Phuket'}
        </h1>
        <p className="text-[13.5px] lg:text-[15px] text-muted-foreground mt-1.5 lg:mt-3 leading-snug lg:max-w-[36ch]">
          {isRu
            ? 'Жильё, услуги, документы — в одном приложении.'
            : 'Housing, services, documents — in one app.'}
        </p>

        <div
          className="mt-4 lg:mt-6 flex items-center gap-2 rounded-[14px] px-3.5 py-2.5 bg-card border border-border focus-within:border-border-strong transition-colors lg:max-w-[480px]"
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
      </div>

      {/* Right column — desktop-only popular preview (GOV.UK style) */}
      <aside
        className="hidden lg:block rounded-[14px] bg-card border border-border p-5"
        aria-labelledby="hero-popular-heading"
      >
        <div
          id="hero-popular-heading"
          className="text-[10.5px] tracking-[0.12em] uppercase text-muted-foreground/70 font-semibold mb-3"
        >
          {isRu ? 'Популярное сегодня' : 'Popular today'}
        </div>
        <ul className="space-y-1">
          {top3.map((task, i) => (
            <li key={task.id}>
              <button
                type="button"
                onClick={() => {
                  trackTaskOpen(task.id);
                  navigate(task.route);
                }}
                className="w-full flex items-center justify-between gap-3 py-2.5 px-1 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md text-left"
              >
                <div className="flex items-baseline gap-3 min-w-0">
                  <span className="font-mono text-[11px] text-muted-foreground/60 tabular-nums shrink-0">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-[14px] font-semibold text-foreground leading-snug truncate group-hover:text-primary transition-colors">
                    {isRu ? task.titleRu : task.titleEn}
                  </span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
              </button>
              {i < top3.length - 1 && <div className="h-px bg-border/60" />}
            </li>
          ))}
        </ul>
      </aside>
    </section>
  );
}
