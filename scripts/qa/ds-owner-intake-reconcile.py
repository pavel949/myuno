"""Actual owner entry/landing/form, synthetic RPC receipts only; deny every non-fixture request."""
import asyncio,json,os,shutil,sys
from pathlib import Path
from urllib.parse import urlparse
from playwright.async_api import async_playwright,expect
OUT=Path(sys.argv[1]);VERSION=sys.argv[2];ORIGIN='http://127.0.0.1:8922'
COPY={
'en':{'trigger':'Find a home in Phuket','rent':'I want to rent it out','management':'Discuss management','name':'Name','phone':'Phone / WhatsApp','email':'Email','message':'Message','saved':'Request saved'},
'ru':{'trigger':'Найти жильё на Пхукете','rent':'Хочу сдавать в аренду','management':'Обсудить управление','name':'Имя','phone':'Телефон / WhatsApp','email':'Email','message':'Комментарий','saved':'Заявка сохранена'},
 'th':{'trigger':'ค้นหาที่พักในภูเก็ต','rent':'ฉันต้องการปล่อยเช่า','management':'ปรึกษาเรื่องการจัดการ','name':'ชื่อ','phone':'โทรศัพท์ / WhatsApp','email':'อีเมล','message':'ข้อความ','saved':'บันทึกคำขอแล้ว'}}
