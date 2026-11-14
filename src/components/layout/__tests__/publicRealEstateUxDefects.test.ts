import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('public real-estate UX defects', () => {
  it('keeps the skip-link/main landmark ownership in NavShell', () => {
    const app = source('src/App.tsx');
    const navShell = source('src/components/nav/NavShell.tsx');

    expect(app).not.toContain('id="main-content"');
    expect(app).not.toContain('tabIndex={-1}');
    expect(navShell).toContain('const skipLink =');
    expect(navShell).toContain('<main id={mainId} tabIndex={-1}');
  });

  it('keeps update UI out of the commercial bottom interaction layer', () => {
    const prompt = source('src/components/pwa/PWAUpdatePrompt.tsx');

    expect(prompt).toContain('pointer-events-none fixed');
    expect(prompt).toContain('top-20');
    expect(prompt).toContain('pointer-events-auto bg-background');
    expect(prompt).not.toContain('bottom-20 left-4 right-4 z-[100]');
  });

  it('routes an empty property filter to property search without changing service fallback', () => {
    const favorites = source('src/pages/Favorites.tsx');

    expect(favorites).toContain("filter === 'property' ? APP_ROUTES.PROPERTY_SEARCH : '/discover'");
    expect(favorites).toContain("'No saved properties yet'");
    expect(favorites).toContain("'Search properties'");
    expect(favorites).toContain("'Browse Services'");
  });
});
