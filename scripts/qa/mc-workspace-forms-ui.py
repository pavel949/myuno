"""Real localized MC forms with synthetic readers and forbidden mutations."""
import asyncio,json,sys
from pathlib import Path
from urllib.parse import urlparse
from playwright.async_api import async_playwright,expect
OUT=Path(sys.argv[1])
async def main():
    results=[]
    async with async_playwright() as p:
        browser=await p.chromium.launch(headless=True)
        for lang in ['en','ru','th']:
            for width in [375,390,430,1280]:
                context=await browser.new_context(viewport={'width':width,'height':1000},service_workers='block')
                blocked=[];errors=[]
                async def route(req):
                    u=urlparse(req.request.url);f='fixture.html' if u.path=='/fixture' else u.path.lstrip('/')
                    types={'fixture.html':'text/html','fixture.js':'text/javascript','fixture.css':'text/css'}
                    if u.netloc=='localhost:8080' and req.request.method=='GET' and f in types:
                        await req.fulfill(path=str(OUT/f),content_type=types[f])
                    else:blocked.append(req.request.url);await req.abort()
                await context.route('**/*',route)
                page=await context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
                async def settle():
                    await page.evaluate('''async()=>{await document.fonts.ready;await Promise.all(document.getAnimations().filter(a=>a.effect?.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})))}''')
                async def bounds():
                    m=await page.evaluate('''()=>({page:document.documentElement.scrollWidth,controls:[...document.querySelectorAll('button,input,textarea,select,[role=combobox]')].filter(e=>e.getClientRects().length).map(e=>{const r=e.getBoundingClientRect();return {text:e.textContent,left:r.left,right:r.right}})})''')
                    assert m['page']<=width,m
                    assert all(c['left']>=-1 and c['right']<=width+1 for c in m['controls']),m
                for view in ['settings','meetings','account','dashboard']:
                    await page.goto(f'http://localhost:8080/fixture?lang={lang}&view={view}',wait_until='networkidle')
                    await expect(page.get_by_role('heading',level=1)).to_be_visible()
                    await settle()
                    await bounds()
                    await page.screenshot(path=str(OUT/f'{lang}-{width}-{view}.png'),full_page=True)
                    if view=='settings':
                        # Each real nested editor opens through its native Radix trigger.
                        triggers=page.locator('button[data-radix-collection-item]')
                        assert await triggers.count()==5
                        for i in range(5):
                            await triggers.nth(i).click()
                            await expect(triggers.nth(i)).to_have_attribute('aria-expanded','true')
                            await settle()
                            await bounds()
                            await page.screenshot(path=str(OUT/f'{lang}-{width}-settings-{i}.png'),full_page=True)
                            await triggers.nth(i).click()
                            await expect(triggers.nth(i)).to_have_attribute('aria-expanded','false')
                            await settle()
                    if view=='meetings':
                        name={'en':'New Meeting','ru':'Новая встреча','th':'นัดหมายใหม่'}[lang]
                        # The first header button is the existing New Meeting action.
                        trigger=page.get_by_role('button').first
                        await trigger.click()
                        await expect(page.get_by_role('dialog')).to_be_visible()
                        await settle()
                        await bounds()
                        await page.screenshot(path=str(OUT/f'{lang}-{width}-meeting-draft.png'),full_page=True)
                    assert not blocked,blocked
                    assert not errors,errors
                    results.append({'language':lang,'width':width,'view':view,'status':'passed','externalRequests':0})
                await context.close()
        await browser.close()
    (OUT/'results.json').write_text(json.dumps(results,indent=2))
    print(json.dumps(results))
asyncio.run(main())
