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
const output = process.env.SERVICES_A11Y_OUTPUT || path.join(root, 'artifacts/design-system/services-accessibility');
await mkdir(output, { recursive: true });
const virtual = {
 '@/lib/catalog/useCatalogFromDB': `const leaf=(id,path,labelEn,labelRu)=>({id,path,labelEn,labelRu,status:'available'});const groups=[{id:'cat-leisure',services:[leaf('flowers','/flowers','Flowers','Цветы')]},{id:'cat-transport',services:[leaf('transfer','/transport/airport-transfer','Transfers','Трансфер'),leaf('fast-track','/transport/fast-track','Fast Track','Fast Track'),leaf('vehicle','/transport','Cars & bikes','Авто и байки')]},{id:'cat-home-services',labelEn:'Home services',labelRu:'Услуги для дома',services:[]}];export const useCatalogFromDB=()=>({categories:new URLSearchParams(location.search).get('mode')==='groups'?groups:[],isFromDB:true,isLoading:false,error:null,refetch:()=>{}});`,
  '@/contexts/LanguageContext': `export const useLanguage=()=>({language:new URLSearchParams(location.search).get('lang')||'ru',t:(s)=>s});`,
  '@/contexts/AuthContext': `export const useAuth=()=>({user:new URLSearchParams(location.search).get('actor')==='member'?{id:'synthetic',email:'synthetic@example.test'}:null});`,
  '@/lib/analytics/track': `export const trackEvent=()=>{};`,
  '@/components/layout/AppLayout': `export const AppLayout=({children})=><main>{children}</main>;`,
  '@/components/filters/UniversalFilter': `export const UniversalFilter=()=>null;`,
  '@/components/landings/PersonaFilterChip': `export const PersonaFilterChip=()=>null;`,
  '@/components/seo': `export const SEOHead=()=>null;`,
  '@/components/crosssell/CrossSellSection': `export const CrossSellSection=()=>null;`,
  '@/components/map/UnifiedCatalogMap': `export const UnifiedCatalogMap=()=>null;`,
  '@/hooks/usePersonaFilter': `export const usePersonaFilter=()=>({applyFilter:rows=>rows});`,
  '@/hooks/useOrders': `export const useOrders=()=>({isCreating:false,createOrder:async body=>{window.fixtureAttempts.push(body);throw Error('Synthetic intercepted failure')}});`,
  '@/hooks/useGeolocation': `export const useGeolocation=()=>({hasLocation:false,loading:false,getPosition:()=>{throw Error('Geolocation forbidden')}});`,
  '@/hooks/useServiceMarketplace': `import{useState}from'react';export const useMarketplaceServices=()=>{const[retried,retry]=useState(false);const mode=new URLSearchParams(location.search).get('mode');return{data:[],isLoading:mode==='loading',isError:mode==='error'&&!retried,refetch:()=>retry(true)}};`,
  '@/components/services': `export {ServiceFunctionCard} from '${root}/src/components/services/ServiceFunctionCard.tsx';`,
  './ServiceBookingSheet': `export const ServiceBookingSheet=()=>null;`,
  '@/integrations/supabase/client': `export const supabase={functions:{invoke:async(name,args)=>{window.fixtureInquiries.push({name,args});return{data:null,error:new Error('Synthetic unavailable')}}}};`,
};
const result = await build({
  stdin: { contents: `import React from 'react';import {createRoot} from 'react-dom/client';import {MemoryRouter,Routes,Route,useLocation,useNavigate} from 'react-router-dom';import ServicesIndex from '${root}/src/pages/services/ServicesIndex.tsx';import ServiceFunctionOrder from '${root}/src/pages/services/ServiceFunctionOrder.tsx';window.fixtureAttempts=[];window.fixtureInquiries=[];function Location(){const l=useLocation(),n=useNavigate();return <aside><output data-testid="location">{l.pathname+l.search}</output><button onClick={()=>n(-1)}>QA history back</button><button onClick={()=>n(1)}>QA history forward</button></aside>;}createRoot(document.getElementById('root')).render(<MemoryRouter initialEntries={[new URLSearchParams(location.search).get('entry')||'/discover/services']}><Routes><Route path="/discover/services" element={<ServicesIndex embedded/>}/><Route path="/services/order/:functionId" element={<ServiceFunctionOrder/>}/><Route path="/auth" element={<p>Isolated auth destination</p>}/></Routes><Location/></MemoryRouter>);`, loader: 'tsx', resolveDir: root },
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
if(Object.keys(result.metafile.inputs).some(p=>!p.startsWith('fixture:')&&/integrations\/supabase\/client|hooks\/useServiceMarketplace\.ts$/.test(p))) throw Error('Production data module included');
// Route-level CSS is emitted by esbuild separately; retain it after global CSS, as in the app.
const routeCss = await readFile(path.join(output, 'fixture.css'), 'utf8');
const css = await postcss([postcssImport(), tailwindcss(), autoprefixer()])
  .process(await readFile(path.join(root, 'src/index.css'), 'utf8'), { from: path.join(root, 'src/index.css') });
await writeFile(path.join(output,'fixture.css'),css.css+'\n'+routeCss);
if (!routeCss.includes('.public-commerce-form')) throw Error('Actual route CSS missing');
await writeFile(path.join(output,'fixture.html'),'<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>');
await writeFile(path.join(output,'source-receipt.json'),JSON.stringify({mode:'Synthetic reads/order boundary; actual page/cards/form; embedded page shell; fallback fonts',sources:await Promise.all(['src/styles/public-commerce.css','src/pages/services/ServicesIndex.tsx','src/components/services/ServiceFunctionCard.tsx','src/pages/services/ServiceFunctionOrder.tsx','src/components/concierge/ConciergeHelpSheet.tsx'].map(async file=>({file,sha256:(await import('node:crypto')).createHash('sha256').update(await readFile(path.join(root,file))).digest('hex')})))},null,2));
if(process.argv.includes('--build-only')) process.exit(0);
const run=spawnSync('python3',[path.join(root,'scripts/qa/services-compact-accessibility.py'),output],{stdio:'inherit'});
process.exitCode=run.status??1;
