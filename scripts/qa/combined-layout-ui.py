"""CI-only real layout geometry. Synthetic data; intercepted localhost assets only."""
import asyncio
import json
import os
from pathlib import Path
import sys
from urllib.parse import urlparse
from playwright.async_api import async_playwright, expect, TimeoutError as PlaywrightTimeoutError

OUTPUT = Path(sys.argv[1])
WIDTHS = [320, 360, 640, 767, 1280]
LANGUAGES = ['ru', 'en', 'th']
SURFACES = ['property', 'account', 'local-services', 'developers', 'management-companies', 'owners', 'business']


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
    lang = await page.locator('html').get_attribute('lang')
    language = header.locator('[data-testid="language-switch"]:visible')
    compact_consumer = await header.evaluate("e=>e.classList.contains('consumer-header')") and page.viewport_size['width'] <= 820
    if compact_consumer:
        # The mobile product deliberately moves secondary settings off the header.
        # Verify the real menu route/controls instead of waiting on hidden widgets.
        await expect(language).to_have_count(0)
        trigger = header.locator('.consumer-account-trigger:visible, .consumer-menu:visible')
        await expect(trigger).to_have_count(1)
        target = await trigger.bounding_box()
        assert target and target['width'] >= 44 and target['height'] >= 44, {'mobileMenuTarget': target}
        account_menu = await trigger.evaluate("e=>e.classList.contains('consumer-account-trigger')")
        labels = ({'ru': 'Меню аккаунта', 'en': 'Account menu', 'th': 'เมนูบัญชี'} if account_menu
                  else {'ru': 'Открыть меню', 'en': 'Open menu', 'th': 'เปิดเมนู'})
        await expect(trigger).to_have_accessible_name(labels[lang])
        await trigger.click()
        if account_menu:
            menu = page.get_by_role('menu')
            await expect(menu).to_be_visible()
            settings = menu.get_by_role('menuitem', name={'ru': 'Настройки', 'en': 'Settings', 'th': 'การตั้งค่า'}[lang], exact=True)
            await settings.scroll_into_view_if_needed()
            await expect(settings).to_be_visible()
            settings_box = await settings.bounding_box()
            assert settings_box and settings_box['height'] >= 44, {'settingsTarget': settings_box}
            assert not await bounds(page, menu.get_by_role('menuitem')), 'mobile menu horizontal overflow'
        else:
            dialog = page.get_by_role('dialog')
            await expect(dialog).to_be_visible()
            sheet_language = dialog.locator('[data-testid="language-switch"]:visible')
            await expect(sheet_language).to_have_count(1)
            await expect(sheet_language).to_have_text(lang.upper())
        await page.keyboard.press('Escape')
        await expect(page.get_by_role('menu')).to_have_count(0)
        await expect(page.get_by_role('dialog')).to_have_count(0)
        await expect(trigger).to_be_focused()
    else:
        await expect(language).to_have_count(1)
        await expect(language).to_have_text(lang.upper())
        assert await language.evaluate("""e=>{const s=e.querySelector('span');const r=document.createRange();r.selectNodeContents(s);return r.getClientRects().length===1 && s.scrollWidth<=s.clientWidth+1 && e.getBoundingClientRect().width>=44;}"""), 'language label split/clipped'
    box = await header.bounding_box()
    if marketing:
        inner = await header.locator(':scope > div').bounding_box()
        assert abs(inner['height'] - 56) <= 1, {'marketingInnerHeight': inner}
    else:
        height = await page.locator('[data-canvas]').first.evaluate("e=>parseFloat(getComputedStyle(e).getPropertyValue('--consumer-header-height'))")
        assert abs(height - box['height']) <= 1, {'heightVariable': height, 'header': box}
        if compact_consumer or page.viewport_size['width'] < 640:
            centers = await header.locator('button,a').evaluate_all("els=>els.filter(e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden').map(e=>{const r=e.getBoundingClientRect();return r.top+r.height/2}).sort((a,b)=>a-b)")
            rows = []
            for center in centers:
                if not rows or abs(center - rows[-1]) > 8:
                    rows.append(center)
            assert len(rows) <= (1 if compact_consumer else 2) and box['height'] <= (80 if compact_consumer else 120), {'mobileControlRows': rows, 'header': box}
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
    await expect(sticky.locator('button:visible,a:visible').first).to_be_visible()
    return {'header': header, 'sticky': box}


