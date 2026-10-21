// Actual PMS header/dashboard components with synthetic data and local-only browser assets.
import { build } from 'esbuild';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const root = process.cwd();
const output = '/tmp/browser/pms-dashboard-isolated';
await mkdir(output, { recursive: true });
const queryState = `const state=new URLSearchParams(location.search).get('state')||'empty';const base={isLoading:state==='loading',isError:state==='error',error:state==='error'?Error('Synthetic failure'):null,refetch:()=>{window.fixtureRetries=(window.fixtureRetries||0)+1}};`;
const virtual = {
  '@/contexts/LanguageContext': `export const useLanguage=()=>({language:new URLSearchParams(location.search).get('lang')||'ru',t:key=>key,setLanguage:value=>{window.fixtureLanguage=value}});`,
  '@/contexts/ThemeContext': `export const useTheme=()=>({theme:'light',setTheme:value=>{window.fixtureTheme=value}});`,
  '@/contexts/CurrencyContext': `export const currencies={THB:{code:'THB',symbol:'฿',name:'Thai baht',nameRu:'Тайский бат'}};export const useCurrency=()=>({currency:'THB',currencyInfo:currencies.THB,setCurrency:value=>{window.fixtureCurrency=value}});`,
  '@/contexts/AuthContext': `export const useAuth=()=>({user:{id:'synthetic-operator',email:'synthetic@example.test',user_metadata:{name:'Synthetic Operator'}},signOut:async()=>{}});`,
  '@/contexts/PlatformViewAsContext': `export const usePlatformViewAs=()=>({enter:async()=>{}});`,
  '@/contexts/DashboardFilterContext': `export const useDashboardFilter=()=>({selectedPropertyId:null});`,
  '@/hooks/useProfile': `export const useProfile=()=>({profile:{full_name:'Synthetic Operator'}});`,
  '@/hooks/useBusinessRole': `export const useBusinessRole=()=>({role:'general'});`,
  '@/hooks/useIsAdmin': `export const useIsAdmin=()=>({isAdmin:false});`,
  '@/hooks/useUserContext': `export const useUserContext=()=>({availableRoles:['property_manager'],switchContext:async()=>{}});`,
  '@/hooks/useNotifications': `export const useNotifications=()=>({unreadCount:0});`,
  '@/hooks/useMyProperties': `export const useMyProperties=()=>({allProperties:[],activeProperties:[]});`,
  '@/hooks/usePropertyBookings': `${queryState}export const useAllPropertyBookings=()=>({...base,activeBookings:[],upcomingBookings:[]});`,
  '@/hooks/useOperationalTasks': `${queryState}export const useOperationalTasks=()=>({...base,tasks:[]});`,
  '@/hooks/useCrmTasks': `${queryState}export const useCrmTasks=()=>({...base,data:[]});`,
  '@/hooks/usePropertyFinancials': `${queryState}export const usePropertyFinancialsFull=()=>({...base,data:[]});`,
  '@/hooks/useDayBriefing': `${queryState}export const useDayBriefing=()=>({...base,data:state==='populated'?[{id:'synthetic-reminder',type:'crm_activity',sectionOrder:2,title:'Synthetic client follow-up',meta:{dueTime:'11:30'}}]:[]});`,
  '@/components/nav/ConsumerHeader': `export const ConsumerHeader=()=>null;`,
  '@/components/market/MiniCart': `export const MiniCart=()=>null;`,
  '@/components/search/GlobalSearchModal': `export const GlobalSearchModal=({open,onOpenChange})=>open?<div role="dialog" aria-label="Synthetic search boundary"><button onClick={()=>onOpenChange(false)}>Close search</button></div>:null;`,
  '@/integrations/supabase/client': `export const supabase=new Proxy({},{get(){throw Error('Real database forbidden')}});`,
  '@/hooks/useHapticFeedback': `export const triggerHaptic=()=>{};`,
  '@/hooks/useSoundEffects': `export const playSound=()=>{};export const isTypingKey=()=>false;`,
  '@/hooks/useFeedbackSettings': `export const getFeedbackSettings=()=>({hapticEnabled:false,soundEnabled:false});`,
};
const result = await build({
  stdin: { contents: `
import React,{useState} from 'react';import {createRoot} from 'react-dom/client';import {MemoryRouter,useLocation} from 'react-router-dom';import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {TopBar} from '${root}/src/components/nav/TopBar.tsx';import {SideRail} from '${root}/src/components/nav/SideRail.tsx';import {SidebarProvider} from '${root}/src/components/ui/sidebar.tsx';
import {DashboardGreeting} from '${root}/src/components/owner/dashboard/DashboardGreeting.tsx';import {DashboardDestinations} from '${root}/src/components/owner/dashboard/DashboardDestinations.tsx';import {BusinessRoleSwitcher} from '${root}/src/components/owner/dashboard/BusinessRoleSwitcher.tsx';import {OverviewSection} from '${root}/src/components/owner/dashboard/OverviewSection.tsx';import {BUSINESS_ROLES} from '${root}/src/lib/businessRoles.ts';
function Fixture(){const [role,setRole]=useState('general');const loc=useLocation();return <SidebarProvider><SideRail role="owner"/><div className="min-w-0 flex-1"><TopBar role="owner"/><main className="mx-auto max-w-5xl space-y-5 p-4"><DashboardGreeting roleConfig={BUSINESS_ROLES[role]} mcRoleLabel={{en:'Director',ru:'Директор'}}/><DashboardDestinations businessRole={role} propertyCount={0}/><OverviewSection/><BusinessRoleSwitcher activeRole={role} onRoleChange={setRole}/><p className="text-caption text-muted-foreground">Isolated synthetic fixture</p><output hidden data-testid="view-boundary">{role}</output><output hidden data-testid="route-boundary">{loc.pathname}</output></main></div></SidebarProvider>;}
createRoot(document.getElementById('root')).render(<QueryClientProvider client={new QueryClient()}><MemoryRouter initialEntries={['/mc']} future={{v7_startTransition:true,v7_relativeSplatPath:true}}><Fixture/></MemoryRouter></QueryClientProvider>);`, loader:'tsx',resolveDir:root },
  bundle:true,outfile:path.join(output,'fixture.js'),jsx:'automatic',format:'esm',metafile:true,
  define:{'process.env.NODE_ENV':'"production"','import.meta.env.DEV':'false'},
  plugins:[{name:'isolated-pms-data',setup(b){
    b.onResolve({filter:/.*/},args=>{
      if(Object.hasOwn(virtual,args.path))return{path:args.path,namespace:'fixture'};
      if(args.path.startsWith('@/')){
        const base=path.join(root,'src',args.path.slice(2));
        const resolved=[base,base+'.ts',base+'.tsx',path.join(base,'index.ts'),path.join(base,'index.tsx')].find(p=>existsSync(p)&&statSync(p).isFile());
        if(!resolved)throw Error('Unresolved import: '+args.path);
        return{path:resolved};
      }
    });
    b.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:virtual[args.path],loader:'tsx',resolveDir:root}));
  }}],
});
if(Object.keys(result.metafile.inputs).some(p=>!p.startsWith('fixture:')&&/integrations\/supabase\/client|hooks\/(usePropertyBookings|useOperationalTasks|useCrmTasks|usePropertyFinancials|useDayBriefing)\.ts$/.test(p)))throw Error('Production data module included');
if(process.argv.includes('--bundle-only'))process.exit(0);
const response=await fetch('http://localhost:8080/src/index.css?direct');
if(!response.ok)throw Error('Preview CSS unavailable');
const componentCss=existsSync(path.join(output,'fixture.css'))?await readFile(path.join(output,'fixture.css'),'utf8'):'';
await writeFile(path.join(output,'fixture.css'),(await response.text())+'\n'+componentCss);
await writeFile(path.join(output,'fixture.html'),'<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>');
if(process.argv.includes('--build-only'))process.exit(0);
const run=spawnSync('python3',[path.join(root,'scripts/qa/pms-dashboard-ui.py'),output],{stdio:'inherit'});
process.exitCode=run.status??1;
