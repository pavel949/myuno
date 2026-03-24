/**
 * Fast smoke tests — home, public routes, no auth (roadmap Phase A4).
 * Run: npm run test:e2e -- e2e/tests/smoke
 */
import { test, expect } from '@playwright/test';

test.describe('Platform smoke', () => {
  test('home page responds', async ({ page }) => {
    const res = await page.goto('/');
    expect(res?.ok() ?? false).toBeTruthy();
    await expect(page.locator('body')).toBeVisible();
  });

  test('auth route loads shell', async ({ page }) => {
    await page.goto('/auth');
    await expect(page.locator('body')).toBeVisible();
    const hasForm = await page.locator('input[type="email"], input[type="password"], form').first().isVisible().catch(() => false);
    const hasHeading = await page.getByRole('heading').first().isVisible().catch(() => false);
    expect(hasForm || hasHeading).toBeTruthy();
  });

  test('discover route loads', async ({ page }) => {
    await page.goto('/discover');
    await expect(page.locator('body')).toBeVisible({ timeout: 15000 });
  });
});
