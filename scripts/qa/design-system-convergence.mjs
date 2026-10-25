// Actual public/PMS/admin components with synthetic reads and no production transport.
import { readFile, writeFile, mkdir, cp } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';
import postcss from 'postcss';
import postcssImport from 'postcss-import';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

const root = process.cwd();
const output = path.resolve(process.argv[2]);
const baseline = process.argv.includes('--baseline');
const tokensPath = path.join(root, 'src/styles/tokens.css');
const originalTokens = await readFile(tokensPath, 'utf8');
const variants = baseline ? ['normal'] : ['normal', 'rebrand'];
await mkdir(output, { recursive: true });
const run = (args, env = {}) => new Promise((resolve, reject) => {
  const child = spawn(process.execPath, args, { cwd: root, env: { ...process.env, ...env }, stdio: 'inherit' });
  child.on('error', reject); child.on('exit', code => code === 0 ? resolve() : reject(Error(`Fixture build failed ${code}`)));
});
const rebrand = originalTokens.replace(/--brand-hue:\s*213;/, '--brand-hue: 160;')
  .replace(/--font-family-display:\s*'Source Serif 4';/, '--font-family-display: monospace;')
  .replace(/--font-family-body:\s*'Geist';/, '--font-family-body: serif;')
  .replace(/--layout-inset-scale:\s*1;/, '--layout-inset-scale: 1.5;')
  .replace(/--section-space-scale:\s*1;/, '--section-space-scale: 1.75;')
  .replace(/--card-padding:\s*1rem;/, '--card-padding: 1.5rem;')
  .replace(/--layout-width-wide:\s*80rem;/, '--layout-width-wide: 72rem;');
if (!baseline && rebrand === originalTokens) throw Error('Canonical rebrand tokens not found');
const cssByVariant = {};
for (const variant of variants) {
  const source = await readFile(path.join(root, 'src/index.css'), 'utf8');
  const css = await postcss([postcssImport({ load: async file => file === tokensPath && variant === 'rebrand' ? rebrand : readFile(file, 'utf8') }), tailwindcss(path.join(root, 'tailwind.config.ts')), autoprefixer()]).process(source, { from: path.join(root, 'src/index.css') });
  cssByVariant[variant] = css.css;
}
// Local CSS-only producer, never the SPA/auth/backend. The existing home builder
// explicitly supports a CSS origin and synthetic read adapters.
const cssServer = createServer((req, res) => {
  if (req.method !== 'GET') { res.writeHead(405); res.end(); return; }
  const file = req.url.split('?')[0];
  if (file === '/src/index.css') { res.writeHead(200, { 'Content-Type': 'text/css' }); res.end(cssByVariant.normal); }
  else if (file === '/src/styles/cinematic-home.css') readFile(path.join(root, file.slice(1)), 'utf8').then(css => { res.writeHead(200, { 'Content-Type': 'text/css' }); res.end(css); });
  else { res.writeHead(404); res.end(); }
});
await new Promise(resolve => cssServer.listen(0, '127.0.0.1', resolve));
try {
  await run(['scripts/qa/homepage-galleries-ui.mjs', '--build-only'], { HOME_GALLERY_OUTPUT: path.join(output, 'public'), HOME_GALLERY_CSS_ORIGIN: `http://127.0.0.1:${cssServer.address().port}` });
} finally { await new Promise(resolve => cssServer.close(resolve)); }
await run(['scripts/qa/today-ui.mjs', '--bundle-only']);
await cp('/tmp/browser/today-isolated', path.join(output, 'pms'), { recursive: true });
await run(['scripts/qa/admin-dashboard-ui.mjs', '--bundle-only'], { ADMIN_DASHBOARD_OUTPUT: path.join(output, 'admin') });

