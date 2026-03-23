/**
 * Fast smoke tests — home, public routes, no auth (roadmap Phase A4).
 * Run: npm run test:e2e:smoke
 *
 * Uses `domcontentloaded` — SPA may not fire `load` if long-lived requests keep the page busy.
 */
import { test, expect } from '@playwright/test';

test.describe('Platform smoke', () => {
  test.describe.configure({ timeout: 120000 });

  test('home page responds', async ({ page }) => {
    const res = await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    expect(res?.ok() ?? false).toBeTruthy();
    await expect(page.locator('body')).toBeVisible();
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(10);
    // Either full app shell or Coming Soon gate (see App.tsx ComingSoonGate)
    expect(/Coming Soon|myUNO|Discover|Главная|С возвращением/i.test(bodyText)).toBeTruthy();
  });

  test('auth route loads shell', async ({ page }) => {
    await page.goto('/auth', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await expect(page.locator('body')).toBeVisible();
    const hasForm = await page.locator('input[type="email"], input[type="password"], form').first().isVisible().catch(() => false);
    const hasHeading = await page.getByRole('heading').first().isVisible().catch(() => false);
    expect(hasForm || hasHeading).toBeTruthy();
  });

  test('discover route loads', async ({ page }) => {
    await page.goto('/discover', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await expect(page.locator('body')).toBeVisible({ timeout: 30000 });
  });
});
