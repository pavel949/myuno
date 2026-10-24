import assert from 'node:assert/strict';
import { chromium, expect } from '@playwright/test';
import { mkdir,writeFile,readFile } from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import { startFixture,ids } from './server.mjs';
import { buildFixture } from './browser-fixture.mjs';
const root=process.cwd(),output=path.resolve('/tmp/browser/pricing-acceptance-20261024');
await mkdir(output,{recursive:true});
await buildFixture(root,output);
const fixture=await startFixture(root,output);
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const results=[],externalRequests=[],runtimeErrors=[],layoutCases=[];
const httpQuote=async payload=>{const response=await fetch(fixture.url+'/quote',{method:'POST',headers:{'Content-Type':'application/json','x-fixture-actor':'owner'},body:JSON.stringify(payload)});return response.json();};
const page=await browser.newPage({viewport:{width:1440,height:1100}});
await page.route('**/*',route=>{if(new URL(route.request().url()).origin===fixture.url)return route.continue();externalRequests.push(route.request().url());return route.abort();});
page.on('pageerror',e=>runtimeErrors.push(e.message));
const rates=(property=ids.unit,extra='')=>`${fixture.url}/mc/rates?property=${property}&date=2026-11-10${extra}`;
const read=(property=ids.unit,category=null,from='2026-11-10',to='2026-11-13',actor=ids.owner)=>fixture.rpc('get_property_calendar_prices',{p_property_id:property,p_category_id:category,p_from:from,p_to:to},actor);
const snapshot=(rows,category=false)=>Object.fromEntries(rows.map(r=>[r.date,category?{price:r.price_override,minimum:r.min_stay_nights,arrival:r.closed_to_arrival,departure:r.closed_to_departure,stop:r.stop_sell}:{price:r.price_override,minimum:r.min_nights_override,status:r.status,booking:r.booking_id}]));
const save=async(property,category,from,to,price,expected,actor=ids.owner)=>fixture.rpc('set_property_calendar_price',{p_property_id:property,p_category_id:category,p_from:from,p_to:to,p_price:price,p_currency:'THB',p_expected:expected??snapshot(await read(property,category,from,to),!!category)},actor);
const caseRun=async(name,fn)=>{try{await fn();results.push({name,status:'pass'});}catch(e){results.push({name,status:'fail',error:e.message});await page.screenshot({path:path.join(output,'failure.png'),fullPage:true});throw e;}};
const edit=async(value,from='2026-11-10',through='2026-11-11')=>{
 await page.getByLabel('From',{exact:true}).fill(from);await page.getByLabel('Through (inclusive)').fill(through);await page.getByLabel('Per night · THB').fill(value);await expect(page.getByRole('button',{name:'Apply nightly price'})).toBeEnabled();
};
try{
 await caseRun('canonical quote uses latest overlapping season before overrides',async()=>{
  assert.equal((await httpQuote({property:ids.unit,from:'2026-11-10',to:'2026-11-13',total:5500})).ok,true);
  assert.equal((await httpQuote({property:ids.hotel,category:ids.category,from:'2026-11-10',to:'2026-11-13'})).total,9350);
 });
 await caseRun('unit read → edit → actual SQL save → canonical calendar → quote',async()=>{
  await page.goto(rates());await expect(page.getByRole('button',{name:'2026-11-10 Inherited rate'})).toBeEnabled();
  await edit('2100');await page.getByRole('button',{name:'Apply nightly price'}).click();await expect(page.getByText('Prices saved',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'2026-11-10 2100'})).toBeVisible();await expect(page.getByRole('button',{name:'2026-11-11 2100'})).toBeVisible();
  const rows=await read();assert.deepEqual(rows.map(r=>[r.date,r.price_override]),[['2026-11-10',2100],['2026-11-11',2100]]);
  assert.deepEqual(await read(ids.other),[]);assert.deepEqual(await read(ids.hotel,ids.category),[]);
  await page.getByRole('link',{name:'Open booking calendar'}).click();await expect(page.getByRole('button',{name:'10 Nov 2026',exact:true})).toContainText('2.1k');await expect(page.getByRole('button',{name:'11 Nov 2026',exact:true})).toContainText('2.1k');
  await page.screenshot({path:path.join(output,'unit-canonical-calendar.png'),fullPage:true});
  const quote=await httpQuote({property:ids.unit,from:'2026-11-10',to:'2026-11-13',total:6200});assert.equal(quote.ok,true);assert.equal(quote.total,6200);
  assert.equal((await httpQuote({property:ids.unit,from:'2026-11-10',to:'2026-11-13',total:1})).code,'total');
 });
 await caseRun('stale overlapping edit fails atomically, refreshes visible prices, then retries',async()=>{
  await page.goto(rates());await expect(page.getByRole('button',{name:'2026-11-10 2100'})).toBeVisible();await edit('2200');
  await save(ids.unit,null,'2026-11-10','2026-11-12',2300);
  const before=(await fixture.state()).audit.length;
  await page.getByRole('button',{name:'Apply nightly price'}).click();await expect(page.getByText(/Could not save/)).toBeVisible();
  assert.equal((await fixture.state()).audit.length,before);
  // The user must see the conflicting price before explicitly retrying.
  await expect(page.getByRole('button',{name:'2026-11-10 2300'})).toBeVisible();
  await page.screenshot({path:path.join(output,'conflict-refreshed.png'),fullPage:true});
  await page.getByRole('button',{name:'Apply nightly price'}).click();await expect(page.getByText('Prices saved',{exact:true})).toBeVisible();assert.equal((await read())[0].price_override,2200);
 });
 await caseRun('transport failure creates no write and explicit retry saves',async()=>{
  await page.goto(rates());await expect(page.getByRole('button',{name:'2026-11-10 2200'})).toBeVisible();await edit('2400');
  await fetch(fixture.url+'/control',{method:'POST',body:JSON.stringify({failNext:true})});const before=(await fixture.state()).audit.length;
  await page.getByRole('button',{name:'Apply nightly price'}).click();await expect(page.getByText(/Could not save/)).toBeVisible();assert.equal((await fixture.state()).audit.length,before);assert.equal((await read())[0].price_override,2200);
  await page.getByRole('button',{name:'Apply nightly price'}).click();await expect(page.getByText('Prices saved',{exact:true})).toBeVisible();assert.equal((await read())[0].price_override,2400);
 });
 await caseRun('category edit affects only category quote and preserves units/sibling category',async()=>{
  await page.goto(rates(ids.hotel));await page.getByLabel('Apply to').selectOption(ids.category);await edit('3100');await page.getByRole('button',{name:'Apply nightly price'}).click();await expect(page.getByText('Prices saved',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'2026-11-10 3100'})).toBeVisible();assert.equal((await read())[0].price_override,2400);assert.deepEqual(await read(ids.hotel,ids.otherCategory),[]);assert.deepEqual(await read(ids.other),[]);
  const q=await httpQuote({property:ids.hotel,category:ids.category,from:'2026-11-10',to:'2026-11-13'});assert.equal(q.ok,true);assert.equal(q.total,10120);assert.equal((await httpQuote({property:ids.hotel,category:ids.otherCategory,from:'2026-11-10',to:'2026-11-13'})).total,3600);
  await page.screenshot({path:path.join(output,'category-prices.png'),fullPage:true});
  await page.getByRole('link',{name:'Open booking calendar'}).click();
  await expect(page).toHaveURL(new RegExp('category='+ids.category));
  await expect(page.getByRole('button',{name:'2026-11-10 3100'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Add Booking'})).toHaveCount(0);
  await expect(page.getByLabel('Apply to')).toHaveValue(ids.category);
  await page.screenshot({path:path.join(output,'category-canonical-calendar.png'),fullPage:true});
  await page.getByRole('button',{name:'Property rates',exact:true}).click();
  await expect(page).toHaveURL(new RegExp('category='+ids.category));
  await expect(page.getByLabel('Apply to')).toHaveValue(ids.category);
 });
 await caseRun('category overlapping snapshots reject stale prices without overwriting the winner',async()=>{
  const expected=snapshot(await read(ids.hotel,ids.category,'2026-11-10','2026-11-11'),true);
  await save(ids.hotel,ids.category,'2026-11-10','2026-11-11',3300,expected);const audit=(await fixture.state()).audit.length;
  await assert.rejects(()=>save(ids.hotel,ids.category,'2026-11-10','2026-11-11',3400,expected),e=>e.code==='40001');
  assert.equal((await read(ids.hotel,ids.category))[0].price_override,3300);assert.equal((await fixture.state()).audit.length,audit);
  await save(ids.hotel,ids.category,'2026-11-10','2026-11-11',3100);
 });
 await caseRun('booked/blocked and category closures survive price edits',async()=>{
  await save(ids.unit,null,'2026-11-09','2026-11-10',2600);await save(ids.hotel,ids.category,'2026-11-09','2026-11-10',3200);
  const u=(await read(ids.unit,null,'2026-11-09','2026-11-10'))[0];assert.equal(u.status,'blocked');assert.equal(u.booking_id,ids.booking);assert.equal(u.min_nights_override,3);
  const c=(await read(ids.hotel,ids.category,'2026-11-09','2026-11-10'))[0];assert.equal(c.stop_sell,true);assert.equal(c.closed_to_arrival,true);assert.equal(c.min_stay_nights,3);
  assert.equal((await httpQuote({property:ids.hotel,category:ids.category,from:'2026-11-09',to:'2026-11-12'})).code,'closed_arrival');
  assert.equal((await httpQuote({property:ids.hotel,category:ids.category,from:'2026-11-08',to:'2026-11-10'})).code,'stop_sell');
 });
 await caseRun('inclusive year and leap boundaries remain half-open in SQL',async()=>{
  for(const [from,through,end,count]of [['2026-12-31','2027-01-01','2027-01-02',2],['2028-02-28','2028-03-01','2028-03-02',3]]){
   await page.goto(rates());await edit('1700.25',from,through);await page.getByRole('button',{name:'Apply nightly price'}).click();await expect(page.getByText('Prices saved',{exact:true})).toBeVisible();const rows=await read(ids.unit,null,from,end);assert.equal(rows.length,count);assert.equal(rows[0].price_override,1700.25);assert.equal(rows.at(-1).date,through);assert.deepEqual(await read(ids.unit,null,end,new Date(Date.parse(end)+86400000).toISOString().slice(0,10)),[]);
  }
 });
 await caseRun('invalid amounts/ranges never write; SQL also rejects invalid RPC payloads',async()=>{
  await page.goto(rates());await expect(page.getByRole('button',{name:'2026-11-10 2400'})).toBeVisible();const before=(await fixture.state()).audit.length;
  for(const value of ['0','-1','1.001','NaN']){await edit(value);await page.getByRole('button',{name:'Apply nightly price'}).click();await expect(page.getByRole('button',{name:'Apply nightly price'})).toBeEnabled();}
  await page.getByLabel('Through (inclusive)').fill('2026-11-01');await expect(page.getByRole('button',{name:'Apply nightly price'})).toBeDisabled();assert.equal((await fixture.state()).audit.length,before);
  for(const price of [0,-1,1.001])await assert.rejects(()=>save(ids.unit,null,'2026-11-10','2026-11-11',price,{}),e=>e.code==='22023');
  await assert.rejects(()=>save(ids.unit,null,'2026-11-12','2026-11-10',1,{}),e=>e.code==='22023');
  await assert.rejects(()=>save(ids.unit,ids.category,'2026-11-10','2026-11-11',1,{}),e=>e.code==='42501');
 });
 await caseRun('foreign actor is denied by SQL and UI read fails closed',async()=>{
  const before=(await fixture.state()).audit.length;
  await assert.rejects(()=>read(ids.unit,null,'2026-11-10','2026-11-11',ids.foreign),e=>e.code==='42501');
  await assert.rejects(()=>save(ids.unit,null,'2026-11-10','2026-11-11',1,{},ids.foreign),e=>e.code==='42501');assert.equal((await fixture.state()).audit.length,before);
  await page.goto(rates(ids.unit,'&actor=foreign'));await expect(page.getByText('Prices unavailable. Try reloading.')).toBeVisible();await expect(page.getByRole('button',{name:'Apply nightly price'})).toBeDisabled();await page.screenshot({path:path.join(output,'permission-denied.png'),fullPage:true});
 });
 await caseRun('anonymous role, missing identity, scope ceiling and currency mismatch fail closed',async()=>{
  const args={p_property_id:ids.unit,p_category_id:null,p_from:'2026-11-10',p_to:'2026-11-11'};
  const before=(await fixture.state()).audit.length;
  await assert.rejects(()=>fixture.rpc('get_property_calendar_prices',args,null),e=>e.code==='42501');
  await assert.rejects(()=>fixture.rpc('get_property_calendar_prices',args,ids.owner,true),e=>e.code==='42501');
  const write={...args,p_price:1,p_currency:'THB',p_expected:{}};
  await assert.rejects(()=>fixture.rpc('set_property_calendar_price',write,ids.owner,true),e=>e.code==='42501');
  await assert.rejects(()=>fixture.rpc('set_property_calendar_price',{...write,p_currency:'USD'}),e=>e.code==='40001'&&/currency/.test(e.message));
  await assert.rejects(()=>fixture.rpc('set_property_calendar_price',{...write,p_from:'2026-01-01',p_to:'2027-01-03'}),e=>e.code==='22023');
  await assert.rejects(()=>fixture.sql.begin(async tx=>{await tx.unsafe('SET LOCAL ROLE anon');await tx`SELECT public.get_property_calendar_prices(${ids.unit}::uuid,NULL,'2026-11-10','2026-11-11')`;}),e=>e.code==='42501');
  assert.equal((await fixture.state()).audit.length,before);
 });
 await caseRun('RU/EN mobile and desktop keep bounded geometry and no runtime errors',async()=>{
  for(const timezoneId of ['UTC','Asia/Bangkok','America/New_York'])for(const lang of ['ru','en'])for(const width of [375,390,430,1440]){
   const context=await browser.newContext({viewport:{width,height:1100},timezoneId,locale:lang==='ru'?'ru-RU':'en-US',serviceWorkers:'block'});
   const check=await context.newPage();
   await check.route('**/*',route=>{if(new URL(route.request().url()).origin===fixture.url)return route.continue();externalRequests.push(route.request().url());return route.abort();});
   check.on('pageerror',e=>runtimeErrors.push(e.message));
   await check.goto(`${fixture.url}/mc/calendar?property=${ids.hotel}&category=${ids.category}&date=2026-11-10&lang=${lang}`);
   await expect(check.getByRole('button',{name:'2026-11-10 3100'})).toBeVisible();
   await expect(check.getByLabel(lang==='ru'?'С даты':'From',{exact:true})).toHaveValue('2026-11-10');
   assert.equal(await check.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   const screenshot=`${lang}-${width}-${timezoneId.replaceAll('/','_')}.png`;
   await check.screenshot({path:path.join(output,screenshot),fullPage:true});
   layoutCases.push({lang,width,timezoneId,screenshot,overflow:false,date:'2026-11-10'});await context.close();
  }
  assert.deepEqual(runtimeErrors,[]);assert.deepEqual(externalRequests,[]);
 });
}catch(e){process.exitCode=1;console.error(e.message);}finally{
 const sourceFiles=['src/components/owner/pricing/CalendarPriceEditor.tsx','src/pages/owner/OwnerCalendar.tsx','src/pages/owner/RateManagementPage.tsx','src/lib/owner/propertyNavigation.ts','src/hooks/useCalendarPrices.ts','src/components/owner/AirbnbCalendarGrid.tsx','supabase/functions/_shared/property-quote.ts','supabase/functions/_shared/hotel-quote.ts','supabase/migrations/20261021062539_canonical_pricing_calendar.sql','supabase/migrations/20261021063811_canonical_pricing_calendar_read.sql'];
 const fingerprints=Object.fromEntries(await Promise.all(sourceFiles.map(async file=>[file,createHash('sha256').update(await readFile(path.join(root,file))).digest('hex')])));
 await writeFile(path.join(output,'results.json'),JSON.stringify({baseCommit:'37de22d344274c0075e47f0717637bb40c6e5c1b',headCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),fingerprints,results,layoutCases,runtimeErrors,externalRequests,calls:fixture.calls,state:await fixture.state()},null,2));
 console.log(JSON.stringify({results,layoutCases:layoutCases.length,output,externalRequests:externalRequests.length,runtimeErrors},null,2));await browser.close();await fixture.close();
}
