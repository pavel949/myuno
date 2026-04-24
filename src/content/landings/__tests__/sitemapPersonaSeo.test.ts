/**
 * Sitemap × Persona Landings — SEO contract check.
 *
 * Verifies that for every live persona landing:
 *   1. The slug appears in `public/sitemap-landings.xml` exactly once.
 *   2. The sitemap entry declares hreflang alternates for `ru`, `en`, and `x-default`.
 *   3. The sitemap canonical `<loc>` matches the landing's `seo.canonicalPath`.
 *   4. The landing has a non-empty `metaDescription` for both `ru` and `en`,
 *      respecting the ≤160 character SEO limit.
 *   5. `seo.hreflangAlternates` covers both `ru` and `en` languages.
 *
 * This is the runtime gate referenced by the M6 · B.9 sitemap workflow:
 * if a new persona is promoted to `live` without sitemap + hreflang + meta
 * description, this test fails.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  PERSONA_LANDINGS,
  LIVE_PERSONA_SLUGS,
} from '../personaLandings';

const SITEMAP_PATH = resolve(__dirname, '../../../../public/sitemap-landings.xml');
const SITEMAP_XML = readFileSync(SITEMAP_PATH, 'utf-8');

const ORIGIN = 'https://myuno.app';

interface SitemapEntry {
  loc: string;
  hreflangs: Record<string, string>;
}

/**
 * Parse `<url>…</url>` blocks from the sitemap into a slug→entry map for
 * `/for/:slug` URLs only (persona scope).
 */
function parsePersonaEntries(xml: string): Map<string, SitemapEntry> {
  const map = new Map<string, SitemapEntry>();
  const urlBlockRe = /<url>([\s\S]*?)<\/url>/g;
  let match: RegExpExecArray | null;
  while ((match = urlBlockRe.exec(xml)) !== null) {
    const block = match[1];
    const locMatch = /<loc>([^<]+)<\/loc>/.exec(block);
    if (!locMatch) continue;
    const loc = locMatch[1].trim();
    if (!loc.startsWith(`${ORIGIN}/for/`)) continue;
    const slug = loc.slice(`${ORIGIN}/for/`.length).replace(/\/$/, '');

    const hreflangs: Record<string, string> = {};
    const altRe = /<xhtml:link\s+rel="alternate"\s+hreflang="([^"]+)"\s+href="([^"]+)"\s*\/>/g;
    let alt: RegExpExecArray | null;
    while ((alt = altRe.exec(block)) !== null) {
      hreflangs[alt[1]] = alt[2];
    }
    map.set(slug, { loc, hreflangs });
  }
  return map;
}

const sitemapEntries = parsePersonaEntries(SITEMAP_XML);

describe('sitemap-landings.xml × LIVE_PERSONA_SLUGS', () => {
  it('parses at least one persona entry from the sitemap', () => {
    expect(sitemapEntries.size).toBeGreaterThan(0);
  });

  it('contains an entry for every LIVE_PERSONA_SLUGS slug', () => {
    const missing = LIVE_PERSONA_SLUGS.filter((s) => !sitemapEntries.has(s));
    expect(missing, `Missing /for/* sitemap entries: ${missing.join(', ')}`).toEqual([]);
  });

  it('does not list slugs that are not live (no orphaned/draft entries)', () => {
    const liveSet = new Set<string>(LIVE_PERSONA_SLUGS);
    const orphans = [...sitemapEntries.keys()].filter((s) => !liveSet.has(s));
    expect(orphans, `Orphan sitemap entries (slug not live): ${orphans.join(', ')}`).toEqual([]);
  });
});

describe('sitemap entry × persona SEO', () => {
  for (const slug of LIVE_PERSONA_SLUGS) {
    const landing = PERSONA_LANDINGS.find((l) => l.slug === slug);
    const entry = sitemapEntries.get(slug);

    describe(`/for/${slug}`, () => {
      it('landing config exists and is live with SEO block', () => {
        expect(landing, `No PERSONA_LANDINGS entry for slug "${slug}"`).toBeDefined();
        expect(landing!.status).toBe('live');
        expect(landing!.seo, `Live landing "${slug}" must define seo{}`).toBeDefined();
      });

      it('sitemap <loc> matches landing seo.canonicalPath', () => {
        expect(entry).toBeDefined();
        const expectedLoc = `${ORIGIN}${landing!.seo!.canonicalPath}`;
        expect(entry!.loc).toBe(expectedLoc);
        expect(landing!.seo!.canonicalPath).toBe(`/for/${slug}`);
      });

      it('sitemap declares hreflang ru, en, and x-default', () => {
        expect(entry).toBeDefined();
        expect(entry!.hreflangs.ru, `missing hreflang="ru" for ${slug}`).toBeDefined();
        expect(entry!.hreflangs.en, `missing hreflang="en" for ${slug}`).toBeDefined();
        expect(
          entry!.hreflangs['x-default'],
          `missing hreflang="x-default" for ${slug}`,
        ).toBeDefined();
      });

      it('hreflang URLs are absolute and on the canonical origin', () => {
        for (const [lang, href] of Object.entries(entry!.hreflangs)) {
          expect(href.startsWith(`${ORIGIN}/for/${slug}`), `bad ${lang} href: ${href}`).toBe(true);
        }
      });

      it('landing seo.hreflangAlternates covers both ru and en', () => {
        const langs = new Set(landing!.seo!.hreflangAlternates.map((a) => a.lang));
        expect(langs.has('ru'), `seo.hreflangAlternates missing ru for ${slug}`).toBe(true);
        expect(langs.has('en'), `seo.hreflangAlternates missing en for ${slug}`).toBe(true);
      });

      it('metaDescription is non-empty in both ru and en', () => {
        const { ru, en } = landing!.seo!.metaDescription;
        expect(ru.trim().length, `ru metaDescription is empty for ${slug}`).toBeGreaterThan(0);
        expect(en.trim().length, `en metaDescription is empty for ${slug}`).toBeGreaterThan(0);
      });

      it('metaDescription stays within the 160-char SEO limit', () => {
        const { ru, en } = landing!.seo!.metaDescription;
        expect(ru.length, `ru metaDescription too long for ${slug}`).toBeLessThanOrEqual(160);
        expect(en.length, `en metaDescription too long for ${slug}`).toBeLessThanOrEqual(160);
      });

      it('metaTitle is non-empty in both ru and en (≤60 chars)', () => {
        const { ru, en } = landing!.seo!.metaTitle;
        expect(ru.trim().length).toBeGreaterThan(0);
        expect(en.trim().length).toBeGreaterThan(0);
        expect(ru.length).toBeLessThanOrEqual(60);
        expect(en.length).toBeLessThanOrEqual(60);
      });
    });
  }
});
