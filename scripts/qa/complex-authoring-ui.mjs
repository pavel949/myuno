// Real complex form and workflow, synthetic in-memory data only. CI browser task.
// --bundle-only compiles the fixture without launching a browser.
import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root = process.cwd();
const output = '/tmp/browser/complex-authoring-isolated';
await mkdir(output, { recursive: true });
const virtual = {
  '@/contexts/LanguageContext': `export const useLanguage=()=>({language:new URLSearchParams(location.search).get('lang')||'en'});`,
  '@/contexts/AuthContext': `export const useAuth=()=>({user:{id:'synthetic-employee'}});`,
  '@/hooks/useAdmin': `export const useAdminCheck=()=>({isAdmin:true,isLoading:false});`,
  '@/hooks/useActiveCompany': `export const useActiveCompany=()=>({activeCompany:{company_id:'synthetic-company',role:'staff'},isLoading:false,error:null});`,
  '@/hooks/useCompanyAccessLifetime': `const lifetime={isActive:true,begin:()=>({actorId:'synthetic-employee',companyId:'synthetic-company',assertCurrent:()=>{},finish:()=>{}})};export const useCompanyAccessLifetime=()=>lifetime;`,
  '@/lib/companyAccessOperation': `export class StaleCompanyAccessOperation extends Error {};export const bindCompanyAccessOperation=async lease=>({...lease,client:{}});`,
  '@/lib/complexAuthoring': `
    const state=new URLSearchParams(location.search).get('state');
    export const listManagedComplexDrafts=async()=>{if(state==='unavailable')throw new Error('Synthetic unavailable');return [...window.fixtureRows];};
    export const readManagedComplexDraft=async(_,id)=>{const row=window.fixtureRows.find(r=>r.id===id);if(!row)throw new Error('Unavailable');return {...row};};
    export const readComplexCreationScope=async()=>({companyId:'synthetic-company',spaces:state==='unassigned'?[]:[{id:'synthetic-space',name_en:'Assigned portfolio',name_ru:'Назначенный портфель'}]});
    export const complexAuthoringDelta=(next,previous)=>Object.fromEntries(Object.entries(next).filter(([key,value])=>JSON.stringify(value)!==JSON.stringify(previous[key])).map(([key,value])=>[key,value===undefined?null:value]));
    export const listManagedComplexSubmissions=async()=>window.fixtureRows.filter(row=>row.approval_status==='pending');
    export const readManagedComplexSubmission=async(_,row)=>({...window.fixtureRows.find(current=>current.id===row.id)});
    export const reviewManagedComplexSubmission=async(_,row,decision,reason)=>{window.fixtureWrites++;const current=window.fixtureRows.find(current=>current.id===row.id);Object.assign(current,{approval_status:decision==='approve'?'approved':'rejected',is_active:decision==='approve',rejection_reason:reason||null});return {...current};};
    export const saveManagedComplexDraft=async(_,args)=>{
      window.fixtureWrites++;const previous=window.fixtureRows.find(row=>row.id===args.complexId);const row={...previous,...args.patch,id:args.complexId||'synthetic-created',name:args.patch.name||previous?.name||'Synthetic complex',management_company_id:'synthetic-company',authoring_space_id:'synthetic-space',approval_status:args.submit?'pending':'draft',is_active:false,updated_at:'2026-10-19T07:00:00.123456Z'};
      const index=window.fixtureRows.findIndex(r=>r.id===row.id);if(index>=0)window.fixtureRows[index]={...window.fixtureRows[index],...row};else window.fixtureRows.push(row);return row;
    };`,
  '@/hooks/usePropertyComplexes': `const deny=()=>{window.fixtureDataCalls++;throw new Error('Legacy owner write is forbidden in managed fixture');};export const useCreateComplex=()=>({mutateAsync:deny,isPending:false});export const useUpdateComplex=()=>({mutateAsync:deny,isPending:false});`,
  '@/integrations/supabase/client': `const deny=()=>{window.fixtureDataCalls++;throw new Error('Unexpected external data call');};export const supabase={from:deny,functions:{invoke:deny},storage:{from:deny}};`,
  '@/components/shared/GooglePlacesAutocomplete': `import React from 'react';export const GooglePlacesAutocomplete=({value,onChange})=><input className="w-full border p-2" aria-label="Address" value={value} onChange={e=>onChange(e.target.value)}/>;`,
  '@/hooks/useHapticFeedback': `export const triggerHaptic=()=>{};`,
  '@/hooks/useSoundEffects': `export const playSound=()=>{};export const isTypingKey=()=>false;`,
  '@/components/upload/UnifiedMediaUploader': `import React from 'react';export const UnifiedMediaUploader=({mode,disabled})=><div className="border p-4 text-sm text-muted-foreground" aria-disabled={disabled}>Synthetic media control ({mode})</div>;`,
  'sonner': `export const toast={error:()=>{},success:()=>{},warning:()=>{}};`,
};
await build({
  stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import {QueryClient,QueryClientProvider} from '@tanstack/react-query';import {ManagedComplexDrafts} from '${root}/src/components/owner/ManagedComplexDrafts.tsx';import {ManagedComplexReviewQueue} from '${root}/src/components/admin/operations/ManagedComplexReviewQueue.tsx';
    window.fixtureWrites=0;window.fixtureDataCalls=0;const review=new URLSearchParams(location.search).get('screen')==='review';window.fixtureRows=review?[{id:'synthetic-submission',name:'Synthetic pending complex',description_en:'Synthetic catalogue content for review',district:'Synthetic area',management_company_id:'synthetic-company',authoring_space_id:'synthetic-space',approval_status:'pending',is_active:false,updated_at:'2026-10-19T07:00:00.123456Z'}]:[];
    createRoot(document.getElementById('root')).render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><main className="max-w-6xl mx-auto p-4">{review?<ManagedComplexReviewQueue/>:<ManagedComplexDrafts/>}</main></QueryClientProvider>);`,loader:'tsx',resolveDir:root},
  bundle:true,outfile:path.join(output,'fixture.js'),jsx:'automatic',format:'esm',
  define:{'process.env.NODE_ENV':'"production"','import.meta.env.DEV':'false'},
  plugins:[{name:'synthetic-complex-boundaries',setup(b){
    b.onResolve({filter:/.*/},args=>{
      if(Object.hasOwn(virtual,args.path))return {path:args.path,namespace:'fixture'};
      if(args.path.startsWith('@/')){
        const base=path.join(root,'src',args.path.slice(2));
        const resolved=[base,base+'.ts',base+'.tsx',path.join(base,'index.ts'),path.join(base,'index.tsx')].find(p=>existsSync(p)&&statSync(p).isFile());
        if(!resolved)throw new Error('Unresolved fixture import: '+args.path);
        return {path:resolved};
      }
    });
    b.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:virtual[args.path],loader:'tsx',resolveDir:root}));
  }}],
});
if(!process.argv.includes('--bundle-only')){
  const css=await fetch('http://localhost:8080/src/index.css?direct');
  if(!css.ok)throw new Error('Isolated stylesheet unavailable');
  await writeFile(path.join(output,'fixture.css'),await css.text());
  await writeFile(path.join(output,'fixture.html'),'<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>');
  const result=spawnSync('python3',[path.join(root,'scripts/qa/complex-authoring-ui.py'),output],{stdio:'inherit'});
  process.exitCode=result.status??1;
}
