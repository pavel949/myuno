/**
 * @module landings/personaTagMap
 * @description Single source of truth for persona-slug → tag vocabularies used
 * across the platform.
 *
 * Why two namespaces?
 *  - **Listing tags** (`public.listings.tags` and `public.listings.persona_tags`)
 *    are kebab-case keywords vendors and the backfill use to mark stock
 *    (e.g. `halal`, `vegan`, `pet-friendly`).
 *  - **App-registry persona tags** (`AppEntry.personaTags` in
 *    `src/lib/appRegistry.ts`) are short labels that pre-date the canonical
 *    landing slugs (e.g. `tourist`, `family`, `nomad`).
 *
 * This map bridges both so a single `persona-slug` (e.g. `conscious-eaters`)
 * can drive (a) catalog filtering and (b) "All apps for you" discovery on
 * persona landings — without leaking either vocabulary into the renderer.
 *
 * Related:
 *  - `docs/canonical/01-segmentation-framework.md` §4 (P1..P26)
 *  - `src/content/landings/personaLandings.ts` (slugs)
 *  - `src/lib/appRegistry.ts` (AppEntry.personaTags)
 */

import { APP_REGISTRY, type AppEntry } from '@/lib/appRegistry';

/**
 * Persona-slug → list of synonymous tags accepted by listing tag-filter.
 * The first entry is treated as the canonical tag for backfill.
 *
 * Empty array = "no specific filter" → catalog shows all listings (graceful
 * fallback the persona-landing experience promises).
 */
export const PERSONA_LISTING_TAGS: Record<string, string[]> = {
  // ── Travel / lifestyle modifiers ───────────────────────────────────
  halal:              ['halal', 'muslim-friendly', 'mosque-nearby'],
  'conscious-eaters': ['vegan', 'vegetarian', 'plant-based', 'gluten-free'],
  'pet-owners':       ['pet-friendly', 'pet'],
  weddings:           ['wedding', 'romantic', 'celebration', 'proposal'],
  athletes:           ['fitness', 'muay-thai', 'boxing', 'sport', 'gym'],
  medical:            ['medical', 'wellness', 'spa', 'recovery'],
  accessibility:      ['accessible', 'wheelchair-friendly', 'step-free'],
  lgbtq:              ['lgbtq-friendly', 'inclusive'],

  // ── Household / lifecycle ──────────────────────────────────────────
  families:           ['family', 'kids', 'kids-friendly', 'family-friendly'],
  'digital-nomads':   ['nomad', 'coworking', 'long-stay', 'wifi-fast'],
  retirees:           ['retiree', 'senior-friendly', 'long-stay'],
  snowbirds:          ['long-stay', 'monthly', 'season'],
  'eu-guests':        ['eu', 'english-speaking'],
  tourists:           ['tourist', 'short-stay'],
  'cn-investors':     ['mandarin-speaking', 'cn'],
  'mn-investors':     ['mongolian-speaking', 'mn'],
  'bn-business':      ['business', 'b2b'],
  'ru-expats':        ['russian-speaking', 'expat'],
  students:           ['student', 'budget', 'shared'],
  creatives:          ['creative', 'photogenic', 'studio'],

  // ── Investor / professional personas ───────────────────────────────
  'passive-investors':[],
  hnw:                ['premium', 'luxury', 'vip', 'off-market'],
  operators:          [],
  providers:          [],
  freelancers:        [],
  'developer-partner':[],
  smb:                [],
};

/**
 * Persona-slug → list of `AppEntry.personaTags` values that mark relevant apps.
 * Used to populate the "All apps for you" grid on persona landings.
 */
export const PERSONA_APP_TAGS: Record<string, string[]> = {
  tourists:           ['tourist'],
  snowbirds:          ['tourist', 'relocation'],
  'eu-guests':        ['tourist', 'couple'],
  'ru-expats':        ['relocation', 'family'],
  families:           ['family'],
  'digital-nomads':   ['nomad'],
  'pet-owners':       ['family', 'relocation'],
  retirees:           ['relocation', 'couple'],
  weddings:           ['couple'],
  athletes:           ['nomad', 'tourist'],
  medical:            ['tourist', 'family'],
  halal:              ['family', 'tourist'],
  lgbtq:              ['couple', 'tourist'],
  accessibility:      ['family', 'tourist'],
  'conscious-eaters': ['tourist', 'nomad', 'family'],
  'cn-investors':     ['business', 'tourist'],
  'mn-investors':     ['business'],
  'bn-business':      ['business'],
  students:           ['nomad'],
  creatives:          ['nomad'],
  // B2B personas — show operator/provider apps
  'passive-investors':['business'],
  hnw:                ['business'],
  operators:          ['property_owner'],
  providers:          ['business'],
  freelancers:        ['nomad', 'business'],
  'developer-partner':['business'],
  smb:                ['business'],
};

/**
 * Returns the tag vocabulary that listings should be filtered by for a given
 * persona slug. Empty array = no filter; caller should show the full catalog.
 */
export function getPersonaListingTags(slug: string | null | undefined): string[] {
  if (!slug) return [];
  return PERSONA_LISTING_TAGS[slug] ?? [];
}

/**
 * Returns the apps in the registry relevant to a given persona slug.
 * Empty persona or unmapped persona → returns ALL active apps (graceful
 * fallback "show all offers" the spec asks for).
 */
export function getAppsForPersona(slug: string | null | undefined): AppEntry[] {
  const allActive = Object.values(APP_REGISTRY).filter((a) => a.status === 'active');
  if (!slug) return allActive;
  const matchTags = PERSONA_APP_TAGS[slug];
  if (!matchTags || matchTags.length === 0) return allActive;
  const matching = allActive.filter((a) =>
    a.personaTags.some((t) => matchTags.includes(t))
  );
  // Fallback: if no apps match, show all (never strand the user with empty grid)
  return matching.length > 0 ? matching : allActive;
}

/**
 * Append `?persona=<slug>` to an href if it does not already carry that param.
 * Preserves existing query strings, hash fragments, and protocol-relative URLs.
 */
export function withPersonaParam(href: string, personaSlug: string): string {
  if (!href || !personaSlug) return href;
  // Skip mailto:, tel:, javascript:, and absolute external URLs we don't own
  if (/^(mailto:|tel:|javascript:)/i.test(href)) return href;
  // Already has a persona param — leave it
  if (/[?&]persona=/.test(href)) return href;
  const [base, hash = ''] = href.split('#');
  const sep = base.includes('?') ? '&' : '?';
  const hashSuffix = hash ? `#${hash}` : '';
  return `${base}${sep}persona=${encodeURIComponent(personaSlug)}${hashSuffix}`;
}
