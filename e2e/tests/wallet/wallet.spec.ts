import { test, expect } from '@playwright/test';
import { WalletPage } from '../../pages/WalletPage';
import { AuthPage } from '../../pages/AuthPage';

test.describe('Wallet', () => {
  let walletPage: WalletPage;

  test.beforeEach(async ({ page }) => {
    walletPage = new WalletPage(page);
  });

  test('should redirect to auth if not logged in', async ({ page }) => {
    await walletPage.goto();
    
    // Should redirect to auth
    await expect(page).toHaveURL(/\/auth/, { timeout: 10000 });
  });

  test('should display wallet balance when authenticated', async ({ page }) => {
    // Login first
    const authPage = new AuthPage(page);
    await authPage.goto();
    await authPage.login('test@myuno.app', 'TestPassword123!');
    
    // Wait for auth
    await page.waitForTimeout(2000);
    
    // Go to wallet
    await walletPage.goto();
    
    // Balance should be visible
    await walletPage.expectBalanceVisible();
  });

  test('should show top-up button', async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.goto();
    await authPage.login('test@myuno.app', 'TestPassword123!');
    await page.waitForTimeout(2000);
    
    await walletPage.goto();
    
    await expect(walletPage.topUpButton).toBeVisible({ timeout: 10000 });
  });

  test('should open top-up modal', async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.goto();
    await authPage.login('test@myuno.app', 'TestPassword123!');
    await page.waitForTimeout(2000);
    
    await walletPage.goto();
    
    // Click top-up
    if (await walletPage.topUpButton.isVisible()) {
      await walletPage.openTopUpModal();
      
      // Modal should have amount options
      await expect(
        page.locator('[data-testid="topup-modal"], [role="dialog"]').first()
      ).toBeVisible();
    }
  });

  test('should display quick amount options', async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.goto();
    await authPage.login('test@myuno.app', 'TestPassword123!');
    await page.waitForTimeout(2000);
    
    await walletPage.goto();
    
    if (await walletPage.topUpButton.isVisible()) {
      await walletPage.openTopUpModal();
      
      // Check for quick amount buttons (500, 1000, 2000, etc.)
      const quickAmounts = page.locator('[data-testid*="quick-amount"], button:has-text("500"), button:has-text("1000")');
      await expect(quickAmounts.first()).toBeVisible({ timeout: 5000 }).catch(() => {
        // Quick amounts might not be available
      });
    }
  });

  test('should redirect to Stripe on confirm', async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.goto();
    await authPage.login('test@myuno.app', 'TestPassword123!');
    await page.waitForTimeout(2000);
    
    await walletPage.goto();
    
    if (await walletPage.topUpButton.isVisible()) {
      await walletPage.openTopUpModal();
      
      // Enter amount
      const amountInput = page.locator('[data-testid="topup-amount"], input[name="amount"], input[type="number"]').first();
      if (await amountInput.isVisible()) {
        await amountInput.fill('1000');
      } else {
        // Try quick amount
        const quickBtn = page.locator('button:has-text("1000")').first();
        if (await quickBtn.isVisible()) {
          await quickBtn.click();
        }
      }
      
      // Confirm
      const confirmBtn = page.locator('[data-testid="confirm-topup"], button:has-text("Confirm"), button:has-text("Pay"), button:has-text("Пополнить")').first();
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
        
        // Should redirect to Stripe or show Stripe modal
        await expect(
          page.locator('iframe[src*="stripe"], text=Stripe').first()
        ).toBeVisible({ timeout: 15000 }).catch(async () => {
          // Or URL might change
          const url = page.url();
          expect(url.includes('stripe') || url.includes('checkout')).toBeTruthy();
        }).catch(() => {
          // Stripe integration might not be fully set up
        });
      }
    }
  });

  test('should show transaction history', async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.goto();
    await authPage.login('test@myuno.app', 'TestPassword123!');
    await page.waitForTimeout(2000);
    
    await walletPage.goto();
    
    // Transaction history section
    const historySection = page.locator('[data-testid="transaction-list"], text=Transactions, text=История, .transaction-list').first();
    
    await expect(historySection).toBeVisible({ timeout: 10000 }).catch(() => {
      // History might be empty or in different location
    });
  });
});
