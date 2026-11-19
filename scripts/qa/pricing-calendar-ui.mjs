// Synthetic browser fixture. Every data boundary is stubbed; no production requests.
import { build } from 'esbuild';
import { radixOverlayAliases } from '../radix-overlay-resolution.mjs';
import { mkdir,writeFile } from 'node:fs/promises';
import { existsSync,statSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const root = process.cwd();
const output = '/tmp/browser/pricing-calendar';
await mkdir(output,{recursive:true});
const virtual={
 '@/contexts/AuthContext':`export const useAuth=()=>({user:{id:'fixture-user'}})`,
 '@/contexts/LanguageContext':`export const useLanguage=()=>({language:new URLSearchParams(location.search).get('lang')||'ru'})`,
 '@/hooks/useMyProperties':`export const useMyProperties=()=>({allProperties:[
   {property_id:'fixture-property',title:'The Title · A102',title_ru:'The Title · A102',record_currency:'THB',price_per_night:3200},
   {property_id:'fixture-villa',title:'Villa with a long name in Choeng Thale, Phuket',title_ru:'Вилла с длинным названием в Чернг Талай, Пхукет',record_currency:'THB',price_per_night:4200}
 ]})`,
 '@/hooks/useAIPricingSuggestions':`export const useAIPricingSuggestions=()=>({suggestions:[],generateSuggestions:{}})`,
 '@/hooks/useRoomCategories':`export const useRoomCategories=()=>({data:{categories:[{id:'fixture-category',name_en:'Superior apartments',name_ru:'Улучшенные апартаменты',base_price_per_night:3900}]}})`,
 '@/hooks/usePropertyCare':`export const useOwnerProperty=()=>({data:{price_per_night:3200}})`,
 '@/hooks/usePropertyRateSeasons':`export const usePropertyRateSeasons=()=>({data:[{start_date:'2026-10-23',end_date:'2026-10-27',nightly_rate:4500}]});
 export const useOwnerRateSeasons=()=>({data:[]});
 export const useSaveRateSeason=()=>({});
 export const useDeleteRateSeason=()=>({});`,
 '@/hooks/useStaysUnifiedCalendar':`export const useStaysUnifiedCalendar=()=>({data:{unifiedDayMeta:new Map([['2026-10-21',{}],['2026-10-22',{}]])}})`,
 '@/integrations/supabase/client':`export const supabase={from:()=>{const c={}; for(const k of ['select','eq','gte','in','order']) c[k]=()=>c; c.limit=async()=>({data:[],error:null}); c.lt=async()=>({data:[{date:'2026-10-21',price_override:2500,status:'booked',booking_id:'fixture-booking'},{date:'2026-10-22',price_override:2800,status:'booked'}],error:null});return c},rpc:async(name,a)=>{if(name==='get_property_calendar_prices')return {data:[{date:'2026-10-21',price_override:2500,status:'booked',booking_id:'fixture-booking'},{date:'2026-10-22',price_override:2800,status:'booked'}],error:null};window.fixtureLastSave=a;return {data:{property_id:a.p_property_id,category_id:a.p_category_id,nights:(Date.parse(a.p_to)-Date.parse(a.p_from))/86400000,nightly_rate:a.p_price,currency:a.p_currency},error:null}}}`,
};
await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import {MemoryRouter} from 'react-router-dom';import {QueryClient,QueryClientProvider} from '@tanstack/react-query';import RateManagementPage from '${root}/src/pages/owner/RateManagementPage.tsx';document.documentElement.lang=new URLSearchParams(location.search).get('lang')||'ru';createRoot(document.getElementById('root')).render(<QueryClientProvider client={new QueryClient()}><MemoryRouter initialEntries={['/mc/rates?property=fixture-property&date=2026-10-21']}><main><RateManagementPage/></main></MemoryRouter></QueryClientProvider>);`,loader:'tsx',resolveDir:root},alias:radixOverlayAliases,bundle:true,outfile:path.join(output,'fixture.js'),jsx:'automatic',format:'esm',define:{'process.env.NODE_ENV':'"production"','import.meta.env.DEV':'false'},plugins:[{name:'isolate-data',setup(b){b.onResolve({filter:/.*/},a=>{if(Object.hasOwn(virtual,a.path))return{path:a.path,namespace:'fixture'};if(a.path.startsWith('@/')){const base=path.join(root,'src',a.path.slice(2));return{path:[base,base+'.ts',base+'.tsx',path.join(base,'index.tsx')].find(p=>existsSync(p)&&statSync(p).isFile())}}});b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:virtual[a.path],loader:'js',resolveDir:root}));}}]});
const css=await fetch('http://localhost:8080/src/index.css?direct');if(!css.ok)throw Error('Start local Vite on 8080 for CSS');
await writeFile(path.join(output,'fixture.css'),await css.text());
await writeFile(path.join(output,'index.html'),'<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>');
console.log(output);
if (!process.argv.includes('--build-only')) {
 const run = spawnSync('python3', ['scripts/qa/pricing-calendar-ui.py', output], { stdio: 'inherit' });
 process.exitCode = run.status ?? 1;
}
