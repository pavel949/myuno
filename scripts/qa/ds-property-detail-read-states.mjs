// Actual PropertyDetail and app CSS, with data/section adapters from existing intent tests.
import { build } from 'esbuild';
import postcss from 'postcss';
import postcssImport from 'postcss-import';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { execFileSync } from 'node:child_process';
const root=process.cwd(),base='f26a1c948d95edf11e8ac853b56bf0cbe7e7ffde';
const reviewBefore=process.argv.includes('--review-before');
const sourceRef=reviewBefore?'e320f33d945972a98a969adc2eccb43af7c221b4':base;
const version=reviewBefore?'before-content':process.argv.includes('--before')?'before':'after';
const output=(process.env.PROPERTY_READ_OUTPUT||'/workspace/artifacts/myuno-ds-platform-audit-20261025/property-detail-read-states')+'/'+version;
await mkdir(output,{recursive:true});
const component='src/pages/property/PropertyDetail.tsx',adapters='src/pages/property/__tests__/PropertyDetailIntent.test.tsx';
const source=version!=='after'?execFileSync('git',['show',`${sourceRef}:${component}`],{encoding:'utf8'}):await readFile(component,'utf8');
const tests=await readFile(adapters,'utf8');
const propertyState=tests.match(/const state = vi\.hoisted\(\(\) => (.+)\);/)[1];
const mocks={};
for(const match of tests.matchAll(/^vi\.mock\('([^']+)', \(\) => (.+)\);$/gm)){
 const factory=match[2];const names=[...new Set([...factory.matchAll(/(?:^|[,{]\s*)([A-Za-z]\w*)\s*:/g)].map(m=>m[1]))];
 mocks[match[1]]=`import React from'react';const vi={fn:()=>()=>{}};const state=${propertyState};const module=${factory};${names.map(name=>`export const ${name}=module.${name};`).join('')}`;
}
mocks['@/contexts/LanguageContext']=`export const useLanguage=()=>({language:new URLSearchParams(location.search).get('lang')||'en'});`;
mocks['@/hooks/useProperties']=`import{useState}from'react';const state=${propertyState};export const usePropertyWithRentalTerms=(id)=>{const params=new URLSearchParams(location.search);const[retry,setRetry]=useState(false);const[done,setDone]=useState(false);const[failure,setFailure]=useState(false);window.fixtureFailRead=()=>setFailure(true);const requested=params.get('state')||'error';const scenario=done?'success':failure?'background-error':requested==='background-transition'?'success':requested;const data=['success','stale-error','background-error'].includes(scenario)?{...state.property,id}:scenario==='missing'?null:undefined;return{data,isLoading:retry||scenario==='loading',isFetching:retry||scenario==='loading',isError:(scenario==='background-error'||!retry)&&['error','stale-error','background-error'].includes(scenario),refetch:()=>{window.fixtureRetries++;setRetry(true);setTimeout(()=>{setDone(true);setRetry(false)},300);return Promise.resolve()}}};`;
mocks['@/components/property']=mocks['@/components/property'].replace('export const PropertyBookingCard=module.PropertyBookingCard;', `export const PropertyBookingCard=({initialGuestContext})=>{const[draft,setDraft]=React.useState('');return <><label>Synthetic inquiry draft<input aria-label="Synthetic inquiry draft" value={draft} onChange={e=>setDraft(e.target.value)}/></label><button data-guests={initialGuestContext.guests}>Book rental</button></>};`);

mocks['@/integrations/supabase/client']=`export const supabase=new Proxy({},{get(){throw Error('Real database forbidden in property read fixture')}});`;
const entry=`import React from'react';import{createRoot}from'react-dom/client';import{MemoryRouter,Routes,Route,useLocation}from'react-router-dom';import{QueryClient,QueryClientProvider}from'@tanstack/react-query';import Page from'actual-page';import{ECOSYSTEM_PAGE_CONTAINER}from'${root}/src/design-system/ecosystemLayout';import{CompareProvider}from'${root}/src/components/property/PropertyCompare';window.fixtureRetries=0;function Boundary(){const l=useLocation();return<output hidden data-testid="fixture-location">{l.pathname+l.search}</output>}createRoot(document.getElementById('root')).render(<QueryClientProvider client={new QueryClient()}><MemoryRouter initialEntries={['/property/unit?mode=rent&guests=3&checkIn=2099-12-01&checkOut=2099-12-04']} future={{v7_startTransition:true,v7_relativeSplatPath:true}}><CompareProvider><main className="min-h-screen flex flex-col"><header className="border-b border-border p-4">Synthetic PropertyHub shell boundary — real AppLayout frame token, synthetic chrome</header><div className={ECOSYSTEM_PAGE_CONTAINER} data-testid="parent-frame"><Routes><Route path="/property/:id" element={<Page/>}/><Route path="/property" element={<h1>Existing property destination</h1>}/></Routes></div><footer className="mt-6 border-t border-border p-4">Synthetic parent footer</footer></main><Boundary/></CompareProvider></MemoryRouter></QueryClientProvider>);`;
const result=await build({stdin:{contents:entry,loader:'tsx',resolveDir:root},bundle:true,format:'esm',jsx:'automatic',alias:{'@':root+'/src'},outfile:output+'/fixture.js',metafile:true,plugins:[{name:'existing-test-adapters',setup(b){b.onResolve({filter:/^actual-page$/},()=>({path:'page',namespace:'actual'}));b.onLoad({filter:/.*/,namespace:'actual'},()=>({contents:source,loader:'tsx',resolveDir:root+'/src/pages/property'}));b.onResolve({filter:/.*/},a=>a.path in mocks?{path:a.path,namespace:'fixture'}:undefined);b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:mocks[a.path],loader:'tsx',resolveDir:root}));b.onLoad({filter:/\.css$/},()=>({contents:'',loader:'css'}));}}]});
if(Object.keys(result.metafile.inputs).some(p=>!p.startsWith('fixture:')&&/integrations\/supabase\/client|hooks\/useProperties\.ts$/.test(p)))throw Error('Production data module included');
const css=await postcss([postcssImport(),tailwindcss(root+'/tailwind.config.ts'),autoprefixer()]).process(await readFile('src/index.css','utf8'),{from:root+'/src/index.css'});
await writeFile(output+'/fixture.css',css.css+'\n'+await readFile('src/styles/public-commerce.css','utf8'));
await writeFile(output+'/fixture.html','<!doctype html><html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="fixture.css"><div id="root"></div><script type="module" src="fixture.js"></script></html>');
const server=createServer(async(req,res)=>{try{const file=new URL(req.url,'http://localhost').pathname.slice(1);if(!['fixture.html','fixture.js','fixture.css'].includes(file)){res.writeHead(404).end();return}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(await readFile(output+'/'+file));}catch{res.writeHead(500).end();}});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});const evidence=[];
try{
 for(const [lang,width]of[['en',390],['ru',390],['th',390],['en',1280]])for(const state of['loading','error','missing','success']){
  const page=await browser.newPage({viewport:{width,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>r.request().url().startsWith(origin+'/')?r.continue():r.abort());await page.goto(`${origin}/fixture.html?lang=${lang}&state=${state}`);await page.waitForTimeout(100);await page.screenshot({path:`${output}/${lang}-${width}-${state}.png`,fullPage:true});
  const result={lang,width,state,errors,statuses:await page.getByRole('status').allTextContents(),alerts:await page.getByRole('alert').allTextContents(),headings:await page.getByRole('heading').allTextContents(),overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),frameHeight:await page.getByTestId('parent-frame').evaluate(el=>el.getBoundingClientRect().height),documentHeight:await page.evaluate(()=>document.documentElement.scrollHeight)};
  if(errors.length)throw Error(JSON.stringify(result));
  if(result.overflow)throw Error('Read state overflows its viewport');
  if(version==='after'){
   if(state!=='success'&&result.frameHeight>=900)throw Error('Read state owns an extra viewport inside parent frame');
   const labels={en:{loading:'Loading property…',error:'Property could not be loaded',missing:'Property not found'},ru:{loading:'Загрузка объекта…',error:'Не удалось загрузить объект',missing:'Объект не найден'},th:{loading:'กำลังโหลดที่พัก…',error:'ไม่สามารถโหลดที่พักได้',missing:'ไม่พบที่พัก'}}[lang];
   if(state==='loading'&&await page.getByRole('status',{name:labels.loading}).count()!==1)throw Error('Localized loading status missing');
   if(state==='error'&&await page.getByRole('alert',{name:labels.error}).count()!==1)throw Error('Read error alert missing');
   if(state==='missing'&&(await page.getByRole('heading',{name:labels.missing,exact:true}).count()!==1||result.alerts.length))throw Error('Successful null not distinct from failure');
  }
  if(version==='after'&&state==='error'){
   const retry=page.getByRole('button',{name:lang==='ru'?'Повторить':lang==='th'?'ลองอีกครั้ง':'Try again'});await retry.focus();await page.keyboard.press('Enter');await page.getByRole('heading',{name:lang==='ru'?'Квартира':'Dual home',exact:true}).waitFor();result.keyboardRetrySuccess=await page.evaluate(()=>window.fixtureRetries===1);result.urlContext=await page.getByTestId('fixture-location').textContent();
  }
  evidence.push(result);await page.close();
 }
 if(version!=='before'){
  const page=await browser.newPage({viewport:{width:1280,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>r.request().url().startsWith(origin+'/')?r.continue():r.abort());await page.goto(`${origin}/fixture.html?lang=en&state=background-transition`);
  const draft=page.getByRole('textbox',{name:'Synthetic inquiry draft'});await draft.fill('Keep my inquiry notes');await page.evaluate(()=>window.fixtureFailRead());
  const retained=await draft.count()===1&&await draft.inputValue()==='Keep my inquiry notes';await page.screenshot({path:output+'/en-1280-background-error.png',fullPage:true});
  const result={state:'background-transition',lang:'en',width:1280,errors,draftRetainedAfterFailure:retained};
  if(version==='after'){
   if(!retained)throw Error('Background failure discarded the child draft');
   const retry=page.getByRole('button',{name:'Try again'});await retry.focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>window.fixtureRetries===1);await page.waitForTimeout(350);
   if(await draft.inputValue()!=='Keep my inquiry notes')throw Error('Retry discarded the child draft');
   result.draftRetainedAfterRetry=true;result.urlContext=await page.getByTestId('fixture-location').textContent();await page.screenshot({path:output+'/en-1280-background-recovered.png',fullPage:true});
  }
  if(errors.length)throw Error(JSON.stringify(errors));evidence.push(result);await page.close();
 }
 await writeFile(output+'/evidence.json',JSON.stringify({version,base,sourceRef,parentBoundary:'Isolated synthetic shell chrome; exact ECOSYSTEM_PAGE_CONTAINER imported from actual AppLayout contract. Full PropertyHub/AppLayout/NavShell not rendered.',parentSourceRefs:['src/pages/property/PropertyHub.tsx:338','src/components/layout/AppLayout.tsx:110','src/design-system/ecosystemLayout.ts:8'],component,sourceSha256:createHash('sha256').update(source).digest('hex'),adapters,adaptersSha256:createHash('sha256').update(tests).digest('hex'),boundary:'Actual page, actual read-state primitives, actual parent frame token and app CSS; synthetic shell chrome (not full PropertyHub/AppLayout); other section/data adapters from existing intent tests; external requests denied; not production or booking acceptance.',results:evidence},null,2));console.log(JSON.stringify({version,cases:evidence.length,pageErrors:evidence.flatMap(e=>e.errors),overflows:evidence.filter(e=>e.overflow).length}));
}finally{await browser.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
