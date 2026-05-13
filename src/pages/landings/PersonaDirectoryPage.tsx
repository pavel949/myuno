/**
 * @file PersonaDirectoryPage.tsx
 * @route /for
 * @description Hub directory of all 26 live persona landings, grouped by intent.
 *
 * Visitors arriving from search, ads, or onboarding "I am ..." choices land here
 * to find the page tailored for them. Every card → `/for/:slug`, themed via
 * `getPersonaTheme` so each tile carries the same visual identity as its landing.
 *
 * SEO: indexable, single H1, bilingual hreflang, listed in sitemap-landings.xml.
 */
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { PERSONA_LANDINGS } from '@/content/landings/personaLandings';
import { isLivePersonaLanding } from '@/lib/landings/types';
import { getPersonaTheme } from '@/lib/landings/personaTheme';
import { tokenColor } from '@/lib/utils/hslAlpha';
import { LandingContainer } from '@/components/landings';
import { ArrowRight } from 'lucide-react';

interface Group {
  id: string;
  titleRu: string;
  titleEn: string;
  slugs: string[];
}

/**
 * Intent-based grouping. Order = display order. A landing may appear in only
 * one group; orphans fall into "Other".
 */
const GROUPS: Group[] = [
  {
    id: 'travel',
    titleRu: 'Гости и путешественники',
    titleEn: 'Guests & travellers',
    slugs: ['tourists', 'eu-guests', 'cn-investors', 'mn-investors', 'snowbirds', 'medical', 'weddings', 'athletes', 'students'],
  },
  {
    id: 'settle',
    titleRu: 'Жить и обустроиться',
    titleEn: 'Live & settle in',
    slugs: ['ru-expats', 'digital-nomads', 'families', 'retirees', 'pet-owners', 'creatives'],
  },
  {
    id: 'invest',
    titleRu: 'Инвестировать',
    titleEn: 'Invest',
    slugs: ['passive-investors', 'hnw', 'operators', 'bn-business'],
  },
  {
    id: 'lifestyle',
    titleRu: 'Стиль и предпочтения',
    titleEn: 'Lifestyle & values',
    slugs: ['halal', 'conscious-eaters', 'lgbtq', 'accessibility'],
  },
  {
    id: 'business',
    titleRu: 'Бизнес и партнёры',
    titleEn: 'Business & partners',
    slugs: ['providers', 'developer-partner', 'smb', 'freelancers'],
  },
];

export default function PersonaDirectoryPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const t = <T,>(ru: T, en: T): T => (isRu ? ru : en);

  const liveBySlug = useMemo(() => {
    const map = new Map<string, (typeof PERSONA_LANDINGS)[number]>();
    for (const l of PERSONA_LANDINGS) if (isLivePersonaLanding(l)) map.set(l.slug, l);
    return map;
  }, []);

  const groupedSlugs = new Set(GROUPS.flatMap((g) => g.slugs));
  const orphans = [...liveBySlug.keys()].filter((s) => !groupedSlugs.has(s));

  const allGroups: Group[] = orphans.length
    ? [...GROUPS, { id: 'other', titleRu: 'Другое', titleEn: 'Other', slugs: orphans }]
    : GROUPS;

  const metaTitle = isRu
    ? 'Подбор по аудитории — myUNO'
    : 'Find your page — myUNO';
  const metaDescription = isRu
    ? '26 страниц для разных жителей и гостей Пхукета: туристы, инвесторы, семьи, номады, halal, vegan, питомцы и другие.'
    : '26 tailored pages for Phuket residents and guests: tourists, investors, families, nomads, halal, vegan, pets and more.';

  return (
    <AppLayout>
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href="https://myuno.app/for" />
        <link rel="alternate" hrefLang="ru" href="https://myuno.app/for?lang=ru" />
        <link rel="alternate" hrefLang="en" href="https://myuno.app/for?lang=en" />
        <link rel="alternate" hrefLang="x-default" href="https://myuno.app/for" />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:url" content="https://myuno.app/for" />
        <meta name="robots" content="index,follow" />
      </Helmet>

      {/* HERO */}
      <header className="border-b border-border bg-card">
        <LandingContainer className="max-w-5xl py-10 sm:py-14">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {t('myUNO · Подбор по аудитории', 'myUNO · By audience')}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t('Какая страница ваша?', 'Which page is yours?')}
          </h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground">
            {t(
              '26 страниц с пользой и услугами под конкретную аудиторию — выберите свою или ту, что описывает вашу ситуацию ближе всего.',
              '26 tailored pages with services for specific audiences — pick yours or the one that fits you best.',
            )}
          </p>
        </LandingContainer>
      </header>

      {/* GROUPS */}
      <main>
        <LandingContainer className="max-w-5xl py-8 sm:py-12">
        {allGroups.map((group) => {
          const items = group.slugs
            .map((s) => liveBySlug.get(s))
            .filter((l): l is NonNullable<typeof l> => Boolean(l));
          if (items.length === 0) return null;

          return (
            <section key={group.id} className="mb-10 last:mb-0">
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                {t(group.titleRu, group.titleEn)}
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((landing) => {
                  const theme = getPersonaTheme(landing.slug);
                  const Icon = theme.icon;
                  const tagline = isRu ? theme.tagline.ru : theme.tagline.en;
                  const h1 = isRu ? landing.h1.ru : landing.h1.en;
                  const subtitle = isRu ? landing.subtitle.ru : landing.subtitle.en;

                  return (
                    <Link
                      key={landing.slug}
                      to={`/for/${landing.slug}`}
                      className="group relative flex min-h-[140px] flex-col justify-between overflow-hidden border border-border bg-card p-4 transition-colors hover:border-foreground/30"
                      style={{
                        background: `linear-gradient(135deg, ${tokenColor(
                          theme.color,
                          0.08,
                        )} 0%, transparent 70%)`,
                      }}
                    >
                      <div>
                        <div
                          className="mb-3 inline-flex h-9 w-9 items-center justify-center"
                          style={{
                            background: tokenColor(theme.color, 0.15),
                            color: tokenColor(theme.color),
                          }}
                          aria-hidden
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <p
                          className="mb-1 text-[11px] font-semibold uppercase tracking-wider"
                          style={{ color: tokenColor(theme.color) }}
                        >
                          {tagline}
                        </p>
                        <h3 className="text-sm font-semibold leading-snug text-foreground">
                          {h1}
                        </h3>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {subtitle}
                        </p>
                      </div>
                      <div className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                        {t('Открыть', 'Open')}
                        <ArrowRight className="h-3 w-3" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
        </LandingContainer>
      </main>
    </AppLayout>
  );
}
