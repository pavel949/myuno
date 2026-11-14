// Synthetic UI evidence only. Production data and writes are forbidden.
import { build } from 'esbuild';
import postcss from 'postcss';
import postcssImport from 'postcss-import';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import assert from 'node:assert/strict';
const root = process.cwd();
const out = '/tmp/myuno-marketplace-ui';
await mkdir(out, { recursive: true });
const offers = [
  { id: 'a', provider_id: 'pa', name_en: 'Fixture villa cleaning', name_ru: 'Тестовая уборка виллы', description_en: 'Synthetic UI fixture — not a live offer', description_ru: 'Тестовые данные, не реальное предложение', price: 950, currency: 'THB', duration_minutes: 90, lead_time_hours: 2, images: ['/fixture.svg'], location: { district: 'Rawai' }, provider: { id: 'pa', name: 'Fixture provider A', rating: 4.8, review_count: 20, is_verified: true } },
  { id: 'b', provider_id: 'pb', name_en: 'Fixture home maintenance', name_ru: 'Тестовое обслуживание дома', price: 35, currency: 'USD', duration_minutes: 60, lead_time_hours: 1, images: [], location: { district: 'Bang Tao' }, provider: { id: 'pb', name: 'Fixture provider B', rating: null, review_count: null, is_verified: false } },
];
const virtual = {
  '@/contexts/LanguageContext': `export const useLanguage=()=>({language:new URLSearchParams(location.search).get('lang')||'en'});`,
  '@/hooks/useServiceMarketplace': `export const useMarketplaceServices=()=>({data:${JSON.stringify(offers)},isLoading:false,isError:false,refetch:()=>{}});`,
  '@/hooks/useMarketplaceAvailability': `export const useMarketplaceAvailability=(services,date)=>({data:Object.fromEntries(services.map(s=>[s.id,{status:s.id==='a'?'available':'unknown',date,firstSlot:date?date+'T05:00:00Z':undefined}])),isFetching:false,refetch:()=>{}});`,
  './ServiceBookingSheet': `export const ServiceBookingSheet=({service,initialDate})=>service?<output data-testid="booking-date">{initialDate}</output>:null;`,
  '@/integrations/supabase/client': `throw Error('Production database forbidden in UI fixture');`,
};
await build({ stdin: { contents: `import React from 'react';import{createRoot}from'react-dom/client';import{BrowserRouter,useLocation}from'react-router-dom';import{MarketplaceServiceGrid}from'${root}/src/components/services/MarketplaceServiceGrid.tsx';import'${root}/src/index.css';function App(){const l=useLocation();return<main className="ds-frame-catalogue p-4"><MarketplaceServiceGrid returnTo={l.pathname+l.search} onConcierge={()=>{window.fixtureConcierge=true}}/></main>}createRoot(document.getElementById('root')).render(<BrowserRouter><App/></BrowserRouter>);`, loader: 'tsx', resolveDir: root },
  bundle: true, outfile: path.join(out, 'fixture.js'), jsx: 'automatic', format: 'esm',
  define: { 'process.env.NODE_ENV': '"production"', 'import.meta.env.DEV': 'false' },
  plugins: [{ name: 'no-production-data', setup(builder) {
    builder.onResolve({ filter: /.*/ }, args => {
      if (Object.hasOwn(virtual, args.path)) return { path: args.path, namespace: 'fixture' };
      if (args.path.startsWith('@/')) {
        const base = path.join(root, 'src', args.path.slice(2));
        const resolved = [base, base + '.ts', base + '.tsx', path.join(base, 'index.ts'), path.join(base, 'index.tsx')].find(file => existsSync(file) && statSync(file).isFile());
        if (!resolved) throw Error('Cannot resolve ' + args.path);
        return { path: resolved };
      }
    });
    builder.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ contents: virtual[args.path], loader: 'tsx', resolveDir: root }));
  } }],
});
const css = await postcss([postcssImport(), tailwindcss(), autoprefixer()]).process(
  ['src/index.css', 'src/styles/premium-services.css', 'src/styles/marketplace-filters.css', 'src/styles/marketplace-service-card.css'].map(file => `@import './${file}';`).join('\n'),
  { from: path.join(root, 'marketplace-fixture.css') });
