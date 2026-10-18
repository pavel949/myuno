// Real canonical property search page, redirect and home search controls with synthetic hooks; deny all external browser requests.
import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const root = process.cwd();
const output = '/tmp/browser/unified-property-search-isolated';
await mkdir(output, { recursive: true });
const virtual = {
  '@/contexts/LanguageContext': `export const useLanguage=()=>({language:new URLSearchParams(location.search).get('lang')||'ru'});`,
  '@/contexts/CurrencyContext': `export const useCurrency=()=>({formatPrice:(n)=>'฿'+Number(n).toLocaleString('en-US')});`,
  '@/hooks/usePropertyQuickFilters': `export const usePropertyQuickFilters=()=>({districts:[{id:'layan',valueKey:'layan',labelRu:'Лаян',labelEn:'Layan'},{id:'rawai',valueKey:'rawai',labelRu:'Равай',labelEn:'Rawai'}],isLoading:false});export const applyQuickFilters=(rows)=>rows;`,
  '@/hooks/usePropertyFilterOptions': `export const usePropertyFilterOptions=()=>({filterConfig:{sections:[]},propertyTypes:[{id:'villa',labelRu:'Вилла',labelEn:'Villa'},{id:'condo',labelRu:'Кондо',labelEn:'Condo'}],isLoading:false});`,
  '@/hooks/useManagementCompanies': `export const useManagementCompanies=()=>({data:[]});`,
  '@/hooks/useProperties': `
const rows=[{id:'synthetic-villa',title_en:'Synthetic pool villa',title_ru:'Тестовая вилла с бассейном',property_type:'villa',listing_type:'rent',amenities:['pool'],district:'layan',price:2500,price_per_night:2500,sale_price:9500000,price_period:'night',currency:'THB',bedrooms:2,bathrooms:2,area_sqm:140,max_guests:6,cover_image:'/synthetic-property.svg',images:['/synthetic-property.svg'],created_at:'2026-10-17',updated_at:'2026-10-17'}];
export function usePropertiesInfinite(filters){window.fixtureFilters=filters;return {data:{pages:[{properties:rows}]},isLoading:false,isError:false,hasNextPage:false,isFetchingNextPage:false,fetchNextPage:()=>{throw Error('Unexpected pagination')},refetch:()=>{}};}`,
  '@/components/uno/BackButton': `export const BackButton=()=>null;`,
  '@/components/uno/FavoriteButton': `export const FavoriteButton=()=>null;`,
  '@/components/crosssell': `export const CrossSellSection=()=>null;`,
  '@/components/leads/VerticalCTA': `export const VerticalCTA=()=>null;`,
  '@/components/property/OffplanCTASection': `export const OffplanCTASection=()=>null;`,
  '@/components/property/PropertyMapView': `import React from 'react';export const PropertyMapView=()=> <div data-testid="synthetic-map">Synthetic map boundary</div>;`,
  '@/integrations/supabase/client': `export const supabase=new Proxy({},{get(){throw Error('Production database forbidden')}});`,
};
const result = await build({
  stdin: { contents: `import React from 'react';import {createRoot} from 'react-dom/client';import {MemoryRouter,Routes,Route,useLocation,useNavigate} from 'react-router-dom';import Page from '${root}/src/pages/property/PropertySearchPage.tsx';import Redirect from '${root}/src/components/property/PropertySearchRedirect.tsx';function Fixture(){const loc=useLocation();const nav=useNavigate();return <><Routes><Route path="/property/search" element={<Page/>}/><Route path="/property/browse" element={<Redirect/>}/></Routes><output hidden data-testid="location">{loc.pathname+loc.search}</output><div className="flex gap-2 p-4"><button className="min-h-11 border px-3" data-testid="history-back" onClick={()=>nav(-1)}>QA back</button><button className="min-h-11 border px-3" data-testid="history-forward" onClick={()=>nav(1)}>QA forward</button></div></>;}const params=new URLSearchParams(location.search);const entry=params.get('entry')||'/property/search';params.delete('entry');createRoot(document.getElementById('root')).render(<MemoryRouter initialEntries={[entry+'?'+params.toString()]} future={{v7_startTransition:true,v7_relativeSplatPath:true}}><Fixture/></MemoryRouter>);`, loader: 'tsx', resolveDir: root },
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
if(Object.keys(result.metafile.inputs).some(p=>!p.startsWith('fixture:')&&/integrations\/supabase\/client|hooks\/(useProperties|useManagementCompanies|usePropertyQuickFilters|usePropertyFilterOptions)\.ts$/.test(p))) throw Error('Production data module included');
await writeFile(path.join(output,'synthetic-property.svg'),'<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640"><rect width="640" height="640" fill="#cbd5d0"/><path d="M80 400V240L320 100L560 240V400Z" fill="#f7f5f1"/></svg>');
const css = await Promise.all(['/src/index.css?direct','/src/styles/cinematic-home.css?direct'].map(async file => {
  const response=await fetch('http://localhost:8080'+file);
  if(!response.ok) throw Error('Preview CSS unavailable: '+file);
  return response.text();
}));
await writeFile(path.join(output,'fixture.css'),css.join('\n'));
await writeFile(path.join(output,'fixture.html'),'<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>');
if(process.argv.includes('--build-only')) process.exit(0);
const run=spawnSync('python3',[path.join(root,'scripts/qa/unified-property-search-ui.py'),output],{stdio:'inherit'});
process.exitCode=run.status??1;

