// Actual CreateDealSheet + recovery/client helpers; synthetic DB boundary only.
import { build } from 'esbuild';
import postcss from 'postcss';
import postcssImport from 'postcss-import';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import path from 'node:path';
const root=process.cwd(),before=process.argv.includes('--before');
const output=process.env.CRM_RECOVERY_OUTPUT;
if(!output)throw Error('CRM_RECOVERY_OUTPUT required');await mkdir(output,{recursive:true});
const source='src/components/owner/sales/CreateDealSheet.tsx';
const original=before?execFileSync('git',['show','46c05eb0479cee46ff7e4232e19894f2aaad2cca:'+source],{encoding:'utf8'}):await readFile(source,'utf8');
const db=`import{useState}from'react';
const fresh=()=>({contacts:{},deals:{},writes:[],updates:[],events:[],failed:false});
const load=()=>JSON.parse(localStorage.getItem('synthetic-crm-db')||'null')||fresh();
window.fixture=load();const mode=new URLSearchParams(location.search).get('mode');const save=()=>localStorage.setItem('synthetic-crm-db',JSON.stringify(window.fixture));
export const reset=()=>{window.fixture=fresh();save();sessionStorage.clear()};
if(['snapshot','missing-contact','rejected-patch','ambiguous-patch','legacy'].includes(mode)&&!sessionStorage.getItem('crm-deal-attempt:v1:actor-a:company-a')){
 const a={version:1,actorId:'actor-a',companyId:'company-a',contactId:'original-contact',dealId:'original-deal',contact:null,contactPatch:['rejected-patch','ambiguous-patch'].includes(mode)?{budget_min:1700}:null,deal:{company_id:'company-a',agent_id:'actor-a',client_name:'Original Tenant',client_phone:'+660000000',client_email:'original@example.test',deal_type:'rent_long',currency:'USD',budget_min:1700,budget_max:2500,property_id:'original-property',notes:'Original rental note',stage:'new',client_source:'referral'}};
 if(mode!=='legacy')a.dealWriteState='not_started';
 sessionStorage.setItem('crm-deal-attempt:v1:actor-a:company-a',JSON.stringify(a));
 if(!['missing-contact','legacy'].includes(mode))window.fixture.contacts['original-contact']={id:'original-contact',company_id:'company-a',budget_min:100};save();
}

export const supabase={from:table=>{let filters={},payload=null,patch=null;const rows=()=>table==='crm_contacts'?window.fixture.contacts:window.fixture.deals;const q={select:()=>q,eq:(k,v)=>{filters[k]=v;return q},is:(k,v)=>{filters[k]=v;return q},insert:p=>{payload=p;return q},update:p=>{patch=p;return q},single:run,maybeSingle:run};async function run(){if(payload){await new Promise(r=>setTimeout(r,160));const mode=new URLSearchParams(location.search).get('mode');if(table==='agent_deals'&&!window.fixture.failed&&mode==='before'){window.fixture.failed=true;save();return{data:null,error:Error('Synthetic deal failure')}};if(rows()[payload.id])return{data:null,error:{code:'23505'}};rows()[payload.id]={...payload};window.fixture.writes.push({table,id:payload.id,company:payload.company_id,actor:payload.agent_id||payload.created_by});if(!window.fixture.failed&&((table==='agent_deals'&&mode==='lost-deal')||(table==='crm_contacts'&&mode==='lost-contact'))){window.fixture.failed=true;save();return{data:null,error:Error('Synthetic lost acknowledgement')}};save();return{data:{...payload},error:null}}const row=Object.values(rows()).find(row=>Object.entries(filters).every(([k,v])=>row[k]===v));if(patch&&row){if(mode==='rejected-patch')return{data:null,error:{code:'42501',message:'Synthetic rejected update'}};Object.assign(row,patch);window.fixture.updates.push({table,id:row.id});save();if(mode==='ambiguous-patch')return{data:null,error:{message:'Synthetic lost update acknowledgement'}}}return{data:row||null,error:null}}return q}};
export const useCreateContact=()=>({mutateAsync:async p=>{const r=await supabase.from('crm_contacts').insert({...p,id:crypto.randomUUID()}).select().single();if(r.error)throw r.error;return r.data}});
export const useCreateDeal=()=>{const[pending,set]=useState(false);return{isPending:pending,mutateAsync:async p=>{set(true);try{const r=await supabase.from('agent_deals').insert({...p,id:crypto.randomUUID()}).select().single();if(r.error)throw r.error;return r.data}finally{set(false)}}}};
`;
const virtual={
 'crm-fixture-db':db,
 '@/integrations/supabase/client':`export{supabase}from'crm-fixture-db';`,
 '@/contexts/AuthContext':`import{createContext,useContext}from'react';export const AuthFixture=createContext({user:{id:'actor-a'}});export const useAuth=()=>useContext(AuthFixture);`,
 '@/contexts/LanguageContext':`export const useLanguage=()=>({language:'en'});`,
 '@/hooks/useAgentDeals':`export{useCreateDeal}from'crm-fixture-db';export const useDuplicateCheck=()=>({data:[]});export const CLIENT_SOURCES=['website'];export const PHUKET_DISTRICTS=['Rawai'];export const PROPERTY_TYPES=['villa'];export const CURRENCIES=['THB'];export const DEAL_TYPES=['sale'];export const DEAL_TYPE_LABELS={sale:{en:'Sale',ru:'Продажа'}};`,
 '@/hooks/useCrmContacts':`export{useCreateContact}from'crm-fixture-db';export const useUpdateContact=()=>({mutateAsync:async()=>{throw Error('Unexpected contact sync')}});`,
 '@/components/owner/contacts/ContactSearchInput':`export const ContactSearchInput=()=>null;`,
 '@/components/owner/sales/PropertySearchInput':`export const PropertySearchInput=()=>null;`,
 '@/lib/crmWorkflowTrigger':`export const fireCrmWorkflowTrigger=p=>window.fixture.events.push(p);`,
 'sonner':`const log=(...args)=>{window.fixture.events.push({toast:args})};export const toast=Object.assign(log,{error:log,info:log});`,
 'crm-actual-sheet':original,
};
const result=await build({stdin:{contents:`import React,{useState}from'react';import{createRoot}from'react-dom/client';import{QueryClient,QueryClientProvider}from'@tanstack/react-query';import{MemoryRouter,useLocation}from'react-router-dom';import{CreateDealSheet}from'crm-actual-sheet';import{AuthFixture}from'@/contexts/AuthContext';import'crm-fixture-db';function App(){const[actor,A]=useState('actor-a'),[company,C]=useState('company-a'),[open,O]=useState(true),l=useLocation();return <AuthFixture.Provider value={{user:{id:actor}}}><aside><button onClick={()=>C(company==='company-a'?'company-b':'company-a')}>QA switch company</button><button onClick={()=>A(actor==='actor-a'?'actor-b':'actor-a')}>QA switch actor</button><output data-testid="route">{l.pathname}</output></aside><CreateDealSheet open={open} onOpenChange={O} companyId={company} prefilledContact={new URLSearchParams(location.search).get('mode')==='snapshot'?{id:'different-contact',company_id:company,first_name:'Different',last_name:'Prefill',currency:'THB'}:null}/></AuthFixture.Provider>}createRoot(document.getElementById('root')).render(<QueryClientProvider client={new QueryClient()}><MemoryRouter><App/></MemoryRouter></QueryClientProvider>);`,loader:'tsx',resolveDir:root},bundle:true,jsx:'automatic',format:'esm',outfile:path.join(output,'fixture.js'),metafile:true,define:{'process.env.NODE_ENV':'"production"','import.meta.env.DEV':'false'},plugins:[{name:'synthetic-crm',setup(b){b.onResolve({filter:/.*/},a=>{if(Object.hasOwn(virtual,a.path))return{path:a.path,namespace:'fixture'};if(a.path.startsWith('@/')){const base=path.join(root,'src',a.path.slice(2));const resolved=[base,base+'.ts',base+'.tsx',path.join(base,'index.ts'),path.join(base,'index.tsx')].find(p=>existsSync(p)&&statSync(p).isFile());if(!resolved)throw Error(a.path);return{path:resolved}}});b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:virtual[a.path],loader:'tsx',resolveDir:root}));}}]});
if(Object.keys(result.metafile.inputs).some(p=>!p.startsWith('fixture:')&&/integrations\/supabase\/client|hooks\/useAgentDeals\.ts|hooks\/useCrmContacts\.ts/.test(p)))throw Error('Production boundary included');
const css=await postcss([postcssImport(),tailwindcss(),autoprefixer()]).process(await readFile('src/index.css','utf8'),{from:path.join(root,'src/index.css')});
await writeFile(path.join(output,'fixture.css'),css.css);await writeFile(path.join(output,'fixture.html'),'<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>');
await writeFile(path.join(output,'provenance.json'),JSON.stringify({before,base:'46c05eb0479cee46ff7e4232e19894f2aaad2cca',boundary:'actual sheet/modal/controls/helpers/CSS; synthetic auth/company/contact-search/property-search/DB/workflow/toast; no live role/RLS acceptance',sheetSha256:createHash('sha256').update(original).digest('hex'),recoverySources:before?[]:await Promise.all(['src/lib/crm/dealCreationRecovery.ts','src/lib/crm/getOrCreateContact.ts'].map(async file=>({file,sha256:createHash('sha256').update(await readFile(file)).digest('hex')}))),inputs:Object.keys(result.metafile.inputs)},null,2));
