"""Remote-CI-only real public layout, default 100% CSS-pixel viewport geometry.

Synthetic reads, map's real no-key fallback, no real transactions or live map.
"""
import asyncio
import json
import os
from pathlib import Path
import sys
from urllib.parse import urlencode, urlparse
from playwright.async_api import async_playwright, expect

OUTPUT = Path(sys.argv[1])
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
        browser = await p.chromium.launch(headless=True)
        for lang, width, surface, state, view in CASES:
            context = await browser.new_context(viewport={'width': width, 'height': 1000}, device_scale_factor=1, service_workers='block')
            blocked, errors = [], []
            async def route(request):
                parsed = urlparse(request.request.url)
                name = 'fixture.html' if parsed.path == '/fixture' else parsed.path.lstrip('/')
                types = {'fixture.html': 'text/html', 'fixture.js': 'text/javascript', 'fixture.css': 'text/css'}
                if parsed.netloc == 'localhost:8080' and request.request.method == 'GET' and name in types:
                    await request.fulfill(path=str(OUTPUT / name), content_type=types[name])
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
                bad = await page.locator('button,a,input,select,textarea').evaluate_all("""els=>els.filter(e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden'&&!e.closest('.property-discovery-features')).map(e=>{const r=e.getBoundingClientRect();return{text:(e.textContent||e.getAttribute('placeholder')||'').trim().slice(0,100),left:r.left,right:r.right}}).filter(r=>r.left < -1||r.right>innerWidth+1)""")
                assert not bad, {'controlBounds': bad}
                if surface == 'services':
                    menu = page.get_by_test_id('service-discovery-menu')
                    await expect(menu).to_be_visible()
                    menu_metrics = await geometry(menu)
                    assert len(menu_metrics['columns'].split()) == (4 if width >= 1440 else 2), menu_metrics
                    await expect(menu.locator('[data-category-id]')).to_have_count(3)
                    await expect(menu.locator('a[href="/yachts"]')).to_have_count(1)
                    await expect(menu.locator('[data-category-id=cat-home-services]')).to_be_visible()
                    await expect(menu.locator('[data-category-id=cat-tourism]')).to_be_visible()
                    await menu.locator('[data-category-id=cat-tourism]').press('Enter')
                    grid = page.get_by_test_id('service-catalogue-results')
                    await expect(grid).to_be_visible()
                    metrics = await geometry(grid)
                    expected = 4 if width >= 1440 else 3 if width >= 1024 else 2 if width >= 640 else 1
                    assert len(metrics['columns'].split()) == expected, metrics
                    parent = await geometry(grid.locator('xpath=../..'))
                    assert abs(parent['left']+parent['padding']-header['left']-header['padding']) <= 1, {'frame': parent, 'header': header}
                    await expect(grid.locator('a[href="/yachts"]')).to_have_count(1)
                    # Actual keyboard category filtering preserves URL context.
                    category = page.get_by_role('combobox')
                    await category.press('Enter')
                    option = page.get_by_role('option', name='Транспортные услуги' if lang=='ru' else 'Transport', exact=True)
                    await expect(option).to_be_visible()
                    await option.click()
                    await expect(page.get_by_test_id('fixture-route')).to_contain_text('category=cat-transport')
                    await expect(grid.locator('a[href="/transport/fast-track"]')).to_have_count(1)
                    await expect(grid.get_by_role('link')).to_have_count(4)
                    await expect(category).to_be_focused()
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
                    # Full search remains operable with no dates; no calendar
                    # availability proof is claimed by this layout fixture.
                    criteria=page.locator('.premium-search-criteria')
                    await expect(criteria).not_to_have_attribute('open','')
                    await criteria.locator(':scope > summary').click()
                    search = page.locator('.home-search')
                    await expect(search.locator('button[type=submit]')).to_be_visible()
                    if width >= 1280:
                        submit = await search.locator('button[type=submit]').bounding_box()
                        controls = await search.locator('.home-search-type,.home-search-location,.home-search-dates,.home-search-bedrooms').evaluate_all('els=>els.map(e=>{const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom}})')
                        # Labels may make a field taller; controls share the
                        # bottom baseline of one real criteria row.
                        mode = await page.locator('.property-discovery').get_attribute('data-property-mode')
                        assert mode in ['all', 'rent', 'buy'], mode
                        expected_fields = 4 if mode == 'rent' else 3
                        assert submit and len(controls) == expected_fields and all(abs(box['bottom']-submit['y']-submit['height']) <= 2 for box in controls), {'criteria': controls, 'submit': submit}
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
