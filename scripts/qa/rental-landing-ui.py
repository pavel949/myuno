import asyncio,json,os,sys,threading
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from playwright.async_api import async_playwright,expect
out=Path(sys.argv[1]); rows=[]
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args): pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(out)))
threading.Thread(target=server.serve_forever,daemon=True).start();base=f'http://127.0.0.1:{server.server_port}'
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH'),headless=True,args=['--no-sandbox'])
  for lang in ['ru','en','th']:
   for width in [375,768,1440]:
    blocked=[];errors=[]
    context=await browser.new_context(viewport={'width':width,'height':900},service_workers='block')
    async def route(r):
     if r.request.url.startswith(base+'/'):await r.continue_()
     else:blocked.append(r.request.url);await r.abort()
    await context.route('**/*',route);page=await context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
    await page.goto(f'{base}/fixture.html?lang={lang}');await expect(page.locator('#rental-title')).to_be_visible()
    await page.evaluate('document.fonts.ready');await expect(page.locator('.rental-community')).to_have_count(1)
    assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth'),f'overflow {lang}/{width}'
    for id in ['rental-areas','rental-communities','rental-search','rental-guide','rental-life']:await expect(page.locator('#'+id)).to_have_count(1)
    await expect(page.locator('#rental-life a[href="/experiences"]')).to_have_count(1);await expect(page.locator('#rental-life a[href="/discover/services"]')).to_have_count(1)
    assert await page.evaluate('window.fixtureRentRead.filters.listingType')=='rent'
    assert await page.evaluate('window.fixtureProjectRead.ids')==['synthetic-community']
    await page.screenshot(path=str(out/f'{lang}-{width}.png'),full_page=True)
    # Native controls use the existing canonical search; optional dates stay absent.
    await page.locator('#rental-search input[type="search"]').fill('Synthetic home')
    await page.locator('#rental-search button[type="submit"]').click()
    await expect(page.get_by_test_id('location')).to_contain_text('/property/search?mode=rent')
    await expect(page.get_by_test_id('location')).to_contain_text('q=Synthetic+home')
    assert not blocked,blocked
    assert not errors,errors
    rows.append({'language':lang,'width':width,'status':'PASS','noExternalRequests':True,'sharedSearch':'PASS'})
    await context.close()
  for state in ['loading','empty','error']:
   context=await browser.new_context(viewport={'width':375,'height':900},service_workers='block');page=await context.new_page()
   async def deny(r):
    if r.request.url.startswith(base+'/'):await r.continue_()
    else:raise AssertionError('External request in state acceptance')
   await context.route('**/*',deny);await page.goto(f'{base}/fixture.html?lang=en&state={state}')
   if state=='loading':await expect(page.get_by_role('status')).to_contain_text('Loading communities')
   elif state=='empty':await expect(page.locator('#rental-communities')).to_contain_text('This selection has no communities')
   else:
    await expect(page.get_by_role('alert')).to_be_visible();await page.get_by_role('button',name='Try again',exact=True).click();await expect(page.locator('.rental-community')).to_have_count(1);await expect(page.get_by_role('alert')).to_have_count(0)
   assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   rows.append({'state':state,'status':'PASS'});await context.close()
  await browser.close()
try:asyncio.run(main())
finally:server.shutdown()
(out/'results.json').write_text(json.dumps(rows,indent=2));print(json.dumps(rows))
