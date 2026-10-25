// Actual owner entry, landing and shared form; only context/read/write boundaries are synthetic.
import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { propertyFilterOptions } from './combined-layout-fixture-data.mjs';
const root=process.cwd(),output=process.env.OWNER_INTAKE_OUTPUT||'/tmp/browser/owner-intake';
await mkdir(output,{recursive:true});
const source=await readFile('scripts/qa/public-wide-layout-ui.mjs','utf8');
const match=source.match(/const virtual = (\{[\s\S]*?\n\});\nconst result/);
if(!match)throw Error('Review changed public fixture adapter');
const virtual=new Function('root','propertyFilterOptions',`return (${match[1]});`)(root,propertyFilterOptions);
Object.assign(virtual,{
 '@/hooks/useUniversalLead':`export const useUniversalLead=()=>({submitLead:{isPending:false,mutateAsync:async payload=>{window.fixtureLeads.push(payload);if(window.fixtureReject)throw Error('Synthetic failure');return{id:'synthetic-only'}}}});`,
 '@/hooks/useCapitalIntroRequest':`export const useCapitalIntroRequest=()=>({isPending:false,mutateAsync:()=>{throw Error('Unexpected capital mutation')}});`,
 '@/components/referral/OwnerReferralCard':`export const OwnerReferralCard=()=>null;`,
});
const result=await build({stdin:{contents:`import React from'react';import{createRoot}from'react-dom/client';import{MemoryRouter,Routes,Route,useLocation,useNavigate}from'react-router-dom';import{HelmetProvider}from'react-helmet-async';import{QueryClient,QueryClientProvider}from'@tanstack/react-query';import{HomeSearchEntry}from'${root}/src/components/home/HomeSearchEntry.tsx';import Owner from'${root}/src/pages/owner/OwnerManagementLanding.tsx';import ForOwners from'${root}/src/pages/ForOwners.tsx';window.fixtureLeads=[];function App(){const loc=useLocation(),nav=useNavigate();return <><p role="note">SYNTHETIC OWNER QA — no live delivery or management activation</p><Routes><Route path="/" element={<div className="cinematic-home p-4"><h1>Owner entry fixture</h1><HomeSearchEntry/></div>}/><Route path="/owner/management-landing" element={<Owner/>}/><Route path="/for-owners" element={<ForOwners/>}/></Routes><output hidden data-testid="route">{loc.pathname+loc.search}</output><button onClick={()=>nav(-1)} data-testid="back">History back</button></>};createRoot(document.getElementById('root')).render(<HelmetProvider><QueryClientProvider client={new QueryClient()}><MemoryRouter><App/></MemoryRouter></QueryClientProvider></HelmetProvider>);`,loader:'tsx',resolveDir:root},bundle:true,format:'esm',jsx:'automatic',outfile:path.join(output,'fixture.js'),metafile:true,define:{'process.env.NODE_ENV':'"production"','import.meta.env.DEV':'false'},plugins:[{name:'synthetic',setup(b){b.onResolve({filter:/.*/},a=>{if(Object.hasOwn(virtual,a.path))return{path:a.path,namespace:'fixture'};if(a.path.startsWith('@/')){const base=path.join(root,'src',a.path.slice(2));return{path:[base,base+'.ts',base+'.tsx',path.join(base,'index.ts'),path.join(base,'index.tsx')].find(p=>existsSync(p)&&statSync(p).isFile())};}});b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:virtual[a.path],loader:'tsx',resolveDir:root}));}}]});
if(Object.keys(result.metafile.inputs).some(p=>!p.startsWith('fixture:')&&/integrations\/supabase\/client/.test(p)))throw Error('Production backend included');
const css=await Promise.all(['/src/index.css?direct','/src/styles/cinematic-home.css?direct'].map(async p=>{const r=await fetch('http://localhost:8080'+p);if(!r.ok)throw Error('Missing local CSS');return r.text();}));
await writeFile(path.join(output,'fixture.css'),css.join('\n'));
await writeFile(path.join(output,'fixture.html'),'<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>');
const run=spawnSync('python3',['scripts/qa/owner-intake.py',output],{stdio:'inherit'});process.exitCode=run.status??1;
