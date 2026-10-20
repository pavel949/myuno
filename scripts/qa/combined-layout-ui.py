"""CI-only real layout geometry. Synthetic data; intercepted localhost assets only."""
import asyncio
import json
import os
from pathlib import Path
import sys
from urllib.parse import urlparse
from playwright.async_api import async_playwright, expect

OUTPUT = Path(sys.argv[1])
WIDTHS = [320, 360, 640, 767, 1280]
LANGUAGES = ['ru', 'en', 'th']
SURFACES = ['property', 'account', 'local-services', 'developers', 'management-companies']


async def bounds(page, locator):
    return await locator.evaluate_all("""elements => elements.filter(e=>e.getClientRects().length && getComputedStyle(e).visibility!=='hidden').map(e=>{
      const r=e.getBoundingClientRect();return {text:(e.textContent||e.getAttribute('aria-label')||'').trim().slice(0,100),left:r.left,right:r.right,top:r.top,bottom:r.bottom,innerOverflow:e.scrollWidth>e.clientWidth+1};
    }).filter(r=>r.left < -1 || r.right > innerWidth+1 || r.innerOverflow)""")


async def check_header(page, marketing):
    header = page.locator('header').first
    await expect(header).to_be_visible()
    failures = await bounds(page, header.locator('button,a'))
    assert not failures, {'headerOverflow': failures}
    assert await header.locator('button,a').evaluate_all("""els=>{const boxes=els.filter(e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden').map(e=>e.getBoundingClientRect());return boxes.every((x,i)=>boxes.slice(i+1).every(y=>x.right<=y.left+1||y.right<=x.left+1||x.bottom<=y.top+1||y.bottom<=x.top+1))}"""), 'header controls overlap'
    language = header.locator('[data-testid="language-switch"]:visible')
    await expect(language).to_have_count(1)
    await expect(language).to_have_text((await page.locator('html').get_attribute('lang')).upper())
    assert await language.evaluate("""e=>{const s=e.querySelector('span');const r=document.createRange();r.selectNodeContents(s);return r.getClientRects().length===1 && s.scrollWidth<=s.clientWidth+1 && e.getBoundingClientRect().width>=44;}"""), 'language label split/clipped'
    box = await header.bounding_box()
    if marketing:
        inner = await header.locator(':scope > div').bounding_box()
        assert abs(inner['height'] - 56) <= 1, {'marketingInnerHeight': inner}
    else:
        height = await page.locator('[data-canvas]').first.evaluate("e=>parseFloat(getComputedStyle(e).getPropertyValue('--consumer-header-height'))")
        assert abs(height - box['height']) <= 1, {'heightVariable': height, 'header': box}
    return box


async def check_sticky(page, surface):
    # Empty synthetic browse content needs vertical space to exercise its real
    # sticky parent. Extend only content height, never header/sticky CSS.
    if surface == 'property':
        await page.evaluate("""()=>{const e=[...document.querySelectorAll('.sticky')].find(e=>getComputedStyle(e).zIndex==='40');const spacer=document.createElement('div');spacer.style.height='1800px';e.parentElement.append(spacer)}""")
    sticky = page.locator('main .sticky').first
    await expect(sticky).to_be_visible()
    await page.evaluate('scrollTo(0,250)')
    await page.wait_for_timeout(100)
    header = await check_header(page, False)
    box = await sticky.bounding_box()
    assert box['y'] >= header['y'] + header['height'] - 1, {'surface': surface, 'header': header, 'sticky': box}
    assert abs(box['y'] - header['height']) <= 2, {'stickyNotAtMeasuredOffset': box, 'header': header}
    await expect(sticky.locator('button,a').first).to_be_visible()
    return {'header': header, 'sticky': box}


async def check_destinations(page, surface):
    # Execute real handlers inside MemoryRouter; no destination page/provider is
    # loaded. Capture WhatsApp opening without opening a window or sending data.
    await page.evaluate('window.fixtureOpened=[];window.open=(...args)=>window.fixtureOpened.push(args)')
    output = page.get_by_test_id('location')
    if surface == 'local-services':
        expected = ['/vendor/join', '/for-business', '/become-partner', '/list-with-us']
    elif surface == 'developers':
        expected = ['/developer-portal/apply', '/developer-portal', '/developer-portal/apply', '/developer-portal']
    else:
        expected = ['/auth?redirect=/mc/onboarding&trial=true',
                    '/auth?redirect=/mc/onboarding&trial=true&tier=starter',
                    '/auth?redirect=/mc/onboarding&trial=true&tier=professional',
                    '/auth?redirect=/mc/onboarding&trial=true&tier=enterprise',
                    '/auth?redirect=/mc/onboarding&trial=true']
    buttons = page.locator('section button')
    assert await buttons.count() == len(expected) + (2 if surface == 'management-companies' else 0)
    indices = [0, 2, 3, 4, 5] if surface == 'management-companies' else range(len(expected))
    for index, destination in zip(indices, expected):
        await buttons.nth(index).click()
        await expect(output).to_have_text(destination)
    if surface == 'management-companies':
        await buttons.nth(1).click()
        await page.wait_for_timeout(100)
        pricing = await page.locator('#pricing').bounding_box()
        assert pricing and pricing['y'] < 900, {'pricingScroll': pricing}
        await buttons.last.click()
        opened = await page.evaluate('window.fixtureOpened')
        assert len(opened) == 1 and opened[0] == ['https://wa.me/66922407355?text=Hi%2C+I%27m+interested+in+myUNO+for+my+management+company', '_blank'], opened
        anchors = await page.locator('a[href^="#module-"]').evaluate_all('els=>els.map(e=>e.getAttribute("href"))')
        assert anchors, 'missing module anchors'
        for anchor in anchors:
            assert await page.locator(anchor).count() == 1, anchor
    header_links = await page.locator('header a[href^="/auth"]').evaluate_all('els=>els.map(e=>e.getAttribute("href"))')
    assert header_links == ['/auth', '/auth?mode=signup'], header_links
    return expected


