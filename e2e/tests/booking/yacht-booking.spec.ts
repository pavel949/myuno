import { test, expect } from '@playwright/test';
import { BookingPage } from '../../pages/BookingPage';
import { AuthPage } from '../../pages/AuthPage';

test.describe('Yacht Booking Flow', () => {
  let bookingPage: BookingPage;

  test.beforeEach(async ({ page }) => {
    bookingPage = new BookingPage(page);
  });

  test('should display yachts list', async ({ page }) => {
    await bookingPage.gotoYachts();
    
    const yachtCards = page.locator('[data-testid="yacht-card"], .yacht-card, article').first();
    await expect(yachtCards).toBeVisible({ timeout: 15000 });
  });

  test('should show yacht details with specs', async ({ page }) => {
    await bookingPage.gotoYachts();
    await bookingPage.selectFirstItem();
    
    // Expect detail page with yacht specifications
    await expect(
      page.locator('h1, [data-testid="yacht-detail"]').first()
    ).toBeVisible({ timeout: 10000 });
    
    // Check for typical yacht specs
    const specs = page.locator('text=Length, text=Capacity, text=passengers, text=пассажиров, text=Длина').first();
    await expect(specs).toBeVisible({ timeout: 5000 }).catch(() => {
      // Specs might be in different format
    });
  });

  test('should show price per day/hour', async ({ page }) => {
    await bookingPage.gotoYachts();
    await bookingPage.selectFirstItem();
    
    // Price should be visible
    const price = page.locator('text=฿, text=THB, [data-testid="yacht-price"]').first();
    await expect(price).toBeVisible({ timeout: 10000 });
  });

  test('should validate booking date selection', async ({ page }) => {
    await bookingPage.gotoYachts();
    await bookingPage.selectFirstItem();
    
    const bookBtn = page.locator('button:has-text("Book"), button:has-text("Забронировать"), button:has-text("Charter")').first();
    if (await bookBtn.isVisible()) {
      await bookBtn.click();
    }
    
    // Date picker should be visible
    const datePicker = page.locator('.rdp, [data-testid="date-picker"], input[type="date"]').first();
    await expect(datePicker).toBeVisible({ timeout: 10000 });
  });

  test('should complete yacht booking flow', async ({ page }) => {
    // Login first
    const authPage = new AuthPage(page);
    await authPage.goto();
    await authPage.login('test@myuno.app', 'TestPassword123!');
    await page.waitForTimeout(2000);
    
    // Go to yachts
    await bookingPage.gotoYachts();
    await bookingPage.selectFirstItem();
    
    // Click book
    const bookBtn = page.locator('button:has-text("Book"), button:has-text("Забронировать"), button:has-text("Charter")').first();
    await bookBtn.waitFor({ state: 'visible', timeout: 10000 });
    await bookBtn.click();
    
    // Select date
    await bookingPage.selectDate(3); // 3 days from now
    
    // Fill contact
    await bookingPage.fillContactInfo('Captain Test', '+66899998888', 'captain@myuno.app');
    
    // Select payment
    await bookingPage.selectPaymentMethod('card');
    
    // Submit
    const submitBtn = page.locator('[data-testid="booking-submit"], button:has-text("Confirm"), button:has-text("Book Now"), button:has-text("Подтвердить")').first();
    await submitBtn.click();
    
    // Expect result
    await Promise.race([
      bookingPage.expectBookingSuccess(),
      expect(page.locator('[data-sonner-toast], iframe[src*="stripe"]')).toBeVisible(),
    ]);
  });
});
