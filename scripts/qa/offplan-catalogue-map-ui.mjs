// Actual newbuild catalogue/map/detail UX over isolated data; no live stores or writes.
// Reuse the byte-verified public basemap artifact from the existing map-browser check.
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium, expect } from '@playwright/test';
import postcss from 'postcss';
import postcssImport from 'postcss-import';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

const root = process.cwd();
const origin = 'http://offplan-fixture.invalid';
// Wide enough to include place labels in the short, mobile catalogue map.
const initialCamera = '7.98,98.31,11';
const mapOutput = process.env.MAP_UI_OUTPUT || '/tmp/browser/map-isolated';
const output = path.join(mapOutput, 'offplan-catalogue');
mkdirSync(output, { recursive: true });
const canonicalProject = { id: 'synthetic-ocean', nameEn: 'Synthetic Ocean Residences', nameRu: 'Тестовый проект', district: 'Bang Tao',
  lat: 8.01, lng: 98.33, coverImage: '/fixture.svg', priceFrom: 4500000, developerName: 'Synthetic developer', amenities: [], isActive: true };
const records = [
  canonicalProject,
  { ...canonicalProject, id: 'synthetic-missing', nameEn: 'Synthetic Ocean without map coordinates', lat: null, lng: null },
  { ...canonicalProject, id: 'synthetic-other', nameEn: 'Synthetic Lagoon Villas', lat: 8.02, lng: 98.35 },
];
const doc = { id: 'public-doc', project_id: canonicalProject.id, category: 'marketing', title: 'Synthetic public brochure',
  file_url: '/assets/fixture-brochure.pdf', visibility: 'public', version: 1, is_current: true };
