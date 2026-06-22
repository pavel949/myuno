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

/**
 * Landing SEO language. Landing CONTENT objects (`BilingualString`) carry only
 * RU/EN, so for Thai we fall back to EN at render time via {@link pickSeo} —
 * Thai pages still emit valid (English) meta instead of blank tags.
 */
type SeoLang = 'ru' | 'en' | 'th';

interface LandingSeoHeadProps {
  landing: PersonaLanding | ClusterLanding;
  type: LandingType;
  /** Текущий язык страницы (RU / EN / TH). */
  language: SeoLang;
  /** Базовый origin (для абсолютных URL). По умолчанию из window.location. */
  origin?: string;
}

/**
 * Resolve a bilingual landing field for the active SEO language.
 * Landing data has no Thai — TH degrades to EN so meta is never empty.
 */
function pickSeo(field: { ru: string; en: string }, language: SeoLang): string {
  if (language === 'ru') return field.ru ?? field.en;
  // 'en' and 'th' both resolve to English (no Thai in landing data).
  return field.en ?? field.ru;
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
  language: SeoLang,
): string[] {
  if (type === 'cluster') {
    return (landing as ClusterLanding).jobs.map((j) => pickSeo(j, language));
  }
  return (landing as PersonaLanding).pains.map((p) => pickSeo(p, language));
}

function buildServiceSchema(
  landing: PersonaLanding | ClusterLanding,
  type: LandingType,
  language: SeoLang,
  canonicalUrl: string,
): Record<string, unknown> {
  const jobs = pickJobs(landing, type, language);
  const serviceList = landing.services.map((s) => ({
    '@type': 'Offer',
    name: pickSeo(s.label, language),
    url: s.href.startsWith('http') ? s.href : `${canonicalUrl.split('/').slice(0, 3).join('/')}${s.href}`,
    description: s.oneLiner ? pickSeo(s.oneLiner, language) : undefined,
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: pickSeo(landing.h1, language),
    description: pickSeo(landing.subtitle, language),
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
      name: pickSeo(landing.h1, language),
      itemListElement: serviceList,
    },
  };
}

function buildLandingFaqSchema(
  landing: PersonaLanding | ClusterLanding,
  language: SeoLang,
): Record<string, unknown> | null {
  if (!landing.faq || landing.faq.length === 0) return null;
  return buildFaqSchemaShared(
    landing.faq.map((entry) => ({
      question: pickSeo(entry.q, language),
      answer: pickSeo(entry.a, language),
    })),
  );
}

function buildLandingBreadcrumb(
  landing: PersonaLanding | ClusterLanding,
  type: LandingType,
  language: SeoLang,
  baseOrigin: string,
): Record<string, unknown> {
  const homeLabel = language === 'ru' ? 'Главная' : language === 'th' ? 'หน้าแรก' : 'Home';
  const sectionLabel =
    type === 'persona'
      ? language === 'ru' ? 'Для вас' : language === 'th' ? 'สำหรับคุณ' : 'For you'
      : language === 'ru' ? 'Жизненные кластеры' : language === 'th' ? 'หมวดการใช้ชีวิต' : 'Life clusters';
  const sectionHref = type === 'persona' ? '/for' : '/cluster';
  const items = [
    { name: homeLabel, url: `${baseOrigin}/` },
    { name: sectionLabel, url: `${baseOrigin}${sectionHref}` },
    { name: pickSeo(landing.h1, language), url: `${baseOrigin}${landing.seo!.canonicalPath}` },
  ];
  return buildBreadcrumbSchema(items);
}

const LandingSeoHead = ({ landing, type, language, origin }: LandingSeoHeadProps) => {
  if (!landing.seo) return null;

  const seo = landing.seo;
  const baseOrigin = resolveOrigin(origin);
  const canonicalUrl = `${baseOrigin}${seo.canonicalPath}`;

  const title = pickSeo(seo.metaTitle, language);
  const description = pickSeo(seo.metaDescription, language);

  // OG image lang: the edge function only renders RU/EN cards — TH degrades
  // to EN so the share card still has readable copy.
  const ogLang: 'ru' | 'en' = language === 'ru' ? 'ru' : 'en';

  // Dynamic OG image (Wave 4) — overrides the static seo.ogImage so that
  // each persona/cluster gets a branded, language-aware share card.
  const ogImage =
    type === 'persona'
      ? buildPersonaOgUrl({ persona: landing.slug, lang: ogLang })
      : buildClusterOgUrl({ cluster: landing.slug, lang: ogLang });
  const ogAlt = `${pickSeo(landing.h1, language)} — myUNO`;

  // hreflang: используем явные alternates если заданы, иначе генерируем дефолт.
  const alternates =
    seo.hreflangAlternates && seo.hreflangAlternates.length > 0
      ? seo.hreflangAlternates
      : ([
          { lang: 'ru', href: `${baseOrigin}${seo.canonicalPath}?lang=ru` },
          { lang: 'en', href: `${baseOrigin}${seo.canonicalPath}?lang=en` },
          { lang: 'th', href: `${baseOrigin}${seo.canonicalPath}?lang=th` },
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

      {/* Preload OG image so social crawlers fetch it warm. */}
      <link rel="preload" as="image" href={ogImage} type={OG_IMAGE_TYPE} />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:secure_url" content={ogImage} />
      <meta property="og:image:type" content={OG_IMAGE_TYPE} />
      <meta property="og:image:width" content={String(OG_IMAGE_WIDTH)} />
      <meta property="og:image:height" content={String(OG_IMAGE_HEIGHT)} />
      <meta property="og:image:alt" content={ogAlt} />
      <meta property="og:locale" content={language === 'ru' ? 'ru_RU' : language === 'th' ? 'th_TH' : 'en_US'} />
      {language !== 'en' && <meta property="og:locale:alternate" content="en_US" />}
      {language !== 'ru' && <meta property="og:locale:alternate" content="ru_RU" />}
      {language !== 'th' && <meta property="og:locale:alternate" content="th_TH" />}
      <meta property="og:site_name" content="myUNO" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content={ogAlt} />

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
