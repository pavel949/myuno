// Actual owner-facing UI; all actor/read/write hooks are synthetic and backend excluded.
import { build } from 'esbuild';
import postcss from 'postcss';
import postcssImport from 'postcss-import';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import { mkdir,readFile,writeFile } from 'node:fs/promises';
import { execFileSync,spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const root=process.cwd(),base='117b892e294a4fbcb02570b34ee9b72d7bc5d1b5',version=process.argv.includes('--before')?'before':'after';
const out=(process.env.OWNER_RECONCILE_OUTPUT||'/workspace/artifacts/myuno-ds-platform-audit-20261025/owner-intake-reconcile')+'/'+version;await mkdir(out,{recursive:true});
const files=['src/components/home/HomeSearchEntry.tsx','src/components/landings/LandingLeadForm.tsx','src/pages/owner/OwnerManagementLanding.tsx','src/pages/ForOwners.tsx','src/pages/owner/FullManagement.tsx'];const sources={};for(const f of files)sources[root+'/'+f]=version==='before'?execFileSync('git',['show',base+':'+f],{encoding:'utf8'}):await readFile(f,'utf8');
const mocks={
 '@/contexts/LanguageContext':`export const useLanguage=()=>({language:new URLSearchParams(location.search).get('lang')||'en'});`,
 '@/contexts/AuthContext':`export const useAuth=()=>({user:null});`,
 '@/components/seo':`export const SEOHead=()=>null;`,
 '@/components/uno/GlobalPreferencesControls':`export const GlobalPreferencesControls=()=>null;`,
 '@/components/layout/AppLayout':`export const AppLayout=({children})=><main>{children}</main>;`,
 '@/components/referral/OwnerReferralCard':`export const OwnerReferralCard=()=>null;`,
 '@/hooks/useUniversalLead':`export const useUniversalLead=()=>({submitLead:{isPending:false,mutateAsync:async payload=>{window.fixtureLeads.push(structuredClone(payload));if(window.fixtureHold)return new Promise((resolve,reject)=>{window.fixtureRejectPending=()=>reject(Error('Synthetic unavailable response'));window.fixtureResolvePending=()=>resolve({id:'synthetic-receipt'})});return{id:'synthetic-receipt'}}}});`,
 '@/hooks/useCapitalIntroRequest':`export const useCapitalIntroRequest=()=>({isPending:false,mutateAsync:()=>{throw Error('Capital writer forbidden')}});`,
 '@/hooks/useConsultationRequests':`export const useConsultationRequests=()=>({requestFullManagement:{mutateAsync:()=>{throw Error('Operational management submission forbidden')}}});`,
 '@/hooks/usePropertyCare':`export const useOwnerProperties=()=>({data:[]});`,
 '@/integrations/supabase/client':`throw Error('Backend import forbidden');`,
 '@/hooks/useHapticFeedback':`export const triggerHaptic=()=>{};`,
 '@/hooks/useSoundEffects':`export const playSound=()=>{};export const isTypingKey=()=>false;`,
};
const entry=`import React from'react';import{createRoot}from'react-dom/client';import{MemoryRouter,Routes,Route,useLocation,useNavigate}from'react-router-dom';import{HelmetProvider}from'react-helmet-async';import{HomeSearchEntry}from'${root}/src/components/home/HomeSearchEntry';import Owner from'${root}/src/pages/owner/OwnerManagementLanding';import ForOwners from'${root}/src/pages/ForOwners';import FullManagement from'${root}/src/pages/owner/FullManagement';window.fixtureLeads=[];function App(){const loc=useLocation(),nav=useNavigate();return<><p className="border-b p-2 text-xs">SYNTHETIC OWNER FIXTURE — no live delivery or management activation; shell/preferences adapters</p><Routes><Route path="/" element={<div className="cinematic-home p-4"><HomeSearchEntry/></div>}/><Route path="/owner/management-landing" element={<Owner/>}/><Route path="/for-owners" element={<ForOwners/>}/><Route path="/owner/full-management" element={<FullManagement/>}/></Routes><aside className="flex flex-wrap gap-2 border-t p-4"><button data-testid="back" onClick={()=>nav(-1)}>QA history back</button><button data-testid="opposite-query" onClick={()=>nav('/owner/management-landing?intent='+(new URLSearchParams(loc.search).get('intent')==='rent'?'management':'rent')+'&source=fixture')}>QA opposite query</button><button data-testid="for-owners" onClick={()=>nav('/for-owners')}>QA owner options</button><button data-testid="full-management" onClick={()=>nav('/owner/full-management')}>QA existing management page</button></aside><output hidden data-testid="route">{loc.pathname+loc.search}</output></>};createRoot(document.getElementById('root')).render(<HelmetProvider><MemoryRouter future={{v7_startTransition:true,v7_relativeSplatPath:true}}><App/></MemoryRouter></HelmetProvider>);`;
const result=await build({stdin:{contents:entry,loader:'tsx',resolveDir:root},bundle:true,format:'esm',jsx:'automatic',alias:{'@':root+'/src'},outfile:out+'/fixture.js',metafile:true,plugins:[{name:'isolated-owner',setup(b){b.onResolve({filter:/.*/},a=>a.path in mocks?{path:a.path,namespace:'fixture'}:undefined);b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:mocks[a.path],loader:'tsx',resolveDir:root}));b.onLoad({filter:/\.tsx$/},a=>a.path in sources?{contents:sources[a.path],loader:'tsx'}:undefined);}}]});
if(Object.keys(result.metafile.inputs).some(p=>!p.startsWith('fixture:')&&/integrations\/supabase\/client|hooks\/(useUniversalLead|useConsultationRequests|usePropertyCare)\.ts$/.test(p)))throw Error('Production backend/read/write module bundled');
const css=await postcss([postcssImport(),tailwindcss(root+'/tailwind.config.ts'),autoprefixer()]).process(await readFile('src/index.css','utf8'),{from:root+'/src/index.css'});await writeFile(out+'/fixture.css',css.css+'\n'+await readFile('src/styles/cinematic-home.css','utf8'));await writeFile(out+'/fixture.html','<!doctype html><html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="fixture.css"><div id="root"></div><script type="module" src="fixture.js"></script></html>');
await writeFile(out+'/provenance.json',JSON.stringify({base,version,wip:'0fb39b76297e450042cb63385b81e994edbfa1f5',sources:Object.fromEntries(Object.entries(sources).map(([path,source])=>[path.slice(root.length+1),createHash('sha256').update(source).digest('hex')])),boundary:'Actual UI/shared form; synthetic shell/preferences/actor/read/write boundaries. No backend module bundled, delivery/activation/idempotency not verified.'},null,2));
const run=spawnSync(process.env.PYTHON||'python',['scripts/qa/ds-owner-intake-reconcile.py',out,version],{stdio:'inherit'});process.exitCode=run.status??1;
