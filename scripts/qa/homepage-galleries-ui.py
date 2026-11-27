"""Anonymous homepage layout and interaction matrix. Local fixture only; deny backend traffic."""
import asyncio, json, os, sys, time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import parse_qsl, urlparse
from playwright.async_api import async_playwright, expect, TimeoutError as PlaywrightTimeoutError
OUTPUT = Path(sys.argv[1])
WIDTHS = [320,360,375,390,430,768,1440,1920]
if not os.environ.get('CI') and os.environ.get('HOME_GALLERY_WIDTHS'):
    selected = [int(value) for value in os.environ['HOME_GALLERY_WIDTHS'].split(',')]
    if not selected or any(width not in WIDTHS for width in selected): raise ValueError('Unknown bounded local viewport')
    WIDTHS = selected

SHARD=os.environ.get('HOME_GALLERY_SHARD')
if SHARD not in [None,'en','ru','th']: raise ValueError('Unknown gallery language shard')
LANGUAGES=[SHARD] if SHARD else ['en','ru','th']

HOME_COPY = {
    'en': {
        'form': 'Search myUNO', 'rent': 'Rent', 'activity': 'Experiences & services', 'buy': 'Buy',
        'guests': 'Number of guests', 'filters': 'Filters', 'area_label': 'Choose an area', 'area': 'Rawai',
        'done': 'Done', 'market': 'Choose a catalogue', 'services': 'Services', 'activity_query': 'What are you looking for?',
    },
    'ru': {
        'form': 'Поиск на myUNO', 'rent': 'Аренда', 'activity': 'Экскурсии и услуги', 'buy': 'Покупка',
        'guests': 'Количество гостей', 'filters': 'Фильтры', 'area_label': 'Выберите район', 'area': 'Равай',
        'done': 'Готово', 'market': 'Раздел каталога', 'services': 'Услуги', 'activity_query': 'Что ищете?',
    },
    'th': {
        'form': 'ค้นหาใน myUNO', 'rent': 'เช่า', 'activity': 'ประสบการณ์และบริการ', 'buy': 'ซื้อ',
        'guests': 'จำนวนผู้เข้าพัก', 'filters': 'ตัวกรอง', 'area_label': 'เลือกย่าน', 'area': 'Rawai',
        'done': 'เสร็จสิ้น', 'market': 'เลือกแคตตาล็อก', 'services': 'บริการ', 'activity_query': 'คุณกำลังมองหาอะไร?',
    },
}


