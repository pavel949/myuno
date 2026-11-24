"""Remote-CI-only real public layout, default 100% CSS-pixel viewport geometry.

Synthetic reads and PMTiles archive, no real transactions or live map.
"""
import asyncio
import json
import os
from pathlib import Path
import sys
from urllib.parse import urlencode, urlparse
from playwright.async_api import async_playwright, expect
from public_wide_map_fixture import build_archive, range_response

OUTPUT = Path(sys.argv[1])
ARCHIVE_PATH = json.loads((Path(__file__).resolve().parents[2] / 'src/assets/map/phuket.pmtiles.asset.json').read_text())['url']
ARCHIVE, TILE_OFFSET = build_archive()
WIDTHS = [320, 360, 768, 1024, 1440, 1920, 2560]
# Independent pixel oracle for the approved public gutter scale at these viewports.
HOUSING_GUTTERS = {320:16, 360:20, 768:20, 1024:32, 1440:48, 1920:80, 2560:80}
CASES = [(lang, width, surface, 'normal', 'list') for lang in ['ru', 'en', 'th'] for width in WIDTHS for surface in ['services', 'housing', 'business']]
CASES += [('en', width, 'housing', state, 'list') for width in [360, 1440, 2560] for state in ['loading', 'error', 'empty']]
CASES += [('ru', width, 'housing', 'normal', 'map') for width in [360, 1024, 1440, 2560]]


async def geometry(locator):
    return await locator.evaluate("""e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return{left:r.left,right:r.right,top:r.top,width:r.width,height:r.height,padding:parseFloat(s.paddingLeft),columns:s.gridTemplateColumns}}""")


