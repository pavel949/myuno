// Real canonical property search page, redirect and home search controls with synthetic hooks; deny all external browser requests.
import { build } from 'esbuild';
import postcss from 'postcss';
import postcssImport from 'postcss-import';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import {createHash} from 'node:crypto';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const root = process.cwd();
const output = process.env.SEARCH_CONTROLS_OUTPUT || path.join(root,'artifacts/design-system/search-controls');
await mkdir(output, { recursive: true });
const virtual = {
  '@/contexts/LanguageContext': `const language=new URLSearchParams(location.search).get('lang')||'en';export const useLanguage=()=>({language});`,
  '@/contexts/CurrencyContext': `export const useCurrency=()=>({formatPrice:(n)=>'฿'+Number(n).toLocaleString('en-US')});`,
  '@/hooks/usePropertyQuickFilters': `export const usePropertyQuickFilters=()=>({districts:[{id:'layan',valueKey:'layan',labelRu:'Лаян',labelEn:'Layan'},{id:'rawai',valueKey:'rawai',labelRu:'Равай',labelEn:'Rawai'}],isLoading:false});export const applyQuickFilters=(rows)=>rows;`,
  '@/hooks/useManagementCompanies': `export const useManagementCompanies=()=>{throw Error('Guest discovery must not fetch management companies')};`,
  '@/hooks/useProperties': `
const rows=[{id:'synthetic-villa',title_en:'Synthetic pool villa',title_ru:'Тестовая вилла с бассейном',property_type:'villa',listing_type:'rent',amenities:['pool','private_pool','walk_to_beach','sea_view','wifi'],district:'layan',price:2500,price_per_night:2500,sale_price:9500000,price_period:'night',currency:'THB',bedrooms:2,bathrooms:2,area_sqm:140,max_guests:6,cover_image:'/synthetic-property.svg',images:['/synthetic-property.svg'],created_at:'2026-10-17',updated_at:'2026-10-17'}];
export function usePropertiesInfinite(filters){window.fixtureFilters=filters;return {data:{pages:[{properties:new URLSearchParams(location.search).get('fixtureCalendar')==='matrix'?['free','blocked','checkout'].map(kind=>({...rows[0],id:'synthetic-'+kind,title_en:'Synthetic '+kind,title_ru:'Тестовый '+kind})):rows}]},isLoading:false,isError:false,hasNextPage:false,isFetchingNextPage:false,fetchNextPage:()=>{throw Error('Unexpected pagination')},refetch:()=>{}};}`,
  '@/components/uno/BackButton': `export const BackButton=()=>null;`,
  '@/components/uno/FavoriteButton': `export const FavoriteButton=()=>null;`,
  '@/components/crosssell': `export const CrossSellSection=()=>null;`,
  '@/components/leads/VerticalCTA': `export const VerticalCTA=()=>null;`,
  '@/components/property/OffplanCTASection': `export const OffplanCTASection=()=>null;`,
  '@/components/property/PropertyMapView': `import React from 'react';export const PropertyMapView=()=> <div data-testid="synthetic-map">Synthetic map boundary</div>;`,
  '@/integrations/supabase/client': `
const ids=new Set(['synthetic-villa','synthetic-free','synthetic-blocked','synthetic-checkout']);
export const supabase=new Proxy({}, {get(_target,key){
  if(key==='from') return table=>{if(table!=='lookup_values')throw Error('Unexpected table');const rows=[['amenity','wifi','WiFi'],['amenity','pet_friendly','Pet-friendly'],['property_highlight','sea_view','Sea view']].map(([lookup_type,value_key,value_en],i)=>({id:'synthetic-'+i,lookup_type,value_key,value_en,value_ru:value_en,is_active:true,sort_order:i}));const q={select(){return q},in(){return q},eq(){return q},order(){return Promise.resolve({data:rows,error:null})}};return q};if(key!=='rpc') throw Error('Production database forbidden');
  return (name,args)=>{
    if(name!=='get_property_unavailable_dates'||!ids.has(args?.p_property_id)||Object.keys(args).sort().join(',')!=='p_from,p_property_id,p_to'||![args.p_from,args.p_to].every(value=>/^\\d{4}-\\d{2}-\\d{2}$/.test(value))||args.p_from>=args.p_to) throw Error('Non-synthetic calendar request forbidden');
    (window.fixtureCalendarCalls??=[]).push({name,...args});
    return {abortSignal(signal){
      if(signal.aborted) return Promise.reject(new DOMException('Aborted','AbortError'));
      const kind=args.p_property_id==='synthetic-blocked'?'blocked':args.p_property_id==='synthetic-checkout'?'checkout_only':null;
      return Promise.resolve({data:kind?[{date:args.p_from,kind}]:[],error:null});
    }};
  };
}});`,
};
const result = await build({
  stdin: { contents: `import React from 'react';import {createRoot} from 'react-dom/client';import {QueryClient,QueryClientProvider} from '@tanstack/react-query';import {BrowserRouter,Routes,Route,useLocation,useNavigate} from 'react-router-dom';import Page from '${root}/src/pages/property/PropertySearchPage.tsx';import Redirect from '${root}/src/components/property/PropertySearchRedirect.tsx';function Fixture(){const loc=useLocation();const nav=useNavigate();return <><Routes><Route path="/property/search" element={<Page/>}/><Route path="/property/browse" element={<Redirect/>}/></Routes><output hidden data-testid="navigation-state">{JSON.stringify(loc.state)}</output><output hidden data-testid="location">{loc.pathname+loc.search+loc.hash}</output><div className="flex gap-2 p-4"><button className="min-h-11 border px-3" data-testid="history-back" onClick={()=>nav(-1)}>QA back</button><button className="min-h-11 border px-3" data-testid="history-forward" onClick={()=>nav(1)}>QA forward</button></div></>;}const params=new URLSearchParams(location.search);const entry=params.get('entry')||(location.pathname==='/fixture'?'/property/search':location.pathname);params.delete('entry');history.replaceState(history.state??{usr:{origin:'synthetic-home'},key:'synthetic-entry',idx:0},'',entry+'?'+params.toString()+location.hash);const queryClient=new QueryClient({defaultOptions:{queries:{retry:false}}});createRoot(document.getElementById('root')).render(<QueryClientProvider client={queryClient}><BrowserRouter future={{v7_startTransition:true,v7_relativeSplatPath:true}}><Fixture/></BrowserRouter></QueryClientProvider>);`, loader: 'tsx', resolveDir: root },
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
if(Object.keys(result.metafile.inputs).some(p=>!p.startsWith('fixture:')&&/integrations\/supabase\/client|hooks\/(useProperties|useManagementCompanies|usePropertyQuickFilters)\.ts$/.test(p))) throw Error('Production data module included');
if(process.argv.includes('--compile-only')) { console.log('Network-isolated property search fixture compiled; production data modules excluded.'); process.exit(0); }
await writeFile(path.join(output,'synthetic-property.svg'),'<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640"><rect width="640" height="640" fill="#cbd5d0"/><path d="M80 400V240L320 100L560 240V400Z" fill="#f7f5f1"/></svg>');
const componentCSS=await readFile(path.join(output,'fixture.css'),'utf8');
const css = await postcss([postcssImport(),tailwindcss(path.join(root,'tailwind.config.ts')),autoprefixer()]).process(await readFile('src/index.css','utf8'),{from:path.join(root,'src/index.css')});
await writeFile(path.join(output,'fixture.css'),css.css+'\n'+componentCSS);
await writeFile(path.join(output,'fixture.html'),'<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>');
await writeFile(path.join(output,'source-receipt.json'),JSON.stringify({base:'f271a32426acde8e8ee08c8c5df1d0adf3f39cdc',mode:'Actual page/calendar/UniversalFilter and taxonomy hook; synthetic readers, denied writers, fallback fonts',sources:await Promise.all(['src/pages/property/PropertySearchPage.tsx','src/components/home/HomeSearchDateRange.tsx','src/components/filters/UniversalFilter.tsx','src/lib/propertySearchQuery.ts','src/lib/propertyCatalogServerFilters.ts','src/lib/propertySearchPresentation.ts','src/components/property/PropertyCategoryIcons.tsx','src/lib/propertySortPrice.ts','src/lib/nav/floatingStack.ts','src/hooks/usePropertyFilterOptions.ts','src/index.css','src/styles/cinematic-home.css','src/styles/property-search.css','src/styles/public-commerce.css'].map(async file=>({file,sha256:createHash('sha256').update(await readFile(file)).digest('hex')})))},null,2));
if(process.argv.includes('--build-only')) process.exit(0);
const run=spawnSync('python3',[path.join(root,'scripts/qa/search-controls-ui.py'),output],{stdio:'inherit'});
process.exitCode=run.status??1;

