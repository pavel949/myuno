import asyncio
import json
import sys
from pathlib import Path
from playwright.async_api import async_playwright, expect

OUTPUT = Path(sys.argv[1])
COPY = {
    'en': ['New password', 'Confirm password', 'Save & continue', 'Sign in', 'Reset password by email'],
    'ru': ['Новый пароль', 'Повторите пароль', 'Сохранить и войти', 'Войти в аккаунт', 'Установить пароль по email'],
    'th': ['รหัสผ่านใหม่', 'ยืนยันรหัสผ่าน', 'บันทึกและดำเนินการต่อ', 'เข้าสู่ระบบ', 'ตั้งรหัสผ่านใหม่ทางอีเมล'],
}

async def main():
    results = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        for language, labels in COPY.items():
            for width in [375, 390, 430, 1280]:
                context = await browser.new_context(viewport={'width': width, 'height': 812}, service_workers='block')
                external, errors = [], []
                async def isolated(route):
                    url = route.request.url
                    filename = 'fixture.html' if url.startswith('http://localhost:8080/fixture?') else url.rsplit('/', 1)[-1]
                    types = {'fixture.html': 'text/html', 'fixture.js': 'text/javascript', 'fixture.css': 'text/css'}
                    if url.startswith('http://localhost:8080/') and filename in types:
                        await route.fulfill(path=str(OUTPUT / filename), content_type=types[filename])
                    else:
                        external.append(url)
                        await route.abort()
                await context.route('**/*', isolated)
                page = await context.new_page()
                page.on('pageerror', lambda error: errors.append(str(error)))
                for state in ['ready', 'error', 'expired']:
                    await page.goto(f'http://localhost:8080/fixture?lang={language}&state={state}', wait_until='networkidle')
                    if state == 'expired':
                        await expect(page.get_by_role('button', name=labels[4], exact=True)).to_be_visible()
                        await page.screenshot(path=str(OUTPUT / f'{language}-{width}-{state}.png'), full_page=True)
                        await page.get_by_role('button', name=labels[3], exact=True).click()
                        await expect(page.get_by_test_id('fixture-route')).to_have_text('/auth?redirect=%2Fmc%2Fproperties')
                        assert await page.evaluate('window.fixtureWrites') == 0
                    else:
                        await page.get_by_label(labels[0], exact=True).fill('Synthetic-only-123!')
                        await page.get_by_label(labels[1], exact=True).fill('Synthetic-only-123!')
                        button = page.get_by_role('button', name=labels[2], exact=True)
                        await expect(button).to_be_enabled()
                        assert await page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'{language}/{width} overflow'
                        assert await button.evaluate('e => {const r=e.getBoundingClientRect();const t=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return e===t||e.contains(t)}'), 'Submit covered'
                        await page.screenshot(path=str(OUTPUT / f'{language}-{width}-{state}.png'), full_page=True)
                        await button.click()
                        if state == 'ready':
                            await expect(page.get_by_test_id('fixture-route')).to_have_text('/auth?redirect=%2Fmc%2Fproperties')
                        else:
                            await expect(page.get_by_test_id('fixture-route')).to_have_text('/auth/setup-password?redirect=%2Fmc%2Fproperties')
                            await expect(button).to_be_enabled()
                            assert await page.evaluate('window.fixtureErrors') == 1
                        assert await page.evaluate('window.fixtureWrites') == 1
                    results.append({'language': language, 'width': width, 'state': state, 'passed': True})
                await page.goto(f'http://localhost:8080/fixture?lang={language}&screen=access', wait_until='networkidle')
                await expect(page.locator('#company-invite-name')).to_be_visible()
                await page.locator('#company-invite-name').fill('Synthetic Employee')
                await page.locator('#company-invite-email').fill('synthetic@example.invalid')
                await expect(page.locator('#company-invite-role')).to_have_value('staff')
                await expect(page.get_by_role('checkbox')).to_have_count(5)
                assert await page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'{language}/{width} access panel overflow'
                await page.screenshot(path=str(OUTPUT / f'{language}-{width}-access-panel.png'), full_page=True)
                await page.locator('button[type="submit"]').click()
                await expect(page.locator('#company-invite-email')).to_have_value('')
                assert await page.evaluate('window.fixtureWrites') == 1
                results.append({'language': language, 'width': width, 'state': 'access-panel', 'passed': True})
                assert not errors, errors
                # Font CDNs are denied intentionally; no auth/data requests are allowed.
                assert not [url for url in external if not url.startswith(('https://fonts.googleapis.com/', 'https://fonts.gstatic.com/'))], external
                await context.close()
        await browser.close()
    (OUTPUT / 'results.json').write_text(json.dumps(results, ensure_ascii=False, indent=2))
    print(f'Employee invitation UI: {len(results)} isolated cases passed; no live account calls')

asyncio.run(main())
