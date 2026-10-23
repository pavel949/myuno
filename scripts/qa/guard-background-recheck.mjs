// Actual route guards, resolver and company query; synthetic identity/data only.
import { build } from 'esbuild';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const root=process.cwd(), output=process.env.GUARD_OUTPUT||'/tmp/browser/guard-background-recheck';
await mkdir(output,{recursive:true});
const virtual={
 '@/contexts/AuthContext':`import{useSyncExternalStore}from'react';export const useAuth=()=>{useSyncExternalStore(cb=>{window.fixtureListeners.add(cb);return()=>window.fixtureListeners.delete(cb)},()=>window.fixtureActor);return{user:window.fixtureActor?{id:window.fixtureActor}:null,isLoading:false}};`,
 '@/contexts/LanguageContext':`export const useLanguage=()=>({language:'en'});`,
 '@/integrations/supabase/client':`export const supabase={rpc:(name,args)=>window.fixtureRpc(name,args),from:table=>{if(table!=='management_company_members')throw Error('Forbidden table '+table);const query={select:()=>query,eq:()=>query,then:resolve=>Promise.resolve({data:[{company_id:'company-a',role:'owner',management_companies:{name_en:'Synthetic company',name_ru:'Тестовая компания',logo:null}}],error:null}).then(resolve)};return query;}};`,
 '@/hooks/useUserContext':`export const useUserContext=()=>({activeRole:'user',hasRole:()=>false});`,
};
const result=await build({stdin:{contents:`
import React,{useState,useEffect}from'react';import{createRoot}from'react-dom/client';import{MemoryRouter,useLocation}from'react-router-dom';import{QueryClient,QueryClientProvider,focusManager}from'@tanstack/react-query';
import{Dialog,DialogContent,DialogTitle,DialogDescription}from'${root}/src/components/ui/dialog.tsx';import{OwnerGuard,AdminGuard,StaffGuard,VendorGuard,TeamGuard}from'${root}/src/components/auth/RoleGuard.tsx';import{MCGuard}from'${root}/src/components/auth/MCGuard.tsx';import{InvestorGuard}from'${root}/src/components/auth/InvestorGuard.tsx';import{ActiveCompanyProvider}from'${root}/src/hooks/useActiveCompany.ts';
const scene=new URLSearchParams(location.search).get('guard')||'owner',portal=new URLSearchParams(location.search).get('portal')==='1';const roles={owner:'owner',admin:'admin',staff:'staff',vendor:'vendor',team:'uno_team',mc:'owner',investor:'investor'};
window.fixtureSetFocused=value=>focusManager.setFocused(value);window.fixtureActor='actor-a';window.fixtureListeners=new Set();window.fixtureMounts=0;window.fixtureUnmounts=0;window.fixtureCalls=0;window.fixtureWrites=0;window.fixturePending=[];window.fixtureHold=false;
const context=()=>({mode:scene==='mc'?'mc':scene,entity_id:scene==='mc'?'company-a':null,role:roles[scene],permissions:[],resolved_at:new Date().toISOString()});
window.fixtureRpc=(name,args)=>{if(name!=='resolve_user_context')throw Error('Forbidden RPC');window.fixtureCalls++;if(!window.fixtureHold)return Promise.resolve({data:context(),error:null});return new Promise(resolve=>window.fixturePending.push({resolve,actor:args.p_user_id}));};
const client=new QueryClient({defaultOptions:{queries:{retry:false,gcTime:Infinity}}});client.setQueryData(['resolved-context','actor-a'],context());client.setQueryData(['user-companies','actor-a'],[{company_id:'company-a',role:'owner',name_en:'Synthetic company',name_ru:'Тестовая компания',logo:null}]);
window.fixtureBegin=()=>{window.fixtureHold=true;return client.invalidateQueries({queryKey:['resolved-context',window.fixtureActor],refetchType:'none'});};
window.fixtureFinish=outcome=>{window.fixtureHold=false;for(const item of window.fixturePending.splice(0))item.resolve(outcome==='error'?{data:null,error:{message:'Synthetic access verification failure'}}:{data:outcome==='revoke'?{...context(),role:'user',permissions:[]}:context(),error:null});};
window.fixtureRevokeMembership=()=>client.setQueryData(['user-companies',window.fixtureActor],[]);
window.fixtureSwitch=actor=>{window.fixtureActor=actor;window.fixtureListeners.forEach(cb=>cb());};
function DraftFields(){const[value,setValue]=useState('');useEffect(()=>{window.fixtureMounts++;return()=>{window.fixtureUnmounts++;}},[]);return <form onSubmit={event=>{event.preventDefault();window.fixtureWrites++;}}><label>Unsaved draft<input aria-label="Unsaved draft" value={value} onChange={e=>setValue(e.target.value)}/></label><button>Save synthetic draft</button></form>;}
function Draft(){return portal?<Dialog defaultOpen><DialogContent><DialogTitle>Synthetic draft dialog</DialogTitle><DialogDescription>Isolated test, no production writes</DialogDescription><DraftFields/></DialogContent></Dialog>:<DraftFields/>;}
function Location(){return <output id="route">{useLocation().pathname}</output>;}
const Guard={owner:OwnerGuard,admin:AdminGuard,staff:StaffGuard,vendor:VendorGuard,team:TeamGuard,mc:MCGuard,investor:InvestorGuard}[scene];
createRoot(document.getElementById('root')).render(<QueryClientProvider client={client}><ActiveCompanyProvider><MemoryRouter initialEntries={['/synthetic-protected']}><h1>Synthetic access-recheck fixture: {scene}</h1><Guard><Draft/></Guard><Location/></MemoryRouter></ActiveCompanyProvider></QueryClientProvider>);`,loader:'tsx',resolveDir:root},bundle:true,outfile:path.join(output,'app.js'),jsx:'automatic',format:'esm',metafile:true,define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'isolated-guard-data',setup(b){b.onResolve({filter:/.*/},args=>{if(Object.hasOwn(virtual,args.path))return{path:args.path,namespace:'fixture'};if(args.path.startsWith('@/')){const base=path.join(root,'src',args.path.slice(2));const resolved=[base,base+'.ts',base+'.tsx',path.join(base,'index.ts'),path.join(base,'index.tsx')].find(p=>existsSync(p)&&statSync(p).isFile());if(!resolved)throw Error('Unresolved '+args.path);return{path:resolved};}});b.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:virtual[args.path],loader:'tsx',resolveDir:root}));}}]});
if(Object.keys(result.metafile.inputs).some(p=>!p.startsWith('fixture:')&&/integrations\/supabase\/client|contexts\/AuthContext\.tsx$/.test(p)))throw Error('Production data module included');
const cssFile=process.env.GUARD_CSS_FILE;
if(cssFile)await writeFile(path.join(output,'app.css'),await readFile(cssFile));
await writeFile(path.join(output,'style-source.json'),JSON.stringify({mode:cssFile?'production-build':'diagnostic',file:cssFile??null}));
await writeFile(path.join(output,'index.html'),'<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">'+(cssFile?'<link rel="stylesheet" href="/app.css">':'')+'<style>body{font:18px system-ui;padding:24px;background:#fafafa;color:#192638}form{padding:24px;border:1px solid #aaa}input,button{display:block;margin:12px 0;padding:12px;font:inherit}.uno-splash{display:flex;align-items:center;justify-content:center}.uno-splash svg{width:48px;height:48px;stroke:currentColor}</style></head><body><div id="root"></div><script type="module" src="/app.js"></script></body></html>');
if(!process.argv.includes('--build-only')){const r=spawnSync('python3',[path.join(root,'scripts/qa/guard-background-recheck.py'),output],{stdio:'inherit'});process.exitCode=r.status??1;}