async def main():
    if not os.environ.get('CI') or os.environ.get('GITHUB_ACTIONS') != 'true':
        raise RuntimeError('Browser execution is remote CI-only')
    results = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        for lang in LANGUAGES:
            for width in WIDTHS:
                for surface in SURFACES:
                    context = await browser.new_context(viewport={'width': width, 'height': 900}, timezone_id='Asia/Bangkok', service_workers='block', reduced_motion='reduce')
                    blocked, errors = [], []
                    async def route(request):
                        parsed = urlparse(request.request.url)
                        name = 'fixture.html' if parsed.path == '/fixture' else parsed.path.lstrip('/')
                        types = {'fixture.html': 'text/html', 'fixture.js': 'text/javascript', 'fixture.css': 'text/css'}
                        if parsed.netloc == 'localhost:8080' and name in types:
                            await request.fulfill(path=str(OUTPUT / name), content_type=types[name])
                        else:
                            blocked.append(request.request.url)
                            await request.abort()
                    await context.route('**/*', route)
                    page = await context.new_page()
                    page.on('pageerror', lambda error: errors.append(str(error)))
                    row = {'lang': lang, 'width': width, 'surface': surface, 'outcome': 'FAIL'}
                    try:
                        await page.goto(f'http://localhost:8080/fixture?lang={lang}&surface={surface}', wait_until='networkidle')
                        await page.evaluate('document.fonts.ready')
                        await expect(page.locator('h1,main').first).to_be_visible()
                        row['header'] = await check_header(page, surface not in ['property', 'account'])
                        assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth'), 'document overflow'
                        if surface in ['property', 'account']:
                            row['geometry'] = await check_sticky(page, surface)
                            # A resize must update the observer-owned shared offset.
                            await page.set_viewport_size({'width': 1280 if width < 768 else 320, 'height': 900})
                            await page.wait_for_timeout(100)
                            resized_header = await check_header(page, False)
                            resized_sticky = await page.locator('main .sticky').first.bounding_box()
                            assert abs(resized_sticky['y'] - resized_header['height']) <= 2, {'resizedSticky': resized_sticky, 'header': resized_header}
                            await page.set_viewport_size({'width': width, 'height': 900})
                            await page.wait_for_timeout(100)
                            await check_header(page, False)
                            if width < 768:
                                bottom = page.locator('nav.fixed.bottom-0')
                                assert not await bounds(page, bottom.locator('a')), 'bottom nav overflow'
                                name = {'ru': 'Бронирования', 'en': 'Bookings', 'th': 'การจอง'}[lang]
                                await expect(bottom.get_by_role('link', name=name, exact=True)).to_have_attribute('href', '/bookings')
                        else:
                            assert not await bounds(page, page.locator('section button')), 'marketing CTA clipped'
                            # Check hero siblings against each other, allowing wrapped rows.
                            assert await page.locator('section').first.locator('button').evaluate_all("""els=>els.every((a,i)=>els.slice(i+1).every(b=>{const x=a.getBoundingClientRect(),y=b.getBoundingClientRect();return x.right<=y.left+1||y.right<=x.left+1||x.bottom<=y.top+1||y.bottom<=x.top+1}))"""), 'CTA overlap'
                            row['destinations'] = await check_destinations(page, surface)
                        row['fontStack'] = await page.locator('body').evaluate('e=>getComputedStyle(e).fontFamily')
                        row['fontLimitation'] = 'Canonical Google Fonts are not bundled; network denied; system fallback geometry only.'
                        assert not blocked and not errors, {'blocked': blocked, 'errors': errors}
                        row['outcome'] = 'PASS'
                    except Exception as error:
                        row.update(error=str(error), blocked=blocked, runtimeErrors=errors)
                        await page.screenshot(path=str(OUTPUT / f'{lang}-{width}-{surface}-FAIL.png'), full_page=True)
                        results.append(row)
                        (OUTPUT / 'results.json').write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
                        raise
                    else:
                        await page.screenshot(path=str(OUTPUT / f'{lang}-{width}-{surface}.png'), full_page=True)
                        results.append(row)
                        (OUTPUT / 'results.json').write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
                    finally:
                        await context.close()
        await browser.close()
    assert len(results) == 75 and all(row['outcome'] == 'PASS' for row in results)
    (OUTPUT / 'results.json').write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')


if __name__ == '__main__':
    asyncio.run(main())
