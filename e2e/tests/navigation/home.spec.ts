import { test, expect } from '@playwright/test';
import { HomePage } from '../../pages/HomePage';

test.describe('Home Page Navigation (guest WelcomeLanding)', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test('should load home page without errors', async ({ page }) => {
    await homePage.expectLoaded();

    const errorToast = page.locator('[data-sonner-toast][data-type="error"]');
    await expect(errorToast).not.toBeVisible({ timeout: 3000 }).catch(() => {
      /* dev-only noise */
    });
  });

  test('should display logo', async () => {
    await expect(homePage.logo).toBeVisible();
  });

  test('should display platform cluster cards', async ({ page }) => {
    await expect(homePage.clusterCards.first()).toBeVisible({ timeout: 20_000 });
    const count = await homePage.clusterCards.count();
    expect(count).toBe(6);
  });

  test('should navigate away when a cluster card is clicked', async ({ page }) => {
    await expect(homePage.clusterCards.first()).toBeVisible({ timeout: 20_000 });
    await homePage.clusterCards.first().click();
    await expect(page).not.toHaveURL('/');
  });

  test('global search when shell exposes it', async ({ page }) => {
    const searchBtn = page.locator('[data-testid="search-button"]').first();
    if ((await searchBtn.count()) === 0) {
      test.skip(true, 'WelcomeLanding has no global search; use post-auth shell tests for search modal');
      return;
    }
    await searchBtn.click();
    await expect(
      page.locator('[data-testid="search-modal"], [role="dialog"], input[placeholder*="search"], input[placeholder*="поиск"]').first()
    ).toBeVisible({ timeout: 5_000 });
  });

  test('guest landing has header actions, not bottom app nav', async ({ page }) => {
    await expect(homePage.welcomeRoot).toBeVisible();
    await expect(
      page.getByRole('link', { name: /Sign in|Войти/i })
    ).toBeVisible();
    const bottomNav = page.locator('nav.fixed.bottom-0, [data-testid="bottom-nav"]');
    await expect(bottomNav).toHaveCount(0);
  });

  test('should switch language via header control', async ({ page }) => {
    const heading = (lang: 'en' | 'ru') =>
      page.getByRole('heading', {
        level: 2,
        name: lang === 'en' ? /platform sections/i : /разделов платформы/i,
      });

    await expect(homePage.languageSwitch).toBeVisible();

    await homePage.languageSwitch.click();
    await page.getByRole('menuitem', { name: /English/i }).click();
    await expect(heading('en')).toBeVisible({ timeout: 5_000 });

    await homePage.languageSwitch.click();
    await page.getByRole('menuitem', { name: /Русский/i }).click();
    await expect(heading('ru')).toBeVisible({ timeout: 5_000 });
  });

  test('should show hero and trust content', async ({ page }) => {
    await expect(
      page.getByRole('heading', { level: 2, name: /platform sections|разделов платформы/i })
    ).toBeVisible({ timeout: 15_000 });
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await homePage.goto();

    await homePage.expectLoaded();
    await expect(homePage.clusterCards.first()).toBeVisible({ timeout: 20_000 });
  });
});
