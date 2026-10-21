"""Actual homepage preferences, synthetic data, production CSS, zero external requests."""
import asyncio, json, sys
from time import monotonic
from pathlib import Path
from urllib.parse import urlparse
from playwright.async_api import async_playwright, expect

OUTPUT = Path(sys.argv[1])
COPY = {
    'en': {'open': 'Customize home', 'done': 'Done', 'retry': 'Retry', 'empty': 'No updates for selected topics yet.', 'loading': 'Loading updates for selected topics…', 'error': 'Some updates for selected topics could not be loaded.', 'business': 'Open business workspace', 'account': 'My bookings and requests', 'lifestyle': 'Lifestyle interests'},
    'ru': {'open': 'Настроить главную', 'done': 'Готово', 'retry': 'Повторить', 'empty': 'По выбранным темам пока нет обновлений.', 'loading': 'Загружаем обновления по выбранным темам…', 'error': 'Часть обновлений по выбранным темам не удалось загрузить.', 'business': 'Открыть рабочий кабинет', 'account': 'Мои бронирования и заявки', 'lifestyle': 'Интересы и образ жизни'},
    'th': {'open': 'ปรับแต่งหน้าหลัก', 'done': 'เสร็จสิ้น', 'retry': 'ลองอีกครั้ง', 'empty': 'ยังไม่มีอัปเดตสำหรับหัวข้อที่เลือก', 'loading': 'กำลังโหลดอัปเดตสำหรับหัวข้อที่เลือก…', 'error': 'ไม่สามารถโหลดอัปเดตบางรายการสำหรับหัวข้อที่เลือกได้', 'business': 'เปิดพื้นที่ทำงานธุรกิจ', 'account': 'การจองและคำขอของฉัน', 'lifestyle': 'ความสนใจและไลฟ์สไตล์'},
}

def assert_no_demo_text(text, state):
    assert not any(value in text for value in ['Fri 15:00', 'Term 2', 'Tonight', 'Демо']), state