async def main():
    if not os.environ.get('CI') or os.environ.get('GITHUB_ACTIONS') != 'true':
        raise RuntimeError('Browser execution is remote GitHub CI-only')
    results = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=[
            '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
        ])
        for lang, width, surface, state, view in CASES:
            context = await browser.new_context(viewport={'width': width, 'height': 1000}, device_scale_factor=1, service_workers='block')
            blocked, errors, archive_ranges = [], [], []
            async def route(request):
                parsed = urlparse(request.request.url)
                name = 'fixture.html' if parsed.path == '/fixture' else parsed.path.lstrip('/')
                types = {'fixture.html': 'text/html', 'fixture.js': 'text/javascript', 'fixture.css': 'text/css'}
                if parsed.netloc == 'localhost:8080' and request.request.method == 'GET' and name in types:
                    await request.fulfill(path=str(OUTPUT / name), content_type=types[name])
                elif (surface == 'housing' and view == 'map' and parsed.scheme == 'http'
                      and parsed.netloc == 'localhost:8080' and parsed.path == ARCHIVE_PATH
                      and not parsed.query and request.request.method == 'GET'):
                    status, content_range, body = range_response(ARCHIVE, request.request.headers.get('range'))
                    archive_ranges.append((status, content_range))
                    await request.fulfill(status=status, headers={
                        'content-range': content_range,
                        'accept-ranges': 'bytes',
                        'etag': '"synthetic-public-wide-map-v1"',
                    }, content_type='application/octet-stream', body=body)
                else:
                    blocked.append(request.request.url)
                    await request.abort()
            await context.route('**/*', route)
            page = await context.new_page()
            page.on('pageerror', lambda error: errors.append(str(error)))
            row = {'lang': lang, 'width': width, 'surface': surface, 'state': state, 'view': view, 'outcome': 'FAIL'}
            try:
                await page.goto('http://localhost:8080/fixture?' + urlencode({'lang': lang, 'surface': surface, 'state': state, 'view': view}), wait_until='networkidle')
                await page.evaluate('document.fonts.ready')
                assert await page.evaluate('innerWidth') == width
                assert await page.evaluate('devicePixelRatio') == 1
                assert await page.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'document overflow'
                header = await geometry(page.locator('.consumer-header-inner'))
                frame_limit = 1536 if surface == 'business' else 1760
                expected_header = min(width-2*HOUSING_GUTTERS[width],1760) if surface == 'housing' else min(width, frame_limit)
                assert abs(header['width'] - expected_header) <= 1, header
                row['header'] = header
                # Bounds of visible rendered primary controls. The pre-existing
                # mobile amenities strip intentionally scrolls horizontally.
                bad = await page.locator('button,a,input,select,textarea').evaluate_all("""els=>els.filter(e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden'&&!e.closest('.property-discovery-features')&&!e.closest('nav.overflow-x-auto')).map(e=>{const r=e.getBoundingClientRect();return{text:(e.textContent||e.getAttribute('placeholder')||'').trim().slice(0,100),left:r.left,right:r.right}}).filter(r=>r.left < -1||r.right>innerWidth+1)""")
                assert not bad, {'controlBounds': bad}
                if surface == 'services':
                    # The shared portal has one category grid, with no duplicate highlight rail.
                    await expect(page.locator('nav.overflow-x-auto')).to_have_count(0)
                    menu = page.get_by_test_id('service-discovery-menu')
                    await expect(menu).to_be_visible()
                    menu_metrics = await geometry(menu.locator(':scope > div').last)
                    assert len(menu_metrics['columns'].split()) == (3 if width >= 1024 else 2), menu_metrics
                    await expect(menu.locator('[data-category-id]')).to_have_count(6)
                    for category_id in ['cat-business-legal', 'cat-health-wellness', 'cat-family-kids', 'cat-pet-services']:
                        await expect(menu.locator(f'[data-category-id={category_id}]')).to_be_visible()
                    await expect(menu.locator('[data-category-id=cat-home-services]')).to_be_visible()
                    await menu.get_by_role('button',name={'ru': 'Все категории', 'en': 'All categories', 'th': 'ทุกหมวดหมู่'}[lang],exact=True).click()
                    chooser=page.get_by_role('dialog')
                    await expect(chooser.locator('[data-category-id]:not([data-category-id=cat-emergency])')).to_have_count(12)
                    await expect(chooser.locator('[data-category-id=cat-connectivity]')).to_be_visible()
                    await expect(chooser.locator('a[href="/yachts"]')).to_have_count(1)
                    await chooser.locator('[data-category-id=cat-tourism]').focus()
                    await chooser.locator('[data-category-id=cat-tourism]').press('Enter')
                    await expect(page.get_by_role('dialog')).to_have_count(0)
                    grid = page.get_by_test_id('service-catalogue-results')
                    await expect(grid).to_be_visible()
                    metrics = await geometry(grid)
                    expected = 4 if width >= 1440 else 3 if width >= 1024 else 2 if width >= 640 else 1
                    assert len(metrics['columns'].split()) == expected, metrics
                    parent = await geometry(grid.locator('xpath=../..'))
                    assert abs(parent['left']+parent['padding']-header['left']-header['padding']) <= 1, {'frame': parent, 'header': header}
                    await expect(grid.locator('a[href="/yachts"]')).to_have_count(1)
                    # Keyboard selection stages a category without changing URL or results.
                    await page.get_by_role('button',name={'ru': 'Категории и ситуации', 'en': 'Categories and situations', 'th': 'หมวดหมู่และสถานการณ์'}[lang],exact=True).click()
                    category = page.get_by_role('combobox')
                    await category.press('Enter')
                    option = page.get_by_role('option', name='Транспортные услуги' if lang=='ru' else 'Transport', exact=True)
                    await expect(option).to_be_visible()
                    await option.click()
                    route_state = page.get_by_test_id('fixture-route')
                    await expect(route_state).to_have_text('/discover/services?category=cat-tourism')
                    await expect(grid.locator('a[href="/yachts"]')).to_have_count(1)
                    await expect(category).to_be_focused()
                    await page.get_by_role('button',name={'ru': 'Показать предложения', 'en': 'Show offers', 'th': 'แสดงข้อเสนอ'}[lang],exact=True).click()
                    await expect(page.get_by_role('dialog')).to_have_count(0)
                    await expect(route_state).to_have_text('/discover/services?category=cat-transport')
                    await expect(grid.locator('a[href="/transport/fast-track"]')).to_have_count(1)
                    await expect(grid.get_by_role('link')).to_have_count(3)
                    await expect(grid.locator('a[href="/sim"]')).to_have_count(0)
                    row['menu'] = menu_metrics
                    row['grid'] = metrics
                elif surface == 'housing':
                    root = await geometry(page.locator('.property-discovery'))
                    assert abs(root['width']-header['width']) <= 1, {'frame': root, 'header': header}
                    if state in ['normal', 'loading'] and not (view == 'map' and width < 1280 and state == 'normal'):
                        grid = page.get_by_test_id('property-results-skeleton' if state == 'loading' else 'property-results-grid')
                        metrics = await geometry(grid)
                        expected = 2 if view == 'map' and width >= 1280 else 4 if width >= 1440 else 3 if width >= 1024 else 2 if width >= 640 else 1
                        assert len(metrics['columns'].split()) == expected, metrics
                        row['grid'] = metrics
                    if view == 'map':
                        if width < 1280 and state == 'normal':
                            await expect(page.get_by_test_id('property-results-grid')).not_to_be_visible()
                        map_rect = await geometry(page.locator('.property-discovery-map'))
                        list_rect = await geometry(page.locator('.property-discovery-list'))
                        if width >= 1280:
                            assert map_rect['left'] >= list_rect['right']-1 or list_rect['left'] >= map_rect['right']-1, {'map': map_rect, 'list': list_rect}
                        row['map'] = map_rect
                        map_view = page.locator('.property-discovery-map')
                        await expect(map_view.locator('[data-map-render-state]')).to_have_attribute('data-map-render-state', 'ready')
                        await expect(map_view.locator('.maplibregl-canvas')).to_be_visible()
                        assert (206, f'bytes 0-{len(ARCHIVE)-1}/{len(ARCHIVE)}') in archive_ranges, archive_ranges
                        assert (206, f'bytes {TILE_OFFSET}-{len(ARCHIVE)-1}/{len(ARCHIVE)}') in archive_ranges, archive_ranges
                        row['syntheticMapRanges'] = archive_ranges
                        marker = map_view.locator('[data-marker-id="synthetic-3"]')
                        await expect(marker).to_be_visible()
                        await marker.press('Enter')
                        card = map_view.get_by_role('region', name='Объект на карте')
                        await expect(card.get_by_role('heading', name='Тестовый объект 3')).to_be_visible()
                        await card.get_by_role('button', name='Закрыть карточку').click()
                        await expect(card).to_have_count(0)
                    # Full search remains operable with no dates; no calendar
                    # availability proof is claimed by this layout fixture.
                    criteria=page.locator('.premium-search-criteria')
                    await expect(criteria).not_to_have_attribute('open','')
                    await criteria.locator('summary').press('Enter')
                    await expect(criteria).to_have_attribute('open','')
                    search = page.locator('.home-search')
                    await expect(search.locator('button[type=submit]')).to_be_visible()
                    if width >= 1280:
                        mode = await page.locator('.property-discovery').get_attribute('data-property-mode')
                        assert mode in ['all', 'rent', 'buy'], mode
                        selector = '.home-search-type,.home-search-bedrooms' if mode == 'rent' else '.home-search-type,.home-search-location,.home-search-bedrooms'
                        # Read in one browser frame. Focus can scroll the viewport
                        # after keyboard navigation from a map marker.
                        layout = await search.evaluate("""(form, selector) => {
                            const rect = e => {
                                const { left, right, top, bottom } = e.getBoundingClientRect();
                                return { left, right, top, bottom };
                            };
                            const fields = selector => [...form.querySelectorAll(selector)].map(rect);
                            return {
                                submit: rect(form.querySelector('button[type=submit]')),
                                controls: fields(selector),
                                primary: fields('.home-search-location,.home-search-dates,.home-search-guests-inline'),
                            };
                        }""", selector)
                        submit = layout['submit']
                        controls = layout['controls']
                        expected_fields = 2 if mode == 'rent' else 3
                        if mode == 'rent':
                            primary = layout['primary']
                            assert len(primary) == 3 and all(abs(box['bottom']-primary[0]['bottom']) <= 2 for box in primary), primary
                            assert primary[0]['right'] <= primary[1]['left'] and primary[1]['right'] <= primary[2]['left'], primary
                            assert primary[0]['bottom'] <= submit['top'], {'primary': primary, 'submit': submit}
                        assert len(controls) == expected_fields and all(abs(box['bottom']-submit['bottom']) <= 2 for box in controls), {'criteria': controls, 'submit': submit}
                    if state == 'error':
                        await expect(page.get_by_role('alert').filter(has_text='could not be loaded')).to_be_visible()
                    if state == 'empty':
                        await expect(page.get_by_role('heading', name='No properties found')).to_be_visible()
                else:
                    hero = await geometry(page.locator('section').first.locator('.max-w-3xl'))
                    form = await geometry(page.locator('#b2b-inquiry-form'))
                    assert hero['width'] <= 768+1 and form['width'] <= 672+1, {'hero': hero, 'form': form}
                    row['readableBounds'] = {'hero': hero, 'form': form}
                assert not blocked and not errors, {'blocked': blocked, 'runtimeErrors': errors}
                row['outcome'] = 'PASS'
            except Exception as error:
                row.update(error=str(error), blocked=blocked, runtimeErrors=errors)
            results.append(row)
            (OUTPUT / 'results.json').write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
            await page.screenshot(path=str(OUTPUT / f'{lang}-{width}-{surface}-{state}-{view}-{row["outcome"]}.png'), full_page=True)
            await context.close()
        await browser.close()
    assert len(results) == len(CASES) and all(row['outcome'] == 'PASS' for row in results), {'cases': len(results), 'failed': sum(row['outcome'] != 'PASS' for row in results)}


if __name__ == '__main__':
    asyncio.run(main())
