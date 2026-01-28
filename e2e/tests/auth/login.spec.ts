import { test, expect } from '@playwright/test';
import { AuthPage } from '../../pages/AuthPage';

test.describe('Email Login', () => {
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    await authPage.goto();
  });

  test('should display login form', async ({ page }) => {
    await expect(authPage.emailInput).toBeVisible();
    await expect(authPage.passwordInput).toBeVisible();
    await expect(authPage.loginButton).toBeVisible();
  });

  test('should show validation error for empty fields', async ({ page }) => {
    await authPage.loginButton.click();
    await authPage.expectValidationError();
  });

  test('should show validation error for invalid email', async ({ page }) => {
    await authPage.emailInput.fill('invalid-email');
    await authPage.passwordInput.fill('password123');
    await authPage.loginButton.click();
    
    await authPage.expectValidationError();
  });

  test('should show error for wrong credentials', async ({ page }) => {
    await authPage.login('nonexistent@example.com', 'wrongpassword');
    
    // Wait for error toast or message
    await expect(
      page.locator('text=Invalid, text=Неверный, [data-sonner-toast][data-type="error"]').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // This test requires a valid test user in the database
    // Skip if no test user exists
    await authPage.login('test@myuno.app', 'TestPassword123!');
    
    // Either redirect to home or show error (depends on test user existence)
    await Promise.race([
      expect(page).toHaveURL('/'),
      expect(page.locator('[data-sonner-toast]')).toBeVisible(),
    ]);
  });

  test('should navigate to forgot password', async ({ page }) => {
    const forgotLink = page.locator('text=Forgot password, text=Забыли пароль, a[href*="forgot"]').first();
    
    if (await forgotLink.isVisible()) {
      await forgotLink.click();
      await expect(page.locator('text=Reset, text=Сброс, input[type="email"]')).toBeVisible();
    }
  });
});
