import { Page, Locator, expect } from '@playwright/test';

export class VendorPage {
  readonly page: Page;
  readonly dashboardTitle: Locator;
  readonly kpiCards: Locator;
  readonly ordersList: Locator;
  readonly revenueCard: Locator;
  readonly ordersCard: Locator;
  readonly ratingsCard: Locator;
  readonly onboardingForm: Locator;
  readonly sidebarNav: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dashboardTitle = page.locator('h1:has-text("Dashboard"), h1:has-text("Панель")');
    this.kpiCards = page.locator('[data-testid="kpi-card"], .kpi-card');
    this.ordersList = page.locator('[data-testid="orders-list"], .orders-list');
    this.revenueCard = page.locator('[data-testid="revenue-kpi"], :has-text("Revenue"):has-text("฿")');
    this.ordersCard = page.locator('[data-testid="orders-kpi"], :has-text("Orders")');
    this.ratingsCard = page.locator('[data-testid="ratings-kpi"], :has-text("Rating")');
    this.onboardingForm = page.locator('[data-testid="onboarding-form"], form');
    this.sidebarNav = page.locator('[data-testid="vendor-sidebar"], aside');
  }

  async gotoDashboard() {
    await this.page.goto('/vendor');
    await this.page.waitForLoadState('networkidle');
  }

  async gotoOnboarding() {
    await this.page.goto('/vendor/onboarding');
    await this.page.waitForLoadState('networkidle');
  }

  async expectRedirectToAuth() {
    await expect(this.page).toHaveURL(/\/auth/, { timeout: 10000 });
  }

  async expectRedirectToOnboarding() {
    await expect(this.page).toHaveURL(/\/vendor\/onboarding/, { timeout: 10000 });
  }

  async expectDashboardLoaded() {
    await expect(this.dashboardTitle).toBeVisible({ timeout: 10000 });
  }

  async expectKPIsVisible() {
    await expect(this.kpiCards.first()).toBeVisible({ timeout: 10000 });
  }

  async expectOrdersListVisible() {
    await expect(this.ordersList).toBeVisible({ timeout: 10000 });
  }

  async getRevenueValue(): Promise<string> {
    await this.revenueCard.waitFor({ state: 'visible' });
    return await this.revenueCard.textContent() || '0';
  }
}
