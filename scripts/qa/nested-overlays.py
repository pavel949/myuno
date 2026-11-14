"""Network-denied regression using the existing actual-component fixture.

Run: node scripts/qa/shared-surfaces-ui.mjs --build-only
     python3 scripts/qa/nested-overlays.py /tmp/browser/shared-surfaces-isolated
No app sign-in, backend, seeds, business writes or messages.
"""
import asyncio
import json
import sys
from pathlib import Path
from urllib.parse import urlparse
from playwright.async_api import async_playwright, expect

OUTPUT = Path(sys.argv[1])

async def main():
    results = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        for width in [320, 375, 390, 430, 1280]:
            for lang in ['ru', 'en']:
                for theme in ['light', 'dark']:
                    context = await browser.new_context(
                        viewport={'width': width, 'height': 1800},
                        reduced_motion='reduce', service_workers='block')
                    errors = []
                    blocked = []
                    async def route(r):
                        u = urlparse(r.request.url)
                        name = 'fixture.html' if u.path == '/fixture' else u.path.lstrip('/')
                        types = {'fixture.html': 'text/html', 'fixture.js': 'text/javascript', 'fixture.css': 'text/css'}
                        if u.netloc == 'localhost:8080' and name in types:
                            await r.fulfill(path=str(OUTPUT / name), content_type=types[name])
                        else:
                            blocked.append(r.request.url)
                            await r.abort()
                    await context.route('**/*', route)
                    page = await context.new_page()
                    page.on('pageerror', lambda e: errors.append(str(e)))
                    await page.goto('http://localhost:8080/fixture?lang=' + lang)
                    await page.evaluate('(theme) => document.documentElement.classList.toggle("dark", theme === "dark")', theme)
                    trigger = page.get_by_role('button', name='Sheet', exact=True)
                    await trigger.click()
                    parent = page.get_by_role('dialog')
                    await expect(parent).to_be_visible()
                    child_trigger = parent.get_by_role('button', name='Popover', exact=True)
                    await child_trigger.click()
                    action = page.get_by_role('button', name='Popover action', exact=True)
                    await expect(action).to_be_visible()
                    await action.click()
                    await page.keyboard.press('Escape')
                    await expect(action).to_have_count(0)
                    await expect(parent).to_have_count(1)
                    await expect(child_trigger).to_be_focused()
                    # Reopening must not leave a stale layer or lose interactivity.
                    await child_trigger.click()
                    await action.click()
                    await page.keyboard.press('Escape')
                    await expect(action).to_have_count(0)
                    await expect(child_trigger).to_be_focused()
                    options = parent.get_by_role('button', name='Options', exact=True)
                    await options.click()
                    menu = page.get_by_role('menu')
                    await expect(menu).to_be_visible()
                    await page.keyboard.press('Escape')
                    await expect(menu).to_have_count(0)
                    await expect(parent).to_have_count(1)
                    await expect(options).to_be_focused()
                    await page.screenshot(path=str(OUTPUT / f'nested-{lang}-{width}-{theme}.png'))
                    await page.keyboard.press('Escape')
                    await expect(parent).to_have_count(0)
                    await expect(trigger).to_be_focused()
                    assert not errors, errors
                    assert all('/fonts/' in url for url in blocked), blocked
                    results.append({'width': width, 'language': lang, 'theme': theme, 'outcome': 'PASS'})
                    await context.close()
        await browser.close()
    (OUTPUT / 'nested-results.json').write_text(json.dumps(results, indent=2))
    print(f'PASS: {len(results)} network-denied nested-overlay scenarios')

asyncio.run(main())