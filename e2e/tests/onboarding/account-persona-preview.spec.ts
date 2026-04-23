/**
 * M5 H.7 — /account · PersonaDetectionPreview
 *
 * Covers the canonical empty + refine loop for an authenticated user that
 * has never completed canonical onboarding.
 *
 * Pre-conditions:
 *   - Seed user `test-admin@myuno.app` exists (id a0000000…05).
 *   - feature_flag:concierge_routing_v2_canonical is ON in DB.
 *
 * The spec resets the seed user's persona columns first so we always start
 * from the empty state, regardless of previous test runs.
 */
import { test, expect } from '@playwright/test';
import {
  loginAsSeedAdmin,
  resetSeedAdminPersona,
  completeCanonicalOnboarding,
} from '../../utils/personaTestHelpers';

test.describe('M5 — /account PersonaDetectionPreview', () => {
  test.beforeEach(async () => {
    await resetSeedAdminPersona();
  });

  test('empty state renders, CTA routes to /start/v2?return=/account', async ({
    page,
  }) => {
    await loginAsSeedAdmin(page);
    await page.goto('/account');
    await page.waitForLoadState('networkidle');

    const empty = page.locator('[data-testid="persona-preview-empty"]');
    await expect(empty).toBeVisible({ timeout: 15000 });

    const cta = page.locator('[data-testid="persona-preview-cta-start"] a, a[data-testid="persona-preview-cta-start"]').first();
    // Button asChild renders the inner <a>; fall back to any <a> inside.
    const link = (await cta.count())
      ? cta
      : empty.locator('a').first();

    await expect(link).toHaveAttribute(
      'href',
      /\/start\/v2\?return=%2Faccount/,
    );

    await link.click();
    await expect(page).toHaveURL(/\/start\/v2\?return=%2Faccount/, {
      timeout: 15000,
    });
  });

  test('completing onboarding fills the preview card and auto-returns', async ({
    page,
  }) => {
    await loginAsSeedAdmin(page);
    await page.goto('/start/v2?return=/account');
    await page.waitForLoadState('networkidle');

    await completeCanonicalOnboarding(page);

    // Auto-return triggers ~1.8s after result render.
    await page.waitForURL('**/account', { timeout: 10000 });

    const filled = page.locator('[data-testid="persona-preview-filled"]');
    await expect(filled).toBeVisible({ timeout: 15000 });

    const refine = page.locator('[data-testid="persona-preview-cta-refine"] a, a[data-testid="persona-preview-cta-refine"]').first();
    const link = (await refine.count())
      ? refine
      : filled.locator('a').first();
    await expect(link).toHaveAttribute(
      'href',
      /\/start\/v2\?return=%2Faccount/,
    );
  });
});
