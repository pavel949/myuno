"""Render the real bookings page with synthetic data; deny all network requests."""
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
                heading = page.get_by_role('heading', level=1, name='Бронирования' if language == 'ru' else 'Bookings', exact=True)
                await expect(heading).to_be_visible()
                heading_bounds = await heading.evaluate('e => ({width:e.clientWidth,scroll:e.scrollWidth,overflow:getComputedStyle(e).textOverflow})')
                assert heading_bounds['scroll'] <= heading_bounds['width'] and heading_bounds['overflow'] != 'ellipsis', heading_bounds
                await page.screenshot(path=str(OUTPUT / f'{language}-{width}-list.png'))
                first = page.get_by_role('checkbox', name=('Выбрать бронирование: Александра' if language == 'ru' else 'Select booking: Alexandra'))
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
                    await expect(page.get_by_role('button', name='Да' if language == 'ru' else 'Yes', exact=True)).to_be_enabled()
                    calls = await page.evaluate('window.fixtureCalls')
                    assert len(calls) == before + 1
                    assert calls[-1] == {'table':'orders','values':{'status':status},'key':'id','ids':['fixture-booking-01']}
                    await page.get_by_role('button', name='Нет' if language == 'ru' else 'No', exact=True).click()
                bounds = await page.evaluate('''() => ({width:innerWidth,scroll:document.documentElement.scrollWidth, controls:[...document.querySelectorAll('button,input,[role="checkbox"]')].filter(e=>e.getBoundingClientRect().width>0).map(e=>{const r=e.getBoundingClientRect();return {label:e.getAttribute('aria-label')||e.textContent,left:r.left,right:r.right}})})''')
                assert bounds['scroll'] <= width, bounds
                assert all(c['left'] >= -1 and c['right'] <= width+1 for c in bounds['controls']), bounds
                assert not errors, errors
                # Font downloads may be denied; any database/function request is a failure.
                assert not any('supabase' in url or '/rest/' in url or '/functions/' in url for url in blocked), blocked
                results.append({'language':language,'width':width,'scrollWidth':bounds['scroll'],'stubSubmissions':2,'runtimeErrors':errors,'blockedRequests':len(blocked)})
                await context.close()
        await browser.close()
    (OUTPUT / 'results.json').write_text(json.dumps(results, ensure_ascii=False, indent=2))
    print(json.dumps(results, ensure_ascii=False, indent=2))

asyncio.run(main())