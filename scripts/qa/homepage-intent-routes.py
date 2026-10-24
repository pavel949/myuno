"""Isolated actual-route integration. All reads synthetic; no authentication, checkout or delivery proof."""
import asyncio
import json
import os
import shutil
from pathlib import Path
import sys
from urllib.parse import urlencode, urlparse
from playwright.async_api import async_playwright

OUTPUT = Path(sys.argv[1])
PUBLIC_FONTS = (Path(__file__).resolve().parents[2] / 'public' / 'fonts').resolve()
CASES = [(lang, width, intent) for lang, widths in [('en', [360,390,768,1440,1920]), ('ru',[390]), ('th',[390])] for width in widths for intent in ['holiday','monthly','year','buy','owner','services']]

if os.environ.get("HOME_INTENT_ONLY"):
    CASES = [case for case in CASES if case[2] in os.environ["HOME_INTENT_ONLY"].split(",")]
    if not CASES:
        raise ValueError("Unknown HOME_INTENT_ONLY")

if os.environ.get("HOME_INTENT_LANG"):
    CASES = [case for case in CASES if case[0] == os.environ["HOME_INTENT_LANG"]]
    if not CASES:
        raise ValueError("Unknown HOME_INTENT_LANG")

if os.environ.get("HOME_INTENT_REPRESENTATIVE") == "1":
    CASES = [("en",390,"holiday"),("en",1440,"buy"),("th",390,"owner")]

