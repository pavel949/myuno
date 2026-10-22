// Real FX page and currency context; synthetic canonical RPC, all network denied.
import { build } from 'esbuild';
import postcss from 'postcss';
import postcssImport from 'postcss-import';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const root = process.cwd();
const output = '/tmp/browser/exchange-reference-isolated';
await mkdir(output, { recursive: true });
const virtual = {
 '@/contexts/LanguageContext': `export const useLanguage=()=>({language:new URLSearchParams(location.search).get('lang')||'ru'});`,
 '@/components/layout/AppLayout': `export const AppLayout=({children})=><main>{children}</main>;`,
 '@/components/seo': `export const SEOHead=()=>null;`,
 '@/integrations/supabase/client': `export const supabase={rpc:async(name)=>{if(name!=='get_all_currency_rates')throw Error('Unexpected read');const state=new URLSearchParams(location.search).get('state');if(state==='error')return {data:null,error:new Error('Synthetic offline')};return {data:state==='empty'?{}:{USD:{rate:0.025,updated_at:'2026-10-01T00:00:00Z'},EUR:{rate:0.02,updated_at:'2026-10-02T00:00:00Z'}},error:null}}};`,
};
const result = await build({
  stdin: { contents: `import React from 'react';import {createRoot} from 'react-dom/client';import ExchangeBotPage from '${root}/src/pages/arrive/ExchangeBotPage.tsx';import {CurrencyProvider} from '${root}/src/contexts/CurrencyContext.tsx';createRoot(document.getElementById('root')).render(<CurrencyProvider><ExchangeBotPage/></CurrencyProvider>);`,loader:'tsx',resolveDir:root },
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
if(Object.keys(result.metafile.inputs).some(p=>!p.startsWith('fixture:')&&/integrations\/supabase\/client/.test(p))) throw Error('Production data module included');
const css = await postcss([postcssImport(), tailwindcss(), autoprefixer()])
  .process(await readFile(path.join(root, 'src/index.css'), 'utf8'), { from: path.join(root, 'src/index.css') });
await writeFile(path.join(output,'fixture.css'),css.css);
await writeFile(path.join(output,'fixture.html'),'<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>');
if(process.argv.includes('--build-only')) process.exit(0);
const run=spawnSync('python3',[path.join(root,'scripts/qa/exchange-reference-ui.py'),output],{stdio:'inherit'});
process.exitCode=run.status??1;
