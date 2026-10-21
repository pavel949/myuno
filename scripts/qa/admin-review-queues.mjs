// Actual admin review pages, cards, selectors and primitives; synthetic read boundaries.
import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const root = process.cwd();
const output = '/tmp/browser/admin-review-queues-isolated';
await mkdir(output, { recursive: true });
const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450"><rect width="800" height="450" fill="#dce2e7"/><path d="M120 400V170H350V90H650V400Z" fill="#738799"/><text x="25" y="45" font-size="24" fill="#263b50">SYNTHETIC IMAGE / ТЕСТОВЫЕ ДАННЫЕ</text></svg>';
const image = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
const virtual = {
  '@/contexts/LanguageContext': `import {ru} from '${root}/src/i18n/ru.ts';import {en} from '${root}/src/i18n/en.ts';import {th} from '${root}/src/i18n/th.ts';const language=new URLSearchParams(location.search).get('lang')||'ru';export const useLanguage=()=>({language,t:key=>(language==='ru'?ru:language==='th'?th:en)[key]||key});`,
  '@/contexts/AuthContext': `export const useAuth=()=>({user:{id:'synthetic-admin'},isLoading:false});`,
  '@/hooks/useAdmin': `export const useAdminCheck=()=>({isAdmin:true,isLoading:false});export const useAdminProviders=()=>({providers:[{id:'synthetic-provider',name:'Synthetic provider',is_verified:true}],isLoading:false,refetch:async()=>{}});`,
  '@/hooks/useManagementCompanies': `export const useManagementCompanies=()=>({data:[],isLoading:false});`,
  '@/hooks/useAdminDevelopers': `export const useAdminDevelopers=()=>({data:[]});`,
  '@/hooks/useCityCurrency': `export const useCityCurrency=()=>({code:'THB'});`,
  '@/hooks/useAdminContent': `import {useSyncExternalStore} from 'react';export function useAdminProperties(provider){useSyncExternalStore(window.fixtureSubscribe,()=>window.fixtureState);return{properties:window.fixtureState==='empty'?[]:window.fixtureProperties.filter(p=>!provider||p.provider_id===provider),isLoading:window.fixtureState==='loading',error:window.fixtureState==='error'?new Error('Synthetic read error'):null,refetch:window.fixtureRetry,createProperty:window.fixtureForbid,updateProperty:window.fixtureForbid,deleteProperty:window.fixtureForbid};}`,
  '@/hooks/usePropertyProjects': `import {useSyncExternalStore} from 'react';export function useAdminPropertyProjects(){useSyncExternalStore(window.fixtureSubscribe,()=>window.fixtureState);return{data:window.fixtureState==='empty'?[]:window.fixtureProjects,isLoading:window.fixtureState==='loading',error:window.fixtureState==='error'?new Error('Synthetic read error'):null,refetch:window.fixtureRetry};}export const useCreatePropertyProject=()=>({mutateAsync:window.fixtureForbid});export const useUpdatePropertyProject=()=>({mutateAsync:window.fixtureForbid});`,
  // Keep the actual revision queue mounted, with an independent read-only empty list.
  // Its review/mutation behavior remains covered by the dedicated revision UI tests.
  '@/lib/propertyRevisions': `export const listPendingPropertyRevisions=async()=>[];export const readPropertyRevision=(...args)=>window.fixtureForbid(...args);export const reviewPropertyRevision=(...args)=>window.fixtureForbid(...args);`,
  '@/integrations/supabase/client': `export const supabase={from:(...args)=>window.fixtureForbid(...args),functions:{invoke:(...args)=>window.fixtureForbid(...args)},storage:{from:(...args)=>window.fixtureForbid(...args)}};`,
  '@/components/admin/RealEstateDomainHealthPanel': `export const RealEstateDomainHealthPanel=()=>null;`,
  '@/components/admin/PropertyProjectBulkLinkPanel': `export const PropertyProjectBulkLinkPanel=()=>null;`,
  '@/components/admin/PropertyStayRulesPanel': `export const PropertyStayRulesPanel=()=>null;`,
  '@/components/admin/BusinessCardScanButton': `export const BusinessCardScanButton=()=>null;`,
  '@/components/property/canonical-form': `export const CanonicalPropertyForm=()=> <p data-testid="property-editor-boundary">Synthetic editor boundary / Тестовый редактор</p>;`,
  '@/components/admin/intake/AIIntakeDialog': `export const AIIntakeDialog=()=>null;`,
  '@/components/admin/projects/ProjectUnitsTab': `export const ProjectUnitsTab=()=>null;`,
  '@/components/upload/AirbnbStyleImageUpload': `export const AirbnbStyleImageUpload=()=>null;`,
  '@/components/forms/TranslatableInput': `export const TranslatableInput=()=>null;`,
  '@/components/forms/TranslatableTextarea': `export const TranslatableTextarea=()=>null;`,
  '@/hooks/useHapticFeedback': `export const triggerHaptic=()=>{};`,
  '@/hooks/useSoundEffects': `export const playSound=()=>{};export const isTypingKey=()=>false;`,
  '@/hooks/useFeedbackSettings': `export const getFeedbackSettings=()=>({hapticEnabled:false,soundEnabled:false});`,
};
const result = await build({
  stdin: { contents: `
import React from 'react';import{createRoot}from'react-dom/client';import{MemoryRouter,useLocation}from'react-router-dom';import{QueryClient,QueryClientProvider}from'@tanstack/react-query';
import AdminProperties from '${root}/src/pages/admin/AdminProperties.tsx';import AdminProjects from '${root}/src/pages/admin/AdminProjects.tsx';
const params=new URLSearchParams(location.search),lang=params.get('lang')||'ru',page=params.get('page')||'properties';document.documentElement.lang=lang;
window.fixtureForbiddenWrites=[];window.fixtureRetries=0;window.fixtureForbid=(...args)=>{window.fixtureForbiddenWrites.push(args);throw Error('Business reads/writes forbidden outside fixture boundaries')};
window.fixtureState=params.get('state')||'populated';const listeners=new Set();window.fixtureSubscribe=cb=>{listeners.add(cb);return()=>listeners.delete(cb)};window.fixtureRetry=async()=>{window.fixtureRetries++;window.fixtureState='populated';listeners.forEach(cb=>cb())};
const common={provider_id:'synthetic-provider',property_type:'condo',listing_type:'rent',listing_modes:['rent'],bedrooms:2,bathrooms:1,area_sqm:64,currency:'THB',cover_image:${JSON.stringify(image)},images:[],address:'Synthetic area',price:null};
window.fixtureProperties=[
 {...common,id:'pending',title_en:'Pending coastal home',title_ru:'Объект на модерации',approval_status:'pending',is_active:true},
 {...common,id:'approved',title_en:'Approved coastal home',title_ru:'Одобренный объект',approval_status:'approved',is_active:true},
 {...common,id:'draft',title_en:'Draft coastal home',title_ru:'Черновик объекта',approval_status:'draft',is_active:false},
 {...common,id:'unknown',title_en:'Unknown coastal home',title_ru:'Объект без статуса'}
];
const projectCommon={cover_image:${JSON.stringify(image)},address:'Synthetic area',developer_name:'Synthetic developer',project_status:'offplan'};
window.fixtureProjects=[
 {...projectCommon,id:'pending',name_en:'Pending coastal project',name_ru:'Проект на модерации',is_approved:false,is_active:false,needs_review:true,developer_id:'00000000-0000-0000-0000-000000000001',address:''},
 {...projectCommon,id:'stale',name_en:'Approved older project',name_ru:'Проект без обновлений',is_approved:true,is_active:true,project_status:'completed',updated_at:'2020-01-01T00:00:00Z'},
 {...projectCommon,id:'recent',name_en:'Approved current project',name_ru:'Одобренный проект',is_approved:true,is_active:false,project_status:'under_construction',updated_at:new Date().toISOString()},
 {...projectCommon,id:'unknown',name_en:'Unknown coastal project',name_ru:'Проект без статуса',address:''}
];
function Boundary(){const l=useLocation();return <div hidden data-testid="route-boundary">{l.pathname+l.search}</div>}
createRoot(document.getElementById('root')).render(<QueryClientProvider client={new QueryClient()}><MemoryRouter initialEntries={['/admin/'+page+(params.get('route')||'')]} future={{v7_startTransition:true,v7_relativeSplatPath:true}}><aside className="border-b border-border px-4 py-2 text-sm text-muted-foreground">Synthetic data only / Только тестовые данные</aside>{page==='projects'?<AdminProjects/>:<AdminProperties/>}<Boundary/></MemoryRouter></QueryClientProvider>);`,loader:'tsx',resolveDir:root },
  bundle:true,outfile:path.join(output,'fixture.js'),jsx:'automatic',format:'esm',metafile:true,
  define:{'process.env.NODE_ENV':'"production"','import.meta.env.DEV':'false'},
  plugins:[{name:'isolated-admin-review-data',setup(b){
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
if(Object.keys(result.metafile.inputs).some(p=>!p.startsWith('fixture:')&&/integrations\/supabase\/client|lib\/propertyRevisions\.ts$|hooks\/(useAdminContent|usePropertyProjects|useAdminDevelopers|useManagementCompanies)\.ts$/.test(p)))throw Error('Production data module included');
if(process.argv.includes('--bundle-only'))process.exit(0);
const response=await fetch('http://localhost:8080/src/index.css?direct');
if(!response.ok)throw Error('Preview CSS unavailable');
await writeFile(path.join(output,'fixture.css'),await response.text());
await writeFile(path.join(output,'fixture.html'),'<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>');
if(process.argv.includes('--build-only'))process.exit(0);
const run=spawnSync('python3',[path.join(root,'scripts/qa/admin-review-queues.py'),output],{stdio:'inherit'});
process.exitCode=run.status??1;
