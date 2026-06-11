/**
 * @module content/landings/areaLandings
 * @description Area landings config for `/area/:slug` — public, indexable
 * district profiles cross-linking rentals, offplan, persona and cluster pages.
 *
 * Source of truth for area facts: `src/lib/config/phuketAreas.ts` (PHUKET_AREAS).
 * This module only adds landing-specific metadata (SEO + cross-links) without
 * duplicating geography or stats.
 *
 * Cross-links are validated against the canonical live slug sets in
 * `personaLandings.ts` / `clusterLandings.ts` — see __tests__/areaLandings.test.ts.
 */

import { PHUKET_AREAS, type PhuketArea } from '@/lib/config/phuketAreas';
import { LIVE_PERSONA_SLUGS } from './personaLandings';
import { LIVE_CLUSTER_SLUGS } from './clusterLandings';

const OG_DEFAULT = 'https://myuno.app/og/default-og.jpg';

export interface AreaLanding {
  slug: string;
  area: PhuketArea;
  /** Persona slugs — must all be present in LIVE_PERSONA_SLUGS. */
  relatedPersonaSlugs: readonly string[];
  /** Cluster slugs — must all be present in LIVE_CLUSTER_SLUGS. */
  relatedClusterSlugs: readonly string[];
  seo: {
    metaTitle: { ru: string; en: string };
    metaDescription: { ru: string; en: string };
    ogImage: string;
    canonicalPath: string;
    hreflangAlternates: { lang: 'ru' | 'en'; href: string }[];
  };
}

/**
 * Manual mapping of area → persona / cluster slugs.
 * Order matters: most relevant first (used to truncate display lists).
 * All slugs verified to be in LIVE_PERSONA_SLUGS / LIVE_CLUSTER_SLUGS.
 */
const AREA_LINKS: Record<string, {
  personas: string[];
  clusters: string[];
}> = {
  'bang-tao':    { personas: ['hnw', 'passive-investors', 'families', 'snowbirds', 'ru-expats'], clusters: ['investment', 'settlement', 'lifestyle'] },
  'laguna':      { personas: ['hnw', 'passive-investors', 'families', 'snowbirds'], clusters: ['investment', 'lifestyle'] },
  'kamala':      { personas: ['families', 'passive-investors', 'snowbirds', 'ru-expats'], clusters: ['settlement', 'lifestyle'] },
  'surin':       { personas: ['hnw'],                                          clusters: ['investment', 'lifestyle'] },
  'layan':       { personas: ['passive-investors', 'hnw'],                     clusters: ['investment', 'lifestyle'] },
  'nai-harn':    { personas: ['ru-expats', 'retirees', 'snowbirds'],           clusters: ['settlement', 'lifestyle'] },
  'rawai':       { personas: ['ru-expats', 'retirees', 'digital-nomads'],      clusters: ['settlement', 'lifestyle'] },
  'cherngtalay': { personas: ['families', 'passive-investors', 'snowbirds'],   clusters: ['settlement', 'investment'] },
  'kata':        { personas: ['tourists', 'passive-investors'],                clusters: ['arrival', 'lifestyle'] },
  'phuket-town': { personas: ['digital-nomads', 'ru-expats'],                  clusters: ['settlement', 'arrival'] },
  'patong':      { personas: ['passive-investors', 'snowbirds', 'families', 'tourists'], clusters: ['arrival', 'investment'] },
  'karon':       { personas: ['families', 'tourists', 'passive-investors'],    clusters: ['arrival', 'lifestyle'] },
  'chalong':     { personas: ['families', 'ru-expats', 'retirees'],            clusters: ['settlement', 'lifestyle'] },
};

function buildSeo(area: PhuketArea): AreaLanding['seo'] {
  const path = `/area/${area.slug}`;
  const titleRu = `${area.name_ru} (${area.name_en}) — район Пхукета · myUNO`;
  const titleEn = `${area.name_en}, Phuket — area guide · myUNO`;
  const yieldStr = `${area.avg_yield}%`;
  const priceStr = `฿${(area.avg_price_sqm / 1000).toFixed(0)}K/м²`;
  const priceEn = `฿${(area.avg_price_sqm / 1000).toFixed(0)}K/sqm`;
  const descRu = `${area.name_ru}: средняя цена ${priceStr}, доходность ${yieldStr}, до пляжа ${
    area.distance_beach_km < 1 ? `${(area.distance_beach_km * 1000).toFixed(0)} м` : `${area.distance_beach_km} км`
  }. Аренда, новостройки, инвестиционный профиль.`;
  const descEn = `${area.name_en}, Phuket: average price ${priceEn}, yield ${yieldStr}, beach ${
    area.distance_beach_km < 1 ? `${(area.distance_beach_km * 1000).toFixed(0)} m` : `${area.distance_beach_km} km`
  }. Rentals, off-plan and an honest investment profile.`;
  return {
    metaTitle: { ru: titleRu.slice(0, 60), en: titleEn.slice(0, 60) },
    metaDescription: { ru: descRu.slice(0, 160), en: descEn.slice(0, 160) },
    ogImage: OG_DEFAULT,
    canonicalPath: path,
    hreflangAlternates: [
      { lang: 'ru', href: `https://myuno.app${path}?lang=ru` },
      { lang: 'en', href: `https://myuno.app${path}?lang=en` },
    ],
  };
}

function buildAreaLanding(area: PhuketArea): AreaLanding {
  const links = AREA_LINKS[area.slug] ?? { personas: [], clusters: [] };
  const personas = links.personas.filter((s) => LIVE_PERSONA_SLUGS.includes(s));
  const clusters = links.clusters.filter((s) => LIVE_CLUSTER_SLUGS.includes(s));
  return {
    slug: area.slug,
    area,
    relatedPersonaSlugs: personas,
    relatedClusterSlugs: clusters,
    seo: buildSeo(area),
  };
}

export const AREA_LANDINGS: readonly AreaLanding[] = PHUKET_AREAS.map(buildAreaLanding);

export const LIVE_AREA_SLUGS: readonly string[] = AREA_LANDINGS.map((l) => l.slug);

export function findAreaLandingBySlug(slug: string): AreaLanding | undefined {
  return AREA_LANDINGS.find((l) => l.slug === slug);
}
