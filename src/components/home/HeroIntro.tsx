import React, { useState, useCallback } from 'react';
import { Search, ArrowRight, ArrowUpRight, Home, Sparkles, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePopularTasks, trackTaskOpen } from '@/hooks/home/usePopularTasks';
import { cn } from '@/lib/utils';

type Vertical = 'all' | 'homes' | 'experiences' | 'services';

const VERTICAL_ROUTES: Record<Vertical, string> = {
  all: '/search',
  homes: '/property',
  experiences: '/experiences',
  services: '/services',
};

/**
 * HeroIntro — clean entry point for new users.
 * One question: «what do you need now?». One field: search + vertical tabs.
 *
 * Vertical tabs (Homes / Experiences / Services) route the search query to the
 * relevant catalog so users skip the universal `/search` step when they know
 * what they want — same pattern Airbnb uses on its mobile home.
 */
export function HeroIntro() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [vertical, setVertical] = useState<Vertical>('all');
  const { data: tasks } = usePopularTasks();
  const top3 = tasks.slice(0, 3);

  const handleSearch = useCallback(() => {
    const q = query.trim();
    const base = VERTICAL_ROUTES[vertical];
    navigate(q ? `${base}?q=${encodeURIComponent(q)}` : base);
  }, [query, vertical, navigate]);

  const verticals: Array<{ id: Vertical; labelRu: string; labelEn: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'all', labelRu: 'Всё', labelEn: 'All', icon: Search },
    { id: 'homes', labelRu: 'Жильё', labelEn: 'Homes', icon: Home },
    { id: 'experiences', labelRu: 'Активности', labelEn: 'Experiences', icon: Sparkles },
    { id: 'services', labelRu: 'Услуги', labelEn: 'Services', icon: Briefcase },
  ];

  const placeholderByVertical: Record<Vertical, { ru: string; en: string }> = {
    all: { ru: 'Поиск сервиса или услуги', en: 'Search a service' },
    homes: { ru: 'Куда поедем? Пляж, район…', en: 'Where to? Beach, area…' },
    experiences: { ru: 'Что хотите попробовать?', en: 'What to try?' },
    services: { ru: 'Какая услуга нужна?', en: 'What service?' },
  };

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
            placeholder={isRu ? placeholderByVertical[vertical].ru : placeholderByVertical[vertical].en}
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

        {/* Vertical tabs — Airbnb-style intent picker */}
        <div
          className="mt-3 flex items-center gap-1.5 overflow-x-auto scrollbar-none -mx-1 px-1 lg:max-w-[480px]"
          role="tablist"
          aria-label={isRu ? 'Категория поиска' : 'Search category'}
        >
          {verticals.map((v) => {
            const Icon = v.icon;
            const active = vertical === v.id;
            return (
              <button
                key={v.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setVertical(v.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 h-8 rounded-full text-[12.5px] font-medium whitespace-nowrap shrink-0 transition-all border',
                  active
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-card text-muted-foreground border-border hover:text-foreground hover:border-border-strong',
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {isRu ? v.labelRu : v.labelEn}
              </button>
            );
          })}
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

