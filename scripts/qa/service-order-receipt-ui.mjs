// Actual read-only receipt page with synthetic auth/database/shell boundaries.
import { build } from 'esbuild';
import postcss from 'postcss';
import postcssImport from 'postcss-import';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const root = process.cwd();
const output = '/tmp/browser/service-order-receipt-isolated';
await mkdir(output, { recursive: true });
await rm(path.join(output, 'results.json'), { force: true });
const virtual = {
  '@/contexts/LanguageContext': `export const useLanguage=()=>({language:new URLSearchParams(location.search).get('lang')||'en'});`,
  '@/contexts/AuthContext': `export const useAuth=()=>({user:{id:'00000000-0000-4000-8000-000000000001'}});`,
  '@/components/layout/AppLayout': `export const AppLayout=({children})=><div>{children}</div>;`,
  '@/integrations/supabase/client': `export const supabase={from:table=>{
    if(table!=='orders')throw Error('Unexpected relation');const filters={};
    const q={select:()=>q,eq:(key,value)=>{filters[key]=value;return q},is:()=>q,filter:(key,_operator,value)=>{filters[key]=value;return q},maybeSingle:async()=>{
      window.fixtureReads.push(filters);const mode=new URLSearchParams(location.search).get('mode');
      if(mode==='empty')return{data:null,error:null};
      if(mode==='error'&&window.fixtureReads.length===1)return{data:null,error:new Error('Synthetic offline')};
      return{error:null,data:{id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',customer_user_id:mode==='foreign'?'00000000-0000-4000-8000-000000000099':'00000000-0000-4000-8000-000000000001',order_number:'SYNTHETIC-1',total_amount:900,currency:'USD',status:mode==='unknown'?null:'pending',start_at:null}};
    }};return q;
  }};`,
};
const result = await build({
  stdin: { contents: `import React from'react';import{createRoot}from'react-dom/client';import{MemoryRouter,useLocation}from'react-router-dom';import Page from'${root}/src/pages/services/ServiceOrderSuccess.tsx';window.fixtureReads=[];const mode=new URLSearchParams(location.search).get('mode'),id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';const entry=mode==='session'?'/services/order/success?session_id=cs_synthetic':mode==='promotion'?{pathname:'/services/order/success',search:'?source=fixture',hash:'#receipt',state:{orderId:id.toUpperCase(),origin:'fixture'}}:'/services/order/success?order_id='+(mode==='uppercase'?id.toUpperCase():id);function Proof(){const l=useLocation();return<output hidden data-testid="route">{l.pathname+l.search+l.hash}</output>}createRoot(document.getElementById('root')).render(<MemoryRouter initialEntries={[entry]}><Page/><Proof/></MemoryRouter>);`, loader: 'tsx', resolveDir: root },
  bundle: true, outfile: path.join(output, 'fixture.js'), jsx: 'automatic', format: 'esm', metafile: true,
  define: { 'process.env.NODE_ENV': '"production"', 'import.meta.env.DEV': 'false' },
  plugins: [{ name: 'receipt-boundary', setup(b) {
    b.onResolve({ filter: /.*/ }, a => {
      if (Object.hasOwn(virtual, a.path)) return { path: a.path, namespace: 'fixture' };
      if (a.path.startsWith('@/')) {
        const base = path.join(root, 'src', a.path.slice(2));
        const resolved = [base, base + '.ts', base + '.tsx', path.join(base, 'index.ts'), path.join(base, 'index.tsx')].find(p => existsSync(p) && statSync(p).isFile());
        if (!resolved) throw Error(a.path); return { path: resolved };
      }
    });
    b.onLoad({ filter: /.*/, namespace: 'fixture' }, a => ({ contents: virtual[a.path], loader: 'tsx', resolveDir: root }));
  } }],
});
if (Object.keys(result.metafile.inputs).some(p => /integrations\/supabase\/client\.ts/.test(p))) throw Error('Live client bundled');
const css = await postcss([postcssImport(), tailwindcss(), autoprefixer()]).process(await readFile('src/index.css', 'utf8'), { from: path.join(root, 'src/index.css') });
await writeFile(path.join(output, 'fixture.css'), css.css);
await writeFile(path.join(output, 'fixture.html'), '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>');
await writeFile(path.join(output, 'provenance.json'), JSON.stringify({ source: 'src/pages/services/ServiceOrderSuccess.tsx', sha256: createHash('sha256').update(await readFile('src/pages/services/ServiceOrderSuccess.tsx')).digest('hex'), limits: ['Actual page, PageShell, controls and price formatter; synthetic auth, database and outer shell', 'Fallback fonts; no production writes, financial confirmation or live role acceptance'] }, null, 2));
process.exitCode = spawnSync('python3', ['scripts/qa/service-order-receipt-ui.py', output], { stdio: 'inherit' }).status ?? 1;
