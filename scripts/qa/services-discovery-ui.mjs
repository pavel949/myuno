// Real home search controls with synthetic hooks; deny all external browser requests.
import { build } from 'esbuild';
import { createHash } from 'node:crypto';
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
const lifeId = slug => { const h=createHash('md5').update('service:'+slug).digest('hex'); return [h.slice(0,8),h.slice(8,12),h.slice(12,16),h.slice(16,20),h.slice(20)].join('-'); };
const virtual = {
  '@/contexts/LanguageContext': `export const useLanguage=()=>({language:window.fixtureLanguage||'ru',t:(s)=>s});`,
  '@/contexts/AuthContext': `export const useAuth=()=>({user:null});`,
  '@/lib/catalog/useCatalogFromDB': `import {CATEGORIES,LIFE_SITUATIONS} from '${root}/src/lib/catalog/taxonomy.ts';import {catalogServicePath} from '${root}/src/lib/catalog/serviceLookup.ts';const phase=new URLSearchParams(location.search).get('phase');export const useCatalogFromDB=()=>({categories:phase==='empty'?[]:phase==='db-home'?CATEGORIES.map(c=>({...c,services:c.services.map(s=>({...s,path:catalogServicePath(c.id,s.id,s.id==='services'?'/services':s.path)}))})):CATEGORIES,lifeSituations:LIFE_SITUATIONS,isFromDB:true,isLoading:phase==='loading',error:phase==='error'?new Error('Isolated catalogue failure'):null,refetch:()=>{window.fixtureRetry=(window.fixtureRetry||0)+1}});`,
  '@/lib/analytics/track': `export const trackEvent=()=>{};`,
  '@/components/layout/AppLayout': `export const AppLayout=({children})=><main>{children}</main>;`,
  '@/components/filters/UniversalFilter': `export const UniversalFilter=()=>null;`,
  '@/components/landings/PersonaFilterChip': `export const PersonaFilterChip=()=>null;`,
  '@/components/seo': `export const SEOHead=()=>null;`,
  '@/components/crosssell/CrossSellSection': `export const CrossSellSection=()=>null;`,
  '@/components/map/UnifiedCatalogMap': `export const UnifiedCatalogMap=()=>null;`,
  '@/hooks/useLifeOS': `export const useLifeSituations=()=>({data:[{id:'synthetic-arrival',code:'arrival',title_en:'Arrival',title_ru:'Приезд',is_active:true}]});export const useResolveLifeOSContext=()=>({data:${JSON.stringify(['transfer','yacht','unknown-service'].map(slug=>({entity_type:'service',entity_id:lifeId(slug),title:slug,title_localized:slug,price:null})))}});`,
  '@/hooks/useUserPersonas': `export const useUserPersonas=()=>({effectivePersonas:[]});`,
  '@/hooks/useSituationServiceCounts': `export const useSituationServiceCounts=()=>({data:{}});`,
  './useSituationTracking': `export const useSituationTracking=()=>({containerRef:{current:null},onSituationClick:()=>{}});`,
  '@/hooks/useOrders': `export const useOrders=()=>({createOrder:()=>{throw Error('Order writes forbidden in navigation QA')},isCreating:false});`,
  '@/hooks/useGeolocation': `export const useGeolocation=()=>({hasLocation:false,getPosition:()=>{throw Error('Geolocation forbidden in navigation QA')},loading:false});`,
  '@/hooks/useServiceMarketplace': `const providerPhase=new URLSearchParams(location.search).get('phase');export const useMarketplaceServices=()=>({data:providerPhase==='provider'?[{id:'offer-synthetic',provider_id:'provider-synthetic',name_en:'Synthetic AC service',name_ru:'Синтетическая услуга',description_en:'Synthetic fixture, not a real offer',price:950,currency:'THB',duration_minutes:60,lead_time_hours:2,images:[],provider:{id:'provider-synthetic',name:'Synthetic team',is_verified:false}}]:[],isLoading:false,isError:false,refetch:()=>{}});`,
  '@/components/services': `export {ServiceFunctionCard} from '${root}/src/components/services/ServiceFunctionCard.tsx';`,
  './ServiceBookingSheet': `export const ServiceBookingSheet=()=>null;`,
  '@/integrations/supabase/client': `export const supabase=new Proxy({},{get(){throw Error('Production database forbidden')}});`,
};
const result = await build({
  stdin: { contents: `import React from 'react';import {createRoot} from 'react-dom/client';import {BrowserRouter,Routes,Route,useLocation} from 'react-router-dom';import ServicesIndex from '${root}/src/pages/services/ServicesIndex.tsx';import SituationDetailPage from '${root}/src/components/navigation/v3/SituationDetailPage.tsx';import ServiceFunctionOrder from '${root}/src/pages/services/ServiceFunctionOrder.tsx';import {BackButton} from '${root}/src/components/uno/BackButton.tsx';import {ScrollToTop} from '${root}/src/components/layout/ScrollToTop.tsx';import {serviceCatalogueReturnTo} from '${root}/src/lib/services/serviceNavigation.ts';function Detail(){const l=useLocation();return <BackButton fallbackPath={serviceCatalogueReturnTo(new URLSearchParams(l.search).get('returnTo'))}/>;}function Location(){const l=useLocation();return <output hidden data-testid="location">{l.pathname+l.search+l.hash}</output>;}window.fixtureLanguage=new URLSearchParams(location.search).get('lang')||'ru';history.replaceState(null,'',new URLSearchParams(location.search).get('entry')||'/discover/services');createRoot(document.getElementById('root')).render(<BrowserRouter future={{v7_startTransition:true,v7_relativeSplatPath:true}}><ScrollToTop/><Routes><Route path="/discover/services" element={<ServicesIndex/>}/><Route path="/discover/:code" element={<SituationDetailPage/>}/><Route path="/services/order/:functionId" element={<ServiceFunctionOrder/>}/><Route path="*" element={<Detail/>}/></Routes><Location/></BrowserRouter>);`, loader: 'tsx', resolveDir: root },
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
  .process(['src/index.css','src/styles/public-commerce.css'].map(file=>'@import "./'+file+'";').join('\n'), { from: path.join(root, 'services-qa.css') });
await writeFile(path.join(output,'fixture.css'),css.css);
await writeFile(path.join(output,'fixture.html'),'<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><script>const fp=new URLSearchParams(location.search);document.documentElement.lang=fp.get("lang")||"en";document.documentElement.classList.toggle("dark",fp.get("theme")==="dark");</script><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>');
if(process.argv.includes('--build-only')) process.exit(0);
const run=spawnSync('python3',[path.join(root,'scripts/qa/services-discovery-ui.py'),output],{stdio:'inherit'});
process.exitCode=run.status??1;
