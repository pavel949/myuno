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

for (const width of [375, 390, 430, 1280]) {
test(`homepage, housing search, detail and inquiry show the same independent Canvas tariffs at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  const unexpected = await isolate(page, { ...property, price_per_night: 3000, tenancy_modes: ['short', 'long'], cover_image: 'http://127.0.0.1:8098/favicon.svg' });
  let expectedRates: string | undefined;
  for (const path of ['/', '/property/browse?mode=rent', `/property/${property.id}?mode=rent`, `/property/${property.id}/inquiry?mode=rent&checkIn=2028-11-10&checkOut=2028-11-12&guests=2`]) {
    await page.goto(path);
    const rates = page.locator('[aria-label="Rental rates"]').first();
    await expect(rates).toBeVisible({ timeout: 60_000 });
    await expect(rates.getByText('per night', { exact: true })).toBeVisible();
    await expect(rates.getByText('per month', { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const text = (await rates.innerText()).replace(/\s+/g, ' ').trim();
    if (expectedRates === undefined) expectedRates = text;
    else expect(text).toBe(expectedRates);
  }
  await expect(page.getByText(/× 2 nights/)).toBeVisible();
  expect(unexpected).toEqual([]);
});

}

test('conflicting nightly sources redirect an inquiry to request-only detail', async ({ page }) => {
  const unexpected = await isolate(page, { ...property, price_period: 'night', price_per_night: 4500, tenancy_modes: ['short'] });
  await page.goto(`/property/${property.id}/inquiry?mode=rent&checkIn=2028-11-10&checkOut=2028-11-12&guests=2`);
  await expect(page).toHaveURL(new RegExp(`/property/${property.id}\\?`), { timeout: 60_000 });
  await expect(page.getByText('Rental rates need confirmation — automatic quote unavailable.', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Confirm and pay' })).toHaveCount(0);
  expect(unexpected).toEqual([]);
});
