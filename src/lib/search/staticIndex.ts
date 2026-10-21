/**
 * Unified static search index — Tier 1 of global search.
 *
 * Builds one in-memory, typo-tolerant index over every navigable static
 * dataset so the search modal can answer "find an app / service / area /
 * persona / situation / page" instantly, with zero network dependency.
 *
 * Sources (all SSOT, no dead links — every path resolves to a real route):
 *  - micro-apps          src/lib/appRegistry.ts          → app.route
 *  - services            src/lib/catalog/taxonomy.ts     → service.path
 *  - categories          src/lib/catalog/taxonomy.ts     → cluster.homeRoute
 *  - clusters (public)   src/lib/catalog/taxonomy.ts     → cluster.homeRoute
 *  - life situations     src/lib/catalog/taxonomy.ts     → /discover/:code
 *  - personas (active)   src/lib/taxonomies/master.ts    → /for/:slug
 *  - Phuket areas        src/lib/config/phuketAreas.ts   → /area/:slug
 *  - curated nav targets src/lib/search/navigationIndex  → target.path
 *
 * Ranking is shared with the navigation index via scoring.ts.
 */

import { getActiveApps } from '@/lib/appRegistry';
import {
  AVAILABLE_SERVICES,
  CATEGORIES,
  CLUSTERS,
  LIFE_SITUATIONS,
  getClusterById,
} from '@/lib/catalog/taxonomy';
import { PERSONAS } from '@/lib/taxonomies/master';
import { PHUKET_AREAS } from '@/lib/config/phuketAreas';
import { NAVIGATION_INDEX } from './navigationIndex';
import { scoreEntry, tokenize, norm, type ScorableEntry, type ScoreContext } from './scoring';
import type { SearchResult } from '@/hooks/useGlobalSearch';

/** A scorable entry plus everything needed to render it as a SearchResult. */
interface StaticSearchEntry extends ScorableEntry {
  id: string;
  path: string;
  /** Which result section this renders in. */
  section: 'action' | 'category';
  /** SearchResult.type — drives the row icon/label in the modal. */
  type: string;
  descriptionRu?: string;
  descriptionEn?: string;
}

/** Keep non-empty, de-duplicated keyword strings. */
const kw = (...parts: Array<string | undefined | null>): string[] =>
  [...new Set(parts.filter((p): p is string => !!p && p.trim().length > 0))];

