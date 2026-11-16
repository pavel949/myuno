// Actual buyer hub, resale catalogue/card/detail and tab strip; synthetic public reads only.
import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import postcss from 'postcss';
import postcssImport from 'postcss-import';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
const root=process.cwd(),out=process.env.RESALE_JOURNEY_OUTPUT||path.join(root,'artifacts/ux-clarity/resale-journey');await mkdir(out,{recursive:true});
const row={id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',title:'Synthetic garden villa',title_ru:'Тестовая вилла с садом',property_type:'villa',zone:'Rawai',asking_price:6000000,currency:'THB',cover_image:'/synthetic-villa.svg',media:[],bedrooms:2,area_sqm:120,title_type:'freehold',condition:'good',furnished:'fully',status:'active',is_assignment:false};
const virtual={
 '@/contexts/LanguageContext':`export const useLanguage=()=>({language:new URLSearchParams(location.search).get('lang')||'en'});`,
 '@/contexts/CurrencyContext':`export const useCurrency=()=>({formatPrice:v=>'THB '+Number(v).toLocaleString('en-US')});`,
 '@/contexts/LocationContext':`export const useLocation=()=>({currentCity:{default_currency:'THB'}});`,
 '@/contexts/AuthContext':`export const useAuth=()=>({user:null});`,
 '@/hooks/useUserPersonas':`export const useUserPersonas=()=>({personas:[]});`,
 '@/components/layout/AppLayout':`import React from'react';export const AppLayout=({children})=><main>{children}</main>;`,
 '@/components/seo':`export const SEOHead=()=>null;export const createRealEstateListingSchema=()=>({});`,
 '@/components/seo/SEOHead':`export const SEOHead=()=>null;`,
 '@/components/leads/UniversalLeadForm':`export const UniversalLeadForm=()=>null;`,
 '@/components/ui/responsive-modal':`export const ResponsiveModal=()=>null;`,
 '@/pages/services/ServicesIndex':`export default function Services(){throw Error('Services outside resale fixture')}`, 
 '@/hooks/useResaleProperties':`import{useState}from'react';const rows=[${JSON.stringify(row)},{...${JSON.stringify(row)},id:'foreign',title:'Synthetic USD villa',currency:'USD'}];export const useResaleProperties=filters=>{const[failed,setFailed]=useState(new URLSearchParams(location.search).has('failure'));window.fixtureFilters=filters;return{data:rows.filter(r=>(!filters.zone||r.zone===filters.zone)&&(!filters.property_type||r.property_type===filters.property_type)&&(!filters.min_price||r.asking_price>=filters.min_price)&&(!filters.max_price||r.asking_price<=filters.max_price)),isLoading:false,isError:failed,refetch:()=>{window.fixtureRetries=(window.fixtureRetries||0)+1;setFailed(false)}}};export const useResaleProperty=id=>({data:rows.find(r=>r.id===id),isLoading:false,isError:false});`,
 '@/integrations/supabase/client':`export const supabase=new Proxy({},{get(){throw Error('Production backend forbidden in resale fixture')}});`,
};
const source=`import React from'react';import{createRoot}from'react-dom/client';import{MemoryRouter,Routes,Route,useLocation}from'react-router-dom';import Goal from'@/pages/discover/GoalEntryPage';import Index from'@/pages/property/ResaleIndex';import Detail from'@/pages/property/ResaleDetail';import{PropertyHubTabs}from'@/pages/property/PropertyHub';function Tabs(){const l=useLocation();return l.pathname.startsWith('/property')?<PropertyHubTabs/>:null}function Probe(){const l=useLocation();return <output hidden data-testid="location">{l.pathname+l.search+l.hash}</output>}createRoot(document.getElementById('root')).render(<MemoryRouter initialEntries={['/discover/buy']} future={{v7_startTransition:true,v7_relativeSplatPath:true}}><p className="border-b p-2 text-xs">SYNTHETIC PUBLIC JOURNEY — no live reads, requests or payments</p><Tabs/><Probe/><Routes><Route path="/discover/buy" element={<Goal goal="buy"/>}/><Route path="/property/resale" element={<Index/>}/><Route path="/property/resale/:id" element={<Detail/>}/></Routes></MemoryRouter>);`;
const result=await build({stdin:{contents:source,loader:'tsx',resolveDir:root},bundle:true,outfile:out+'/fixture.js',jsx:'automatic',format:'esm',metafile:true,define:{'process.env.NODE_ENV':'"production"','import.meta.env.DEV':'false'},plugins:[{name:'synthetic-resale',setup(b){b.onResolve({filter:/.*/},a=>{if(Object.hasOwn(virtual,a.path))return{path:a.path,namespace:'fixture'};if(a.path.startsWith('@/')){const base=path.join(root,'src',a.path.slice(2));return{path:[base,base+'.tsx',base+'.ts',path.join(base,'index.ts'),path.join(base,'index.tsx')].find(p=>existsSync(p)&&statSync(p).isFile())}}});b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:virtual[a.path],loader:'tsx',resolveDir:root}));b.onLoad({filter:/\.css$/},()=>({contents:'',loader:'css'}));}}]});
if(Object.keys(result.metafile.inputs).some(p=>!p.startsWith('fixture:')&&/integrations\/supabase\/client|hooks\/useResaleProperties\.ts$/.test(p)))throw Error('Production read/write module included');
const css=await postcss([postcssImport(),tailwindcss(root+'/tailwind.config.ts'),autoprefixer()]).process(await readFile('src/index.css','utf8'),{from:root+'/src/index.css'});await writeFile(out+'/fixture.css',css.css+'\n'+await readFile('src/styles/cinematic-home.css','utf8'));await writeFile(out+'/fixture.html','<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>');
const run=spawnSync('python',['scripts/qa/property-resale-journey.py',out],{stdio:'inherit'});process.exitCode=run.status??1;