async def main():
    results=[]
    async with async_playwright() as p:
        browser=await p.chromium.launch(headless=True, executable_path=shutil.which("chromium"), args=["--no-sandbox"])
        for lang,width,intent in CASES:
            context=await browser.new_context(viewport={'width':width,'height':1000},service_workers='block')
            errors=[]; blocked=[]; failed_requests=[]
            async def route(r):
                u=urlparse(r.request.url); name='fixture.html' if u.path=='/fixture' else u.path.lstrip('/')
                types={'fixture.html':'text/html','fixture.js':'text/javascript','fixture.css':'text/css','synthetic-property.svg':'image/svg+xml'}
                if u.netloc=='localhost:8080' and r.request.method=='GET' and name in types:
                    await r.fulfill(path=str(OUTPUT/name),content_type=types[name])
                elif u.netloc=='localhost:8080' and r.request.method=='GET' and u.path.startswith('/fonts/') and u.path.endswith('.woff2'):
                    font=(PUBLIC_FONTS / u.path.removeprefix('/fonts/')).resolve()
                    if font.is_relative_to(PUBLIC_FONTS) and font.is_file():
                        await r.fulfill(path=str(font),content_type='font/woff2')
                    else:
                        blocked.append({'url':r.request.url,'method':r.request.method});await r.abort()
                elif os.environ.get('HOME_INTENT_PUBLIC_FONTS')=='1' and u.scheme=='https' and u.netloc in ['fonts.googleapis.com','fonts.gstatic.com'] and r.request.method=='GET':
                    await r.continue_(headers={k:v for k,v in r.request.headers.items() if k.lower() not in ['cookie','authorization']})
                else:
                    blocked.append({'url':r.request.url,'method':r.request.method});await r.abort()
            await context.route('**/*',route)
            page=await context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
            page.on('requestfailed',lambda request:failed_requests.append({'url':request.url,'failure':request.failure}))
            row={'lang':lang,'width':width,'intent':intent,'outcome':'FAIL'}
            prefix=f'{lang}-{width}-{intent}'
            try:
                await page.goto('http://localhost:8080/fixture?'+urlencode({'lang':lang,'intent':intent}),wait_until='domcontentloaded')
                await page.locator('h1').first.wait_for();await page.evaluate('document.fonts.ready')
                if os.environ.get('HOME_INTENT_PUBLIC_FONTS')=='1':
                    await page.wait_for_function("[...document.styleSheets].some(s=>s.href?.startsWith('https://fonts.googleapis.com/') && ['','all'].includes(s.ownerNode.media))")
                    row['loadedFontFaces']=await page.evaluate('''async()=>{await Promise.all([document.fonts.load('400 16px Geist'),document.fonts.load('400 16px "Source Serif 4"')]);await document.fonts.ready;return {geist:document.fonts.check('400 16px Geist'),sourceSerif4:document.fonts.check('400 16px "Source Serif 4"'),faces:[...document.fonts].filter(f=>f.status==='loaded').map(f=>f.family)}}''')
                    assert row['loadedFontFaces']['geist'] and row['loadedFontFaces']['sourceSerif4'],row['loadedFontFaces']
                    families=[f.strip(chr(34)) for f in row['loadedFontFaces']['faces']]
                    assert 'Geist' in families and 'Source Serif 4' in families,row['loadedFontFaces']
                assert not errors, errors
                assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth'), 'page overflow'
                await page.screenshot(path=str(OUTPUT/f'{prefix}-entry.png'),full_page=True)
                if intent not in ['owner','services']:
                    filters=await page.evaluate('window.fixtureFilters');row['filters']=filters
                    assert filters['listingType']==('sale' if intent=='buy' else 'rent'),filters
                    if intent!='buy':assert filters['rentTenancy']=={'holiday':'short','monthly':'medium','year':'long'}[intent],filters
                    link=page.locator(f'a[href^="/property/synthetic-{intent}"]').first
                    await link.click()
                    await page.wait_for_function("document.querySelector('[data-testid=fixture-route]').textContent.startsWith('/property/synthetic-')")
                    await page.get_by_role('heading',name='Тестовый объект маршрута' if lang=='ru' else 'Synthetic routed home',exact=True).wait_for()
                    assert not errors,errors
                    await page.screenshot(path=str(OUTPUT/f'{prefix}-detail.png'),full_page=True)
                    if intent=='holiday':
                        cta=page.get_by_role('button',name='Забронировать' if lang=='ru' else 'Reserve',exact=True).filter(visible=True).first
                        await cta.click();await page.get_by_test_id('inquiry-boundary').wait_for()
                        assert 'checkIn=2027-11-10' in await page.get_by_test_id('fixture-route').text_content()
                        row['action']='Actual booking CTA reached isolated inquiry boundary'
                    else:
                        pattern='Request consultation' if intent=='buy' else 'สอบถามการเช่า' if lang=='th' else 'Request rental'
                        import re
                        cta=page.get_by_role('button',name=re.compile('консультац|аренд' if lang=='ru' else pattern,re.I)).filter(visible=True).first
                        await cta.click();assert await page.evaluate('window.fixtureAuthIntent')=='message-host'
                        row['action']='Actual request CTA reached captured authentication boundary'
                elif intent=='owner':
                    await page.locator('#lead-name').fill('Synthetic QA');await page.locator('#lead-phone').fill('+66000000000')
                    await page.locator('form').filter(has=page.locator('#lead-name')).locator('button[type=submit]').click()
                    await page.wait_for_function('Boolean(window.fixtureLead)');row['lead']=await page.evaluate('window.fixtureLead')
                    row['action']='Actual form validates and calls synthetic acknowledgement adapter; no delivery'
                else:row['action']='Actual services landing rendered; service booking excluded'
                assert not errors,errors
                assert not await page.evaluate('window.fixtureForbidden'), 'forbidden adapter invoked'
                assert not [r for r in blocked if r['method']!='GET'],blocked
                row['outcome']='PASS'
            except Exception as e:
                row['error']=str(e);row['pageErrors']=errors
                await page.screenshot(path=str(OUTPUT/f'{prefix}-FAIL.png'),full_page=True)
            row['failedRequests']=failed_requests;row['blockedRequests']=blocked;results.append(row);print(json.dumps(row,ensure_ascii=False),flush=True)
            await context.close()
            if os.environ.get('HOME_INTENT_PUBLIC_FONTS')=='1' and row['outcome']=='FAIL':
                break  # Stop public-font provisioning after the first failure; no bypass/retry.
        await browser.close()
    (OUTPUT/'results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
    print(f"{sum(r['outcome']=='PASS' for r in results)}/{len(results)} PASS")
    if any(r['outcome']!='PASS' for r in results):raise SystemExit(1)

asyncio.run(main())
