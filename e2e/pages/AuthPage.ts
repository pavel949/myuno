import { Page, Locator, expect } from '@playwright/test';

export class AuthPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly signupButton: Locator;
  readonly pinInput: Locator;
  readonly forgotPasswordLink: Locator;
  readonly errorMessage: Locator;
  readonly successToast: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.loginButton = page.locator('[data-testid="login-button"], button:has-text("Login"), button:has-text("Войти")');
    this.signupButton = page.locator('[data-testid="signup-button"], button:has-text("Sign up"), button:has-text("Регистрация")');
    this.pinInput = page.locator('[data-testid="pin-input"]');
    this.forgotPasswordLink = page.locator('text=Forgot password, text=Забыли пароль');
    this.errorMessage = page.locator('[role="alert"], .text-destructive');
    this.successToast = page.locator('[data-sonner-toast]');
  }

  async goto() {
    await this.page.goto('/auth');
    await this.page.waitForLoadState('networkidle');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async signup(email: string, password: string) {
    // Switch to signup tab if needed
    const signupTab = this.page.locator('button:has-text("Sign up"), button:has-text("Регистрация")').first();
    if (await signupTab.isVisible()) {
      await signupTab.click();
    }
    
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    
    // Confirm password if field exists
    const confirmPassword = this.page.locator('input[name="confirmPassword"], input[placeholder*="confirm"]');
    if (await confirmPassword.isVisible()) {
      await confirmPassword.fill(password);
    }
    
    await this.signupButton.click();
  }

  async enterPin(pin: string) {
    // Wait for PIN input to be visible
    await this.pinInput.waitFor({ state: 'visible', timeout: 5000 });
    
    // Click on PIN pad buttons
    for (const digit of pin) {
      const button = this.page.locator(`[data-testid="pin-input"] button:has-text("${digit}")`);
      await button.click();
    }
  }

  async expectLoginSuccess() {
    await expect(this.page).toHaveURL('/', { timeout: 10000 });
  }

  async expectValidationError() {
    await expect(this.errorMessage).toBeVisible({ timeout: 5000 });
  }

  async expectToast(message: string) {
    await expect(this.successToast.filter({ hasText: message })).toBeVisible({ timeout: 5000 });
  }
}
