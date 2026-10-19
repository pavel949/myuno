"""Actual MC sidebar/tool directory; synthetic permissions and zero external traffic."""
import asyncio,json,sys
from pathlib import Path
from urllib.parse import urlparse
from playwright.async_api import async_playwright,expect
OUT=Path(sys.argv[1])
async def main():
    results=[]
    async with async_playwright() as p:
        browser=await p.chromium.launch(headless=True)
        for lang,title,search,rates in [('en','All tools','Find a tool','Rates'),('ru','Все инструменты','Найти инструмент','Тарифы'),('th','เครื่องมือทั้งหมด','ค้นหาเครื่องมือ','ราคา')]:
            for width in [375,390,430,1280]:
                context=await browser.new_context(viewport={'width':width,'height':1000},service_workers='block')
                blocked=[];errors=[]
                async def route(req):
                    u=urlparse(req.request.url);f='fixture.html' if u.path=='/fixture' else u.path.lstrip('/')
                    types={'fixture.html':'text/html','fixture.js':'text/javascript','fixture.css':'text/css'}
                    if u.netloc=='localhost:8080' and req.request.method=='GET' and f in types:
                        await req.fulfill(path=str(OUT/f),content_type=types[f])
                    else:
                        blocked.append(req.request.url);await req.abort()
                await context.route('**/*',route)
                page=await context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
                await page.goto(f'http://localhost:8080/fixture?lang={lang}',wait_until='networkidle')
                await expect(page.get_by_role('heading',name=title,exact=True)).to_be_visible()
                await page.screenshot(path=str(OUT/f'{lang}-{width}-tools.png'),full_page=True)
                await page.get_by_role('textbox',name=search,exact=True).fill(rates)
                await expect(page.get_by_role('button',name=rates,exact=True).last).to_be_visible()
                await page.get_by_role('button',name=rates,exact=True).last.click()
                await expect(page.get_by_test_id('route-boundary')).to_have_text('/mc/rates')
                await page.get_by_role('textbox',name=search,exact=True).fill('')
                # All tools remain present even when sections are collapsed.
                assert await page.locator('details button').count()==29
                # Every native section control opens; keyboard selection is checked directly.
                summaries=page.locator('summary')
                assert await summaries.count()==4
                for i in range(4):
                    summary=summaries.nth(i)
                    await summary.focus()
                    initial=await summary.evaluate('(e)=>e.parentElement.open')
                    await page.keyboard.press('Enter')
                    assert await summary.evaluate('(e)=>e.parentElement.open') != initial
                measurements=await page.evaluate('''()=>({page:document.documentElement.scrollWidth,controls:[...document.querySelectorAll('button,input,summary')].filter(e=>e.getClientRects().length).map(e=>{const r=e.getBoundingClientRect();return {text:e.textContent,left:r.left,right:r.right}})})''')
                assert measurements['page']<=width,measurements
                assert all(v['left']>=-1 and v['right']<=width+1 for v in measurements['controls']),measurements
                await page.screenshot(path=str(OUT/f'{lang}-{width}-expanded.png'),full_page=True)
                assert not blocked,blocked
                assert not errors,errors
                results.append({'language':lang,'width':width,'status':'passed','toolCount':29,'externalRequests':0})
                await context.close()
        await browser.close()
    (OUT/'results.json').write_text(json.dumps(results,indent=2))
    print(json.dumps(results))
asyncio.run(main())
