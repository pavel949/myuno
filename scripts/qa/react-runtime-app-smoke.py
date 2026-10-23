"""Actual main/App smoke against a synthetic localhost-only backend.

Start Vite on 127.0.0.1:8085 with the synthetic URL/key documented in
REACT_19_COMPATIBILITY_2026_10_21.md. All external and POST requests are
aborted; no authentication request is submitted. This does not certify RLS.
"""
import asyncio,json,re,os
from pathlib import Path
from playwright.async_api import async_playwright,expect
OUT=Path(os.environ.get('REACT_RUNTIME_OUTPUT','/tmp/browser/react19-app-entry'))
OUT.mkdir(parents=True,exist_ok=True)
async def main():
 results=[]
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True,executable_path=os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE'))
  for width in [390,1440]:
   context=await browser.new_context(viewport={'width':width,'height':900},service_workers='block')
   errors=[]; blocked=[]; reads=[]
   async def route(r):
    u=r.request.url
    if u.startswith('http://127.0.0.1:8085/') and r.request.method in ['GET','HEAD']:
     await r.continue_();return
    if u.startswith('http://127.0.0.1:54321/') and r.request.method=='GET':
     reads.append(u);await r.fulfill(status=200,content_type='application/json',body='[]');return
    blocked.append({'url':u,'method':r.request.method});await r.abort()
   await context.route('**/*',route)
   await context.add_init_script("localStorage.setItem('myuno-cookie-consent',JSON.stringify({essential:true,analytics:false,functional:false,marketing:false,timestamp:new Date().toISOString()}));")
   page=await context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
   await page.goto('http://127.0.0.1:8085/',wait_until='domcontentloaded',timeout=90000)
   await expect(page.locator('#home-title')).to_be_visible(timeout=90000)
   await expect(page).to_have_title(re.compile('myUNO'))
   assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth'),width
   await page.screenshot(path=str(OUT/f'public-{width}.png'))
   opener=page.get_by_role('button',name='Talk to our team',exact=True)
   await opener.click()
   dialog=page.get_by_role('dialog');await expect(dialog).to_be_visible()
   await page.screenshot(path=str(OUT/f'help-sheet-{width}.png'))
   await page.keyboard.press('Escape');await expect(dialog).to_have_count(0)
   await expect(opener).to_be_focused()
   await page.keyboard.press('Enter')
   await expect(page.get_by_role('dialog')).to_be_visible()
   await page.keyboard.press('Escape')
   await expect(page.get_by_role('dialog')).to_have_count(0)
   await expect(opener).to_be_focused()
   results.append({'case':'actual-help-keyboard-opener-and-return','width':width,'outcome':'PASS'})
   results.append({'case':'actual-main-app-public-head-and-help-sheet','width':width,'outcome':'PASS','errors':list(errors),'synthetic_get_reads':len(reads)})
   await page.goto('http://127.0.0.1:8085/mc/properties',wait_until='domcontentloaded',timeout=90000)
   await page.wait_for_url(re.compile('/auth(?:[/?#]|$)'),timeout=60000)
   await expect(page.locator('input[type="email"]')).to_be_visible(timeout=60000)
   assert '/mc/properties' in page.url or '%2Fmc%2Fproperties' in page.url,page.url
   await page.screenshot(path=str(OUT/f'private-auth-gate-{width}.png'))
   assert not errors,errors
   results.append({'case':'actual-private-route-preserves-auth-gate','width':width,'outcome':'PASS','url':page.url,'errors':errors,'blocked_external_or_post':blocked})
   await context.close()
  await browser.close()
 OUT.joinpath('results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
 print(json.dumps(results,ensure_ascii=False))
asyncio.run(main())
