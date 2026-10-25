"""Actual owner components, synthetic acknowledgment, deny all production networking."""
import asyncio,json,os,shutil,sys
from pathlib import Path
from urllib.parse import urlparse
from playwright.async_api import async_playwright,expect
OUT=Path(sys.argv[1])
COPY={'ru':('Найти жильё на Пхукете','Хочу сдавать в аренду','Обсудить управление','Имя','Телефон / WhatsApp','Заявка сохранена'),'en':('Find a home in Phuket','I want to rent it out','Discuss management','Name','Phone / WhatsApp','Request saved'),'th':('ค้นหาที่พักในภูเก็ต','ฉันต้องการปล่อยเช่า','ปรึกษาเรื่องการจัดการ','ชื่อ','โทรศัพท์ / WhatsApp','บันทึกคำขอแล้ว')}
async def main():
 results=[]
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True,executable_path=None if os.environ.get('CI') else shutil.which('chromium'),args=['--no-sandbox'])
  print(json.dumps({'browser':browser.version,'source':'playwright-bundled' if os.environ.get('CI') else 'local-system-fallback'}),flush=True)
  for lang in COPY:
   for width in [320,390,430,1440]:
    context=await browser.new_context(viewport={'width':width,'height':844},service_workers='block')
    errors=[];blocked=[]
    async def route(r):
     u=urlparse(r.request.url);name='fixture.html' if u.path=='/fixture' else u.path.lstrip('/')
     types={'fixture.html':'text/html','fixture.css':'text/css','fixture.js':'text/javascript'}
     if u.netloc=='localhost:8080' and r.request.method=='GET' and name in types:await r.fulfill(path=str(OUT/name),content_type=types[name])
     else:blocked.append({'url':r.request.url,'method':r.request.method});await r.abort()
    await context.route('**/*',route);page=await context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
    row={'lang':lang,'width':width,'outcome':'FAIL'};prefix=f'{lang}-{width}'
    try:
     await page.goto('http://localhost:8080/fixture?lang='+lang,wait_until='networkidle')
     if width==430:await page.evaluate("document.documentElement.classList.add('dark')")
     trigger,rent,manage,name,phone,saved=COPY[lang]
     await page.get_by_role('button',name=trigger).click()
     await expect(page.get_by_role('dialog')).to_be_visible()
     await page.get_by_role('dialog').evaluate("e=>Promise.all(e.getAnimations({subtree:true}).map(a=>a.finished.catch(()=>{})))")
     await expect(page.locator('.home-search-intents a')).to_have_count(6)
     # Original four intentions and owner entry remain independently reachable.
     for a in await page.locator('.home-search-intents a').all():
      box=await a.bounding_box();assert box and box['height']>=44,box
      if width>=390:assert box['y']>=0 and box['y']+box['height']<=844,box
     await page.screenshot(path=str(OUT/f'{prefix}-chooser.png'))
     await page.keyboard.press('Escape');await expect(page.get_by_role('dialog')).to_have_count(0)
     await page.get_by_role('button',name=trigger).click()
     selected='rent' if width in [320,430] else 'management';label=rent if selected=='rent' else manage
     await page.get_by_role('link',name=label,exact=True).click()
     await expect(page.get_by_test_id('route')).to_have_text('/owner/management-landing?intent='+selected)
     await page.locator('#lead-name').fill('Synthetic owner');await page.locator('#lead-phone').fill('+66000000000');await page.locator('#lead-email').fill('synthetic@example.invalid');await page.locator('#lead-message').fill('Synthetic property, expectations and current tenancy')
     other=manage if selected=='rent' else rent
     await page.get_by_role('radio',name=other,exact=True).check();await page.get_by_test_id('back').click()
     await expect(page.get_by_role('radio',name=label,exact=True)).to_be_checked();await expect(page.locator('#lead-name')).to_have_value('Synthetic owner')
     await expect(page.locator('#lead-phone')).to_have_value('+66000000000')
     assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth'),'overflow'
     await page.evaluate('scrollTo(0,0)')
     await page.screenshot(path=str(OUT/f'{prefix}-form.png'),full_page=True)
     await page.evaluate('window.fixtureReject=true')
     await page.locator('form button[type=submit]').click();await expect(page.get_by_role('alert')).to_be_visible();await expect(page.locator('#lead-name')).to_have_value('Synthetic owner')
     assert len(await page.evaluate('window.fixtureLeads'))==1
     await page.evaluate('window.fixtureReject=false')
     await page.locator('form button[type=submit]').click();await expect(page.get_by_role('heading',name=saved,exact=True)).to_be_visible()
     await expect(page.get_by_role('radio',name=other,exact=True)).to_be_disabled()
     await expect(page.get_by_role('radio',name=label,exact=True)).to_be_checked()
     leads=await page.evaluate('window.fixtureLeads');assert len(leads)==2
     assert leads[-1]['vertical_metadata']=={'owner_intent':selected},leads[-1]
     assert leads[-1]['request_type']=='full_management' and leads[-1]['entry_point'].endswith('intent='+selected)
     assert not errors,errors
     assert not [r for r in blocked if r['method']!='GET'],blocked
     row.update(outcome='PASS',intent=selected,syntheticAttempts=2,viewport=await page.evaluate('[innerWidth,innerHeight]'))
    except Exception as e:
     row['error']=str(e);row['pageErrors']=errors
     await page.screenshot(path=str(OUT/f'{prefix}-FAIL.png'),full_page=True)
    results.append(row);print(json.dumps(row,ensure_ascii=False),flush=True);await context.close()
  await browser.close()
 (OUT/'results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
 assert all(r['outcome']=='PASS' for r in results),f"{sum(r['outcome']=='PASS' for r in results)}/{len(results)} PASS"
asyncio.run(main())
