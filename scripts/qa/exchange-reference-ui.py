"""Read-only FX page with synthetic canonical RPC and all network denied."""
import asyncio,json,sys,os
from pathlib import Path
from urllib.parse import urlparse
from playwright.async_api import async_playwright,expect
OUTPUT=Path(sys.argv[1])
async def main():
 rows=[]
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True, **({'executable_path': os.environ['PLAYWRIGHT_CHROMIUM_EXECUTABLE']} if os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE') else {}))
  for lang in ['ru','en','th']:
   for width in [390,1440]:
    for state in ['data','empty','error']:
     context=await browser.new_context(viewport={'width':width,'height':900},service_workers='block')
     async def route(r):
      u=urlparse(r.request.url);name='fixture.html' if u.path=='/fixture' else u.path.lstrip('/')
      types={'fixture.html':'text/html','fixture.js':'text/javascript','fixture.css':'text/css'}
      if u.netloc=='localhost:8080' and name in types: await r.fulfill(path=str(OUTPUT/name),content_type=types[name])
      else: await r.abort()
     await context.route('**/*',route)
     page=await context.new_page();errors=[]
     page.on('pageerror',lambda e:errors.append(str(e)))
     await page.goto(f'http://localhost:8080/fixture?lang={lang}&state={state}',wait_until='networkidle')
     if state=='data':
      await expect(page.locator('output')).to_contain_text('THB')
      await page.get_by_role('combobox').select_option('EUR')
      assert await page.locator('time').get_attribute('datetime')=='2026-10-02T00:00:00Z'
      await page.get_by_role('spinbutton').fill('-2')
      await expect(page.locator('output')).to_have_text('—')
      await page.get_by_role('spinbutton').fill('200')
      await expect(page.locator('output')).to_contain_text('THB')
      await page.get_by_role('combobox').focus()
      assert await page.get_by_role('combobox').evaluate('(e)=>document.activeElement===e')
     elif state=='error':await expect(page.get_by_role('alert')).to_be_visible()
     else:await expect(page.get_by_role('status')).to_be_visible()
     assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(lang,width,state,'overflow')
     assert not errors,errors
     await page.screenshot(path=str(OUTPUT/f'{lang}-{width}-{state}.png'),full_page=True)
     rows.append({'lang':lang,'width':width,'state':state,'outcome':'PASS'})
     await context.close()
  await browser.close()
 (OUTPUT/'results.json').write_text(json.dumps(rows,indent=2));print(json.dumps(rows))
asyncio.run(main())
