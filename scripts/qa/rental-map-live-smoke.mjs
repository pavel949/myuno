// Opt-in diagnosis of the live rental map. No authenticated or mutating requests.
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';

if (process.env.CI !== 'true' || process.env.GITHUB_ACTIONS !== 'true') {
  throw Error('Run in the opt-in GitHub Actions workflow only');
}

const origins = new Set(['https://www.myuno.app', 'https://myuno.app']);
const supabase = 'https://kakkwibljrjsawxgnupk.supabase.co';
const project = '94cdd545-c140-4b3c-b243-e6ed0474036f'; // Ocean Stone project filter.
const uuid = '[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}';
const detailPath = new RegExp('^/property/' + uuid + '$', 'i');
const start = new URL('/property/search?mode=rent&tenancy=short&view=map&project=' + project, 'https://www.myuno.app');
const output = '/tmp/browser/rental-map-live';
const archivePath = JSON.parse(await readFile('src/assets/map/phuket.pmtiles.asset.json', 'utf8')).url;
assert.match(archivePath, /^\/__l5e\/assets-v1\/[a-f0-9-]+\/phuket\.zip$/);
const originIsPublic = (url) => origins.has(url.origin);
const allowedRead = (url, request) => {
  if (!['GET', 'HEAD'].includes(request.method())) return false;
  if (request.isNavigationRequest()) return originIsPublic(url) &&
    (url.pathname === '/property/search' || detailPath.test(url.pathname));
  if (originIsPublic(url)) return url.pathname === archivePath || /^\/(?:assets\/|map-glyphs\/|fonts\/|icons\/|favicon)/.test(url.pathname);
  if (url.origin !== supabase) return false;
  // Reads against anonymous PostgREST views/tables only. Never auth, storage,
  // functions, RPC (including quote/availability), payments, or Realtime.
  if (!/^\/rest\/v1\/(?:public_property_catalog|lookup_values|property_projects|property_media|property_amenities|property_reviews|currencies|currency_rates)$/.test(url.pathname)) return false;
  return true;
};

const normalize = (text) => text?.replace(/\s+/g, ' ').trim();
const results = [];
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  // CI only: supply a software WebGL implementation, not a browser bypass.
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
try {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    const row = { viewport, outcome: 'FAIL', blocked: [], ranges: [], revision: process.env.GITHUB_SHA };
    const context = await browser.newContext({ viewport, locale: 'en-US', serviceWorkers: 'block' });
    let closing = false;
    try {
      await context.route('**/*', async (route) => {
        const req = route.request(), url = new URL(req.url());
        try {
          if (allowedRead(url, req)) {
            // Playwright route.continue does not re-intercept redirected requests.
            // Intercept 3xx here and stop instead of following outside the allowlist.
            const response = await route.fetch({ maxRedirects: 0, timeout: 20000 });
            if (response.status() < 300 || response.status() >= 400 || response.status() === 304) {
              if (url.pathname === archivePath && originIsPublic(url) && response.status() === 206) {
                row.ranges.push(response.headers()['content-range']);
              }
              await route.fulfill({ response });
              return;
            }
          }
          // Only log method and pathname. No cookies, keys or query strings.
          row.blocked.push([req.method(), url.origin, url.pathname]);
          await route.abort('blockedbyclient');
        } catch (error) {
          // Keep routing installed until the context closes: unroute would
          // briefly permit unchecked requests. In-flight reads may be cancelled.
          if (closing) return;
          (row.routeErrors ??= []).push([req.method(), url.origin, url.pathname, error.name]);
          await route.abort('failed').catch(() => {});
        }
      });
      await context.routeWebSocket('**/*', (socket) => socket.close());
      const page = await context.newPage();
      const initialBuild = await context.request.get(new URL('/version.json', start.origin).href, { maxRedirects: 0 });
      assert.equal(initialBuild.status(), 200);
      row.version = await initialBuild.json();
      assert.ok(Number.isFinite(Date.parse(row.version.buildTime)), 'Missing dated live build identity');
      await page.goto(start.href, { waitUntil: 'domcontentloaded' });
      const map = page.locator('[data-map-render-state="ready"]');
      await expect(map.locator('.maplibregl-canvas')).toBeVisible({ timeout: 45000 });
      const marker = map.locator('[data-marker-id]').filter({ visible: true }).first();
      await expect(marker).toBeVisible({ timeout: 30000 });
      await expect.poll(() => row.ranges.some((range) => /^bytes [0-9]+-[0-9]+\/[0-9]+$/.test(range)), { timeout: 30000 }).toBe(true);
      const id = await marker.getAttribute('data-marker-id');
      const label = normalize(await marker.getAttribute('aria-label'));
      assert.match(id ?? '', new RegExp('^' + uuid + '$', 'i'));
      assert.ok(label);
      await marker.click({ timeout: 10000 });
      const card = page.getByRole('region', { name: /^(Home on map|Объект на карте)$/ });
      await expect(card.getByRole('heading')).toHaveText(label);
      const detail = card.getByRole('button', { name: /^(View details|Открыть)$/ });
      await detail.click();
      await expect.poll(() => new URL(page.url()).pathname).toBe('/property/' + id);
      assert.equal(new URL(page.url()).searchParams.get('mode'), 'rent');
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(label);
      await page.goBack();
      await expect(map.locator('.maplibregl-canvas')).toBeVisible({ timeout: 45000 });
      const returned = new URL(page.url());
      assert.equal(returned.pathname, start.pathname);
      for (const [key, value] of start.searchParams) assert.equal(returned.searchParams.get(key), value, key);
      const latest = await context.request.get(new URL('/version.json', start.origin).href, { maxRedirects: 0 });
      assert.equal(latest.status(), 200);
      assert.equal((await latest.json()).buildTime, row.version.buildTime, 'Live build changed mid-test');
      row.propertyId = id;
      row.outcome = 'PASS';
    } catch (error) {
      row.failure = String(error).slice(0, 3000);
    } finally {
      results.push(row);
      await writeFile(output + '/results.json', JSON.stringify(results, null, 2));
      closing = true;
      await context.close();
    }
  }
} finally {
  await browser.close();
}
console.log(JSON.stringify(results, null, 2));
if (results.some((row) => row.outcome !== 'PASS')) process.exitCode = 1;
