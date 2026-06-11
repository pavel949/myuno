/**
 * Regression-guard: список top-level URL зафиксирован.
 *
 * Wave-1 IA cleanup (2026-06): добавлять новые top-level маршруты запрещено
 * (см. Core memory: «Never add new top-level routes — use surface + JTBD tag»).
 * Если действительно нужен новый top-level (legal/SEO requirement), добавьте
 * его в `APPROVED_TOP_LEVEL` ниже и сошлитесь на причину в PR-описании.
 *
 * Тест читает `AnimatedRoutes.tsx` и собирает все маршруты вида `/foo`
 * (один сегмент, kebab-case). Сравнивает с allowlist.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROUTES_FILE = join(process.cwd(), 'src/components/layout/AnimatedRoutes.tsx');

/**
 * Утверждённый список top-level URL (по результату Wave-1 audit, 2026-06).
 * Любое добавление нового URL без обновления этого списка → тест падает.
 */
const APPROVED_TOP_LEVEL = new Set<string>([
  // ── Core / canvases ──
  '/', '/index', '/discover', '/navigator', '/catalog', '/categories',
  '/welcome', '/welcome-landing', '/start', '/onboarding',
  '/auth', '/oauth', '/me', '/account', '/profile', '/wallet',
  '/notifications', '/cart', '/favorites', '/search', '/map',
  '/bookings', '/orders', '/install', '/support', '/about',
  '/contact', '/faq', '/how-it-works', '/demo', '/unsubscribe',
  '/view-history', '/trip-planner', '/sos', '/life',
  // ── Surfaces (content clusters) ──
  '/arrive', '/live', '/manage', '/invest', '/legal', '/build',
  // ── Grandfathered verticals ──
  '/property', '/properties', '/newbuilds', '/offplan', '/complexes',
  '/beauty', '/spa', '/salons', '/medical', '/clinics', '/pharmacy',
  '/babysitter', '/babysitters', '/kids', '/wedding', '/pets',
  '/yachts', '/water', '/gyms', '/transport', '/transfers',
  '/airport-transfer', '/taxi-booking', '/delivery', '/food',
  '/restaurants', '/experiences', '/tours', '/cleaning', '/flowers',
  '/insurance', '/education', '/area', '/services', '/classifieds',
  '/relocate', '/expat', '/nomad', '/info', '/knowledge',
  '/sell', '/list-with-us', '/market', '/microsite', '/tools',
  '/wellness', '/fitness', '/events',
  // ── B2B operator shells ──
  '/owner', '/owner-portal', '/mc', '/manager', '/vendor', '/team',
  '/admin', '/staff', '/capital', '/operate', '/developer-portal',
  '/developers', '/peylaa', '/my-property', '/my-stay', '/guest',
  '/outreach', '/stays',
  // ── Invest sub-hubs (Wave-2 invest IA consolidation) ──
  '/invest-hub',
  // ── Partner / marketing ──
  '/for', '/for-management-companies', '/become-partner',
  '/list-with-us', '/partners', '/pricing', '/referral', '/g-trust',
  // ── Legal / policy ──
  '/terms', '/privacy', '/cookies', '/refund-policy', '/partner-terms',
  '/partner-agreement', '/ip-policy', '/dispute-resolution',
  // ── Misc utility ──
  '/clearview', '/vip', '/account-type',
]);

describe('IA Wave-1 — Top-level URL allowlist', () => {
  const source = readFileSync(ROUTES_FILE, 'utf8');

  // Match path="/foo" where foo is a single segment (no second '/').
  const re = /path="(\/[a-z][a-z0-9-]*)"/g;
  const found = new Set<string>();
  for (const m of source.matchAll(re)) {
    found.add(m[1]);
  }

  it('no top-level URL exists outside the approved allowlist', () => {
    const unknown = Array.from(found).filter((p) => !APPROVED_TOP_LEVEL.has(p)).sort();
    if (unknown.length > 0) {
      // Дружелюбное сообщение в случае падения.
      const msg = [
        '',
        'Found top-level URL(s) not present in APPROVED_TOP_LEVEL:',
        ...unknown.map((u) => `  ${u}`),
        '',
        'Master Taxonomy v1.0 запрещает добавлять новые top-level маршруты.',
        'Если URL действительно необходим — добавьте его в allowlist в',
        'src/test/ia/no-orphan-top-level-routes.test.ts и обоснуйте в PR.',
        '',
      ].join('\n');
      throw new Error(msg);
    }
    expect(unknown).toEqual([]);
  });
});
