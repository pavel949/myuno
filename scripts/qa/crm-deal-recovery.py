"""Actual sheet, local synthetic database and injected failures. All nonfixture requests denied."""
import asyncio, json, os, sys
from pathlib import Path
from urllib.parse import urlparse
from playwright.async_api import async_playwright, expect
OUTPUT=Path(sys.argv[1]); BEFORE='--before' in sys.argv
async def main():
 rows=[]
 async with async_playwright() as p:
  bundled=Path(p.chromium.executable_path)
  executable=str(bundled) if bundled.exists() else ('/usr/bin/chromium' if not os.environ.get('CI') and Path('/usr/bin/chromium').exists() else None)
  if not executable: raise RuntimeError('Installed Playwright Chromium required in CI')
  browser=await p.chromium.launch(executable_path=executable,headless=True,args=['--no-sandbox'])
  for width in [390,1440]:
   for mode in ['before','lost-contact','lost-deal','context']:
    context=await browser.new_context(viewport={'width':width,'height':1000},service_workers='block');blocked=[];errors=[]
    async def route(r):
     u=urlparse(r.request.url);name='fixture.html' if u.path=='/fixture' else u.path.lstrip('/')
     types={'fixture.html':'text/html','fixture.js':'text/javascript','fixture.css':'text/css'}
     if u.netloc=='localhost:8080' and r.request.method=='GET' and name in types:await r.fulfill(path=str(OUTPUT/name),content_type=types[name])
     else:blocked.append({'origin':u.netloc,'method':r.request.method});await r.abort()
    await context.route('**/*',route);page=await context.new_page();page.set_default_timeout(7000);page.on('pageerror',lambda e:errors.append(str(e)))
    row={'width':width,'mode':mode,'before':BEFORE,'outcome':'FAIL'}
    try:
     await page.goto('http://localhost:8080/fixture?mode='+('before' if mode=='context' else mode));await page.evaluate('document.fonts.ready')
     await page.get_by_role('dialog').get_by_role('textbox').first.fill('Synthetic CRM Customer')
     await page.screenshot(path=str(OUTPUT/f'{width}-{mode}-initial.png'))
     create=page.get_by_role('button',name='Create Deal',exact=True)
     # Native double activation during contact request, before deal is pending.
     if mode in ['before','context']:await create.dblclick()
     else:await create.click()
     if mode=='context':
      await page.evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent==='QA switch company').click()")
      await page.wait_for_timeout(700)
      row['oldContextDeals']=await page.evaluate('Object.values(window.fixture.deals).filter(d=>d.company_id===\'company-a\').length')
      row['visibleOldDraft']=await page.get_by_role('dialog').get_by_role('textbox').first.input_value() if await page.get_by_role('dialog').count() else None
      if not BEFORE:assert row['oldContextDeals']==0 and row['visibleOldDraft']==''
     else:
      await page.wait_for_timeout(800)
      row['afterFirst']=await page.evaluate('({contacts:Object.keys(window.fixture.contacts).length,deals:Object.keys(window.fixture.deals).length,writes:window.fixture.writes})')
      await page.screenshot(path=str(OUTPUT/f'{width}-{mode}-unconfirmed.png'))
      if not BEFORE:
       await expect(page.get_by_role('alert')).to_contain_text('not confirmed')
       await expect(page.get_by_role('dialog').get_by_role('textbox').first).to_be_disabled()
       await page.reload();await expect(page.get_by_role('button',name='Retry saved attempt')).to_be_visible()
       await page.get_by_role('button',name='Retry saved attempt').click()
       await expect(page.get_by_test_id('route')).to_contain_text('/mc/sales/')
       row['recovered']=await page.evaluate('({contacts:Object.keys(window.fixture.contacts).length,deals:Object.keys(window.fixture.deals).length,writes:window.fixture.writes,journals:Object.keys(sessionStorage).length})')
       assert row['recovered']['contacts']==1 and row['recovered']['deals']==1 and row['recovered']['journals']==0
       assert len(row['recovered']['writes'])==2
      else:
       # Baseline can already close after the overlapping second submit; record, do not fake success.
       if await page.get_by_role('dialog').count():
        await page.get_by_role('button',name='Create Deal',exact=True).click();await page.wait_for_timeout(700)
       row['baselineAfterRetry']=await page.evaluate('({contacts:Object.keys(window.fixture.contacts).length,deals:Object.keys(window.fixture.deals).length,writes:window.fixture.writes})')
       row['baselineRoute']=await page.get_by_test_id('route').text_content()
     await page.screenshot(path=str(OUTPUT/f'{width}-{mode}-final.png'))
     assert not blocked and not errors
     row['outcome']='PASS'
    except Exception as e:row['error']=str(e);await page.screenshot(path=str(OUTPUT/f'{width}-{mode}-FAIL.png'))
    row['blocked']=blocked;row['errors']=errors;rows.append(row);await context.close()
  await browser.close()
 (OUTPUT/'evidence.json').write_text(json.dumps(rows,indent=2));print(json.dumps(rows,indent=2))
 if any(r['outcome']!='PASS' for r in rows):raise SystemExit(1)
asyncio.run(main())
