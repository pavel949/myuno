// Browser coverage for the real airport forms with synthetic catalogues, auth and writers.
import { radixOverlayAliases } from '../radix-overlay-resolution.mjs';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { createServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import postcss from 'postcss';
import postcssImport from 'postcss-import';
import tailwindcss from 'tailwindcss';
import { chromium, expect } from '@playwright/test';

const output = resolve(process.env.AIRPORT_QA_OUTPUT || 'artifacts/airport-request-ui');
await mkdir(output, { recursive: true });
const modules = {
  '@/components/layout/AppLayout': 'export const AppLayout = ({ children }) => <main>{children}</main>;',
  '@/contexts/LanguageContext': "export const useLanguage = () => ({ language: new URLSearchParams(location.search).get('lang') || 'en', t: key => key });",
  '@/contexts/AuthContext': "export const useAuth = () => ({ user: { id: 'fixture-user' } });",
  '@/hooks/useProfile': 'export const useProfile = () => ({});',
  '@/hooks/useGeolocation': 'export const useGeolocation = () => ({ supported: false });',
  '@/hooks/usePropertyProjects': 'export const usePropertyProjects = () => ({ data: [] });',
  '@/hooks/useGoogleGeocode': 'export const useGoogleGeocode = () => ({});',
  '@/lib/googleMaps': 'export const hasGoogleMapsKey = () => false;',
  '@/components/auth/InlineAuthGate': 'export const InlineAuthGate = () => null;',
  '@/components/transport/TransferUpsellScreen': 'export const TransferUpsellScreen = () => <p>Fixture: transfer upsell opened</p>;',
  '@/hooks/useOrders': `export const useOrders = () => ({ createOrder: async input => {
    window.writes.push({ name: 'orders', body: input });
    return { success: true, order_id: 'test-order', order_number: 'TEST-1' };
  }});`,
  '@/integrations/supabase/client': `export const supabase = {
    from(table) {
      let result = [];
      if (table === 'airport_services') result = [
        { id: 'fast', service_type: 'fast_track', direction: 'both', sku: 'FT', name_en: 'Priority lane', name_ru: 'Приоритетный проход', base_price: 1200, currency: 'THB', max_passengers: 2, cutoff_hours: 24 },
        { id: 'bundle', service_type: 'bundle', direction: 'both', sku: 'BUNDLE', name_en: 'Priority and lounge', base_price: 1600, currency: 'THB', max_passengers: 4, cutoff_hours: 24 },
      ];
      if (table === 'transport_vehicle_types') result = [{ id: 'sedan', name_en: 'Sedan', name_ru: 'Седан', max_passengers: 3, base_price: 900, price_multiplier: 1 }];
      if (table === 'transport_destinations') result = [{ id: 'zone', name_en: 'Bang Tao', name_ru: 'Банг Тао', base_price: 1000 }];
      const query = { select: () => query, eq: () => query, order: () => query, limit: () => query,
        maybeSingle: async () => window.failRate ? { error: new Error('fixture rate read failed') } : { data: null },
        then: resolve => resolve({ data: result, error: null }) };
      return query;
    },
    functions: { invoke: async (name, { body }) => {
      window.writes.push({ name, body });
      if (name === 'create-checkout') return { error: new Error('Fixture checkout unavailable') };
      if (name === 'notify-fasttrack-booking' && !window.failRequest) return { data: { success: true, booking_id: 'fixture-fast-track' } };
      return { data: { success: true } };
    } }
  };`,
};

const bundle = await build({
  stdin: {
    contents: `
      import { createRoot } from 'react-dom/client';
      import { BrowserRouter, Routes, Route } from 'react-router-dom';
      import AirportFastTrackPage from './src/pages/transport/AirportFastTrackPage';
      import AirportTransferBooking from './src/pages/transport/AirportTransferBooking';
      window.writes = [];
      createRoot(document.getElementById('root')).render(<BrowserRouter><Routes>
        <Route path="/transport/airport-transfer" element={<AirportTransferBooking />} />
        <Route path="/transport/fast-track" element={<AirportFastTrackPage />} />
        <Route path="/bookings" element={<h1>Fixture: bookings</h1>} />
      </Routes></BrowserRouter>);
    `,
    resolveDir: process.cwd(),
    loader: 'tsx',
  },
  alias: radixOverlayAliases, bundle: true, write: false, jsx: 'automatic', format: 'esm', metafile: true,
  define: { 'process.env.NODE_ENV': '"production"', 'import.meta.env.DEV': 'false' },
  plugins: [{
    name: 'isolated-fixtures',
    setup(builder) {
      builder.onResolve({ filter: /.*/ }, args => Object.hasOwn(modules, args.path) ? { path: args.path, namespace: 'fixture' } : undefined);
      builder.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ contents: modules[args.path], loader: 'tsx', resolveDir: process.cwd() }));
    },
  }],
  loader: { '.webp': 'dataurl' },
  tsconfig: 'tsconfig.app.json',
});
assert(!Object.keys(bundle.metafile.inputs).some(file => file === 'src/integrations/supabase/client.ts'));
const css = await postcss([postcssImport(), tailwindcss()]).process(await readFile('src/index.css', 'utf8'), { from: 'src/index.css' });
const server = createServer((request, response) => {
  if (request.url === '/fixture.js') {
    response.setHeader('Content-Type', 'application/javascript');
    response.end(bundle.outputFiles[0].contents);
  } else if (request.url === '/fixture.css') {
    response.setHeader('Content-Type', 'text/css');
    response.end(css.css);
  } else if (request.url?.startsWith('/transport/') || request.url === '/bookings') {
    response.end('<!doctype html><html><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/fixture.css"><div id="root"></div><script type="module" src="/fixture.js"></script></html>');
  } else {
    response.writeHead(404).end();
  }
});
await new Promise(resolveListen => server.listen(0, '127.0.0.1', resolveListen));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const evidence = [];
const motionComplete = async page => expect(page.locator('[aria-current="step"]')).toBeVisible();
async function screenshot(page, name) {
  await motionComplete(page);
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Page overflow: ${name}`);
  await expect.poll(() => page.locator('.airport-booking__image').evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
  const layout = await page.locator('.airport-booking').evaluate(root => {
    const hero = root.querySelector('.airport-booking__hero');
    const image = root.querySelector('.airport-booking__image');
    const workspace = root.querySelector('.airport-booking__workspace').getBoundingClientRect();
    const summary = root.querySelector('.airport-booking__summary').getBoundingClientRect();
    return {
      desktop: innerWidth >= 1024,
      fullWidth: hero.clientWidth >= innerWidth - 24,
      imageLoaded: image.complete && image.naturalWidth > 0,
      sideBySide: summary.left >= workspace.right,
      singleColumn: Math.abs(summary.left - workspace.left) < 2,
    };
  });
  assert(layout.fullWidth && layout.imageLoaded, `Airport hero did not fill the viewport: ${name}`);
  assert(layout.desktop ? layout.sideBySide : layout.singleColumn, `Unexpected booking columns: ${name}`);
  await page.screenshot({ path: join(output, `${name}.png`), fullPage: true, animations: 'disabled' });
}
const flightDate = new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10);

async function transfer(page, direction, width) {
  await page.goto(`${origin}/transport/airport-transfer?direction=${direction}`);
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('alert')).toContainText('Select a terminal');
  await page.getByRole('button', { name: 'Domestic Terminal' }).click();
  await page.getByRole('button', { name: /Bang Tao/ }).click();
  await screenshot(page, `transfer-route-${width}`);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: /Sedan/ }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Flight number').fill('TG925');
  await page.getByLabel(direction === 'from-airport' ? 'Arrival date' : 'Pickup date').fill(flightDate);
  await page.getByLabel(direction === 'from-airport' ? 'Arrival time' : 'Pickup time').fill('13:00');
  await page.getByLabel('Passengers').fill('4');
  await page.getByLabel('Full name').fill('Sample Traveller');
  await page.getByLabel('Phone with country code').fill('+66812345678');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('Enter 1–3 passengers for this vehicle.')).toBeVisible();
  await expect(page.getByLabel('Passengers')).toBeFocused();
  await page.getByLabel('Passengers').fill('2');
  await screenshot(page, `transfer-details-${width}`);
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText(direction === 'from-airport' ? 'HKT Domestic Terminal → Bang Tao' : 'Bang Tao → HKT Domestic Terminal')).toBeVisible();
  await screenshot(page, `transfer-review-${width}`);
  await page.getByRole('button', { name: /^Pay ฿/ }).click();
  await expect(page.getByRole('alert')).toContainText('Your order exists');
  await page.getByRole('button', { name: 'Retry card payment' }).click();
  await expect(page.getByRole('alert')).toContainText('Your order exists');
  const writes = await page.evaluate(() => window.writes);
  assert.deepEqual(writes.map(write => write.name), ['orders', 'create-checkout', 'create-checkout']);
  assert.equal(writes[0].body.metadata.direction, direction);
  assert.equal(writes[0].body.addresses[0].address_type, direction === 'from-airport' ? 'pickup' : 'dropoff');
  assert.equal(writes[1].body.order_id, writes[2].body.order_id);
}

async function fastTrack(page, direction, width, simulateFailure) {
  await page.goto(`${origin}/transport/fast-track`);
  await page.evaluate(fail => { window.failRequest = fail; }, simulateFailure);
  await page.getByRole('button', { name: direction === 'arrival' ? 'Arrival' : 'Departure', exact: true }).click();
  await page.getByRole('button', { name: /Priority and lounge/ }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByLabel('Flight number')).toBeFocused();
  await page.getByLabel('Flight number').fill('TG123');
  await page.getByLabel('Flight date').fill(flightDate);
  await page.getByLabel('Flight time').fill('12:00');
  for (const label of ['Flight number', 'Flight date', 'Flight time']) {
    await expect(page.getByLabel(label)).toHaveAttribute('aria-invalid', 'false');
  }
  await screenshot(page, `fasttrack-flight-${width}`);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('First name (Latin)').fill('Sample');
  await page.getByLabel('Last name (Latin)').fill('Traveller');
  await page.getByLabel('Passport number').fill('TEST1234');
  await page.getByLabel('Nationality').fill('British');
  await page.getByLabel('Date of birth').fill('1980-01-01');
  await page.getByLabel('Email', { exact: true }).fill('fixture@example.test');
  await screenshot(page, `fasttrack-passenger-${width}`);
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('Booking Summary')).toBeVisible();
  await screenshot(page, `fasttrack-review-${width}`);
  await page.getByRole('button', { name: 'Send request' }).click();
  if (simulateFailure) {
    await expect(page.getByRole('alert')).toContainText('could not verify receipt');
    await expect(page.getByRole('button', { name: 'Send request' })).toBeDisabled();
  } else {
    await expect(page.getByText(direction === 'arrival' ? 'Fixture: transfer upsell opened' : 'Fixture: bookings')).toBeVisible();
  }
  const writes = await page.evaluate(() => window.writes);
  assert.equal(writes.length, 1);
  assert.equal(writes[0].name, 'notify-fasttrack-booking');
  assert.equal(writes[0].body.direction, direction);
  assert.equal(writes[0].body.service_id, 'bundle');
}

async function isolatedPage(width, callback) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, timezoneId: 'America/Los_Angeles', serviceWorkers: 'block' });
  try {
    const page = await context.newPage();
    await page.route('**/*', route => route.request().url().startsWith(origin + '/') ? route.continue() : route.abort());
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await callback(page);
    assert.deepEqual(errors, []);
  } finally {
    await context.close();
  }
}

try {
  for (const [index, width] of [375, 390, 430, 768, 1440].entries()) {
    const direction = index % 2 === 0 ? 'from-airport' : 'to-airport';
    const flightDirection = index % 2 === 0 ? 'arrival' : 'departure';
    await isolatedPage(width, page => transfer(page, direction, width));
    await isolatedPage(width, page => fastTrack(page, flightDirection, width, index === 2));
    evidence.push({ width, transfer: direction, fastTrack: flightDirection, fastTrackResponse: index === 2 ? 'unverified' : 'accepted' });
  }
  await isolatedPage(390, async page => {
    await page.goto(`${origin}/transport/airport-transfer?direction=airport-to-airport`);
    await expect(page.getByRole('alert')).toContainText('Choose a route to or from Phuket Airport');
    assert.deepEqual(await page.evaluate(() => window.writes), []);
  });
  await isolatedPage(390, async page => {
    await page.addInitScript(() => { window.failRate = true; });
    await page.goto(`${origin}/transport/airport-transfer`);
    await expect(page.getByRole('alert')).toContainText('Could not load transfer rates');
    await page.evaluate(() => { window.failRate = false; });
    await page.getByRole('button', { name: 'Try again' }).click();
    await expect(page.getByRole('alert')).toHaveCount(0);
    assert.deepEqual(await page.evaluate(() => window.writes), []);
  });
  await writeFile(join(output, 'results.json'), JSON.stringify(evidence, null, 2));
  console.log('Airport request browser fixture: 10 responsive flows and 2 failure/recovery cases passed.');
} finally {
  await browser.close();
  server.close();
}
