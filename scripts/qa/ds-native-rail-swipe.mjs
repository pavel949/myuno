// Actual shared component + actual application CSS; synthetic links only.
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
const root=process.cwd(),base='14900ed0df32841875ff62576cbb197687e95d86';
const output=process.env.RAIL_SWIPE_OUTPUT || '/workspace/artifacts/myuno-ds-platform-audit-20261025/native-rail-swipe';
await mkdir(output,{recursive:true});
const component='src/components/shared/UnifiedScrollSection.tsx';
const before=execFileSync('git',['show',`${base}:${component}`],{cwd:root,encoding:'utf8'}),after=await readFile(component,'utf8');
const sourceHashes={base,component,before:createHash('sha256').update(before).digest('hex'),after:createHash('sha256').update(after).digest('hex')};
for(const [version,source] of [['before',before],['after',after]]){
 const entry=`import React from'react';import{createRoot}from'react-dom/client';import{UnifiedScrollSection}from'actual-rail';window.fixtureActivations=[];createRoot(document.getElementById('root')).render(<main><header className="p-4"><h1>Native rail gesture fixture</h1><p>Synthetic content; actual shared rail and application styles.</p></header><UnifiedScrollSection>{Array.from({length:8},(_,i)=><a key={i} className="block w-48 shrink-0 border border-border bg-card p-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring" href={'#synthetic-'+i} onClick={()=>window.fixtureActivations.push(i)}><h2 className="font-display text-h3">Service {i+1}</h2><p className="mt-3">Synthetic request destination</p></a>)}</UnifiedScrollSection><div style={{height:1800}} className="p-4">Vertical page scroll area</div></main>);`;
 await build({stdin:{contents:entry,loader:'tsx',resolveDir:root},bundle:true,format:'esm',jsx:'automatic',alias:{'@':root+'/src'},outfile:output+'/'+version+'.js',plugins:[{name:'actual-component-version',setup(b){b.onResolve({filter:/^actual-rail$/},()=>({path:'rail',namespace:'source'}));b.onLoad({filter:/.*/,namespace:'source'},()=>({contents:source,loader:'tsx',resolveDir:root+'/src/components/shared'}));}}]});
 await writeFile(output+'/'+version+'.html',`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="fixture.css"></head><body><div id="root"></div><script type="module" src="${version}.js"></script></body></html>`);
}
const css=await postcss([postcssImport(),tailwindcss(root+'/tailwind.config.ts'),autoprefixer()]).process(await readFile('src/index.css','utf8'),{from:root+'/src/index.css'});
await writeFile(output+'/fixture.css',css.css);
const server=createServer(async(req,res)=>{try{const name=new URL(req.url,'http://localhost').pathname.slice(1);if(!['before.html','after.html','before.js','after.js','fixture.css'].includes(name)){res.writeHead(404).end();return;}res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':'text/html');res.end(await readFile(output+'/'+name));}catch{res.writeHead(500).end();}});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});const evidence=[];
async function drag(page,context,start,end){const cdp=await context.newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:start[0],y:start[1]}]});for(let i=1;i<=15;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:start[0]+(end[0]-start[0])*i/15,y:start[1]+(end[1]-start[1])*i/15}]});await page.waitForTimeout(20);}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(200);await cdp.detach();}
try{
 for(const version of ['before','after']){
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const page=await context.newPage();await page.route('**/*',r=>r.request().url().startsWith(origin+'/')?r.continue():r.abort());await page.goto(origin+'/'+version+'.html');const rail=page.locator('section > div.overflow-x-auto');const rect=await rail.boundingBox();const y=rect.y+rect.height/2;
  await drag(page,context,[340,y],[65,y]);const horizontal=await rail.evaluate(el=>({scrollLeft:el.scrollLeft,scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,touchAction:getComputedStyle(el).touchAction}));
  await page.screenshot({path:output+'/'+version+'-horizontal-390.png'});
  await drag(page,context,[180,y+30],[180,20]);const vertical=await page.evaluate(()=>scrollY);await page.screenshot({path:output+'/'+version+'-vertical-390.png'});
  if(version==='before'&&horizontal.scrollLeft!==0)throw Error('Baseline no longer reproduces restrictive touch action');if(version==='after'&&horizontal.scrollLeft<=0)throw Error('Horizontal swipe did not scroll');if(vertical<=0)throw Error('Vertical page scroll blocked');evidence.push({version,viewport:390,horizontal,verticalScrollY:vertical});await context.close();
 }
 const context=await browser.newContext({viewport:{width:1280,height:900}});const page=await context.newPage();await page.route('**/*',r=>r.request().url().startsWith(origin+'/')?r.continue():r.abort());await page.goto(origin+'/after.html');const rail=page.locator('section > div.overflow-x-auto');await rail.hover();await page.mouse.wheel(450,0);await page.waitForTimeout(150);const desktopScroll=await rail.evaluate(el=>el.scrollLeft);if(desktopScroll<=0)throw Error('Desktop horizontal wheel failed');await page.keyboard.press('Tab');await page.keyboard.press('Enter');if(await page.evaluate(()=>window.fixtureActivations.length)!==1)throw Error('Native link keyboard activation failed');await page.screenshot({path:output+'/after-desktop-1280.png'});evidence.push({version:'after',viewport:1280,desktopScroll,nativeLinkKeyboardActivation:true});await context.close();
 await writeFile(output+'/evidence.json',JSON.stringify({sourceHashes,boundaries:'Actual component source and application CSS; synthetic children; external requests denied; Chromium CDP touch emulation, not physical-device acceptance.',results:evidence},null,2));console.log(JSON.stringify(evidence));
}finally{await browser.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
