"""RU/EN request, account and provider views with all external traffic denied."""
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
        for lang in ['ru', 'en']:
            for width in [375, 390, 430, 1280]:
                for view, state in [('booking', 'ready'), ('booking', 'error'), ('account', 'ready'), ('account', 'error'), ('provider', 'ready'), ('admin', 'ready'), ('detail', 'ready')]:
                    context = await browser.new_context(viewport={'width': width, 'height': 1000}, service_workers='block')
                    errors, blocked = [], []
                    async def route_handler(route):
                        url = route.request.url
                        name = 'fixture.html' if url.startswith('http://localhost:8080/fixture?') else url.rsplit('/', 1)[-1]
                        kinds = {'fixture.html': 'text/html', 'fixture.js': 'text/javascript', 'fixture.css': 'text/css'}
                        if url.startswith('http://localhost:8080/') and name in kinds:
                            await route.fulfill(path=str(OUTPUT / name), content_type=kinds[name])
                        else:
                            blocked.append(url)
                            await route.abort()
                    await context.route('**/*', route_handler)
                    page = await context.new_page()
                    page.on('pageerror', lambda e: errors.append(str(e)))
                    await page.goto(f'http://localhost:8080/fixture?lang={lang}&view={view}&state={state}', wait_until='networkidle')
                    ru = lang == 'ru'
                    if state == 'error':
                        await expect(page.get_by_role('alert')).to_be_visible()
                    if view == 'booking':
                        dialog = page.get_by_role('dialog')
                        await expect(dialog).to_be_visible()
                        if state == 'ready':
                            await page.get_by_role('button', name='09:00', exact=True).click()
                            await page.get_by_label('Ваше имя' if ru else 'Your name').fill('Synthetic Guest')
                            await page.get_by_label('Телефон / WhatsApp' if ru else 'Phone / WhatsApp').fill('+000')
                            await page.screenshot(path=str(OUTPUT / f'{lang}-{width}-booking-ready.png'))
                            await page.get_by_role('button', name='Записаться на 09:00' if ru else 'Book 09:00', exact=True).click()
                            await expect(page.get_by_text('Заявка отправлена' if ru else 'Order sent', exact=True)).to_be_visible()
                            await expect(page.get_by_role('link', name='Мои услуги' if ru else 'My services', exact=True)).to_have_attribute('href', '/me/services')
                            saved = await page.evaluate('window.request')
                            assert saved['serviceId'] == 'synthetic-service' and saved['guestId'] == 'synthetic-guest', saved
                        else:
                            await expect(page.get_by_role('button', name='Выберите время' if ru else 'Pick a time', exact=True)).to_be_disabled()
                        bounds = await dialog.evaluate('e=>({width:e.clientWidth,scroll:e.scrollWidth})')
                    elif view == 'admin':
                        dialog = page.get_by_role('dialog')
                        await expect(dialog).to_be_visible()
                        await page.get_by_label('Название (EN) *' if ru else 'Name (EN) *', exact=True).fill('Synthetic offering')
                        await page.get_by_label('Валюта' if ru else 'Currency', exact=True).fill('USD')
                        await page.screenshot(path=str(OUTPUT / f'{lang}-{width}-admin-editor.png'))
                        bounds = await dialog.evaluate('e=>({width:e.clientWidth,scroll:e.scrollWidth})')
                        await page.get_by_role('button', name='Сохранить' if ru else 'Save', exact=True).click()
                        await expect(dialog).to_have_count(0)
                        saved = await page.evaluate('window.offering')
                        assert saved['provider_id'] == 'synthetic-provider' and saved['price'] is None and saved['currency'] == 'USD', saved
                    elif view == 'detail':
                        await expect(page.get_by_text('0 USD', exact=True)).to_be_visible()
                        await page.get_by_role('button', name='Записаться' if ru else 'Book', exact=True).click()
                        dialog = page.get_by_role('dialog')
                        await expect(dialog).to_be_visible()
                        await expect(dialog.get_by_text('0 USD · 90 мин' if ru else '0 USD · 90 min', exact=True)).to_be_visible()
                        bounds = await dialog.evaluate('e=>({width:e.clientWidth,scroll:e.scrollWidth})')
                    else:
                        if state == 'ready':
                            await expect(page.get_by_text('0 USD', exact=False)).to_be_visible()
                        bounds = await page.evaluate('({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth})')
                    assert bounds['scroll'] <= bounds['width'] + 1, bounds
                    await page.screenshot(path=str(OUTPUT / f'{lang}-{width}-{view}-{state}.png'))
                    assert not errors, errors
                    assert not any('supabase' in u or '/rest/' in u or '/functions/' in u for u in blocked), blocked
                    results.append({'language': lang, 'width': width, 'view': view, 'state': state, 'bounds': bounds})
                    await context.close()
        await browser.close()
    (OUTPUT / 'results.json').write_text(json.dumps(results, ensure_ascii=False, indent=2))
    print(f'Service framework: {len(results)}/{len(results)} browser cases passed')
asyncio.run(main())
