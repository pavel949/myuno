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
    test('homepage opens the catalogue search from the header and keyboard', async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      const searchButton = page.locator('header button[aria-keyshortcuts="Control+K Meta+K"]');
      const direct = await searchButton.isVisible();
      const trigger = direct ? searchButton : page.locator('header .consumer-menu');
      const dialog = page.getByRole('dialog').filter({ has: page.getByRole('searchbox') });
      await trigger.click();
      if (!direct) await page.locator('.consumer-task-search').click();
      await expect(dialog.getByRole('searchbox')).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(trigger).toBeFocused();

      await page.keyboard.press('Control+k');
      await expect(dialog.getByRole('searchbox')).toBeFocused();
      expect(new URL(page.url()).pathname).toBe('/');
    });
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


test.describe('mobile homepage visual contract', () => {
  for (const width of [320, 390, 430]) {
    test(`complete cards and readable service/district grid at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await expect(page.locator('[data-home-visual="mobile-grid-20261122"]')).toBeVisible();
      const dimensions = await page.evaluate(() => ({
        viewport: innerWidth,
        page: document.documentElement.scrollWidth,
      }));
      expect(dimensions.page).toBeLessThanOrEqual(dimensions.viewport + 1);

      const rail = page.locator('.home-properties .home-rail-viewport');
      const firstCard = rail.locator(':scope > *').first();
      if (await firstCard.count()) {
        const widths = await firstCard.evaluate((card) => ({
          card: card.getBoundingClientRect().width,
          rail: card.parentElement!.getBoundingClientRect().width,
        }));
        // No clipped next-card names/prices on mobile.
        expect(Math.abs(widths.card - widths.rail)).toBeLessThanOrEqual(2);
      }

      await expect(page.locator('.home-locations .home-guide-pin').first()).toBeVisible();
      const areaAlign = await page.locator('.home-locations .home-guide-card').first()
        .evaluate((card) => {
          const icon = card.querySelector('.home-guide-pin')!;
          return icon.getBoundingClientRect().left - card.getBoundingClientRect().left;
        });
      expect(areaAlign).toBeGreaterThan(0);
      expect(areaAlign).toBeLessThan(32);
      const serviceCards = page.locator('.home-services .home-service-category-card');
      if (await serviceCards.count() && width >= 351) {
        const columns = await page.locator('.home-services .home-rail-viewport')
          .evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length);
        expect(columns).toBe(2);
      }
    });
  }

  test('buy tab and primary search open the real property catalogue', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.locator('.home-reference-search .home-search-modes button').last().click();
    await expect(page.locator('.home-reference-search .home-search-modes button').last())
      .toHaveAttribute('aria-pressed', 'true');
    await page.locator('.home-reference-search .home-search-submit').click();
    await expect(page).toHaveURL(/\/property\/search\?.*mode=buy/);
  });
});


test.describe('homepage discovery search', () => {
  for (const width of [320, 390, 768, 1440, 1915]) {
    test(`the hero photo and three search modes fit at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/', { waitUntil: 'domcontentloaded' });

      const search = page.locator('.home-reference-search form[data-home-discovery-mode]');
      await expect(search).toHaveAttribute('data-home-discovery-mode', 'rent');
      await expect(search.locator('.home-search-modes button')).toHaveCount(3);
      await expect(search.locator('.home-search-submit')).toBeVisible();
      const photo = page.locator('.home-hero-banner-photo');
      await expect(photo).toBeVisible();
      await expect(photo).toHaveAttribute('alt', '');
      await expect.poll(() => photo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
      expect(await photo.evaluate((img: HTMLImageElement) => !/\.svg(?:$|[?#])|^data:image\/svg/i.test(img.src))).toBe(true);

      const geometry = await search.evaluate((form) => ({
        fits: document.documentElement.scrollWidth <= window.innerWidth + 1,
        shape: form.getBoundingClientRect().width,
        controls: Array.from(form.querySelectorAll('.home-search-modes button'), (button) => ({
          width: button.getBoundingClientRect().width,
          clipped: button.scrollWidth > button.clientWidth + 2 || button.scrollHeight > button.clientHeight + 2,
        })),
        desktopRow: ['location', 'dates', 'type', 'bedrooms', 'refine', 'submit'].map(
          (field) => form.querySelector(`.home-search-${field}`)?.getBoundingClientRect().bottom,
        ),
      }));

      const modes = search.locator('.home-search-modes button');
      await modes.nth(1).click();
      await expect(search).toHaveAttribute('data-home-discovery-mode', 'activities');
      await modes.nth(2).click();
      await expect(search).toHaveAttribute('data-home-discovery-mode', 'buy');
      await modes.first().click();
      await expect(search).toHaveAttribute('data-home-discovery-mode', 'rent');
      expect(geometry.fits).toBe(true);
      expect(geometry.shape).toBeLessThanOrEqual(width);
      expect(geometry.controls.every((control) => control.width >= 44 && !control.clipped)).toBe(true);
      if (width >= 1024) {
        const bottoms = geometry.desktopRow.filter((bottom): bottom is number => bottom !== undefined);
        expect(bottoms).toHaveLength(6);
        expect(Math.max(...bottoms) - Math.min(...bottoms)).toBeLessThanOrEqual(2);
      }
    });
  }
});
