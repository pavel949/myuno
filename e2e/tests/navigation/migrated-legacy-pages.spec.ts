import { test, expect } from '@playwright/test';

const pages = [
  {
    name: 'School Finder',
    path: '/school-finder',
    heading: /School Finder|Подбор школы/i,
    search: false,
    available: true,
  },
  {
    name: 'Cost of Living',
    path: '/cost-of-living',
    heading: /Cost of Living|Стоимость жизни/i,
    search: false,
    available: true,
  },
  {
    name: 'Market Catalog',
    path: '/market/categories',
    heading: /Catalog|Каталог/i,
    search: true,
    available: false,
  },
  {
    name: 'Visa Quiz',
    path: '/visa/quiz',
    heading: /Visa quiz|Визовый квиз/i,
    search: false,
    available: true,
  },
] as const;

for (const page of pages) {
  test.describe(`${page.name} unified experience`, () => {
    test('renders the migrated shell without horizontal overflow', async ({ page: browserPage }) => {
      await browserPage.goto(page.path, { waitUntil: 'domcontentloaded' });
      if (!page.available) {
        await expect(browserPage.locator('#market-unavailable-title')).toHaveText(/Market is not available yet|Маркет пока недоступен/i);
      } else {
        await expect(browserPage.locator('h1').first()).toHaveText(page.heading);
      }
      await expect(browserPage.locator('.myuno-bottom-nav')).toHaveCount(1);

      const metrics = await browserPage.evaluate(() => ({
        viewport: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.viewport + 1);
    });

    test('keeps shared navigation controls usable', async ({ page: browserPage }) => {
      await browserPage.goto(page.path, { waitUntil: 'domcontentloaded' });

      if (!page.available) {
        const unavailable = browserPage.locator('#market-unavailable-title');
        await expect(unavailable).toBeVisible();
        const actions = await browserPage.locator('#market-unavailable-title').locator('..').getByRole('link').all();
        for (const action of actions) {
          const box = await action.boundingBox();
          expect(box?.height ?? 0).toBeGreaterThanOrEqual(40);
        }
        return;
      }

      const back = browserPage.locator('button[aria-label="Go back"], button[aria-label="Назад"], a[aria-label="Go back"], a[aria-label="Назад"]').first();
      await expect(back).toBeVisible();
      const backBox = await back.boundingBox();
      expect(backBox?.width ?? 0).toBeGreaterThanOrEqual(40);
      expect(backBox?.height ?? 0).toBeGreaterThanOrEqual(40);

      if (page.search) {
        const search = browserPage.locator('input[type="search"]');
        await expect(search).toBeVisible();
        const searchBox = await search.boundingBox();
        expect(searchBox?.height ?? 0).toBeGreaterThanOrEqual(40);
        await search.fill('organic');
        await expect(search).toHaveValue('organic');
      }
    });
  });
}
