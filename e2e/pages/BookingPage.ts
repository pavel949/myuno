import { Page, Locator, expect } from '@playwright/test';

export class BookingPage {
  readonly page: Page;
  readonly bookButton: Locator;
  readonly dateSelector: Locator;
  readonly timeSlots: Locator;
  readonly nameInput: Locator;
  readonly phoneInput: Locator;
  readonly emailInput: Locator;
  readonly participantsSelector: Locator;
  readonly paymentMethods: Locator;
  readonly submitButton: Locator;
  readonly confirmationMessage: Locator;
  readonly priceDisplay: Locator;

  constructor(page: Page) {
    this.page = page;
    this.bookButton = page.locator('button:has-text("Book"), button:has-text("Забронировать")');
    this.dateSelector = page.locator('[data-testid="date-picker"], .rdp');
    this.timeSlots = page.locator('[data-testid="time-slot"], button[data-time]');
    this.nameInput = page.locator('input[name="name"], input[placeholder*="name"], input[placeholder*="имя"]');
    this.phoneInput = page.locator('input[name="phone"], input[type="tel"]');
    this.emailInput = page.locator('input[name="email"], input[type="email"]');
    this.participantsSelector = page.locator('[data-testid="participants"], [name="participants"]');
    this.paymentMethods = page.locator('[data-testid="payment-method"]');
    this.submitButton = page.locator('[data-testid="booking-submit"], button:has-text("Confirm"), button:has-text("Подтвердить")');
    this.confirmationMessage = page.locator('text=Booking Confirmed, text=Бронирование подтверждено, [data-testid="booking-success"]');
    this.priceDisplay = page.locator('[data-testid="total-price"], .total-price');
  }

  async gotoTours() {
    await this.page.goto('/tours');
    await this.page.waitForLoadState('networkidle');
  }

  async gotoYachts() {
    await this.page.goto('/yachts');
    await this.page.waitForLoadState('networkidle');
  }

  async selectFirstItem() {
    const firstCard = this.page.locator('[data-testid="tour-card"], [data-testid="yacht-card"], .tour-card, .yacht-card').first();
    await firstCard.click();
  }

  async selectDate(daysFromNow: number = 1) {
    // Click on a date that is X days from now
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysFromNow);
    const day = targetDate.getDate().toString();
    
    await this.dateSelector.waitFor({ state: 'visible' });
    const dateButton = this.page.locator(`.rdp-day:has-text("${day}"):not(.rdp-day_disabled)`).first();
    await dateButton.click();
  }

  async selectTimeSlot(time: string = '09:00') {
    const timeSlot = this.page.locator(`[data-testid="time-slot"]:has-text("${time}"), button:has-text("${time}")`).first();
    if (await timeSlot.isVisible()) {
      await timeSlot.click();
    }
  }

  async fillContactInfo(name: string, phone: string, email?: string) {
    await this.nameInput.fill(name);
    await this.phoneInput.fill(phone);
    if (email && await this.emailInput.isVisible()) {
      await this.emailInput.fill(email);
    }
  }

  async setParticipants(count: number) {
    const input = this.participantsSelector;
    if (await input.isVisible()) {
      await input.fill(count.toString());
    }
  }

  async selectPaymentMethod(method: 'cash' | 'card' | 'wallet') {
    const methodButton = this.page.locator(`[data-testid="payment-${method}"], button:has-text("${method}"), label:has-text("${method}")`).first();
    if (await methodButton.isVisible()) {
      await methodButton.click();
    }
  }

  async submitBooking() {
    await this.submitButton.click();
  }

  async expectBookingSuccess() {
    await expect(this.confirmationMessage).toBeVisible({ timeout: 15000 });
  }

  async expectValidationError() {
    const error = this.page.locator('[role="alert"], .text-destructive, [data-testid="validation-error"]');
    await expect(error).toBeVisible({ timeout: 5000 });
  }
}
