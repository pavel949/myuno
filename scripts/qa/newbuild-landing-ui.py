import asyncio,json,os,sys,threading
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from playwright.async_api import async_playwright,expect
out=Path(sys.argv[1]);rows=[]
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
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
    await page.goto(f'{base}/fixture.html?lang={lang}');await expect(page.locator('#newbuild-title')).to_be_visible();await page.evaluate('document.fonts.ready')
    for id in ['goals','clearview','areas','projects','updates','developers','selection','guide','help','life']:await expect(page.locator('#newbuild-'+id)).to_have_count(1)
    await expect(page.locator('#newbuild-projects [data-project-id]')).to_have_count(1);await expect(page.locator('#newbuild-developers a[href="/property/developers/synthetic-developer"]')).to_have_count(1)
    await expect(page.locator('#newbuild-life a[href="/experiences"]')).to_have_count(1);await expect(page.locator('#newbuild-life a[href="/discover/services"]')).to_have_count(1)
    assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth'),f'overflow {lang}/{width}'
    assert not await page.locator('#newbuild-projects').filter(has_text='2028').count()
    await page.screenshot(path=str(out/f'{lang}-{width}.png'),full_page=True)
    await page.locator('.newbuild-search input').fill('Synthetic & home');await page.locator('select[name="district"]').select_option('Bang Tao');await page.locator('select[name="budget"]').select_option('10to20');await page.locator('.newbuild-search button[type="submit"]').click()
    await expect(page.get_by_test_id('location')).to_contain_text('/property/offplan/search?q=Synthetic+%26+home&district=Bang+Tao&budget=10to20')
    assert not blocked,blocked
    assert not errors,errors
    rows.append({'language':lang,'width':width,'status':'PASS','noExternalRequests':True,'canonicalSearch':'PASS'});await context.close()
  for state in ['loading','empty','error','developer-empty','developer-error']:
   blocked=[];context=await browser.new_context(viewport={'width':375,'height':900},service_workers='block');page=await context.new_page()
   async def deny(r):
    if r.request.url.startswith(base+'/'):await r.continue_()
    else:blocked.append(r.request.url);await r.abort()
   await context.route('**/*',deny);await page.goto(f'{base}/fixture.html?lang=en&state={state}')
   section=page.locator('#newbuild-developers' if state.startswith('developer-') else '#newbuild-projects')
   if state=='loading':await expect(section.get_by_role('status')).to_contain_text('Loading public information')
   elif state.endswith('empty'):await expect(section).to_contain_text('There are no published entries')
   else:
    await expect(section.get_by_role('alert')).to_be_visible();await section.get_by_role('button',name='Try again',exact=True).click();await expect(section.get_by_role('alert')).to_have_count(0)
    await expect(section.locator('[data-project-id]' if state=='error' else '.newbuild-developer')).to_have_count(1)
   assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   assert not blocked,blocked
   rows.append({'state':state,'status':'PASS'});await context.close()
  await browser.close()
try:asyncio.run(main())
finally:server.shutdown()
(out/'results.json').write_text(json.dumps(rows,indent=2));print(json.dumps(rows))
