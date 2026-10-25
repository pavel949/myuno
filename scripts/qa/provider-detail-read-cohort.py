"""Actual public provider page/hook with synthetic adapters, denied external/write transport."""
import asyncio,json,re,sys
from pathlib import Path
from urllib.parse import urlparse
from playwright.async_api import async_playwright,expect
OUT=Path(sys.argv[1]);BEFORE='--before' in sys.argv
async def main():
 rows=[]
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None,headless=True,args=['--no-sandbox'])
  cases=[('en',390,c) for c in ['initial-error','service-error','switch-error','late-A','empty']] if BEFORE else [(lang,width,c) for lang,width in [('en',390),('en',1440),('ru',390),('th',390)] for c in ['initial-error','service-error','switch-error','late-A','empty','background-error','background-service-error']]
  for lang,width,case in cases:
   context=await browser.new_context(viewport={'width':width,'height':844},service_workers='block');blocked=[];errors=[]
   async def route(r):
    u=urlparse(r.request.url);name='fixture.html'if u.path=='/fixture'else u.path.lstrip('/');types={'fixture.html':'text/html','fixture.js':'text/javascript','fixture.css':'text/css','provider.svg':'image/svg+xml'}
    if u.netloc=='localhost:8080'and r.request.method=='GET'and name in types:await r.fulfill(path=str(OUT/name),content_type=types[name])
    else:blocked.append(r.request.url);await r.abort()
   await context.route('**/*',route);page=await context.new_page();page.on('pageerror',lambda e:errors.append(str(e)));prefix=f'{lang}-{width}-{case}';row={'case':case,'language':lang,'width':width,'mode':'synthetic boundaries, actual page/hook','before':BEFORE}
   try:
    await page.goto('http://localhost:8080/fixture?case='+case+'&lang='+lang,wait_until='domcontentloaded')
    if case=='initial-error':await expect(page.get_by_text({'en':'Provider not found','ru':'Мастер не найден','th':'ไม่พบผู้ให้บริการ'}[lang],exact=True)if BEFORE else page.get_by_role('alert')).to_be_visible()
    if case=='service-error':await expect(page.get_by_role('heading',name='Synthetic provider A',exact=True)).to_be_visible();await expect(page.get_by_text('No services yet',exact=True)if BEFORE else page.get_by_role('alert')).to_be_visible()
    if case=='switch-error':
     await expect(page.get_by_role('heading',name='Synthetic provider A',exact=True)).to_be_visible();await page.get_by_role('button',name='Read B',exact=True).click();await expect(page.get_by_test_id('route')).to_contain_text('/B?');await expect(page.get_by_role('heading',name='Synthetic provider A',exact=True)if BEFORE else page.get_by_role('alert')).to_be_visible()
    if case=='late-A':
     await page.wait_for_function('typeof window.fixtureResolveA==="function"');await page.get_by_role('button',name='Read B',exact=True).click();await expect(page.get_by_role('heading',name='Synthetic provider B',exact=True)).to_be_visible();await page.get_by_role('button',name='Resolve A',exact=True).click();await expect(page.get_by_role('heading',name='Synthetic provider A'if BEFORE else'Synthetic provider B',exact=True)).to_be_visible()
    if case=='empty':await expect(page.get_by_text({'en':'Provider not found','ru':'Мастер не найден','th':'ไม่พบผู้ให้บริการ'}[lang],exact=True)).to_be_visible()
    book='Записаться' if lang=='ru' else 'Book';retry={'en':'Try again','ru':'Повторить','th':'ลองอีกครั้ง'}[lang]
    if not BEFORE and case in ['initial-error','service-error','switch-error']:
     await page.screenshot(path=str(OUT/f'{prefix}-read-error.png'),full_page=True)
     await page.get_by_role('button',name='Recover reads',exact=True).click();await page.get_by_role('button',name=retry,exact=True).click();expected='B'if case=='switch-error'else'A';await expect(page.get_by_role('heading',name='Synthetic provider '+expected,exact=True)).to_be_visible();await expect(page.get_by_role('alert')).to_have_count(0)
     await page.get_by_role('button',name='В корзину'if lang=='ru'else'Add',exact=True).click();calls=await page.evaluate('window.fixtureCalls');assert calls[-1]['item']['providerId']==expected and calls[-1]['item']['id']=='service-'+expected,calls
     row['recoveredActionIdentity']='PASS'
    if not BEFORE and case in ['background-error','background-service-error']:
     await expect(page.get_by_role('heading',name='Synthetic provider A',exact=True)).to_be_visible();await page.get_by_role('button',name=book,exact=True).click();draft=page.get_by_role('textbox',name='Synthetic booking draft');await draft.fill('Keep my synthetic notes');await draft.evaluate('(e)=>window.fixtureDraftNode=e');await page.get_by_role('button',name='Fail provider reads'if case=='background-error'else'Fail service reads',exact=True).click();await page.get_by_role('button',name='Refresh reads',exact=True).click();await expect(page.get_by_role('alert')).to_be_visible();await expect(draft).to_have_value('Keep my synthetic notes');assert await draft.evaluate('(e)=>e===window.fixtureDraftNode');await page.screenshot(path=str(OUT/f'{prefix}-cached-error.png'),full_page=True);await page.get_by_role('button',name='Recover reads',exact=True).click();await page.get_by_role('button',name=retry,exact=True).click();await expect(page.get_by_role('alert')).to_have_count(0);await expect(draft).to_have_value('Keep my synthetic notes');assert await draft.evaluate('(e)=>e===window.fixtureDraftNode');row['sameIdDraftRetention']='PASS'
    await page.evaluate('document.fonts.ready');await page.screenshot(path=str(OUT/f'{prefix}.png'),full_page=True);assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth');row.update(outcome='PASS',route=await page.get_by_test_id('route').text_content(),headings=await page.get_by_role('heading').all_text_contents(),alerts=await page.get_by_role('alert').all_text_contents(),cartCalls=await page.evaluate('window.fixtureCalls'))
    assert not errors and not blocked,(errors,blocked)
   except Exception as e:row.update(outcome='FAIL',error=str(e),pageErrors=errors,blocked=blocked);await page.screenshot(path=str(OUT/f'{prefix}-FAIL.png'),full_page=True)
   rows.append(row);print(json.dumps(row),flush=True);await context.close()
  await browser.close()
 (OUT/'results.json').write_text(json.dumps(rows,indent=2));print(json.dumps(rows));assert all(r['outcome']=='PASS'for r in rows)
asyncio.run(main())
