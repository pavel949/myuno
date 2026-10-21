// Actual Home components + production CSS, with synthetic account reads only.
import { build } from 'esbuild';
import { mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const root = process.cwd();
const output = '/tmp/browser/home-preferences-isolated';
await mkdir(output, { recursive: true });
// Avoid re-merging the previous run's combined stylesheet.
await rm(path.join(output, 'fixture.css'), { force: true });
const virtual = {
  '@/contexts/LanguageContext': `export const useLanguage=()=>({language:new URLSearchParams(location.search).get('lang')||'ru'});`,
  '@/contexts/AuthContext': `export const useAuth=()=>({user:{id:'synthetic-account',email:'synthetic@example.invalid',user_metadata:{full_name:'Synthetic Long Display Name'}}});`,
  '@/hooks/useNotificationActions': `export const useNotificationActions=()=>({unreadCount:0,isLoading:false});`,
  '@/hooks/useRoleSignals': `export const useRoleSignals=(personas)=>{
    const state=new URLSearchParams(location.search).get('state')||'real';
    const record={lead:'Synthetic scheduled service with a long title',leadRu:'Синтетическая услуга с длинным названием',leadTh:'บริการตัวอย่างที่มีชื่อยาวสำหรับทดสอบ',value:'13:20',tail:'Synthetic provider · an intentionally long service description for narrow screens',tailRu:'Тестовый исполнитель · длинное описание услуги для проверки узкого экрана',tailTh:'ผู้ให้บริการตัวอย่าง · รายละเอียดบริการยาวสำหรับทดสอบหน้าจอขนาดเล็ก',state:'live',isLive:true};
    return {signals:['real','error'].includes(state)?Object.fromEntries(personas.slice(0,1).map(p=>[p,record])):{},isLoading:state==='loading',hasError:state==='error',unavailablePersonas:state==='unavailable'?['local_services_provider']:[],retry:()=>{window.fixtureRetries=(window.fixtureRetries||0)+1;},isAuthenticated:true};
  };`,
  '@/integrations/supabase/client': `const q={select(){return q},eq(){return q},in(){return q},then(resolve){return Promise.resolve({data:[],count:0,error:null}).then(resolve)}};export const supabase={from(table){if(table!=='orders')throw Error('Unexpected fixture table '+table);return q}};`,
};
const result = await build({
  stdin: { contents: `import React,{useState} from 'react';import{createRoot}from'react-dom/client';import{MemoryRouter,useLocation}from'react-router-dom';import{QueryClient,QueryClientProvider}from'@tanstack/react-query';import{HeroGreeting}from'${root}/src/components/home/HeroGreeting.tsx';import{HomePreferencesEntry}from'${root}/src/components/home/HomePreferencesEntry.tsx';import{SignalStack}from'${root}/src/components/home/SignalStack.tsx';import{HomeActivityFeed}from'${root}/src/components/home/HomeActivityFeed.tsx';import{RoleSheet}from'${root}/src/components/home/RoleSheet.tsx';const params=new URLSearchParams(location.search);document.documentElement.lang=params.get('lang')||'ru';function Fixture(){const[open,setOpen]=useState(false);const[personas,setPersonas]=useState(['pet_owner','family','couple']);const loc=useLocation();const state=params.get('state');return <main className="mx-auto max-w-3xl bg-background pb-8"><HeroGreeting personas={personas} onRoleSheetOpen={()=>setOpen(true)} onAppDrawerOpen={()=>{}}/><SignalStack personas={personas} onRoleSheetOpen={()=>setOpen(true)}/><HomeActivityFeed/><HomePreferencesEntry onOpen={()=>setOpen(true)}/><RoleSheet open={open} personas={personas} onClose={()=>setOpen(false)} onReorder={setPersonas} onToggle={p=>setPersonas(old=>old.includes(p)?old.filter(x=>x!==p):[...old,p])} isBusy={state==='preferences-loading'} hasError={state==='preferences-error'}/><output hidden data-testid="selection">{JSON.stringify(personas)}</output><output hidden data-testid="location">{loc.pathname+loc.search}</output></main>}createRoot(document.getElementById('root')).render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><MemoryRouter future={{v7_startTransition:true,v7_relativeSplatPath:true}}><Fixture/></MemoryRouter></QueryClientProvider>);`, loader:'tsx', resolveDir:root },
  bundle:true,outfile:path.join(output,'fixture.js'),jsx:'automatic',format:'esm',metafile:true,
  define:{'process.env.NODE_ENV':'"production"','import.meta.env.DEV':'false'},
  plugins:[{name:'synthetic-home-data',setup(b){
    b.onResolve({filter:/.*/},args=>{
      if(Object.hasOwn(virtual,args.path))return{path:args.path,namespace:'fixture'};
      if(args.path.startsWith('@/')){const base=path.join(root,'src',args.path.slice(2));const resolved=[base,base+'.ts',base+'.tsx',path.join(base,'index.ts'),path.join(base,'index.tsx')].find(p=>existsSync(p)&&statSync(p).isFile());if(!resolved)throw Error('Unresolved '+args.path);return{path:resolved};}
    });
    b.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:virtual[args.path],loader:'tsx',resolveDir:root}));
  }}],
});
if(Object.keys(result.metafile.inputs).some(p=>!p.startsWith('fixture:')&&/integrations\/supabase\/client|contexts\/AuthContext|hooks\/(?:useRoleSignals|useNotificationActions)\.ts$/.test(p)))throw Error('Production data module included');
// esbuild can emit CSS imported transitively by actual UI components. Merge it
// after the production stylesheet; do not silently omit component styling.
let css;
if(process.env.HOME_PREFERENCES_CSS_FILE)css=await readFile(process.env.HOME_PREFERENCES_CSS_FILE,'utf8');
else{const response=await fetch('http://localhost:8080/src/index.css?direct');if(!response.ok)throw Error('Preview CSS unavailable');css=await response.text();}
const componentCss=path.join(output,'fixture.css');
if(existsSync(componentCss))css+='\n'+await readFile(componentCss,'utf8');
await writeFile(componentCss,css);
await writeFile(path.join(output,'fixture.html'),'<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>');
if(process.argv.includes('--build-only'))process.exit(0);
const run=spawnSync('python3',[path.join(root,'scripts/qa/home-preferences-ui.py'),output],{stdio:'inherit'});
process.exitCode=run.status??1;
