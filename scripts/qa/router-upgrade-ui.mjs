// Actual Router 7 + provider dialog + property alias; all authority/data synthetic.
import { build } from 'esbuild';
import { mkdir,readFile,writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import assert from 'node:assert/strict';
import postcss from 'postcss';
import postcssImport from 'postcss-import';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import { chromium } from '@playwright/test';
import { radixOverlayAliases } from '../radix-overlay-resolution.mjs';
const root=process.cwd(),out='/tmp/myuno-router-upgrade-ui';await mkdir(out,{recursive:true});
const virtual={
 '@/contexts/LanguageContext':`export const useLanguage=()=>({language:new URLSearchParams(location.search).get('lang')||'en',t:key=>key});`,
 '@/contexts/AuthContext':`export const useAuth=()=>({user:{id:'synthetic-admin'},isLoading:false});`,
 '@/hooks/useAdmin':`const providers=[{id:'synthetic-provider',name:'Synthetic Provider',business_category:'legal',is_active:true,is_verified:false,languages:[],service_domains:[]}];const noWrite=()=>{window.__writes++;throw Error('Business writes forbidden')};export const useAdminCheck=()=>({isAdmin:true,isLoading:false});export const useAdminProviders=()=>({providers,totalCount:1,isLoading:false,isFetching:false,error:null,createProvider:noWrite,updateProvider:noWrite,deleteProvider:noWrite,refetch:async()=>{}});`,
 '@/components/admin/BusinessCardScanButton':`export const BusinessCardScanButton=()=>null;`,
 '@/integrations/supabase/client':`export const supabase={from(){throw Error('Backend transport forbidden')}};`,
};
const entry=`import React,{Suspense,lazy}from'react';import{createRoot}from'react-dom/client';import{MemoryRouter,Routes,Route,useLocation,useNavigate}from'react-router-dom';import{QueryClient,QueryClientProvider}from'@tanstack/react-query';import AdminProviders from'${root}/src/pages/admin/AdminProviders.tsx';import PropertySearchRedirect from'${root}/src/components/property/PropertySearchRedirect.tsx';
window.__writes=0;let finish;const delayed=new Promise(resolve=>{finish=resolve});const Catalog=lazy(()=>delayed);function Probe(){const l=useLocation(),n=useNavigate();return <><button id="resolve" onClick={()=>finish({default:()=> <p id="catalog">Synthetic catalogue ready</p>})}>Release fixture page</button><button id="back" onClick={()=>n(-1)}>Back fixture</button><output id="route">{l.pathname+l.search+l.hash}|{JSON.stringify(l.state)}</output></>};const redirect=new URLSearchParams(location.search).get('scenario')==='redirect';const target=redirect?{pathname:'/property',search:'?mode=rent&q=synthetic&opaque=keep',hash:'#results',state:{from:'synthetic'}}:'/admin/providers?edit=synthetic-provider&q=keep&filter=inactive';createRoot(document.getElementById('root')).render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><MemoryRouter initialEntries={['/origin',target]}><main><Probe/><Suspense fallback={<p role="status">Fixture loading</p>}><Routes><Route path="/admin/providers" element={<AdminProviders/>}/><Route path="/property" element={<PropertySearchRedirect/>}/><Route path="/property/search" element={<Catalog/>}/><Route path="/origin" element={<p>Origin</p>}/></Routes></Suspense></main></MemoryRouter></QueryClientProvider>);`;
await build({stdin:{contents:entry,resolveDir:root,sourcefile:'router-upgrade-fixture.tsx',loader:'tsx'},bundle:true,write:true,outfile:path.join(out,'bundle.js'),format:'iife',platform:'browser',target:'es2020',jsx:'automatic',alias:{...radixOverlayAliases,'@':path.join(root,'src')},define:{'process.env.NODE_ENV':'"development"'},plugins:[{name:'synthetic-boundaries',setup(b){b.onResolve({filter:/^@\//},args=>virtual[args.path]?{path:args.path,namespace:'synthetic'}:undefined);b.onLoad({filter:/.*/,namespace:'synthetic'},args=>({contents:virtual[args.path],loader:'tsx',resolveDir:root}));}}]});
const css=await postcss([postcssImport(),tailwindcss(),autoprefixer()]).process(await readFile('src/index.css','utf8'),{from:path.join(root,'src/index.css')});await writeFile(path.join(out,'style.css'),css.css);
const bootstrap=[...(await readFile('index.html','utf8')).matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m=>m[1]).join('\n');
const html=`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${bootstrap}</style><link rel="stylesheet" href="/style.css"></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>`;
const server=createServer(async(req,res)=>{try{const pathname=new URL(req.url,'http://localhost').pathname;if(pathname==='/'){res.setHeader('Content-Type','text/html');res.end(html);return;}const file=pathname==='/bundle.js'||pathname==='/style.css'?path.join(out,pathname):path.resolve(root,'public','.'+pathname);if(!file.startsWith(out+'/')&&!file.startsWith(path.join(root,'public')+'/')){res.writeHead(403).end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.woff2')?'font/woff2':'application/octet-stream');res.end(await readFile(file));}catch{res.writeHead(404).end();}});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}`,browser=await chromium.launch({executablePath:process.env.MYUNO_BROWSER_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']}),results=[];
try{for(const width of [375,390,430,1280])for(const lang of ['en','ru'])for(const scenario of ['provider','redirect']){
 const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'}),page=await context.newPage(),errors=[],blocked=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',route=>{if(new URL(route.request().url()).origin===origin)return route.continue();blocked.push(route.request().url());return route.abort();});
 try{await page.goto(`${origin}/?lang=${lang}&scenario=${scenario}`);
  if(scenario==='provider'){
   const dialog=page.getByRole('dialog',{name:lang==='ru'?'Редактировать провайдера':'Edit Provider'});await dialog.waitFor();await page.waitForFunction(()=>document.querySelector('#route')?.textContent==='/admin/providers?q=keep&filter=inactive|null');
   await dialog.getByRole('textbox').first().fill('Retained synthetic draft');assert.equal(await dialog.getByRole('textbox').first().inputValue(),'Retained synthetic draft');
   const box=await dialog.boundingBox();assert.ok(box&&box.x>=-1&&box.x+box.width<=width+1&&box.y>=-1&&box.y+box.height<=901);
   await dialog.getByRole('button',{name:lang==='ru'?'Отмена':'Cancel',exact:true}).click();await dialog.waitFor({state:'hidden'});
  }else{
   const pending=page.getByRole('status',{name:'Loading myUNO'});await pending.waitFor();assert.equal(await pending.getAttribute('data-loading-scope'),'content');assert.equal(await pending.evaluate(el=>getComputedStyle(el).minHeight),'192px');
   await page.locator('#resolve').click();await page.locator('#catalog').waitFor();assert.ok((await page.locator('#route').textContent()).includes('opaque=keep#results'));assert.ok((await page.locator('#route').textContent()).includes('synthetic'));
   await page.locator('#back').click();await page.waitForFunction(()=>document.querySelector('#route')?.textContent?.startsWith('/origin|'));
  }
  assert.equal(await page.evaluate(()=>window.__writes),0);assert.deepEqual(errors,[]);assert.deepEqual(blocked,[]);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.screenshot({path:path.join(out,`${scenario}-${lang}-${width}.png`)});results.push({width,lang,scenario,passed:true});
 }finally{await context.close();}
}}finally{await browser.close();server.close();await writeFile(path.join(out,'results.json'),JSON.stringify(results,null,2));}
console.log(`${results.length}/16 Router 7 browser cases passed; network restricted to the synthetic fixture; no business writes`);
