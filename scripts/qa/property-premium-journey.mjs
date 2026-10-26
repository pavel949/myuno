// Actual changed React components + actual area page; synthetic catalogue, no production API.
import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { existsSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const root = process.cwd().replaceAll('\\', '/');
const output = path.resolve('artifacts/design-system/property-journey');
await mkdir(output, { recursive: true });
const language = "export const useLanguage=()=>({language:new URLSearchParams(window.location.search).get('lang')||'ru'});";
const image = 'https://fixture.invalid/property.svg';
const property = { id:'synthetic-unit', title_ru:'Тестовая вилла', title_en:'Synthetic villa', listing_type:'rent', listing_modes:['rent','sale'], tenancy_modes:['short','long'], property_type:'villa', district:'Bang Tao', created_at:'2026-10-26', updated_at:'2026-10-26', bedrooms:3, area_sqm:180, images:[image,image+'%20',image+'%20%20'], cover_image:image };
const virtual = {
 '@/contexts/LanguageContext': language,
 '@/contexts/CurrencyContext': "export const useCurrency=()=>({formatPrice:value=>'฿'+value});",
 '@/hooks/useProperties': `export const useProperties=()=>({data:[${JSON.stringify(property)}],isLoading:false,isError:false});`,
 '@/hooks/useOffplanProjects': "export const useOffplanProjects=()=>({data:[]});",
 '@/components/layout/AppLayout': "import React from 'react';export const AppLayout=({children})=><main>{children}</main>;",
 '@/pages/NotFound': "export default function NotFound(){return <h1>Not found</h1>}",
};
const entry = `import React from 'react';import{createRoot}from'react-dom/client';import{MemoryRouter,Routes,Route,useLocation}from'react-router-dom';import{HelmetProvider}from'react-helmet-async';
import{PropertyJourneyNav,PropertyAreaGuide}from'${root}/src/components/property/PropertyJourney.tsx';
import{PropertyDetailGallery}from'${root}/src/components/property/detail/PropertyDetailGallery.tsx';
import{HomeListingCard}from'${root}/src/components/home/HomeListingCard.tsx';
import AreaLandingPage from '${root}/src/pages/area/AreaLandingPage.tsx';
import '${root}/src/styles/cinematic-home.css';import '${root}/src/styles/public-commerce.css';
const property=${JSON.stringify(property)};
function Location(){const l=useLocation();return <output data-testid="qa-location">{l.pathname+l.search}</output>}
function Detail(){const l=useLocation();const [photo,setPhoto]=React.useState(null);return <main className="public-commerce premium-property"><PropertyJourneyNav property={property} mode={l.search.includes('mode=buy')?'buy':'rent'}/><h1 className="public-commerce-title">Synthetic villa / Тестовая вилла</h1><PropertyDetailGallery images={property.images} alt="Synthetic QA" onOpenLightbox={setPhoto}/><output data-testid="qa-photo">{photo}</output><PropertyAreaGuide property={property}/></main>}
function Home(){return <main className="cinematic-home"><div className="home-container home-gallery"><HomeListingCard property={property}/></div></main>}
const initial=new URLSearchParams(window.location.search).get('page')==='home'?'/':'/property/synthetic-unit?mode=rent&checkIn=2026-12-01&checkOut=2026-12-08&guests=3';
createRoot(document.getElementById('root')).render(<HelmetProvider><MemoryRouter initialEntries={[initial]}><Location/><Routes><Route path="/" element={<Home/>}/><Route path="/property/:id" element={<Detail/>}/><Route path="/area/:slug" element={<AreaLandingPage/>}/></Routes></MemoryRouter></HelmetProvider>);`;
const bundle = await build({
 stdin:{contents:entry,resolveDir:root,loader:'tsx'},bundle:true,format:'esm',jsx:'automatic',outfile:path.join(output,'bundle.js'),
 define:{'process.env.NODE_ENV':'"production"','import.meta.env':'{}'},metafile:true,
 plugins:[{name:'synthetic-read-boundaries',setup(b){
  b.onResolve({filter:/.*/},args=>args.path in virtual?{path:args.path,namespace:'virtual-read'}:undefined);
  b.onLoad({filter:/.*/,namespace:'virtual-read'},args=>({contents:virtual[args.path],loader:'tsx',resolveDir:root}));
  b.onResolve({filter:/^@\//},args=>{const base=path.join(root,'src',args.path.slice(2));const resolved=[base,base+'.ts',base+'.tsx',path.join(base,'index.ts'),path.join(base,'index.tsx')].find(file=>existsSync(file)&&statSync(file).isFile());if(!resolved)throw Error('Unresolved '+args.path);return {path:resolved};});
 }}],
});
const inputs=Object.keys(bundle.metafile.inputs);
for(const actual of ['property/PropertyJourney.tsx','property/detail/PropertyDetailGallery.tsx','home/HomeListingCard.tsx','pages/area/AreaLandingPage.tsx'])if(!inputs.some(file=>file.endsWith(actual)))throw Error('Actual component absent: '+actual);
if(inputs.some(file=>!file.startsWith('virtual-read:')&&['/hooks/useProperties.ts','/hooks/useOffplanProjects.ts'].some(suffix=>file.endsWith(suffix))))throw Error('Production read module bundled');
await writeFile(path.join(output,'bundle-inputs.json'),JSON.stringify(inputs,null,2));
// Use the same compiled Tailwind and theme CSS as existing full public fixtures.
await writeFile(path.join(output,'theme.css'),await readFile('artifacts/design-system/core/pms/normal.css'));
await writeFile(path.join(output,'index.html'),'<!doctype html><html><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/theme.css"><link rel="stylesheet" href="/bundle.css"><div id="root"></div><script type="module" src="/bundle.js"></script></html>');
const result=spawnSync('python',['scripts/qa/property-premium-journey.py',output],{stdio:'inherit',timeout:180000});
if(result.status!==0)throw Error('Property premium journey browser verification failed: '+(result.error?.message||result.status));
