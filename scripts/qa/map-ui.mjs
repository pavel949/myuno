// Real MapView + real MapLibre/WebGL. Synthetic offers/geography only; no production requests.
import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { createServer } from 'node:http';
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
  { id:'s1',routeId:'s1',href:'/property/s1',layer:'stay',name:'Synthetic villa',nameRu:'Тестовая вилла',lat:7.98,lng:98.31,rating:0,priceFrom:2000,pricePeriod:'night',district:'Rawai',bedrooms:3,propertyType:'villa' },
  { id:'r1',routeId:'r1',href:'/property/r1',layer:'rent',name:'Synthetic rental',nameRu:'Тестовая аренда',lat:8.01,lng:98.34,rating:0,priceFrom:45000,pricePeriod:'month',district:'Rawai' },
  { id:'b1',routeId:'b1',href:'/property/b1',layer:'sale',name:'Synthetic sale',nameRu:'Тестовая продажа',lat:7.95,lng:98.33,rating:0,priceFrom:6000000 },
  { id:'n1',routeId:'n1',href:'/real-estate/newbuilds/n1',layer:'newbuild',name:'Synthetic project',nameRu:'Тестовый проект',lat:8.04,lng:98.32,rating:0,priceFrom:null },
  { id:'e1',routeId:'e1',href:'/experiences/e1',layer:'experience',name:'Synthetic park',nameRu:'Тестовый парк',lat:8,lng:98.29,rating:0,priceFrom:1000,category:'adventure',locationKind:'meeting_point' },
];
for(const offer of offers){offer.currency='THB';offer.approximate=false;}
const restaurants=[{id:'food1',name_en:'Synthetic restaurant',name_ru:'Тестовый ресторан',lat:7.96,lng:98.28,rating:0}];
const virtual = {
 '@/contexts/LanguageContext': `export const useLanguage=()=>({language:'ru'});`,
 '@/contexts/CurrencyContext': `export const useCurrency=()=>({formatPrice:n=>'฿'+n});`,
 '@/contexts/LocationContext': `const getCityConfig=()=>({lat:7.98,lng:98.31});export const useLocation=()=>({getCityConfig});`,
 '@/integrations/supabase/client': `export const supabase=new Proxy({}, {get(){throw Error('Production data access forbidden in map fixture')}});`,
 '@tanstack/react-query': `const data=[];export const useQuery=()=>({data,isLoading:false});`,
 '@/hooks/useProperties': `const data=[];export const usePropertiesForMap=()=>({data,isLoading:false});export const transformPropertiesToMarkers=()=>data;`,
 '@/hooks/useRestaurants': `const restaurants=${JSON.stringify(restaurants)};export const useRestaurants=()=>({restaurants,isLoading:false});`,
 '@/hooks/useExploreLayers': `const data=${JSON.stringify(offers)};const layerErrors=[];export const useExploreLayers=()=>({data,isLoading:false,layerErrors});`,
 '@/hooks/useExperiences': `export const EXPERIENCE_CATEGORIES=[];`,
 '@/components/layout/AppLayout': `import React from'react';export const AppLayout=({children})=><main data-canvas="consumer"><header style={{height:56,padding:'8px 16px',background:'#0A2240',color:'white',fontSize:12}}>MyUno · QA ONLY · Синтетические предложения и география</header>{children}</main>;`,
 '@/components/map/PoiClaimSheet': `export const PoiClaimSheet=()=>null;`,
 // Only substitute the style, never the map renderer, controls, markers, or handlers.
 'maplibre-gl': `import real from '${root}/node_modules/maplibre-gl/dist/maplibre-gl.js';
 const fixtureStyle={version:8,sources:{fixture:{type:'geojson',data:{type:'FeatureCollection',features:[{type:'Feature',properties:{},geometry:{type:'Polygon',coordinates:[[[98.25,7.91],[98.38,7.91],[98.38,8.08],[98.25,8.08],[98.25,7.91]]]}}]}}},layers:[{id:'water',type:'background',paint:{'background-color':'#c9d7e4'}},{id:'synthetic-land',type:'fill',source:'fixture',paint:{'fill-color':'#e4e8d8'}}]};
 class FixtureMap extends real.Map{constructor(options){super({...options,style:fixtureStyle});window.fixtureMap=this;}}
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
if(process.env.CI!=='true'||process.env.GITHUB_ACTIONS!=='true')throw Error('Browser execution is GitHub CI-only; local use is --build-only');
const allowedFiles=new Set(['fixture.html','fixture.css','fixture.js']);
const server=createServer(async(req,res)=>{const file=new URL(req.url,'http://localhost').pathname.slice(1)||'fixture.html';if(!allowedFiles.has(file)){res.writeHead(404).end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(await readFile(path.join(output,file)));});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}`;
const results=[];
let browser;
try{
 browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
  const context=await browser.newContext({viewport});const page=await context.newPage();const errors=[];const denied=[];
  page.on('pageerror',error=>errors.push(error.message));
  await context.route('**/*',route=>{const url=route.request().url();if(url.startsWith(origin+'/'))return route.continue();denied.push(url);return route.abort();});
  const screenshot=async(name)=>page.screenshot({path:path.join(output,`${viewport.width}-${name}.png`),fullPage:true});
  try{
   await page.goto(origin+'/fixture.html');
   await expect(page.getByRole('heading',{name:'Найдите своё место на Пхукете'})).toBeVisible();
   await page.waitForFunction(()=>window.fixtureMap?.loaded());
   await expect(page.locator('.maplibregl-canvas')).toBeVisible();
   await expect(page.locator('[data-marker-id]')).toHaveCount(6);
   if(!await page.evaluate(()=>window.fixtureMap.getCanvas().width>0 && Boolean(window.fixtureMap.getCanvas().getContext('webgl2')||window.fixtureMap.getCanvas().getContext('webgl'))))throw Error('No WebGL drawing context');
   await screenshot('map');
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);if(overflow)throw Error('Horizontal page overflow');
   await page.getByRole('button',{name:'Посуточная аренда',exact:true}).click();
   await expect(page.locator('[data-marker-id]')).toHaveCount(1);
   await expect(page.getByTestId('location')).toHaveText('/map?layers=stay');
   await page.getByRole('button',{name:'Впечатления',exact:true}).click();
   await expect(page.locator('[data-marker-id]')).toHaveCount(2);
   await expect(page.getByTestId('location')).toContainText('layers=stay%2Cexperience');
   await page.getByRole('button',{name:'Все',exact:true}).click();
   await expect(page.locator('[data-marker-id]')).toHaveCount(6);
   await page.getByRole('button',{name:'Тестовая вилла',exact:true}).click();
   await expect(page.getByRole('button',{name:/Открыть предложение/})).toBeVisible();
   await screenshot('selected');
   await page.getByRole('button',{name:/Открыть предложение/}).click();
   await expect(page.getByTestId('location')).toContainText('/property/s1');
   await page.getByRole('button',{name:'Close',exact:true}).click();
   await page.getByRole('button',{name:'Показать списком',exact:true}).click();
   await expect(page.getByRole('listbox',{name:'Список локаций'}).filter({visible:true})).toBeVisible();
   await screenshot('list');
   if(errors.length||denied.length)throw Error(JSON.stringify({errors,denied}));
   results.push({head,viewport,outcome:'PASS',renderer:'real MapLibre WebGL',data:'synthetic offers and polygon; NOT live Phuket/basemap acceptance',shell:'AppLayout replaced with labelled QA header; full navigation shell NOT tested',screenshots:['map','selected','list'].map(name=>`${viewport.width}-${name}.png`)});
  }catch(error){await screenshot('failure');throw error;}finally{await context.close();}
 }
}finally{await writeFile(path.join(output,'results.json'),JSON.stringify(results,null,2));await browser?.close();await new Promise(resolve=>server.close(resolve));}
console.log(JSON.stringify(results,null,2));
