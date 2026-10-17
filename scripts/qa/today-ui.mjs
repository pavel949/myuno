// Synthetic rendering of the real Today page. No SPA boot or database client.
import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const root = process.cwd();
const output = '/tmp/browser/today-isolated';
await mkdir(output, { recursive: true });
const virtual = {
  '@/contexts/LanguageContext': `export const useLanguage=()=>({language:new URLSearchParams(location.search).get('lang')||'ru'});`,
  '@/hooks/usePmsToday': `import {todayFixtures} from '${root}/src/pages/mc/operations/__tests__/today.fixtures.ts'; export const usePmsToday=()=>({...todayFixtures(new URLSearchParams(location.search).get('lang')||'ru',new URLSearchParams(location.search).get('state')||'populated'),refetch:()=>{window.fixtureRefresh=(window.fixtureRefresh||0)+1;}});`,
  '@/integrations/supabase/client': `export const supabase=new Proxy({},{get(){throw Error('Real database forbidden')}});`,
  '@/hooks/useHapticFeedback': `export const triggerHaptic=()=>{};`,
  '@/hooks/useSoundEffects': `export const playSound=()=>{};`,
  '@/hooks/useFeedbackSettings': `export const getFeedbackSettings=()=>({hapticEnabled:false,soundEnabled:false});`,
};
const result = await build({
  stdin: { contents: `import React from 'react'; import {createRoot} from 'react-dom/client'; import {MemoryRouter,useLocation} from 'react-router-dom'; import Page from '${root}/src/pages/mc/operations/PmsTodayPage.tsx'; function Boundary(){return <output data-testid="route-boundary">{useLocation().pathname}</output>;} createRoot(document.getElementById('root')).render(<MemoryRouter initialEntries={['/mc/today']} future={{v7_startTransition:true,v7_relativeSplatPath:true}}><Page/><Boundary/></MemoryRouter>);`, loader: 'tsx', resolveDir: root },
  bundle: true, outfile: path.join(output, 'fixture.js'), jsx: 'automatic', format: 'esm', metafile: true,
  define: { 'process.env.NODE_ENV': '"production"', 'import.meta.env.DEV': 'false' },
  plugins: [{ name: 'isolated-data', setup(b) {
    b.onResolve({ filter: /.*/ }, args => {
      if (Object.hasOwn(virtual, args.path)) return { path: args.path, namespace: 'fixture' };
      if (args.path.startsWith('@/')) {
        const base = path.join(root, 'src', args.path.slice(2));
        const resolved = [base, base+'.ts', base+'.tsx', path.join(base,'index.ts')].find(p => existsSync(p) && statSync(p).isFile());
        if (!resolved) throw Error('Unresolved import: '+args.path);
        return { path: resolved };
      }
    });
    b.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ contents: virtual[args.path], loader: 'js', resolveDir: root }));
  } }],
});
if (Object.keys(result.metafile.inputs).some(p => /integrations\/supabase\/client|hooks\/usePmsToday\.ts$/.test(p))) throw Error('Production data module included');
const css = await fetch('http://localhost:8080/src/index.css?direct');
if (!css.ok) throw Error('Preview CSS unavailable');
await writeFile(path.join(output,'fixture.css'), await css.text());
await writeFile(path.join(output,'fixture.html'), '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>');
const run = spawnSync('python3', [path.join(root,'scripts/qa/today-ui.py'), output], { stdio: 'inherit' });
process.exitCode = run.status ?? 1;