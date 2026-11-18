// Real MapView + MapLibre + byte-verified public Phuket PMTiles.
// Offers/account shell are synthetic. Only allowlisted static map assets are read; no database/API access.
import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import postcss from 'postcss';
import postcssImport from 'postcss-import';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import { chromium, expect } from '@playwright/test';
const root = process.cwd();
const output = process.env.MAP_UI_OUTPUT || '/tmp/browser/map-isolated';
await mkdir(output, { recursive: true });
const head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const offers = [
  { image:'/fixture-cover.svg',id:'s1',routeId:'s1',href:'/property/s1',layer:'stay',name:'Synthetic villa',nameRu:'Тестовая вилла',lat:7.98,lng:98.31,rating:0,currency:'THB',approximate:false,priceFrom:2000,pricePeriod:'night',district:'Rawai',bedrooms:3,propertyType:'villa' },
  { id:'r1',routeId:'r1',href:'/property/r1',layer:'rent',name:'Synthetic rental',nameRu:'Тестовая аренда',lat:8.01,lng:98.34,rating:0,currency:'THB',approximate:false,priceFrom:45000,pricePeriod:'month',district:'Rawai' },
  { id:'b1',routeId:'b1',href:'/property/b1',layer:'sale',name:'Synthetic sale',nameRu:'Тестовая продажа',lat:7.95,lng:98.33,rating:0,currency:'THB',approximate:false,priceFrom:6000000 },
  { id:'n1',routeId:'n1',href:'/real-estate/newbuilds/n1',layer:'newbuild',name:'Synthetic project',nameRu:'Тестовый проект',lat:8.04,lng:98.32,rating:0,currency:'THB',approximate:false,priceFrom:null },
  { id:'e1',routeId:'e1',href:'/experiences/e1',layer:'experience',name:'Synthetic park',nameRu:'Тестовый парк',lat:8,lng:98.29,rating:0,currency:'THB',approximate:false,priceFrom:1000,category:'adventure',locationKind:'meeting_point' },
];
for(const offer of offers){offer.currency='THB';offer.approximate=false;}
const restaurants=[{id:'food1',name_en:'Synthetic restaurant',name_ru:'Тестовый ресторан',lat:7.96,lng:98.28,rating:0}];
const places=Object.fromEntries(['salons-map','gyms-map','pharmacies-map','veterinary_clinics-map'].map((key,index)=>[key,[{id:'premise-'+index,name_en:'Synthetic premise '+index,name_ru:['Тестовый салон','Тестовый фитнес','Тестовая аптека','Тестовая клиника'][index],lat:7.94+index*.027,lng:98.36}]]));
const virtual = {
 '@/contexts/LanguageContext': `export const useLanguage=()=>({language:'ru'});`,
 '@/contexts/CurrencyContext': `export const useCurrency=()=>({formatPrice:n=>'฿'+n});`,
 '@/contexts/LocationContext': `const getCityConfig=()=>({lat:7.98,lng:98.31});export const useLocation=()=>({getCityConfig});`,
 '@/integrations/supabase/client': `export const supabase=new Proxy({}, {get(){throw Error('Production data access forbidden in map fixture')}});`,
 '@tanstack/react-query': `const empty=[];const places=${JSON.stringify(places)};export const useQuery=({queryKey})=>({data:places[queryKey[0]]??empty,isLoading:false});`,
 '@/hooks/useProperties': `const data=[];export const usePropertiesForMap=()=>({data,isLoading:false});export const transformPropertiesToMarkers=()=>data;`,
 '@/hooks/useRestaurants': `const restaurants=${JSON.stringify(restaurants)};export const useRestaurants=()=>({restaurants,isLoading:false});`,
 '@/hooks/useExploreLayers': `const data=${JSON.stringify(offers)};const layerErrors=[];export const useExploreLayers=()=>({data,isLoading:false,layerErrors});`,
 '@/hooks/useExperiences': `export const EXPERIENCE_CATEGORIES=[];`,
 '@/components/layout/AppLayout': `import React from'react';export const AppLayout=({children})=><main data-canvas="consumer"><header style={{height:56,padding:'8px 16px',background:'#0A2240',color:'white',fontSize:12}}>MyUno · QA ONLY · Тестовые предложения · настоящая карта Пхукета</header>{children}</main>;`,
 '@/components/map/PoiClaimSheet': `export const PoiClaimSheet=()=>null;`,
 // Preserve production style/layers. Rewrite only static asset origins to local mirrors.
 'maplibre-gl': `import real from '${root}/node_modules/maplibre-gl/dist/maplibre-gl.js';
 class FixtureMap extends real.Map{constructor(options){
   const style=structuredClone(options.style);
   if(!style?.sources?.omt?.url?.startsWith('pmtiles://'))throw Error('Expected production PMTiles style');
   style.sources.omt.url='pmtiles://'+location.origin+'/phuket.pmtiles';
   style.glyphs=location.origin+'/fonts/{fontstack}/{range}.pbf';
   super({...options,style});window.fixtureMap=this;window.fixtureMapErrors=[];
   this.on('error',event=>window.fixtureMapErrors.push(String(event.error?.message||event.error)));
 }}
 export default {...real,Map:FixtureMap};`,
};
const entry=`import React from'react';import{createRoot}from'react-dom/client';import{MemoryRouter,useLocation}from'react-router-dom';import MapView from'${root}/src/pages/MapView.tsx';
 function Fixture(){const loc=useLocation();return <><output hidden data-testid="location">{loc.pathname+loc.search}</output><MapView/></>}
 createRoot(document.getElementById('root')).render(<MemoryRouter initialEntries={['/map'+location.search]} future={{v7_startTransition:true,v7_relativeSplatPath:true}}><Fixture/></MemoryRouter>);`;
