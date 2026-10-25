"""Representative Thai/dark actual-component smoke; not all-language/theme acceptance."""
import asyncio,json,sys,re
from pathlib import Path
from datetime import datetime,timezone
from urllib.parse import urlparse,urlencode
from playwright.async_api import async_playwright,expect
from search_browser_selection import select_search_browser
OUT=Path(sys.argv[1])
async def main():
 rows=[]
 async with async_playwright()as p:
  selection=select_search_browser(p.chromium.executable_path)
  browser=await p.chromium.launch(executable_path=selection['executable_path'],headless=True,args=['--no-sandbox'])
  for width in [390,1180]:
   height=740 if width==390 else 757;context=await browser.new_context(viewport={'width':width,'height':height},service_workers='block',timezone_id='Pacific/Honolulu');blocked=[];errors=[];row={'language':'th','theme':'dark','width':width,'browserSelection':selection,'browserVersion':browser.version,'outcome':'FAIL'}
   async def route(r):
    u=urlparse(r.request.url);name='fixture.html'if u.path in ['/fixture','/property/search']else u.path.lstrip('/');types={'fixture.html':'text/html','fixture.js':'text/javascript','fixture.css':'text/css','synthetic-property.svg':'image/svg+xml'}
    if u.netloc=='localhost:8080'and r.request.method=='GET'and name in types:await r.fulfill(path=str(OUT/name),content_type=types[name])
    else:blocked.append(r.request.url);await r.abort()
   await context.route('**/*',route);page=await context.new_page();page.on('pageerror',lambda e:errors.append(str(e)));await page.clock.set_fixed_time(datetime(2026,10,24,23,30,tzinfo=timezone.utc));prefix=f'th-dark-{width}'
   try:
    await page.goto('http://localhost:8080/fixture?'+urlencode({'lang':'th','theme':'dark','cats':'pool','f.priceLevel':'1','checkIn':'2027-05-01','checkOut':'2027-05-03'}),wait_until='domcontentloaded');await page.evaluate('document.fonts.ready');assert await page.evaluate('document.documentElement.classList.contains("dark")');await expect(page.get_by_role('button',name='นำออก สระว่ายน้ำ',exact=True)).to_be_visible();await page.get_by_role('button',name='นำออก สระว่ายน้ำ',exact=True).screenshot(path=str(OUT/f'{prefix}-selected-pool.png'))
    sort=page.get_by_role('combobox',name='เรียงลำดับที่พัก',exact=True);await sort.click();await page.get_by_role('option',name='ราคา: ต่ำไปสูง',exact=True).click();await expect(page.get_by_test_id('location')).to_contain_text('sort=price_asc');assert json.loads(await page.get_by_test_id('navigation-state').text_content())=={'origin':'synthetic-home'}
    await page.get_by_role('button',name=re.compile('^ราคาและสิ่งอำนวยความสะดวก')).click();filters=page.get_by_role('dialog');popular=filters.get_by_role('heading',name='ความต้องการที่พัก',exact=True).locator('..');broad=popular.get_by_role('button',name='สระว่ายน้ำ',exact=True);await broad.scroll_into_view_if_needed();await expect(broad).to_have_attribute('aria-pressed','true');await filters.get_by_role('button',name='รายละเอียดประกาศ',exact=True).click();await expect(filters.get_by_role('button',name='Shared pool',exact=True)).to_have_attribute('aria-pressed','false');await page.screenshot(path=str(OUT/f'{prefix}-broad-pool.png'));tier=filters.get_by_role('button',name='฿: THB ≤ 3,000 · ต่อคืน',exact=True);await tier.scroll_into_view_if_needed();await expect(tier).to_have_attribute('aria-pressed','true');await page.screenshot(path=str(OUT/f'{prefix}-budget.png'));await page.keyboard.press('Escape');await expect(filters).to_have_count(0)
    await page.get_by_role('button',name='วันที่เข้าพัก',exact=True).click();panel=page.get_by_role('dialog');await expect(panel).to_be_visible();await panel.evaluate('(e)=>Promise.all(e.getAnimations().map(a=>a.finished))');clear=panel.get_by_role('button',name='ล้างวันที่',exact=True);close=panel.get_by_role('button',name='ปิด',exact=True);await expect(clear).to_be_visible();await expect(close).to_be_visible();r=await close.bounding_box();c=await panel.bounding_box();assert r and c and r['y']+r['height']<=min(height,c['y']+c['height'])+.5;row['calendarPaint']=await panel.evaluate('(e)=>({background:getComputedStyle(e).backgroundColor,color:getComputedStyle(e).color})');await page.screenshot(path=str(OUT/f'{prefix}-calendar.png'));await close.click();await expect(panel).to_have_count(0);assert not errors and not blocked,(errors,blocked);assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth');row['outcome']='PASS'
   except Exception as e:row['error']=str(e);row['pageErrors']=errors;row['blocked']=blocked;await page.screenshot(path=str(OUT/f'{prefix}-FAIL.png'))
   rows.append(row);print(json.dumps(row),flush=True);await context.close()
  await browser.close()
 (OUT/'thai-dark-smoke-results.json').write_text(json.dumps({'cases':rows,'limits':['Only Thai/dark at390/1180; not every locale/theme combination','Actual page/filter/calendar with synthetic readers, fallback fonts; no production/full App-header acceptance']},ensure_ascii=False,indent=2));assert all(r['outcome']=='PASS'for r in rows)
asyncio.run(main())
