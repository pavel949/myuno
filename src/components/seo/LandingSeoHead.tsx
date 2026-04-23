/**
 * @file LandingSeoHead.tsx
 * @description M6 · Track B.6 — SEO/OG/schema.org/hreflang head для лендингов.
 *
 * Источник правды:
 *  - `docs/canonical/audits/M6-persona-landings.md` §3 Трек B.6
 *  - `docs/canonical/07-information-architecture.md` (canonical URL, hreflang)
 *  - `docs/canonical/03-tone-of-voice.md` §14 (текст meta — без urgency)
 *
 * Контракт:
 *  - Принимает `landing` (PersonaLanding | ClusterLanding) + `type`.
 *  - Если `landing.seo` отсутствует — компонент рендерит ничего (null).
 *    Это безопасно: live-страница не рендерится без SEO (`isLive*Landing()`),
 *    а draft-страница вообще не доходит до маршрута. Защита на случай
 *    регрессии guard'а.
 *  - Использует `react-helmet-async` (уже включён `HelmetProvider` в App.tsx).
 *
 * Структурированные данные:
 *  - persona → schema.org `Service` с `serviceType` = h1.
 *  - cluster → schema.org `Service` (та же модель), плюс `knowsAbout` =
 *    список jobs[] (lifecycle-фразы из §5).
 *  - Provider — фиксированная организация myUNO (см. PROJECT.md §3).
 *
 * hreflang:
 *  - RU↔EN. Lovable hosting не делает контент-неготиацию, поэтому
 *    canonical = текущий путь (без trailing slash). Альтернативы — те же
 *    URL с query `?lang=ru` / `?lang=en` (LanguageContext поддерживает).
 *    Конкретные альтернативы могут быть переопределены в `seo.hreflangAlternates`.
 */
import { Helmet } from 'react-helmet-async';
import type {
  ClusterLanding,
  PersonaLanding,
} from '@/lib/landings/types';

type LandingType = 'persona' | 'cluster';

interface LandingSeoHeadProps {
  landing: PersonaLanding | ClusterLanding;
  type: LandingType;
  /** Текущий язык страницы (RU / EN). */
  language: 'ru' | 'en';
  /** Базовый origin (для абсолютных URL). По умолчанию из window.location. */
  origin?: string;
}

const DEFAULT_ORIGIN = 'https://myuno.app';

const ORG_PROVIDER = {
  '@type': 'Organization',
  name: 'myUNO',
  url: 'https://myuno.app',
  logo: 'https://myuno.app/icons/icon-512x512.png',
} as const;

function resolveOrigin(explicit?: string): string {
  if (explicit) return explicit.replace(/\/$/, '');
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/$/, '');
  }
  return DEFAULT_ORIGIN;
}

function pickJobs(
  landing: PersonaLanding | ClusterLanding,
  type: LandingType,
  language: 'ru' | 'en',
): string[] {
  if (type === 'cluster') {
    return (landing as ClusterLanding).jobs.map((j) => j[language]);
  }
  return (landing as PersonaLanding).pains.map((p) => p[language]);
}

function buildServiceSchema(
  landing: PersonaLanding | ClusterLanding,
  type: LandingType,
  language: 'ru' | 'en',
  canonicalUrl: string,
): Record<string, unknown> {
  const jobs = pickJobs(landing, type, language);
  const serviceList = landing.services.map((s) => ({
    '@type': 'Offer',
    name: s.label[language],
    url: s.href.startsWith('http') ? s.href : `${canonicalUrl.split('/').slice(0, 3).join('/')}${s.href}`,
    description: s.oneLiner ? s.oneLiner[language] : undefined,
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: landing.h1[language],
    description: landing.subtitle[language],
    serviceType: type === 'persona' ? `Persona services for ${landing.slug}` : `Lifecycle services: ${landing.slug}`,
    areaServed: {
      '@type': 'Place',
      name: 'Phuket, Thailand',
    },
    provider: ORG_PROVIDER,
    url: canonicalUrl,
    knowsAbout: jobs,
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: landing.h1[language],
      itemListElement: serviceList,
    },
  };
}

function buildFaqSchema(
  landing: PersonaLanding | ClusterLanding,
  language: 'ru' | 'en',
): Record<string, unknown> | null {
  if (!landing.faq || landing.faq.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: landing.faq.map((entry) => ({
      '@type': 'Question',
      name: entry.q[language],
      acceptedAnswer: {
        '@type': 'Answer',
        text: entry.a[language],
      },
    })),
  };
}

const LandingSeoHead = ({ landing, type, language, origin }: LandingSeoHeadProps) => {
  if (!landing.seo) return null;

  const seo = landing.seo;
  const baseOrigin = resolveOrigin(origin);
  const canonicalUrl = `${baseOrigin}${seo.canonicalPath}`;

  const title = seo.metaTitle[language];
  const description = seo.metaDescription[language];

  // hreflang: используем явные alternates если заданы, иначе генерируем дефолт.
  const alternates =
    seo.hreflangAlternates && seo.hreflangAlternates.length > 0
      ? seo.hreflangAlternates
      : ([
          { lang: 'ru', href: `${baseOrigin}${seo.canonicalPath}?lang=ru` },
          { lang: 'en', href: `${baseOrigin}${seo.canonicalPath}?lang=en` },
        ] as const);

  const serviceSchema = buildServiceSchema(landing, type, language, canonicalUrl);
  const faqSchema = buildFaqSchema(landing, language);

  return (
    <Helmet>
      <html lang={language} />
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />

      {/* hreflang */}
      {alternates.map((alt) => (
        <link key={alt.lang} rel="alternate" hrefLang={alt.lang} href={alt.href} />
      ))}
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={seo.ogImage} />
      <meta property="og:locale" content={language === 'ru' ? 'ru_RU' : 'en_US'} />
      <meta
        property="og:locale:alternate"
        content={language === 'ru' ? 'en_US' : 'ru_RU'}
      />
      <meta property="og:site_name" content="myUNO" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={seo.ogImage} />

      {/* schema.org Service */}
      <script type="application/ld+json">
        {JSON.stringify(serviceSchema)}
      </script>
      {faqSchema ? (
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      ) : null}
    </Helmet>
  );
};

export default LandingSeoHead;
