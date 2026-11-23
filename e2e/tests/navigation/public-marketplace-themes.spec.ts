import { expect, test } from '@playwright/test';

/**
 * Guest read-only theme acceptance across the four myUNO marketplaces.
 * Does not submit bookings, payments, or CRM requests.
 * These checks cover actual compiled CSS and theme persistence, not merely source tokens.
 */
const marketplaces = [
  '/',
  '/property/rent',
  '/discover/buy',
  '/property/search?mode=rent',
  '/property/offplan',
  '/experiences',
  '/services',
  '/yachts',
  '/flowers',
  '/transport/airport-transfer',
  '/transport/fast-track',
] as const;

for (const theme of ['light', 'dark'] as const) {
  for (const width of [390, 1440]) {
    test.describe(`${theme} theme public marketplace at ${width}px`, () => {
      test.use({ viewport: { width, height: 900 } });

      for (const route of marketplaces) {
        test(`${route} loads without overflow or theme reversal`, async ({ page }) => {
          await page.addInitScript(({ theme }) => {
            localStorage.setItem('myuno-theme', theme);
            localStorage.setItem('myuno-language', 'en');
          }, { theme });
          const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
          expect(response?.status(), route).toBeLessThan(400);
          await expect(page.locator('html')).toHaveAttribute('data-theme-ready', theme, { timeout: 12000 });
          await expect(page.locator('h1').first(), `Missing heading on ${route}`).toBeVisible({ timeout: 15000 });
          const size = await page.evaluate(() => ({
            viewport: innerWidth,
            document: document.documentElement.scrollWidth,
          }));
          expect(size.document, `Horizontal overflow on ${route}`)
            .toBeLessThanOrEqual(size.viewport + 1);
        });
      }
    });
  }
}

for (const theme of ['light', 'dark'] as const) {
  test.describe(`${theme} theme legibility of inverse panels`, () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('airport transfer and Fast Track hero labels remain white on navy', async ({ page }) => {
      await page.addInitScript(({ theme }) => localStorage.setItem('myuno-theme', theme), { theme });
      for (const route of ['/transport/airport-transfer', '/transport/fast-track']) {
        await page.goto(route, { waitUntil: 'domcontentloaded' });
        const hero = page.locator('.airport-booking__hero');
        await expect(hero).toBeVisible({ timeout: 15000 });
        for (const selector of ['.airport-booking__hero-content h1',
          '.airport-booking__hero-content p', '.airport-booking__back button']) {
          const foreground = await page.locator(selector).first()
            .evaluate((node) => getComputedStyle(node).color);
          expect(foreground, `${route}: ${selector} must contrast with navy`)
            .toBe('rgb(255, 255, 255)');
        }
      }
    });

    test('the Newbuild ClearView introduction meets AA contrast in both themes', async ({ page }) => {
      await page.addInitScript(({ theme }) => localStorage.setItem('myuno-theme', theme), { theme });
      await page.goto('/property/offplan', { waitUntil: 'domcontentloaded' });
      const intro = page.locator('.newbuild-trust .rental-section-heading p:not(.rental-eyebrow)');
      await expect(intro).toBeVisible({ timeout: 15000 });
      const contrastRatio = await intro.evaluate((element) => {
        const section = element.closest('.newbuild-trust')!;
        const color = (css: string) =>
          css.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0, 1];
        const background = color(getComputedStyle(section).backgroundColor);
        const raw = color(getComputedStyle(element).color);
        const alpha = raw[3] ?? 1;
        const foreground = raw.slice(0, 3).map((channel, i) =>
          channel * alpha + background[i] * (1 - alpha));
        const luminance = (rgb: number[]) =>
          rgb.slice(0, 3).map((value) => {
            const x = value / 255;
            return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
          }).reduce((acc, x, i) => acc + x * [0.2126, 0.7152, 0.0722][i], 0);
        const a = luminance(foreground);
        const b = luminance(background);
        return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      });
      expect(contrastRatio).toBeGreaterThanOrEqual(4.5);
    });

    test('service categories use a single Lucide icon treatment', async ({ page }) => {
      await page.addInitScript(({ theme }) => localStorage.setItem('myuno-theme', theme), { theme });
      await page.goto('/services', { waitUntil: 'domcontentloaded' });
      const menu = page.locator('[data-testid="service-discovery-menu"]');
      await expect(menu).toBeVisible({ timeout: 20000 });
      const categories = menu.locator('[data-category-id]');
      expect(await categories.count()).toBeGreaterThan(0);
      await expect(menu.locator('img')).toHaveCount(0);
      const missingIcons = await categories.evaluateAll((items) => items
        .filter((item) => !item.querySelector('svg')).map((item) => item.getAttribute('data-category-id')));
      expect(missingIcons).toEqual([]);
    });
  });
}


test('dark homepage search, services and districts use readable dark surfaces', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.setItem('myuno-theme', 'dark'));
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveAttribute('data-theme-ready', 'dark');
  const result = await page.locator('.home-reference-search').evaluate((card) => {
    const parse = (css: string): number[] => css.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0];
    const lum = (rgb: number[]) => rgb.slice(0, 3)
      .map((value) => {
        const x = value / 255;
        return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
      }).reduce((sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i], 0);
    const ratio = (foreground: string, background: string) => {
      const a = lum(parse(foreground)), b = lum(parse(background));
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    };
    const panel = getComputedStyle(card).backgroundColor;
    const label = getComputedStyle(card.querySelector('.home-field-label')!).color;
    const guestInput = getComputedStyle(card.querySelector('.home-search-guests input')!);
    const submit = getComputedStyle(card.querySelector('.home-search-submit')!);
    const inactive = getComputedStyle(card.querySelector('.home-search-modes button[aria-pressed="false"]')!);
    const canvas = getComputedStyle(card.closest('.cinematic-home')!).backgroundColor;
    return {
      canvasBrightness: lum(parse(canvas)),
      panelBrightness: lum(parse(panel)),
      labelContrast: ratio(label, panel),
      guestContrast: ratio(guestInput.color, panel),
      inactiveContrast: ratio(inactive.color, panel),
      submitContrast: ratio(submit.color, submit.backgroundColor),
    };
  });
  // Dark mode must not leave the old white-on-white hero search.
  expect(result.canvasBrightness).toBeLessThan(0.20);
  expect(result.panelBrightness).toBeLessThan(0.20);
  for (const key of ['labelContrast', 'guestContrast', 'inactiveContrast', 'submitContrast'] as const)
    expect(result[key], key).toBeGreaterThanOrEqual(4.5);
});


test('desktop homepage dates, guests and primary CTA occupy the same row', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => localStorage.setItem('myuno-theme', 'dark'));
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const search = page.locator('.home-reference-search');
  await expect(search).toBeVisible();
  const boxes = await search.evaluate((root) => {
    const query = (selector: string) => root.querySelector(selector)!.getBoundingClientRect();
    const dates = query('.home-search-dates');
    const guests = query('.home-search-guests');
    const button = query('.home-search-submit');
    return {
      dates: dates.top, guests: guests.top, button: button.top,
      guestsWidth: guests.width, ctaWidth: button.width,
    };
  });
  expect(Math.abs(boxes.dates - boxes.guests)).toBeLessThanOrEqual(4);
  expect(Math.abs(boxes.dates - boxes.button)).toBeLessThanOrEqual(4);
  expect(boxes.guestsWidth).toBeGreaterThanOrEqual(150);
  expect(boxes.ctaWidth).toBeGreaterThanOrEqual(175);
});
