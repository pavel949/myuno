import { test as base, expect } from '@playwright/test';
import { AuthPage } from '../pages/AuthPage';

// Test user credentials for E2E tests
export const TEST_USER = {
  email: 'e2e-test@myuno.app',
  password: 'TestPassword123!',
  pin: '123456',
};

// Extended test fixture with authentication helpers
export const test = base.extend<{
  authPage: AuthPage;
  authenticatedPage: AuthPage;
}>({
  authPage: async ({ page }, use) => {
    const authPage = new AuthPage(page);
    await use(authPage);
  },
  authenticatedPage: async ({ page }, use) => {
    const authPage = new AuthPage(page);
    await authPage.goto();
    await authPage.login(TEST_USER.email, TEST_USER.password);
    await page.waitForURL('/');
    await use(authPage);
  },
});

export { expect };
