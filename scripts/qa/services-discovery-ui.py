"""Isolated real catalogue UI; production providers/writers and network excluded."""
import asyncio, json, sys, os, shutil
from pathlib import Path
from urllib.parse import urlparse
from playwright.async_api import async_playwright, expect
OUTPUT = Path(sys.argv[1])
async def main():
    results = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, executable_path=None if os.environ.get("CI") else shutil.which("chromium"))
        for lang in ['ru', 'en']:
            for width in [375, 390, 430, 1280]:
                context = await browser.new_context(viewport={'width':width,'height':900}, service_workers='block')
                errors=[]
                async def route(r):
                    parsed=urlparse(r.request.url)
                    name='fixture.html' if parsed.path=='/fixture' else parsed.path.lstrip('/')
                    types={'fixture.html':'text/html','fixture.js':'text/javascript','fixture.css':'text/css'}
                    if parsed.netloc=='localhost:8080' and name in types:
                        await r.fulfill(path=str(OUTPUT/name),content_type=types[name])
                    else: await r.abort()
                await context.route('**/*',route)
                page=await context.new_page()
                page.on('pageerror',lambda e:errors.append(str(e)))
                await page.goto('http://localhost:8080/fixture?lang='+lang,wait_until='networkidle')
                assert not errors, {'fixturePageErrors':errors}
                await expect(page.locator('[aria-labelledby=service-catalog-groups] a[href="/flowers"]')).to_be_visible()
                await expect(page.get_by_role('combobox')).to_be_visible()
                assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth'), (lang,width,'overflow')
                await page.screenshot(path=str(OUTPUT/f'{lang}-{width}-catalogue.png'))
                category_name='Кондиционеры' if lang=='ru' else 'Air Conditioning'
                trigger=page.get_by_role('combobox')
                assert await trigger.evaluate('(el)=>el.tagName')=='BUTTON'
                await trigger.press('Enter')
                menu=page.get_by_role('listbox')
                await expect(menu).to_be_visible()
                # Await the popover animation before measuring its final geometry.
                await menu.evaluate('(el)=>Promise.all(el.getAnimations().map(a=>a.finished))')
                box=await menu.bounding_box()
                assert box and box['x']>=0 and box['x']+box['width']<=width+1, (lang,width,box)
                await page.screenshot(path=str(OUTPUT/f'{lang}-{width}-category-menu.png'))
                await page.get_by_role('option',name=category_name,exact=True).click()
                await expect(menu).to_have_count(0)
                await expect(trigger).to_be_focused()
                search=page.get_by_role('searchbox',name='Поиск услуг…' if lang=='ru' else 'Search services…',exact=True)
                await search.fill('Чистка' if lang=='ru' else 'Cleaning')
                request_action=page.get_by_role('button',name='Чистка кондиционера Оставить заявку' if lang=='ru' else 'AC Cleaning Request service',exact=True)
                await expect(page.get_by_test_id('service-request-card')).to_have_count(1)
                await expect(request_action).to_have_count(1)
                await page.screenshot(path=str(OUTPUT/f'{lang}-{width}-filtered.png'))
                await request_action.focus()
                await request_action.press('Enter')
                await page.get_by_role('button',name='Go back').click()
                await expect(search).to_have_value('Чистка' if lang=='ru' else 'Cleaning')
                await expect(page.get_by_role('combobox')).to_have_text(category_name)
                assert not errors, errors
                results.append({'lang':lang,'width':width,'passed':True})
                await context.close()
        await browser.close()
    (OUTPUT/'results.json').write_text(json.dumps(results,indent=2))
    print(json.dumps(results))
asyncio.run(main())