const docs = [
  doc,
  { ...doc, id: 'private-doc', title: 'Private fixture', visibility: 'kyc' },
  { ...doc, id: 'older-doc', title: 'Historic fixture', is_current: false },
  { ...doc, id: 'wrong-project-doc', title: 'Other project fixture', project_id: 'synthetic-other' },
];
const virtual = {
  '@/contexts/LanguageContext': "export const useLanguage=()=>({language:'en',t:key=>key});",
  '@/contexts/CurrencyContext': "export const useCurrency=()=>({formatPrice:n=>String(n),currency:'THB'});",
  '@/contexts/AuthContext': 'export const useAuth=()=>({user:null,session:null,isLoading:false});',
  '@/contexts/LocationContext': "export const useLocation=()=>({currentCity:{default_currency:'THB'}});",
  '@/hooks/useOffplanProjects': `const rows=${JSON.stringify(records)}; export const useOffplanProjects=({district}={})=>({data:rows.filter(row=>!district||row.district===district),isLoading:false,isError:false});export const useProjectDistricts=()=>({data:['Bang Tao']});export const useOffplanProject=id=>({data:rows.find(row=>row.id===id),isLoading:false,isError:false});`,
  '@/hooks/useDevelopers': 'export const useDevelopers=()=>({data:[]});export const useDeveloper=()=>({data:null});',
  '@/hooks/useNewbuildProjects': 'export const useNewbuildProject=()=>({data:null});',
  '@/hooks/useProjectUnits': 'export const useProjectUnits=()=>({data:[],isLoading:false,isError:false});',
  '@/hooks/useUserCollections': "export const useUserCollections=()=>({isInCollection:()=>false,toggleCollection:()=>{throw Error('Writes forbidden')}});",
  '@/components/landings/LandingLeadForm': 'export const LandingLeadForm=()=>null;',
  '@/components/seo': 'export const SEOHead=()=>null,createBreadcrumbSchema=()=>({}),createRealEstateListingSchema=()=>({});',
  '@/integrations/supabase/client': `const docs=${JSON.stringify(docs)};window.fixtureDocumentReads=[];export const supabase={
   from(table){if(table!=='project_documents')throw Error('Only the synthetic document read is allowed');
    const filters={};let columns;
    return {select(value){columns=value;return this},eq(key,value){filters[key]=value;return this},order(){return this},
      then(resolve){window.fixtureDocumentReads.push({columns,filters});resolve({data:docs.filter(row=>Object.entries(filters).every(([k,v])=>row[k]===v)),error:null})}};
   }
  };`,
};
const entry = `import React from'react';import{createRoot}from'react-dom/client';import{BrowserRouter,Routes,Route}from'react-router-dom';import{QueryClient,QueryClientProvider}from'@tanstack/react-query';import Index from'@/pages/property/OffplanIndex';import Detail from'@/pages/property/OffplanDetail';import{APP_ROUTES}from'@/lib/config/routes';const qc=new QueryClient({defaultOptions:{queries:{retry:false}}});createRoot(document.getElementById('root')).render(<QueryClientProvider client={qc}><BrowserRouter future={{v7_startTransition:true,v7_relativeSplatPath:true}}><main><Routes><Route path={APP_ROUTES.OFFPLAN_SEARCH} element={<Index/>}/><Route path={APP_ROUTES.OFFPLAN_DETAIL(':id')} element={<Detail/>}/></Routes></main></BrowserRouter></QueryClientProvider>);`;
const result = await build({
  stdin: { contents: entry, loader: 'tsx', resolveDir: root },
  outfile: path.join(output, 'fixture.js'), bundle: true, format: 'esm', jsx: 'automatic', metafile: true,
  define: { 'process.env.NODE_ENV': '"production"', 'import.meta.env.VITE_PHUKET_PMTILES_URL': JSON.stringify(origin + '/phuket.pmtiles'), 'import.meta.env.DEV': 'false' },
  loader: { '.svg': 'file', '.png': 'file', '.webp': 'file' },
  plugins: [{ name: 'offplan-browser-synthetic', setup(bundle) {
    bundle.onResolve({ filter: /^@\// }, ({ path: spec }) => {
      if (Object.hasOwn(virtual, spec)) return { path: spec, namespace: 'fixture' };
      const lookup = path.join(root, 'src', spec.slice(2));
      const file = [lookup, lookup + '.ts', lookup + '.tsx', path.join(lookup, 'index.ts'), path.join(lookup, 'index.tsx')]
        .find(candidate => existsSync(candidate) && statSync(candidate).isFile());
      if (!file) throw Error('Unresolved source: ' + spec);
      return { path: file };
    });
    bundle.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ contents: virtual[args.path], loader: 'tsx', resolveDir: root }));
  } }],
});
const inputs = Object.keys(result.metafile.inputs);
const sources = [
  'src/pages/property/OffplanIndex.tsx', 'src/pages/property/OffplanDetail.tsx',
  'src/components/property/OffplanProjectMap.tsx', 'src/components/map/MapLibreMap.tsx',
  'src/components/property/OffplanProjectCard.tsx', 'src/hooks/useProjectDocuments.ts',
];
for (const file of [...sources, 'node_modules/maplibre-gl/dist/maplibre-gl.js']) assert(inputs.some(input => input === file || input.endsWith('/' + file)), 'Missing actual source: ' + file);
assert(!inputs.includes('src/integrations/supabase/client.ts'), 'Live Supabase client bundled');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const receipt = {
  head: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  actualSourceHashes: Object.fromEntries(await Promise.all(sources.map(async file => [file, hash(await readFile(file))]))),
  syntheticBoundaries: Object.keys(virtual),
};
await writeFile(path.join(output, 'source-receipt.json'), JSON.stringify(receipt, null, 2));
const fixtureCss = path.join(output, 'fixture.css');
const css = await postcss([postcssImport(), tailwindcss(), autoprefixer()]).process(await readFile('src/index.css', 'utf8'), { from: path.join(root, 'src/index.css') });
await writeFile(fixtureCss, css.css + '\n' + await readFile(fixtureCss, 'utf8'));
if (process.argv.includes('--build-only')) { console.log('Offplan fixture bundle ready:', output); process.exit(0); }
if (process.env.CI !== 'true' || process.env.GITHUB_ACTIONS !== 'true') throw Error('Run the isolated browser in GitHub CI; local use is --build-only');