async def check_destinations(page, surface, row, completed):
    # Execute real handlers inside MemoryRouter; no destination page/provider is
    # loaded. Capture WhatsApp opening without opening a window or sending data.
    await page.evaluate('() => { window.fixtureOpened = []; window.open = (...args) => { window.fixtureOpened.push(args); return null; }; }')
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
        # Observe the result of the actual CTA handler's smooth scroll. Do not
        # scroll the page from the harness, and do not accept an in-flight frame.
        try:
            pricing = await page.wait_for_function("""() => {
          const heading=document.querySelector('#pricing h2');
          if(!heading)return false;
          const r=heading.getBoundingClientRect(), header=document.querySelector('header').getBoundingClientRect();
          const now=performance.now(), old=window.fixturePricingScroll;
          if(!old||Math.abs(old.top-r.top)>0.5||Math.abs(old.scroll-scrollY)>0.5)
            window.fixturePricingScroll={top:r.top,scroll:scrollY,since:now};
          const stable=window.fixturePricingScroll;
          return r.height>0 && r.top>=header.bottom-1 && r.bottom<=innerHeight+1
            && now-stable.since>=100 ? {headingTop:r.top,headingBottom:r.bottom,headerBottom:header.bottom,scrollY,settledFor:now-stable.since} : false;
            }""", polling='raf', timeout=5000)
        except PlaywrightTimeoutError as error:
            raise AssertionError({'pricingHeading': await page.locator('#pricing h2').bounding_box(),
                                  'observedScroll': await page.evaluate('window.fixturePricingScroll'),
                                  'error': 'Actual pricing CTA did not settle the heading inside the viewport within 5s'}) from error
        pricing_proof = await pricing.json_value()
        assert pricing_proof, 'pricing heading did not settle inside viewport'
        row['pricingScroll'] = pricing_proof
        row['phase'] = 'pricing-scroll-checked'
        (OUTPUT / 'results.json').write_text(json.dumps([*completed, row], ensure_ascii=False, indent=2), encoding='utf-8')
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


async def check_measured_anchor(page, selector):
    # Observe only the native anchor/default action or real scrollIntoView
    # handler. The harness never scrolls an anchor into a passing position.
    try:
        proof = await page.wait_for_function("""selector => {
          const target=document.querySelector(selector), header=document.querySelector('.consumer-header');
          if(!target||!header)return false;
          const r=target.getBoundingClientRect(), h=header.getBoundingClientRect();
          const title=target.querySelector('h2').getBoundingClientRect();
          const margin=parseFloat(getComputedStyle(target).scrollMarginTop);
          const maxScroll=Math.max(0,document.documentElement.scrollHeight-innerHeight);
          const expected=Math.max(margin,r.top+scrollY-maxScroll);
          const now=performance.now(), old=window.fixtureMeasuredAnchor;
          if(!old||old.selector!==selector||Math.abs(old.top-r.top)>0.5||Math.abs(old.scroll-scrollY)>0.5)
            window.fixtureMeasuredAnchor={selector,top:r.top,scroll:scrollY,since:now};
          return Math.abs(margin-h.height-16)<=2 && Math.abs(r.top-expected)<=2
            && title.top>=h.bottom+15 && title.bottom<=innerHeight+1
            && now-window.fixtureMeasuredAnchor.since>=100
            ? {targetTop:r.top,headingTop:title.top,headingBottom:title.bottom,headerBottom:h.bottom,margin,expected,scrollY} : false;
        }""", arg=selector, polling='raf', timeout=5000)
        return await proof.json_value()
    except PlaywrightTimeoutError as error:
        raise AssertionError({'anchor': selector, 'target': await page.locator(selector).bounding_box(),
                              'heading': await page.locator(selector+' h2').bounding_box(),
                              'observed': await page.evaluate('window.fixtureMeasuredAnchor')}) from error


