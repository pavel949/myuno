import { build } from 'esbuild';
import { createServer } from 'vite';
import { mkdir,writeFile } from 'node:fs/promises';
import { existsSync,statSync } from 'node:fs';
import path from 'node:path';
import { ids } from './server.mjs';
export async function buildFixture(root,output){
 await mkdir(output,{recursive:true});
 const data=`export const ids=${JSON.stringify(ids)}; export const properties=[{property_id:ids.unit,title:'Synthetic unit A',record_currency:'THB',price_per_night:1000},{property_id:ids.other,title:'Synthetic unit B',record_currency:'THB',price_per_night:1100},{property_id:ids.hotel,title:'Synthetic hotel',record_currency:'THB',price_per_night:2000}];`;
 const virtual={
  'fixture-data':data,
  '@/contexts/AuthContext':`export const useAuth=()=>({user:{id:new URLSearchParams(location.search).get('actor')==='foreign'?'${ids.foreign}':'${ids.owner}'}})`,
  '@/contexts/LanguageContext':`export const useLanguage=()=>({language:new URLSearchParams(location.search).get('lang')||'en'})`,
  '@/hooks/useMyProperties':`import {properties} from 'fixture-data';export const useMyProperties=()=>({allProperties:properties,isLoading:false})`,
  '@/hooks/usePropertyComplexes':`export const usePropertyComplexes=()=>({data:[]})`,
  '@/hooks/usePropertyProjects':`export const usePropertyProjects=()=>({data:[]})`,
  '@/components/owner/MultiPropertyTimeline':`export const MultiPropertyTimeline=()=>null`,
  '@/components/owner/CalendarTodayTasks':`export const CalendarTodayTasks=()=>null`,
  '@/components/owner/CalendarSyncManager':`export const CalendarSyncManager=()=>null`,
  '@/hooks/useRoomCategories':`import {ids} from 'fixture-data';export const useRoomCategories=p=>({data:{categories:p===ids.hotel?[{id:ids.category,name_en:'Category A',name_ru:'Категория A'},{id:ids.otherCategory,name_en:'Category B',name_ru:'Категория B'}]:[]}})`,
  '@/hooks/useStaysUnifiedCalendar':`export const useStaysUnifiedCalendar=()=>({data:{unifiedDayMeta:new Map()}})`,
  '@/hooks/usePropertyBookings':`export const usePropertyBookings=()=>({bookings:[],getBookingForDate:()=>undefined})`,
  '@/hooks/useOperationalTasks':`export const useOperationalTasks=()=>({tasks:[],completeTask:{mutate:()=>{throw Error('Unrelated inventory action forbidden')}}})`,
  '@/hooks/usePropertyAvailabilityManagement':`export const usePropertyAvailabilityManagement=()=>({availability:[]})`,
  '@/hooks/usePropertyAvailability':`import {properties} from 'fixture-data';export const usePropertyRentalTerms=p=>({data:{price_per_night:properties.find(x=>x.property_id===p)?.price_per_night}})`,
  '@/hooks/usePropertyRateSeasons':`export const usePropertyRateSeasons=()=>({data:[]})`,
  '@/integrations/supabase/client':`export const supabase={rpc:async(name,args)=>{const response=await fetch('/rpc',{method:'POST',headers:{'Content-Type':'application/json','x-fixture-actor':new URLSearchParams(location.search).get('actor')||'owner'},body:JSON.stringify({name,args})});return response.json()}}`,
 };
 for(const name of ['CreateServiceTaskDialog','AddBookingFromCalendarDialog','BlockDatesDialog','BookingDetailSheet']){
  virtual['./'+name]=`export const ${name}=()=>null`;virtual['@/components/owner/'+name]=virtual['./'+name];
 }
 virtual['./LegacyTaskDetailSheet']='export const TaskDetailSheet=()=>null';
 const entry=`import React from 'react';import{createRoot}from'react-dom/client';import{BrowserRouter,Routes,Route,useSearchParams,Link}from'react-router-dom';import{QueryClient,QueryClientProvider}from'@tanstack/react-query';import{Toaster}from'sonner';import{properties,ids}from'fixture-data';import{CalendarPriceEditor}from'${root}/src/components/owner/pricing/CalendarPriceEditor.tsx';import OwnerCalendar from'${root}/src/pages/owner/OwnerCalendar.tsx';function App(){const[p]=useSearchParams();const property=properties.find(x=>x.property_id===p.get('property'))||properties[0];return <main style={{maxWidth:1100,margin:'auto',padding:16}}><p>ISOLATED SYNTHETIC ACCEPTANCE</p><Routes><Route path='/mc/calendar' element={<OwnerCalendar/>} /><Route path='*' element={<CalendarPriceEditor key={property.property_id} property={property}/>} /></Routes><Toaster/></main>}createRoot(document.getElementById('root')).render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><BrowserRouter><App/></BrowserRouter></QueryClientProvider>);`;
 await build({stdin:{contents:entry,loader:'tsx',resolveDir:root},bundle:true,outfile:path.join(output,'fixture.js'),jsx:'automatic',format:'esm',define:{'process.env.NODE_ENV':'"production"','import.meta.env.DEV':'false'},plugins:[{name:'isolate-fixture',setup(b){b.onResolve({filter:/.*/},a=>{if(Object.hasOwn(virtual,a.path))return{path:a.path,namespace:'fixture'};if(a.path.startsWith('@/')){const base=path.join(root,'src',a.path.slice(2));const resolved=[base,base+'.ts',base+'.tsx',path.join(base,'index.tsx')].find(p=>existsSync(p)&&statSync(p).isFile());if(!resolved)throw Error('Unresolved fixture import '+a.path);return{path:resolved}}});b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:virtual[a.path],loader:'js',resolveDir:root}));}}]});
 // CSS-only Vite server: no application entry, MCP plugin, env file or warmup.
 const cssServer=await createServer({configFile:false,envFile:false,root,optimizeDeps:{noDiscovery:true,entries:[]},server:{host:'127.0.0.1',port:0,preTransformRequests:false},logLevel:'error'});
 try{await cssServer.listen();const address=cssServer.httpServer.address();const response=await fetch(`http://127.0.0.1:${address.port}/src/index.css?direct`);if(!response.ok)throw Error('Fixture CSS failed');await writeFile(path.join(output,'fixture.css'),await response.text());}finally{await cssServer.close();}
 await writeFile(path.join(output,'index.html'),'<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>');
}
