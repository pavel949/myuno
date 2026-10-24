"""Real Landing/header/preferences; synthetic read-only catalog, no backend writes."""
import asyncio, json, sys
from pathlib import Path
from urllib.parse import urlparse
from playwright.async_api import async_playwright, expect
from dialog_readiness import wait_for_dialog_ready

OUTPUT = Path(sys.argv[1])
WIDTHS = [768, 1920] if '--wide' in sys.argv else [320, 360, 390, 430, 1440]
RESULTS = OUTPUT / ('mobile-header-wide-results.json' if '--wide' in sys.argv else 'mobile-header-results.json')

async def main():
    results = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
        for lang in ['ru', 'en', 'th']:
            for width in WIDTHS:
                for reduced in [False, True]:
                    context = await browser.new_context(viewport={'width': width, 'height':844}, reduced_motion='reduce' if reduced else 'no-preference', service_workers='block')
                    errors, blocked = [], []
                    async def route(r):
                        u = urlparse(r.request.url)
                        file = OUTPUT / ('fixture.html' if u.path == '/fixture' else u.path.lstrip('/'))
                        if u.netloc == 'localhost:8080' and file.is_file():
                            await r.fulfill(path=str(file), content_type={'.html':'text/html','.css':'text/css','.js':'text/javascript','.webp':'image/webp'}.get(file.suffix,'application/octet-stream'))
                        else:
                            blocked.append(r.request.url)
                            await r.abort()
                    await context.route('**/*',route)
                    page = await context.new_page()
                    page.on('pageerror', lambda e: errors.append(str(e)))
                    await page.goto('http://localhost:8080/fixture?lang='+lang,wait_until='domcontentloaded')
                    await expect(page.locator('.home-search-entry-button')).to_be_visible()
                    await expect(page.locator('.consumer-header')).to_have_css('position','relative')
                    await expect(page.locator('.home-hero-image')).to_have_css('object-fit','cover')
                    await page.locator('.home-hero-image').evaluate('(e)=>e.decode()')
                    header = await page.locator('.consumer-header').bounding_box()
                    title = await page.locator('#home-title').bounding_box()
                    search = await page.locator('.home-search-entry-button').bounding_box()
                    assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth')
                    if width < 821:
                        assert header['height'] <= 72, header
                        assert title['y'] >= header['height'] and title['y']-header['height'] <= 30, title
                        assert search['y']+search['height'] < 650, search
                        await expect(page.locator('.consumer-header .consumer-overlay-preferences')).to_be_hidden()
                    toggle = page.locator('.home-motion-control')
                    if reduced:
                        await expect(toggle).to_have_count(0)
                        assert await page.locator('.home-hero-image').evaluate('(e)=>getComputedStyle(e).animationName') == 'none'
                    else:
                        await expect(toggle).to_be_visible()
                        await toggle.focus()
                        await toggle.press('Space')
                        await expect(toggle).to_have_attribute('aria-pressed','true')
                        assert await page.locator('.home-hero-image').evaluate('(e)=>getComputedStyle(e).animationPlayState') == 'paused'
                    await page.screenshot(path=str(OUTPUT/f'{lang}-{width}-{reduced}-home.png'))
                    if width < 821:
                        menu = page.locator('.consumer-menu')
                        target = await menu.bounding_box()
                        assert target['width'] >= 44 and target['height'] >= 44
                        await menu.focus(); await menu.press('Enter')
                        dialog = page.get_by_role('dialog',name='myUNO',exact=True)
                        await expect(dialog).to_be_visible()
                        language = dialog.get_by_test_id('language-switch')
                        await expect(language).to_be_visible()
                        await language.click()
                        await page.get_by_role('menuitem').filter(has_text='English').click()
                        await expect(page.get_by_role('menu')).to_have_count(0)
                        theme = dialog.locator('.consumer-menu-preferences [data-testid="global-preferences-controls"]>button').first
                        await theme.click()
                        await page.get_by_role('menuitem').nth(1).click()
                        await expect(page.get_by_role('menu')).to_have_count(0)
                        assert await page.evaluate('document.documentElement.classList.contains("dark")')
                        await expect(dialog).to_be_visible()
                        await page.screenshot(animations='disabled', path=str(OUTPUT/f'{lang}-{width}-{reduced}-menu.png'))
                        await wait_for_dialog_ready(page, dialog, keyboard=True)
                        await page.keyboard.press('Escape')
                        await expect(dialog).to_have_count(0)
                        await expect(menu).to_be_focused()
                        fixed = await page.locator('nav').evaluate_all('(els)=>els.filter(e=>getComputedStyle(e).position==="fixed" && getComputedStyle(e).display!=="none").map(e=>e.getBoundingClientRect().toJSON())')
                        assert (width >= 768 and not fixed) or (fixed and all(r['bottom'] <= 845 and r['top'] > search['y']+search['height'] for r in fixed)), fixed
                        launcher = await page.locator('[data-global-chat-launcher]').bounding_box()
                        if width < 768:
                            assert fixed[0]['top'] - launcher['y'] - launcher['height'] >= 12, (fixed, launcher)
                    await page.locator('.home-search-entry-button').click()
                    await expect(page.get_by_role('dialog')).to_be_visible()
                    await expect(page.locator('.home-search-intents a')).to_have_count(4)
                    assert await page.locator('.home-search-intents a').evaluate_all("links=>new Set(links.map(a=>a.search)).size===4 && links.every(a=>a.pathname==='/property/search')")
                    await page.keyboard.press('Escape')
                    await expect(page.locator('.home-search-entry-button')).to_be_focused()
                    if width == 390:
                        await page.set_viewport_size({'width':390,'height':568})
                        await page.evaluate("""() => {
                          const entries=[...document.querySelectorAll('.home-hero *')].map(e=>[e,parseFloat(getComputedStyle(e).fontSize)]);
                          entries.forEach(([e,size])=>e.style.fontSize=(size*2)+'px');
                        }""")
                        assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth'), 'Enlarged text overflow'
                        h = await page.locator('#home-title').bounding_box()
                        copy = await page.locator('.home-hero-copy p').bounding_box()
                        card = await page.locator('.home-search-entry-button').bounding_box()
                        assert h['y']+h['height'] <= copy['y'] and copy['y']+copy['height'] <= card['y'], 'Hero flow overlaps'
                        await page.locator('.home-search-entry-button').scroll_into_view_if_needed()
                        short_card = await page.locator('.home-search-entry-button').bounding_box()
                        await page.mouse.wheel(0, max(0, short_card['y']+short_card['height']-508+16))
                        await page.wait_for_function("document.querySelector('.home-search-entry-button').getBoundingClientRect().bottom <= innerHeight - 60", timeout=5000)
                        short_card = await page.locator('.home-search-entry-button').bounding_box()
                        assert short_card['y'] >= 0 and short_card['y']+short_card['height'] <= 508, short_card
                        await page.screenshot(animations='disabled', path=str(OUTPUT/f'{lang}-390-{reduced}-enlarged-short.png'))
                    assert not errors, errors
                    assert all('/fonts/' in u for u in blocked), blocked
                    results.append({'language':lang,'width':width,'reducedMotion':reduced,'headerHeight':header['height'],'outcome':'PASS','errors':errors})
                    RESULTS.write_text(json.dumps(results,indent=2))
                    await context.close()
        await browser.close()
    assert len(results)==len(WIDTHS)*6
    print(f'PASS {len(results)} mobile/desktop header, settings, motion, search and focus scenarios')

asyncio.run(main())
