/**
 * Multi-actor browser context helpers for guest→partner→admin loops.
 */
import { Browser, BrowserContext, Page } from '@playwright/test';
import { TEST_USERS, type TestUserKey, TEST_PASSWORD } from './testUsers';

export interface ActorSession {
  context: BrowserContext;
  page: Page;
  user: typeof TEST_USERS[TestUserKey];
}

export async function loginAs(
  browser: Browser,
  role: TestUserKey,
  baseURL = 'http://localhost:8099',
): Promise<ActorSession> {
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();
  const user = TEST_USERS[role];

  await page.goto('/auth');
  await page.waitForLoadState('domcontentloaded');

  await page.locator('input[type="email"]').first().fill(user.email);
  await page.locator('input[type="password"]').first().fill(TEST_PASSWORD);
  await Promise.all([
    page.waitForURL((u) => !u.pathname.startsWith('/auth'), { timeout: 20_000 }).catch(() => {}),
    page
      .locator('[data-testid="login-button"], button:has-text("Login"), button:has-text("Войти")')
      .first()
      .click(),
  ]);

  return { context, page, user };
}

export async function closeAll(sessions: ActorSession[]) {
  await Promise.all(sessions.map((s) => s.context.close().catch(() => {})));
}
