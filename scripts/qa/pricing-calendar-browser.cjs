const assert = require('node:assert/strict');
const { chromium } = require('@playwright/test');

async function run() {
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox'],
  });
  const fixtureUrl = 'http://127.0.0.1:8091/';
  const results = [];
  try {
    for (const lang of ['ru', 'en', 'th']) {
      for (const width of [375, 390, 430, 1440]) {
        const page = await browser.newPage({ viewport: { width, height: 900 }, hasTouch: width < 768 });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.route('**/*', route => route.request().url().startsWith(fixtureUrl) ? route.continue() : route.abort());
        await page.goto(fixtureUrl + '?lang=' + lang);
        const first = page.getByRole('button', { name: /^2026-10-21 2500/ });
        const last = page.getByRole('button', { name: /^2026-10-24 4500/ });
        await first.waitFor();
        await page.screenshot({ path: `/tmp/browser/pricing-calendar/${lang}-${width}.png`, fullPage: true });

        const activate = width < 768 ? 'tap' : 'click';
        await first[activate]();
        await last[activate]();
        assert.equal(await page.locator('#calendar-price-from').inputValue(), '2026-10-21');
        assert.equal(await page.locator('#calendar-price-through').inputValue(), '2026-10-24');
        await page.locator('#calendar-price-amount').fill('3400.50');
        await page.locator('button[type=submit]').click();
        const saved = await page.evaluate(() => window.fixtureLastSave);
        assert.equal(saved.p_from, '2026-10-21');
        assert.equal(saved.p_to, '2026-10-25');
        assert.equal(saved.p_price, 3400.5);
        assert.equal(saved.p_expected['2026-10-21'].booking, 'fixture-booking');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        assert.deepEqual(errors, []);
        results.push({ lang, width });
        await page.close();
      }
    }
    console.log(JSON.stringify(results));
  } finally {
    await browser.close();
  }
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
