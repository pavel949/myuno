import { readFileSync } from 'node:fs';
import { cleanup, render, waitFor } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { afterEach, expect, it, vi } from 'vitest';
import { SEOHead } from './SEOHead';
import LandingSeoHead from './LandingSeoHead';
import { PERSONA_LANDINGS } from '@/content/landings/personaLandings';
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'ru' }) }));
afterEach(() => { cleanup(); document.head.innerHTML = ''; window.history.replaceState({}, '', '/'); });
it('the shared raw HTML cannot canonicalize deep links to home', () => {
  expect(readFileSync('index.html', 'utf8')).not.toMatch(/<link[^>]+rel="canonical"/);
});
it('consolidates ignored language, tracking and filter variants without inventing localized URLs', async () => {
  window.history.replaceState({}, '', '/property/search?lang=en&utm_source=test&mode=rent#results');
  render(<HelmetProvider><SEOHead title="Homes" /></HelmetProvider>);
  await waitFor(() => expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute('href', 'https://www.myuno.app/property/search'));
  expect(document.querySelector('link[hreflang]')).toBeNull();
  expect(document.querySelector('meta[name="robots"]')).toBeNull();
});
it('landing metadata replaces the marked shell description and declares one canonical', async () => {
  document.head.innerHTML = '<meta data-seo-fallback="true" name="description" content="Home" />';
  const landing = PERSONA_LANDINGS.find(row => row.status === 'live' && row.seo)!;
  render(<HelmetProvider><LandingSeoHead landing={landing} type="persona" language="ru" /></HelmetProvider>);
  await waitFor(() => expect(document.querySelectorAll('meta[name="description"]')).toHaveLength(1));
  expect(document.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
  expect(document.querySelector('link[hreflang]')).toBeNull();
});
it('sitemaps omit confirmed redirects, placeholder guides and non-functional language alternates', () => {
  const index = readFileSync('public/sitemap.xml', 'utf8');
  expect(index).not.toContain('<loc>https://www.myuno.app/sitemap-pillars.xml</loc>');
  const xml = readFileSync('public/sitemap-static.xml', 'utf8');
  for (const path of ['/property', '/property/projects', '/property/invest', '/newbuilds/projects', '/newbuilds/developers', '/stays/search']) {
    expect(xml).not.toContain(`<loc>https://www.myuno.app${path}</loc>`);
  }
  expect(xml).toContain('<loc>https://www.myuno.app/property/search</loc>');
  expect(xml).toContain('<loc>https://www.myuno.app/property/offplan</loc>');
  for (const name of ['static', 'landings', 'pillars']) expect(readFileSync(`public/sitemap-${name}.xml`, 'utf8')).not.toContain('?lang=');
});
it('hosting agrees with production www host and leaves canonical offplan routes reachable', () => {
  const config = JSON.parse(readFileSync('vercel.json', 'utf8'));
  expect(config.redirects[0].has[0].value).toBe('myuno.app');
  expect(config.redirects[0].destination).toBe('https://www.myuno.app/:path*');
  expect(config.redirects.some((row: {source: string}) => row.source.startsWith('/property/offplan'))).toBe(false);
});
