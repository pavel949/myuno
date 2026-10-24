// Actual OrderTracking with real BottomBar and closed Chat; synthetic reads/shell, all external transport forbidden.
import { build } from 'esbuild';
import postcss from 'postcss';
import postcssImport from 'postcss-import';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';
const root = process.cwd();
const output = process.env.ORDERS_CLEARANCE_OUTPUT || path.join(root, 'artifacts/design-system/orders-clearance');
await mkdir(output, { recursive: true });
const virtual = {
  '@/hooks/useOrderTracking':`export const useOrderTracking=()=>({order:{id:'synthetic-order',order_number:'PROP-SYNTHETIC',order_type:'property',status:'pending',total_amount:7500,currency:'THB',order_items:[{id:'item',item_type:'property',item_name:'Synthetic home',qty:1,amount:7500}],order_addresses:[]},timeline:[],isLoading:false,error:null,refetch:()=>{},timelineError:null,timelineLoading:false,retryTimeline:()=>{},getProgressPercentage:()=>25,isStatusCompleted:()=>false,STATUS_SEQUENCE:['pending','confirmed','in_progress','completed']});`,
  '@/components/uno/PageHeader':`export const PageHeader=({title})=><h1>{title}</h1>;`,
  '@/hooks/useReviews':`export const useCreateReview=()=>{throw Error('Writer forbidden')};`,
  '@/components/orders/CrossSellRecommendations':`export const CrossSellRecommendations=()=>null;`,

  '@/contexts/LanguageContext': `export const useLanguage=()=>({language:new URLSearchParams(location.search).get('lang')||'ru',t:(s)=>s});`,
  '@/contexts/AuthContext': `export const useAuth=()=>({user:new URLSearchParams(location.search).get('actor')==='member'?{id:'synthetic',email:'synthetic@example.test'}:null});`,
  '@/lib/analytics/track': `export const trackEvent=()=>{};`,
  '@/components/layout/AppLayout': `export const AppLayout=({children})=><main>{children}</main>;`,
  '@/components/filters/UniversalFilter': `export const UniversalFilter=()=>null;`,
  '@/components/landings/PersonaFilterChip': `export const PersonaFilterChip=()=>null;`,
  '@/components/seo': `export const SEOHead=()=>null;`,
  '@/components/crosssell/CrossSellSection': `export const CrossSellSection=()=>null;`,
  '@/components/map/UnifiedCatalogMap': `export const UnifiedCatalogMap=()=>null;`,
  '@/hooks/usePersonaFilter': `export const usePersonaFilter=()=>({applyFilter:rows=>rows});`,
  '@/hooks/usePWAInstall': `export const usePWAInstall=()=>({canInstall:false,isInstalled:false,isIOS:false,install:()=>{throw Error('Install forbidden')}});`,
  '@/hooks/usePrefetch': `export const usePrefetchRoute=()=>({prefetchRoute:()=>{}});`,
  '@/lib/prefetchRoute': `export const prefetchRoute=()=>{};`,
  '@/components/layout/AllAppsDrawer': `export const AllAppsDrawer=()=>null;`,
  '@/hooks/useHapticFeedback': `export const triggerHaptic=()=>{};`,
  '@/hooks/useSoundEffects': `export const playSound=()=>{};export const isTypingKey=()=>false;`,
  '@/hooks/useFeedbackSettings': `export const getFeedbackSettings=()=>({});`,
  '@/hooks/useOrders': `export const useOrders=()=>({isCreating:false,createOrder:async body=>{window.fixtureAttempts.push(body);throw Error('Synthetic intercepted failure')}});`,
  '@/hooks/useGeolocation': `export const useGeolocation=()=>({hasLocation:false,loading:false,getPosition:()=>{throw Error('Geolocation forbidden')}});`,
  '@/hooks/useServiceMarketplace': `import{useState}from'react';export const useMarketplaceServices=()=>{const[retried,retry]=useState(false);const mode=new URLSearchParams(location.search).get('mode');return{data:[],isLoading:mode==='loading',isError:mode==='error'&&!retried,refetch:()=>retry(true)}};`,
  '@/components/services': `export {ServiceFunctionCard} from '${root}/src/components/services/ServiceFunctionCard.tsx';`,
  './ServiceBookingSheet': `export const ServiceBookingSheet=()=>null;`,
  '@/integrations/supabase/client': `export const supabase={functions:{invoke:async(name,args)=>{window.fixtureInquiries.push({name,args});return{data:null,error:new Error('Synthetic unavailable')}}}};`,
};
const result = await build({
  stdin: { contents: `import React from'react';import{createRoot}from'react-dom/client';import{MemoryRouter,Routes,Route}from'react-router-dom';import OrderTracking from'${root}/src/pages/orders/OrderTracking.tsx';import{BottomBar}from'${root}/src/components/nav/BottomBar.tsx';import{UnifiedChatFAB}from'${root}/src/components/chat/UnifiedChatFAB.tsx';const q=new URLSearchParams(location.search);document.documentElement.style.fontSize=q.get('enlarged')==='true'?'24px':'16px';document.documentElement.classList.add('dark');createRoot(document.getElementById('root')).render(<MemoryRouter initialEntries={['/orders/synthetic-order/tracking']}><p className="text-xs">Actual OrderTracking/BottomBar/closed chat; synthetic shell/read hooks. No backend or auth acceptance.</p><Routes><Route path="/orders/:id/tracking" element={<OrderTracking/>}/></Routes><BottomBar role="guest"/><UnifiedChatFAB/></MemoryRouter>);`, loader: 'tsx', resolveDir: root },
  bundle: true, outfile: path.join(output,'fixture.js'), jsx:'automatic', format:'esm', metafile:true,
  define: { 'process.env.NODE_ENV':'"production"', 'import.meta.env.DEV':'false', 'import.meta.env.VITE_SUPABASE_URL':'"https://synthetic.invalid"' },
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
if(Object.keys(result.metafile.inputs).some(p=>!p.startsWith('fixture:')&&/integrations\/supabase\/client|hooks\/useServiceMarketplace\.ts$/.test(p))) throw Error('Production data module included');
const css=await postcss([postcssImport(),tailwindcss(),autoprefixer()]).process(await readFile(path.join(root,'src/index.css'),'utf8'),{from:path.join(root,'src/index.css')});await writeFile(path.join(output,'fixture.css'),css.css);
await writeFile(path.join(output,'fixture.html'),'<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>');
for(const file of ['pages/orders/OrderTracking.tsx','nav/BottomBar.tsx','chat/UnifiedChatFAB.tsx'])if(!Object.keys(result.metafile.inputs).some(i=>i.endsWith(file)))throw Error('Actual component absent '+file);await writeFile(path.join(output,'source-receipt.json'),JSON.stringify({gitHead:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),capturedAt:new Date().toISOString(),actual:['OrderTracking','BottomBar(role=guest, authenticated actor)','UnifiedChatFAB(closed)'],synthetic:Object.keys(virtual),sources:await Promise.all(['src/pages/orders/OrderTracking.tsx','src/components/nav/BottomBar.tsx','src/components/chat/UnifiedChatFAB.tsx','src/lib/nav/floatingStack.ts','src/index.css','src/styles/tokens.css'].map(async file=>({file,sha256:(await import('node:crypto')).createHash('sha256').update(await readFile(path.join(root,file))).digest('hex')})))},null,2));
if(process.argv.includes('--build-only')) process.exit(0);
const run=spawnSync('python3',[path.join(root,'scripts/qa/orders-floating-clearance.py'),output,...(process.argv.includes('--before')?['--before']:[])],{stdio:'inherit'});
process.exitCode=run.status??1;
