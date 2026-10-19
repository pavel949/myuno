"""PMS detail browser regression. Synthetic identity/data; all external traffic denied."""
import asyncio
import json
import sys
from pathlib import Path
from playwright.async_api import async_playwright, expect

OUTPUT = Path(sys.argv[1])

async def main():
    results = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        for language in ['ru', 'en']:
            for width in [375, 390, 430, 1280]:
                for state in ['ready', 'error']:
                    context = await browser.new_context(viewport={'width': width, 'height': 1100}, service_workers='block')
                    errors, blocked = [], []
                    async def route_handler(route):
                        url = route.request.url
                        filename = 'fixture.html' if url.startswith('http://localhost:8080/fixture?') else url.rsplit('/', 1)[-1]
                        kinds = {'fixture.html': 'text/html', 'fixture.js': 'text/javascript', 'fixture.css': 'text/css'}
                        if url.startswith('http://localhost:8080/') and filename in kinds:
                            await route.fulfill(path=str(OUTPUT / filename), content_type=kinds[filename])
                        else:
                            blocked.append(url)
                            await route.abort()
                    await context.route('**/*', route_handler)
                    page = await context.new_page()
                    page.on('pageerror', lambda error: errors.append(str(error)))
                    await page.goto(f'http://localhost:8080/fixture?lang={language}&state={state}', wait_until='networkidle')
                    dialog = page.get_by_role('dialog')
                    await expect(dialog).to_be_visible()
                    options = await page.evaluate('window.historyOptions')
                    assert options == {'table': 'order_status_history', 'bookingId': 'synthetic-order', 'enabled': True}, options
                    label = ('Неизвестный статус: future_status' if language == 'ru' else 'Unknown status: future_status') if state == 'error' else ('Выехал' if language == 'ru' else 'Checked out')
                    status = dialog.get_by_role('status', name='Статус бронирования' if language == 'ru' else 'Booking status', exact=True)
                    await expect(status).to_have_text(label)
                    await expect(status).to_be_visible()
                    await expect(dialog.get_by_text('0 (валюта неизвестна)' if language == 'ru' else '0 (currency unavailable)', exact=True)).to_be_visible()
                    if state == 'error':
                        await expect(dialog.get_by_role('alert')).to_be_visible()
                    bounds = await dialog.evaluate('e=>({left:e.getBoundingClientRect().left,right:e.getBoundingClientRect().right,width:e.clientWidth,scroll:e.scrollWidth})')
                    assert bounds['left'] >= -1 and bounds['right'] <= width + 1, bounds
                    assert bounds['scroll'] <= bounds['width'] + 1, bounds
                    await page.screenshot(path=str(OUTPUT / f'{language}-{width}-{state}.png'))
                    link = dialog.get_by_role('link', name='Календарь и задачи объекта' if language == 'ru' else 'Property calendar and tasks')
                    await expect(link).to_have_attribute('href', '/mc/calendar?property=synthetic-home')
                    await link.click()
                    await expect(page.get_by_test_id('destination')).to_have_text('/mc/calendar?property=synthetic-home')
                    await expect(dialog).to_have_count(0)
                    assert not errors, errors
                    assert not any('/rest/' in url or '/functions/' in url or 'supabase' in url for url in blocked), blocked
                    results.append({'language': language, 'width': width, 'state': state, 'errors': errors, 'bounds': bounds})
                    await context.close()
        await browser.close()
    (OUTPUT / 'results.json').write_text(json.dumps(results, ensure_ascii=False, indent=2))
    print(f'PMS detail: {len(results)}/{len(results)} browser cases passed')

asyncio.run(main())
