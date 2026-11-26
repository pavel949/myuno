// Actual public/PMS/admin components with synthetic reads and no production transport.
import { readFile, writeFile, mkdir, cp } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';
import postcss from 'postcss';
import postcssImport from 'postcss-import';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

const root = process.cwd();
const sourceRoot = root.replaceAll('\\', '/');
const output = path.resolve(process.argv[2]);
const homeStyles = [
  'src/styles/cinematic-home.css',
  'src/styles/premium-public.css',
  'src/styles/homepage-refinement.css',
  'src/styles/home-reference.css',
  'src/styles/home-mobile-polish.css',
  'src/styles/marketplace-unity.css',
];
const baseline = process.argv.includes('--baseline');
const tokensPath = path.join(root, 'src/styles/tokens.css');
const originalTokens = await readFile(tokensPath, 'utf8');
const variants = baseline ? ['normal'] : ['normal', 'compact', 'rebrand'];
await mkdir(output, { recursive: true });
const run = (args, env = {}) => new Promise((resolve, reject) => {
  const child = spawn(process.execPath, args, { cwd: root, env: { ...process.env, ...env }, stdio: 'inherit' });
  child.on('error', reject); child.on('exit', code => code === 0 ? resolve() : reject(Error(`Fixture build failed ${code}`)));
});
// Change the canonical declarations, not a specific historical brand's values.
// Require every edit to take effect so a partial rebrand cannot mask a stale fixture.
function replaceToken(css, name, value) {
  const declaration = new RegExp(`^(\\s*--${name}:)[ \\t]*([^;\\r\\n]+);`, 'gm');
  const matches = [...css.matchAll(declaration)];
  if (matches.length !== 1 || matches[0][2].trim() === value) {
    throw Error(`Expected one changed canonical declaration for --${name}`);
  }
  return css.replace(declaration, (_, prefix) => `${prefix} ${value};`);
}
const rebrand = baseline ? originalTokens : Object.entries({
  'brand-hue': '160',
  'font-family-display': 'monospace',
  'font-family-body': 'serif',
  'layout-inset-scale': '1.5',
  'section-space-scale': '1.75',
  'card-padding': '1.5rem',
  'layout-width-wide': '72rem',
}).reduce((css, [name, value]) => replaceToken(css, name, value), originalTokens);
const compact = baseline ? originalTokens : replaceToken(originalTokens, 'section-space-scale', '0.25');
const cssByVariant = {};
for (const variant of variants) {
  const source = await readFile(path.join(root, 'src/index.css'), 'utf8');
  const css = await postcss([postcssImport({ load: async file => file === tokensPath && variant === 'rebrand' ? rebrand : file === tokensPath && variant === 'compact' ? compact : readFile(file, 'utf8') }), tailwindcss(path.join(root, 'tailwind.config.ts')), autoprefixer()]).process(source, { from: path.join(root, 'src/index.css') });
  cssByVariant[variant] = css.css;
}
const compiledIndex = path.join(output, 'index.css');
await writeFile(compiledIndex, cssByVariant.normal);
await run(['scripts/qa/homepage-galleries-ui.mjs', '--build-only'], {
  HOME_GALLERY_OUTPUT: path.join(output, 'public'),
  HOME_GALLERY_INDEX_CSS: compiledIndex,
});
await run(['scripts/qa/today-ui.mjs', '--bundle-only'], { PMS_TODAY_FIXTURE_OUTPUT: path.join(output, 'pms') });
await run(['scripts/qa/admin-dashboard-ui.mjs', '--bundle-only'], { ADMIN_DASHBOARD_OUTPUT: path.join(output, 'admin') });

const probes = `import React from 'react';import{createRoot}from'react-dom/client';import{Button}from'${sourceRoot}/src/components/ui/button.tsx';import{Input}from'${sourceRoot}/src/components/ui/input.tsx';import{StatusPill}from'${sourceRoot}/src/components/ui/status-pill.tsx';import{ThemeProvider,useTheme}from'${sourceRoot}/src/contexts/ThemeContext.tsx';
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
    const extra = role === 'public' ? (await Promise.all(homeStyles.map(file=>readFile(path.join(root,file),'utf8')))).join('\n') : role === 'admin' ? workspaceCss : '';
    await writeFile(path.join(folder, `${variant}.css`), cssByVariant[variant] + '\n' + extra);
  }
  await writeFile(path.join(folder, 'fixture.html'), '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/variant.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script><script type="module" src="/probes.js"></script></body></html>');
}
const changed = execFileSync('git', ['diff', '--name-only', '--diff-filter=ACMRT'], { cwd: root, encoding: 'utf8' }).trim().split('\n').filter(file => /^(src\/|tailwind.config|index.html)/.test(file));
const sourceInputs = [...new Set([...changed, ...homeStyles, 'src/pages/Landing.tsx', 'src/pages/mc/operations/PmsTodayPage.tsx', 'src/pages/admin/AdminDashboard.tsx', 'src/contexts/ThemeContext.tsx', 'src/components/ui/button.tsx', 'src/components/ui/input.tsx', 'src/components/ui/status-pill.tsx'])];
const hashes = Object.fromEntries(await Promise.all(sourceInputs.map(async file => [file, createHash('sha256').update(await readFile(path.join(root, file))).digest('hex')])));
await writeFile(path.join(output, 'source-provenance.json'), JSON.stringify({ root, baseline, canonicalTokenSHA256: createHash('sha256').update(originalTokens).digest('hex'), sourceInputs: hashes, variants, mutationSource: 'only src/styles/tokens.css loaded by PostCSS; no page edits', realComponents: ['Landing', 'PmsTodayPage', 'AdminDashboard', 'ThemeProvider', 'Button', 'Input', 'StatusPill'], boundaries: ['synthetic catalog/read/auth hooks', 'admin sidebar frame', 'no real transport'], liveFontsVerified: false }, null, 2));
console.log(`Built isolated design acceptance assets at ${output}; no browser acceptance claimed yet.`);
