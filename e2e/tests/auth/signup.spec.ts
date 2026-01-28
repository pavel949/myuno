import { test, expect } from '@playwright/test';
import { AuthPage } from '../../pages/AuthPage';

test.describe('Signup Flow', () => {
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    await authPage.goto();
  });

  test('should display signup form', async ({ page }) => {
    // Switch to signup tab
    const signupTab = page.locator('button:has-text("Sign up"), button:has-text("Регистрация"), [data-value="signup"]').first();
    
    if (await signupTab.isVisible()) {
      await signupTab.click();
    }
    
    await expect(authPage.emailInput).toBeVisible();
    await expect(authPage.passwordInput).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    const signupTab = page.locator('button:has-text("Sign up"), button:has-text("Регистрация")').first();
    if (await signupTab.isVisible()) {
      await signupTab.click();
    }

    await authPage.emailInput.fill('invalid-email');
    await authPage.passwordInput.fill('Password123!');
    
    const submitBtn = page.locator('[data-testid="signup-button"], button[type="submit"]:has-text("Sign"), button[type="submit"]:has-text("Зарегистрироваться")').first();
    await submitBtn.click();
    
    await authPage.expectValidationError();
  });

  test('should validate password strength', async ({ page }) => {
    const signupTab = page.locator('button:has-text("Sign up"), button:has-text("Регистрация")').first();
    if (await signupTab.isVisible()) {
      await signupTab.click();
    }

    await authPage.emailInput.fill('test@example.com');
    await authPage.passwordInput.fill('weak');
    
    const submitBtn = page.locator('[data-testid="signup-button"], button[type="submit"]:has-text("Sign"), button[type="submit"]:has-text("Зарегистрироваться")').first();
    await submitBtn.click();
    
    // Expect password validation error
    await expect(
      page.locator('text=password, text=пароль, [role="alert"]').first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('should show success message on valid signup', async ({ page }) => {
    const signupTab = page.locator('button:has-text("Sign up"), button:has-text("Регистрация")').first();
    if (await signupTab.isVisible()) {
      await signupTab.click();
    }

    // Generate unique email to avoid conflicts
    const uniqueEmail = `e2e-test-${Date.now()}@myuno.app`;
    
    await authPage.emailInput.fill(uniqueEmail);
    await authPage.passwordInput.fill('SecurePassword123!');
    
    const submitBtn = page.locator('[data-testid="signup-button"], button[type="submit"]:has-text("Sign"), button[type="submit"]:has-text("Зарегистрироваться")').first();
    await submitBtn.click();
    
    // Expect either success redirect or confirmation message
    await Promise.race([
      expect(page).toHaveURL('/'),
      expect(page.locator('[data-sonner-toast], text=email, text=confirm')).toBeVisible(),
    ]);
  });
});
