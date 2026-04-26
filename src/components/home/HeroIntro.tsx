import React, { useState, useCallback, useEffect } from 'react';
import { Search, ArrowRight, ArrowUpRight, Home, Sparkles, Briefcase } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
 * URL ↔ tab state contract.
 *
 * The home page accepts `?vertical=<id>` to pre-select a tab on load. We accept
 * both the canonical ids (`homes` / `experiences` / `services` / `all`) and a
 * couple of friendlier aliases the user may type or share (`property`, `tours`).
 * Anything unrecognised falls back to `all` — never throws.
 */
const VERTICAL_ALIASES: Record<string, Vertical> = {
  all: 'all',
  homes: 'homes',
  property: 'homes',
  experiences: 'experiences',
  tours: 'experiences',
  activities: 'experiences',
  services: 'services',
};

function parseVertical(raw: string | null | undefined): Vertical {
  if (!raw) return 'all';
  const v = VERTICAL_ALIASES[raw.toLowerCase()];
  return v ?? 'all';
}

/**
 * HeroIntro — clean entry point for new users.
 * One question: «what do you need now?». One field: search + vertical tabs.
 *
 * Vertical tabs (Homes / Experiences / Services) route the search query to the
 * relevant catalog so users skip the universal `/search` step when they know
 * what they want — same pattern Airbnb uses on its mobile home.
 *
 * The selected tab is mirrored to `?vertical=` in the URL and restored on
 * reload, so deep-links like `/?vertical=homes` land on the right tab.
 */
export function HeroIntro() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  // Initial tab: URL param wins; default is `all`. parseVertical never throws.
  const [vertical, setVertical] = useState<Vertical>(() =>
    parseVertical(searchParams.get('vertical')),
  );
  const { data: tasks } = usePopularTasks();
  const top3 = tasks.slice(0, 3);

  // Keep state in sync if the URL changes externally (e.g. browser Back/Forward
  // between two `/?vertical=…` entries). We only update when the parsed value
  // really differs to avoid render loops.
  useEffect(() => {
    const fromUrl = parseVertical(searchParams.get('vertical'));
    if (fromUrl !== vertical) setVertical(fromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const goToVertical = useCallback(
    (target: Vertical, q: string) => {
      const base = VERTICAL_ROUTES[target];
      const trimmed = q.trim();
      const params = new URLSearchParams();
      if (trimmed) params.set('q', trimmed);
      // autofocus=1 lets target catalogs focus their search input on mount
      params.set('autofocus', '1');
      navigate(`${base}?${params.toString()}`);
    },
    [navigate],
  );

  const handleSearch = useCallback(() => {
    goToVertical(vertical, query);
  }, [goToVertical, vertical, query]);

  const handleVerticalClick = useCallback(
    (target: Vertical) => {
      setVertical(target);

      // Mirror the choice to the URL so reload / share-link restores the tab.
      // `replace: true` keeps the back button useful (no history spam).
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (target === 'all') {
            next.delete('vertical');
          } else {
            next.set('vertical', target);
          }
          return next;
        },
        { replace: true },
      );

      // `all` is the no-filter state — pressing it just resets the placeholder.
      // For any concrete vertical we navigate straight into its catalog so a
      // tab click always produces a visible result (with or without a query).
      if (target === 'all') return;
      goToVertical(target, query);
    },
    [goToVertical, query, setSearchParams],
  );

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

        {/* Search bar — canon §8.2 (Input): bg white, 1.5px border, square corners.
            Soft navy halo on focus turns the field into a confident CTA without
            breaking the squared-corner editorial style. */}
        <div
          className="mt-4 lg:mt-6 flex items-center gap-2 rounded-none px-3.5 h-11 bg-card border-[1.5px] border-border focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all lg:max-w-[480px]"
        >
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            className="flex-1 bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground/70 outline-none min-w-0"
            placeholder={isRu ? placeholderByVertical[vertical].ru : placeholderByVertical[vertical].en}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            aria-label={isRu ? 'Поиск' : 'Search'}
          />
          <button
            onClick={handleSearch}
            aria-label={isRu ? 'Поиск' : 'Search'}
            className="flex items-center justify-center w-9 h-9 rounded-none bg-primary text-primary-foreground shrink-0 hover:bg-[hsl(var(--primary-hover))] transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Vertical tabs — canon: square corners, navy active border (canon §8.3 active card pattern). */}
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
                onClick={() => handleVerticalClick(v.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 h-9 rounded-none text-[13px] font-medium whitespace-nowrap shrink-0 transition-colors border-[1.5px]',
                  active
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-muted-foreground border-border hover:text-foreground hover:border-primary',
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {isRu ? v.labelRu : v.labelEn}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right column — canon §8.3 Card: square corners, 1px border, no shadow. */}
      <aside
        className="hidden lg:block rounded-none bg-card border border-border p-5"
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
                className="w-full flex items-center justify-between gap-3 py-2.5 px-1 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-none text-left"
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

