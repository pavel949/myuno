"""Real homepage controls, synthetic hooks, local CSS, no backend or external requests."""
import asyncio, json, sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse, parse_qs
from playwright.async_api import async_playwright, expect

OUTPUT = Path(sys.argv[1])

async def main():
    results = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        for lang in ['ru', 'en']:
            for width in [320, 375, 390, 430, 1280]:
                context = await browser.new_context(viewport={'width': width, 'height': 850}, has_touch=width < 768,
                                                   timezone_id='UTC', service_workers='block')
                blocked, errors = [], []
                async def route(r):
                    parsed = urlparse(r.request.url)
                    name = 'fixture.html' if parsed.path == '/fixture' else parsed.path.lstrip('/')
                    types = {'fixture.html': 'text/html', 'fixture.js': 'text/javascript', 'fixture.css': 'text/css'}
                    if parsed.netloc == 'localhost:8080' and name in types:
                        await r.fulfill(path=str(OUTPUT/name), content_type=types[name])
                    else:
                        blocked.append(r.request.url)
                        await r.abort()
                await context.route('**/*', route)
                page = await context.new_page()
                page.on('pageerror', lambda e: errors.append(str(e)))
                await page.clock.install(time=datetime(2026, 10, 18, 18, 30, tzinfo=timezone.utc))
                await page.goto('http://localhost:8080/fixture?lang='+lang, wait_until='networkidle')
                ru = lang == 'ru'
                dates_name = 'Даты проживания' if ru else 'Stay dates'
                async def bounds(locator=None):
                    size = await page.evaluate('({width:document.documentElement.scrollWidth,viewport:innerWidth})')
                    assert size['width'] <= width, size
                    if locator:
                        box = await locator.bounding_box()
                        assert box and box['x'] >= -1 and box['x'] + box['width'] <= width + 1, box
                        assert await locator.evaluate('(el)=>el.scrollWidth<=el.clientWidth'), 'Internal horizontal overflow'
                await expect(page.locator('input[type=date]')).to_have_count(0)
                await bounds()
                for label, option in [('Тип жилья' if ru else 'Home type', 'Вилла' if ru else 'Villa'),
                                      ('Выберите район' if ru else 'Choose an area', 'Лаян' if ru else 'Layan')]:
                    trigger = page.get_by_role('combobox', name=label)
                    await trigger.press('Enter')
                    await expect(page.get_by_role('listbox')).to_be_visible()
                    await bounds(page.get_by_role('listbox'))
                    await page.screenshot(path=str(OUTPUT/f'{lang}-{width}-{option}-select.png'))
                    await page.get_by_role('option', name=option, exact=True).click()
                    await expect(trigger).to_be_focused()
                trigger = page.get_by_role('button', name=dates_name)
                await trigger.press('Enter')
                dialog = page.get_by_role('dialog')
                await expect(dialog).to_be_visible()
                await bounds(dialog)
                if width < 768:
                    box = await dialog.bounding_box()
                    assert box and abs(box['y'] + box['height'] - 850) <= 1, box
                # Bangkok has advanced to Oct 19; old UTC civil day must be disabled.
                await expect(dialog.get_by_role('gridcell', name='18', exact=True)).to_be_disabled()
                await expect(dialog.get_by_role('gridcell', name='19', exact=True)).to_be_enabled()
                start = dialog.get_by_role('gridcell', name='20', exact=True)
                await start.press('Enter')
                await expect(dialog.get_by_role('gridcell', name='20', exact=True)).to_have_attribute('aria-selected', 'true')
                await page.screenshot(path=str(OUTPUT/f'{lang}-{width}-calendar.png'))
                await dialog.get_by_role('gridcell', name='25', exact=True).press('Space')
                await expect(dialog).to_have_count(0)
                await expect(trigger).to_be_focused()
                await page.get_by_role('button', name='Найти жильё' if ru else 'Find a home', exact=True).click()
                selected = await page.get_by_test_id('location').text_content()
                params = parse_qs(selected.split('?', 1)[1])
                assert params['mode'] == ['rent'] and params['district'] == ['layan'] and params['types'] == ['villa'], params
                assert params['checkIn'] == ['2026-10-20T00:00:00.000Z'] and params['checkOut'] == ['2026-10-25T00:00:00.000Z'], params
                await page.get_by_role('button', name='Покупка' if ru else 'Buy', exact=True).click()
                await expect(trigger).to_have_count(0)
                await page.get_by_role('button', name='Найти жильё' if ru else 'Find a home', exact=True).click()
                purchase = parse_qs((await page.get_by_test_id('location').text_content()).split('?', 1)[1])
                assert purchase['mode'] == ['buy'] and not any(k in purchase for k in ['checkIn','checkOut','guests']), purchase
                await bounds()
                assert not blocked, blocked
                assert not errors, errors
                results.append({'language':lang,'width':width,'dateKeyboard':'Enter/Space','dateURL':'pass','purchaseOmission':'pass',
                                'focusReturn':'pass','overflow':'none','externalRequests':0,'runtimeErrors':0})
                await context.close()
        await browser.close()
    (OUTPUT/'results.json').write_text(json.dumps(results, ensure_ascii=False, indent=2))
    print(json.dumps(results, ensure_ascii=False, indent=2))

asyncio.run(main())
