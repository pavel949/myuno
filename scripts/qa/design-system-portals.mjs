// Actual portal layouts/chrome; synthetic read-only data and explicitly synthetic Outlet.
// This harness proves UI behavior only, never server role or backend readiness.
import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const root = process.cwd();
const output = process.env.DS_PORTALS_OUTPUT || '/tmp/browser/design-system-portals';
await mkdir(output, { recursive: true });
const base = await readFile(path.join(root, 'scripts/qa/pms-dashboard-ui.mjs'), 'utf8');
// Reuse only its isolated synthetic hook map; never run the other harness.
const mapSource = base.slice(base.indexOf('const queryState ='), base.indexOf('const result = await build'));
const virtual = new Function(`${mapSource};return virtual;`)();
delete virtual['@/contexts/ThemeContext']; // Actual provider drives repeat switching.
delete virtual['@/components/nav/ConsumerHeader']; // Guest uses actual consumer chrome.
Object.assign(virtual, {
 '@/contexts/LanguageContext': `export const useLanguage=()=>({language:new URLSearchParams(location.search).get('lang')||'en',t:key=>key,setLanguage:()=>{}});`,
 '@/hooks/useOwnerType': `export const useOwnerType=()=>({isMCPortal:true});`,
 '@/hooks/useUserTracking': `export const useUserTracking=()=>{};`,
 '@/hooks/usePlatformAnalytics': `export const usePlatformAnalytics=()=>{};`,
 '@/hooks/usePrefetch': `export const usePrefetchRoute=()=>({prefetchRoute:()=>{}});`,
 '@/lib/prefetchRoute': `export const prefetchRoute=()=>{};`,
 '@/hooks/useUserPersonas': `export const useUserPersonas=()=>({personas:[],activePersonas:[],hasPersona:()=>false});`,
 '@/hooks/useUiSignOut': `export const useUiSignOut=()=>async()=>{throw Error('Sign-out forbidden in read-only fixture')};`,
 '@/hooks/useTeamMember': `export const useTeamMember=()=>({member:{display_name:'Synthetic team member'},hasSpecialization:()=>true,isTeamLead:true});`,
 '@/hooks/useTeamGamification': `export const useMyGamification=()=>({stats:{level:1,total_points:0},level:{color:'bg-muted text-muted-foreground'},progress:{progress:0}});`,
 '@/hooks/useDeveloperPortal': `export const useDeveloperProfile=()=>({data:{id:'synthetic-developer',name_en:'Synthetic developer'},isLoading:false});`,
 '@/hooks/useOwnerPortalSettings': `export const useMyPortalSettings=()=>({isLoading:false,data:[{id:'synthetic-portal',property_id:'synthetic-property',properties:{title:'Synthetic owner property',title_ru:'Тестовый объект владельца',address:'Synthetic address',cover_image:null}}]});`,
 '@/integrations/supabase/client': `const allowed=new Set(['owner_statement_approvals','signature_request_signers']);export const supabase={auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},from:table=>{if(!allowed.has(table))throw Error('Forbidden fixture read '+table);const q={select:()=>q,eq:()=>q,then:resolve=>Promise.resolve({data:[],count:0,error:null}).then(resolve)};return q;}};`,
});
const layoutFiles = ['vendor/VendorLayout','guest/GuestLayout','team/TeamLayout','capital/CapitalLayout','newbuilds/DeveloperPortalLayout'];
const imports = layoutFiles.map((file,i)=>`import ${i===4?'DeveloperPortalLayout':`{${file.split('/')[1]}}`} from '${root}/src/components/${file}.tsx';`).join('\n');
const result = await build({stdin:{contents:`
import React,{useState,useEffect}from'react';import{createRoot}from'react-dom/client';import{MemoryRouter,Routes,Route,useLocation}from'react-router-dom';import{QueryClient,QueryClientProvider}from'@tanstack/react-query';
import{ThemeProvider,useTheme}from'${root}/src/contexts/ThemeContext.tsx';
${imports}
import OwnerPortalDashboard from '${root}/src/pages/owner-portal/OwnerPortalDashboard.tsx';
const params=new URLSearchParams(location.search),scene=params.get('scene')||'team';document.documentElement.lang=params.get('lang')||'en';localStorage.setItem('myuno-theme',params.get('theme')||'light');
window.fixtureWrites=0;window.fixtureMounts=0;window.fixtureUnmounts=0;
function Controls(){const theme=useTheme();return <aside data-fixture-controls><strong>Isolated shell QA — synthetic identity/data; no backend authorization proof</strong><button id="fixture-theme" onClick={()=>theme.setTheme(theme.resolvedTheme==='dark'?'light':'dark')}>Fixture theme switch</button><output id="fixture-theme-value">{theme.resolvedTheme}</output></aside>;}
function Draft(){const[value,setValue]=useState('');useEffect(()=>{window.fixtureMounts++;return()=>{window.fixtureUnmounts++;}},[]);return <section className="ds-frame ds-frame-content ds-page" data-synthetic-outlet><h1>Synthetic Outlet — shell only</h1><label htmlFor="fixture-draft">Synthetic unsaved draft</label><input className="border border-input bg-background text-foreground min-h-11 w-full" id="fixture-draft" value={value} onChange={e=>setValue(e.target.value)}/><button className="min-h-11 border border-border" id="fixture-action" onClick={()=>{window.fixtureWrites++;}}>Local-only fixture action</button><p>Content, workflows and permissions are intentionally outside this shell test.</p><div style={{height:900}} aria-hidden="true"/><p id="fixture-end">End of synthetic Outlet</p></section>;}
function Location(){return <output hidden id="fixture-route">{useLocation().pathname}</output>;}
const paths={vendor:'/vendor',guest:'/guest',team:'/team',capital:'/capital',developer:'/developer-portal',owner:'/my-property'};
function App(){return <><Controls/><MemoryRouter initialEntries={[paths[scene]]}><Location/><Routes><Route path="*" element={scene==='vendor'?<VendorLayout/>:scene==='guest'?<GuestLayout/>:scene==='team'?<TeamLayout><Draft/></TeamLayout>:scene==='capital'?<CapitalLayout/>:scene==='developer'?<DeveloperPortalLayout/>:<OwnerPortalDashboard/>}><Route path="*" element={<Draft/>}/></Route></Routes></MemoryRouter></>;}
createRoot(document.getElementById('root')).render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><ThemeProvider><App/></ThemeProvider></QueryClientProvider>);`,loader:'tsx',resolveDir:root},bundle:true,outfile:path.join(output,'app.js'),jsx:'automatic',format:'esm',metafile:true,define:{'process.env.NODE_ENV':'"production"','import.meta.env.DEV':'false'},plugins:[{name:'synthetic-portal-data',setup(b){b.onResolve({filter:/.*/},args=>{if(Object.hasOwn(virtual,args.path))return{path:args.path,namespace:'fixture'};if(args.path.startsWith('@/')){const base=path.join(root,'src',args.path.slice(2));const resolved=[base,base+'.ts',base+'.tsx',path.join(base,'index.ts'),path.join(base,'index.tsx')].find(p=>existsSync(p)&&statSync(p).isFile());if(!resolved)throw Error('Unresolved '+args.path);return{path:resolved};}});b.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:virtual[args.path],loader:'tsx',resolveDir:root}));}}]});
if(Object.keys(result.metafile.inputs).some(file=>!file.startsWith('fixture:')&&/integrations\/supabase\/client/.test(file)))throw Error('Real Supabase client included');
for(const file of [...layoutFiles.map(file=>'src/components/'+file+'.tsx'),'src/pages/owner-portal/OwnerPortalDashboard.tsx','src/contexts/ThemeContext.tsx'])if(!Object.keys(result.metafile.inputs).some(input=>input.endsWith(file)))throw Error('Actual source missing '+file);
await writeFile(path.join(output,'manifest.json'),JSON.stringify({scope:'Actual layouts; synthetic auth/data/outlet, not backend/roles verification',sourceHashes:Object.fromEntries(await Promise.all([...layoutFiles.map(file=>'src/components/'+file+'.tsx'),'src/pages/owner-portal/OwnerPortalDashboard.tsx'].map(async file=>[file,createHash('sha256').update(await readFile(path.join(root,file))).digest('hex')]))),inputs:Object.keys(result.metafile.inputs)},null,2));
await writeFile(path.join(output,'index.html'),'<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/normal.css"><link rel="stylesheet" href="/app.css"></head><body><div id="root"></div><script type="module" src="/app.js"></script></body></html>');
if(process.argv.includes('--bundle-only'))process.exit(0);
if(!process.env.DS_PORTALS_CSS)throw Error('DS_PORTALS_CSS must name root-approved current compiled canonical CSS; no stale default allowed');
const run=spawnSync('python3',[path.join(root,'scripts/qa/design-system-portals.py'),output,process.env.DS_PORTALS_CSS],{stdio:'inherit'});process.exitCode=run.status??1;
