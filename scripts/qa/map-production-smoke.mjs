// Read-only diagnostic of the actual deployed Vite app, NOT the isolated esbuild fixture.
// Run only in GitHub CI with fresh guest contexts. No form submission or mutating requests.
import { chromium, firefox, webkit, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
if(process.env.CI!=='true'||process.env.GITHUB_ACTIONS!=='true')throw Error('Production browser diagnostics run in GitHub CI only');
const target=new URL(process.env.MAP_PRODUCTION_URL||'https://www.myuno.app/map');
if(!['https://myuno.app','https://www.myuno.app'].includes(target.origin)||target.pathname!=='/map')throw Error('Only public MyUno /map is allowed');
const output=process.env.MAP_PRODUCTION_OUTPUT||'/tmp/browser/map-production';await mkdir(output,{recursive:true});
const revision=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const engines=(process.env.MAP_BROWSER_ENGINES||'chromium,firefox').split(',');
const results=[];
const safeUrl=value=>{try{const url=new URL(value);return url.origin+url.pathname;}catch{return String(value).slice(0,150);}};
for(const engineName of engines){
 const engine={chromium,firefox,webkit}[engineName];if(!engine)throw Error('Unknown browser '+engineName);
 let browser;
 try{
  // No forced SwiftShader flags: record what the CI browser really supports.
  browser=await engine.launch();
  for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
   const row={revision,engine:engineName,browserVersion:browser.version(),viewport,target:target.href,outcome:'FAIL',scope:'Actual public deployed Vite bundle, fresh guest, read-only; viewport emulation is NOT a physical phone',console:[],pageErrors:[],requestFailures:[],blockedWrites:[],workerErrors:[]};
   const context=await browser.newContext({viewport,serviceWorkers:'block'});
   const page=await context.newPage();
   page.on('console',message=>{if(['error','warning'].includes(message.type()))row.console.push({type:message.type(),text:message.text().slice(0,2000)});});
   page.on('pageerror',error=>row.pageErrors.push({message:error.message,stack:error.stack?.slice(0,4000)}));
   page.on('requestfailed',request=>row.requestFailures.push({url:safeUrl(request.url()),error:request.failure()?.errorText}));
   await context.route('**/*',route=>{
    if(!['GET','HEAD','OPTIONS'].includes(route.request().method())){row.blockedWrites.push({method:route.request().method(),url:safeUrl(route.request().url())});return route.abort();}
    return route.continue();
   });
   await page.addInitScript(()=>{
    window.__mapDiagnostics={contexts:[],workerErrors:[]};
    const original=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(type,...args){
     try{
      const context=original.call(this,type,...args);
      if(['webgl','webgl2','experimental-webgl'].includes(type))window.__mapDiagnostics.contexts.push({type,ok:!!context,width:this.width,height:this.height,mapCanvas:this.classList.contains('maplibregl-canvas')});
      return context;
     }catch(error){window.__mapDiagnostics.contexts.push({type,error:String(error)});throw error;}
    };
    const OriginalWorker=window.Worker;
    window.Worker=class extends OriginalWorker{constructor(...args){super(...args);this.addEventListener('error',event=>window.__mapDiagnostics.workerErrors.push({message:event.message,filename:event.filename?.split('?')[0]}));}};
   });
   try{
    await page.goto(target.href,{waitUntil:'domcontentloaded',timeout:60000});
    await expect(page.locator('.maplibregl-canvas').first()).toBeVisible({timeout:60000});
    await expect(page.locator('.maplibregl-ctrl-zoom-in')).toBeVisible({timeout:30000});
    await expect(page.locator('[data-marker-id]').first()).toBeVisible({timeout:30000});
    await expect(page.getByText(/^(Карта онлайн|Online map)$/)).toBeVisible({timeout:30000});
    row.outcome='PASS';
   }catch(error){row.failure=String(error).slice(0,3000);}
   try{
    row.diagnostics=await page.evaluate(()=>({
     ...window.__mapDiagnostics,canvasCount:document.querySelectorAll('.maplibregl-canvas').length,
     markerCount:document.querySelectorAll('[data-marker-id]').length,
     controls:document.querySelectorAll('.maplibregl-ctrl-zoom-in').length,
     status:[...document.querySelectorAll('[role="status"]')].map(node=>node.textContent),
     scripts:[...document.scripts].filter(script=>script.src).map(script=>new URL(script.src).pathname),
     resources:performance.getEntriesByType('resource').filter(entry=>/\.js(?:\?|$)/.test(entry.name)).map(entry=>new URL(entry.name).pathname),
     userAgent:navigator.userAgent,
    }));
    row.classification=row.diagnostics.contexts.some(entry=>entry.mapCanvas)&&!row.diagnostics.contexts.some(entry=>entry.mapCanvas&&entry.ok)?'WebGL context unavailable':row.diagnostics.workerErrors.length?'Worker error':row.diagnostics.controls===0?'Constructor did not complete; inspect diagnostics':'Map initialized; inspect loading/network errors if failed';
    row.version=await page.evaluate(async()=>{try{const response=await fetch('/version.json',{cache:'no-store'});return response.ok?await response.json():{status:response.status};}catch(error){return {error:String(error)};}});
    await page.screenshot({path:path.join(output,`${engineName}-${viewport.width}.png`),fullPage:true,animations:'disabled'});
   }catch(error){row.evidenceError=String(error);row.outcome='FAIL';}
   results.push(row);await writeFile(path.join(output,'results.json'),JSON.stringify(results,null,2));await context.close();
  }
 }catch(error){results.push({revision,engine:engineName,outcome:'FAIL',launchError:String(error)});}
 finally{await browser?.close();await writeFile(path.join(output,'results.json'),JSON.stringify(results,null,2));}
}
console.log(JSON.stringify(results.map(({engine,viewport,outcome,classification,failure,launchError})=>({engine,viewport,outcome,classification,failure,launchError})),null,2));
if(results.length!==engines.length*2||results.some(row=>row.outcome!=='PASS'))process.exitCode=1;