const probes = `import React from 'react';import{createRoot}from'react-dom/client';import{Button}from'${root}/src/components/ui/button.tsx';import{Input}from'${root}/src/components/ui/input.tsx';import{StatusPill}from'${root}/src/components/ui/status-pill.tsx';import{ThemeProvider,useTheme}from'${root}/src/contexts/ThemeContext.tsx';
const el=document.createElement('aside');el.dataset.testid='ds-probes';el.className='flex flex-wrap items-center gap-3 border-b border-border bg-card p-4';document.body.prepend(el);function Probes(){const{resolvedTheme,setTheme}=useTheme();return <><span className="text-xs text-muted-foreground">Synthetic design acceptance controls</span><Button data-ds-primary>Primary action</Button><Button data-testid="ds-theme-toggle" onClick={()=>setTheme(resolvedTheme==='dark'?'light':'dark')}>Theme</Button><Input data-testid="ds-draft" aria-label="Synthetic unsaved draft" placeholder="Synthetic unsaved draft" />{['active','warning','danger'].map(status=><StatusPill key={status} status={status} data-ds-status={status}>{status}</StatusPill>)}</>;}createRoot(el).render(<ThemeProvider><Probes/></ThemeProvider>);`;
await build({ stdin: { contents: probes, loader: 'tsx', resolveDir: root }, bundle: true, outfile: path.join(output, 'probes.js'), format: 'esm', jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"' }, plugins: [{ name: 'alias', setup(b) {
  b.onResolve({ filter: /^@\// }, args => {
    if (args.path === '@/integrations/supabase/client') return { path: args.path, namespace: 'no-backend' };
    if (/hooks\/use(HapticFeedback|SoundEffects|FeedbackSettings)$/.test(args.path)) return { path: args.path, namespace: 'silent-feedback' };
    const base = path.join(root, 'src', args.path.slice(2));
    return { path: [base + '.ts', base + '.tsx'].find(file => existsSync(file)) };
  });
  b.onLoad({ filter: /.*/, namespace: 'silent-feedback' }, () => ({ contents: 'export const triggerHaptic=()=>{};export const playSound=()=>{};export const isTypingKey=()=>false;export const getFeedbackSettings=()=>({hapticEnabled:false,soundEnabled:false});', loader: 'js' }));
  b.onLoad({ filter: /.*/, namespace: 'no-backend' }, () => ({ contents: 'export const supabase={auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},from(){throw Error("Real profile writes forbidden")}};', loader: 'js' }));
} }] });
const workspaceCss = '.fixture-admin-workspace{display:block}.fixture-admin-workspace>aside{display:none}.fixture-admin-workspace>main{min-width:0}@media(min-width:768px){.fixture-admin-workspace{display:grid;grid-template-columns:240px minmax(0,1fr)}.fixture-admin-workspace>aside{display:block}}';
for (const role of ['public', 'pms', 'admin']) {
  const folder = path.join(output, role); await mkdir(folder, { recursive: true });
  await cp(path.join(output, 'probes.js'), path.join(folder, 'probes.js'));
  for (const variant of variants) {
    const extra = role === 'public' ? await readFile(path.join(root, 'src/styles/cinematic-home.css'), 'utf8') : role === 'admin' ? workspaceCss : '';
    await writeFile(path.join(folder, `${variant}.css`), cssByVariant[variant] + '\n' + extra);
  }
  await writeFile(path.join(folder, 'fixture.html'), '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/variant.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script><script type="module" src="/probes.js"></script></body></html>');
}
const changed = execFileSync('git', ['diff', '--name-only'], { cwd: root, encoding: 'utf8' }).trim().split('\n').filter(file => /^(src\/|tailwind.config|index.html)/.test(file));
const sourceInputs = [...new Set([...changed, 'src/pages/Landing.tsx', 'src/pages/mc/operations/PmsTodayPage.tsx', 'src/pages/admin/AdminDashboard.tsx', 'src/contexts/ThemeContext.tsx', 'src/components/ui/button.tsx', 'src/components/ui/input.tsx', 'src/components/ui/status-pill.tsx'])];
const hashes = Object.fromEntries(await Promise.all(sourceInputs.map(async file => [file, createHash('sha256').update(await readFile(path.join(root, file))).digest('hex')])));
await writeFile(path.join(output, 'source-provenance.json'), JSON.stringify({ root, baseline, canonicalTokenSHA256: createHash('sha256').update(originalTokens).digest('hex'), sourceInputs: hashes, variants, mutationSource: 'only src/styles/tokens.css loaded by PostCSS; no page edits', realComponents: ['Landing', 'PmsTodayPage', 'AdminDashboard', 'ThemeProvider', 'Button', 'Input', 'StatusPill'], boundaries: ['synthetic catalog/read/auth hooks', 'admin sidebar frame', 'no real transport'], liveFontsVerified: false }, null, 2));
console.log(`Built isolated design acceptance assets at ${output}; no browser acceptance claimed yet.`);
