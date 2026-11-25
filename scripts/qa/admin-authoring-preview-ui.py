"""Read-only acceptance of five actual admin authoring entry routes on real Chromium."""
import asyncio
import json
import sys
from pathlib import Path
from urllib.parse import urlencode, urlparse, parse_qs

from playwright.async_api import async_playwright, expect
from dialog_readiness import wait_for_dialog_ready

OUTPUT = Path(sys.argv[1])
ORIGIN = 'http://localhost:8080'
CASES = [
    ('property', '/admin/properties', 'Add property', 'New Property', 'Modern Villa with Pool'),
    ('project', '/admin/projects', 'New Project', 'New Project', 'Laguna Beach Resort'),
    ('developer', '/admin/developers', 'New Developer', 'New Developer', 'Sansiri'),
    ('supplier', '/admin/providers', 'Add', 'New Provider', 'Thai Massage & Spa'),
    ('service', '/admin/services?provider=synthetic-provider&action=new&source=qa', None, 'New Service', 'Thai Massage'),
]

async def inspect_geometry(page, dialog, scroll, width):
    data = await dialog.evaluate('''e => {
      const rect=e.getBoundingClientRect();
      return {documentWidth:document.documentElement.scrollWidth,
        left:rect.left,right:rect.right,clientWidth:e.clientWidth,scrollWidth:e.scrollWidth};
    }''')
    body = await scroll.evaluate('''e => ({clientWidth:e.clientWidth,scrollWidth:e.scrollWidth,
      clientHeight:e.clientHeight,scrollHeight:e.scrollHeight,overflowY: getComputedStyle(e).overflowY})''')
    assert data['documentWidth'] <= width + 1 and data['left'] >= -1 and data['right'] <= width + 1, data
    assert data['scrollWidth'] <= data['clientWidth'] + 1, data
    assert body['scrollWidth'] <= body['clientWidth'] + 1 and body['clientHeight'] > 0, body
    if body['scrollHeight'] > body['clientHeight'] + 1:
        assert body['overflowY'] in ('auto', 'scroll'), body

async def main():
    results = []
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        for width in (320, 390, 1440):
            context = await browser.new_context(
                viewport={'width': width, 'height': 850 if width < 600 else 1000},
                has_touch=width < 600,
                reduced_motion='reduce',
                service_workers='block',
            )
            blocked, errors = [], []

            async def route(r):
                url = urlparse(r.request.url)
                names = {'/fixture': ('fixture.html', 'text/html'), '/fixture.js': ('fixture.js', 'text/javascript'),
                         '/fixture.css': ('fixture.css', 'text/css')}
                if url.netloc == 'localhost:8080' and r.request.method == 'GET' and url.path in names:
                    file, content_type = names[url.path]
                    await r.fulfill(path=OUTPUT / file, content_type=content_type)
                else:
                    blocked.append((r.request.method, url.hostname, url.path))
                    await r.abort()

            await context.route('**/*', route)
            page = await context.new_page()
            page.on('pageerror', lambda error: errors.append(str(error)))
            for key, entry, launch, title, placeholder in CASES:
                try:
                    await page.goto(ORIGIN + '/fixture?' + urlencode({'entry': entry}), wait_until='load')
                    if launch:
                        await page.get_by_role('button', name=launch, exact=True).click()
                    phone_or_desktop_dialog = page.get_by_role('dialog', name=title, exact=True)
                    await expect(phone_or_desktop_dialog).to_be_visible()
                    await wait_for_dialog_ready(page, phone_or_desktop_dialog, keyboard=True,
                                                failure_path=OUTPUT / f'{width}-{key}-readiness-failure')
                    if key == 'service':
                        route_value = await page.get_by_test_id('actual-admin-route').text_content()
                        parsed = urlparse(route_value)
                        params = parse_qs(parsed.query)
                        assert parsed.path == '/admin/catalog' and params.get('tab') == ['services'], route_value
                        assert params.get('provider') == ['synthetic-provider'] and params.get('source') == ['qa'], route_value
                        await expect(phone_or_desktop_dialog.get_by_role('combobox').filter(has_text='Synthetic provider')).to_be_visible()

                    title_text = 'QA unsaved ' + key
                    await phone_or_desktop_dialog.get_by_placeholder(placeholder, exact=True).fill(title_text)
                    if key == 'supplier':
                        await phone_or_desktop_dialog.get_by_placeholder('+66...', exact=True).fill('+66000000123')
                    disclosure = phone_or_desktop_dialog.locator('details').filter(
                        has=page.locator('summary:text-is("Preview draft")'))
                    # Native details/summary preview opens with keyboard; it is not save/publish.
                    summary = disclosure.locator('summary')
                    await expect(summary).to_be_visible()
                    await summary.press('Enter')
                    await expect(disclosure).to_have_attribute('open', '')
                    await expect(disclosure.get_by_text(title_text, exact=True)).to_be_visible()
                    if key == 'supplier':
                        await expect(disclosure).not_to_contain_text('+66000000123')
                    await expect(disclosure).to_contain_text('does not save or publish')
                    await expect(phone_or_desktop_dialog.get_by_role('button', name='Save', exact=True)).to_be_visible()
                    scroll = phone_or_desktop_dialog.locator('[data-property-form-scroll]' if key == 'property' else '[data-admin-editor-scroll]')
                    await expect(scroll).to_have_count(1)
                    await inspect_geometry(page, phone_or_desktop_dialog, scroll, width)
                    save_bounds = await phone_or_desktop_dialog.get_by_role('button', name='Save', exact=True).bounding_box()
                    assert save_bounds and save_bounds['y'] >= 0 and save_bounds['y'] + save_bounds['height'] <= page.viewport_size['height'] + 1, save_bounds
                    assert await page.evaluate('window.fixtureDeniedCalls') == [], 'Unexpected write or data access'
                    await page.screenshot(path=OUTPUT / f'{width}-{key}-preview.png')
                    await page.keyboard.press('Escape')
                    await expect(page.get_by_role('dialog')).to_have_count(0)
                    assert await page.evaluate('window.fixtureDeniedCalls') == [], 'Cancel attempted data access'
                    assert not blocked and not errors, {'blocked': blocked, 'errors': errors}
                    results.append({'width': width, 'surface': key, 'preview': 'unsaved content', 'mutationAttempts': 0,
                                    'horizontalOverflow': 'none', 'externalRequests': 0, 'close': 'pass'})
                    (OUTPUT / 'results.json').write_text(json.dumps(results, indent=2), encoding='utf-8')
                except Exception:
                    await page.screenshot(path=OUTPUT / f'{width}-{key}-failure.png')
                    raise
            await context.close()
        await browser.close()
    print(json.dumps(results, indent=2))

asyncio.run(main())
