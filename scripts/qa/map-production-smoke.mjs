// Read-only diagnostic of the actual deployed Vite app, NOT the isolated esbuild fixture.
// Run only in GitHub CI with fresh guest contexts. No form submission or mutating requests.
import { chromium, firefox, webkit, expect } from '@playwright/test';
import { mkdir, writeFile, readFile, stat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
if(process.env.CI!=='true'||process.env.GITHUB_ACTIONS!=='true')throw Error('Production browser diagnostics run in GitHub CI only');
const localDist=process.argv.includes('--local-dist');
const target=new URL(process.env.MAP_PRODUCTION_URL||(localDist?'http://127.0.0.1:4173/map':'https://www.myuno.app/map'));
const allowedOrigins=localDist?['http://127.0.0.1:4173']:['https://myuno.app','https://www.myuno.app'];
if(!allowedOrigins.includes(target.origin)||target.pathname!=='/map')throw Error('Only public MyUno /map or explicit local dist /map is allowed');
const output=process.env.MAP_PRODUCTION_OUTPUT||'/tmp/browser/map-production';await mkdir(output,{recursive:true});
let server;
if(localDist){
 const dist=path.resolve('dist');
 const manifest=JSON.parse(await readFile('src/assets/map/phuket.pmtiles.asset.json','utf8'));
 const archiveResponse=await fetch(new URL(manifest.url,'https://www.myuno.app'),{redirect:'error',signal:AbortSignal.timeout(60000)});
 if(!archiveResponse.ok)throw Error('Public static archive failed: '+archiveResponse.status);
 const bytes=Buffer.from(await archiveResponse.arrayBuffer());
 if(bytes.length!==manifest.size||bytes.subarray(0,7).toString()!=='PMTiles'||bytes[7]!==3)throw Error('Invalid archive signature/size');
 await writeFile(path.join(output,'basemap-source.json'),JSON.stringify({url:archiveResponse.url,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')},null,2));
 server=createServer(async(req,res)=>{
  try{
   if(!['GET','HEAD'].includes(req.method)){res.writeHead(405).end();return;}
   const pathname=new URL(req.url,target.origin).pathname;
   if(pathname===manifest.url){
    res.setHeader('Content-Type','application/octet-stream');res.setHeader('Accept-Ranges','bytes');
    if(req.headers.range){const match=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range);const start=match?Number(match[1]):-1;const end=match&&match[2]?Math.min(Number(match[2]),bytes.length-1):bytes.length-1;
     if(start<0||start>=bytes.length||end<start){res.writeHead(416).end();return;}
     res.writeHead(206,{'Content-Range':`bytes ${start}-${end}/${bytes.length}`,'Content-Length':end-start+1});res.end(bytes.subarray(start,end+1));return;
    }res.writeHead(200,{'Content-Length':bytes.length});res.end(bytes);return;
   }
   let file=path.resolve(dist,'.'+decodeURIComponent(pathname));
   if(!file.startsWith(dist+path.sep)){res.writeHead(403).end();return;}
   let exists=await stat(file).then(info=>info.isFile()).catch(()=>false);
   if(!exists){if(path.extname(pathname)){res.writeHead(404).end();return;}file=path.join(dist,'index.html');}
   const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.pbf':'application/x-protobuf','.woff2':'font/woff2','.png':'image/png','.webp':'image/webp','.ico':'image/x-icon'};
   res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
   // Serve the exact built bytes. In particular, NEVER replace/relax the CSP meta.
   res.end(await readFile(file));
  }catch(error){res.writeHead(500).end(String(error));}
 });
 await new Promise(resolve=>server.listen(4173,'127.0.0.1',resolve));
}
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
   const row={revision,engine:engineName,browserVersion:browser.version(),viewport,target:target.href,outcome:'FAIL',scope:'Actual public deployed Vite bundle, fresh guest, read-only; viewport emulation is NOT a physical phone',console:[],pageErrors:[],requestFailures:[],blockedWrites:[],workerErrors:[],glyphResponses:[],renderUnsupported:false};
   const context=await browser.newContext({viewport,serviceWorkers:'block'});
   const page=await context.newPage();
   page.on('console',message=>{if(['error','warning'].includes(message.type()))row.console.push({type:message.type(),text:message.text().slice(0,2000)});});
   page.on('pageerror',error=>row.pageErrors.push({message:error.message,stack:error.stack?.slice(0,4000)}));
   page.on('response',response=>{if(/(?:map-glyphs|\/fonts\/).*\.pbf/.test(response.url()))row.glyphResponses.push({url:safeUrl(response.url()),status:response.status()});});
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
    await page.waitForFunction(()=>document.querySelector('[data-map-render-state="unsupported"]')||document.querySelector('.maplibregl-ctrl-zoom-in'),null,{timeout:60000});
    row.renderUnsupported=await page.locator('[data-map-render-state="unsupported"]').count()>0;
    if(row.renderUnsupported){
     const genuineFailure=await page.evaluate(()=>window.__mapDiagnostics.contexts.some(entry=>entry.mapCanvas)&&!window.__mapDiagnostics.contexts.some(entry=>entry.mapCanvas&&entry.ok));
     if(!genuineFailure)throw Error('Unsupported state without observed WebGL context failure');
     await expect(page.getByText(/WebGL/)).toBeVisible();
     await expect(page.locator('.maplibregl-canvas')).toHaveCount(0);
     await page.getByRole('button',{name:/^(Повторить|Retry)$/}).click();
     await expect(page.locator('[data-map-render-state="unsupported"]')).toBeVisible();
     await expect(page.locator('.maplibregl-canvas')).toHaveCount(0);
     await page.getByRole('button',{name:/^(Показать списком|Show list)$/}).click();
     await expect(page.getByRole('option').filter({visible:true}).first()).toBeVisible({timeout:30000});
     row.outcome='FALLBACK_PASS';
    }else{
     await expect(page.locator('.maplibregl-canvas')).toHaveCount(1);
     await expect(page.locator('[data-marker-id]').first()).toBeVisible({timeout:30000});
     await expect(page.getByText(/^(Карта онлайн|Online map)$/)).toBeVisible({timeout:30000});
     // Wait for actual symbol rendering, not just map load or a successful tile fetch.
     await page.waitForFunction(()=>Number(document.querySelector('[data-map-label-count]')?.getAttribute('data-map-label-count'))>0,null,{timeout:60000});
     await expect.poll(()=>row.glyphResponses.filter(item=>item.status===200).length,{timeout:30000}).toBeGreaterThan(0);
     row.renderedLabels=await page.locator('[data-map-label-count]').getAttribute('data-map-label-count');
     if(row.glyphResponses.some(item=>item.status!==200||new URL(item.url).origin!==target.origin))throw Error('Glyph failed or escaped same-origin');
     row.outcome='RENDERED_PASS';
    }
    if(row.requestFailures.some(item=>/map-glyphs|\/fonts\/.*\.pbf/.test(item.url))||row.console.some(item=>/Content.Security.Policy|violates.*directive|Refused to.*font/i.test(item.text)&&/glyph|fonts|openfreemap/i.test(item.text)))throw Error('Map font/CSP failure');
   }catch(error){row.outcome='FAIL';row.failure=String(error).slice(0,3000);}
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
await new Promise(resolve=>server?server.close(resolve):resolve());
console.log(JSON.stringify(results.map(({engine,viewport,outcome,classification,failure,launchError})=>({engine,viewport,outcome,classification,failure,launchError})),null,2));
if(results.length!==engines.length*2||results.some(row=>!['RENDERED_PASS','FALLBACK_PASS'].includes(row.outcome))||!results.some(row=>row.outcome==='RENDERED_PASS'))process.exitCode=1;
