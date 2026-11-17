"""Read-only actual yacht/flower catalogue UI with isolated synthetic reads."""
import asyncio
import json
import os
from pathlib import Path
import shutil
import sys
from urllib.parse import urlencode, urlparse
from playwright.async_api import async_playwright, expect

OUT = Path(sys.argv[1]).resolve()
ROOT = Path.cwd()
ORIGIN = 'http://127.0.0.1:8937'

async def main():
    results = []
    async with async_playwright() as p:
        bundled = Path(p.chromium.executable_path)
        if os.environ.get('CI') and not bundled.is_file():
            raise RuntimeError('CI must install Playwright Chromium')
        executable = str(bundled) if bundled.is_file() else shutil.which('chromium')
        if not executable:
            raise RuntimeError('No Chromium available')
        browser = await p.chromium.launch(executable_path=executable, headless=True, args=['--no-sandbox'])
        for lang in ['ru', 'en']:
            for width in [375, 390, 430, 1440]:
                for kind in ['yachts', 'flowers']:
                    context = await browser.new_context(viewport={'width': width, 'height': 900}, reduced_motion='reduce', service_workers='block')
                    blocked, errors = [], []
                    async def route(request):
                        u = urlparse(request.request.url)
                        if u.netloc == '127.0.0.1:8937' and request.request.method == 'GET':
                            for base in [OUT, (ROOT / 'public').resolve()]:
                                target = (base / u.path.lstrip('/')).resolve()
                                if target.is_relative_to(base) and target.is_file():
                                    await request.fulfill(path=str(target))
                                    return
                        blocked.append({'method': request.request.method, 'url': request.request.url})
                        await request.abort()
                    await context.route('**/*', route)
                    page = await context.new_page()
                    page.on('pageerror', lambda error: errors.append(str(error)))
                    title = ('Яхты и морские прогулки' if lang == 'ru' else 'Yachts & sea trips') if kind == 'yachts' else ('Доставка цветов' if lang == 'ru' else 'Flower delivery')
                    row = {'language': lang, 'width': width, 'route': kind, 'outcome': 'FAIL', 'checks': []}
                    prefix = f'{kind}-{lang}-{width}'
                    cards = page.locator('.public-commerce-catalog-card')
                    async def goto(query='', mode=None):
                        values = {'lang': lang, 'entry': '/' + kind + '?ref=synthetic' + query}
                        if mode:
                            values['mode'] = mode
                        await page.goto(ORIGIN + '/fixture.html?' + urlencode(values), wait_until='networkidle')
                        await expect(page.get_by_role('heading', level=1, name=title, exact=True)).to_be_visible()
                        await page.evaluate('document.fonts.ready')
                    async def geometry():
                        assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth'), 'Horizontal page overflow'
                    async def screenshot(name):
                        await geometry()
                        for card in await cards.all():
                            await card.scroll_into_view_if_needed()
                            await page.wait_for_timeout(50)
                        await page.evaluate('scrollTo({top:0,behavior:"instant"})')
                        await page.wait_for_timeout(100)
                        await page.screenshot(path=str(OUT / f'{prefix}-{name}.png'), full_page=True)
                    try:
                        await goto()
                        await expect(cards).to_have_count(3)
                        await screenshot('overview')
                        boxes = [await cards.nth(i).bounding_box() for i in range(3)]
                        if width < 420:
                            assert boxes[1]['y'] > boxes[0]['y'] + boxes[0]['height'] - 1, 'Narrow cards must stack'
                        else:
                            assert abs(boxes[0]['y'] - boxes[1]['y']) < 2, 'Wide cards must share a row'
                        intro = page.locator('section').filter(has=page.get_by_role('heading', level=2, name=('Ваш день на море' if lang == 'ru' else 'Your day at sea') if kind == 'yachts' else ('Цветы для особенного момента' if lang == 'ru' else 'Flowers for a special moment')))
                        assert await intro.count() == 1
                        # Content must begin after the actual stacked header, not behind it.
                        h = await page.get_by_role('heading', level=1, name=title, exact=True).bounding_box()
                        intro_box = await intro.bounding_box()
                        assert intro_box['y'] >= h['y'] + h['height'], 'Intro overlaps header'
                        last_control = page.get_by_role('spinbutton', name='Гостей, не менее' if lang == 'ru' else 'Guests, at least') if kind == 'yachts' else page.get_by_role('button', name='Розы' if lang == 'ru' else 'Roses', exact=True)
                        control_box = await last_control.bounding_box()
                        assert intro_box['y'] >= control_box['y'] + control_box['height'], 'Intro/conditions overlap catalogue controls'
                        row['checks'].append('Actual header/intro/cards: no overflow and responsive card columns')
                        if kind == 'yachts':
                            search = page.get_by_role('searchbox', name='Название яхты или место отправления…' if lang == 'ru' else 'Yacht name or departure location…')
                            await search.fill('Lagoon')
                            await expect(cards).to_have_count(1)
                            await expect(page.get_by_test_id('fixture-location')).to_contain_text('q=Lagoon')
                            await page.get_by_role('spinbutton', name='Гостей, не менее' if lang == 'ru' else 'Guests, at least').fill('6')
                            await expect(page.get_by_test_id('fixture-location')).to_contain_text('guests=6')
                            await page.get_by_role('combobox', name='Сортировка' if lang == 'ru' else 'Sort by').select_option('price_asc')
                            await expect(page.get_by_test_id('fixture-location')).to_contain_text('sort=price_asc')
                        else:
                            await page.get_by_role('button', name='Розы' if lang == 'ru' else 'Roses', exact=True).click()
                            await expect(cards).to_have_count(2)
                            await expect(page.get_by_test_id('fixture-location')).to_contain_text('category=roses')
                            search = page.get_by_role('searchbox', name='Поиск букетов, цветов, поводов…' if lang == 'ru' else 'Search bouquets, flowers, occasions…')
                            await search.fill('Ruby')
                            await expect(cards).to_have_count(1)
                            assert 'Customer favorite' not in await cards.first.inner_text()
                            assert 'Limited' not in await cards.first.inner_text()
                            assert 'Мало' not in await cards.first.inner_text()
                        await screenshot('filtered')
                        before = await page.get_by_test_id('fixture-location').text_content()
                        assert await cards.first.evaluate('el=>el.tagName') == 'A'
                        await cards.first.focus()
                        await cards.first.press('Enter')
                        await expect(page.get_by_role('heading', name='Synthetic detail boundary')).to_be_visible()
                        await page.get_by_test_id('history-back').click()
                        await expect(cards).to_have_count(1)
                        await expect(page.get_by_test_id('fixture-location')).to_have_text(before)
                        await page.get_by_test_id('history-forward').click()
                        await expect(page.get_by_role('heading', name='Synthetic detail boundary')).to_be_visible()
                        await page.get_by_test_id('history-back').click()
                        row['checks'].append('Native filters/search, detail Enter, Back/Forward restore exact query and selected offer')
                        if kind == 'flowers':
                            await goto('&colorPalette=red&category=roses')
                            await expect(cards).to_have_count(1)
                            await expect(cards.first).to_contain_text('Ruby')
                        await goto('&q=absent-synthetic-zz')
                        await expect(cards).to_have_count(0)
                        await expect(page.get_by_role('alert')).to_have_count(0)
                        await page.get_by_role('button', name=('Сбросить' if lang == 'ru' else 'Reset') if kind == 'yachts' else ('Сбросить всё' if lang == 'ru' else 'Clear all'), exact=True).click()
                        await expect(cards).to_have_count(3)
                        await expect(page.get_by_test_id('fixture-location')).to_have_text('/' + kind + '?ref=synthetic')
                        await goto(mode='error')
                        await expect(page.get_by_role('alert')).to_have_count(1)
                        await expect(cards).to_have_count(0)
                        await screenshot('error')
                        await page.get_by_role('button', name='Повторить' if lang == 'ru' else 'Try again', exact=True).click()
                        await expect(cards).to_have_count(3)
                        assert await page.evaluate('window.fixtureReadRetries') == 1
                        await expect(page.get_by_role('alert')).to_have_count(0)
                        await geometry()
                        row['checks'].append('Deep-linked filtering, confirmed empty/reset retaining attribution, distinct error and successful retry')
                        assert not errors, errors
                        assert not blocked, blocked
                        row['outcome'] = 'PASS'
                    except Exception as error:
                        row['error'] = str(error)
                        await page.screenshot(path=str(OUT / f'{prefix}-FAIL.png'), full_page=True)
                    row['pageErrors'], row['blockedRequests'] = errors, blocked
                    results.append(row)
                    await context.close()
        await browser.close()
    (OUT / 'results.json').write_text(json.dumps(results, ensure_ascii=False, indent=2))
    print(json.dumps(results, ensure_ascii=False, indent=2))
    if any(row['outcome'] != 'PASS' for row in results):
        raise SystemExit(1)

asyncio.run(main())
