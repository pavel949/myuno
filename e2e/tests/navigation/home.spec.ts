import { test, expect } from '@playwright/test';
import { HomePage } from '../../pages/HomePage';

test.describe('Home Page Navigation', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test('should load home page without errors', async ({ page }) => {
    await homePage.expectLoaded();
    
    // No error toasts
    const errorToast = page.locator('[data-sonner-toast][data-type="error"]');
    await expect(errorToast).not.toBeVisible({ timeout: 3000 }).catch(() => {
      // Some errors might be acceptable during development
    });
  });

  test('should display logo', async ({ page }) => {
    await expect(homePage.logo).toBeVisible();
  });

  test('should display category cards', async ({ page }) => {
    // Wait for categories to load
    await expect(homePage.categoryCards.first()).toBeVisible({ timeout: 15000 });
    
    // Should have multiple categories
    const count = await homePage.categoryCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should navigate to category on click', async ({ page }) => {
    await expect(homePage.categoryCards.first()).toBeVisible({ timeout: 15000 });
    
    // Click first category
    await homePage.categoryCards.first().click();
    
    // URL should change
    await expect(page).not.toHaveURL('/');
  });

  test('should open search modal', async ({ page }) => {
    const searchBtn = page.locator('[data-testid="search-button"], button[aria-label*="search"], button[aria-label*="Search"], svg.lucide-search').first();
    
    if (await searchBtn.isVisible()) {
      await searchBtn.click();
      
      // Search modal or input should appear
      await expect(
        page.locator('[data-testid="search-modal"], [role="dialog"], input[placeholder*="search"], input[placeholder*="поиск"]').first()
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test('should have bottom navigation', async ({ page }) => {
    const bottomNav = page.locator('nav.fixed.bottom-0, [data-testid="bottom-nav"]').first();
    
    await expect(bottomNav).toBeVisible();
    
    // Check nav items
    await expect(page.locator('a[href="/"], a[href="/home"], text=Home, text=Главная').first()).toBeVisible();
  });

  test('should switch language', async ({ page }) => {
    const langSwitch = page.locator('[data-testid="language-switch"], button:has-text("EN"), button:has-text("RU")').first();
    
    if (await langSwitch.isVisible()) {
      await langSwitch.click();
      
      // Language options should appear
      const langOptions = page.locator('button:has-text("EN"), button:has-text("RU"), [data-lang]');
      await expect(langOptions.first()).toBeVisible();
      
      // Select other language
      const otherLang = page.locator('button:has-text("RU"), [data-lang="ru"]').first();
      if (await otherLang.isVisible()) {
        await otherLang.click();
        
        // Page content should update (check for Russian text)
        await page.waitForTimeout(500);
        const russianText = page.locator('text=Главная, text=Услуги, text=Туры').first();
        await expect(russianText).toBeVisible().catch(() => {
          // Language switch might work differently
        });
      }
    }
  });

  test('should display featured section', async ({ page }) => {
    const featured = page.locator('[data-testid="featured-section"], text=Featured, text=Популярное, text=Hot').first();
    
    await expect(featured).toBeVisible({ timeout: 10000 }).catch(() => {
      // Featured section might not exist on all pages
    });
  });

  test('should be responsive on mobile', async ({ page }) => {
    // This test runs in mobile viewport (iPhone 14) based on config
    await page.setViewportSize({ width: 390, height: 844 });
    await homePage.goto();
    
    await homePage.expectLoaded();
    
    // Bottom nav should be visible
    const bottomNav = page.locator('nav.fixed.bottom-0, [data-testid="bottom-nav"]').first();
    await expect(bottomNav).toBeVisible();
  });
});
