// Real canonical property search page, redirect and home search controls with synthetic hooks; deny all external browser requests.
import { build } from 'esbuild';
import postcss from 'postcss';
import postcssImport from 'postcss-import';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const taskRoot = process.cwd();
const root = process.env.CATALOG_SOURCE_ROOT || taskRoot;
const output = process.env.CATALOG_QA_OUTPUT || '/tmp/browser/property-catalog-entry-isolated';
await mkdir(output, { recursive: true });
const virtual = {
  '@/contexts/AuthContext': `export const useAuth=()=>({user:null});`,
  '@/components/uno/GlobalPreferencesControls': `export const GlobalPreferencesControls=()=>null;`,
  '@/components/layout/UserAvatarMenu': `export const UserAvatarMenu=()=>null;`,
  '@/components/market/MiniCart': `export const MiniCart=()=>null;`,
  '@/components/layout/AllAppsDrawer': `export const AllAppsDrawer=()=>null;`,
  '@/hooks/usePrefetch': `export const usePrefetchRoute=()=>({prefetchRoute:()=>{}});`,
  '@/lib/prefetchRoute': `export const prefetchRoute=()=>{};`,
  '@/hooks/useFeedbackSettings': `export const getFeedbackSettings=()=>({hapticEnabled:false,soundEnabled:false});`,
  '@/components/layout/AppLayout': `import React from 'react';export const AppLayout=({children})=><>{children}</>;`,
  '@/pages/services/ServicesIndex': `export default function ServicesIndex(){return null;}`,
  '@/contexts/LanguageContext': `export const useLanguage=()=>({language:new URLSearchParams(location.search).get('lang')||'ru'});`,
  '@/contexts/CurrencyContext': `export const useCurrency=()=>({formatPrice:(n)=>'฿'+Number(n).toLocaleString('en-US')});`,
  '@/hooks/usePropertyQuickFilters': `export const usePropertyQuickFilters=()=>({districts:[{id:'layan',valueKey:'layan',labelRu:'Лаян',labelEn:'Layan'},{id:'rawai',valueKey:'rawai',labelRu:'Равай',labelEn:'Rawai'}],isLoading:false});export const applyQuickFilters=(rows)=>rows;`,
  '@/hooks/usePropertyFilterOptions': `export const usePropertyFilterOptions=()=>({filterConfig:{sections:[{id:'priceLevel',titleRu:'Уровень цен',titleEn:'Price level',type:'price-level',options:[]},{id:'bedrooms',titleRu:'Спальни',titleEn:'Bedrooms',type:'multi',options:[]}]},propertyTypes:[{id:'villa',labelRu:'Вилла',labelEn:'Villa'},{id:'condo',labelRu:'Кондо',labelEn:'Condo'}],isLoading:false});`,
  '@/hooks/useManagementCompanies': `export const useManagementCompanies=()=>{throw Error('Guest discovery must not fetch management companies')};`,
  '@/components/uno/BackButton': `export const BackButton=()=>null;`,
  '@/components/uno/FavoriteButton': `export const FavoriteButton=()=>null;`,
  '@/components/crosssell': `export const CrossSellSection=()=>null;`,
  '@/components/leads/VerticalCTA': `export const VerticalCTA=()=>null;`,
  '@/components/property/OffplanCTASection': `export const OffplanCTASection=()=>null;`,
  '@/components/property/PropertyMapView': `import React from 'react';export const PropertyMapView=({properties})=> <div data-testid="synthetic-map" data-ids={properties.map(p=>p.id).join(',')}>Synthetic map SDK boundary</div>;`,
  '@/integrations/supabase/client': `import {createSyntheticPropertyCatalog} from '${taskRoot}/scripts/qa/fixtures/propertyCatalogRead.ts';const adapter=createSyntheticPropertyCatalog(new URLSearchParams(location.search).get('priceCases')==='1');window.fixtureCatalog=adapter;export const supabase=adapter.supabase;`,
  '@/components/layout/pageRegistry': `export const PropertyLanding=()=>null;`,

};
const routeSource = await readFile(path.join(root,'src/components/layout/routes/propertyHubRoutes.tsx'),'utf8');
const unrelatedPages = [...new Set([...routeSource.matchAll(/Pages\.(\w+)/g)].map(match=>match[1]))].filter(name=>name!=='PropertySearchPage');
virtual['@/components/layout/pageRegistry'] = `export {default as PropertySearchPage} from '${root}/src/pages/property/PropertySearchPage.tsx';` + unrelatedPages.map(name=>`export function ${name}(){throw Error('Unrelated route outside isolated catalogue acceptance: ${name}')}`).join('\n');
const result = await build({
  stdin: { contents: `import React from 'react';import {createRoot} from 'react-dom/client';import {QueryClient,QueryClientProvider} from '@tanstack/react-query';import {MemoryRouter,Routes,Route,useLocation,useNavigate} from 'react-router-dom';import {ConsumerHeader} from '${root}/src/components/nav/ConsumerHeader.tsx';import {BottomBar} from '${root}/src/components/nav/BottomBar.tsx';import {propertyHubRoutes} from '${root}/src/components/layout/routes/propertyHubRoutes.tsx';import GoalEntryPage from '${root}/src/pages/discover/GoalEntryPage.tsx';import Page from '${root}/src/pages/property/PropertySearchPage.tsx';import Redirect from '${root}/src/components/property/PropertySearchRedirect.tsx';function Fixture(){const loc=useLocation();const nav=useNavigate();return <div data-canvas="consumer">{new URLSearchParams(location.search).get('navEntry')==='1'&&<div data-testid="actual-header"><ConsumerHeader/></div>}<Routes><Route path="/fixture-start" element={<h1>Choose a destination</h1>}/><Route path="/property">{propertyHubRoutes}</Route><Route path="/discover/stay" element={<GoalEntryPage goal="stay"/>}/></Routes>{new URLSearchParams(location.search).get('navEntry')==='1'&&<div data-testid="actual-bottom"><BottomBar role="guest"/></div>}<output hidden data-testid="navigation-state">{JSON.stringify(loc.state)}</output><output hidden data-testid="location">{loc.pathname+loc.search+loc.hash}</output><div className="flex gap-2 p-4"><button className="min-h-11 border px-3" data-testid="history-back" onClick={()=>nav(-1)}>QA back</button><button className="min-h-11 border px-3" data-testid="history-forward" onClick={()=>nav(1)}>QA forward</button></div></div>;}const params=new URLSearchParams(location.search);const entry=params.get('entry')||'/property/search';params.delete('entry');const queryClient=new QueryClient({defaultOptions:{queries:{retry:false}}});createRoot(document.getElementById('root')).render(<QueryClientProvider client={queryClient}><MemoryRouter initialEntries={[{pathname:entry,search:'?'+params.toString(),hash:location.hash,state:{origin:'synthetic-navigation'}}]} ><Fixture/></MemoryRouter></QueryClientProvider>);`, loader: 'tsx', resolveDir: root },
  bundle: true, outfile: path.join(output,'fixture.js'), jsx:'automatic', format:'esm', metafile:true,
  define: { 'process.env.NODE_ENV':'"production"', 'import.meta.env.DEV':'false' },
  plugins:[{name:'isolated-browse-data',setup(b){
    b.onResolve({filter:/.*/}, args=>{
      if(args.path==='../pageRegistry' && args.importer.endsWith('/routes/propertyHubRoutes.tsx')) return {path:'@/components/layout/pageRegistry',namespace:'fixture'};
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
for(const required of ['components/nav/ConsumerHeader.tsx','components/nav/BottomBar.tsx','lib/navConfig.ts','lib/nav/navigationModel.ts','components/layout/routes/propertyHubRoutes.tsx','pages/discover/GoalEntryPage.tsx']) {
  if(!Object.keys(result.metafile.inputs).some(file=>!file.startsWith('fixture:')&&file.endsWith(required))) throw Error('Actual navigation surface missing: '+required);
}
if(Object.keys(result.metafile.inputs).some(p=>!p.startsWith('fixture:')&&/integrations\/supabase\/client|hooks\/(useManagementCompanies|usePropertyQuickFilters|usePropertyFilterOptions)\.ts$/.test(p))) throw Error('Production data module included');
if(process.argv.includes('--compile-only')) { console.log('Network-isolated property search fixture compiled; production data modules excluded.'); process.exit(0); }
await writeFile(path.join(output,'synthetic-property.svg'),'<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640"><rect width="640" height="640" fill="#cbd5d0"/><path d="M80 400V240L320 100L560 240V400Z" fill="#f7f5f1"/></svg>');
const css = await postcss([postcssImport(),tailwindcss(),autoprefixer()]).process(['src/index.css','src/styles/cinematic-home.css','src/styles/property-search.css','src/styles/public-commerce.css','src/styles/premium-public.css'].map(file=>'@import "./'+file+'";').join('\n'),{from:path.join(root,'catalogue-qa.css')});
await writeFile(path.join(output,'fixture.css'),css.css);
await writeFile(path.join(output,'provenance.json'),JSON.stringify({root,head:spawnSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).stdout.trim(),sources:await Promise.all(['src/pages/property/PropertySearchPage.tsx','src/components/home/HomeDiscoverySearch.tsx','src/hooks/useProperties.ts','src/lib/propertySearchQuery.ts','src/components/property/PropertySearchRedirect.tsx','src/pages/property/PropertyHub.tsx','src/components/layout/routes/propertyHubRoutes.tsx','src/components/property/PropertyMapView.tsx','src/styles/property-search.css','src/lib/navConfig.ts','src/lib/nav/navigationModel.ts','src/lib/propertySortPrice.ts','src/lib/propertySearchPresentation.ts','src/components/nav/ConsumerHeader.tsx','src/components/nav/BottomBar.tsx'].map(async file=>({file,sha256:createHash('sha256').update(await readFile(path.join(root,file))).digest('hex')}))),limits:['Actual page, editor, cards and React Query pagination hook','Synthetic public-catalog read adapter, outer shell/auth/map SDK boundary; external requests denied','Fallback fonts; not production acceptance']},null,2));
await writeFile(path.join(output,'fixture.html'),'<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>');
if(process.argv.includes('--build-only')) process.exit(0);
const run=spawnSync('python3',[path.join(taskRoot,'scripts/qa/property-catalog-entry-ui.py'),output],{stdio:'inherit'});
process.exitCode=run.status??1;
