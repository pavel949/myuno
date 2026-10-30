import { expect, test } from '@playwright/test';
import { isolate, property } from './fixtures';

test('monthly-only data cannot become a nightly quote through a direct inquiry URL', async ({ page }) => {
  const unexpected = await isolate(page);
  await page.goto(`/property/${property.id}/inquiry?mode=rent&checkIn=2028-11-10&checkOut=2028-11-12&guests=2`);
  await expect(page).toHaveURL(new RegExp(`/property/${property.id}\\?`), { timeout: 60_000 });
  expect(new URL(page.url()).searchParams.get('checkIn')).toBe('2028-11-10');
  expect(unexpected).toEqual([]);
});

test('a valid nightly inquiry uses the same stored strict policy as detail', async ({ page }) => {
  const unexpected = await isolate(page, { ...property, price_period: 'night', price_per_night: 3000, tenancy_modes: ['short'] });
  await page.goto(`/property/${property.id}/inquiry?mode=rent&checkIn=2028-11-10&checkOut=2028-11-12&guests=2`);
  await expect(page.getByText('50% refund up to 7 days before check-in, no refund after', { exact: true })).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText('Non-refundable after booking', { exact: true })).toHaveCount(0);
  expect(unexpected).toEqual([]);
});
