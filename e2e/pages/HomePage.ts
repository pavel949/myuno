import { Page, Locator, expect } from '@playwright/test';

/**
 * Guest home is WelcomeLanding (marketing): cluster cards, no app search / bottom shell.
 * Authenticated home is Index (workspace): may include category cards, bottom nav.
 */
export class HomePage {
  readonly page: Page;
  readonly welcomeRoot: Locator;
  readonly logo: Locator;
  readonly searchButton: Locator;
  readonly languageSwitch: Locator;
  readonly categoryCards: Locator;
  readonly clusterCards: Locator;
  readonly featuredSection: Locator;
  readonly bottomNav: Locator;
  readonly profileButton: Locator;
  readonly walletButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.welcomeRoot = page.getByTestId('welcome-landing');
    this.logo = page.getByTestId('logo');
    this.searchButton = page.locator('[data-testid="search-button"], button[aria-label*="search"], button[aria-label*="поиск"]');
    this.languageSwitch = page.locator('[data-testid="language-switch"]');
    this.clusterCards = page.getByTestId('welcome-cluster-card');
    this.categoryCards = page.locator('[data-testid="category-card"], .category-card');
    this.featuredSection = page.locator('[data-testid="featured-section"]');
    this.bottomNav = page.locator('nav[data-testid="bottom-nav"], nav.fixed.bottom-0');
    this.profileButton = page.locator('[data-testid="profile-button"], a[href*="profile"]');
    this.walletButton = page.locator('[data-testid="wallet-button"], a[href*="wallet"]');
  }

  async goto() {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    await Promise.all([
      expect(this.logo).toBeVisible({ timeout: 30_000 }),
      expect(this.welcomeRoot).toBeVisible({ timeout: 30_000 }),
    ]);
  }

  async openSearch() {
    await this.searchButton.click();
    await expect(this.page.locator('[data-testid="search-modal"], [role="dialog"]')).toBeVisible();
  }

  async selectCategory(categoryName: string) {
    const category = this.page.locator(`[data-testid="category-card"]:has-text("${categoryName}"), .category-card:has-text("${categoryName}")`);
    await category.click();
  }

  async switchLanguage(lang: 'en' | 'ru') {
    await this.languageSwitch.click();
    await this.page.locator(`button:has-text("${lang.toUpperCase()}")`).click();
  }

  async navigateToWallet() {
    await this.walletButton.click();
    await expect(this.page).toHaveURL(/\/wallet/);
  }

  async navigateToProfile() {
    await this.profileButton.click();
    await expect(this.page).toHaveURL(/\/profile/);
  }

  async expectLoaded() {
    await Promise.all([
      expect(this.logo).toBeVisible({ timeout: 15_000 }),
      expect(this.welcomeRoot).toBeVisible({ timeout: 15_000 }),
    ]);
  }
}
