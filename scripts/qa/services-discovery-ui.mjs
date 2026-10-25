// Real home search controls with synthetic hooks; deny all external browser requests.
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
const output = process.env.SERVICES_DISCOVERY_OUTPUT || '/tmp/browser/services-discovery-isolated';
await mkdir(output, { recursive: true });
const virtual = {
  '@/contexts/LanguageContext': `export const useLanguage=()=>({language:new URLSearchParams(location.search).get('lang')||'ru',t:(s)=>s});`,
  '@/contexts/AuthContext': `export const useAuth=()=>({user:null});`,
  '@/lib/catalog/useCatalogFromDB': `export const useCatalogFromDB=()=>({categories:[{id:'flowers',labelRu:'Цветы',labelEn:'Flowers',labelTh:'ดอกไม้',status:'available',services:[]}],isFromDB:true,isLoading:false,error:null,refetch:()=>{}});`,
  '@/lib/analytics/track': `export const trackEvent=()=>{};`,
  '@/components/layout/AppLayout': `export const AppLayout=({children})=><main>{children}</main>;`,
  '@/components/filters/UniversalFilter': `export const UniversalFilter=()=>null;`,
  '@/components/landings/PersonaFilterChip': `export const PersonaFilterChip=()=>null;`,
  '@/components/seo': `export const SEOHead=()=>null;`,
  '@/components/crosssell/CrossSellSection': `export const CrossSellSection=()=>null;`,
  '@/components/map/UnifiedCatalogMap': `export const UnifiedCatalogMap=()=>null;`,
  '@/hooks/useServiceMarketplace': `export const useMarketplaceServices=()=>({data:[],isLoading:false,isError:false,refetch:()=>{}});`,
  '@/components/services': `export {ServiceFunctionCard} from '${root}/src/components/services/ServiceFunctionCard.tsx';`,
  './ServiceBookingSheet': `export const ServiceBookingSheet=()=>null;`,
  '@/integrations/supabase/client': `export const supabase=new Proxy({},{get(){throw Error('Production database forbidden')}});`,
};
const result = await build({
  stdin: { contents: `import React from 'react';import {createRoot} from 'react-dom/client';import {MemoryRouter,Routes,Route,useLocation} from 'react-router-dom';import ServicesIndex from '${root}/src/pages/services/ServicesIndex.tsx';import {BackButton} from '${root}/src/components/uno/BackButton.tsx';import {serviceCatalogueReturnTo} from '${root}/src/lib/services/serviceNavigation.ts';function Detail(){const l=useLocation();return <BackButton fallbackPath={serviceCatalogueReturnTo(new URLSearchParams(l.search).get('returnTo'))}/>;}function Location(){const l=useLocation();return <output hidden data-testid="location">{l.pathname+l.search}</output>;}createRoot(document.getElementById('root')).render(<MemoryRouter initialEntries={['/discover/services']} future={{v7_startTransition:true,v7_relativeSplatPath:true}}><Routes><Route path="/discover/services" element={<ServicesIndex/>}/><Route path="/services/order/:id" element={<Detail/>}/></Routes><Location/></MemoryRouter>);`, loader: 'tsx', resolveDir: root },
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
if(Object.keys(result.metafile.inputs).some(p=>!p.startsWith('fixture:')&&/integrations\/supabase\/client|hooks\/useServiceMarketplace\.ts$|lib\/catalog\/useCatalogFromDB\.ts$/.test(p))) throw Error('Production data module included');
const css = await postcss([postcssImport(), tailwindcss(), autoprefixer()])
  .process(await readFile(path.join(root, 'src/index.css'), 'utf8'), { from: path.join(root, 'src/index.css') });
await writeFile(path.join(output,'fixture.css'),css.css);
await writeFile(path.join(output,'fixture.html'),'<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>');
if(process.argv.includes('--build-only')) process.exit(0);
const run=spawnSync('python3',[path.join(root,'scripts/qa/services-discovery-ui.py'),output],{stdio:'inherit'});
process.exitCode=run.status??1;
