// Actual changed leaf pages; synthetic read-only domain data. No backend admission proof.
import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import postcss from 'postcss';
import postcssImport from 'postcss-import';
import tailwind from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import { radixOverlayAliases } from '../radix-overlay-resolution.mjs';
const root=process.cwd(),out=process.env.DESIGN_ROLLOUT_OUTPUT||path.join(root,'artifacts/design-rollout');
await mkdir(out,{recursive:true});
const base=await readFile('scripts/qa/pms-dashboard-ui.mjs','utf8');
const virtual=new Function(base.slice(base.indexOf('const queryState ='),base.indexOf('const result = await build'))+';return virtual;')();
Object.assign(virtual,{
 '@/contexts/AuthContext':`export const useAuth=()=>({user:new URLSearchParams(location.search).get('scene')==='vendor-landing'?null:{id:'synthetic-design-actor'},isLoading:false});`,
 '@/contexts/CurrencyContext':`export const currencies={THB:{code:'THB',symbol:'฿'}};export const useCurrency=()=>({currency:'THB',currencyInfo:currencies.THB,convertPrice:n=>n,setCurrency:()=>{}});`,
 '@/hooks/useCityCurrency':`export const useCityCurrency=()=>({symbol:'฿',currency:'THB'});`,
 '@/hooks/useUserContext':`export const useUserContext=()=>({vendorOrgs:[],isLoading:false});`,
 '@/hooks/useRevenueAnalytics':`export const useRevenueAnalytics=()=>({monthlyMetrics:[{label:'Synthetic month',income:12000,expenses:2000,netProfit:10000}],kpi:{income:12000,expenses:2000},isLoading:false});`,
 '@/hooks/usePropertyFinancials':`export const EXPENSE_CATEGORIES=[];export const useMcFinanceOverview=()=>({months:[{start:'2026-11-01',byCurrency:[{currency:'THB',recordedIncome:12000,recordedExpenses:2000}],omittedRecords:0}],asOf:'2026-11-19',isLoading:false,isError:false,retry:()=>{}});export const useFinancialStats=()=>({data:{netIncome:10000,thisMonthIncome:12000,thisMonthExpenses:2000}});export const usePropertyFinancialsFull=()=>({data:[{property_id:'synthetic-home',transaction_type:'income',amount:12000},{property_id:'synthetic-home',transaction_type:'expense',amount:2000,category:'other'}],isLoading:false});`,
 '@/hooks/usePropertyCare':`export const useOwnerProperties=()=>({data:[{id:'synthetic-home',title:'Synthetic property',title_ru:'Тестовый объект',price_per_night:2500}],isLoading:false});`,
 '@/hooks/usePropertyBookings':`export const useAllPropertyBookings=()=>({bookings:[],isLoading:false});`,
 '@/hooks/useVendor':`export const useVendorProfile=()=>({profile:{id:'synthetic-vendor',pending_payout:5000,total_earnings:12000},isLoading:false});export const useVendorPayouts=()=>({payouts:[],isLoading:false,requestPayout:()=>{window.fixtureWrites++;throw Error('Writes forbidden')}});`,
 '@/components/vendor/PayoutMethodsSection':`export const PayoutMethodsSection=()=> <section data-domain-boundary="payout-method-editor">Payment-method editor excluded: domain boundary</section>;`,
 '@/components/layout/AppLayout':`export const AppLayout=({children})=><main data-synthetic-shell>{children}</main>;`,
 '@/integrations/supabase/client':`export const supabase=new Proxy({},{get(){throw Error('Production backend forbidden')}});`,
});
const pages={management:'src/pages/ForManagementCompanies.tsx',services:'src/pages/ForLocalServices.tsx','vendor-landing':'src/pages/vendor/VendorLanding.tsx',finance:'src/pages/owner/FinanceOverview.tsx',portfolio:'src/pages/owner/OwnerPortfolio.tsx',payouts:'src/pages/vendor/VendorPayouts.tsx'};
const imports=Object.entries(pages).map(([k,file],i)=>`import Page${i} from '${root}/${file}';`).join('\n');
const result=await build({stdin:{contents:`import React from'react';import{createRoot}from'react-dom/client';import{MemoryRouter,useLocation}from'react-router-dom';import{QueryClient,QueryClientProvider}from'@tanstack/react-query';import{HelmetProvider}from'react-helmet-async';${imports}const p=new URLSearchParams(location.search);document.documentElement.lang=p.get('lang')||'en';document.documentElement.classList.add(p.get('theme')||'light');window.fixtureWrites=0;const pages={${Object.keys(pages).map((k,i)=>JSON.stringify(k)+':Page'+i).join(',')}};const Scene=pages[p.get('scene')];function Route(){return <output hidden id="route">{useLocation().pathname+useLocation().search}</output>};createRoot(document.getElementById('root')).render(<HelmetProvider><QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><MemoryRouter initialEntries={['/synthetic-design']}><Route/><p className="p-2 text-xs text-muted-foreground">Actual leaf page; synthetic identity/data/shell and payment-editor boundary. No backend or role acceptance.</p><div id="actual-scene"><Scene/></div></MemoryRouter></QueryClientProvider></HelmetProvider>);`,resolveDir:root,loader:'tsx'},bundle:true,format:'esm',outfile:out+'/app.js',jsx:'automatic',metafile:true,alias:radixOverlayAliases,define:{'process.env.NODE_ENV':'"production"','import.meta.env.DEV':'false'},plugins:[{name:'read-only-design-data',setup(b){b.onResolve({filter:/.*/},a=>{if(Object.hasOwn(virtual,a.path))return{path:a.path,namespace:'synthetic'};if(a.path.startsWith('@/')){const base=path.join(root,'src',a.path.slice(2));const file=[base+'.ts',base+'.tsx',base+'/index.ts',base+'/index.tsx'].find(f=>existsSync(f)&&statSync(f).isFile());if(!file)throw Error('Unresolved '+a.path);return{path:file};}});b.onLoad({filter:/.*/,namespace:'synthetic'},a=>({contents:virtual[a.path],loader:'tsx',resolveDir:root}));}}]});
const inputs=Object.keys(result.metafile.inputs);
if(inputs.some(p=>!p.startsWith('synthetic:')&&/integrations\/supabase\/client|hooks\/(useVendor|useRevenueAnalytics|usePropertyFinancials|usePropertyCare|usePropertyBookings)\.ts$/.test(p)))throw Error('Production data module included');
for(const file of Object.values(pages))if(!inputs.some(p=>p.endsWith(file)))throw Error('Missing actual page '+file);
const css=await postcss([postcssImport(),tailwind(path.join(root,'tailwind.config.ts')),autoprefixer()]).process(await readFile('src/index.css','utf8'),{from:path.join(root,'src/index.css')});
await writeFile(out+'/normal.css',css.css);await writeFile(out+'/index.html','<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/normal.css"></head><body><div id="root"></div><script type="module" src="/app.js"></script></body></html>');
await writeFile(out+'/manifest.json',JSON.stringify({scope:'Actual changed leaf pages; synthetic auth/read data and shell. External fonts blocked. No live workflow or permission acceptance.',sourceHashes:Object.fromEntries(await Promise.all([...Object.values(pages),'src/styles/tokens.css','scripts/qa/design-rollout-surfaces.mjs','scripts/qa/design-rollout-surfaces.py'].map(async f=>[f,createHash('sha256').update(await readFile(f)).digest('hex')]))),inputs,synthetic:Object.keys(virtual)},null,2));
if(!process.argv.includes('--bundle-only')){const r=spawnSync('python3',['scripts/qa/design-rollout-surfaces.py',out],{stdio:'inherit'});process.exitCode=r.status??1;}