async def main():
    results = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        for lang, copy in COPY.items():
            for width in [375, 390, 430, 1280]:
                context = await browser.new_context(viewport={'width': width, 'height': 850}, has_touch=width < 768,
                                                   timezone_id='Asia/Bangkok', service_workers='block')
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
                async def navigate(state='real'):
                    await page.goto(f'http://localhost:8080/fixture?lang={lang}&state={state}', wait_until='networkidle')
                async def bounds(locator=None):
                    # Wait for Radix's bottom-sheet animation to finish before checking.
                    deadline, previous, stable = monotonic() + 5, None, 0
                    while True:
                        size = await page.evaluate('({width:document.documentElement.scrollWidth,viewport:innerWidth})')
                        box = await locator.bounding_box() if locator else None
                        internal = await locator.evaluate('(el)=>el.scrollWidth<=el.clientWidth') if locator else True
                        valid = size['width'] <= width and internal
                        if locator:
                            valid = valid and bool(box) and box['x'] >= -1 and box['x'] + box['width'] <= width + 1 and abs(box['y'] + box['height'] - 850) <= 1
                        snapshot = (size, box, internal)
                        stable = stable + 1 if valid and snapshot == previous else (1 if valid else 0)
                        if stable >= 3:
                            return
                        if monotonic() >= deadline:
                            raise AssertionError({'viewport': width, 'page': size, 'box': box, 'noInternalOverflow': internal})
                        previous = snapshot
                        await asyncio.sleep(0.05)
                async def ready_dialog():
                    dialog = page.get_by_role('dialog', name=copy['open'])
                    await expect(dialog).to_be_visible()
                    await expect(dialog).to_have_attribute('data-state', 'open')
                    await bounds(dialog)
                    # Radix registers its Escape listener/layer in effects. A preserved
                    # hidden selection value is not evidence that a reopened layer is ready.
                    await page.wait_for_function("""() => {
                        const dialog = document.querySelector('[role="dialog"][data-state="open"]');
                        return dialog && dialog.contains(document.activeElement)
                            && getComputedStyle(dialog).pointerEvents !== 'none';
                    }""", timeout=5000)
                    return dialog
                async def selection(expected):
                    await expect(page.get_by_test_id('selection')).to_have_text(json.dumps(expected, separators=(',', ':')))
                try:
                    await navigate()
                    await expect(page.get_by_role('dialog')).to_have_count(0)
                    await expect(page.get_by_text('13:20', exact=True)).to_be_visible()
                    await expect(page.get_by_role('link', name=copy['account'])).to_have_attribute('href', '/me')
                    await bounds()
                    await page.screenshot(path=str(OUTPUT/f'{lang}-{width}-home.png'))
                    trigger = page.get_by_role('button', name=copy['open'], exact=True)
                    await trigger.press('Enter')
                    dialog = await ready_dialog()
                    await page.screenshot(path=str(OUTPUT/f'{lang}-{width}-selected.png'))
                    rows = dialog.locator('ol > li')
                    await expect(rows).to_have_count(3)
                    for button in await rows.get_by_role('button').all():
                        box = await button.bounding_box()
                        assert box and box['width'] >= 44 and box['height'] >= 44, box
                    await rows.nth(2).get_by_role('button').nth(0).press('Enter')
                    await selection(['pet_owner', 'couple', 'family'])
                    await dialog.get_by_role('region', name=copy['lifestyle']).get_by_role('button').first.click()
                    await selection(['pet_owner', 'couple', 'family', 'nightlife'])
                    await rows.nth(3).get_by_role('button').nth(2).click()
                    await selection(['pet_owner', 'couple', 'family'])
                    # Fixed action footer stays on screen after scrolling the options.
                    await dialog.locator('.overflow-y-auto').evaluate('(el)=>{el.scrollTop=el.scrollHeight}')
                    done = dialog.get_by_role('button', name=copy['done'], exact=True)
                    box = await done.bounding_box()
                    assert box and box['y'] >= 0 and box['y'] + box['height'] <= 850, box
                    await bounds(dialog)
                    await page.screenshot(path=str(OUTPUT/f'{lang}-{width}-preferences.png'))
                    await done.click()
                    await expect(dialog).to_have_count(0)
                    await trigger.click()
                    dialog = await ready_dialog()
                    await selection(['pet_owner', 'couple', 'family'])
                    await page.keyboard.press('Escape')
                    await expect(dialog).to_have_count(0)
                    # Account destinations remain useful rather than a blank feed gap.
                    await page.get_by_role('link', name=copy['account']).click()
                    await expect(page.get_by_test_id('location')).to_have_text('/me')
                    states = ['empty', 'loading', 'error', 'unavailable', 'preferences-loading', 'preferences-error']
                    for state in states:
                        await navigate(state)
                        await expect(page.get_by_role('dialog')).to_have_count(0)
                        body_text = await page.locator('body').inner_text()
                        assert_no_demo_text(body_text, state)
                        if state in ['empty', 'loading', 'error']:
                            await expect(page.get_by_text(copy[state], exact=True)).to_be_visible()
                        if state == 'error':
                            await expect(page.get_by_text('13:20', exact=True)).to_be_visible()
                            await page.get_by_role('button', name=copy['retry'], exact=True).click()
                            assert await page.evaluate('window.fixtureRetries') == 1
                        if state == 'unavailable':
                            await expect(page.get_by_role('link', name=copy['business'])).to_have_attribute('href', '/vendor')
                        if state.startswith('preferences-'):
                            await page.get_by_role('button', name=copy['open'], exact=True).click()
                            dialog = await ready_dialog()
                            for button in await dialog.locator('section').get_by_role('button').all():
                                await expect(button).to_be_disabled()
                            await expect(dialog.get_by_role('alert' if state.endswith('error') else 'status')).to_be_visible()
                            await expect(dialog.get_by_role('button', name=copy['done'], exact=True)).to_be_enabled()
                        else:
                            await bounds()
                        if width == 375:
                            await page.screenshot(path=str(OUTPUT/f'{lang}-{width}-{state}.png'))
                    assert not blocked, blocked
                    assert not errors, errors
                    results.append({'language': lang, 'width': width, 'explicitOpen': 'pass', 'reorderAddRemove': 'pass', 'closeReopen': 'pass', 'truthfulStates': states, 'fixedFooter': 'pass', 'tapTargets': '44px', 'overflow': 'none', 'externalRequests': 0, 'runtimeErrors': 0})
                except Exception as error:
                    failure = {'language': lang, 'width': width, 'error': str(error), 'blockedRequests': blocked, 'runtimeErrors': errors}
                    try:
                        await page.screenshot(path=str(OUTPUT/f'{lang}-{width}-failure.png'), timeout=3000)
                        (OUTPUT/f'{lang}-{width}-failure.html').write_text(await page.content())
                    except Exception as capture_error:
                        failure['captureError'] = str(capture_error)
                    (OUTPUT/f'{lang}-{width}-failure.json').write_text(json.dumps(failure, ensure_ascii=False, indent=2))
                    raise
                await context.close()
        await browser.close()
    (OUTPUT/'results.json').write_text(json.dumps(results, ensure_ascii=False, indent=2))
    print(json.dumps(results, ensure_ascii=False, indent=2))

asyncio.run(main())