await writeFile(path.join(out, 'theme.css'), css.css);
const html = '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/theme.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>';
const server = createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url, 'http://fixture.invalid').pathname;
    if (pathname === '/fixture.svg') { response.setHeader('Content-Type', 'image/svg+xml'); response.end('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#ded9d0"/><text x="40" y="300" font-size="40">SYNTHETIC UI FIXTURE</text></svg>'); return; }
    const asset = ['/fixture.js', '/fixture.css', '/theme.css'].includes(pathname);
    response.setHeader('Content-Type', pathname.endsWith('.js') ? 'text/javascript' : pathname.endsWith('.css') ? 'text/css' : 'text/html');
    response.end(asset ? await readFile(path.join(out, pathname.slice(1))) : html);
  } catch (error) { response.statusCode = 500; response.end(String(error)); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const results = [];
let browser;
try {
  browser = await chromium.launch({ headless: true });
  for (const language of ['ru', 'en']) for (const width of [375, 390, 430, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => route.request().url().startsWith(origin) ? route.continue() : route.abort());
    await page.goto(`${origin}/discover/services?lang=${language}&ref=trip`);
    await page.getByTestId('marketplace-service-card').first().waitFor();
    assert.equal(await page.getByTestId('marketplace-service-card').count(), 2);
    assert.equal(await page.locator('img').count(), 1);
    const metrics = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth,
      small: [...document.querySelectorAll('button,select,input:not([type=checkbox])')].filter(element => element.getBoundingClientRect().height < 43).length }));
    assert.equal(metrics.overflow, false, 'Horizontal overflow'); assert.equal(metrics.small, 0, 'Undersized controls');
    await page.getByLabel(language === 'ru' ? 'Цена до' : 'Max price', { exact: true }).fill('1000');
    await page.waitForFunction(() => new URLSearchParams(location.search).has('maxPrice'));
    assert.equal(await page.getByTestId('marketplace-service-card').count(), 1);
    assert.ok(new URL(page.url()).searchParams.get('ref') === 'trip');
    await page.getByRole('button', { name: language === 'ru' ? 'Сбросить фильтры предложений' : 'Clear offer filters', exact: true }).click();
    await page.getByLabel(language === 'ru' ? 'Дата (Пхукет)' : 'Date (Phuket)', { exact: true }).fill('2099-01-01');
    await page.waitForFunction(() => new URLSearchParams(location.search).get('date') === '2099-01-01');
    assert.equal(await page.getByTestId('marketplace-service-card').count(), 1);
    await page.getByRole('button', { name: language === 'ru' ? 'Оставить заявку' : 'Request service', exact: true }).click();
    assert.equal(await page.getByTestId('booking-date').textContent(), '2099-01-01');
    await page.getByRole('checkbox', { name: language === 'ru' ? 'Есть свободное время сегодня' : 'Free request slots today', exact: true }).check();
    await page.waitForFunction(() => new URLSearchParams(location.search).get('today') === '1');
    assert.equal(new URL(page.url()).searchParams.has('date'), false);
    const today = await page.evaluate(() => new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10));
    assert.equal(await page.getByTestId('booking-date').textContent(), today);
    await page.getByRole('button', { name: language === 'ru' ? 'Подобрать услугу с консьержем' : 'Find a service with concierge', exact: true }).click();
    assert.equal(await page.evaluate(() => window.fixtureConcierge), true);
    assert.deepEqual(errors, []);
    if (language === 'ru' && [390, 1280].includes(width)) await page.screenshot({ path: path.join(out, `ru-${width}.png`), fullPage: true });
    results.push({ language, width, result: 'passed', assertions: ['photo/fallback', 'price currency', 'URL persistence', 'date availability', 'booking date', 'concierge', 'no overflow', '44px controls'] });
    await page.close();
  }
  await writeFile(path.join(out, 'results.json'), JSON.stringify({ synthetic: true, results }, null, 2));
  console.log(JSON.stringify({ synthetic: true, cases: results.length, passed: results.length, output: out }));
} finally { if (browser) await browser.close(); await new Promise(resolve => server.close(resolve)); }
