"""Anonymous homepage layout and interaction matrix. Local fixture only; deny backend traffic."""
import asyncio, json, os, sys, time
from pathlib import Path
from urllib.parse import urlparse
from playwright.async_api import async_playwright, expect
OUTPUT = Path(sys.argv[1])
WIDTHS = [320,360,375,390,430,768,1440,1920]
if not os.environ.get('CI') and os.environ.get('HOME_GALLERY_WIDTHS'):
    selected = [int(value) for value in os.environ['HOME_GALLERY_WIDTHS'].split(',')]
    if not selected or any(width not in WIDTHS for width in selected): raise ValueError('Unknown bounded local viewport')
    WIDTHS = selected

SHARD=os.environ.get('HOME_GALLERY_SHARD')
if SHARD not in [None,'en','ru','th']: raise ValueError('Unknown gallery language shard')
LANGUAGES=[SHARD] if SHARD else ['en','ru','th']

async def main():
    results = []
    async with async_playwright() as p:
        system = '/usr/bin/chromium'
        browser = await p.chromium.launch(executable_path=None if os.environ.get('CI') else system if Path(system).exists() else None, args=['--no-sandbox'])
        blocked = []
        async def route(r):
            parsed = urlparse(r.request.url)
            name = 'fixture.html' if parsed.path == '/fixture' else parsed.path.lstrip('/')
            file = OUTPUT/name
            if name in ('catalog/flowers/pink-garden-roses.webp', 'yachts/catamaran-53-1.webp') or name.startswith('fonts/'): file = Path.cwd()/'public'/name
            types = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2'}
            if parsed.netloc == 'localhost:8080' and file.is_file():
                await r.fulfill(path=str(file), content_type=types.get(file.suffix,'application/octet-stream'))
            else:
                blocked.append(r.request.url)
                await r.abort()
        # Capture both delivery sizes before interaction assertions. These are
        # explicitly unvalidated diagnostics, never substitutes for a green matrix.
        for preview_lang in LANGUAGES:
            for preview_width in [390, 1440]:
                preview_context = await browser.new_context(viewport={'width': preview_width, 'height': 900}, reduced_motion='reduce', service_workers='block')
                await preview_context.route('**/*', route)
                preview_page = await preview_context.new_page()
                await preview_page.goto(f'http://localhost:8080/fixture?lang={preview_lang}', wait_until='domcontentloaded')
                await preview_page.evaluate('document.fonts.ready')
                for photo in await preview_page.locator('img').all():
                    if await photo.is_visible():
                        await photo.scroll_into_view_if_needed()
                await preview_page.locator('.home-rail-viewport').evaluate_all('(rows)=>rows.forEach(row=>row.scrollLeft=0)')
                await preview_page.evaluate('window.scrollTo(0,0)')
                await preview_page.screenshot(path=str(OUTPUT/f'unvalidated-{preview_lang}-{preview_width}-homepage.png'), full_page=True)
                await preview_context.close()
        for lang in LANGUAGES:
            for width in WIDTHS:
                case_started=time.monotonic()
                context = await browser.new_context(viewport={'width': width, 'height': 900}, has_touch=width < 768, reduced_motion='reduce', service_workers='block')
                blocked, errors = [], []
                await context.route('**/*', route)
                page = await context.new_page()
                page.on('pageerror', lambda error: errors.append(str(error)))
                try:
                    await page.goto(f'http://localhost:8080/fixture?lang={lang}', wait_until='domcontentloaded')
                    await expect(page.locator('.home-rail-viewport')).to_have_count(5)
                    assert await page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'Page overflow {lang} {width}'
                    rental_heading = await page.locator('#home-stays-title').bounding_box()
                    purchase_heading = await page.locator('#home-newbuilds-title').bounding_box()
                    assert abs(rental_heading['x'] - purchase_heading['x']) <= 1, {'message': 'Property section gutters must align', 'rental': rental_heading, 'purchase': purchase_heading}
                    category_cards=page.locator('.home-service-category-card')
                    await expect(category_cards).to_have_count(5)
                    assert await category_cards.locator('a').evaluate_all('(rows)=>new Set(rows.map(a=>a.pathname)).size===6')
                    for card in await category_cards.all():
                        await card.scroll_into_view_if_needed()
                        image=card.locator('img')
                        if 'home-service-category-card--photo' in (await card.get_attribute('class') or ''):
                            await expect(image).to_be_visible()
                            await page.wait_for_function('(el)=>el.complete && el.naturalWidth>0', arg=await image.element_handle(), timeout=5000)
                        else:
                            await expect(image).not_to_be_visible()
                        await expect(card.locator('.home-service-category-copy')).to_be_visible()

                    # Editorial guide/service grids and horizontal listing rails keep their distinct layouts.
                    grid_sections=0;tested_controls=0
                    for index, rail in enumerate(await page.locator('.home-rail-viewport').all()):
                        # Earlier media checks naturally reveal later service cards. Establish the tested start through the public keyboard contract.
                        await rail.focus();await rail.press('Home')
                        await expect(rail).to_have_js_property('scrollLeft',0)
                        geometry = await rail.evaluate('(el)=>({width:el.clientWidth,scroll:el.scrollWidth,tops:[...el.children].map(c=>c.getBoundingClientRect().top)})')
                        layout=await rail.evaluate('(el)=>({grid:getComputedStyle(el).display,section:el.closest("section").className,short:!!el.closest(".home-rail--short"),columns:getComputedStyle(el).gridTemplateColumns.split(" ").length,boxes:[...el.children].map(c=>{const r=c.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom}})})')
                        if layout['grid']=='grid':
                            grid_sections+=1
                            assert 'home-services' in layout['section'] or 'home-locations' in layout['section'] or width>=1024 and layout['short'],layout
                            expected=(1 if width<768 else 2) if 'home-services' in layout['section'] else (2 if width<1024 else 4) if 'home-locations' in layout['section'] else 3
                            assert layout['columns']==expected,layout
                            assert geometry['scroll']<=geometry['width']+2,geometry
                            for a,box in enumerate(layout['boxes']):
                                for other in layout['boxes'][a+1:]:
                                    assert box['right']<=other['x']+1 or other['right']<=box['x']+1 or box['bottom']<=other['y']+1 or other['bottom']<=box['y']+1,layout
                        else:
                            assert max(geometry['tops']) - min(geometry['tops']) < 2, geometry
                        # Exercise controls on every actual overflowing rail, in every locale/width.
                        if geometry['scroll'] > geometry['width']+2:
                            tested_controls+=1
                            parent = rail.locator('..')
                            next_button = parent.locator('button').nth(1)
                            await expect(next_button).to_have_attribute('aria-disabled','false')
                            await expect(next_button).to_be_visible()
                            bounds=await next_button.bounding_box();assert bounds['width']>=44 and bounds['height']>=44,bounds
                            glyph=await next_button.locator('svg').bounding_box();assert glyph['width']<=16 and glyph['height']<=16,glyph
                            if width < 768:
                                await next_button.tap()
                            else:
                                await next_button.click()
                            await page.wait_for_function('(el)=>el.scrollLeft>0',arg=await rail.element_handle(),timeout=5000)
                            assert await rail.evaluate('(el)=>el.scrollLeft>0')
                            await rail.focus()
                            await rail.press('End')
                            await expect(next_button).to_have_attribute('aria-disabled','true')
                            await rail.press('Home')
                            await expect(rail).to_have_js_property('scrollLeft',0)
                            assert await rail.evaluate('(el)=>el.scrollLeft<2')
                            await rail.press('ArrowRight')
                            await page.wait_for_function('(el)=>el.scrollLeft>0',arg=await rail.element_handle(),timeout=5000)
                            assert await rail.evaluate('(el)=>el.scrollLeft>0')
                            # Focus a card beyond the first view; native focus must reveal it.
                            await rail.locator('a').last.focus()
                            last = await rail.locator('a').last.bounding_box()
                            bounds = await rail.bounding_box()
                            assert last['x'] < bounds['x']+bounds['width'] and last['x']+last['width'] > bounds['x']
                            await rail.press('Home')
                    # Native touch swipe tested through Chromium's input protocol.
                    if width < 768:
                        for rail in [page.locator('.home-properties .home-rail-viewport'), page.locator('.premium-newbuilds .home-rail-viewport'), page.locator('.home-experiences .home-rail-viewport')]:
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
                            await page.wait_for_function('(el)=>el.scrollLeft>0',arg=await rail.element_handle(),timeout=5000)
                            assert await rail.evaluate('(el)=>el.scrollLeft>0'), 'Swipe did not scroll'
                    # One task choice layer; no repeated search-shaped routing block.
                    await expect(page.locator('.home-hero input')).to_have_count(0)
                    await expect(page.locator('.home-search-entry-button,.premium-plan-links')).to_have_count(0)
                    choices=page.locator('.home-hero-choice')
                    await expect(choices).to_have_count(4)
                    await page.evaluate("window.scrollTo({top: 0, behavior: 'instant'})")
                    hero_geometry = await page.evaluate("""
                      () => {
                        const keys = [...document.querySelectorAll('.home-hero-choice')].map(el => el.getBoundingClientRect().toJSON());
                        const photo = document.querySelector('.home-hero-media').getBoundingClientRect().toJSON();
                        return {keys, photo};
                      }
                    """)
                    keys = hero_geometry['keys']
                    photo = hero_geometry['photo']
                    assert all(key['height'] >= 44 and key['bottom'] < 820 for key in keys), hero_geometry
                    assert abs(keys[0]['top'] - keys[1]['top']) < 2 and abs(keys[2]['top'] - keys[3]['top']) < 2, hero_geometry
                    if width < 900:
                        assert photo['top'] > max(key['bottom'] for key in keys), hero_geometry
                    else:
                        assert photo['left'] >= max(key['right'] for key in keys) and photo['height'] > 200, hero_geometry

                    destinations = ['/property/rent', '/discover/buy', '/experiences', '/services']
                    for index,destination in enumerate(destinations):
                        await expect(choices.nth(index)).to_have_attribute('href', destination)
                        await choices.nth(index).focus()
                        await expect(choices.nth(index)).to_be_focused()
                        await choices.nth(index).press('Enter')
                        await expect(page.get_by_test_id('location')).to_have_text(destination)
                        await expect(page.get_by_role('dialog')).to_have_count(0)
                    await expect(page.locator('.premium-newbuilds .home-rail article')).to_have_count(6)
                    # The rail controls must never intercept the catalogue header action.
                    catalogue = page.locator('.home-properties .home-gallery-heading a')
                    await catalogue.evaluate("el => el.scrollIntoView({block:'center',inline:'nearest'})")
                    hit = await catalogue.evaluate("el => { const r=el.getBoundingClientRect(); const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2); return hit === el || el.contains(hit); }")
                    assert hit, 'Rental catalogue link is covered by rail controls'
                    await catalogue.click()
                    await expect(page.get_by_test_id('location')).to_have_text('/property/search?mode=rent')
                    await expect(page.locator('.home-listing .home-listing-facts,.home-listing .home-listing-pricing')).to_have_count(0)
                    # Exercise actual card CTAs and verify the committed public destination.
                    for selector, prefix in [('.home-area-guide-link', '/area/'),
                                             ('.premium-newbuilds .home-rail article a', '/property/offplan/'),
                                             ('.home-listing a', '/property/search?mode=rent&focus=home-')]:
                        link = page.locator(selector).first
                        href = await link.get_attribute('href')
                        assert href.startswith(prefix), href
                        await link.click()
                        await expect(page.get_by_test_id('location')).to_have_text(href)
                    for selector, prefix in [('.home-service-category-card a[href="/flowers"]', '/flowers'),
                                             ('.home-service-category-card a[href="/yachts"]', '/yachts'),
                                             ('.home-service-category-card a[href="/transport"]', '/transport'),
                                             ('.home-service-category-card a[href="/transport/airport-transfer"]', '/transport/airport-transfer'),
                                             ('.home-service-category-card a[href="/transport/fast-track"]', '/transport/fast-track'),
                                             ('.home-service-category-card a[href="/discover/services?category=cat-home-services"]', '/discover/services?category=cat-home-services'),
                                             ('.home-audience-card[href="/for-owners"]', '/for-owners')]:
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
                    results.append({'language':lang,'width':width,'state':'data','pageOverflow':False,'sections':5,'gridSections':grid_sections,'keyboardControlledRails':tested_controls,'swipe':width<768,'nativeMobileTap':width<768,'directIntentRoutes':4,'errors':errors})
                    print(json.dumps({'completed':len(results),'language':lang,'width':width,'seconds':round(time.monotonic()-case_started,2)}),flush=True)
                except Exception:
                    await page.screenshot(path=str(OUTPUT/f"failure-{lang}-{width}.png"),full_page=True)
                    print(json.dumps({"language":lang,"width":width,"activeElement":await page.evaluate("document.activeElement?.outerHTML"),"dialogs":await page.get_by_role("dialog").count()}),flush=True)
                    raise
                finally:
                    await context.close()
        # Failures and genuine empties use the same production components.
        for state in (['empty','error','loading'] if SHARD in [None,'en'] else []):
            context = await browser.new_context(viewport={'width':390,'height':900},service_workers='block')
            await context.route('**/*',route)
            page = await context.new_page()
            await page.goto(f'http://localhost:8080/fixture?state={state}',wait_until='domcontentloaded')
            await expect(page.locator('.home-area-guide-link')).to_have_count(4)
            if state=='loading': await expect(page.locator('.home-properties [role=status]')).to_be_visible()
            assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth')
            if state=='error':
                await expect(page.get_by_role('alert')).to_have_count(4)
                await page.get_by_role('button',name='Try again').first.click()
                assert await page.evaluate('window.fixtureRetries') == 1
                assert 'No published' not in await page.locator('body').inner_text()
            if state=='empty':
                await expect(page.locator('.home-experiences')).to_have_count(1)
                await expect(page.locator('.home-experiences .home-catalog-card')).to_have_count(0)
                await expect(page.locator('.home-services a.ds-section-action')).to_be_visible()
                await expect(page.locator('.premium-newbuilds a.ds-section-action')).to_be_visible()
                await expect(page.locator('.home-area-guide-link')).to_have_count(4)
            await page.screenshot(path=str(OUTPUT/f'en-390-{state}.png'),full_page=True)
            results.append({'language':'en','state':state,'width':390,'pageOverflow':False})
            await context.close()
        await browser.close()
    (OUTPUT/'results.json').write_text(json.dumps(results,indent=2))
    print(json.dumps({'passed':len(results),'output':str(OUTPUT)}))
asyncio.run(main())