async def check_home_entry(page, lang, width):
    copy = HOME_COPY[lang]
    panel = page.locator('.home-hero-search')
    search = page.get_by_role('form', name=copy['form'], exact=True)
    await expect(panel.get_by_role('form', name=copy['form'], exact=True)).to_have_count(1)
    await expect(page.locator('form.home-search')).to_have_count(1)
    modes = search.locator('.home-search-modes')
    await expect(modes.get_by_role('button')).to_have_count(3)
    rent = modes.get_by_role('button', name=copy['rent'], exact=True)
    activity = modes.get_by_role('button', name=copy['activity'], exact=True)
    buy = modes.get_by_role('button', name=copy['buy'], exact=True)
    await expect(rent).to_have_attribute('aria-pressed', 'true')
    await expect(activity).to_be_visible()
    await expect(buy).to_be_visible()
    await expect(search.get_by_role('spinbutton')).to_have_count(0)
    submit = search.locator('.home-search-submit')
    await expect(submit).to_have_attribute('type', 'submit')
    filters = search.get_by_role('button', name=copy['filters'], exact=True)
    await expect(filters).to_have_attribute('aria-expanded', 'false')

    photo = page.locator('.home-hero-banner-photo')
    await expect(photo).to_have_attribute('alt', '')
    await page.wait_for_function('(el) => el.complete && el.naturalWidth > 0', arg=await photo.element_handle())
    await page.evaluate("window.scrollTo({top: 0, behavior: 'instant'})")
    geometry = await search.evaluate("""
      (form) => {
        const rect = el => el.getBoundingClientRect().toJSON();
        const controls = ['location', 'dates', 'type', 'bedrooms', 'refine', 'submit'];
        return {
          form: rect(form),
          photo: rect(document.querySelector('.home-hero-banner-photo')),
          banner: rect(document.querySelector('.home-hero-banner')),
          controls: controls.map(name => rect(form.querySelector('.home-search-' + name))),
        };
      }
    """)
    assert geometry['form']['left'] >= -1 and geometry['form']['right'] <= width + 1, geometry
    assert geometry['photo']['height'] > 160, geometry
    assert abs(geometry['photo']['width'] - geometry['banner']['width']) <= 1, geometry
    assert geometry['controls'][-1]['height'] >= 44, geometry
    if width >= 1024:
        bottoms = [control['bottom'] for control in geometry['controls']]
        assert max(bottoms) - min(bottoms) <= 2, geometry
        await panel.evaluate("(el) => window.scrollTo({top: scrollY + el.getBoundingClientRect().top + 200, behavior: 'instant'})")
        sticky = await page.evaluate("""
          () => {
            const header = document.querySelector('.consumer-header').getBoundingClientRect();
            const panel = document.querySelector('.home-hero-search').getBoundingClientRect();
            return {headerBottom: header.bottom, panelTop: panel.top, scroll: scrollY};
          }
        """)
        assert sticky['scroll'] > 0 and abs(sticky['headerBottom'] - sticky['panelTop']) <= 2, sticky
        await page.evaluate("window.scrollTo({top: 0, behavior: 'instant'})")

    emergency = page.locator('.home-hero-banner').get_by_role('button', name={
        'ru': 'Срочная помощь', 'en': 'Urgent help', 'th': 'ความช่วยเหลือฉุกเฉิน',
    }[lang], exact=True)
    await expect(emergency).to_be_visible()
    await expect(emergency).to_be_in_viewport(ratio=1)
    assert (await emergency.bounding_box())['height'] >= 44
    contrast = await emergency.evaluate('''button => {
        const style = getComputedStyle(button)
        const luminance = color => color.match(/[0-9.]+/g).slice(0, 3).reduce((sum, channel, index) => {
            const value = Number(channel) / 255
            return sum + [0.2126, 0.7152, 0.0722][index] *
                (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
        }, 0)
        const levels = [luminance(style.color), luminance(style.backgroundColor)].sort((a, b) => a - b)
        return (levels[1] + 0.05) / (levels[0] + 0.05)
    }''')
    assert contrast >= 4.5, f'Urgent help contrast: {contrast}'
    await page.evaluate('document.fonts.ready')
    await page.locator('.home-hero-banner-photo').evaluate('image => image.decode()')
    await page.screenshot(path=str(OUTPUT / f"{lang}-{page.viewport_size['width']}-hero.png"))

    await emergency.press('Enter')
    emergency_dialog = page.get_by_role('dialog')
    await expect(emergency_dialog).to_be_visible()
    assert await emergency_dialog.locator('a[href^="tel:"]').evaluate_all(
        '(links) => links.map(link => link.getAttribute("href"))'
    ) == ['tel:1669', 'tel:191', 'tel:1155']
    await emergency_dialog.get_by_role('button', name={'ru': 'Закрыть', 'en': 'Close', 'th': 'ปิด'}[lang]).press('Escape')
    await expect(emergency_dialog).to_have_count(0)
    await expect(emergency).to_be_focused()

    await filters.press('Enter')
    await expect(search.locator('.home-search-refine')).to_have_attribute('aria-expanded', 'true')
    area = search.get_by_role('combobox', name=copy['area_label'], exact=True)
    await area.press('Enter')
    await page.get_by_role('option', name=copy['area'], exact=True).click()
    await search.locator('.home-search-date-trigger').press('Enter')
    calendar = page.get_by_role('dialog')
    await expect(calendar).to_be_visible()
    await calendar.get_by_role('spinbutton', name=copy['guests'], exact=True).fill('3')
    await calendar.locator('[data-day="2027-05-12"] button').press('Enter')
    await calendar.locator('[data-day="2027-05-15"] button').press('Space')
    await expect(calendar).to_be_visible()
    await calendar.get_by_role('button', name=copy['done'], exact=True).press('Enter')
    await expect(calendar).to_have_count(0)

    destination = page.get_by_test_id('location')
    await submit.press('Enter')
    await expect(destination).to_contain_text('/property/search?')
    rental = urlparse(await destination.text_content())
    assert rental.path == '/property/search'
    assert dict(parse_qsl(rental.query, keep_blank_values=True)) == {
        'mode': 'rent', 'tenancy': 'short', 'district': 'rawai',
        'checkIn': '2027-05-12', 'checkOut': '2027-05-15', 'guests': '3',
    }, rental

    await activity.press('Enter')
    await expect(search).to_have_attribute('data-home-discovery-mode', 'activities')
    await search.get_by_role('combobox', name=copy['market'], exact=True).press('Enter')
    await page.get_by_role('option', name=copy['services'], exact=True).click()
    await search.get_by_role('searchbox', name=copy['activity_query'], exact=True).fill('airport transfer')
    await submit.press('Enter')
    await expect(destination).to_have_text('/discover/services?q=airport+transfer')

    await buy.press('Enter')
    await expect(search).to_have_attribute('data-home-discovery-mode', 'buy')
    await expect(search.locator('.home-search-date-trigger')).to_have_count(0)
    await submit.press('Enter')
    await expect(destination).to_contain_text('mode=buy')
    sale = urlparse(await destination.text_content())
    sale_query = dict(parse_qsl(sale.query, keep_blank_values=True))
    assert sale.path == '/property/search' and sale_query.get('maxPrice') == '10000000', sale
    assert not {'checkIn', 'checkOut', 'guests'} & sale_query.keys(), sale
    await rent.press('Enter')
    await expect(page.get_by_role('dialog')).to_have_count(0)
    assert await page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'Search overflow {lang} {width}'

