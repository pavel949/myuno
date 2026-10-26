"""Synthetic real browse/card QA. No SPA, tiles, auth, database, or production requests."""
import asyncio, json, os, sys
from pathlib import Path
from urllib.parse import urlparse, parse_qs, urlencode
from playwright.async_api import async_playwright, expect
OUTPUT = Path(sys.argv[1])

async def main():
    results = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, **({'executable_path': os.environ['PLAYWRIGHT_CHROMIUM_EXECUTABLE']} if os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE') else {}))
        for lang in ['ru', 'en']:
            for width in [375, 390, 430, 1280]:
                context = await browser.new_context(viewport={'width': width, 'height': 1500}, has_touch=width < 640, service_workers='block')
                blocked, errors = [], []
                async def route(r):
                    parsed = urlparse(r.request.url)
                    name = 'fixture.html' if parsed.path == '/fixture' else parsed.path.lstrip('/')
                    types = {'fixture.html': 'text/html', 'fixture.js': 'text/javascript', 'fixture.css': 'text/css', 'synthetic-property.svg': 'image/svg+xml'}
                    if parsed.netloc == 'localhost:8080' and name in types:
                        await r.fulfill(path=str(OUTPUT/name), content_type=types[name])
                    else:
                        blocked.append(r.request.url)
                        await r.abort()
                await context.route('**/*', route)
                page = await context.new_page()
                page.on('pageerror', lambda e: errors.append(str(e)))
                async def bounds():
                    size = await page.evaluate('({width:document.documentElement.scrollWidth,viewport:innerWidth})')
                    assert size['width'] <= width, size
                for mode in ['rent', 'buy']:
                    params = {'lang': lang, 'mode': mode, 'tenancy': 'long', 'cats': 'pool', 'f.price_min': '1000',
                              'checkIn': '2026-11-01', 'checkOut': '2026-11-05', 'guests': '3', 'company': 'synthetic-company', 'district': 'Bang Tao'}
                    if mode == 'buy':
                        params['intent'] = 'assignment'
                    url = 'http://localhost:8080/fixture?' + urlencode(params)
                    await page.goto(url, wait_until='networkidle')
                    cards = page.locator('[data-catalog-kind][data-listing-id]')
                    await expect(cards).to_have_count(1)
                    await expect(cards.first).to_have_attribute('data-listing-id', 'synthetic-villa')
                    await bounds()
                    title_link = cards.first.get_by_role('link', name='Тестовая вилла с бассейном' if lang == 'ru' else 'Synthetic pool villa', exact=True)
                    await expect(title_link).to_have_attribute('href', f'/property/synthetic-villa?mode={mode}&checkIn=2026-11-01&checkOut=2026-11-05&guests=3&tenancy=long'+('&intent=assignment' if mode=='buy' else ''))
                    await title_link.focus()
                    await expect(title_link).to_be_focused()
                    if width < 640:
                        box = await cards.first.bounding_box()
                        assert box and box['width'] >= width - 40, box
                        assert box['x'] >= 16, box
                    await page.screenshot(path=str(OUTPUT/f'{lang}-{width}-{mode}-list.png'))
                    toggle = page.get_by_role('button', name='Карта' if lang == 'ru' else 'Map', exact=True)
                    await toggle.focus()
                    await toggle.press('Enter')
                    await expect(page.get_by_test_id('map')).to_be_visible()
                    after = parse_qs((await page.get_by_test_id('location').text_content()).split('?', 1)[1])
                    assert all(after[k] == [v] for k, v in params.items()), after
                    assert after['view'] == ['map']
                    assert (await page.evaluate('window.fixtureFilters.listingType')) == ('sale' if mode == 'buy' else 'rent')
                    await expect(page.get_by_test_id('map')).to_have_attribute('data-mode', mode)
                    await expect(page.get_by_test_id('marker')).to_have_count(1)
                    await expect(page.get_by_test_id('marker')).to_have_attribute('data-listing-id', 'synthetic-villa')
                    await page.get_by_test_id('marker').click()
                    await expect(cards.first).to_have_attribute('aria-selected', 'true')
                    selected = await page.get_by_test_id('location').text_content()
                    assert 'focus=synthetic-villa' in selected
                    await page.evaluate('scrollTo(0,0)')
                    await bounds()
                    await page.screenshot(path=str(OUTPUT/f'{lang}-{width}-{mode}-map.png'))
                    # Real listing-card behavior must still reach its detail boundary in map mode.
                    await cards.first.click()
                    await expect(page.get_by_test_id('detail-boundary')).to_have_text('/property/synthetic-villa')
                    detail_params = parse_qs((await page.get_by_test_id('location').text_content()).split('?', 1)[1])
                    assert detail_params == {k: [params[k]] for k in ['mode', 'checkIn', 'checkOut', 'guests', 'tenancy']+(['intent'] if mode=='buy' else [])}, detail_params
                    await page.get_by_test_id('history-back').click()
                    await expect(page.get_by_test_id('map')).to_be_visible()
                    await expect(page.get_by_test_id('marker')).to_have_attribute('aria-pressed', 'true')
                    await page.get_by_role('button', name='Список' if lang == 'ru' else 'List', exact=True).click()
                    await expect(page.get_by_test_id('map')).to_have_count(0)
                    final = parse_qs((await page.get_by_test_id('location').text_content()).split('?', 1)[1])
                    assert all(final[k] == [v] for k, v in params.items()), final
                    assert 'view' not in final and final['focus'] == ['synthetic-villa']
                    await page.get_by_test_id('history-back').click()
                    await expect(page.get_by_test_id('map')).to_be_visible()
                    # Direct shared map URL must work without navigating through the list.
                    await page.goto(url + '&view=map&focus=synthetic-villa', wait_until='networkidle')
                    await expect(page.get_by_test_id('map')).to_be_visible()
                    await expect(page.get_by_test_id('marker')).to_have_attribute('aria-pressed', 'true')
                for state in ['loading', 'empty', 'error', 'partial-error']:
                    await page.goto('http://localhost:8080/fixture?' + urlencode({'lang': lang, 'state': state, 'view': 'map'}), wait_until='networkidle')
                    await bounds()
                    await expect(page.get_by_test_id('map')).to_have_count(0)
                    if 'error' in state:
                        await expect(page.get_by_role('alert')).to_be_visible()
                        await expect(page.get_by_text('Пока нет объектов' if lang == 'ru' else 'No properties yet', exact=True)).to_have_count(0)
                        await expect(page.get_by_text('Всего объектов: 2' if lang == 'ru' else 'Total: 2', exact=True)).to_have_count(0)
                        await page.screenshot(path=str(OUTPUT/f'{lang}-{width}-{state}.png'))
                        await page.get_by_role('button', name='Повторить' if lang == 'ru' else 'Retry', exact=True).click()
                        await expect(page.get_by_test_id('map')).to_be_visible()
                        assert await page.evaluate('window.fixtureRetry') == 1
                    elif state == 'empty':
                        await expect(page.get_by_text('Пока нет объектов' if lang == 'ru' else 'No properties yet', exact=True)).to_be_visible()
                    await page.screenshot(path=str(OUTPUT/f'{lang}-{width}-{state}-final.png'))
                assert not blocked, blocked
                assert not errors, errors
                results.append({'language': lang, 'width': width, 'modes': ['rent', 'buy'], 'states': ['populated', 'loading', 'empty', 'error', 'partial-error'],
                                'contextRoundtrip': 'pass', 'sameResultIds': 'pass', 'detailBoundary': 'pass', 'selectionHistory': 'pass',
                                'overflow': 'none', 'externalRequests': 0, 'runtimeErrors': 0})
                await context.close()
        await browser.close()
    (OUTPUT/'results.json').write_text(json.dumps(results, ensure_ascii=False, indent=2))
    print(json.dumps(results, ensure_ascii=False, indent=2))
asyncio.run(main())

