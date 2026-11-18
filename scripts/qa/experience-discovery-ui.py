import asyncio, json, os, sys
from pathlib import Path
from urllib.parse import urlparse
from playwright.async_api import async_playwright, expect

async def main():
    output = Path(sys.argv[1]); results = []
    async with async_playwright() as p:
        system = Path('/usr/bin/chromium')
        browser = await p.chromium.launch(headless=True, executable_path=str(system) if system.exists() and not os.environ.get('CI') else None, args=['--no-sandbox'])
        for lang in ['en', 'ru', 'th']:
            for width in [375, 390, 430, 1440]:
                context = await browser.new_context(viewport={'width': width, 'height': 900}, service_workers='block')
                outbound, errors = [], []
                async def route(r):
                    url = urlparse(r.request.url); name = url.path.lstrip('/') or 'fixture.html'; file = output / name
                    if name.startswith('fonts/'): file = Path('public') / name
                    if url.netloc == 'fixture.local' and file.is_file(): await r.fulfill(path=str(file))
                    else: outbound.append(r.request.url); await r.abort()
                await context.route('**/*', route)
                page = await context.new_page(); page.on('pageerror', lambda e: errors.append(str(e)))
                await page.goto(f'http://fixture.local/fixture.html?lang={lang}')
                await expect(page.locator('article')).to_be_visible()
                await page.wait_for_function('Array.from(document.images).some(i=>i.complete&&i.naturalWidth>0&&Number(getComputedStyle(i).opacity)>0.99&&i.getBoundingClientRect().height>100)')
                link = page.locator('article a'); await expect(link).to_have_attribute('href', 'https://operator.example/programme')
                assert await link.count() == 1
                assert await page.evaluate('document.documentElement.scrollWidth <= innerWidth'), (lang, width, 'overflow')
                bounds = await link.bounding_box(); assert bounds['width'] >= 44 and bounds['height'] >= 40, bounds
                assert not await page.locator('input,select,form').count()
                assert not outbound and not errors, (outbound, errors)
                await page.screenshot(path=str(output/f'{lang}-{width}.png'), full_page=True)
                results.append({'language':lang,'width':width,'passed':True})
                await context.close()
        await browser.close()
    (output/'results.json').write_text(json.dumps(results, indent=2)); print(json.dumps({'passed':len(results),'output':str(output)}))
asyncio.run(main())