async def check_owner_business(page, surface, row, completed):
    if surface == 'owners':
        actions = page.locator('main header a[href="#paths"]')
        await expect(actions).to_have_count(2)
        row['anchorProofs'] = []
        for index in range(2):
            await actions.nth(index).click()
            assert await page.evaluate('location.hash') == '#paths'
            row['anchorProofs'].append(await check_measured_anchor(page, '#paths'))
            (OUTPUT / 'results.json').write_text(json.dumps([*completed, row], ensure_ascii=False, indent=2), encoding='utf-8')
        await expect(page.locator('#paths article a').nth(0)).to_have_attribute('href', '/owner/management-landing')
        await expect(page.locator('#paths article a').nth(1)).to_have_attribute('href', '/mc/onboarding')
    else:
        actions = page.locator('main section').first.locator('button')
        await expect(actions).to_have_count(2)
        row['ctaBoundsFailures'] = await bounds(page, actions)
        assert not row['ctaBoundsFailures'], {'businessCTABounds': row['ctaBoundsFailures']}
        await actions.nth(0).click()
        row['anchorProofs'] = [await check_measured_anchor(page, '#b2b-inquiry-form')]
        (OUTPUT / 'results.json').write_text(json.dumps([*completed, row], ensure_ascii=False, indent=2), encoding='utf-8')
        # No form submission or provider/database call is performed.
        assert await page.locator('#b2b-inquiry-form').evaluate('e=>e.getBoundingClientRect().width<=672'), 'form lost narrow bound'
        await actions.nth(1).click()
        await expect(page.get_by_test_id('location')).to_have_text('/for-local-services')


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
                        row['header'] = await check_header(page, surface not in ['property', 'account', 'owners', 'business'])
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
                                row['bottomBoundsFailures'] = await bounds(page, bottom.locator('a'))
                                assert not row['bottomBoundsFailures'], {'bottomBounds': row['bottomBoundsFailures']}
                                name = {'ru': 'Бронирования', 'en': 'Bookings', 'th': 'การจอง'}[lang]
                                await expect(bottom.get_by_role('link', name=name, exact=True)).to_have_attribute('href', '/bookings')
                        elif surface in ['owners', 'business']:
                            await check_owner_business(page, surface, row, results)
                        else:
                            row['ctaBoundsFailures'] = await bounds(page, page.locator('section button'))
                            assert not row['ctaBoundsFailures'], {'marketingCTABounds': row['ctaBoundsFailures']}
                            # Check hero siblings against each other, allowing wrapped rows.
                            assert await page.locator('section').first.locator('button').evaluate_all("""els=>els.every((a,i)=>els.slice(i+1).every(b=>{const x=a.getBoundingClientRect(),y=b.getBoundingClientRect();return x.right<=y.left+1||y.right<=x.left+1||x.bottom<=y.top+1||y.bottom<=x.top+1}))"""), 'CTA overlap'
                            row['destinations'] = await check_destinations(page, surface, row, results)
                        row['fontStack'] = await page.locator('body').evaluate('e=>getComputedStyle(e).fontFamily')
                        row['fontLimitation'] = 'Canonical Google Fonts are not bundled; network denied; system fallback geometry only.'
                        assert not blocked and not errors, {'blocked': blocked, 'errors': errors}
                        row['outcome'] = 'PASS'
                    except Exception as error:
                        row.update(error=str(error), details=error.args[0] if error.args and isinstance(error.args[0], dict) else None, blocked=blocked, runtimeErrors=errors)
                        results.append(row)
                        (OUTPUT / 'results.json').write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
                        await page.screenshot(path=str(OUTPUT / f'{lang}-{width}-{surface}-FAIL.png'), full_page=True)
                    else:
                        await page.screenshot(path=str(OUTPUT / f'{lang}-{width}-{surface}.png'), full_page=True)
                        results.append(row)
                        (OUTPUT / 'results.json').write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
                    finally:
                        await context.close()
        await browser.close()
    (OUTPUT / 'results.json').write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
    failures = [row for row in results if row['outcome'] != 'PASS']
    assert len(results) == len(LANGUAGES)*len(WIDTHS)*len(SURFACES) and not failures, {'completed': len(results), 'failed': len(failures), 'cases': [(row['lang'], row['width'], row['surface'], row.get('error')) for row in failures]}


if __name__ == '__main__':
    asyncio.run(main())
