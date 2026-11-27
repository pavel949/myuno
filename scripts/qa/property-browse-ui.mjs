// Real browse page and listing cards; synthetic data/map and local assets only.
import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const root = process.cwd();
const output = '/tmp/browser/property-browse-isolated';
await mkdir(output, { recursive: true });
const virtual = {
  '@/contexts/LanguageContext': `export const useLanguage=()=>({language:new URLSearchParams(location.search).get('lang')||'ru'});`,
  '@/contexts/CurrencyContext': `export const useCurrency=()=>({formatPrice:(n)=>'฿'+Number(n).toLocaleString('en-US')});`,
  '@/hooks/useProperties': `import React from 'react';
const image='/synthetic-property.svg';
const rows=[
{id:'synthetic-villa',title_en:'Synthetic pool villa',title_ru:'Тестовая вилла с бассейном',property_type:'villa',listing_type:'rent',amenities:['pool'],district:'bang_tao',price:2500,price_per_night:2500,sale_price:9500000,price_period:'night',currency:'THB',bedrooms:2,bathrooms:2,area_sqm:140,max_guests:4,cover_image:image,images:[image],created_at:'2026-10-17',updated_at:'2026-10-17',lat:8,lng:98},
{id:'synthetic-condo',title_en:'Synthetic condo',title_ru:'Тестовая квартира',property_type:'condo',listing_type:'rent',amenities:[],district:'rawai',price:1800,price_per_night:1800,sale_price:6000000,price_period:'night',currency:'THB',bedrooms:1,bathrooms:1,area_sqm:60,max_guests:2,cover_image:image,images:[image],created_at:'2026-10-17',updated_at:'2026-10-17',lat:7.8,lng:98.3}
];
export function usePropertiesInfinite(filters) {
  window.fixtureFilters=filters;
  const [state,setState]=React.useState(new URLSearchParams(location.search).get('state')||'populated');
  return {data:{pages:[{properties:state==='empty'||state==='loading'||state==='error'?[]:rows}]},isLoading:state==='loading',isError:state==='error'||state==='partial-error',hasNextPage:false,isFetchingNextPage:false,fetchNextPage:()=>{throw Error('Unexpected pagination')},refetch:()=>{window.fixtureRetry=(window.fixtureRetry||0)+1;setState('populated');}};
}`,
  '@/hooks/useRecentlyViewed': `export const useRecentlyViewed=()=>({items:[]});`,
  '@/hooks/usePropertyFilterOptions': `export const usePropertyFilterOptions=()=>({filterConfig:[]});`,
  '@/hooks/usePersonaFilter': `const applyFilter=(rows)=>rows;export const usePersonaFilter=()=>({applyFilter});`,
  '@/components/seo': `export const SEOHead=()=>null;`,
  '@/components/uno/BackButton': `export const BackButton=()=>null;`,
  '@/components/uno/FavoriteButton': `export const FavoriteButton=()=>null;`,
  '@/components/crosssell': `export const CrossSellSection=()=>null;`,
  '@/components/vertical/VerticalContextBanner': `export const VerticalContextBanner=()=>null;`,
  '@/components/vertical/VerticalInsightPanel': `export const VerticalInsightPanel=()=>null;`,
  '@/components/landings/PersonaFilterChip': `export const PersonaFilterChip=()=>null;`,
  '@/components/filters/UniversalFilter': `export const UniversalFilter=({children})=>children;`,
  '@/components/property/AirbnbSearchBar': `import React from 'react';export const AirbnbSearchBar=()=> <div className="border rounded-full px-4 py-3 text-sm">Phuket · 01–05 Nov · 3 guests</div>;`,
  '@/components/property/PropertyMapView': `import React from 'react';export const PropertyMapView=({properties,selectedId,onSelect,mode,className})=><div data-testid="map" data-mode={mode} className={'border bg-muted p-4 min-h-[240px] flex flex-wrap content-start gap-3 '+className} aria-label="Synthetic map boundary">{properties.map(p=><button key={p.id} data-testid="marker" data-listing-id={p.id} aria-pressed={selectedId===p.id} onClick={()=>onSelect(p.id)} className="border bg-background rounded-full min-h-[44px] px-4">{p.id}</button>)}</div>;`,
  'fixture:PropertyHub': `export const PropertyHubTabs=()=>null;`,
  '@/integrations/supabase/client': `export const supabase=new Proxy({},{get(){throw Error('Production database forbidden')}});`,
};
const result = await build({
  stdin: { contents: `import React from 'react';import {createRoot} from 'react-dom/client';import {MemoryRouter,useLocation,useNavigate} from 'react-router-dom';import Page from '${root}/src/pages/property/PropertyIndex.tsx';function Fixture(){const loc=useLocation();const nav=useNavigate();return <>{loc.pathname==='/property/browse'?<Page/>:<h1 data-testid="detail-boundary">{loc.pathname}</h1>}<output hidden data-testid="location">{loc.pathname+loc.search}</output><button data-testid="history-back" className="min-h-[44px] px-4" onClick={()=>nav(-1)}>QA history back</button></>;}createRoot(document.getElementById('root')).render(<MemoryRouter initialEntries={['/property/browse'+location.search]} future={{v7_startTransition:true,v7_relativeSplatPath:true}}><Fixture/></MemoryRouter>);`, loader: 'tsx', resolveDir: root },
  bundle: true, outfile: path.join(output,'fixture.js'), jsx:'automatic', format:'esm', metafile:true,
  define: { 'process.env.NODE_ENV':'"production"', 'import.meta.env.DEV':'false' },
  plugins:[{name:'isolated-browse-data',setup(b){
    b.onResolve({filter:/.*/}, args=>{
      if(args.path==='./PropertyHub' && args.importer.endsWith('/PropertyIndex.tsx')) return {path:'fixture:PropertyHub',namespace:'fixture'};
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
if(Object.keys(result.metafile.inputs).some(p=>!p.startsWith('fixture:')&&/integrations\/supabase\/client|hooks\/useProperties\.ts$/.test(p))) throw Error('Production data module included');
const css=await fetch('http://localhost:8080/src/index.css?direct');
if(!css.ok) throw Error('Preview CSS unavailable');
await writeFile(path.join(output,'fixture.css'),await css.text());
await writeFile(path.join(output,'synthetic-property.svg'),'<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640"><rect width="640" height="640" fill="#cbd5d0"/><path d="M80 400V240L320 100L560 240V400Z" fill="#f7f5f1"/><rect x="120" y="440" width="400" height="130" fill="#8bbbc3"/></svg>');
await writeFile(path.join(output,'fixture.html'),'<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>');
const run=spawnSync('python3',[path.join(root,'scripts/qa/property-browse-ui.py'),output],{stdio:'inherit'});
process.exitCode=run.status??1;

