/**
 * @component PersonaDiscoveryStrip
 * @description Horizontally-scrollable strip on the Home page surfacing the
 * platform's persona landings. 8 most-relevant tiles + "View all →" link to
 * `/for` directory.
 *
 * Why on Home: discovery — many users don't know there is a page tailored to
 * them. Renders icon + tagline so the value prop is readable in <0.5s.
 *
 * Design: matches `PersonaDirectoryPage` tiles but compact for horizontal
 * scroll, themed via `getPersonaTheme` (icon + accent token).
 */

import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PERSONA_LANDINGS } from '@/content/landings/personaLandings';
import { isLivePersonaLanding } from '@/lib/landings/types';
import { getPersonaTheme } from '@/lib/landings/personaTheme';
import { tokenColor } from '@/lib/utils/hslAlpha';

/** Highest-leverage personas surfaced on Home (broad-appeal, not B2B-only). */
const FEATURED_SLUGS = [
  'tourists',
  'digital-nomads',
  'families',
  'pet-owners',
  'snowbirds',
  'conscious-eaters',
  'halal',
  'passive-investors',
] as const;

export function PersonaDiscoveryStrip() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const t = <T,>(ru: T, en: T): T => (isRu ? ru : en);

  const tiles = FEATURED_SLUGS.map((slug) =>
    PERSONA_LANDINGS.find((l) => l.slug === slug && isLivePersonaLanding(l)),
  ).filter((l): l is NonNullable<typeof l> => Boolean(l));

  if (tiles.length === 0) return null;

  return (
    <section className="mt-6 px-4" aria-label={t('Подборки по аудиториям', 'For your audience')}>
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            {t('Подобрано под вас', 'Made for you')}
          </h2>
          <p className="text-xs text-muted-foreground">
            {t('Страницы под конкретные ситуации и предпочтения', 'Pages tailored to specific situations & preferences')}
          </p>
        </div>
        <Link
          to="/for"
          className="inline-flex items-center gap-1 text-xs font-medium text-foreground hover:opacity-80"
        >
          {t('Все 26 →', 'View all 26 →')}
        </Link>
      </div>

      <div className="-mx-4 overflow-x-auto pb-2">
        <ul className="flex gap-3 px-4">
          {tiles.map((landing) => {
            const theme = getPersonaTheme(landing.slug);
            const Icon = theme.icon;
            const tagline = isRu ? theme.tagline.ru : theme.tagline.en;
            const h1 = isRu ? landing.h1.ru : landing.h1.en;

            return (
              <li key={landing.slug} className="shrink-0">
                <Link
                  to={`/for/${landing.slug}`}
                  className="group flex h-32 w-44 flex-col justify-between border border-border bg-card p-3 transition-colors hover:border-foreground/30"
                  style={{
                    background: `linear-gradient(135deg, ${tokenColor(
                      theme.color,
                      0.12,
                    )} 0%, transparent 70%)`,
                  }}
                >
                  <div>
                    <div
                      className="mb-2 inline-flex h-7 w-7 items-center justify-center"
                      style={{
                        background: tokenColor(theme.color, 0.18),
                        color: tokenColor(theme.color),
                      }}
                      aria-hidden
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <p
                      className="text-[10px] font-semibold uppercase tracking-wider"
                      style={{ color: tokenColor(theme.color) }}
                    >
                      {tagline}
                    </p>
                    <h3 className="mt-0.5 line-clamp-2 text-xs font-semibold leading-snug text-foreground">
                      {h1}
                    </h3>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                    {t('Открыть', 'Open')}
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
