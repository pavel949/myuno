/**
 * M5 H.7 — Home · PersonaPromptBanner (authed)
 *
 * Authenticated user without `detected_persona` should see the nudge banner;
 * dismiss persists for the session; CTA routes to /start/v2 (no `return=`
 * here — banner sends users to vanilla v2).
 */
import { test, expect } from '@playwright/test';
import {
  loginAsSeedAdmin,
  resetSeedAdminPersona,
} from '../../utils/personaTestHelpers';

test.describe('M5 — PersonaPromptBanner (authed home)', () => {
  test.beforeEach(async () => {
    await resetSeedAdminPersona();
  });

  test('renders for user without persona, CTA → /start/v2', async ({ page }) => {
    await loginAsSeedAdmin(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const banner = page.locator('[data-testid="persona-prompt-banner"]');
    await expect(banner).toBeVisible({ timeout: 15000 });

    const cta = page.locator('[data-testid="persona-prompt-cta"]');
    await expect(cta).toHaveAttribute('href', /\/start\/v2$/);

    await cta.click();
    await expect(page).toHaveURL(/\/start\/v2$/, { timeout: 15000 });
  });

  test('dismiss hides the banner for the rest of the session', async ({
    page,
  }) => {
    await loginAsSeedAdmin(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const banner = page.locator('[data-testid="persona-prompt-banner"]');
    await expect(banner).toBeVisible({ timeout: 15000 });

    await page.locator('[data-testid="persona-prompt-dismiss"]').click();
    await expect(banner).toHaveCount(0);

    // Soft reload (same tab) keeps sessionStorage → still hidden.
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(
      page.locator('[data-testid="persona-prompt-banner"]'),
    ).toHaveCount(0);
  });
});
