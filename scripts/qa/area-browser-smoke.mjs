/** Isolated, read-only browser smoke. All backend requests are synthetic.
 * Run against Vite with VITE_SUPABASE_URL=https://area-fixture.invalid and
 * VITE_SUPABASE_PUBLISHABLE_KEY=fixture-anon. Never runs seed/teardown writers.
 * Screenshots intentionally keep real image network failures visible.
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const out = process.env.AREA_SCREENSHOT_DIR || '/tmp/myuno-area-evidence';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
const results = [];
for (const width of [320, 390, 430, 1440]) {
 const page = await browser.newPage({ viewport: { width, height: 900 } });
 const errors = [];
 const queries = [];
 page.on('pageerror', error => errors.push(error.message));
 await page.route('https://area-fixture.invalid/**', async route => {
  const request = route.request();
  const url = new URL(request.url());
  const table = url.pathname.split('/').pop();
  queries.push({ method: request.method(), table, params: Object.fromEntries(url.searchParams) });
  if (request.method() === 'HEAD') return route.fulfill({ status: 200, headers: { 'content-range': '0-0/2', 'access-control-expose-headers': 'content-range' }, body: '' });
  const district = url.searchParams.get('district')?.replace(/^eq\./, '') || 'Kamala';
  let data = [];
  if (table === 'public_property_catalog') data = [{ id: '11111111-1111-4111-8111-111111111111', title: 'Synthetic rental', title_en: 'Synthetic rental', title_ru: 'Тестовая аренда', district, listing_type: 'rent', is_active: true, approval_status: 'approved', images: [], amenities: [], equipment: [], price_per_night: 2500, max_guests: 2 }];
  if (table === 'property_projects') data = [{ id: '22222222-2222-4222-8222-222222222222', name_en: 'Synthetic project', name_ru: 'Тестовый проект', district, is_active: true, project_status: 'construction', amenities: [] }];
  if (table === 'resale_properties') data = [{ id: '33333333-3333-4333-8333-333333333333', title: 'Synthetic resale', zone: 'Kamala', status: 'active', asking_price: 5000000, media: [] }];
  return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) });
 });
 await page.goto('http://localhost:8099/?lang=en');
 await page.locator('.home-area-gallery').getByRole('link', { name: 'Kamala', exact: true }).waitFor();
 await page.screenshot({ path: `${out}/home-${width}.png`, fullPage: true });
 const link = page.locator('.home-area-gallery').getByRole('link', { name: 'Kamala', exact: true });
 await link.focus();
 await page.keyboard.press('Enter');
 await page.waitForURL('**/area/kamala');
 await page.getByRole('heading', { name: 'Kamala', exact: true }).waitFor();
 await page.getByRole('heading', { name: 'New-build projects · 2', exact: true }).waitFor();
 const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
 await page.screenshot({ path: `${out}/area-${width}.png`, fullPage: true });
 await page.getByRole('link', { name: 'Open search →', exact: true }).first().click();
 await page.waitForURL(url => url.pathname.includes('/property/') && url.searchParams.get('district') === 'kamala');
 const rentalSearch = page.url();
 await page.goBack();
 await page.getByRole('heading', { name: 'Kamala', exact: true }).waitFor();
 await page.getByRole('link', { name: 'Open search →', exact: true }).last().click();
 await page.waitForURL(url => url.pathname === '/property/resale' && url.searchParams.get('zone') === 'Kamala');
 await page.getByText('Synthetic resale', { exact: true }).waitFor();
 const resaleSearch = page.url();
 await page.goBack();
 await page.getByRole('heading', { name: 'Kamala', exact: true }).waitFor();
 results.push({ width, overflow, errors, rentalSearch, resaleSearch, queries, media: await page.locator('img').evaluateAll(images => images.map(image => ({ src: image.src, loaded: image.complete && image.naturalWidth > 0 }))) });
 await page.close();
}
// Actual component empty/error/retry states, isolated from production.
const statePage = await browser.newPage({ viewport: { width: 390, height: 900 } });
let state = 'empty';
await statePage.route('https://area-fixture.invalid/**', async route => {
 if (state === 'error') return route.fulfill({status:503, contentType:'application/json', body:JSON.stringify({message:'Synthetic read failure'})});
 if (route.request().method() === 'HEAD') return route.fulfill({status:200, headers:{'content-range':`0-0/${state === 'empty' ? 0 : 1}`, 'access-control-expose-headers':'content-range'}, body:''});
 return route.fulfill({status:200,contentType:'application/json',body:'[]'});
});
await statePage.goto('http://localhost:8099/area/nai-yang?lang=en');
await statePage.getByText('No published listings yet.', {exact:true}).first().waitFor();
if (await statePage.getByRole('link', {name:'Open search →',exact:true}).count()) throw Error('Empty category exposed a search action');
await statePage.screenshot({path:`${out}/empty-390.png`,fullPage:true});
state = 'error';
await statePage.reload();
await statePage.getByText('Could not check listings.', {exact:true}).first().waitFor();
await statePage.screenshot({path:`${out}/error-390.png`,fullPage:true});
state = 'supply';
await statePage.getByRole('button', {name:'Try again',exact:true}).first().click();
await statePage.getByRole('heading', {name:'Rental properties · 1',exact:true}).waitFor();
await statePage.close();
await browser.close();
await writeFile(`${out}/results.json`, JSON.stringify(results, null, 2));
console.log(JSON.stringify(results.map(({ width, overflow, errors, rentalSearch, resaleSearch, media }) => ({ width, overflow, errors, rentalSearch, resaleSearch, media })), null, 2));
if (results.some(result => result.overflow || result.errors.length)) process.exitCode = 1;
