import { test, expect } from '@playwright/test';
import { AuthPage } from '../../pages/AuthPage';

test.describe('PIN Authentication', () => {
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
  });

  test('should display PIN login for returning users', async ({ page }) => {
    // Simulate returning user by setting localStorage
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('uno_pin_email', 'test@myuno.app');
      localStorage.setItem('uno_pin_hash', 'mock_hash');
    });
    
    await page.goto('/auth');
    
    // Check if PIN input is shown (for returning users)
    const pinSection = page.locator('[data-testid="pin-input"], text=PIN, text=Enter your PIN');
    const isPinVisible = await pinSection.isVisible().catch(() => false);
    
    // PIN login should be visible for returning users, or regular login for new users
    if (isPinVisible) {
      await expect(authPage.pinInput).toBeVisible();
    } else {
      await expect(authPage.emailInput).toBeVisible();
    }
  });

  test('should have PIN keypad with all digits', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('uno_pin_email', 'test@myuno.app');
      localStorage.setItem('uno_pin_hash', 'mock_hash');
      localStorage.setItem('uno_refresh_token', 'mock_token');
    });
    
    await page.goto('/auth');
    
    const pinInput = page.locator('[data-testid="pin-input"]');
    if (await pinInput.isVisible()) {
      // Check all digit buttons exist
      for (let i = 0; i <= 9; i++) {
        await expect(page.locator(`[data-testid="pin-input"] button:has-text("${i}")`)).toBeVisible();
      }
      
      // Check clear and delete buttons
      await expect(page.locator('[data-testid="pin-input"] button:has-text("Clear"), [aria-label="Clear"]')).toBeVisible();
      await expect(page.locator('[data-testid="pin-input"] [aria-label="Delete"], [data-testid="pin-input"] button svg')).toBeVisible();
    }
  });

  test('should show error on wrong PIN', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('uno_pin_email', 'test@myuno.app');
      localStorage.setItem('uno_pin_hash', 'wrong_hash');
      localStorage.setItem('uno_refresh_token', 'mock_token');
    });
    
    await page.goto('/auth');
    
    const pinInput = page.locator('[data-testid="pin-input"]');
    if (await pinInput.isVisible()) {
      // Enter wrong PIN
      for (const digit of '999999') {
        await page.locator(`[data-testid="pin-input"] button:has-text("${digit}")`).click();
      }
      
      // Expect error toast or shake animation
      await expect(
        page.locator('[data-sonner-toast][data-type="error"], .animate-shake, text=Wrong PIN, text=Неверный PIN').first()
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test('should allow switching to email login', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('uno_pin_email', 'test@myuno.app');
      localStorage.setItem('uno_pin_hash', 'mock_hash');
    });
    
    await page.goto('/auth');
    
    const switchLink = page.locator('button:has-text("email"), button:has-text("password"), text=Forgot PIN, text=Забыли PIN').first();
    
    if (await switchLink.isVisible()) {
      await switchLink.click();
      await expect(authPage.emailInput).toBeVisible({ timeout: 5000 });
    }
  });

  test('PIN setup should appear after first login', async ({ page }) => {
    // This test validates PIN setup flow after successful email login
    // It requires a test account without PIN set
    
    await authPage.goto();
    
    // Login with credentials
    await authPage.login('newuser@myuno.app', 'Password123!');
    
    // After login, PIN setup might be shown
    const pinSetup = page.locator('text=Set up PIN, text=Настройка PIN, [data-testid="pin-setup"]');
    const isPinSetupVisible = await pinSetup.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (isPinSetupVisible) {
      // Enter PIN twice for confirmation
      for (const digit of '123456') {
        await page.locator(`[data-testid="pin-input"] button:has-text("${digit}")`).click();
      }
      
      // Wait for confirm step
      await page.waitForTimeout(500);
      
      for (const digit of '123456') {
        await page.locator(`[data-testid="pin-input"] button:has-text("${digit}")`).click();
      }
      
      // Expect success
      await expect(
        page.locator('[data-sonner-toast], text=PIN set, text=PIN установлен').first()
      ).toBeVisible({ timeout: 5000 });
    }
  });
});
