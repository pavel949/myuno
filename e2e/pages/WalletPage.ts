import { Page, Locator, expect } from '@playwright/test';

export class WalletPage {
  readonly page: Page;
  readonly balanceDisplay: Locator;
  readonly topUpButton: Locator;
  readonly transactionHistory: Locator;
  readonly topUpModal: Locator;
  readonly amountInput: Locator;
  readonly quickAmounts: Locator;
  readonly confirmTopUp: Locator;

  constructor(page: Page) {
    this.page = page;
    this.balanceDisplay = page.locator('[data-testid="wallet-balance"], .wallet-balance');
    this.topUpButton = page.locator('[data-testid="topup-button"], button:has-text("Top up"), button:has-text("Пополнить")');
    this.transactionHistory = page.locator('[data-testid="transaction-list"], .transaction-list');
    this.topUpModal = page.locator('[data-testid="topup-modal"], [role="dialog"]');
    this.amountInput = page.locator('[data-testid="topup-amount"], input[name="amount"]');
    this.quickAmounts = page.locator('[data-testid="quick-amount"]');
    this.confirmTopUp = page.locator('[data-testid="confirm-topup"], button:has-text("Confirm"), button:has-text("Подтвердить")');
  }

  async goto() {
    await this.page.goto('/wallet');
    await this.page.waitForLoadState('networkidle');
  }

  async expectBalanceVisible() {
    await expect(this.balanceDisplay).toBeVisible({ timeout: 10000 });
  }

  async getBalance(): Promise<string> {
    await this.balanceDisplay.waitFor({ state: 'visible' });
    return await this.balanceDisplay.textContent() || '0';
  }

  async openTopUpModal() {
    await this.topUpButton.click();
    await expect(this.topUpModal).toBeVisible({ timeout: 5000 });
  }

  async selectQuickAmount(amount: number) {
    const quickBtn = this.page.locator(`[data-testid="quick-amount-${amount}"], button:has-text("${amount}")`).first();
    await quickBtn.click();
  }

  async enterCustomAmount(amount: number) {
    await this.amountInput.fill(amount.toString());
  }

  async confirmTopUpAndExpectStripe() {
    await this.confirmTopUp.click();
    // Expect redirect to Stripe or Stripe modal
    await expect(this.page.locator('iframe[src*="stripe"], text=Stripe, [data-testid="stripe-checkout"]').first()).toBeVisible({ timeout: 15000 }).catch(() => {
      // Or URL changed to Stripe
      expect(this.page.url()).toContain('stripe');
    });
  }

  async expectTransactionsLoaded() {
    await expect(this.transactionHistory).toBeVisible({ timeout: 10000 });
  }
}
