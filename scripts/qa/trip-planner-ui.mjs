import { compileApplicationCss } from './compile-application-css.mjs';
// Real TripPlannerPage and search, synthetic hooks, local CSS; no production requests.
import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const root = process.cwd();
const output = '/tmp/browser/trip-planner-isolated';
await mkdir(output, { recursive: true });
const virtual = {
  '@/components/layout/AppLayout': `export const AppLayout=({children})=><main>{children}</main>;`,
  '@/components/trip-planner/TripChecklist': `export const TripChecklist=()=>null;`,
  '@/components/seo/SEOHead': `export const SEOHead=()=>null;`,
  '@/contexts/LanguageContext': `export const useLanguage=()=>({language:new URLSearchParams(location.search).get('lang')||'ru'});`,
  '@/hooks/usePropertyQuickFilters': `export const usePropertyQuickFilters=()=>({districts:[{id:'layan',valueKey:'layan',labelRu:'Лаян',labelEn:'Layan'}],isLoading:false});`,
  '@/hooks/usePropertyFilterOptions': `export const usePropertyFilterOptions=()=>({propertyTypes:[{id:'villa',labelRu:'Вилла',labelEn:'Villa'},{id:'condo',labelRu:'Кондо',labelEn:'Condo'}],isLoading:false});`,
  '@/integrations/supabase/client': `export const supabase=new Proxy({},{get(){throw Error('Production database forbidden')}});`,
};
const result = await build({
  stdin: { contents: `import React from 'react';import {createRoot} from 'react-dom/client';import {MemoryRouter} from 'react-router-dom';import TripPlannerPage from '${root}/src/pages/TripPlannerPage.tsx';createRoot(document.getElementById('root')).render(<MemoryRouter future={{v7_startTransition:true,v7_relativeSplatPath:true}}><TripPlannerPage/></MemoryRouter>);`, loader: 'tsx', resolveDir: root },
  bundle: true, outfile: path.join(output,'fixture.js'), jsx:'automatic', format:'esm', metafile:true,
  define: { 'process.env.NODE_ENV':'"production"', 'import.meta.env.DEV':'false' },
  plugins:[{name:'isolated-browse-data',setup(b){
    b.onResolve({filter:/.*/}, args=>{
      if(Object.hasOwn(virtual,args.path)) return {path:args.path,namespace:'fixture'};
      if(args.path.startsWith('@/')) {
        const base=path.join(root,'src',args.path.slice(2));
        const resolved=[base,base+'.ts',base+'.tsx',path.join(base,'index.ts'),path.join(base,'index.tsx')].find(p=>existsSync(p)&&statSync(p).isFile());
        if(!resolved) throw Error('Unresolved '+args.path);
        return {path:resolved};
      }
    });
    b.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:virtual[args.path],loader:'tsx',resolveDir:root}));
  }}],
});
if(Object.keys(result.metafile.inputs).some(p=>!p.startsWith('fixture:')&&/integrations\/supabase\/client|hooks\/(usePropertyQuickFilters|usePropertyFilterOptions)\.ts$/.test(p))) throw Error('Production data module included');
const css = await compileApplicationCss(root, ['src/styles/cinematic-home.css']);
await writeFile(path.join(output,'fixture.css'),css.css);
await writeFile(path.join(output,'fixture.html'),'<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>');
if(process.argv.includes('--build-only')) process.exit(0);
const run=spawnSync('python3',[path.join(root,'scripts/qa/trip-planner-ui.py'),output],{stdio:'inherit'});
process.exitCode=run.status??1;

