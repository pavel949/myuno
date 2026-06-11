/**
 * Regression-guard: `/discover` — единственная каноническая «дверь» в каталог.
 *
 * Любая попытка снова сделать `/catalog`, `/categories` или `/navigator`
 * полноценным маршрутом (рендерить страницу вместо `<Navigate>`) должна
 * упасть на этом тесте — это часть Wave-1 IA cleanup (2026-06).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROUTES_FILE = join(process.cwd(), 'src/components/layout/AnimatedRoutes.tsx');

describe('IA Wave-1 — Discover canonicalisation', () => {
  const source = readFileSync(ROUTES_FILE, 'utf8');

  const aliases: Array<{ path: string; matcher: RegExp }> = [
    { path: '/catalog', matcher: /path="\/catalog"\s+element=\{<Navigate\s+to=\{APP_ROUTES\.DISCOVER\}/ },
    { path: '/categories', matcher: /path="\/categories"\s+element=\{<Navigate\s+to=\{APP_ROUTES\.DISCOVER\}/ },
    { path: '/navigator', matcher: /path=\{APP_ROUTES\.NAVIGATOR\}\s+element=\{<Navigate\s+to=\{APP_ROUTES\.DISCOVER\}/ },
  ];

  for (const { path, matcher } of aliases) {
    it(`${path} must redirect to /discover (not render its own page)`, () => {
      expect(source).toMatch(matcher);
    });
  }
});
