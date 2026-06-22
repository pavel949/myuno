/**
 * @module lib/seo/schemaBuilders
 * @description Schema.org JSON-LD builders per §9.1 of the Semantic Core.
 *
 * Each builder returns a plain JSON-serialisable object (no Helmet wrapping).
 * The `<JsonLd>` component handles serialisation and head injection.
 *
 * All builders accept `language: 'ru' | 'en'` so the same page can render
 * the schema in the active locale (Google supports localised schema).
 */

import type { BilingualString } from '@/lib/landings/types';

export type Lang = 'ru' | 'en' | 'th';

/**
 * Resolve a bilingual schema field. Schema source content carries only RU/EN,
 * so Thai degrades to English — JSON-LD is never emitted with empty strings.
 */
function pickSchema(field: BilingualString, lang: Lang): string {
  if (lang === 'ru') return field.ru ?? field.en;
  return field.en ?? field.ru;
}

const ORIGIN = 'https://www.myuno.app';

const ORG_PROVIDER = {
  '@type': 'Organization',
  name: 'myUNO',
  url: ORIGIN,
  logo: `${ORIGIN}/icons/icon-512x512.png`,
  sameAs: ['https://www.linkedin.com/company/myuno', 'https://t.me/myuno_app'],
} as const;

// ────────────────────────────────────────────────────────────────────
// Organization (§9.1 — Homepage / About)
// ────────────────────────────────────────────────────────────────────

export function buildOrganizationSchema(language: Lang): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'myUNO',
    legalName: 'Ignatev Group',
    url: ORIGIN,
    logo: `${ORIGIN}/icons/icon-512x512.png`,
    description: language === 'ru'
      ? 'myUNO — цифровая инфраструктура для иностранцев в Юго-Восточной Азии, построенная вокруг операций с недвижимостью.'
      : language === 'th'
        ? 'myUNO — โครงสร้างพื้นฐานดิจิทัลสำหรับชาวต่างชาติในเอเชียตะวันออกเฉียงใต้ ออกแบบรอบการดำเนินงานด้านอสังหาริมทรัพย์'
        : 'myUNO — digital infrastructure for foreigners in Southeast Asia, built around real-estate operations.',
    foundingDate: '2025',
    areaServed: { '@type': 'Place', name: 'Phuket, Thailand' },
    sameAs: ORG_PROVIDER.sameAs,
  };
}

// ────────────────────────────────────────────────────────────────────
// WebSite + SearchAction (§9.1 — Homepage)
// ────────────────────────────────────────────────────────────────────

export function buildWebSiteSchema(language: Lang): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'myUNO',
    url: ORIGIN,
    inLanguage: language === 'ru' ? 'ru' : language === 'th' ? 'th' : 'en',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${ORIGIN}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

// ────────────────────────────────────────────────────────────────────
// BreadcrumbList (§9.1 — every nested page)
// ────────────────────────────────────────────────────────────────────

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function buildBreadcrumbSchema(items: BreadcrumbItem[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: it.name,
      item: it.url.startsWith('http') ? it.url : `${ORIGIN}${it.url}`,
    })),
  };
}

// ────────────────────────────────────────────────────────────────────
// Article + HowTo (§9.1 — pillar / cluster guides)
// ────────────────────────────────────────────────────────────────────

export interface ArticleSchemaInput {
  headline: BilingualString;
  description: BilingualString;
  url: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
  authorName?: string;
  language: Lang;
}

export function buildArticleSchema(input: ArticleSchemaInput): Record<string, unknown> {
  const lang = input.language;
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: pickSchema(input.headline, lang),
    description: pickSchema(input.description, lang),
    inLanguage: lang === 'ru' ? 'ru' : lang === 'th' ? 'th' : 'en',
    image: input.image ?? `${ORIGIN}/og/default-og.jpg`,
    datePublished: input.datePublished,
    dateModified: input.dateModified ?? input.datePublished,
    author: { '@type': 'Person', name: input.authorName ?? 'myUNO Editorial' },
    publisher: ORG_PROVIDER,
    mainEntityOfPage: input.url.startsWith('http') ? input.url : `${ORIGIN}${input.url}`,
  };
}

// ────────────────────────────────────────────────────────────────────
// RealEstateListing (§9.1 — listings)
// ────────────────────────────────────────────────────────────────────

export interface RealEstateSchemaInput {
  name: string;
  description: string;
  url: string;
  image?: string;
  priceThb?: number;
  priceCurrency?: string;
  areaName?: string;
  numberOfBedrooms?: number;
  floorSize?: { value: number; unitCode: 'MTK' | 'FTK' };
  status?: 'ForSale' | 'ForRent';
}