async def main():
 results=[]
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True,executable_path=None if os.environ.get('CI') else shutil.which('chromium'),args=['--no-sandbox'])
  for lang,width in [('en',320),('en',390),('ru',390),('th',390),('en',1440),('ru',1440),('th',1440)]:
   context=await browser.new_context(viewport={'width':width,'height':900},service_workers='block');errors=[];blocked=[]
   async def route(r):
    u=urlparse(r.request.url);name=u.path.lstrip('/')
    if u.netloc=='127.0.0.1:8922' and name in ['fixture.html','fixture.js','fixture.css'] and r.request.method=='GET':await r.fulfill(path=str(OUT/name),content_type='text/html' if name.endswith('.html') else 'text/css' if name.endswith('.css') else 'text/javascript')
    else:blocked.append({'origin':u.netloc,'method':r.request.method});await r.abort()
   await context.route('**/*',route);page=await context.new_page();page.on('pageerror',lambda e:errors.append(str(e)));c=COPY[lang];prefix=f'{lang}-{width}'
   await page.goto(ORIGIN+'/fixture.html?lang='+lang,wait_until='networkidle');await page.get_by_role('button',name=c['trigger'],exact=False).click();dialog=page.get_by_role('dialog');await expect(dialog).to_be_visible();await dialog.evaluate('e=>Promise.all(e.getAnimations({subtree:true}).map(a=>a.finished.catch(()=>{})))')
   links=dialog.locator('.home-search-intents a');await expect(links).to_have_count(4 if VERSION=='before' else 6)
   guest_hrefs=await dialog.locator('a[href^="/property/search"]').evaluate_all('els=>els.map(e=>e.getAttribute("href"))');assert guest_hrefs==['/property/search?mode=rent&tenancy=short','/property/search?mode=rent&tenancy=medium','/property/search?mode=rent&tenancy=long','/property/search?mode=buy'],guest_hrefs
   await page.screenshot(path=str(OUT/f'{prefix}-chooser.png'))
   if VERSION=='after':
    for link in await links.all():await link.scroll_into_view_if_needed();assert (await link.bounding_box())['height']>=44
    selected='management' if width==1440 else 'rent';other='rent' if selected=='management' else 'management'
    await page.get_by_role('link',name=c[selected],exact=True).click();await expect(dialog).to_have_count(0)
    for label,value in [('name','Synthetic owner'),('phone','+66000000000'),('email','synthetic@example.invalid'),('message','Synthetic property; existing tenancy and individual expectations')]:await page.get_by_label(c[label],exact=False).fill(value)
    await page.get_by_role('radio',name=c[other],exact=True).click();await page.get_by_test_id('back').click();await expect(page.get_by_role('radio',name=c[selected],exact=True)).to_have_attribute('aria-checked','true');await expect(page.get_by_label(c['name'],exact=False)).to_have_value('Synthetic owner')
    await page.evaluate('scrollTo(0,0)');await page.screenshot(path=str(OUT/f'{prefix}-form.png'),full_page=True)
    for radio in await page.get_by_role('radio').all():
     geometry=await radio.evaluate('(e)=>({h:e.getBoundingClientRect().height,w:e.getBoundingClientRect().width,label:e.closest("label").getBoundingClientRect().height})');assert 14<=geometry['h']<=20 and 14<=geometry['w']<=20 and geometry['label']>=44,geometry
    await page.evaluate('window.fixtureHold=true');await page.locator('form button[type=submit]').click();await expect(page.get_by_label(c['name'],exact=False)).to_be_disabled();await page.get_by_test_id('opposite-query').click();await expect(page.get_by_role('radio',name=c[selected],exact=True)).to_have_attribute('aria-checked','true')
    await page.evaluate('window.fixtureRejectPending()');await expect(page.get_by_role('alert')).to_be_visible();await expect(page.get_by_label(c['name'],exact=False)).to_be_enabled();await expect(page.get_by_label(c['email'],exact=False)).to_have_value('synthetic@example.invalid');await expect(page.get_by_role('radio',name=c[selected],exact=True)).to_have_attribute('aria-checked','true')
    await page.evaluate('scrollTo(0,0)');await page.screenshot(path=str(OUT/f'{prefix}-failed.png'),full_page=True)
    assert len(await page.evaluate('window.fixtureLeads'))==1
    await page.evaluate('window.fixtureHold=false');await page.locator('form button[type=submit]').click();await expect(page.get_by_role('heading',name=c['saved'],exact=True)).to_be_visible();await expect(page.get_by_role('radio',name=c[other],exact=True)).to_be_disabled()
    leads=await page.evaluate('window.fixtureLeads');assert len(leads)==2 and leads[0]==leads[1],leads;assert leads[1]['vertical_metadata']=={'owner_intent':selected} and leads[1]['request_type']=='full_management' and leads[1]['entry_point']=='/owner/management-landing?intent='+selected
    await page.evaluate('scrollTo(0,0)');await page.screenshot(path=str(OUT/f'{prefix}-receipt.png'),full_page=True)
   else:
    await page.keyboard.press('Escape');await page.get_by_test_id('opposite-query').click();await page.evaluate('scrollTo(0,0)');await page.screenshot(path=str(OUT/f'{prefix}-form.png'),full_page=True)
   await page.get_by_test_id('for-owners').click();await page.evaluate('scrollTo(0,0)');await page.screenshot(path=str(OUT/f'{prefix}-options.png'),full_page=True)
   if VERSION=='after':assert '70 / 30' not in await page.locator('body').inner_text()
   await page.get_by_test_id('full-management').click();await page.evaluate('scrollTo(0,0)');await page.screenshot(path=str(OUT/f'{prefix}-existing-management.png'),full_page=True)
   assert not errors and not blocked,(errors,blocked);assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth'),'overflow'
   results.append({'lang':lang,'width':width,'guestRoutesPreserved':True,'ownerGoals':2 if VERSION=='after' else 0,'stableSyntheticRetryPayload':VERSION=='after','sourceOnlyDurability':'Not live-tested; receipt adapter only; no response-loss dedup claim','pageErrors':errors,'blocked':blocked});await context.close()
  await browser.close()
 (OUT/'evidence.json').write_text(json.dumps({'version':VERSION,'cases':results},ensure_ascii=False,indent=2)+'\n');print(json.dumps({'version':VERSION,'cases':len(results),'passed':len(results)}))
asyncio.run(main())
