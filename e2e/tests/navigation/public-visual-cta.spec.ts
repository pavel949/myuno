import { expect, test } from '@playwright/test';

// Guest-only, read-only visual smoke. No reservation, payment or intake is submitted.
const publicRoutes = [
  '/',
  '/property/rent',
  '/property/offplan',
  '/experiences',
  '/services',
  '/transport/airport-transfer',
  '/yachts',
] as const;

for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
  test.describe(`public visual smoke ${viewport.width}px`, () => {
    test.use({ viewport });
    for (const path of publicRoutes) {
      test(`${path} has no document-level horizontal overflow`, async ({ page }) => {
        await page.goto(path, { waitUntil: 'domcontentloaded' });
        await expect(page.locator('#root')).toBeVisible();
        const dimensions = await page.evaluate(() => ({
          viewport: window.innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
        }));
        expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.viewport + 1);
      });
    }
  });
}

test.describe('mobile primary-action clearance', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('rental search CTA is never covered by the unified chat launcher', async ({ page }) => {
    await page.goto('/property/rent', { waitUntil: 'domcontentloaded' });
    const target = page.locator('.rental-search-section [data-chat-occlusion-target]').first();
    await expect(target).toBeVisible();
    await target.scrollIntoViewIfNeeded();
    await expect(page.locator('[data-global-chat-launcher]')).toHaveCount(0);
    const nav = page.locator('.myuno-bottom-nav');
    await expect(nav).toBeVisible();
  });

  test('homepage search CTA is never covered by the unified chat launcher', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const target = page.locator('.home-reference-search [data-chat-occlusion-target]').first();
    await expect(target).toBeVisible();
    await target.scrollIntoViewIfNeeded();
    await expect(page.locator('[data-global-chat-launcher]')).toHaveCount(0);
  });

  test('chat returns after the rental search CTA leaves the viewport', async ({ page }) => {
    await page.goto('/property/rent', { waitUntil: 'domcontentloaded' });
    const target = page.locator('.rental-search-section [data-chat-occlusion-target]').first();
    await target.scrollIntoViewIfNeeded();
    await expect(page.locator('[data-global-chat-launcher]')).toHaveCount(0);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect(page.locator('[data-global-chat-launcher]')).toBeVisible();
  });
});

test('desktop does not suppress the chat launcher', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/property/rent', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-global-chat-launcher]')).toBeVisible();
});
