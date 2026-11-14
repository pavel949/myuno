import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(__dirname, '../../..');
const sitemap = readFileSync(resolve(root, 'public/sitemap-static.xml'), 'utf8');
const developersPage = readFileSync(resolve(root, 'src/pages/property/DevelopersIndex.tsx'), 'utf8');
const companyPage = readFileSync(resolve(root, 'src/pages/property/ManagementCompanyProfile.tsx'), 'utf8');

const redirectTargets = [
  '/property/projects',
  '/property/invest',
  '/newbuilds/projects',
  '/newbuilds/developers',
];

describe('public property SEO contract', () => {
  it('mounts route-specific SEOHead on both public property routes', () => {
    expect(developersPage).toContain("import { SEOHead } from '@/components/seo';");
    expect(developersPage).toContain('url={`https://www.myuno.app${APP_ROUTES.DEVELOPERS}`}');
    expect(companyPage).toContain("import { SEOHead } from '@/components/seo';");
    expect(companyPage).toContain('https://www.myuno.app/company/${encodeURIComponent(company.slug)}');
  });

  it('does not publish known redirect targets and keeps canonical replacements unique', () => {
    for (const target of redirectTargets) {
      expect(sitemap).not.toContain(`https://www.myuno.app${target}`);
    }

    const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
    expect(new Set(locs).size).toBe(locs.length);
    expect(locs).toContain('https://www.myuno.app/property/offplan');
    expect(locs).toContain('https://www.myuno.app/property/developers');
  });
});
