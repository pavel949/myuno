"""Anonymous homepage layout and interaction matrix. Local fixture only; deny backend traffic."""
import asyncio, json, os, sys
from pathlib import Path
from urllib.parse import urlparse
from playwright.async_api import async_playwright, expect
OUTPUT = Path(sys.argv[1])

async def main():
    results = []
    async with async_playwright() as p:
        system = '/usr/bin/chromium'
        browser = await p.chromium.launch(executable_path=system if Path(system).exists() else None, args=['--no-sandbox'])
        for lang in ['en', 'ru', 'th']:
            for width in [320, 390, 768, 1440, 1920]:
                context = await browser.new_context(viewport={'width': width, 'height': 900}, has_touch=width < 768, reduced_motion='reduce', service_workers='block')
                blocked, errors = [], []
                async def route(r):
                    parsed = urlparse(r.request.url)
                    name = 'fixture.html' if parsed.path == '/fixture' else parsed.path.lstrip('/')
                    file = OUTPUT/name
                    types = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp'}
                    if parsed.netloc == 'localhost:8080' and file.is_file():
                        await r.fulfill(path=str(file), content_type=types.get(file.suffix,'application/octet-stream'))
                    else:
                        blocked.append(r.request.url)
                        await r.abort()
                await context.route('**/*', route)
                page = await context.new_page()
                page.on('pageerror', lambda error: errors.append(str(error)))
                try:
                    await page.goto(f'http://localhost:8080/fixture?lang={lang}', wait_until='networkidle')
                    await expect(page.locator('.home-rail-viewport')).to_have_count(5)
                    assert await page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'Page overflow {lang} {width}'
                    # Each gallery stays one card high and within its own section.
                    for rail in await page.locator('.home-rail-viewport').all():
                        geometry = await rail.evaluate('(el)=>({width:el.clientWidth,scroll:el.scrollWidth,tops:[...el.children].map(c=>c.getBoundingClientRect().top)})')
                        assert max(geometry['tops']) - min(geometry['tops']) < 2, geometry
                        if geometry['scroll'] > geometry['width']+2:
                            parent = rail.locator('..')
                            next_button = parent.locator('button').nth(1)
                            await expect(next_button).to_have_attribute('aria-disabled','false')
                            await next_button.click()
                            await page.wait_for_timeout(80)
                            assert await rail.evaluate('(el)=>el.scrollLeft>0')
                            await rail.focus()
                            await rail.press('End')
                            await page.wait_for_timeout(80)
                            await expect(next_button).to_have_attribute('aria-disabled','true')
                            await rail.press('Home')
                            await page.wait_for_timeout(80)
                            assert await rail.evaluate('(el)=>el.scrollLeft<2')
                            await rail.press('ArrowRight')
                            await page.wait_for_timeout(80)
                            assert await rail.evaluate('(el)=>el.scrollLeft>0')
                            # Focus a card beyond the first view; native focus must reveal it.
                            await rail.locator('a').last.focus()
                            last = await rail.locator('a').last.bounding_box()
                            bounds = await rail.bounding_box()
                            assert last['x'] < bounds['x']+bounds['width'] and last['x']+last['width'] > bounds['x']
                            await rail.press('Home')
                    # Native touch swipe tested through Chromium's input protocol.
                    if width < 768:
                        rail = page.locator('.home-rail-viewport').first
                        await rail.scroll_into_view_if_needed()
                        await rail.evaluate('(el)=>el.scrollLeft=0')
                        box = await rail.bounding_box()
                        session = await context.new_cdp_session(page)
                        y = box['y'] + box['height']/2
                        x = box['x']+box['width']*.8
                        await session.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]})
                        for step in range(1,8):
                            await session.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x-step*22,'y':y}]})
                        await session.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
                        await page.wait_for_timeout(120)
                        assert await rail.evaluate('(el)=>el.scrollLeft>0'), 'Swipe did not scroll'
                    # Complex filters preserve typed inventory + rent/buy detail intents.
                    projects = page.locator('.home-projects')
                    await projects.locator('input[type=search]').fill('Fixture community 1' if lang!='ru' else 'Тестовый комплекс 1')
                    await expect(projects.locator('article:visible')).to_have_count(1)
                    await projects.locator('input[type=search]').fill('no-match')
                    await expect(projects.locator('article:visible')).to_have_count(0)
                    await projects.locator('input[type=search]').fill('')
                    await projects.locator('select').first.select_option('rawai')
                    await expect(projects.locator('article:visible')).to_have_count(1)
                    await projects.locator('select').first.select_option('')
                    await projects.locator('select').nth(1).select_option('condo')
                    await expect(projects.locator('article:visible')).to_have_count(5)
                    await projects.locator('.home-project-mode button').nth(1).click()
                    await expect(projects.locator('article:visible')).to_have_count(6)
                    assert 'mode=buy&propertyType=condo' in await projects.locator('article a').first.get_attribute('href')
                    await projects.locator('select').nth(1).select_option('')
                    # Exercise actual card CTAs and verify the committed public destination.
                    for selector, prefix in [('.home-locations a', '/property/search?'),
                                             ('.home-project-card-link', '/property/complex/'),
                                             ('.home-home-card a', '/property/home-')]:
                        link = page.locator(selector).first
                        href = await link.get_attribute('href')
                        assert href.startswith(prefix), href
                        await link.click()
                        await expect(page.get_by_test_id('location')).to_have_text(href)
                    for selector, prefix in [('.home-catalog a[href^="/experiences/"]', '/experiences/'),
                                             ('.home-catalog a[href^="/services/provider/"]', '/services/provider/'),
                                             ('.home-catalog a[href^="/flowers/bouquet/"]', '/flowers/bouquet/'),
                                             ('.home-owner-prompt a', '/for-owners')]:
                        link = page.locator(selector).first
                        href = await link.get_attribute('href')
                        assert href.startswith(prefix), href
                        await link.click()
                        await expect(page.get_by_test_id('location')).to_have_text(href)
                    await page.locator('.home-rail-viewport').evaluate_all('(rows)=>rows.forEach(row=>row.scrollLeft=0)')
                    await page.evaluate('window.scrollTo({top:0,behavior:"instant"})')
                    await page.locator('.home-hero').scroll_into_view_if_needed()
                    await page.screenshot(path=str(OUTPUT/f'{lang}-{width}-homepage.png'), full_page=True)
                    assert not errors, errors
                    results.append({'language':lang,'width':width,'state':'data','pageOverflow':False,'rails':5,'arrowsKeyboardFocus':True,'swipe':width<768,'filters':True,'errors':errors})
                finally:
                    await context.close()
        # Failures and genuine empties use the same production components.
        for state in ['empty','error','loading']:
            context = await browser.new_context(viewport={'width':390,'height':900},service_workers='block')
            await context.route('**/*',route)
            page = await context.new_page()
            await page.goto(f'http://localhost:8080/fixture?state={state}',wait_until='networkidle')
            assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth')
            if state=='error':
                await expect(page.get_by_role('alert')).to_have_count(5)
                await page.get_by_role('button',name='Try again').first.click()
                assert await page.evaluate('window.fixtureRetries') == 1
                assert 'No published' not in await page.locator('body').inner_text()
            if state=='empty':
                await expect(page.get_by_text('No published experiences yet. Check back later.')).to_be_visible()
                await expect(page.get_by_role('link',name='Air conditioning',exact=True)).to_be_visible()
            await page.screenshot(path=str(OUTPUT/f'en-390-{state}.png'),full_page=True)
            results.append({'state':state,'width':390,'pageOverflow':False})
            await context.close()
        await browser.close()
    (OUTPUT/'results.json').write_text(json.dumps(results,indent=2))
    print(json.dumps({'passed':len(results),'output':str(OUTPUT)}))
asyncio.run(main())
