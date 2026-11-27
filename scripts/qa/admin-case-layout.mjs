// Isolated UI QA only. All external requests are blocked; fixtures never enter the application.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { chromium } from '@playwright/test';

const root = process.cwd();
const sources = ['support', 'payments', 'disputes'];
const fixtures = Array.from({ length: 15 }, (_, index) => ({
  id: `synthetic-${index}`, source: sources[index % 3], reference: `QA-${index}`,
  subject: 'Проверка длинного заголовка обращения и переноса текста на узком экране',
  createdAt: '2026-11-27T01:00:00Z', deadline: index % 3 === 2 ? null : '2026-11-27T08:00:00Z',
  assignedTo: index % 2 ? 'qa-admin' : null, status: 'open',
  href: sources[index % 3] === 'support' ? `/admin/tickets/synthetic-${index}`
    : sources[index % 3] === 'payments' ? `/admin/operations?tab=manual-payments&request_id=synthetic-${index}`
      : `/admin/disputes?dispute_id=synthetic-${index}`,
}));
const virtual = {
  '\0qa-admin-layout': `import React from 'react'; import {createRoot} from 'react-dom/client';
    import {MemoryRouter} from 'react-router-dom';
    import {AdminCaseList} from '/src/components/admin/dashboard/AdminCaseList.tsx';
    import {AIROIReport} from '/src/components/admin/ai-insights/AIROIReport.tsx';
    import '/src/index.css';
    createRoot(document.getElementById('root')).render(React.createElement(MemoryRouter,null,
      React.createElement('main',{className:'mx-auto max-w-screen-xl p-4'},React.createElement(new URLSearchParams(location.search).get('surface')==='quality'?AIROIReport:AdminCaseList))));`,
  '\0qa-admin-language': `export const useLanguage=()=>({language:new URLSearchParams(location.search).get('lang')||'ru',t:key=>key});`,
  '\0qa-admin-quality': `export const useROIReport=()=>{const failed=new URLSearchParams(location.search).get('mode')==='error';
    return {data:failed?undefined:{period:'14 days',summary:'Synthetic quality report for isolated layout QA.',strengths:[],weaknesses:[],recommendation:'KEEP',nextSteps:[],metrics:{listingsAnalyzed:0,avgQualityScore:null,suspiciousDetected:0,adminReviewRate:0,aiAccuracyProxy:null}},
      isLoading:false,isError:failed,refetch:()=>{window.qaQualityRefreshes=(window.qaQualityRefreshes||0)+1;}};};`,
  '\0qa-admin-cases': `const fixtures=${JSON.stringify(fixtures)};
    export const useAdminDashboardCases=view=>{const mode=new URLSearchParams(location.search).get('mode');
      return {data: mode==='error'?undefined:{items:mode==='empty'?[]:fixtures.filter(item=>view==='all'||item.source==='support'&&(view==='mine'?item.assignedTo==='qa-admin':!item.assignedTo)),unavailable:mode==='partial'?['payments']:[]},
        isLoading:false,isFetching:false,isError:mode==='error',admitted:true,actorId:'qa-admin',dataUpdatedAt:Date.now(),refetch:()=>{window.qaRefreshes=(window.qaRefreshes||0)+1;}};};`,
};
const server = await createServer({
  cacheDir: path.join(root, 'tmp', 'qa-admin', 'vite-cache'),
  optimizeDeps: {
    entries: [],
    noDiscovery: true,
    include: ['react', 'react-dom/client', 'react/jsx-runtime', 'react-router-dom', 'lucide-react', '@radix-ui/react-slot', 'class-variance-authority', 'clsx', 'tailwind-merge'],
  },
  root, configFile: false, plugins: [react(), {
    name: 'isolated-admin-layout',
    resolveId(id) { if (id in virtual) return id; },
    load(id) { return virtual[id]; },
    configureServer(dev) { dev.middlewares.use('/__admin_layout', (_req, res) => {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/@id/__x00__qa-admin-layout"></script></body></html>');
    }); },
  }],
  resolve: { alias: [
    { find: '@/hooks/useAdminDashboardCases', replacement: '\0qa-admin-cases' },
    { find: '@/contexts/LanguageContext', replacement: '\0qa-admin-language' },
    { find: '@/hooks/useAIInsights', replacement: '\0qa-admin-quality' },
    { find: '@', replacement: path.join(root, 'src') },
  ] },
  server: { host: '127.0.0.1', port: 0, hmr: false },
});
let browser;
try {
  await server.listen();
  const base = `http://127.0.0.1:${server.httpServer.address().port}/__admin_layout`;
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  await mkdir(path.join(root, 'tmp', 'qa-admin'), { recursive: true });
  let checked = 0;
  for (const language of ['ru', 'en', 'th']) {
    for (const width of [375, 390, 430, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`${base}?lang=${language}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.locator('#admin-case-list').waitFor();
      assert.equal(await page.locator('li').count(), 5);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${language} overflow at ${width}`);
      const small = await page.locator('button, li a').evaluateAll(elements => elements.filter(element => element.getBoundingClientRect().height < 43.5).map(element => element.textContent));
      assert.deepEqual(small, [], `${language} small targets at ${width}`);
      await page.screenshot({ path: path.join(root, 'tmp', 'qa-admin', `cases-${language}-${width}.png`), fullPage: true });
      checked++;
    }
  }
  await page.goto(`${base}?lang=en`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.getByRole('button', { name: 'Show more' }).click();
  assert.equal(await page.locator('li').count(), 15);
  await page.getByRole('button', { name: 'My support cases' }).click();
  assert.equal(await page.locator('li').count(), 2);
  await page.getByRole('button', { name: 'Refresh cases' }).click();
  assert.equal(await page.evaluate(() => window.qaRefreshes), 1);
  for (const mode of ['empty', 'error', 'partial']) {
    await page.goto(`${base}?lang=en&mode=${mode}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.locator('#admin-case-list').waitFor();
    if (mode === 'empty') assert.ok(await page.getByText('No cases match this view.').isVisible());
    else assert.ok(await page.getByRole('alert').isVisible());
    if (mode === 'partial') assert.equal(await page.locator('li').count(), 5);
  }
  for (const language of ['ru', 'en', 'th']) {
    for (const width of [375, 390, 430, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`${base}?lang=${language}&surface=quality`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.getByText(language === 'ru' ? 'Качество AI-анализа за 14 дней' : 'AI analysis quality over 14 days', { exact: true }).waitFor();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `quality ${language} overflow at ${width}`);
      const small = await page.locator('button, a').evaluateAll(elements => elements.filter(element => element.getBoundingClientRect().height < 43.5).map(element => element.textContent));
      assert.deepEqual(small, [], `quality ${language} small targets at ${width}`);
      assert.equal(await page.getByText('—%', { exact: true }).count(), 0);
      await page.screenshot({ path: path.join(root, 'tmp', 'qa-admin', `quality-${language}-${width}.png`), fullPage: true });
      checked++;
    }
  }
  await page.goto(`${base}?lang=en&surface=quality`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.evaluate(() => { window.print = () => { window.qaPrints = (window.qaPrints || 0) + 1; }; });
  await page.getByRole('button', { name: 'Print page' }).click();
  assert.equal(await page.evaluate(() => window.qaPrints), 1);
  assert.equal(await page.getByRole('link', { name: 'Open catalogue' }).getAttribute('href'), '/admin/catalog');
  await page.goto(`${base}?lang=en&surface=quality&mode=error`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.getByRole('alert').waitFor();
  await page.getByRole('button', { name: 'Retry' }).click();
  assert.equal(await page.evaluate(() => window.qaQualityRefreshes), 1);
  assert.deepEqual(errors, []);
  console.log(`PASS: ${checked} viewport/language layouts across cases and AI quality; case actions/states, quality print/catalogue/retry; external requests blocked.`);
} finally {
  await browser?.close();
  await server.close();
}
