"""Actual controls; synthetic actors/data, local fixture bytes, no external transport."""
import asyncio,json,os,shutil
from pathlib import Path
from urllib.parse import urlparse
from playwright.async_api import async_playwright,expect
from ds_insurance_transport_guard import denying_proxy

OUT=Path(os.environ.get('DS_CONTROLS_OUTPUT','/tmp/browser/ds-controls')).resolve()
PARTNERS={'Cherehapa':'https://cherehapa.ru/country/thailand?partnerid=MYUNO','SafetyWing':'https://safetywing.com/nomad-insurance?referenceID=myuno'}
async def main():
 evidence=[]
 with denying_proxy() as guard:
  async with async_playwright() as p:
   browser=await p.chromium.launch(headless=True,executable_path=None if os.environ.get('CI') else shutil.which('chromium'),args=['--no-sandbox','--disable-background-networking','--dns-prefetch-disable'],proxy={'server':guard.url,'bypass':'<-loopback>'})
   for width in [390,1280]:
    context=await browser.new_context(viewport={'width':width,'height':900},service_workers='block')
    page=await context.new_page();errors=[];blocked=[];partner_evidence=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    async def route(r):
     u=urlparse(r.request.url);name='index.html' if u.path=='/' else u.path.lstrip('/')
     if u.netloc=='127.0.0.1:8917' and r.request.method=='GET' and name in ['index.html','fixture.css','fixture.js']:
      await r.fulfill(path=str(OUT/name),content_type='text/html' if name.endswith('.html') else 'text/css' if name.endswith('.css') else 'application/javascript')
     elif r.request.url in PARTNERS.values() and r.request.method=='GET':
      await r.fulfill(content_type='text/html',body='<h1>Locally intercepted partner</h1>')
     else:blocked.append(r.request.url);await r.abort()
    await context.route('**/*',route)
    await page.goto('http://127.0.0.1:8917',wait_until='networkidle')
    villa=page.get_by_role('button',name='Villa One');await villa.focus();await page.keyboard.press('Space');await expect(villa).to_have_attribute('aria-pressed','true')
    await page.screenshot(path=str(OUT/f'controls-{width}.png'),full_page=True)
    for name,url in PARTNERS.items():
     link=page.get_by_role('link',name=name,exact=False);await expect(link).to_have_attribute('href',url)
     proxy_start=len(guard.requests)
     async with context.expect_page() as popup:
      await link.focus();await page.keyboard.press('Enter')
     partner=await popup.value;await partner.wait_for_load_state('domcontentloaded')
     locally_fulfilled=await partner.get_by_role('heading',name='Locally intercepted partner',exact=True).count()==1
     if locally_fulfilled:assert partner.url==url and await partner.evaluate("window.opener===null && document.referrer===''"),'Native partner isolation mismatch'
     else:assert any(f"CONNECT {urlparse(url).netloc}:443 " in item['requestLine'] for item in guard.requests[proxy_start:]),'Unexpected popup destination'
     partner_evidence.append({'intendedHref':url,'locallyFulfilled':locally_fulfilled,'openerReferrer':'verified on local partner document' if locally_fulfilled else 'UNVERIFIED; localhost denying proxy contained navigation'})
     assert await page.evaluate("sessionStorage.getItem('insurance_redirect')")== 'true','Redirect marker lost'
     await partner.close()
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
    evidence.append({'width':width,'keyboardPartnerActivations':2,'partnerEvidence':partner_evidence,'propertySpaceToggle':True,'vendorLabelFocus':True,'mode':'isolated actual controls, native partner navigation, no live authority or writes; missing local partner fulfillment is UNVERIFIED for opener/referrer'})
    await context.close()
   await browser.close()
 (OUT/'evidence.json').write_text(json.dumps(evidence,indent=2)+'\n');print(json.dumps(evidence))
asyncio.run(main())
