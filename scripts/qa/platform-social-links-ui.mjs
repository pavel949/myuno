// Actual settings form/footer, synthetic settings transport only. Never a hosted write.
import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import postcss from 'postcss';
import postcssImport from 'postcss-import';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import { radixOverlayAliases } from '../radix-overlay-resolution.mjs';
const root=process.cwd(),out=process.env.SOCIAL_QA_OUTPUT||path.join(root,'artifacts/platform-social-links');await mkdir(out,{recursive:true});
const virtual={
 '@/contexts/AuthContext':`export const useAuth=()=>({user:{id:'synthetic-admin'}});`,
 '@/contexts/LanguageContext':`export const useLanguage=()=>({language:new URLSearchParams(location.search).get('lang')||'en'});`,
 '@/hooks/useBreakpoint':`export const useBreakpoint=()=>({isLargeDesktop:innerWidth>=1024});`,
 '@/hooks/usePWAInstall':`export const usePWAInstall=()=>({isInstalled:true,canInstall:false,isIOS:false,install:async()=>false});`,
 '@/hooks/useHapticFeedback':`export const triggerHaptic=()=>{};`,
 '@/hooks/useSoundEffects':`export const playSound=()=>{};export const isTypingKey=()=>false;`,
 '@/hooks/useFeedbackSettings':`export const getFeedbackSettings=()=>({});`,
 '@/integrations/supabase/client':`let stored=null;export const supabase={from:table=>{if(table!=='system_settings')throw Error('Unexpected synthetic table');let keys=[],rows=null;const chain={select:fields=>{if(fields!=='key, value')throw Error('Unexpected projection');return chain;},in:(key,values)=>{if(key!=='key'||values.length!==1||values[0]!=='org_social_links')throw Error('Broad private settings read');keys=values;return chain;},eq:(key,value)=>{if(key!=='key'||value!=='org_social_links')throw Error('Broad public settings read');keys=[value];return chain;},upsert:(value,options)=>{if(options.onConflict!=='key'||value.length!==1||value[0].key!=='org_social_links')throw Error('Unexpected write');rows=value;return chain;},maybeSingle:async()=>({data:stored?{key:'org_social_links',value:stored}:null,error:null}),then:(yes,no)=>{if(rows)stored=JSON.parse(JSON.stringify(rows[0].value));return Promise.resolve({data:stored?keys.length||rows?[{key:'org_social_links',value:stored}]:[]:[],error:null}).then(yes,no);}};return chain;}};`,
};
const result=await build({alias:radixOverlayAliases,stdin:{contents:`import React from 'react';import{createRoot}from'react-dom/client';import{MemoryRouter}from'react-router-dom';import{QueryClient,QueryClientProvider}from'@tanstack/react-query';import{Toaster}from'sonner';import{SocialNetworkSettings}from'${root}/src/components/admin/settings/SocialNetworkSettings.tsx';import{CompactFooter}from'${root}/src/components/layout/CompactFooter.tsx';const client=new QueryClient({defaultOptions:{queries:{retry:false}}});createRoot(document.getElementById('root')).render(<QueryClientProvider client={client}><MemoryRouter><main className="mx-auto max-w-[var(--layout-width-workspace)] p-4"><SocialNetworkSettings/></main><CompactFooter/><Toaster/></MemoryRouter></QueryClientProvider>);`,loader:'tsx',resolveDir:root},outfile:path.join(out,'app.js'),bundle:true,format:'esm',jsx:'automatic',metafile:true,loader:{'.svg':'file','.png':'file','.webp':'file'},define:{'process.env.NODE_ENV':'"production"','import.meta.env.DEV':'false'},plugins:[{name:'synthetic-social-transport',setup(b){b.onResolve({filter:/.*/},args=>{if(Object.hasOwn(virtual,args.path))return{path:args.path,namespace:'synthetic'};if(args.path.startsWith('@/')){const base=path.join(root,'src',args.path.slice(2));const file=[base,base+'.ts',base+'.tsx',path.join(base,'index.ts'),path.join(base,'index.tsx')].find(file=>existsSync(file)&&statSync(file).isFile());if(!file)throw Error('Unresolved actual module '+args.path);return{path:file};}});b.onLoad({filter:/.*/,namespace:'synthetic'},args=>({contents:virtual[args.path],loader:'tsx',resolveDir:root}));}}]});
for(const file of ['src/components/admin/settings/SocialNetworkSettings.tsx','src/components/layout/CompactFooter.tsx','src/lib/adminSystemSettings.ts','src/hooks/usePlatformSocialLinks.ts','src/lib/social/platformSocialLinks.ts'])if(!Object.keys(result.metafile.inputs).some(input=>input.endsWith(file)))throw Error('Actual module missing: '+file);
const css=await postcss([postcssImport(),tailwindcss(path.join(root,'tailwind.config.ts')),autoprefixer()]).process(await readFile('src/index.css','utf8'),{from:path.join(root,'src/index.css')});await writeFile(path.join(out,'normal.css'),css.css);
await writeFile(path.join(out,'index.html'),'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/normal.css"></head><body><div id="root"></div><script type="module" src="/app.js"></script></body></html>');
if(!process.argv.includes('--build-only')){const run=spawnSync(process.env.PYTHON||'python3',['scripts/qa/platform-social-links-ui.py',out],{stdio:'inherit',timeout:180000});process.exitCode=run.status??1;}
