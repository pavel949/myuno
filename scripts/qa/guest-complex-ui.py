"""Actual complex page/cards. All browser requests are fulfilled locally or denied."""
import asyncio, json, sys
from pathlib import Path
from urllib.parse import urlparse, parse_qs
from playwright.async_api import async_playwright, expect
from search_browser_selection import select_search_browser

OUTPUT = Path(sys.argv[1])
PHOTO = '<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000"><defs><linearGradient id="g" x2="0" y2="1"><stop stop-color="#284b42"/><stop offset="1" stop-color="#839d8a"/></linearGradient></defs><path fill="url(#g)" d="M0 0h1600v1000H0z"/><path fill="#e5d9bf" d="M150 220h1300v460H150z"/><path fill="#34554b" d="M230 290h1140v250H230z"/><path fill="#99c4b8" d="M120 720h1360v240H120z"/><path fill="#d8d0bb" d="M0 650h1600v70H0z"/></svg>'

async def main():
    results = []
    async with async_playwright() as p:
        selection=select_search_browser(p.chromium.executable_path)
        browser = await p.chromium.launch(executable_path=selection['executable_path'],headless=True,args=['--no-sandbox'])
        for lang in ['ru', 'en']:
            for width in [375, 430, 1280]:
                for empty in [False, True]:
                    context = await browser.new_context(viewport={'width': width, 'height': 900}, service_workers='block', reduced_motion='reduce')
                    blocked, errors = [], []
                    async def route(r):
                        url = urlparse(r.request.url)
                        name = 'fixture.html' if url.path == '/fixture' else url.path.lstrip('/')
                        types = {'fixture.html':'text/html','fixture.js':'text/javascript','fixture.css':'text/css'}
                        if url.netloc == 'localhost:8080' and name in types:
                            await r.fulfill(path=str(OUTPUT/name), content_type=types[name])
                        elif url.netloc == 'localhost:8080' and name in ['photo.svg','photo2.svg','photo3.svg']:
                            await r.fulfill(body=PHOTO, content_type='image/svg+xml')
                        elif url.netloc == 'localhost:8080' and name == 'tour.mp4':
                            await r.fulfill(status=204, body='')
                        elif name.endswith(('.woff','.woff2')):
                            # Local stylesheet fonts may be absent; never reach the network.
                            await r.fulfill(status=204, body='')
                        else:
                            blocked.append(r.request.url)
                            await r.abort()
                    await context.route('**/*', route)
                    page = await context.new_page()
                    page.on('pageerror', lambda error: errors.append(str(error)))
                    await page.goto(f'http://localhost:8080/fixture?lang={lang}' + ('&empty=1' if empty else ''))
                    await page.get_by_role('heading', level=1).wait_for()
                    await page.evaluate('document.fonts.ready')
                    await page.evaluate("Promise.all(document.getAnimations().filter(a=>a.effect?.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})))")
                    await page.wait_for_timeout(350)
                    async def bounds():
                        assert await page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), f'Overflow: {lang}/{width}/{empty}'
                    hero = page.get_by_test_id('complex-hero')
                    hero_box = await hero.bounding_box()
                    if empty:
                        assert hero_box['height'] < 520, f'Empty hero too tall: {hero_box}'
                    else:
                        assert await page.evaluate("document.querySelector('#complex-units').compareDocumentPosition(document.querySelector('[aria-labelledby=complex-gallery]')) & Node.DOCUMENT_POSITION_FOLLOWING")
                    await expect(page.get_by_role('link', name=f'{"Аренда" if lang == "ru" else "Rent"}: {0 if empty else 1}', exact=True)).to_have_attribute('href', '#complex-units')
                    await bounds()
                    suffix = f'{lang}-{width}-{"empty" if empty else "media"}'
                    await page.screenshot(path=str(OUTPUT/f'{suffix}-rent.png'), full_page=True)
                    ru = lang == 'ru'
                    count = 0 if empty else 1
                    await expect(page.get_by_role('button', name=f'{"Аренда" if ru else "Rent"} {count}', exact=True)).to_have_attribute('aria-pressed','true')
                    await page.get_by_role('button', name=f'{"Покупка" if ru else "Buy"} {count}', exact=True).click()
                    await expect(page.get_by_role('heading', name='Жильё на продажу' if ru else 'Homes for sale', exact=True)).to_be_visible()
                    location = await page.get_by_test_id('location').text_content()
                    assert parse_qs(location.split('?',1)[1]) == {'managementCompanyId':['operator'],'mode':['buy']}, location
                    await bounds()
                    await page.screenshot(path=str(OUTPUT/f'{suffix}-buy.png'), full_page=True)
                    if empty:
                        await expect(page.get_by_text('По выбранным условиям пока нет опубликованных предложений.' if ru else 'No published homes match these choices yet.', exact=True)).to_be_visible()
                        await expect(page.get_by_role('button',name='Воспроизвести видео' if ru else 'Play video', exact=True)).to_have_count(0)
                    else:
                        unit = page.get_by_role('link',name='Апартаменты с видом на сад' if ru else 'Garden apartment',exact=True)
                        await expect(unit).to_have_count(1)
                        await expect(unit).to_have_attribute('href', '/property/dual-unit?mode=buy')
                        company=page.locator('a[href="/company/fixture-operator"]')
                        await expect(company).to_have_count(1)
                        await expect(company).to_contain_text('Компания' if ru else 'Company')
                        await expect(company).to_contain_text('Управляющая компания' if ru else 'Verified fixture operator')
                        assert 'Managed by' not in await page.locator('body').inner_text()
                        await page.get_by_role('button',name='Воспроизвести видео' if ru else 'Play video', exact=True).click()
                        await expect(page.locator('video')).to_have_attribute('controls','')
                        assert await page.locator('video').get_attribute('autoplay') is None
                        await page.get_by_role('button',name='Аренда 1' if ru else 'Rent 1',exact=True).click()
                        await expect(unit).to_have_attribute('href','/property/dual-unit?mode=rent')
                        await unit.click()
                        await expect(page.get_by_test_id('unit-destination')).to_be_visible()
                        await expect(page.get_by_test_id('location')).to_have_text('/property/dual-unit?mode=rent')
                    assert not blocked, blocked
                    assert not errors, errors
                    results.append({'language':lang,'width':width,'empty':empty,'overflow':'pass','tabsCounts':'pass','canonicalUnitLink':'pass','media':'pass'})
                    await context.close()
        await browser.close()
    (OUTPUT/'results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))

asyncio.run(main())
