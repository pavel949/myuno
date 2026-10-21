"""Actual main/App with synthetic localhost backend; no external calls or writes."""
import argparse,asyncio,json,os,re,subprocess
from datetime import datetime,timezone
from pathlib import Path
from urllib.parse import urlparse,parse_qs
from playwright.async_api import async_playwright,expect
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('output',type=Path,nargs='?',default=Path('/tmp/browser/dependency-family-app'))
parser.add_argument('--widths',type=int,nargs='+',default=[390,768,1440])
parser.add_argument('--states',choices=['empty','error'],nargs='+',default=['empty','error'])
args=parser.parse_args()
ROOT=Path.cwd()
assert (ROOT/'src/main.tsx').is_file(), 'Run from the repository root'
OUT=args.output;OUT.mkdir(parents=True,exist_ok=True)
ORIGIN='http://127.0.0.1:8084'
async def main():
 results=[]
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True,executable_path=os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE','/usr/bin/chromium'))
  for state in args.states:
   for width in args.widths:
    context=await browser.new_context(viewport={'width':width,'height':900},service_workers='block',reduced_motion='reduce')
    errors=[];blocked=[];reads=[];sockets=[]
    async def route(r):
     u=r.request.url;m=r.request.method
     if u.startswith(ORIGIN+'/') and m in ['GET','HEAD']:
      await r.continue_();return
     if u.startswith('http://127.0.0.1:54321/') and m=='GET':
      reads.append(u)
      await r.fulfill(status=200 if state=='empty' else 500,content_type='application/json',body='[]' if state=='empty' else '{"message":"Synthetic catalog read unavailable","code":"XX000"}')
      return
     blocked.append({'url':u,'method':m});await r.abort()
    async def socket(ws):
     sockets.append(ws.url);await ws.close()
    await context.route('**/*',route)
    await context.route_web_socket('**/*',socket)
    await context.add_init_script("localStorage.setItem('myuno-cookie-consent',JSON.stringify({essential:true,analytics:false,functional:false,marketing:false,timestamp:new Date().toISOString()}));localStorage.setItem('myuno-language','en');")
    page=await context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
    await page.clock.install(time=datetime(2026,10,18,18,30,tzinfo=timezone.utc))
    await page.goto(ORIGIN+'/',wait_until='domcontentloaded',timeout=90000)
    await expect(page.locator('#home-title')).to_be_visible(timeout=90000)
    await expect(page).to_have_title(re.compile('myUNO'))
    assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth'),{'width':width,'state':state}
    if state=='error':
     await expect(page.get_by_role('alert')).to_have_count(5,timeout=30000)
    else:
     await expect(page.get_by_text('No published experiences yet. Check back later.')).to_be_visible(timeout=30000)
    await page.screenshot(path=str(OUT/f'{state}-{width}-homepage.png'),full_page=True,animations='disabled')
    if state=='empty':
     trigger=page.locator('.home-search-entry-button')
     await trigger.press('Enter')
     await expect(page.locator('.home-search-sheet h2')).to_be_focused()
     await page.screenshot(path=str(OUT/f'{state}-{width}-search-entry.png'),animations='disabled')
     await page.locator('.home-search-intents button').nth(0).click()
     await expect(page.locator('.home-search-sheet select')).to_have_count(0)
     await page.screenshot(path=str(OUT/f'{state}-{width}-holiday-step.png'),animations='disabled')
     dates=page.get_by_role('button',name='Stay dates',exact=True)
     await dates.press('Enter')
     calendar=page.get_by_role('dialog',name='Stay dates',exact=True)
     await expect(calendar).to_be_visible()
     start=calendar.locator('[data-day="2026-10-20"] button')
     if width>=768:
      assert await start.evaluate('el=>{const b=el.getBoundingClientRect(),hit=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2);return hit===el||el.contains(hit)}'), 'Calendar start day is covered by another layer'
      await start.click(timeout=5000)
     else: await start.press('Enter')
     await calendar.locator('[data-day="2026-10-23"] button').press('Space')
     await expect(calendar).to_have_count(0);await expect(dates).to_be_focused()
     await dates.press('Enter')
     for day in ['20','22','23']:
      await expect(calendar.locator(f'[data-day="2026-10-{day}"]')).to_have_attribute('aria-selected','true')
     box=await calendar.bounding_box();assert box['x']>=0 and box['x']+box['width']<=width+1,box
     assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth')
     await expect(calendar.locator('div.border-t')).to_have_css('padding','12px')
     await page.screenshot(path=str(OUT/f'{state}-{width}-calendar-range.png'),animations='disabled')
     await page.keyboard.press('Escape');await expect(dates).to_be_focused()
     await page.locator('.home-search-sheet .home-search-submit').click()
     await page.wait_for_url(re.compile('/property/search\\?.*checkIn=2026-10-20.*checkOut=2026-10-23'),timeout=10000)
     await expect(page.get_by_role('heading',name='Find your home in Phuket',exact=True)).to_be_visible(timeout=30000)
     await expect(page.get_by_role('heading',name='No properties found',exact=True)).to_be_visible(timeout=30000)
     await page.screenshot(path=str(OUT/f'{state}-{width}-search-results.png'),full_page=True,animations='disabled')
     query=parse_qs(urlparse(page.url).query)
     assert query['mode']==['rent'] and query['tenancy']==['short'] and 'district' not in query and 'guests' not in query,query
    if state=='error':
     await page.goto(ORIGIN+'/property/search?mode=rent',wait_until='domcontentloaded')
     await expect(page.get_by_role('heading',name='Homes could not be loaded',exact=True)).to_be_visible(timeout=30000)
     await page.screenshot(path=str(OUT/f'{state}-{width}-search-results.png'),full_page=True,animations='disabled')
    if width in [390,1440]:
     await page.goto(ORIGIN+'/discover/services?category=ac&q=cleaning',wait_until='domcontentloaded')
     await expect(page.get_by_role('heading',name='Home service requests',exact=True)).to_be_visible(timeout=30000)
     await expect(page.get_by_text('AC Cleaning',exact=True)).to_be_visible()
     assert await page.get_by_role('combobox',name='Request category').inner_text()=='Air Conditioning'
     assert parse_qs(urlparse(page.url).query)=={'category':['ac'],'q':['cleaning']}
     if state=='error': await expect(page.get_by_text('Could not load services.',exact=True)).to_be_visible(timeout=30000)
     else: await expect(page.get_by_text('Online booking is not available yet. Choose a home service or describe your task.',exact=True)).to_be_visible(timeout=30000)
     await expect(page.locator('span.p-4').first).to_have_css('padding','16px')
     await expect(page.locator('section[aria-labelledby=service-help-title]')).to_have_css('padding','20px' if width==390 else '24px')
     assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth')
     await page.screenshot(path=str(OUT/f'{state}-{width}-cold-services.png'),full_page=True,animations='disabled')
    assert not errors,errors
    results.append({'state':state,'width':width,'outcome':'PASS','source_head':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'runtime_errors':errors,'synthetic_get_reads':len(reads),'blocked_external_or_non_get':blocked,'blocked_websockets':sockets})
    OUT.joinpath('results.partial.json').write_text(json.dumps(results,indent=2))
    await context.close()
  await browser.close()
 OUT.joinpath('results.json').write_text(json.dumps(results,indent=2));print(json.dumps(results,indent=2))
asyncio.run(main())
