"""Render the real bookings page with synthetic data; deny all network requests."""
import asyncio
import json
import os
import re
import sys
from pathlib import Path
from playwright.async_api import async_playwright, expect

OUTPUT = Path(sys.argv[1])

def assert_command(call, status, revision='2030-01-01T00:00:00Z'):
    assert call['name'] == 'change_property_booking', call
    assert call['bound'] == {'actor': 'synthetic-manager-a', 'company': 'synthetic-company-a'}, call
    args = call['args']
    assert set(args) == {'p_request_id', 'p_order_id', 'p_expected_updated_at', 'p_patch'}, args
    assert re.fullmatch(r'[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}', args['p_request_id']), args
    assert args['p_order_id'] == 'fixture-booking-01' and args['p_expected_updated_at'] == revision, args
    assert args['p_patch'] == {'status': status}, args

async def isolated_page(browser, language, width):
    context = await browser.new_context(viewport={'width': width, 'height': 1800}, is_mobile=width < 640, has_touch=width < 640, service_workers='block')
    blocked, errors = [], []
    async def isolated_route(route):
        url = route.request.url
        filename = 'fixture.html' if url.startswith('http://localhost:8080/fixture?') else url.rsplit('/', 1)[-1]
        types = {'fixture.html': 'text/html', 'fixture.js': 'text/javascript', 'fixture.css': 'text/css'}
        if url.startswith('http://localhost:8080/') and filename in types:
            await route.fulfill(path=str(OUTPUT / filename), content_type=types[filename])
        else:
            blocked.append(url)
            await route.abort()
    await context.route('**/*', isolated_route)
    page = await context.new_page()
    page.on('pageerror', lambda error: errors.append(str(error)))
    await page.goto(f'http://localhost:8080/fixture?lang={language}', wait_until='networkidle')
    return context, page, blocked, errors

async def assert_isolation(page, blocked, errors):
    assert not errors, errors
    assert await page.evaluate('window.fixtureDirectWrites') == [], 'Direct table access attempted'
    # Fonts may be denied. Every other request outside the three local fixture
    # assets is unexpected, including a caught/hidden backend request.
    assert all(url.split('?', 1)[0].endswith(('.woff', '.woff2', '.ttf', '.otf')) for url in blocked), blocked

def first_booking(page, language):
    return page.get_by_role('checkbox', name='Выбрать бронирование: Александра' if language == 'ru' else 'Select booking: Alexandra')

async def submit(page, language, action):
    await page.get_by_role('button', name=action, exact=True).click()
    await page.get_by_role('button', name='Да' if language == 'ru' else 'Yes', exact=True).click()

