/**
 * @module lib/seo/ogImage
 * @description Helpers to build dynamic OG image URLs served by the
 * `og-persona` Supabase edge function via Vercel rewrites:
 *   /og/persona/:slug.svg
 *   /og/area/:slug.svg
 *   /og/cluster/:slug.svg
 *
 * Always returns absolute URLs (canonical origin) so that they work in OG
 * cards regardless of the runtime host (preview, custom domain, etc).
 */
const ORIGIN = 'https://myuno.app';

export type OgLang = 'ru' | 'en';

export interface PersonaOgOptions {
  persona: string;
  area?: string;
  /** Human-readable area name (RU/EN) — improves card readability. */
  areaName?: string;
  lang?: OgLang;
}

export interface AreaOgOptions {
  area: string;
  areaName?: string;
  lang?: OgLang;
}

export interface ClusterOgOptions {
  cluster: string;
  lang?: OgLang;
}

function qs(params: Record<string, string | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v != null && v !== '');
  if (entries.length === 0) return '';
  const u = new URLSearchParams();
  for (const [k, v] of entries) u.set(k, v as string);
  return `?${u.toString()}`;
}

export function buildPersonaOgUrl({ persona, area, areaName, lang }: PersonaOgOptions): string {
  const query = qs({ area, areaName, lang });
  return `${ORIGIN}/og/persona/${persona}.svg${query}`;
}

export function buildAreaOgUrl({ area, areaName, lang }: AreaOgOptions): string {
  const query = qs({ areaName, lang });
  return `${ORIGIN}/og/area/${area}.svg${query}`;
}

export function buildClusterOgUrl({ cluster, lang }: ClusterOgOptions): string {
  const query = qs({ lang });
  return `${ORIGIN}/og/cluster/${cluster}.svg${query}`;
}

/** Standard OG image dimensions emitted by the edge function. */
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;
export const OG_IMAGE_TYPE = 'image/svg+xml';
