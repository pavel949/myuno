// Actual admin tool surfaces with synthetic read-only hooks; no production client.
import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';
import postcssImport from 'postcss-import';
import tailwind from 'tailwindcss';
import autoprefixer from 'autoprefixer';
const root=process.cwd();
const output=process.env.ADMIN_TOOLS_OUTPUT||'/tmp/myuno-admin-tools';
await mkdir(output,{recursive:true});
const virtual={
 '@/contexts/LanguageContext':`export const useLanguage=()=>({language:new URLSearchParams(location.search).get('lang')||'en',t:key=>key});`,
 '@/components/ds':`export{SectionHeader}from'${root}/src/components/ds/SectionHeader.tsx';`,
 '@/components/admin/settings/NotificationSettings':`export const NotificationSettings=()=> <p className="border p-3">Synthetic read-only notification settings boundary</p>;`,
 '@/components/admin/settings/FeatureFlagManager':`export const FeatureFlagManager=()=> <p>Read-only flags boundary</p>;`,
 '@/components/admin/settings/OrgProfileEditor':`export const OrgProfileEditor=()=> <p>Read-only organization boundary</p>;`,
 '@/contexts/GoogleMapsContext':`export const useGoogleMaps=()=>({hasKey:false,isLoaded:false,loadError:null,apiAvailable:false});`,
 '@/hooks/useGoogleGeocode':`export const useGoogleGeocode=()=>({reverseGeocodeWithStatus:async()=>{throw Error('No external geocoding in fixture')}});`,
 '@/lib/googleMaps':`export const getGoogleMapsKey=()=>null;`,
 '@/hooks/useAuditLogs':`import{useQuery}from'@tanstack/react-query';export function useAuditLogs(){return useQuery({queryKey:['synthetic-audit'],retry:false,queryFn:async()=>{window.fixtureReads++;if(window.fixtureScenario==='error'&&window.fixtureReads===1)throw Error('Synthetic read failure');return{logs:window.fixtureScenario==='full'?[{id:'synthetic-log',action:'Synthetic review event',entity_type:'property',admin_name:'Synthetic operator',created_at:'2026-10-23T10:00:00Z'}]:[],total:window.fixtureScenario==='full'?1:0}}})}export const formatAuditAction=action=>({label:action,color:''});export const formatEntityType=value=>value;`,
 '@/integrations/supabase/client':`const forbidden=()=>{window.fixtureForbidden.push('Unexpected write/transport');throw Error('Production transport forbidden')};export const supabase={from(table){if(table!=='user_roles')return forbidden();return{select:async()=>{window.fixtureReads++;return window.fixtureScenario==='error'&&window.fixtureReads===1?{data:null,error:Error('Synthetic role read failure')}:{data:[],error:null}}}},rpc:forbidden,functions:{invoke:forbidden},auth:{getUser:forbidden}};`,
};
const entry=`import React from'react';import{createRoot}from'react-dom/client';import{MemoryRouter}from'react-router-dom';import{QueryClient,QueryClientProvider}from'@tanstack/react-query';import Settings from'${root}/src/pages/admin/AdminSystemSettings.tsx';import Control from'${root}/src/pages/admin/AdminControlCenter.tsx';import{ControlAuditTab}from'${root}/src/components/admin/control/ControlAuditTab.tsx';import{ControlLogsTab}from'${root}/src/components/admin/control/ControlLogsTab.tsx';import{ControlRolesTab}from'${root}/src/components/admin/control/ControlRolesTab.tsx';const p=new URLSearchParams(location.search);window.fixtureScenario=p.get('scenario')||'empty';window.fixtureReads=0;window.fixtureForbidden=[];const Component={settings:Settings,control:Control,audit:ControlAuditTab,logs:ControlLogsTab,roles:ControlRolesTab}[p.get('surface')||'settings'];createRoot(document.getElementById('root')).render(<MemoryRouter><QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><aside className="border-b p-2 text-xs">Isolated admin tool screens · synthetic reads · no production operations</aside><main style={{maxWidth:1440,margin:'auto',padding:16,minWidth:0}}><Component/></main></QueryClientProvider></MemoryRouter>);`;
const result=await build({stdin:{contents:entry,loader:'tsx',resolveDir:root},bundle:true,format:'esm',outfile:path.join(output,'fixture.js'),metafile:true,define:{'process.env.NODE_ENV':'"production"'},jsx:'automatic',plugins:[{name:'read-only-fixtures',setup(builder){builder.onResolve({filter:/.*/},args=>{if(args.path in virtual)return{path:args.path,namespace:'fixture'};if(args.path.startsWith('@/')){const base=path.join(root,'src',args.path.slice(2));const file=[base,base+'.ts',base+'.tsx',path.join(base,'index.ts'),path.join(base,'index.tsx')].find(p=>existsSync(p)&&statSync(p).isFile());if(!file)throw Error('Unresolved '+args.path);return{path:file}}});builder.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:virtual[args.path],loader:'tsx',resolveDir:root}));}}]});
const inputs=Object.keys(result.metafile.inputs);
for(const name of ['AdminSystemSettings.tsx','AdminControlCenter.tsx','GoogleMapsStatusCard.tsx','ControlSystemTab.tsx','ControlAuditTab.tsx','ControlLogsTab.tsx','ControlRolesTab.tsx'])if(!inputs.some(p=>p.endsWith(name)))throw Error('Missing actual component '+name);
if(inputs.some(p=>!p.startsWith('fixture:')&&p.includes('integrations/supabase/client')))throw Error('Production client bundled');
await writeFile(path.join(output,'bundle-inputs.json'),JSON.stringify({inputs,boundaries:Object.keys(virtual)},null,2));
const css=await postcss([postcssImport(),tailwind({config:path.join(root,'tailwind.config.ts')}),autoprefixer()]).process(await readFile(path.join(root,'src/index.css'),'utf8'),{from:path.join(root,'src/index.css')});
await writeFile(path.join(output,'fixture.css'),css.css);
await writeFile(path.join(output,'fixture.html'),'<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>');
console.log(JSON.stringify({output,components:'actual',productionTransport:false}));
