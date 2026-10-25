import asyncio,json,shutil,os,sys
from pathlib import Path
from playwright.async_api import async_playwright
OUT=Path(sys.argv[1])
async def main():
 rows=[]
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True,executable_path=shutil.which('chromium'),args=['--no-sandbox'])
  for width in ([390] if os.environ.get('CAPITAL_LEAD_ONLY') else [390,1440]):
   for theme in ['light','dark']:
    for state in (['lead'] if os.environ.get('CAPITAL_LEAD_ONLY') else ['normal','loading','error']):
     context=await browser.new_context(viewport={'width':width,'height':900},service_workers='block');page=await context.new_page();errors=[];blocked=[]
     page.on('pageerror',lambda e:errors.append(str(e)))
     async def route(r):
      name=r.request.url.split('?',1)[0].rsplit('/',1)[-1];types={'index.html':'text/html','app.js':'text/javascript','normal.css':'text/css'}
      if r.request.url.startswith('http://localhost:8080/') and name in types:await r.fulfill(path=str(OUT/name),content_type=types[name])
      else:blocked.append(r.request.url);await r.abort()
     await context.route('**/*',route)
     row={'width':width,'theme':theme,'state':state,'mode':'actual page / synthetic read-only SDK; no permission/backend acceptance'}
     try:
      await page.goto(f'http://localhost:8080/index.html?theme={theme}&state={state}',wait_until='networkidle')
      await page.get_by_text('Newbuilds — Broker Console',exact=True).wait_for()
      if state in ['normal','lead']:await page.get_by_text('฿7,500',exact=True).wait_for()
      elif state=='error':await page.get_by_role('alert',name='Сводка недоступна').wait_for();assert await page.get_by_text('Нет лидов',exact=True).count()==0
      else:await page.get_by_role('status').wait_for()
      assert not errors,errors
      row['horizontalOverflow']=await page.evaluate('document.documentElement.scrollWidth>innerWidth')
      assert not row['horizontalOverflow'],'horizontal page overflow'
      assert await page.locator('.ds-frame-wide').evaluate('e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth}'),'frame exceeds viewport'
      assert await page.locator('.grid>div').evaluate_all('es=>es.every(e=>e.getBoundingClientRect().right<=innerWidth+1)'),'KPI clipped beyond viewport'
      row['frame']=await page.locator('.ds-frame-wide').evaluate('e=>({max:getComputedStyle(e).maxWidth,gutter:getComputedStyle(e).paddingLeft,bottom:getComputedStyle(e).paddingBottom,classes:e.className})')
      if width==1440:
       original=await page.evaluate("document.documentElement.style.getPropertyValue('--layout-width-wide')")
       await page.evaluate("document.documentElement.style.setProperty('--layout-width-wide','1000px')")
       assert await page.locator('.ds-frame-wide').evaluate("e=>getComputedStyle(e).maxWidth==='1000px'"),'named width did not propagate'
       await page.evaluate("value=>{if(value)document.documentElement.style.setProperty('--layout-width-wide',value);else document.documentElement.style.removeProperty('--layout-width-wide')}",original)
      assert await page.evaluate('window.fixtureWrites')==0
      filename=f'{width}-{theme}-{state}.png';await page.screenshot(path=str(OUT/filename),full_page=True);row['screenshots']=[filename]
      if state=='lead':
       await page.get_by_text('long.synthetic.contact@example.test',exact=True).wait_for()
       region=page.get_by_role('region',name='Лиды и атрибуция');await region.focus();assert await region.evaluate('e=>document.activeElement===e')
       for _ in range(8):await page.keyboard.press('ArrowRight')
       await page.wait_for_function("e=>e.scrollLeft>0",arg=await region.element_handle(),timeout=2000)
       assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth'),'populated lead page overflow'
       row['populatedLeadKeyboardScroll']='PASS'
       await page.screenshot(path=str(OUT/f'{width}-{theme}-lead-scrolled.png'),full_page=True);row['screenshots'].append(f'{width}-{theme}-lead-scrolled.png')
      if state=='normal':
       for name,part in [('Удержания','holds'),('Комиссии','forecast')]:
        await page.get_by_role('button',name=name,exact=False).first.click()
        if part=='holds':
         await page.get_by_text('Истёк',exact=True).wait_for()
         region=page.get_by_role('region',name='Удержания и суммы')
         await region.focus()
         before=await region.evaluate('e=>({left:e.scrollLeft,width:e.scrollWidth,client:e.clientWidth})')
         assert await region.evaluate('e=>document.activeElement===e'),'table region did not receive keyboard focus'
         for _ in range(8):await page.keyboard.press('ArrowRight')
         if before['width']>before['client']:
          # Native keyboard scrolling animates asynchronously; observe its result, not the key dispatch tick.
          await page.wait_for_function('(x)=>x.element.scrollLeft>x.left',arg={'element':await region.element_handle(),'left':before['left']},timeout=2000)
         row['tableScroll'] = await region.evaluate('e=>({left:e.scrollLeft,width:e.scrollWidth,client:e.clientWidth,focused:document.activeElement===e})')
         assert await page.get_by_text('฿2,500',exact=True).evaluate("e=>getComputedStyle(e).whiteSpace==='nowrap'"),'currency wrapping'
         assert await page.get_by_text('pending',exact=True).evaluate("e=>getComputedStyle(e).whiteSpace==='nowrap'"),'status wrapping'
         row['keyboardTableScroll']='PASS'
        
        else:await page.get_by_text('7.5%',exact=True).wait_for()
        assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth'),'tab caused page overflow'
        filename=f'{width}-{theme}-{part}.png';await page.screenshot(path=str(OUT/filename),full_page=True);row['screenshots'].append(filename)
      assert not errors,errors
      assert not blocked,blocked
      assert await page.evaluate('window.fixtureWrites')==0,'unexpected writer/dispatch invocation'
      row['result']='PASS'
     except Exception as e:row['result']='FAIL';row['failure']=str(e);await page.screenshot(path=str(OUT/f'{width}-{theme}-{state}-FAIL.png'),full_page=True)
     row['pageErrors']=errors;row['blockedRequests']=blocked;rows.append(row);await context.close()
  await browser.close()
 assert len(rows)==(2 if os.environ.get('CAPITAL_LEAD_ONLY') else 12),'Capital matrix incomplete'
 (OUT/('lead-results.json' if os.environ.get('CAPITAL_LEAD_ONLY') else 'results.json')).write_text(json.dumps({'scope':'actual CapitalNewbuildsDeals visuals with synthetic SDK; external transport denied','cases':rows},ensure_ascii=False,indent=2))
 print(json.dumps({'cases':len(rows),'passed':sum(r['result']=='PASS' for r in rows),'failed':sum(r['result']=='FAIL' for r in rows)}))
 if any(r['result']=='FAIL' for r in rows):raise SystemExit(1)
asyncio.run(main())
