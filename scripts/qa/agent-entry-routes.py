"""Local synthetic agent entry QA. Every nonlocal request and every non-GET denied."""
import asyncio, json, os, sys
from pathlib import Path
from urllib.parse import urlparse
from playwright.async_api import async_playwright, expect

async def main():
    output = Path(sys.argv[1]).resolve()
    results = []
    async with async_playwright() as p:
        bundled = Path(p.chromium.executable_path)
        executable = str(bundled) if bundled.exists() else None
        if not executable and not os.environ.get('CI') and Path('/usr/bin/chromium').exists():
            executable = '/usr/bin/chromium'
        if not executable:
            raise RuntimeError('Installed Playwright browser required in CI')
        browser = await p.chromium.launch(executable_path=executable, headless=True, args=['--no-sandbox'])
        for lang in ['en', 'ru', 'th']:
            for width in [390, 1440]:
                context = await browser.new_context(viewport={'width': width, 'height': 900})
                page = await context.new_page()
                errors, blocked = [], []
                page.on('pageerror', lambda e: errors.append(str(e)))
                async def transport(route):
                    request = route.request
                    url = urlparse(request.url)
                    if request.method != 'GET' or url.hostname != 'agent-fixture.local':
                        blocked.append(request.method + ' ' + request.url)
                        await route.abort()
                        return
                    name = url.path.lstrip('/')
                    if name in ['fixture.js', 'fixture.css']:
                        await route.fulfill(path=str(output / name), content_type='text/javascript' if name.endswith('.js') else 'text/css')
                    else:
                        await route.fulfill(path=str(output / 'fixture.html'), content_type='text/html')
                await context.route('**/*', transport)
                await page.goto(f'http://agent-fixture.local/agent/dashboard?lang={lang}&ref=synthetic#agent-contact')
                await expect(page.get_by_test_id('route')).to_contain_text('/for/agent?')
                await expect(page.get_by_test_id('route')).to_contain_text('agentIntent=workspace')
                await expect(page.locator('#agent-contact')).to_be_visible()
                await expect(page.locator('#agent-contact')).to_be_in_viewport()
                await page.screenshot(path=str(output / f'{lang}-{width}-enquiry.png'), full_page=True)
                assert await page.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Page overflow'
                workspace = page.get_by_role('link', name='Уточнить доступ к рабочему пространству' if lang == 'ru' else 'Ask about workspace access', exact=False)
                await workspace.focus()
                await page.keyboard.press('Enter')
                await expect(page.get_by_test_id('route')).to_contain_text('agentIntent=workspace')
                inputs = page.locator('form input')
                await inputs.nth(0).fill('Synthetic agent')
                # Form order is name, phone, email.
                await inputs.nth(1).fill('+66000000000')
                await page.locator('form button[type=submit]').click()
                await expect(page.locator('form')).to_have_count(0)
                calls = await page.evaluate('window.syntheticCalls')
                assert len(calls) == 1 and calls[0]['args']['payload']['request_type'] == 'property_consultation'
                assert calls[0]['args']['payload']['entry_point'] == '/for/agent?agentIntent=workspace'
                await page.screenshot(path=str(output / f'{lang}-{width}-synthetic-receipt.png'), full_page=True)
                results.append({'lang':lang,'width':width,'scenario':'legacy dashboard → enquiry → synthetic persistence receipt','outcome':'PASS'})
                await page.goto(f'http://agent-fixture.local/agent/join?lang={lang}&fail=1')
                await expect(page.locator('form')).to_be_visible()
                await page.locator('form input').nth(0).fill('Synthetic agent')
                await page.locator('form input').nth(1).fill('+66000000000')
                await page.locator('form button[type=submit]').click()
                await expect(page.get_by_role('alert')).to_be_visible()
                await expect(page.locator('form')).to_be_visible()
                assert await page.locator('form input').nth(0).input_value() == 'Synthetic agent'
                assert await page.evaluate('window.syntheticNotifications.length') == 0
                await page.screenshot(path=str(output / f'{lang}-{width}-unconfirmed.png'), full_page=True)
                await page.goto(f'http://agent-fixture.local/agent/resources?lang={lang}&ref=synthetic#bookmark')
                await expect(page.get_by_role('heading',name='Public catalogue boundary')).to_be_visible()
                assert '#bookmark' in await page.get_by_test_id('route').inner_text()
                await page.goto('http://agent-fixture.local/agent/private')
                await expect(page.get_by_role('heading',name='No privileged workspace')).to_be_visible()
                assert not errors and not blocked, {'errors':errors,'blocked':blocked}
                results.append({'lang':lang,'width':width,'scenario':'failure retains draft; public resources; unknown agent path denied','outcome':'PASS','pageErrors':errors,'blocked':blocked})
                await context.close()
        await browser.close()
        (output/'results.json').write_text(json.dumps({'browser':executable,'cases':results,'limits':['Synthetic RPC receipt is not production persistence or delivery','App shell and catalogue boundary adapted; no private gate acceptance','Thai page titles fall back to English; shared form localized','Fallback fonts']},indent=2))
        print(json.dumps({'passed':len(results),'output':str(output)}))
asyncio.run(main())
