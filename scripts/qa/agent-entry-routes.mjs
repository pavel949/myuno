// Actual agent page/form/hook; synthetic auth, RPC and shell. Never a production submit.
import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import postcss from 'postcss';
import postcssImport from 'postcss-import';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { existsSync, statSync } from 'node:fs';
const root=process.cwd();
const output = '/tmp/browser/agent-entry-isolated';
const out=process.env.AGENT_QA_OUTPUT||output;
await mkdir(out,{recursive:true});
const virtual={
 '@/contexts/LanguageContext':`export const useLanguage=()=>({language:new URLSearchParams(location.search).get('lang')||'en'});`,
 '@/contexts/AuthContext':`export const useAuth=()=>({user:null});`,
 '@/hooks/useCapitalIntroRequest':`export const useCapitalIntroRequest=()=>({isPending:false});`,
 '@/integrations/supabase/client':`export const supabase={rpc:async(name,args)=>{if(name!=='submit_consultation_request')throw Error('Forbidden RPC');window.syntheticCalls.push({name,args});return new URLSearchParams(location.search).has('fail')?{error:{message:'Synthetic persistence failure'},data:null}:{error:null,data:'synthetic-receipt'}},functions:{invoke:async(name,args)=>{window.syntheticNotifications.push({name,args});return{data:{synthetic:true},error:null}}}};`,
 '@/components/seo':`export const SEOHead=()=>null;`,
 '@/components/miniapp/LandingLayout':`import React from'react';export const LandingLayout=({children,title,subtitle,heroCta})=><main><header className="p-4 border-b"><h1 className="text-h1">{title}</h1><p>{subtitle}</p><button className="p-4 border" onClick={heroCta.onClick}>{heroCta.label}</button></header>{children}</main>;`,
 'sonner':`export const toast={success:()=>{},error:()=>{}};`,
};
const entry=`import React from'react';import{createRoot}from'react-dom/client';import{BrowserRouter,Routes,Route,useLocation}from'react-router-dom';import{QueryClient,QueryClientProvider}from'@tanstack/react-query';import Page from'@/pages/landings/AgentLandingPage';import{AgentEntryRedirect}from'@/components/landings/AgentEntryRedirect';import PropertySearchRedirect from'@/components/property/PropertySearchRedirect';window.syntheticCalls=[];window.syntheticNotifications=[];function Proof(){const l=useLocation();return <output data-testid="route">{l.pathname+l.search+l.hash}</output>}createRoot(document.getElementById('root')).render(<QueryClientProvider client={new QueryClient()}><BrowserRouter><Proof/><Routes><Route path="/for/agent" element={<Page/>}/>{['join','dashboard','resources'].map(entry=><Route key={entry} path={'/agent/'+entry} element={<AgentEntryRedirect entry={entry}/>}/>)}<Route path="/property/browse" element={<PropertySearchRedirect/>}/><Route path="/property/search" element={<main><h1>Public catalogue boundary</h1></main>}/><Route path="*" element={<h1>No privileged workspace</h1>}/></Routes></BrowserRouter></QueryClientProvider>);`;
const result=await build({stdin:{contents:entry,resolveDir:root,loader:'tsx'},bundle:true,format:'esm',outfile:path.join(out,'fixture.js'),jsx:'automatic',metafile:true,plugins:[{name:'isolated',setup(b){b.onResolve({filter:/.*/},args=>virtual[args.path]?{path:args.path,namespace:'virtual'}:undefined);b.onLoad({filter:/.*/,namespace:'virtual'},args=>({contents:virtual[args.path],loader:'tsx',resolveDir:root}));b.onResolve({filter:/^@\//},args=>{const base=path.join(root,'src',args.path.slice(2));return {path:[base,base+'.tsx',base+'.ts',path.join(base,'index.ts'),path.join(base,'index.tsx')].find(p=>existsSync(p)&&statSync(p).isFile())||base};});}}]});
if(Object.keys(result.metafile.inputs).some(p=>p.includes('integrations/supabase/client.ts')))throw Error('Real client bundled');
const css=await postcss([postcssImport(),tailwindcss(),autoprefixer()]).process(await readFile(path.join(root,'src/index.css'),'utf8'),{from:path.join(root,'src/index.css')});await writeFile(path.join(out,'fixture.css'),css.css);
await writeFile(path.join(out,'fixture.html'),'<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>');
await writeFile(path.join(out,'provenance.json'),JSON.stringify({sources:await Promise.all(['src/pages/landings/AgentLandingPage.tsx','src/components/landings/AgentEntryRedirect.tsx','src/components/property/PropertySearchRedirect.tsx'].map(async file=>({file,sha256:createHash('sha256').update(await readFile(file)).digest('hex')}))),head:spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).stdout.trim(),diff:spawnSync('git',['diff','--stat'],{encoding:'utf8'}).stdout,limits:['Actual page/form/useUniversalLead; synthetic RPC/auth/notification/shell boundaries','No real writes, delivery, enrolment, private workspace or production acceptance','Fallback fonts; public assets denied']},null,2));
if(!process.argv.includes('--build-only'))process.exitCode=spawnSync('python3',['scripts/qa/agent-entry-routes.py',out],{stdio:'inherit'}).status??1;
