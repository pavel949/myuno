/**
 * @file LandingSeoHead.tsx
 * @description M6 · Track B.6 + M9 · §9.1 — SEO/OG/schema.org/hreflang head для лендингов.
 *
 * Источник правды:
 *  - `docs/canonical/audits/M6-persona-landings.md` §3 Трек B.6
 *  - `docs/canonical/10-semantic-core.md` §9 (BreadcrumbList добавлен в M9)
 *  - `docs/canonical/07-information-architecture.md` (canonical URL, hreflang)
 *  - `docs/canonical/03-tone-of-voice.md` §14 (текст meta — без urgency)
 *
 * Контракт:
 *  - Принимает `landing` (PersonaLanding | ClusterLanding) + `type`.
 *  - Если `landing.seo` отсутствует — компонент рендерит ничего (null).
 *  - Использует `react-helmet-async` (HelmetProvider в App.tsx).
 *
 * Schema.org (M9 update — соответствует §9.1):
 *  - persona / cluster → `Service` (через buildServiceSchema из schemaBuilders).
 *  - FAQ → `FAQPage`.
 *  - Хлебные крошки → `BreadcrumbList` (M9 §9.1 строка «Pillar/Cluster»).
 *  - Provider — `Organization` myUNO (см. `SEO_CONSTANTS.ORG_PROVIDER`).
 */
import { Helmet } from 'react-helmet-async';
import type {
  ClusterLanding,
  PersonaLanding,
} from '@/lib/landings/types';
import {
  buildBreadcrumbSchema,
  buildFaqSchema as buildFaqSchemaShared,
  SEO_CONSTANTS,
} from '@/lib/seo/schemaBuilders';
import {
  buildClusterOgUrl,
  buildPersonaOgUrl,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_TYPE,
  OG_IMAGE_WIDTH,
} from '@/lib/seo/ogImage';

type LandingType = 'persona' | 'cluster';

interface LandingSeoHeadProps {
  landing: PersonaLanding | ClusterLanding;
  type: LandingType;
  /** Текущий язык страницы (RU / EN). */
  language: 'ru' | 'en';
  /** Базовый origin (для абсолютных URL). По умолчанию из window.location. */
  origin?: string;
}

const DEFAULT_ORIGIN = SEO_CONSTANTS.ORIGIN;
const ORG_PROVIDER = SEO_CONSTANTS.ORG_PROVIDER;

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

function buildLandingFaqSchema(
  landing: PersonaLanding | ClusterLanding,
  language: 'ru' | 'en',
): Record<string, unknown> | null {
  if (!landing.faq || landing.faq.length === 0) return null;
  return buildFaqSchemaShared(
    landing.faq.map((entry) => ({
      question: entry.q[language],
      answer: entry.a[language],
    })),
  );
}

function buildLandingBreadcrumb(
  landing: PersonaLanding | ClusterLanding,
  type: LandingType,
  language: 'ru' | 'en',
  baseOrigin: string,
): Record<string, unknown> {
  const homeLabel = language === 'ru' ? 'Главная' : 'Home';
  const sectionLabel =
    type === 'persona'
      ? language === 'ru' ? 'Для вас' : 'For you'
      : language === 'ru' ? 'Жизненные кластеры' : 'Life clusters';
  const sectionHref = type === 'persona' ? '/for' : '/cluster';
  const items = [
    { name: homeLabel, url: `${baseOrigin}/` },
    { name: sectionLabel, url: `${baseOrigin}${sectionHref}` },
    { name: landing.h1[language], url: `${baseOrigin}${landing.seo!.canonicalPath}` },
  ];
  return buildBreadcrumbSchema(items);
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
  const faqSchema = buildLandingFaqSchema(landing, language);
  const breadcrumbSchema = buildLandingBreadcrumb(landing, type, language, baseOrigin);

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
      {/* schema.org BreadcrumbList (M9 — §9.1) */}
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbSchema)}
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
