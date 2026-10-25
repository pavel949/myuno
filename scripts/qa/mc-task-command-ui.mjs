// Real task editor + checked client gateway. All RPC data is synthetic memory.
import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
const root=process.cwd(),output='/tmp/browser/mc-task-command-isolated';
await mkdir(output,{recursive:true});
const virtual={
 '@/contexts/LanguageContext':`export const useLanguage=()=>({language:new URLSearchParams(location.search).get('lang')||'en'});`,
 '@/contexts/AuthContext':`export const useAuth=()=>({user:{id:'synthetic-staff'}});`,
 '@/hooks/useTaskNotifications':`const deny=()=>{window.fixtureExternalCalls++;throw Error('Real notification forbidden')};export const useTaskNotifications=()=>({notifyAssignment:deny,notifyStatusRequest:deny});`,
 '@/components/owner/tasks/TaskComments':`export const TaskComments=()=>null;`,
 '@/hooks/useMyProperties':`const state=new URLSearchParams(location.search).get('state');const property={property_id:'synthetic-property',management_company_id:'synthetic-company',checked_task_commands_enforced:state==='unknown'?undefined:state!=='legacy'};export const useMyProperties=()=>({allProperties:[property],isLoading:false,error:null});`,
 '@/lib/companyAccessOperation':`export {CompanyAccessLifetime} from '${root}/src/lib/companyAccessOperation.ts';export const bindCompanyAccessOperation=async lease=>{lease.assertCurrent();return{...lease,client:{rpc:(...args)=>window.fixtureRpc(...args)}}};`,
 '@/integrations/supabase/client':`const deny=()=>{window.fixtureExternalCalls++;throw Error('External data forbidden')};export const supabase={from:table=>{if(table!=='property_operational_tasks')return deny();let patch=null;const chain={select:()=>chain,in:()=>chain,order:()=>chain,eq:()=>chain,update:value=>{window.fixtureLegacyWrites++;patch=value;return chain},single:async()=>({data:{...window.fixtureOriginal,...patch},error:null}),then:resolve=>Promise.resolve({data:[window.fixtureOriginal],error:null}).then(resolve)};return chain},functions:{invoke:deny},storage:{from:deny}};`,
 '@/hooks/useHapticFeedback':`export const triggerHaptic=()=>{};`,
 '@/hooks/useSoundEffects':`export const playSound=()=>{};export const isTypingKey=()=>false;`,
 'sonner':`export const toast={success:message=>window.fixtureSuccess.push(message),error:message=>window.fixtureErrors.push(message),info:()=>{}};`,
};
await build({stdin:{contents:`
import React,{useState} from 'react';import {createRoot} from 'react-dom/client';import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {TaskDetailSheet} from '${root}/src/components/owner/tasks/TaskDetailSheet.tsx';
import {useOperationalTasks} from '${root}/src/hooks/useOperationalTasks.ts';
window.fixtureExternalCalls=0;window.fixtureLegacyWrites=0;window.fixtureSuccess=[];window.fixtureErrors=[];window.fixtureRequests=[];
const original={id:'synthetic-task',property_id:'synthetic-property',title:'Synthetic inspection',description:null,status:'pending',priority:'normal',scheduled_date:'2026-10-25',assigned_to:'synthetic-staff',completed_by:null,completed_at:null,updated_at:'2026-10-25T00:00:00.123456Z',actual_cost:0};
window.fixtureOriginal=original;window.fixtureRpc=async(name,args)=>{
 window.fixtureRequests.push({name,args});
 if(new URLSearchParams(location.search).get('state')==='conflict')return{data:null,error:{message:'Task changed; reload before saving'}};
 if(name!=='edit_managed_task_checked'||args.p_task_id!==original.id||args.p_expected_updated_at!==original.updated_at||'completed_by' in args.p_patch||'completed_at' in args.p_patch)throw Error('Invalid checked task contract');
 return{error:null,data:{...original,...args.p_patch,completed_by:'synthetic-staff',completed_at:'2026-10-25T00:01:00Z',updated_at:'2026-10-25T00:01:00.123456Z'}};
};
function Fixture(){const operations=useOperationalTasks(),[open,setOpen]=useState(true),[result,setResult]=useState(original);if(operations.isLoading)return <p>Loading synthetic task</p>;return <main><output data-testid="persisted-result">{JSON.stringify(result)}</output><TaskDetailSheet open={open} onOpenChange={setOpen} task={{...original,source:'ops',due_date:'2026-10-25',task_type:'inspection',raw:original}} members={[{user_id:'synthetic-staff',name:'Synthetic employee'}]} properties={[{property_id:'synthetic-property',title:'Synthetic property'}]} onDelete={()=>{throw Error('Delete forbidden')}} onUpdate={async(_,source,updates)=>{if(source!=='ops')throw Error('Wrong canonical source');setResult(await operations.editTask.mutateAsync({taskId:original.id,patch:updates}));}}/></main>};
createRoot(document.getElementById('root')).render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}})}><Fixture/></QueryClientProvider>);`,loader:'tsx',resolveDir:root},bundle:true,outfile:path.join(output,'fixture.js'),jsx:'automatic',format:'esm',
 define:{'process.env.NODE_ENV':'"production"','import.meta.env.DEV':'false'},plugins:[{name:'isolated-task-data',setup(b){
 b.onResolve({filter:/.*/},args=>{if(Object.hasOwn(virtual,args.path))return{path:args.path,namespace:'fixture'};if(args.path.startsWith('@/')){const base=path.join(root,'src',args.path.slice(2)),found=[base,base+'.ts',base+'.tsx',path.join(base,'index.ts'),path.join(base,'index.tsx')].find(p=>existsSync(p)&&statSync(p).isFile());if(!found)throw Error('Unresolved fixture import '+args.path);return{path:found};}});
 b.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:virtual[args.path],loader:'tsx',resolveDir:root}));
 }}]});
if(process.argv.includes('--bundle-only'))process.exit(0);
const css=await fetch('http://localhost:8080/src/index.css?direct');if(!css.ok)throw Error('Isolated stylesheet unavailable');
await writeFile(path.join(output,'fixture.css'),await css.text());
await writeFile(path.join(output,'fixture.html'),'<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>');
const result=spawnSync('python3',[path.join(root,'scripts/qa/mc-task-command-ui.py'),output],{stdio:'inherit'});process.exitCode=result.status??1;