function buildIndex(): StaticSearchEntry[] {
  const entries: StaticSearchEntry[] = [];

  // Curated navigation targets — highest base prominence (hand-tuned).
  for (const t of NAVIGATION_INDEX) {
    entries.push({
      id: t.id,
      titleRu: t.titleRu,
      titleEn: t.titleEn,
      keywords: t.keywords,
      path: t.path,
      section: 'action',
      type: 'action',
      weight: (t.weight ?? 5) + 4,
      personas: t.personas,
      cluster: t.cluster,
      requiresRole: t.requiresRole,
      descriptionRu: t.descriptionRu,
      descriptionEn: t.descriptionEn,
    });
  }

  // Micro-apps (active only).
  for (const a of getActiveApps()) {
    entries.push({
      id: `app-${a.id}`,
      titleRu: a.labelRu,
      titleEn: a.labelEn,
      titleTh: a.labelTh,
      keywords: kw(a.id, ...a.id.split('-')),
      path: a.route,
      section: 'action',
      type: 'action',
      weight: 6,
      personas: a.personaTags,
      cluster: a.clusterIds[0],
    });
  }

  // Services (available only).
  for (const s of AVAILABLE_SERVICES) {
    entries.push({
      id: `svc-${s.id}`,
      titleRu: s.labelRu,
      titleEn: s.labelEn,
      titleTh: s.labelTh,
      keywords: kw(s.categoryLabelEn, s.categoryLabelRu, ...(s.situationCodes ?? [])),
      path: s.path,
      section: 'category',
      type: 'category',
      weight: 4,
      personas: s.personaTags,
      cluster: s.clusterId,
    });
  }

  // Categories → cluster umbrella route.
  for (const cat of CATEGORIES) {
    entries.push({
      id: `cat-${cat.id}`,
      titleRu: cat.labelRu,
      titleEn: cat.labelEn,
      titleTh: cat.labelTh,
      keywords: kw(cat.valueEn, cat.valueRu),
      path: getClusterById(cat.clusterId)?.homeRoute ?? '/discover',
      section: 'category',
      type: 'category',
      weight: 3,
      cluster: cat.clusterId,
    });
  }

  // Public clusters (umbrella surfaces).
  for (const c of CLUSTERS) {
    if (c.audience !== 'public') continue;
    entries.push({
      id: `cluster-${c.id}`,
      titleRu: c.labelRu,
      titleEn: c.labelEn,
      titleTh: c.labelTh,
      keywords: kw(c.valueEn, c.valueRu),
      path: c.homeRoute,
      section: 'action',
      type: 'action',
      weight: 3,
      cluster: c.id,
    });
  }

  // Phuket areas.
  for (const area of PHUKET_AREAS) {
    entries.push({
      id: `area-${area.slug}`,
      titleRu: area.name_ru,
      titleEn: area.name_en,
      keywords: kw(area.slug, ...area.popular_for),
      path: `/area/${area.slug}`,
      section: 'action',
      type: 'action',
      weight: 4,
      descriptionRu: 'Район Пхукета',
      descriptionEn: 'Phuket area',
    });
  }

  // Personas (active) → persona landing.
  for (const p of Object.values(PERSONAS)) {
    if (!p.active) continue;
    entries.push({
      id: `persona-${p.shortCode}`,
      titleRu: p.labelRu,
      titleEn: p.labelEn,
      keywords: kw(p.shortCode, p.slug),
      path: `/for/${p.slug}`,
      section: 'action',
      type: 'action',
      weight: 1,
    });
  }

  // Life situations (active) → /discover/:code.
  for (const s of LIFE_SITUATIONS) {
    if (!s.isActive) continue;
    entries.push({
      id: `situation-${s.code}`,
      titleRu: s.titleRu,
      titleEn: s.titleEn,
      keywords: kw(s.code),
      path: `/discover/${s.code}`,
      section: 'action',
      type: 'action',
      weight: 2,
      descriptionRu: s.descriptionRu,
      descriptionEn: s.descriptionEn,
    });
  }

  // De-dup by destination path, keeping the highest-weight entry (curated nav
  // entries win, so a generic app/cluster never shadows a hand-tuned target).
  const byPath = new Map<string, StaticSearchEntry>();
  for (const e of entries) {
    const existing = byPath.get(e.path);
    if (!existing || (e.weight ?? 0) > (existing.weight ?? 0)) byPath.set(e.path, e);
  }
  return [...byPath.values()];
}

/** Built once at module load — the dataset is fully static. */
const STATIC_INDEX: StaticSearchEntry[] = buildIndex();

/** Total indexed entries — exported for diagnostics / tests. */
export const STATIC_INDEX_SIZE = STATIC_INDEX.length;

/**
 * Search the static index. Synchronous, typo-tolerant, role/persona aware.
 * Returns ranked SearchResult rows ready for the modal (no network).
 */
export function searchStaticIndex(
  query: string,
  ctx: ScoreContext,
  limit = 12,
): SearchResult[] {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  const qNorm = norm(trimmed);
  const qTokens = tokenize(qNorm);

  const hits: Array<{ entry: StaticSearchEntry; score: number }> = [];
  for (const entry of STATIC_INDEX) {
    const score = scoreEntry(entry, qNorm, qTokens, ctx, { fuzzy: true });
    if (score > 0) hits.push({ entry, score });
  }
  hits.sort((a, b) => b.score - a.score);

  return hits.slice(0, limit).map(({ entry }) => ({
    id: entry.id,
    type: entry.type,
    titleEn: entry.titleEn,
    titleRu: entry.titleRu,
    image: null,
    price: null,
    locationEn: null,
    locationRu: null,
    rating: null,
    path: entry.path,
    isCategory: entry.section === 'category',
    isAction: entry.section === 'action',
    descriptionEn: entry.descriptionEn ?? null,
    descriptionRu: entry.descriptionRu ?? null,
  }));
}
