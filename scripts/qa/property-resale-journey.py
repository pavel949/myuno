"""Actual buyer/resale components; every browser request locally fulfilled or denied."""
import asyncio,json,sys,os,shutil
from pathlib import Path
from urllib.parse import urlparse
from playwright.async_api import async_playwright,expect
OUT=Path(sys.argv[1]);ROOT=Path.cwd();ORIGIN='http://localhost:8080'
TEXT={'en':{'filter':'Filters','type':'Property Type','villa':'Villa','area':'Area','budget':'Budget in THB','show':'Show results','retry':'Try again','resale':'Resale'},'ru':{'filter':'Фильтры','type':'Тип недвижимости','villa':'Вилла','area':'Район','budget':'Бюджет в THB','show':'Показать','retry':'Повторить','resale':'Вторичка'},'th':{'filter':'ตัวกรอง','type':'ประเภทอสังหาริมทรัพย์','villa':'วิลล่า','area':'ย่าน','budget':'งบประมาณ THB','show':'ดูผลลัพธ์','retry':'ลองอีกครั้ง','resale':'มือสอง'}}
async def main():
 results=[]
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path=None if os.environ.get('CI') else shutil.which('chromium'),headless=True,args=['--no-sandbox'])
  for lang in ['en','ru','th']:
   for width in [375,390,430,1440]:
    errors=[];blocked=[];text=TEXT[lang]
    context=await browser.new_context(viewport={'width':width,'height':640 if width==375 else 900},service_workers='block',reduced_motion='reduce')
    async def route(r):
     u=urlparse(r.request.url);name='fixture.html'if u.path=='/fixture'else u.path.lstrip('/');file=(OUT/name).resolve()
     if u.netloc=='localhost:8080' and r.request.method=='GET':
      if name=='synthetic-villa.svg' and lang=='ru' and width==390:await r.fulfill(status=404,body='Synthetic image failure');return
      if name=='synthetic-villa.svg':await r.fulfill(body='<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500"><rect width="800" height="500" fill="#dbe3df"/><path d="M100 400V200L400 60l300 140v200" fill="#8ba89a"/></svg>',content_type='image/svg+xml');return
      if file.is_relative_to(OUT.resolve()) and file.is_file():await r.fulfill(path=str(file));return
      font=(ROOT/'public'/name).resolve()
      if name.endswith(('.woff','.woff2')) and font.is_relative_to((ROOT/'public').resolve()) and font.is_file():await r.fulfill(path=str(font));return
     blocked.append({'url':r.request.url,'method':r.request.method});await r.abort()
    await context.route('**/*',route);page=await context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
    await page.goto(ORIGIN+'/fixture?lang='+lang,wait_until='networkidle');await page.locator('h1').wait_for();await page.screenshot(path=str(OUT/f'{lang}-{width}-01-buy.png'),full_page=True)
    await expect(page.locator('main a[href="/property/resale"]')).to_have_count(1);await expect(page.locator('main a[href="/property/offplan"]')).to_have_count(1)
    await page.locator('main a[href="/property/resale"]').click();active=page.get_by_role('button',name=text['resale'],exact=True);await expect(active).to_have_attribute('aria-pressed','true')
    box=await active.bounding_box();assert box['x']>=0 and box['x']+box['width']<=width+1,box
    await page.get_by_role('button',name=text['filter'],exact=False).click()
    for label,value in [(text['type'],text['villa']),(text['area'],'Равай' if lang=='ru' else 'Rawai'),(text['budget'],'THB 5,000,000–15,000,000')]:
     await page.get_by_role('combobox',name=label,exact=True).click();await page.get_by_role('option',name=value,exact=False).click()
    await page.wait_for_function('window.fixtureFilters?.min_price===5000000 && window.fixtureFilters?.max_price===15000000')
    filters=await page.evaluate('window.fixtureFilters');assert filters['zone']=='Rawai' and filters['property_type']=='villa' and filters['min_price']==5000000 and filters['max_price']==15000000,filters
    await page.get_by_role('button',name=text['show'],exact=True).scroll_into_view_if_needed();await page.screenshot(path=str(OUT/f'{lang}-{width}-02-filters.png'));await page.get_by_role('button',name=text['show'],exact=True).click()
    location=await page.get_by_test_id('location').text_content();card=page.locator('a[data-listing-id="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"]');await expect(card).to_have_count(1);await expect(page.locator('a[data-listing-id="foreign"]')).to_have_count(0)
    if lang=='ru' and width==390:await expect(page.get_by_role('img',name='Фото недоступно')).to_be_visible()
    await page.screenshot(path=str(OUT/f'{lang}-{width}-03-results.png'),full_page=True);await card.focus();await page.keyboard.press('Enter');await expect(page.get_by_role('group',name='Property sections')).to_have_count(0)
    await page.get_by_role('button',name='Go back',exact=True).click();await expect(page.get_by_test_id('location')).to_have_text(location);assert not await page.evaluate('document.documentElement.scrollWidth>innerWidth')
    assert not errors and not blocked,(errors,blocked);results.append({'lang':lang,'width':width,'outcome':'PASS','filters':filters,'keyboardDetailReturn':True,'overflow':False});await context.close();print(json.dumps({'lang':lang,'width':width,'outcome':'PASS'}),flush=True)
  await browser.close()
 (OUT/'results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2));print(json.dumps({'cases':len(results),'passed':len(results)}))
asyncio.run(main())
