"""Real trip page/card/search containment with local assets and no backend requests."""
import asyncio, json, os, sys
from pathlib import Path
from urllib.parse import urlparse
from playwright.async_api import async_playwright

OUTPUT = Path(sys.argv[1])

async def main():
    results = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, executable_path=os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH'))
        for lang in ['ru', 'en']:
            for width in [1280, 1440]:
                context = await browser.new_context(viewport={'width': width, 'height': 1000}, service_workers='block', reduced_motion='reduce')
                blocked, errors = [], []
                async def route(r):
                    url = urlparse(r.request.url)
                    name = 'fixture.html' if url.path == '/fixture' else url.path.lstrip('/')
                    types = {'fixture.html': 'text/html', 'fixture.js': 'text/javascript', 'fixture.css': 'text/css'}
                    if url.netloc == 'localhost:8080' and name in types:
                        await r.fulfill(path=str(OUTPUT/name), content_type=types[name])
                    elif url.netloc == 'localhost:8080' and name.endswith(('.woff', '.woff2')):
                        await r.fulfill(status=204, body='')
                    else:
                        blocked.append(r.request.url)
                        await r.abort()
                await context.route('**/*', route)
                page = await context.new_page()
                page.on('pageerror', lambda error: errors.append(str(error)))
                try:
                    await page.goto(f'http://localhost:8080/fixture?lang={lang}', wait_until='networkidle')
                    await page.get_by_role('heading', level=1).wait_for()
                    await page.evaluate('document.fonts.ready')
                    async def geometry():
                        return await page.locator('.home-search').evaluate('''form => {
                            const content = form.parentElement;
                            const card = content.parentElement.getBoundingClientRect();
                            const sidebar = content.parentElement.parentElement.parentElement.children[1].getBoundingClientRect();
                            const controls = [...form.querySelectorAll('input, button')].map(el => {
                                const box = el.getBoundingClientRect();
                                return {label: el.getAttribute('aria-label') || el.textContent, left: box.left, right: box.right};
                            });
                            return {pageWidth: document.documentElement.scrollWidth, viewport: innerWidth,
                                formWidth: form.clientWidth, formScrollWidth: form.scrollWidth,
                                card: {left:card.left, right:card.right}, sidebarLeft:sidebar.left, controls};
                        }''')
                    data = await geometry()
                    assert len(data['controls']) >= 5, data
                    assert data['pageWidth'] <= width + 1, data
                    assert data['formScrollWidth'] <= data['formWidth'] + 1, data
                    assert data['card']['right'] <= data['sidebarLeft'], data
                    assert all(c['left'] >= data['card']['left'] - 1 and c['right'] <= data['card']['right'] + 1 for c in data['controls']), data
                    await page.screenshot(path=str(OUTPUT/f'{lang}-{width}-trip.png'), full_page=True)
                    # Prove the fixture detects the original missing-scope regression.
                    await page.locator('.journey-primary').evaluate("el => el.classList.remove('journey-primary')")
                    broken = await geometry()
                    assert broken['formScrollWidth'] > broken['formWidth'] + 1 or any(c['right'] > broken['card']['right'] + 1 for c in broken['controls']), broken
                    assert not blocked, blocked
                    assert not errors, errors
                    results.append({'language': lang, 'width': width, 'containment': 'pass', 'negativeControl': 'detected', 'geometry': data})
                except Exception:
                    await page.screenshot(path=str(OUTPUT/f'{lang}-{width}-failure.png'), full_page=True)
                    (OUTPUT/f'{lang}-{width}-failure.html').write_text(await page.content())
                    raise
                finally:
                    await context.close()
        await browser.close()
    (OUTPUT/'results.json').write_text(json.dumps(results, ensure_ascii=False, indent=2))
    print(f'TripPlanner containment: {len(results)} cases passed, including negative controls')

asyncio.run(main())
