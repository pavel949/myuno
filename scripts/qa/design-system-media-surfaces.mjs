// Actual viewer/editor/cropper; synthetic local images only. No AI/storage calls.
import { build } from 'esbuild';
import postcss from 'postcss';
import postcssImport from 'postcss-import';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import fs from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
const root=process.cwd(), output=process.env.DS_MEDIA_OUTPUT||path.join(root,'artifacts/design-system/media-adoption');
await fs.mkdir(output,{recursive:true});
const virtual={
  '@/contexts/LanguageContext':`export const useLanguage=()=>({language:new URLSearchParams(location.search).get('lang')||'en'});`,
  '@/integrations/supabase/client':`const deny=()=>{window.fixtureForbidden.push('AI/storage/database call');throw Error('Live media transport forbidden')};export const supabase={functions:{invoke:deny},storage:{from:deny},from:deny,rpc:deny};`,
  '@/hooks/useHapticFeedback':`export const triggerHaptic=()=>{};`,
  '@/hooks/useSoundEffects':`export const playSound=()=>{};export const isTypingKey=()=>false;`,
  '@/hooks/useFeedbackSettings':`export const getFeedbackSettings=()=>({hapticEnabled:false,soundEnabled:false});`,
};
const entry=`import React,{useState}from'react';import{createRoot}from'react-dom/client';import{PhotoLightbox}from'@/components/property/PhotoLightbox';import{ImageEditor}from'@/components/upload/ImageEditor';const p=new URLSearchParams(location.search),lang=p.get('lang')||'en';document.documentElement.lang=lang;document.documentElement.classList.toggle('dark',p.get('theme')==='dark');window.fixtureForbidden=[];function App(){const[viewer,setViewer]=useState(false),[editor,setEditor]=useState(false);return <main className="p-4 space-y-4"><p className="border p-3 text-sm">SYNTHETIC MEDIA QA — actual viewer/editor/cropper; no uploads, AI or live auth; fallback fonts.</p><button className="border p-3" onClick={()=>setViewer(true)}>Open viewer</button><button className="border p-3" onClick={()=>setEditor(true)}>Open editor</button><PhotoLightbox images={['/bright.svg','/dark.svg','/third.svg']} alts={['Synthetic bright scene','Synthetic dark scene','Synthetic third scene']} captions={['Bright local image','Dark local image','Third local image']} open={viewer} onClose={()=>{window.fixtureViewerCloses=(window.fixtureViewerCloses||0)+1;setViewer(false)}}/><ImageEditor open={editor} onOpenChange={setEditor} imageUrl="/bright.svg" userId="synthetic-only" folder="synthetic-only" onSave={()=>{window.fixtureForbidden.push('Save callback');throw Error('Save not exercised')}}/></main>}createRoot(document.getElementById('root')).render(<App/>);`;
const bundle=await build({stdin:{contents:entry,loader:'tsx',resolveDir:root},bundle:true,jsx:'automatic',format:'esm',outdir:output,entryNames:'app',chunkNames:'chunks/[name]-[hash]',splitting:true,metafile:true,define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'synthetic-media-boundary',setup(b){b.onResolve({filter:/.*/},args=>{if(Object.hasOwn(virtual,args.path))return{path:args.path,namespace:'synthetic'};if(args.path.startsWith('@/')){const base=path.join(root,'src',args.path.slice(2));const resolved=[base+'.ts',base+'.tsx',base+'/index.ts',base+'/index.tsx'].find(f=>existsSync(f)&&statSync(f).isFile());if(!resolved)throw Error('Unresolved '+args.path);return{path:resolved};}});b.onLoad({filter:/.*/,namespace:'synthetic'},args=>({contents:virtual[args.path],loader:'tsx',resolveDir:root}));}}]});
const inputs=Object.keys(bundle.metafile.inputs);
const scriptFiles=Object.keys(bundle.metafile.outputs).filter(file=>file.endsWith('.js')).map(file=>path.relative(output,path.resolve(file)));
const cropperChunks=Object.entries(bundle.metafile.outputs).filter(([file,meta])=>file.endsWith('.js')&&meta.entryPoint?.includes('/react-advanced-cropper/')&&!meta.entryPoint.endsWith('.css')).map(([file])=>path.relative(output,path.resolve(file)));
const componentCSS=Object.keys(bundle.metafile.outputs).filter(file=>file.endsWith('.css')).map(file=>path.relative(output,path.resolve(file)));
if(!cropperChunks.length)throw Error('Real lazy cropper chunk missing');
for(const actual of ['components/property/PhotoLightbox.tsx','components/upload/ImageEditor.tsx'])if(!inputs.some(f=>f.endsWith(actual)&&!f.startsWith('synthetic:')))throw Error('Actual target absent '+actual);
if(!inputs.some(f=>f.includes('/react-advanced-cropper/')))throw Error('Real cropper absent');
if(!inputs.some(f=>f.endsWith('react-advanced-cropper/dist/style.css')))throw Error('Real cropper CSS absent');
if(inputs.some(f=>!f.startsWith('synthetic:')&&f.includes('integrations/supabase/client')))throw Error('Production client bundled');
const css=await postcss([postcssImport(),tailwindcss(path.join(root,'tailwind.config.ts')),autoprefixer()]).process(await fs.readFile(path.join(root,'src/index.css'),'utf8'),{from:path.join(root,'src/index.css')});
await fs.writeFile(path.join(output,'theme.css'),css.css);
await fs.writeFile(path.join(output,'fixture.html'),'<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/theme.css">'+componentCSS.map(file=>'<link rel="stylesheet" href="/'+file+'">').join('')+'</head><body><div id="root"></div><script type="module" src="/app.js"></script></body></html>');
for(const [name,color,ink] of [['bright','#fff7e5','#202020'],['dark','#152636','#ffffff'],['third','#e5f2ee','#202020']])await fs.writeFile(path.join(output,name+'.svg'),`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400"><rect width="640" height="400" fill="${color}"/><rect x="80" y="60" width="480" height="280" fill="none" stroke="${ink}" stroke-width="8"/><path d="M80 60L560 340M560 60L80 340" stroke="${ink}" stroke-width="4"/><text x="110" y="210" font-size="30" fill="${ink}">SYNTHETIC ${name}</text></svg>`);
const sourceFiles=['src/components/property/PhotoLightbox.tsx','src/components/upload/ImageEditor.tsx','src/styles/tokens.css','tailwind.config.ts','src/components/ui/button.tsx','src/components/ui/dialog.tsx','src/lib/utils.ts','src/design-system/typeScale.ts','package-lock.json','scripts/qa/design-system-media-surfaces.mjs','scripts/qa/design-system-media-surfaces.py'];
const hashes=Object.fromEntries(await Promise.all(sourceFiles.map(async file=>[file,createHash('sha256').update(await fs.readFile(path.join(root,file))).digest('hex')])));
await fs.writeFile(path.join(output,'provenance.json'),JSON.stringify({root,base:spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).stdout.trim(),sourceHashes:hashes,cssSha256:createHash('sha256').update(css.css).digest('hex'),inputs,scriptFiles,cropperChunks,componentCSS,limitations:['Actual isolated components, not full App/role access','Actual react-advanced-cropper internals and CSS','No AI, storage, save or network writes','Local synthetic SVG images only; canonical external fonts not loaded']},null,2));
if(!process.argv.includes('--build-only')){const result=spawnSync('python3',[path.join(root,'scripts/qa/design-system-media-surfaces.py'),output],{stdio:'inherit'});process.exitCode=result.status??1;}
