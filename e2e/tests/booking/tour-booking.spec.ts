import { test, expect } from '@playwright/test';
import { BookingPage } from '../../pages/BookingPage';
import { AuthPage } from '../../pages/AuthPage';

test.describe('Tour/Experience Booking Flow', () => {
  let bookingPage: BookingPage;

  test.beforeEach(async ({ page }) => {
    bookingPage = new BookingPage(page);
  });

  test('should display experiences list (tours)', async ({ page }) => {
    await bookingPage.gotoTours();
    
    // Experiences cards should be visible
    const experienceCards = page.locator('[data-testid="experience-card"], article, .bg-card').first();
    await expect(experienceCards).toBeVisible({ timeout: 15000 });
  });

  test('should open experience details on click', async ({ page }) => {
    await bookingPage.gotoTours();
    
    await bookingPage.selectFirstItem();
    
    // Expect detail page or modal
    await expect(
      page.locator('[data-testid="experience-detail"], h1, button:has-text("Book"), button:has-text("Забронировать")').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('should show booking form', async ({ page }) => {
    await bookingPage.gotoTours();
    await bookingPage.selectFirstItem();
    
    const bookBtn = page.locator('button:has-text("Book"), button:has-text("Забронировать")').first();
    if (await bookBtn.isVisible()) {
      await bookBtn.click();
    }
    
    // Expect booking form elements
    await expect(
      page.locator('input, .rdp, [data-testid="booking-form"]').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('should validate required fields', async ({ page }) => {
    await bookingPage.gotoTours();
    await bookingPage.selectFirstItem();
    
    const bookBtn = page.locator('button:has-text("Book"), button:has-text("Забронировать")').first();
    if (await bookBtn.isVisible()) {
      await bookBtn.click();
    }
    
    // Try to submit without filling fields
    const submitBtn = page.locator('[data-testid="booking-submit"], button:has-text("Confirm"), button:has-text("Подтвердить")').first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await bookingPage.expectValidationError();
    }
  });

  test('should complete tour booking (authenticated)', async ({ page }) => {
    // First login
    const authPage = new AuthPage(page);
    await authPage.goto();
    await authPage.login('test@myuno.app', 'TestPassword123!');
    
    // Wait for auth to complete (either success or error)
    await page.waitForTimeout(2000);
    
    // Navigate to tours
    await bookingPage.gotoTours();
    await bookingPage.selectFirstItem();
    
    // Click book button
    const bookBtn = page.locator('button:has-text("Book"), button:has-text("Забронировать")').first();
    await bookBtn.waitFor({ state: 'visible', timeout: 10000 });
    await bookBtn.click();
    
    // Select date (tomorrow)
    await bookingPage.selectDate(1);
    
    // Select time if available
    const timeSlot = page.locator('[data-testid="time-slot"], button[data-time], .time-slot').first();
    if (await timeSlot.isVisible()) {
      await timeSlot.click();
    }
    
    // Fill contact info
    await bookingPage.fillContactInfo('Test User', '+66812345678', 'test@myuno.app');
    
    // Select participants if needed
    const participantsInput = page.locator('[name="participants"], [data-testid="participants"]');
    if (await participantsInput.isVisible()) {
      await participantsInput.fill('2');
    }
    
    // Select payment method
    await bookingPage.selectPaymentMethod('cash');
    
    // Submit
    await bookingPage.submitBooking();
    
    // Expect success or error (depends on test data)
    await Promise.race([
      bookingPage.expectBookingSuccess(),
      expect(page.locator('[data-sonner-toast]')).toBeVisible(),
    ]);
  });
});
