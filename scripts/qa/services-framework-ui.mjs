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
const root = process.cwd();
const output = '/tmp/browser/services-framework-isolated';
await mkdir(output, { recursive: true });
const virtual = {
 '@/contexts/LanguageContext': `export const useLanguage=()=>({language:new URLSearchParams(location.search).get('lang')||'ru',t:s=>s});`,
 '@/contexts/AuthContext': `export const useAuth=()=>({user:{id:'synthetic-guest'}});`,
 '@/hooks/useServiceOrders': `export const useGuestServiceOrders=()=>({orders:[{id:'synthetic-request',service_name:'Synthetic cleaning and maintenance',service_name_ru:'Тестовая уборка и обслуживание помещения',status:'pending',amount:0,currency:'USD',notes:'Synthetic address / Тестовый адрес'}],cancelOrder:{isPending:false,isError:false,mutate:()=>{window.cancelled=true}},refetch:()=>{},error:new URLSearchParams(location.search).get('state')==='error'?new Error('Synthetic denied'):null});`,
 '@/hooks/useServiceMarketplace': `const error=new URLSearchParams(location.search).get('state')==='error';export const useProviderHours=()=>({data:[{weekday:1,start_time:'09:00',end_time:'12:00'}],isSuccess:!error,isError:error,isFetching:false,refetch:()=>{window.retried=true}});export const useBusySlots=()=>({data:[],isSuccess:!error,isError:error,isFetching:false,refetch:()=>{window.retried=true}});export const useCreateServiceOrder=()=>({isPending:false,mutateAsync:async v=>{window.request=v;return {id:'synthetic-request',status:'pending'}}});export const orderErrorCode=()=> 'UNKNOWN';export const useMyProvider=()=>({data:{id:'synthetic-provider',name:'Synthetic supplier / Тестовый поставщик'}});export const useProviderServicesAdmin=()=>({data:[]});export const useProviderOrders=()=>({data:[{id:'synthetic-request',status:'pending',service_name:'Synthetic service',service_name_ru:'Тестовая услуга',amount:0,currency:'USD',notes:'Тестовый адрес / Synthetic address'}]});`,
 '@/hooks/useAdmin': `export const useAdminCheck=()=>({isAdmin:true});export const useAdminProviders=()=>({providers:[{id:'synthetic-provider',name:'Synthetic supplier'}]});export const useAdminCategories=()=>({categories:[]});export const useAdminServices=()=>({services:[],createService:async v=>{window.offering=v;return {data:{id:'synthetic-offering'},error:null}}});`,
 '@/hooks/useCityCurrency': `export const useCityCurrency=()=>({code:'THB'});`,
 '@/hooks/useAdminContentCreation': `export const useOnBehalfContext=()=>({isOnBehalf:false});`,
 '@/hooks/useAutoTranslate': `export const useAutoTranslate=()=>({translateMultiple:async()=>({}),isTranslating:false});`,
 '@/components/admin/OnBehalfBanner': `export const OnBehalfBanner=()=>null;`,
 '@/components/upload/ImageUpload': `export const MultiImageUpload=()=>null;`,
 '@/hooks/useProviderDetails': `export const useProviderDetails=()=>({provider:{id:'synthetic-provider',name:'Synthetic supplier',description_en:'Synthetic description',description_ru:'Тестовое описание'},services:[{id:'synthetic-service',name_en:'Synthetic service',name_ru:'Тестовая услуга',price:0,currency:'USD',duration_minutes:90,lead_time_hours:0}],isLoading:false});`,
 '@/hooks/useReviews': `export const useReviews=()=>({reviews:[],stats:{average:null,total:0},isLoading:false});`,
 '@/contexts/CartContext': `export const useCart=()=>({items:[],addItem:()=>{},removeItem:()=>{}});`,
 '@/hooks/useCartToast': `export const useCartToast=()=>({showAddedToast:()=>{}});`,
 '@/components/layout/AppLayout': `export const AppLayout=({children})=><main>{children}</main>;`,
 '@/integrations/supabase/client': `export const supabase=new Proxy({},{get(){throw Error('Production database forbidden in fixture')}});`,
};
const result = await build({
 stdin: {contents:`import React from 'react';import {createRoot} from 'react-dom/client';import {MemoryRouter,Routes,Route} from 'react-router-dom';import {QueryClient,QueryClientProvider} from '@tanstack/react-query';import {ServiceBookingSheet} from '${root}/src/components/services/ServiceBookingSheet.tsx';import {MyServiceRequests} from '${root}/src/components/services/MyServiceRequests.tsx';import VendorServiceDesk,{ProviderServiceDesk} from '${root}/src/pages/vendor/VendorServiceDesk.tsx';import AdminServices from '${root}/src/pages/admin/AdminServices.tsx';import ServiceProviderDetail from '${root}/src/pages/services/ServiceProviderDetail.tsx';
 const RealDate=Date;globalThis.Date=class extends RealDate{constructor(...args){super(...(args.length?args:['2030-01-07T00:00:00Z']))}static now(){return new RealDate('2030-01-07T00:00:00Z').getTime()}};
 const view=new URLSearchParams(location.search).get('view');function App(){const [open,setOpen]=React.useState(true);return view==='operator'?<ProviderServiceDesk provider={{id:'synthetic-provider',name:'Synthetic supplier / Тестовый поставщик'}}/>:view==='admin'?<AdminServices/>:view==='detail'?<ServiceProviderDetail/>:view==='account'?<MyServiceRequests/>:view==='provider'?<VendorServiceDesk/>:<ServiceBookingSheet open={open} onOpenChange={setOpen} service={{id:'synthetic-service',providerId:'synthetic-provider',name:'Synthetic service / Тестовая услуга',price:0,currency:'USD',durationMinutes:90,leadTimeHours:0}}/>}createRoot(document.getElementById('root')).render(<MemoryRouter initialEntries={[view==='admin'?'/admin/services?provider=synthetic-provider&action=new':'/services/provider/synthetic-provider']}><QueryClientProvider client={new QueryClient()}><Routes><Route path="*" element={<App/>}/><Route path="/services/provider/:id" element={<App/>}/></Routes></QueryClientProvider></MemoryRouter>);`,loader:'tsx',resolveDir:root},
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