const bundle = await build({stdin:{contents:entry,loader:'tsx',resolveDir:root},bundle:true,format:'esm',jsx:'automatic',outfile:path.join(output,'fixture.js'),metafile:true,
 define:{'process.env.NODE_ENV':'"production"','import.meta.env.VITE_PHUKET_PMTILES_URL':'undefined','import.meta.env.DEV':'false'},
 plugins:[{name:'map-fixture',setup(b){b.onResolve({filter:/.*/},args=>{
   if(Object.hasOwn(virtual,args.path))return{path:args.path,namespace:'fixture'};
   if(args.path.startsWith('@/')){const base=path.join(root,'src',args.path.slice(2));const resolved=[base,base+'.ts',base+'.tsx',path.join(base,'index.ts'),path.join(base,'index.tsx')].find(p=>existsSync(p)&&statSync(p).isFile());if(!resolved)throw Error('Unresolved '+args.path);return{path:resolved};}
 });b.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:virtual[args.path],loader:'tsx',resolveDir:root}));}}]});
const inputs=Object.keys(bundle.metafile.inputs);
for(const required of ['src/pages/MapView.tsx','src/components/map/MapLibreMap.tsx','node_modules/maplibre-gl/dist/maplibre-gl.js','src/components/map/MapListBottomSheet.tsx','src/hooks/useMapListSync.ts']){
 if(!inputs.includes(required))throw Error('Real component missing: '+required);
}
if(inputs.some(p=>p==='src/integrations/supabase/client.ts'))throw Error('Production client bundled');
await writeFile(path.join(output,'bundle-inputs.json'),JSON.stringify(inputs,null,2));
const css=await postcss([postcssImport(),tailwindcss(),autoprefixer()]).process(await readFile('src/index.css','utf8'),{from:path.join(root,'src/index.css')});
const mapCss=await readFile(path.join(output,'fixture.css'),'utf8');
await writeFile(path.join(output,'fixture.css'),css.css+'\n'+mapCss);
await writeFile(path.join(output,'fixture.html'),'<!doctype html><html lang="ru"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>');
if(process.argv.includes('--build-only')){console.log('Map fixture bundle ready:',output);process.exit(0);}
// --prepare-only additionally verifies/downloads the archive without launching a browser.
if(!process.argv.includes('--prepare-only') && (process.env.CI!=='true'||process.env.GITHUB_ACTIONS!=='true'))throw Error('Browser execution is GitHub CI-only; local use is --build-only or --prepare-only');
const manifest=JSON.parse(await readFile('src/assets/map/phuket.pmtiles.asset.json','utf8'));
const archiveUrl=new URL(manifest.url,'https://myuno.app');
if(archiveUrl.origin!=='https://myuno.app'||!archiveUrl.pathname.startsWith('/__l5e/assets-v1/'))throw Error('Archive URL outside static allowlist');
async function staticFetch(url){
 let response=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(60000)});
 if([301,302,307,308].includes(response.status)){
  const next=new URL(response.headers.get('location'),url);const original=new URL(url);
  if(original.hostname!=='myuno.app'||next.origin!=='https://www.myuno.app'||next.pathname!==original.pathname||next.search!==original.search)throw Error('Static asset redirect outside allowlist');
  response=await fetch(next,{redirect:'error',signal:AbortSignal.timeout(60000)});
 }
 if(!response.ok)throw Error(`Static asset ${url}: HTTP ${response.status}`);
 return Buffer.from(await response.arrayBuffer());
}
const archive=await staticFetch(archiveUrl.href);
if(archive.length!==manifest.size || archive.subarray(0,7).toString()!=='PMTiles'||archive[7]!==3)throw Error('Archive size/magic/version validation failed');
const archiveEvidence={url:archiveUrl.href,bytes:archive.length,format:'PMTiles v3',sha256:createHash('sha256').update(archive).digest('hex')};
await writeFile(path.join(output,'basemap-source.json'),JSON.stringify(archiveEvidence,null,2));
await writeFile(path.join(output,'phuket.pmtiles'),archive);
if(process.argv.includes('--prepare-only')){console.log('Real Phuket archive verified:',archiveEvidence);process.exit(0);}
const glyphCache=new Map();
const assetErrors=[];
const assetRequests=[];
await writeFile(path.join(output,'fixture-cover.svg'),'<svg xmlns="http://www.w3.org/2000/svg" width="640" height="320" viewBox="0 0 640 320"><rect width="640" height="320" fill="#dbe8ed"/><path d="M170 230V140L320 60 470 140V230Z" fill="#0a2240"/><rect x="290" y="150" width="60" height="80" fill="#f4f0e8"/><text x="320" y="285" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#0a2240">QA ONLY · SYNTHETIC VILLA IMAGE</text></svg>');
const allowedFiles=new Set(['fixture.html','fixture.css','fixture.js','fixture-cover.svg']);
const server=createServer(async(req,res)=>{
 res.on('finish',()=>assetRequests.push({path:req.url,method:req.method,status:res.statusCode,range:req.headers.range??null}));
 try{
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(pathname==='/favicon.ico'){res.writeHead(204).end();return;}
  if(pathname==='/phuket.pmtiles'){
   res.setHeader('Content-Type','application/octet-stream');res.setHeader('Accept-Ranges','bytes');
   if(req.headers.range){
    const match=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range);
    const start=match?Number(match[1]):-1;const end=match&&match[2]?Math.min(Number(match[2]),archive.length-1):archive.length-1;
    if(start<0||start>=archive.length||end<start){res.writeHead(416,{'Content-Range':`bytes */${archive.length}`}).end();return;}
    res.writeHead(206,{'Content-Range':`bytes ${start}-${end}/${archive.length}`,'Content-Length':end-start+1});res.end(archive.subarray(start,end+1));return;
   }
   res.writeHead(200,{'Content-Length':archive.length});res.end(archive);return;
  }
  const glyph=/^\/fonts\/Noto%20Sans%20Regular\/(\d+)-(\d+)\.pbf$/.exec(pathname);
  if(glyph){
   const start=Number(glyph[1]),end=Number(glyph[2]);
   if(start%256!==0||end!==start+255||end>65535)throw Error('Glyph range outside allowlist');
   const key=`${start}-${end}`;
   if(!glyphCache.has(key))glyphCache.set(key,staticFetch('https://tiles.openfreemap.org/fonts/Noto%20Sans%20Regular/'+key+'.pbf'));
   const bytes=await glyphCache.get(key);
   if(bytes.length===0||bytes.length>2000000)throw Error('Invalid glyph payload size');
   await writeFile(path.join(output,`glyph-${key}.pbf`),bytes);
   res.writeHead(200,{'Content-Type':'application/x-protobuf'});res.end(bytes);return;
  }
  const file=pathname.slice(1)||'fixture.html';
  if(!allowedFiles.has(file)){res.writeHead(404).end();return;}
  res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.svg')?'image/svg+xml':'text/html');res.end(await readFile(path.join(output,file)));
 }catch(error){assetErrors.push(String(error));res.writeHead(502).end('Static asset preparation failed');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}`;
const results=[];
let browser;
try{
 browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
  const context=await browser.newContext({viewport});const page=await context.newPage();const errors=[];const denied=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  await context.route('**/*',route=>{const url=route.request().url();if(url.startsWith(origin+'/'))return route.continue();denied.push(url);return route.abort();});
  const screenshot=async(name)=>page.screenshot({path:path.join(output,`${viewport.width}-${name}.png`),fullPage:true});
  try{
   await page.goto(origin+'/fixture.html');
   await expect(page.getByRole('heading',{name:'Найдите своё место на Пхукете'})).toBeVisible();
   await page.waitForFunction(()=>window.fixtureMap?.loaded(),null,{timeout:60000});
   await expect(page.locator('.maplibregl-canvas')).toBeVisible();
   await expect(page.locator('[data-marker-id]')).toHaveCount(10);
   if(!await page.evaluate(()=>window.fixtureMap.getCanvas().width>0 && Boolean(window.fixtureMap.getCanvas().getContext('webgl2')||window.fixtureMap.getCanvas().getContext('webgl'))))throw Error('No WebGL drawing context');
   await page.waitForFunction(()=>window.fixtureMap.queryRenderedFeatures({layers:['roads']}).length>0 && window.fixtureMap.queryRenderedFeatures({layers:['place-labels']}).length>0,null,{timeout:60000});
   const geography=await page.evaluate(()=>({roads:window.fixtureMap.queryRenderedFeatures({layers:['roads']}).length,labels:window.fixtureMap.queryRenderedFeatures({layers:['place-labels']}).length}));
   await screenshot('map');
   await page.getByRole('button',{name:'Услуги',exact:true}).click();
   await expect(page.locator('[data-marker-id]')).toHaveCount(4);
   await expect(page.getByTestId('location')).toHaveText('/map?layers=service');
   await screenshot('services');
   await page.getByRole('button',{name:'Тестовый фитнес',exact:true}).click();
   await page.getByRole('button',{name:/Открыть предложение/}).click();
   await expect(page.getByTestId('location')).toContainText('/fitness/gym/premise-1');
   await page.goto(origin+'/fixture.html');
   await page.waitForFunction(()=>window.fixtureMap?.loaded(),null,{timeout:60000});
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);if(overflow)throw Error('Horizontal page overflow');
   await page.getByRole('button',{name:'Посуточная аренда',exact:true}).click();
   await expect(page.locator('[data-marker-id]')).toHaveCount(1);
   await expect(page.getByTestId('location')).toHaveText('/map?layers=stay');
   await page.getByRole('button',{name:'Впечатления',exact:true}).click();
   await expect(page.locator('[data-marker-id]')).toHaveCount(2);
   await expect(page.getByTestId('location')).toContainText('layers=stay%2Cexperience');
   await page.getByRole('button',{name:'Все',exact:true}).click();
   await expect(page.locator('[data-marker-id]')).toHaveCount(10);
   await page.getByRole('button',{name:'Тестовая вилла',exact:true}).click();
   await expect(page.getByRole('button',{name:/Открыть предложение/})).toBeVisible();
   await page.waitForFunction(()=>{const image=document.querySelector('img[src="/fixture-cover.svg"]');return image?.complete&&image.naturalWidth>0;});
   await page.getByRole('button',{name:/Открыть предложение/}).scrollIntoViewIfNeeded();
   await expect(page.getByText('Открыть предложение →',{exact:true})).toBeInViewport({ratio:0.9});
   await screenshot('selected');
   await page.getByRole('button',{name:/Открыть предложение/}).click();
   await expect(page.getByTestId('location')).toContainText('/property/s1');
   await page.goto(origin+'/fixture.html');
   await page.waitForFunction(()=>window.fixtureMap?.loaded(),null,{timeout:60000});
   await page.getByRole('button',{name:'Показать списком',exact:true}).click();
   await expect(page.getByRole('listbox',{name:'Список локаций'}).filter({visible:true})).toBeVisible();
   const firstOffer=page.getByRole('option',{name:/Тестовая вилла/}).filter({visible:true});
   await expect(firstOffer).toBeInViewport({ratio:0.9});
   await screenshot('list');
   await firstOffer.click();
   await expect(page.getByRole('button',{name:/Открыть предложение/})).toBeVisible();
   const mapErrors=await page.evaluate(()=>window.fixtureMapErrors);
   if(errors.length||denied.length||mapErrors.length||assetErrors.length)throw Error(JSON.stringify({errors,denied,mapErrors,assetErrors}));
   results.push({head,viewport,outcome:'PASS',renderer:'real MapLibre WebGL',data:'synthetic offers; real public Phuket PMTiles and production map style; NOT live offer/backend acceptance',basemap:archiveEvidence,geography,glyphRanges:[...glyphCache.keys()],shell:'AppLayout replaced with labelled QA header; full navigation shell NOT tested',screenshots:['map','services','selected','list'].map(name=>`${viewport.width}-${name}.png`)});
  }catch(error){await screenshot('failure');throw error;}finally{await context.close();}
 }
}finally{await writeFile(path.join(output,'asset-requests.json'),JSON.stringify({requests:assetRequests,errors:assetErrors},null,2));await writeFile(path.join(output,'results.json'),JSON.stringify(results,null,2));await browser?.close();await new Promise(resolve=>server.close(resolve));}
console.log(JSON.stringify(results,null,2));
