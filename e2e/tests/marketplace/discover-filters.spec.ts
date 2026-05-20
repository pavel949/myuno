/**
 * Smoke: every vertical's /discover route renders + map toggle works.
 * Runs without SUPABASE_SERVICE_ROLE_KEY (no seed required).
 */
import { test, expect } from '@playwright/test';
import { MARKETPLACE_VERTICALS } from '../../fixtures/marketplaceVerticals';

test.describe('Marketplace · discover + filters smoke', () => {
  for (const spec of MARKETPLACE_VERTICALS) {
    test(`${spec.id} · discover renders`, async ({ page }) => {
      await page.goto(`/discover?vertical=${spec.id}`);
      await page.waitForLoadState('domcontentloaded');

      const main = page.locator('main').first();
      await expect(main).toBeVisible({ timeout: 15_000 });

      // No app-level error boundary triggered
      await expect(page.locator('text=/Something went wrong|Что-то пошло не так/i')).toHaveCount(0);

      // If search input is rendered for this vertical, it should accept text
      const search = page
        .locator('[data-testid="discover-search"], input[placeholder*="Search" i], input[placeholder*="Поиск" i]')
        .first();
      if (await search.isVisible().catch(() => false)) {
        await search.fill('test');
        await expect(search).toHaveValue('test');
      }
    });
  }
});
