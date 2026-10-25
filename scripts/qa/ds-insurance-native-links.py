"""Pinned Python Playwright driver; actual native navigation, partner URLs fulfilled locally."""
import asyncio,json,os,shutil,sys
from pathlib import Path
from urllib.parse import urlparse
from playwright.async_api import async_playwright,expect
from ds_insurance_transport_guard import denying_proxy

OUT=Path(sys.argv[1]); VERSION=sys.argv[2]
ORIGIN='http://127.0.0.1:8921'
PARTNERS={'Cherehapa':'https://cherehapa.ru/country/thailand?partnerid=MYUNO','SafetyWing':'https://safetywing.com/nomad-insurance?referenceID=myuno'}
PARTNER_HTML='''<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><h1>Locally intercepted partner navigation</h1><p>No partner server contacted.</p><pre id="evidence"></pre><script>document.getElementById('evidence').textContent=JSON.stringify({url:location.href,openerIsNull:window.opener===null,referrer:document.referrer},null,2)</script>'''

async def main():
 results=[]
 with denying_proxy() as guard:
  async with async_playwright() as p:
   browser=await p.chromium.launch(headless=True,executable_path=None if os.environ.get('CI') else shutil.which('chromium'),args=['--no-sandbox','--disable-background-networking','--dns-prefetch-disable'],proxy={'server':guard.url,'bypass':'<-loopback>'})
   for width in [390,1280]:
    for name,url in PARTNERS.items():
     for mode in ['click','keyboard','control-click']:
      context=await browser.new_context(viewport={'width':width,'height':900},service_workers='block'); errors=[]; blocked=[]; partner_reads=[]
      context.on('page',lambda page:page.on('pageerror',lambda e:errors.append(str(e))))
      async def route(r):
       parsed=urlparse(r.request.url);file=parsed.path.lstrip('/')
       if r.request.url.startswith(ORIGIN+'/') and file in ['fixture.html','fixture.js','fixture.css'] and r.request.method=='GET':
        await r.fulfill(path=str(OUT/file),content_type='text/html' if file.endswith('.html') else 'application/javascript' if file.endswith('.js') else 'text/css')
       elif r.request.url in PARTNERS.values() and r.request.method=='GET':
        partner_reads.append({'url':r.request.url,'referer':r.request.headers.get('referer')});await r.fulfill(status=200,body=PARTNER_HTML,content_type='text/html')
       else:blocked.append(r.request.url);await r.abort()
      await context.route('**/*',route);page=await context.new_page();await page.goto(ORIGIN+'/fixture.html',wait_until='networkidle')
      link=page.get_by_role('link',name=name,exact=False);await expect(link).to_have_attribute('href',url);await expect(link).to_have_attribute('target','_blank');await expect(link).to_have_attribute('rel','noopener noreferrer')
      if name=='Cherehapa' and mode=='click':await page.screenshot(path=str(OUT/f'page-{width}.png'),full_page=True)
      proxy_start=len(guard.requests)
      async with context.expect_page() as new_page:
       if mode=='keyboard':await link.focus();await page.keyboard.press('Enter')
       elif mode=='control-click':await link.click(modifiers=['Control'])
       else:await link.click()
      partner=await new_page.value;await partner.wait_for_load_state('domcontentloaded');locally_fulfilled=await partner.get_by_role('heading',name='Locally intercepted partner navigation').count()==1
      facts=await partner.evaluate('({url:location.href,openerIsNull:window.opener===null,referrer:document.referrer})') if locally_fulfilled else {'url':partner.url,'openerReferrerRuntime':'UNVERIFIED — local fulfillment missed; denying proxy contained transport'}
      marker=await page.evaluate("sessionStorage.getItem('insurance_redirect')");clicks=await page.evaluate('window.fixtureClicks');native_open=await page.evaluate("Function.prototype.toString.call(window.open).includes('[native code]')")
      assert native_open and not errors,(facts,partner_reads,errors)
      proxy_attempts=guard.requests[proxy_start:]
      if locally_fulfilled:assert partner.url==url and len(partner_reads)==1,(partner.url,partner_reads)
      else:assert any(f"CONNECT {urlparse(url).netloc}:443 " in item['requestLine'] for item in proxy_attempts),proxy_attempts
      assert marker=='true','Redirect tracking intent lost'
      if VERSION=='after':
       if locally_fulfilled:
        assert facts['openerIsNull'] and facts['referrer']=='',(mode,facts)
        assert partner_reads[0]['referer'] is None,partner_reads
       assert len(clicks)==1 and not clicks[0]['prevented'],clicks
      if name=='Cherehapa' and mode=='click':await partner.screenshot(path=str(OUT/f'partner-{width}.png'))
      results.append({'width':width,'partner':name,'mode':mode,'nativeWindowOpenUnmodified':native_open,'trackingMarker':marker,'clicks':clicks,'partnerDocument':facts,'intendedHref':url,'localProxyAttempts':proxy_attempts,'locallyFulfilled':locally_fulfilled,'interceptedRequest':partner_reads[0] if partner_reads else None,'blocked':blocked,'pageErrors':errors})
      await context.close()
   await browser.close()
 (OUT/'evidence.json').write_text(json.dumps({'version':VERSION,'transport':'Known URLs fulfilled by BrowserContext.route where available; missed interception blocked by localhost-only denying proxy with no upstream forwarding. Error-page opener/referrer NOT used as evidence. Native browser navigation; no window.open stub.','deniedProxyRequests':guard.requests,'results':results},indent=2)+'\n')
 print(json.dumps({'version':VERSION,'cases':len(results),'locallyFulfilled':sum(r['locallyFulfilled'] for r in results),'unverifiedOpenerReferrer':sum(not r['locallyFulfilled'] for r in results),'openerNull':sum(r['partnerDocument'].get('openerIsNull',False) for r in results),'emptyReferrer':sum(r['partnerDocument'].get('referrer')=='' for r in results)}))
asyncio.run(main())
