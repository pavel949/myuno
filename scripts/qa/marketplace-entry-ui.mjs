import { radixOverlayAliases } from '../radix-overlay-resolution.mjs';
import { build } from 'esbuild';
import postcss from 'postcss';
import postcssImport from 'postcss-import';
import tailwindcss from 'tailwindcss';
import { createServer } from 'node:http';
import { spawnSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';

const root = process.cwd();
const out = path.resolve(process.env.MARKETPLACE_ENTRY_QA_OUTPUT ?? '/tmp/myuno-marketplace-entry');
await mkdir(out, { recursive: true });
await build({
  stdin: { resolveDir: root, loader: 'tsx', contents: `
    import React from 'react'; import {createRoot} from 'react-dom/client';
    import {BrowserRouter,Route,Routes} from 'react-router-dom';
    import {HomeHeroChoices} from '@/components/home/HomeHeroChoices';
    import {MarketplaceEntry} from '@/components/landing/MarketplaceEntry';
    import DiscoveryHubPage from '@/pages/discover/DiscoveryHubPage';
    import {PlatformJourneyLinks} from '@/components/landing/PlatformJourneyLinks';
    import GoalEntryPage from '@/pages/discover/GoalEntryPage';
    import '@/styles/homepage-refinement.css';
    const entries = [
      ['/property/rent','rent'], ['/discover/buy','buy'],
      ['/experiences','experiences'], ['/services','services'],
      ['/property','property'], ['/discover','discovery'], ['/discover/live','live'],
    ];
    createRoot(document.getElementById('root')).render(<BrowserRouter><main>
      <Routes><Route path="/" element={<div className="ds-frame ds-frame-catalogue home-refined"><HomeHeroChoices/></div>}/>
      {entries.map(([url,kind])=><Route key={url} path={url} element={kind==="discovery"?<DiscoveryHubPage/>:kind==="buy"||kind==="live"?<GoalEntryPage goal={kind}/>:<div className="ds-frame ds-frame-catalogue"><MarketplaceEntry kind={kind}/>{kind==="property"&&<div className="py-4"><PlatformJourneyLinks journey="property"/></div>}</div>}/>)}</Routes>
    </main></BrowserRouter>);
  `},
  bundle: true, format: 'esm', jsx: 'automatic', outfile: path.join(out, 'fixture.js'),
  loader: { '.webp': 'file', '.svg': 'file', '.png': 'file' }, alias: radixOverlayAliases,
  plugins: [{ name: 'isolated-buy-boundaries', setup(build) {
    const isolated = {
      '@/contexts/LanguageContext': "export const useLanguage=()=>({language:sessionStorage.getItem('fixture-language')||'en'})",
      '@/components/layout/AppLayout': 'export const AppLayout=({children})=>children',
      '@/components/seo/SEOHead': 'export const SEOHead=()=>null',
      '@/pages/services/ServicesIndex': 'export default function(){throw Error("Unexpected Services in Buy fixture")}',
      '@/components/property/PropertySearchRedirect': 'export default function(){throw Error("Unexpected search redirect in Buy fixture")}',
    };
    build.onResolve({ filter: /^@\// }, args => Object.hasOwn(isolated, args.path) ? ({ path: args.path, namespace: 'isolated' }) : undefined);
    build.onLoad({ filter: /.*/, namespace: 'isolated' }, args => ({ contents: isolated[args.path] }));
  }}],
});
const css = await postcss([postcssImport(), tailwindcss(path.join(root, 'tailwind.config.ts'))])
  .process(await readFile('src/index.css','utf8'), { from: path.join(root,'src/index.css') });
await writeFile(path.join(out, 'base.css'), css.css);
const html = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/base.css"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>';
const server = createServer(async (req,res) => {
  const file = path.basename(new URL(req.url, 'http://localhost').pathname);
  if (!file.includes('.')) { res.setHeader('content-type','text/html; charset=utf-8'); res.end(html); return; }
  try {
    res.setHeader('content-type', file.endsWith('.css') ? 'text/css' : file.endsWith('.js') ? 'application/javascript' : 'image/webp');
    res.end(await readFile(path.join(out,file)));
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
const rows = [];
try {
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
  for (const language of ['ru','en','th']) for (const width of [320,375,390,768,1440]) {
    const context = await browser.newContext({ viewport: {width,height: 850}, serviceWorkers: 'block' });
    await context.addInitScript(value => sessionStorage.setItem('fixture-language', value), language);
    const blocked = [], errors = [];
    await context.route('**/*', route => route.request().url().startsWith(origin + '/')
      ? route.continue() : (blocked.push(route.request().url()),route.abort()));
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    for (const [kind, href] of [['rent','/property/rent'],['buy','/discover/buy'],['experiences','/experiences'],['services','/services'],['property','/property'],['discovery','/discover'],['live','/discover/live']]) {
      if (['property','discovery','live'].includes(kind)) { await page.goto(origin+href); } else {
      await page.goto(origin);
      const link = page.locator(`.home-hero-choice-grid a[href="${href}"]`);
      await link.focus();
      if (!(await link.evaluate(node => node.matches(':focus-visible')))) throw Error('Missing keyboard focus ' + href);
      await page.keyboard.press('Enter');
      await page.waitForURL(origin + href);
      }
      const intro = page.locator(`[data-marketplace-entry="${kind}"]`);
      await intro.waitFor();
      if (await page.locator('h1').count() !== 1 || !(await intro.innerText()).includes('myUNO')) throw Error('Missing managed marketplace heading ' + href);
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw Error('Overflow ' + href + ' ' + language + ' ' + width);
      if (width >= 768) await intro.locator('img').evaluate(async image => { await image.decode(); });
      if (kind === 'buy') {
        const menu = page.getByTestId('buy-discovery-menu');
        const primary = ['/property/resale','/property/offplan/search','/property/search?mode=buy'];
        const routes = await menu.getByRole('link').evaluateAll(links => links.map(link => link.getAttribute('href')));
        if (JSON.stringify(routes) !== JSON.stringify(primary)) throw Error('Buy primary routes changed: ' + JSON.stringify(routes));
        for (const target of await menu.getByRole('link').all()) {
          const box = await target.boundingBox();
          if (!box || box.height < 44 || box.width < 44) throw Error('Buy card touch target is too small');
        }
        for (const secondary of ['/property/consultation','/invest']) {
          if (await menu.locator(`a[href="${secondary}"]`).count() || !await page.locator(`a[href="${secondary}"]`).isVisible()) {
            throw Error('Buy secondary route missing or promoted: ' + secondary);
          }
        }
        await page.screenshot({path:path.join(out,`${kind}-${language}-${width}.png`)});
      } else await page.screenshot({path:path.join(out,`${kind}-${language}-${width}.png`)});
      if (kind === 'property') {
        if (await page.locator('.marketplace-choice').count() !== 4) throw Error('Property journeys lost');
      }
      if (kind === 'discovery' && await page.locator('.marketplace-choice').count() !== 4) throw Error('Discovery goals lost');
      for (const choice of await page.locator('.marketplace-choice').all()) {
        const box=await choice.boundingBox();
        if (!box || box.width < 44 || box.height < 44) throw Error('Small category target');
        const clipped=await choice.evaluate(node=>node.scrollWidth>node.clientWidth+1);
        if (clipped) throw Error('Clipped category text '+kind+' '+width+' '+language);
      }
      rows.push({language,width,kind,href,pass:true});
    }
    if (blocked.length || errors.length) throw Error(JSON.stringify({blocked,errors}));
    await context.close();
  }
  await writeFile(path.join(out,'results.json'), JSON.stringify(rows,null,2));
  console.log(`${rows.length} marketplace entry checks passed`);
} finally {
  await browser?.close();
  server.close();
}

// The design gate already runs this suite. Verify the actual service overview
// under the same isolated network boundary, not merely its shared masthead.
const serviceEntry = spawnSync(process.execPath, ['scripts/qa/services-discovery-ui.mjs'], {
  env: { ...process.env, SERVICES_DISCOVERY_OUTPUT: path.join(out, 'services-catalogue'),
    SERVICES_DISCOVERY_SCOPE: 'marketplace-entry', SERVICES_DISCOVERY_WIDTHS: '320,390,1440',
    SERVICES_DISCOVERY_THEMES: 'light,dark' },
  stdio: 'inherit', timeout: 180_000,
});
if (serviceEntry.status !== 0) throw (serviceEntry.error ?? Error('Service marketplace entry verification failed'));