async def main():
    results = []
    async with async_playwright() as p:
        system = os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium')
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
                blocked, errors, console_errors = [], [], []
                await context.route('**/*', route)
                page = await context.new_page()
                page.on('pageerror', lambda error: errors.append(str(error)))
                page.on('console', lambda message: console_errors.append(message.text) if message.type == 'error' else None)
                await page.clock.set_fixed_time(datetime(2027, 5, 11, 12, tzinfo=timezone.utc))
                try:
                    await page.goto(f'http://localhost:8080/fixture?lang={lang}', wait_until='domcontentloaded')
                    await expect(page.locator('.home-rail-viewport')).to_have_count(6)
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
                        geometry = await card.evaluate("""node => {
                          const art=node.querySelector('.home-service-category-art');
                          const action=node.querySelector('.home-service-category-copy > span');
                          const style=getComputedStyle(node);
                          return {artWidth:art.getBoundingClientRect().width,artHeight:art.getBoundingClientRect().height,
                            actionHeight:action.getBoundingClientRect().height,radius:style.borderRadius,
                            tokenRadius:getComputedStyle(document.documentElement).getPropertyValue('--radius-md').trim(),
                            border:style.borderTopWidth};
                        }""")
                        assert abs(geometry['artWidth']-44)<=1 and abs(geometry['artHeight']-44)<=1, geometry
                        assert geometry['actionHeight']>=44 and geometry['border']=='1px',geometry
                        assert geometry['radius']==geometry['tokenRadius'],geometry


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
                            expected=(1 if width<=350 else 2) if 'home-services' in layout['section'] else (2 if width<1024 else 4) if 'home-locations' in layout['section'] else 3
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
                        session = await context.new_cdp_session(page)
                        for area in ['home-properties', 'premium-newbuilds', 'home-experiences']:
                            rail = page.locator(f'.{area} .home-rail-viewport')
                            await rail.evaluate("""el => {
                                el.scrollIntoView({block:'center', inline:'nearest', behavior:'instant'});
                                el.scrollTo({left:0, behavior:'instant'});
                            }""")
                            box = await rail.bounding_box()
                            y = box['y'] + box['height'] / 2
                            x = box['x'] + box['width'] * .88
                            assert await rail.evaluate('(el, pos)=>el.contains(document.elementFromPoint(...pos))', [x, y]), f'{area}: touch starts outside the rail'
                            await session.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]})
                            for step in range(1,9):
                                await session.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x - step * box['width'] * .09,'y':y}]})
                            await session.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
                            try:
                                await page.wait_for_function('(el)=>el.scrollLeft>0',arg=await rail.element_handle(),timeout=5000)
                            except PlaywrightTimeoutError as error:
                                raise AssertionError(f'{area}: horizontal swipe did not scroll the rail at {width}px') from error
                        await session.detach()
                    await check_home_entry(page, lang, width)
                    await expect(page.locator('.premium-newbuilds .home-rail article')).to_have_count(6)
                    # The rail controls must never intercept the catalogue header action.
                    catalogue = page.locator('.home-properties .home-gallery-heading a')
                    await catalogue.evaluate("el => el.scrollIntoView({block:'center',inline:'nearest'})")
                    hit = await catalogue.evaluate("el => { const r=el.getBoundingClientRect(); const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2); return hit === el || el.contains(hit); }")
                    assert hit, 'Rental catalogue link is covered by rail controls'
                    await catalogue.click()
                    await expect(page.get_by_test_id('location')).to_have_text('/property/search?mode=rent')
                    sale_catalogue = page.locator('.home-sale-band .home-gallery-heading a')
                    sale_href = await sale_catalogue.get_attribute('href')
                    sale_destination = urlparse(sale_href)
                    assert sale_destination.path == '/property/search'
                    assert dict(parse_qsl(sale_destination.query)) == {'mode': 'buy', 'maxPrice': '10000000'}, sale_href
                    await sale_catalogue.click()
                    await expect(page.get_by_test_id('location')).to_have_text(sale_href)
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
                    await page.locator('.home-hero-banner').scroll_into_view_if_needed()
                    await page.screenshot(path=str(OUTPUT/f'{lang}-{width}-homepage.png'), full_page=True)
                    assert not errors, errors
                    results.append({'language':lang,'width':width,'state':'data','pageOverflow':False,'sections':6,'gridSections':grid_sections,'keyboardControlledRails':tested_controls,'swipe':width<768,'nativeMobileTap':width<768,'verifiedSearchModes':3,'errors':errors})
                    print(json.dumps({'completed':len(results),'language':lang,'width':width,'seconds':round(time.monotonic()-case_started,2)}),flush=True)
                except Exception:
                    await page.screenshot(path=str(OUTPUT/f"failure-{lang}-{width}.png"),full_page=True)
                    active = await page.evaluate("document.activeElement?.outerHTML?.slice(0, 400)")
                    print(json.dumps({"language":lang,"width":width,"activeElement":active,"dialogs":await page.get_by_role("dialog").count(),"pageErrors":errors[:4],"consoleErrors":console_errors[:4]}),flush=True)
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
                await expect(page.get_by_role('alert')).to_have_count(5)
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