async def main():
    results = []
    async with async_playwright() as p:
        executable = os.environ.get('MC_PILOT_CHROMIUM_PATH')
        browser = await p.chromium.launch(headless=True, **({'executable_path': executable} if executable else {}))
        for language in ['ru', 'en']:
            for width in [375, 390, 430, 1280]:
                context, page, blocked, errors = await isolated_page(browser, language, width)
                heading = page.get_by_role('heading', level=1, name='Бронирования' if language == 'ru' else 'Bookings', exact=True)
                await expect(heading).to_be_visible()
                heading_bounds = await heading.evaluate('e => ({width:e.clientWidth,scroll:e.scrollWidth,overflow:getComputedStyle(e).textOverflow})')
                assert heading_bounds['scroll'] <= heading_bounds['width'] and heading_bounds['overflow'] != 'ellipsis', heading_bounds
                await page.screenshot(path=str(OUTPUT / f'{language}-{width}-list.png'))
                first = first_booking(page, language)
                await expect(first).to_be_visible()
                await first.focus()
                await page.keyboard.press('Space')
                await expect(first).to_be_checked()
                await expect(page.get_by_role('dialog')).to_have_count(0)
                await first.click()
                await expect(first).not_to_be_checked()
                guest = page.get_by_role('heading', name=('Александра Константиновна' if language == 'ru' else 'Alexandra Constantina'))
                await guest.click()
                await expect(page.get_by_role('dialog')).to_contain_text('fixture-booking-01')
                await page.get_by_role('button', name='Close fixture').click()
                await first.click()
                await expect(page.get_by_role('dialog')).to_have_count(0)
                await page.screenshot(path=str(OUTPUT / f'{language}-{width}-selected.png'))
                for action, status in [('Подтвердить' if language == 'ru' else 'Confirm', 'confirmed'), ('Отменить' if language == 'ru' else 'Cancel', 'cancelled')]:
                    before = await page.evaluate('window.fixtureCalls.length')
                    await page.get_by_role('button', name=action, exact=True).click()
                    assert await page.evaluate('window.fixtureCalls.length') == before
                    await page.screenshot(path=str(OUTPUT / f'{language}-{width}-{status}.png'))
                    await page.get_by_role('button', name='Нет' if language == 'ru' else 'No', exact=True).click()
                    assert await page.evaluate('window.fixtureCalls.length') == before
                    await page.get_by_role('button', name=action, exact=True).click()
                    await page.get_by_role('button', name='Да' if language == 'ru' else 'Yes', exact=True).click()
                    await expect(page.get_by_role('button', name=action, exact=True)).to_be_visible()
                    calls = await page.evaluate('window.fixtureCalls')
                    assert len(calls) == before + 1
                    assert_command(calls[-1], status)
                    await expect(first).to_be_checked()  # rejected rows remain selectable
                    assert await page.evaluate('window.fixtureRows[0].status') == 'pending'
                    assert await page.evaluate('window.fixtureSuccess.length') == 0
                    assert await page.evaluate('window.fixtureErrors.length') == before + 1
                bounds = await page.evaluate('''() => ({width:innerWidth,scroll:document.documentElement.scrollWidth, controls:[...document.querySelectorAll('button,input,[role="checkbox"]')].filter(e=>e.getBoundingClientRect().width>0).map(e=>{const r=e.getBoundingClientRect();return {label:e.getAttribute('aria-label')||e.textContent,left:r.left,right:r.right}})})''')
                assert bounds['scroll'] <= width, bounds
                assert all(c['left'] >= -1 and c['right'] <= width+1 for c in bounds['controls']), bounds
                await assert_isolation(page, blocked, errors)
                results.append({'language':language,'width':width,'scenario':'checked-rejections','scrollWidth':bounds['scroll'],'stubSubmissions':2,'runtimeErrors':errors,'blockedRequests':len(blocked),'outcome':'PASS'})
                await context.close()

            # Real command gateway parses a complete checked receipt, rejects a
            # malformed one, and retains its durable UUID until confirmed.
            context, page, blocked, errors = await isolated_page(browser, language, 390)
            first = first_booking(page, language)
            await first.click()
            await page.evaluate("window.fixtureMode='malformed'")
            await submit(page, language, 'Подтвердить' if language == 'ru' else 'Confirm')
            await expect(first).to_be_checked()
            await page.wait_for_function('window.fixtureErrors.length===1')
            assert await page.evaluate('window.fixtureSuccess.length') == 0
            rejected = await page.evaluate('window.fixtureCalls[0]')
            assert_command(rejected, 'confirmed')
            await page.evaluate("window.fixtureMode='success'")
            await submit(page, language, 'Подтвердить' if language == 'ru' else 'Confirm')
            await expect(first).not_to_be_checked()
            await page.wait_for_function('window.fixtureSuccess.length===1')
            confirmed = await page.evaluate('window.fixtureCalls[1]')
            assert_command(confirmed, 'confirmed')
            assert confirmed['args']['p_request_id'] == rejected['args']['p_request_id']
            await expect(page.get_by_role('group', name='Бронирование: Александра' if language == 'ru' else 'Booking: Alexandra')).to_contain_text('Подтверждено' if language == 'ru' else 'Confirmed')
            await first.click()
            revision = await page.evaluate('window.fixtureRows[0].updated_at')
            await submit(page, language, 'Отменить' if language == 'ru' else 'Cancel')
            await expect(first).not_to_be_checked()
            await page.wait_for_function('window.fixtureSuccess.length===2')
            calls = await page.evaluate('window.fixtureCalls')
            assert len(calls) == 3
            assert_command(calls[-1], 'cancelled', revision)
            assert calls[-1]['args']['p_request_id'] != confirmed['args']['p_request_id']
            assert await page.evaluate('window.fixtureRows[0].status') == 'cancelled'
            assert await page.evaluate('window.fixtureRefetches.length') == 3
            await assert_isolation(page, blocked, errors)
            results.append({'language':language,'width':390,'scenario':'malformed-retry-confirm-cancel','stubSubmissions':3,'outcome':'PASS'})
            await context.close()

            for scope_field in ['actor', 'company']:
                context, page, blocked, errors = await isolated_page(browser, language, 390)
                await first_booking(page, language).click()
                await page.evaluate('window.fixtureHoldBinding=true')
                await submit(page, language, 'Подтвердить' if language == 'ru' else 'Confirm')
                await page.wait_for_function("typeof window.fixtureResumeBinding==='function'")
                await page.evaluate('(field)=>window.fixtureSetScope({[field]:"synthetic-other"})', scope_field)
                await expect(first_booking(page, language)).to_have_count(0)
                await page.evaluate('window.fixtureResumeBinding()')
                await page.wait_for_function('window.fixtureBindSettled===1')
                assert await page.evaluate('window.fixtureCalls') == []
                assert await page.evaluate('window.fixtureSuccess') == []
                assert await page.evaluate('window.fixtureErrors') == []
                assert await page.evaluate('window.fixtureRefetches') == []
                assert await page.evaluate('window.fixtureRows[0].status') == 'pending'
                assert await page.evaluate('window.fixtureBinds') == [{'actor':'synthetic-manager-a','company':'synthetic-company-a'}]
                await assert_isolation(page, blocked, errors)
                results.append({'language':language,'width':390,'scenario':scope_field+'-switch-before-dispatch','stubSubmissions':0,'outcome':'PASS'})
                await context.close()
        await browser.close()
    (OUTPUT / 'results.json').write_text(json.dumps(results, ensure_ascii=False, indent=2))
    print(json.dumps(results, ensure_ascii=False, indent=2))

asyncio.run(main())
