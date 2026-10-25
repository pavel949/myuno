"""Actual controls; synthetic actors/data, local fixture bytes, no external transport."""
import asyncio,json,os,shutil
from pathlib import Path
from urllib.parse import urlparse
from playwright.async_api import async_playwright,expect

OUT=Path(os.environ.get('DS_CONTROLS_OUTPUT','/tmp/browser/ds-controls')).resolve()
async def main():
 evidence=[]
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True,executable_path=None if os.environ.get('CI') else shutil.which('chromium'),args=['--no-sandbox'])
  for width in [390,1280]:
   context=await browser.new_context(viewport={'width':width,'height':900},service_workers='block')
   page=await context.new_page();errors=[];blocked=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   async def route(r):
    u=urlparse(r.request.url);name='index.html' if u.path=='/' else u.path.lstrip('/')
    if u.netloc=='127.0.0.1:8917' and r.request.method=='GET' and name in ['index.html','fixture.css','fixture.js']:
     await r.fulfill(path=str(OUT/name),content_type='text/html' if name.endswith('.html') else 'text/css' if name.endswith('.css') else 'application/javascript')
    else:blocked.append(r.request.url);await r.abort()
   await context.route('**/*',route)
   await page.goto('http://127.0.0.1:8917',wait_until='networkidle')
   villa=page.get_by_role('button',name='Villa One');await villa.focus();await page.keyboard.press('Space');await expect(villa).to_have_attribute('aria-pressed','true')
   await page.screenshot(path=str(OUT/f'controls-{width}.png'),full_page=True)
   for name in ['Cherehapa','SafetyWing']:
    link=page.get_by_role('link',name=name,exact=False);await link.focus();await page.keyboard.press('Enter')
   assert await page.evaluate('window.fixtureCalls.length')==2,'Partner keyboard callback mismatch'
   await page.get_by_role('link',name='Delegated Villa',exact=False).focus();await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab')
   await page.screenshot(path=str(OUT/f'delegated-focus-{width}.png'))
   await page.goto('http://127.0.0.1:8917?vendor',wait_until='networkidle')
   await page.get_by_label('Name (EN)',exact=True).fill('Synthetic Vendor')
   await page.get_by_text('Phone',exact=True).click()
   assert await page.get_by_label('Phone',exact=True).evaluate('(el)=>el===document.activeElement'),'Phone label did not focus field'
   await page.screenshot(path=str(OUT/f'vendor-{width}.png'))
   await page.get_by_role('button',name='Save',exact=True).scroll_into_view_if_needed()
   await page.screenshot(path=str(OUT/f'vendor-footer-{width}.png'))
   assert not errors and not blocked,(errors,blocked)
   evidence.append({'width':width,'keyboardPartnerActivations':2,'propertySpaceToggle':True,'vendorLabelFocus':True,'mode':'isolated actual controls, no live authority or writes'})
   await context.close()
  await browser.close()
 (OUT/'evidence.json').write_text(json.dumps(evidence,indent=2)+'\n');print(json.dumps(evidence))
asyncio.run(main())
