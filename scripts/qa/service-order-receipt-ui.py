"""Read-only receipt verification. Reject all nonfixture and non-GET requests."""
import asyncio, json, os, sys
from pathlib import Path
from urllib.parse import urlparse
from playwright.async_api import async_playwright, expect
OUTPUT = Path(sys.argv[1])

async def main():
    rows = []
    async with async_playwright() as p:
        bundled = Path(p.chromium.executable_path)
        executable = str(bundled) if bundled.exists() else ('/usr/bin/chromium' if not os.environ.get('CI') and Path('/usr/bin/chromium').exists() else None)
        if not executable: raise RuntimeError('Installed Playwright Chromium required in CI')
        browser = await p.chromium.launch(executable_path=executable, headless=True, args=['--no-sandbox'])
        for lang in ['en', 'ru', 'th']:
            for width in [390, 1440]:
                for mode in ['saved', 'empty', 'error', 'foreign']:
                    context = await browser.new_context(viewport={'width': width, 'height': 900}, service_workers='block')
                    errors, blocked = [], []
                    async def route(r):
                        u = urlparse(r.request.url); name = 'fixture.html' if u.path == '/fixture' else u.path.lstrip('/')
                        types = {'fixture.html': 'text/html', 'fixture.js': 'text/javascript', 'fixture.css': 'text/css'}
                        if u.netloc == 'localhost:8080' and r.request.method == 'GET' and name in types:
                            await r.fulfill(path=str(OUTPUT / name), content_type=types[name])
                        else: blocked.append({'host': u.netloc, 'method': r.request.method}); await r.abort()
                    await context.route('**/*', route)
                    page = await context.new_page(); page.on('pageerror', lambda e: errors.append(str(e)))
                    await page.goto(f'http://localhost:8080/fixture?lang={lang}&mode={mode}')
                    saved = {'en': 'Order saved', 'ru': 'Заказ сохранён', 'th': 'บันทึกคำสั่งซื้อแล้ว'}[lang]
                    unconfirmed = {'en': 'Result not confirmed', 'ru': 'Результат пока не подтверждён', 'th': 'ยังไม่ยืนยันผลลัพธ์'}[lang]
                    if mode == 'saved':
                        await expect(page.get_by_role('heading', name=saved, exact=True)).to_be_visible()
                        await expect(page.get_by_text('USD 900', exact=True)).to_be_visible()
                    else:
                        await expect(page.get_by_role('heading', name=unconfirmed, exact=True)).to_be_visible()
                        await expect(page.get_by_role('heading', name=saved, exact=True)).to_have_count(0)
                        if mode == 'error':
                            await page.get_by_role('button', name={'en': 'Check again', 'ru': 'Проверить ещё раз', 'th': 'ตรวจสอบอีกครั้ง'}[lang], exact=True).click()
                            await expect(page.get_by_role('heading', name=saved, exact=True)).to_be_visible()
                            assert await page.evaluate('window.fixtureReads.length') == 2
                    assert await page.evaluate("window.fixtureReads.every(r=>r.customer_user_id==='00000000-0000-4000-8000-000000000001'&&r.id==='00000000-0000-4000-8000-000000000002'&&r.order_type==='service')")
                    await expect(page.get_by_role('link', name={'en': 'My orders', 'ru': 'Мои заказы', 'th': 'คำสั่งซื้อของฉัน'}[lang])).to_have_attribute('href', '/bookings')
                    assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth')
                    await page.screenshot(path=str(OUTPUT / f'{lang}-{width}-{mode}.png'), full_page=True)
                    assert not errors and not blocked, (errors, blocked)
                    rows.append({'language': lang, 'width': width, 'mode': mode, 'outcome': 'PASS'})
                    await context.close()
        await browser.close()
    assert len(rows) == 24 and len({(r['language'], r['width'], r['mode']) for r in rows}) == 24
    (OUTPUT / 'results.json').write_text(json.dumps(rows, indent=2))
    print(json.dumps({'passed': len(rows), 'output': str(OUTPUT)}))

asyncio.run(main())