export function buildRealEstateListingSchema(input: RealEstateSchemaInput): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: input.name,
    description: input.description,
    url: input.url.startsWith('http') ? input.url : `${ORIGIN}${input.url}`,
    image: input.image,
    address: input.areaName
      ? { '@type': 'PostalAddress', addressLocality: input.areaName, addressRegion: 'Phuket', addressCountry: 'TH' }
      : undefined,
    numberOfBedrooms: input.numberOfBedrooms,
    floorSize: input.floorSize
      ? { '@type': 'QuantitativeValue', value: input.floorSize.value, unitCode: input.floorSize.unitCode }
      : undefined,
    offers: input.priceThb
      ? {
          '@type': 'Offer',
          price: input.priceThb,
          priceCurrency: input.priceCurrency ?? 'THB',
          availability: input.status === 'ForRent' ? 'https://schema.org/InStock' : 'https://schema.org/InStock',
        }
      : undefined,
  };
}

// ────────────────────────────────────────────────────────────────────
// Service (§9.1 — service pages)
// ────────────────────────────────────────────────────────────────────

export interface ServiceSchemaInput {
  name: BilingualString;
  description: BilingualString;
  url: string;
  language: Lang;
  serviceType?: string;
  priceFromThb?: number;
}

export function buildServiceSchema(input: ServiceSchemaInput): Record<string, unknown> {
  const lang = input.language;
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: pickSchema(input.name, lang),
    description: pickSchema(input.description, lang),
    serviceType: input.serviceType ?? pickSchema(input.name, lang),
    areaServed: { '@type': 'Place', name: 'Phuket, Thailand' },
    provider: ORG_PROVIDER,
    url: input.url.startsWith('http') ? input.url : `${ORIGIN}${input.url}`,
    offers: input.priceFromThb
      ? { '@type': 'Offer', price: input.priceFromThb, priceCurrency: 'THB' }
      : undefined,
  };
}

// ────────────────────────────────────────────────────────────────────
// Place (§9.1 — area landings)
// ────────────────────────────────────────────────────────────────────

export interface PlaceSchemaInput {
  name: string;
  description: string;
  url: string;
  latitude?: number;
  longitude?: number;
  containedInPlace?: string;
}

export function buildPlaceSchema(input: PlaceSchemaInput): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: input.name,
    description: input.description,
    url: input.url.startsWith('http') ? input.url : `${ORIGIN}${input.url}`,
    geo: input.latitude && input.longitude
      ? { '@type': 'GeoCoordinates', latitude: input.latitude, longitude: input.longitude }
      : undefined,
    containedInPlace: input.containedInPlace
      ? { '@type': 'Place', name: input.containedInPlace }
      : { '@type': 'Place', name: 'Phuket, Thailand' },
  };
}

// ────────────────────────────────────────────────────────────────────
// FAQPage (§9.1 — FAQ block on any page)
// ────────────────────────────────────────────────────────────────────

export interface FaqEntry {
  question: string;
  answer: string;
}

export function buildFaqSchema(entries: FaqEntry[]): Record<string, unknown> | null {
  if (!entries || entries.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: entries.map((e) => ({
      '@type': 'Question',
      name: e.question,
      acceptedAnswer: { '@type': 'Answer', text: e.answer },
    })),
  };
}

// ────────────────────────────────────────────────────────────────────
// Review + AggregateRating (§9.1 — ClearView project)
// ────────────────────────────────────────────────────────────────────

export interface ClearViewReviewInput {
  itemName: string;
  itemUrl: string;
  /** AAA / AA / A / BBB / BB. */
  ratingValue: 'AAA' | 'AA' | 'A' | 'BBB' | 'BB';
  reviewCount?: number;
  reviewBody: string;
  language: Lang;
}

const RATING_TO_NUMERIC: Record<ClearViewReviewInput['ratingValue'], number> = {
  AAA: 5, AA: 4.5, A: 4, BBB: 3.5, BB: 3,
};

export function buildClearViewReviewSchema(input: ClearViewReviewInput): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: {
      '@type': 'RealEstateListing',
      name: input.itemName,
      url: input.itemUrl,
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: RATING_TO_NUMERIC[input.ratingValue],
      bestRating: 5,
      worstRating: 1,
      alternateName: input.ratingValue,
    },
    author: ORG_PROVIDER,
    reviewBody: input.reviewBody,
    inLanguage: input.language === 'ru' ? 'ru' : input.language === 'th' ? 'th' : 'en',
  };
}

export const SEO_CONSTANTS = { ORIGIN, ORG_PROVIDER } as const;