const archive = await readFile(path.join(mapOutput, 'phuket.pmtiles'));
const archiveProof = JSON.parse(await readFile(path.join(mapOutput, 'basemap-source.json'), 'utf8'));
assert.equal(hash(archive), archiveProof.sha256, 'Existing map asset receipt mismatch');
assert.equal(archive.length, archiveProof.bytes);
const html = '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Newbuild QA only</title><link rel="stylesheet" href="/fixture.css"><div id="root"></div><script type="module" src="/fixture.js"></script></html>';
const cover = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 350"><rect width="600" height="350" fill="#a7b2bd"/><text x="40" y="50" fill="#222">SYNTHETIC PROJECT</text></svg>';
const routes = ['/property/offplan/search', '/property/offplan/' + canonicalProject.id];
const results = [];
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1000 }]) {
    const context = await browser.newContext({ viewport, hasTouch: viewport.width < 500, isMobile: viewport.width < 500, serviceWorkers: 'block' });
    const page = await context.newPage();
    const blocked = [], pageErrors = [], archiveRequests = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await context.route('**/*', async route => {
      const req = route.request(), url = new URL(req.url());
      if (req.method() !== 'GET' || url.origin !== origin) {
        blocked.push({ method: req.method(), origin: url.origin, path: url.pathname });
        return route.abort();
      }
      if (routes.includes(url.pathname)) return route.fulfill({ contentType: 'text/html', body: html });
      if (url.pathname === '/favicon.ico') return route.fulfill({ status: 204 });
      if (url.pathname === '/fixture.svg') return route.fulfill({ contentType: 'image/svg+xml', body: cover });
      if (url.pathname === '/fixture.js' || url.pathname === '/fixture.css') return route.fulfill({ path: path.join(output, url.pathname.slice(1)) });
      if (url.pathname === '/phuket.pmtiles') {
        const match = /^bytes=(\d+)-(\d*)$/.exec(req.headers().range || '');
        if (!match) return route.fulfill({ body: archive, headers: { 'Accept-Ranges': 'bytes' } });
        const start = Number(match[1]), end = match[2] ? Math.min(Number(match[2]), archive.length - 1) : archive.length - 1;
        if (start >= archive.length || end < start) return route.fulfill({ status: 416, headers: { 'Content-Range': `bytes */${archive.length}` } });
        archiveRequests.push([start, end]);
        return route.fulfill({ status: 206, body: archive.subarray(start, end + 1), headers: { 'Accept-Ranges': 'bytes', 'Content-Range': `bytes ${start}-${end}/${archive.length}` } });
      }
      const glyph = /^\/map-glyphs\/noto-sans-regular\/(\d+)-(\d+)\.pbf$/.exec(url.pathname);
      if (glyph && Number(glyph[1]) % 256 === 0 && Number(glyph[2]) === Number(glyph[1]) + 255 && Number(glyph[2]) <= 65535) {
        const local = path.join(root, 'public', url.pathname.slice(1));
        return existsSync(local) ? route.fulfill({ path: local, contentType: 'application/x-protobuf' }) : route.fulfill({ status: 404 });
      }
      // Production fonts/assets are not needed for behavioural and overflow evidence.
      if (/^\/fonts\/[\w.-]+$/.test(url.pathname)) return route.fulfill({ status: 404 });
      blocked.push({ method: req.method(), origin: url.origin, path: url.pathname });
      return route.abort();
    });
    const screenshot = name => page.screenshot({ path: path.join(output, `${viewport.width}-${name}.png`), fullPage: true, animations: 'disabled' });
    const fit = async label => {
      const dimensions = await page.evaluate(() => ({ viewport: innerWidth, page: document.documentElement.scrollWidth }));
      assert(dimensions.page <= dimensions.viewport + 1, `${label}: horizontal overflow ${JSON.stringify(dimensions)}`);
      return dimensions;
    };
    try {
      const query = new URLSearchParams({ q: 'Ocean', district: 'Bang Tao', ref: 'synthetic', mapViewport: initialCamera });
      await page.goto(origin + '/property/offplan/search?' + query);
      await expect(page.getByRole('heading', { name: 'Phuket New Developments' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'List', exact: true })).toHaveAttribute('aria-pressed', 'true');
      const list = await fit('list');
      await screenshot('list');
      await page.getByRole('button', { name: 'Map', exact: true }).click();
      const region = page.getByRole('region', { name: 'Project map' });
      const canvas = region.locator('canvas.maplibregl-canvas');
      await expect(region.locator('[data-map-render-state]')).toHaveAttribute('data-map-render-state', 'ready', { timeout: 60_000 });
      await expect(canvas).toBeVisible();
      const webgl = await canvas.evaluate(element => !!(element.getContext('webgl2') || element.getContext('webgl')));
      assert(webgl, 'No actual WebGL drawing context');
      try {
        await page.waitForFunction(() => Number(document.querySelector('[data-map-label-count]')?.getAttribute('data-map-label-count')) > 0, null, { timeout: 60_000 });
      } catch (error) {
        console.error('Offplan label evidence:', JSON.stringify({
          viewport, labels: await region.locator('[data-map-render-state]').getAttribute('data-map-label-count'),
          archiveRequests, blocked, pageErrors, url: page.url(),
        }));
        await screenshot('map-label-failure').catch(() => {});
        throw error;
      }
      await expect(region.locator('[data-marker-id]')).toHaveCount(1);
      await expect(region.locator('[data-marker-id="synthetic-ocean"]')).toBeVisible();
      await expect(page.getByText('Projects without map locations are still available in the list below.')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Synthetic Ocean without map coordinates' })).toBeVisible();
      await region.getByRole('button', { name: 'Zoom in' }).click();
      await page.waitForURL(url => url.searchParams.has('mapViewport') && url.searchParams.get('mapViewport') !== initialCamera);
      const camera = new URL(page.url()).searchParams.get('mapViewport');
      await region.locator('[data-marker-id="synthetic-ocean"]').click();
      const markerLink = region.getByRole('link', { name: canonicalProject.nameEn });
      await expect(markerLink).toHaveAttribute('href', routes[1]);
      const map = await fit('map with selected project');
      await screenshot('map');
      await markerLink.click();
      await page.waitForURL(origin + routes[1]);
      await expect(page.getByRole('heading', { name: canonicalProject.nameEn, level: 1 })).toBeVisible();
      const detail = await fit('detail');
      assert.equal(await page.evaluate(() => window.fixtureDocumentReads.length), 0, 'Documents fetched before opening tab');
      await page.getByRole('tab', { name: /^Docs/ }).click();
      await expect(page.getByRole('tab', { name: /^Docs/ })).toHaveAttribute('aria-selected', 'true');
      await expect(page.getByRole('link', { name: /Synthetic public brochure/ })).toHaveAttribute('href', doc.file_url);
      for (const title of ['Private fixture', 'Historic fixture', 'Other project fixture']) await expect(page.getByText(title)).toHaveCount(0);
      const reads = await page.evaluate(() => window.fixtureDocumentReads);
      assert.deepEqual(reads, [{ columns: 'id, project_id, category, title, file_url, visibility, version, is_current',
        filters: { project_id: canonicalProject.id, visibility: 'public', is_current: true } }]);
      const documents = await fit('document tab');
      await screenshot('documents');
      await page.getByRole('button', { name: 'Go back' }).first().click();
      await page.waitForURL(url => url.pathname === routes[0] && url.searchParams.get('mapProject') === canonicalProject.id);
      const backURL = new URL(page.url());
      for (const [key, value] of Object.entries({ q: 'Ocean', district: 'Bang Tao', ref: 'synthetic', view: 'map', mapViewport: camera })) assert.equal(backURL.searchParams.get(key), value);
      await expect(markerLink).toBeVisible();
      await expect(region.locator('[data-map-render-state]')).toHaveAttribute('data-map-render-state', 'ready', { timeout: 60_000 });
      assert(archiveRequests.length > 0, 'No verified archive ranges read');
      assert.deepEqual(pageErrors, []);
      assert.deepEqual(blocked, []);
      results.push({ viewport, webgl, camera, list, map, detail, documents, reads, archiveRequests, back: backURL.pathname + backURL.search });
    } finally { await context.close(); }
  }
} finally {
  await browser.close();
  await writeFile(path.join(output, 'results.json'), JSON.stringify({ ...receipt, archiveSha256: archiveProof.sha256, results }, null, 2));
}
console.log('Exact newbuild catalogue/map/detail browser acceptance:', results.map(result => result.viewport.width));
