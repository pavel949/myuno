// Real request/account/operator components. All data is synthetic; backend imports are forbidden.
import { build } from 'esbuild';
import postcss from 'postcss';
import postcssImport from 'postcss-import';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const root = process.cwd(), output = '/tmp/browser/services-framework-isolated';
await mkdir(output, { recursive: true });
const virtual = {
 '@/contexts/LanguageContext': `export const useLanguage=()=>({language:new URLSearchParams(location.search).get('lang')||'ru',t:s=>s});`,
 '@/contexts/AuthContext': `export const useAuth=()=>({user:{id:'synthetic-guest'}});`,
 '@/hooks/useServiceOrders': `export const useGuestServiceOrders=()=>({orders:[{id:'synthetic-request',service_name:'Synthetic cleaning and maintenance',service_name_ru:'Тестовая уборка и обслуживание помещения',status:'pending',amount:0,currency:'USD',notes:'Synthetic address / Тестовый адрес'}],cancelOrder:{isPending:false,isError:false,mutate:()=>{window.cancelled=true}},refetch:()=>{},error:new URLSearchParams(location.search).get('state')==='error'?new Error('Synthetic denied'):null});`,
 '@/hooks/useServiceMarketplace': `const error=new URLSearchParams(location.search).get('state')==='error';export const useProviderHours=()=>({data:[{weekday:1,start_time:'09:00',end_time:'12:00'}],isSuccess:!error,isError:error,isFetching:false,refetch:()=>{window.retried=true}});export const useBusySlots=()=>({data:[],isSuccess:!error,isError:error,isFetching:false,refetch:()=>{window.retried=true}});export const useCreateServiceOrder=()=>({isPending:false,mutateAsync:async v=>{window.request=v;return {id:'synthetic-request',status:'pending'}}});export const orderErrorCode=()=> 'UNKNOWN';export const useMyProvider=()=>({data:{id:'synthetic-provider',name:'Synthetic supplier / Тестовый поставщик'}});export const useProviderServicesAdmin=()=>({data:[]});export const useProviderOrders=()=>({data:[{id:'synthetic-request',status:'pending',service_name:'Synthetic service',service_name_ru:'Тестовая услуга',amount:0,currency:'USD',notes:'Тестовый адрес / Synthetic address'}]});`,
 '@/integrations/supabase/client': `export const supabase=new Proxy({},{get(){throw Error('Production database forbidden in fixture')}});`,
};
const result = await build({
 stdin: {contents:`import React from 'react';import {createRoot} from 'react-dom/client';import {MemoryRouter} from 'react-router-dom';import {QueryClient,QueryClientProvider} from '@tanstack/react-query';import {ServiceBookingSheet} from '${root}/src/components/services/ServiceBookingSheet.tsx';import {MyServiceRequests} from '${root}/src/components/services/MyServiceRequests.tsx';import VendorServiceDesk from '${root}/src/pages/vendor/VendorServiceDesk.tsx';
 const RealDate=Date;globalThis.Date=class extends RealDate{constructor(...args){super(...(args.length?args:['2030-01-07T00:00:00Z']))}static now(){return new RealDate('2030-01-07T00:00:00Z').getTime()}};
 const view=new URLSearchParams(location.search).get('view');function App(){const [open,setOpen]=React.useState(true);return view==='account'?<MyServiceRequests/>:view==='provider'?<VendorServiceDesk/>:<ServiceBookingSheet open={open} onOpenChange={setOpen} service={{id:'synthetic-service',providerId:'synthetic-provider',name:'Synthetic service / Тестовая услуга',price:0,currency:'USD',durationMinutes:90,leadTimeHours:0}}/>}createRoot(document.getElementById('root')).render(<MemoryRouter><QueryClientProvider client={new QueryClient()}><App/></QueryClientProvider></MemoryRouter>);`,loader:'tsx',resolveDir:root},
 bundle:true,outfile:path.join(output,'fixture.js'),jsx:'automatic',format:'esm',metafile:true,
 define:{'process.env.NODE_ENV':'"production"','import.meta.env.DEV':'false'},
 plugins:[{name:'isolate-framework',setup(b){b.onResolve({filter:/.*/},args=>{
 if(Object.hasOwn(virtual,args.path))return {path:args.path,namespace:'fixture'};
 if(args.path.startsWith('@/')){const base=path.join(root,'src',args.path.slice(2));const p=[base,base+'.ts',base+'.tsx',path.join(base,'index.ts')].find(p=>existsSync(p)&&statSync(p).isFile());if(!p)throw Error('Unresolved '+args.path);return {path:p};}
 });b.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:virtual[args.path],loader:'tsx',resolveDir:root}));}}],
});
if(Object.keys(result.metafile.inputs).some(p=>!p.startsWith('fixture:')&&/integrations\/supabase\/client|hooks\/useService(Marketplace|Orders)\.ts$/.test(p)))throw Error('Production data module bundled');
const css=await postcss([postcssImport(),tailwindcss(),autoprefixer()]).process(await readFile(path.join(root,'src/index.css'),'utf8'),{from:path.join(root,'src/index.css')});
await writeFile(path.join(output,'fixture.css'),css.css);
await writeFile(path.join(output,'fixture.html'),'<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>');
if(!process.argv.includes('--build-only'))process.exitCode=spawnSync('python3',[path.join(root,'scripts/qa/services-framework-ui.py'),output],{stdio:'inherit'}).status??1;
