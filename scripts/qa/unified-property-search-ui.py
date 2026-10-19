"""Canonical property search + real redirect/editor; synthetic reads and deny-all external network."""
import asyncio, json, sys
from datetime import datetime, timezone
from pathlib import Path
from time import monotonic
from urllib.parse import urlparse, parse_qs, urlencode
from playwright.async_api import async_playwright, expect

OUTPUT = Path(sys.argv[1])

async def main():
    results = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        for lang in ['ru', 'en']:
            for width in [375, 390, 430, 1280]:
                context = await browser.new_context(viewport={'width': width, 'height': 1000},
                    has_touch=width < 768, timezone_id='UTC', service_workers='block')
                blocked, errors = [], []
                async def route(r):
                    parsed = urlparse(r.request.url)
                    name = 'fixture.html' if parsed.path == '/fixture' else parsed.path.lstrip('/')
                    types = {'fixture.html':'text/html', 'fixture.js':'text/javascript', 'fixture.css':'text/css',
                             'synthetic-property.svg':'image/svg+xml'}
                    if parsed.netloc == 'localhost:8080' and name in types:
                        await r.fulfill(path=str(OUTPUT/name), content_type=types[name])
                    else:
                        blocked.append(r.request.url)
                        await r.abort()
                await context.route('**/*', route)
                page = await context.new_page()
                page.on('pageerror', lambda error: errors.append(str(error)))
                await page.clock.install(time=datetime(2026, 10, 18, 18, 30, tzinfo=timezone.utc))
                ru = lang == 'ru'
                type_label = 'Тип жилья' if ru else 'Home type'
                area_label = 'Выберите район' if ru else 'Choose an area'
                guests_label = 'Количество гостей' if ru else 'Number of guests'
                date_label = 'Даты проживания' if ru else 'Stay dates'
                search_label = 'Найти жильё' if ru else 'Find a home'
                edit_label = 'Изменить поиск' if ru else 'Edit search'
                close_label = 'Закрыть поиск' if ru else 'Close search'
                async def query():
                    text = await page.get_by_test_id('location').text_content()
                    assert text.startswith('/property/search?'), text
                    return parse_qs(text.split('?', 1)[1])
                async def bounds(locator=None):
                    deadline, previous, stable = monotonic()+5, None, 0
                    while True:
                        size = await page.evaluate('document.documentElement.scrollWidth')
                        box = await locator.bounding_box() if locator else None
                        internal = await locator.evaluate('(el)=>el.scrollWidth<=el.clientWidth') if locator else True
                        valid = size <= width and internal
                        if locator:
                            valid = valid and bool(box) and box['x'] >= -1 and box['x']+box['width'] <= width+1
                        snapshot = (size,box,internal)
                        stable = stable+1 if valid and snapshot == previous else (1 if valid else 0)
                        if stable >= 3:
                            return
                        if monotonic() > deadline:
                            raise AssertionError({'width':width,'scrollWidth':size,'box':box,'internal':internal})
                        previous = snapshot
                        await asyncio.sleep(.05)
                async def choose(label, option):
                    trigger = page.get_by_role('combobox', name=label)
                    await trigger.press('Enter')
                    menu = page.get_by_role('listbox')
                    await expect(menu).to_be_visible()
                    await bounds(menu)
                    await page.get_by_role('option', name=option, exact=True).click()
                    await expect(trigger).to_be_focused()
                async def collapsed(focused=False):
                    await expect(page.get_by_role('form')).to_have_count(0)
                    await expect(page.get_by_role('button',name=edit_label,exact=True)).to_have_attribute('aria-expanded','false')
                    if focused:
                        await expect(page.get_by_role('heading',level=2)).to_be_focused()
                    first = page.locator('[data-catalog-kind][data-listing-id]').first
                    await expect(first).to_be_visible()
                    top = await first.evaluate('(el)=>el.getBoundingClientRect().top+scrollY')
                    # Isolated page excludes global consumer header; bound concerns page content.
                    assert top < (560 if width < 768 else 460), {'firstOfferDocumentTop':top,'width':width,'globalHeader':'stubbed'}
                async def hydrated(kind, area, guests=None, mode='rent'):
                    if await page.get_by_role('button',name=edit_label,exact=True).count():
                        await page.get_by_role('button',name=edit_label,exact=True).press('Enter')
                        await expect(page.get_by_role('button',name=close_label,exact=True)).to_have_attribute('aria-expanded','true')
                    await expect(page.get_by_role('form')).to_have_count(1)
                    await expect(page.get_by_role('combobox', name=type_label)).to_contain_text(kind)
                    await expect(page.get_by_role('combobox', name=area_label)).to_contain_text(area)
                    modes = page.get_by_role('group', name='Аренда или покупка' if ru else 'Rent or buy', exact=True)
                    await expect(modes).to_be_visible()
                    for value, label in [('rent', 'Аренда' if ru else 'Rent'), ('buy', 'Покупка' if ru else 'Buy')]:
                        button = modes.get_by_role('button', name=label, exact=True)
                        await expect(button).to_be_visible()
                        await expect(button).to_have_attribute('aria-pressed', str(value == mode).lower())
                    if mode == 'rent':
                        await expect(page.get_by_label(guests_label)).to_have_value(str(guests))
                    else:
                        await expect(page.get_by_label(guests_label)).to_have_count(0)
                        await expect(page.get_by_role('button',name=date_label)).to_have_count(0)
                async def server(expected):
                    await page.wait_for_function('(expected)=>Object.entries(expected).every(([key,value])=>JSON.stringify(window.fixtureFilters?.[key])===JSON.stringify(value))',arg=expected)
                try:
                    initial = {'lang':lang,'mode':'rent','tenancy':'short','district':'layan','types':'villa',
                        'guests':'3','checkIn':'2026-11-10T00:00:00.000Z','checkOut':'2026-11-15T00:00:00.000Z','company':'synthetic-company','source':'fixture-bookmark'}
                    await page.goto('http://localhost:8080/fixture?'+urlencode(initial),wait_until='networkidle')
                    await collapsed()
                    summary = page.get_by_label('Текущий поиск' if ru else 'Current search')
                    await expect(summary).to_contain_text('Вилла' if ru else 'Villa')
                    await expect(summary).to_contain_text('Лаян' if ru else 'Layan')
                    await expect(summary).to_contain_text('10')
                    await expect(summary).to_contain_text('15')
                    await expect(summary).to_contain_text('3')
                    await expect(summary).to_contain_text('Доп. фильтров: 1' if ru else 'Additional filters: 1')
                    await page.screenshot(path=str(OUTPUT/f'{lang}-{width}-collapsed.png'),full_page=True)
                    await expect(page.get_by_role('button',name='Все компании' if ru else 'All companies',exact=True)).to_have_count(0)
                    quick = page.get_by_role('group',name='Популярные удобства' if ru else 'Popular features',exact=True)
                    await expect(quick.get_by_role('button')).to_have_count(3)
                    for button in await quick.get_by_role('button').all():
                        box = await button.bounding_box()
                        assert box['height'] >= 44, box
                    await bounds()
                    if width in [390, 1280]:
                        await page.evaluate("document.documentElement.classList.add('dark')")
                        await page.screenshot(path=str(OUTPUT/f'{lang}-{width}-collapsed-dark.png'),full_page=True)
                        await page.evaluate("document.documentElement.classList.remove('dark')")
                    await hydrated('Вилла' if ru else 'Villa','Лаян' if ru else 'Layan',3)
                    await expect(page.get_by_role('button',name=date_label)).to_contain_text('10')
                    await expect(page.get_by_role('button',name=date_label)).to_contain_text('15')
                    await server({'listingType':'rent','district':'layan','propertyType':'villa','minGuests':3,'rentTenancy':'short','managementCompanyId':'synthetic-company'})
                    current = await query()
                    assert all(current.get(k)==[v] for k,v in initial.items()),current
                    await expect(page.locator('[data-catalog-kind][data-listing-id]')).to_have_count(1)
                    await bounds()
                    await page.screenshot(path=str(OUTPUT/f'{lang}-{width}-hydrated.png'),full_page=True)
                    await page.get_by_role('button',name=close_label,exact=True).press('Enter')
                    await expect(page.get_by_role('button',name=edit_label,exact=True)).to_be_focused()
                    await collapsed()
                    await page.get_by_role('button',name=edit_label,exact=True).press('Enter')
                    await choose(type_label,'Кондо' if ru else 'Condo')
                    await choose(area_label,'Равай' if ru else 'Rawai')
                    await page.get_by_label(guests_label).fill('5')
                    await page.get_by_role('button',name='Помесячно' if ru else 'Monthly',exact=True).click()
                    await page.get_by_role('button',name=date_label).press('Enter')
                    dialog = page.get_by_role('dialog')
                    await expect(dialog).to_be_visible()
                    await bounds(dialog)
                    await dialog.get_by_role('gridcell',name='12',exact=True).press('Enter')
                    await dialog.get_by_role('gridcell',name='18',exact=True).press('Space')
                    await expect(dialog).to_have_count(0)
                    await page.get_by_role('button',name=search_label,exact=True).click()
                    await page.get_by_test_id('location').wait_for(state='attached')
                    await expect(page.get_by_test_id('location')).to_contain_text('guests=5')
                    edited = await query()
                    expected = {'mode':'rent','tenancy':'medium','district':'rawai','types':'condo','guests':'5',
                        'checkIn':'2026-11-12T00:00:00.000Z','checkOut':'2026-11-18T00:00:00.000Z',
                        'company':'synthetic-company','source':'fixture-bookmark'}
                    assert all(edited.get(k)==[v] for k,v in expected.items()),edited
                    await server({'listingType':'rent','district':'rawai','propertyType':'condo','minGuests':5,'rentTenancy':'medium'})
                    await collapsed(focused=True)
                    await page.screenshot(path=str(OUTPUT/f'{lang}-{width}-edited-collapsed.png'),full_page=True)
                    await hydrated('Кондо' if ru else 'Condo','Равай' if ru else 'Rawai',5)
                    await bounds()
                    await page.screenshot(path=str(OUTPUT/f'{lang}-{width}-edited.png'),full_page=True)
                    await page.get_by_test_id('history-back').click()
                    await hydrated('Вилла' if ru else 'Villa','Лаян' if ru else 'Layan',3)
                    current = await query()
                    assert all(current.get(k)==[v] for k,v in initial.items()),current
                    await server({'district':'layan','propertyType':'villa','minGuests':3})
                    await page.get_by_test_id('history-forward').click()
                    await hydrated('Кондо' if ru else 'Condo','Равай' if ru else 'Rawai',5)
                    assert await query() == edited
                    await page.get_by_role('button',name='Покупка' if ru else 'Buy',exact=True).click()
                    await collapsed()
                    await expect(page.get_by_test_id('location')).to_contain_text('mode=buy')
                    purchase = await query()
                    assert purchase['district']==['rawai'] and purchase['types']==['condo'],purchase
                    assert all(purchase.get(k)==edited[k] for k in ['guests','checkIn','checkOut','tenancy']),purchase
                    await hydrated('Кондо' if ru else 'Condo','Равай' if ru else 'Rawai',mode='buy')
                    await server({'listingType':'sale','district':'rawai','propertyType':'condo'})
                    assert await page.evaluate('window.fixtureFilters.minGuests === undefined && window.fixtureFilters.rentTenancy === undefined')
                    await bounds()
                    await page.screenshot(path=str(OUTPUT/f'{lang}-{width}-purchase.png'),full_page=True)
                    await page.get_by_test_id('history-back').click()
                    await hydrated('Кондо' if ru else 'Condo','Равай' if ru else 'Rawai',5)
                    assert await query() == edited
                    await expect(page.get_by_role('button',name=date_label)).to_contain_text('12')
                    await expect(page.get_by_role('button',name=date_label)).to_contain_text('18')
                    # Exercise the real alias component, preserving legacy bookmarks verbatim.
                    legacy = {'lang':lang,'entry':'/property/browse','mode':'rent','tenancy':'long','f.district':'rawai',
                        'f.propertyType':'condo','f.guestsAtLeast':'4','checkIn':'2026-11-10','checkOut':'2026-11-15','source':'legacy-bookmark'}
                    await page.goto('http://localhost:8080/fixture?'+urlencode(legacy),wait_until='networkidle')
                    await expect(page.get_by_test_id('location')).to_contain_text('/property/search?')
                    normalized = await query()
                    assert all(normalized.get(k)==[v] for k,v in legacy.items() if k!='entry'),normalized
                    await hydrated('Кондо' if ru else 'Condo','Равай' if ru else 'Rawai',4)
                    await server({'listingType':'rent','district':'rawai','propertyType':'condo','minGuests':4,'rentTenancy':'long'})
                    await bounds()
                    await page.screenshot(path=str(OUTPUT/f'{lang}-{width}-legacy-redirect.png'),full_page=True)
                    await page.get_by_role('button',name=search_label,exact=True).click()
                    await expect(page.get_by_test_id('location')).to_contain_text('guests=4')
                    normalized = await query()
                    assert normalized['district']==['rawai'] and normalized['types']==['condo'],normalized
                    assert not any(k in normalized for k in ['f.district','f.propertyType','f.guestsAtLeast']),normalized
                    # Direct purchase bookmark must hydrate without exposing rental controls.
                    buy = {'lang':lang,'mode':'buy','district':'layan','types':'villa','intent':'assignment','source':'purchase-bookmark'}
                    await page.goto('http://localhost:8080/fixture?'+urlencode(buy),wait_until='networkidle')
                    await hydrated('Вилла' if ru else 'Villa','Лаян' if ru else 'Layan',mode='buy')
                    await server({'listingType':'sale','district':'layan','propertyType':'villa','saleIntent':'assignment'})
                    current = await query()
                    assert all(current.get(k)==[v] for k,v in buy.items()),current
                    await page.get_by_role('button',name=search_label,exact=True).click()
                    current = await query()
                    assert not any(k in current for k in ['guests','checkIn','checkOut','tenancy']),current
                    await bounds()
                    await page.screenshot(path=str(OUTPUT/f'{lang}-{width}-direct-purchase.png'),full_page=True)
                    await choose('Сортировка' if ru else 'Sort homes', 'Цена: по возрастанию' if ru else 'Price: Low → High')
                    # Quick chips and the real responsive filter sheet share one URL state.
                    pool_label = 'Свой бассейн' if ru else 'Private pool'
                    filter_label = 'Фильтры' if ru else 'Filters'
                    await page.get_by_role('button',name=pool_label,exact=True).click()
                    await expect(page.get_by_role('button',name=pool_label,exact=True)).to_have_attribute('aria-pressed','true')
                    await page.get_by_role('button',name=filter_label+' (1)',exact=True).click()
                    filters = page.get_by_role('dialog')
                    await expect(filters).to_be_visible()
                    await bounds(filters)
                    await expect(filters.get_by_role('button',name=pool_label,exact=True)).to_have_attribute('aria-pressed','true')
                    await expect(filters.get_by_role('button',name='Джакузи' if ru else 'Jacuzzi / Hot tub',exact=True)).to_be_visible()
                    await filters.get_by_role('button',name='WiFi',exact=True).click()
                    await page.screenshot(path=str(OUTPUT/f'{lang}-{width}-filters.png'),full_page=True)
                    await filters.get_by_role('button',name='Применить (1)' if ru else 'Apply (1)',exact=True).click()
                    await expect(filters).to_have_count(0)
                    features = await query()
                    assert features['cats']==['private_pool,wifi'],features
                    assert 'f.guestFeatures' not in features,features
                    assert features['intent']==['assignment'] and features['source']==['purchase-bookmark'],features
                    await page.get_by_role('button',name=pool_label,exact=True).click()
                    await page.get_by_role('button',name=filter_label+' (1)',exact=True).click()
                    filters = page.get_by_role('dialog')
                    await expect(filters.get_by_role('button',name=pool_label,exact=True)).to_have_attribute('aria-pressed','false')
                    await expect(filters.get_by_role('button',name='WiFi',exact=True)).to_have_attribute('aria-pressed','true')
                    await filters.get_by_role('button',name='Применить (1)' if ru else 'Apply (1)',exact=True).click()
                    await page.get_by_role('button',name='Убрать WiFi' if ru else 'Remove WiFi',exact=True).click()
                    await page.get_by_role('button',name='Карта' if ru else 'Map',exact=True).click()
                    await expect(page.get_by_test_id('synthetic-map')).to_be_visible()
                    assert (await query())['view']==['map']
                    await page.get_by_role('button',name='Список' if ru else 'List',exact=True).click()
                    await expect(page.get_by_test_id('synthetic-map')).to_have_count(0)
                    assert 'view' not in await query()
                    await bounds()
                    assert not errors,errors
                    assert not blocked,blocked
                    results.append({'language':lang,'width':width,'hydration':'pass','inPlaceEdit':'pass','history':'pass',
                        'compactSummary':'pass','featureSheetSync':'pass','mapToggle':'pass','firstOfferBound':'<560px mobile / <460px desktop without global header','legacyRedirect':'pass','rentBuy':'pass','overflow':'none','externalRequests':0,'runtimeErrors':0})
                except Exception as error:
                    failure = {'language':lang,'width':width,'error':str(error),'blockedRequests':blocked,'runtimeErrors':errors}
                    try:
                        await page.screenshot(path=str(OUTPUT/f'{lang}-{width}-failure.png'),timeout=3000)
                        (OUTPUT/f'{lang}-{width}-failure.html').write_text(await page.content())
                    except Exception as capture:
                        failure['captureError']=str(capture)
                    (OUTPUT/f'{lang}-{width}-failure.json').write_text(json.dumps(failure,ensure_ascii=False,indent=2))
                    raise
                await context.close()
        await browser.close()
    (OUTPUT/'results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
    print(json.dumps(results,ensure_ascii=False,indent=2))

asyncio.run(main())
