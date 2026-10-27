"""Real-component UI evidence with synthetic records; all non-fixture requests denied."""
import asyncio, json, re, sys
from pathlib import Path
from urllib.parse import urlparse
from playwright.async_api import async_playwright, expect
OUTPUT = Path(sys.argv[1])

async def main():
    results = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        for lang in ['ru', 'en']:
            for width in [375, 390, 430, 1280]:
                context = await browser.new_context(viewport={'width': width, 'height': 1000}, has_touch=width < 640, service_workers='block', reduced_motion='reduce')
                blocked, errors = [], []
                async def route(r):
                    parsed = urlparse(r.request.url)
                    file = 'fixture.html' if parsed.path == '/fixture' else parsed.path.lstrip('/')
                    types = {'fixture.html': 'text/html', 'app.js': 'text/javascript', 'app.css': 'text/css', 'fixture.css': 'text/css'}
                    if parsed.netloc == 'localhost:8080' and parsed.scheme == 'http' and r.request.method == 'GET' and file in types:
                        await r.fulfill(path=str(OUTPUT / file), content_type=types[file])
                    else:
                        blocked.append({'url': r.request.url, 'method': r.request.method})
                        await r.abort()
                await context.route('**/*', route)
                page = await context.new_page()
                page.on('pageerror', lambda e: errors.append(str(e)))
                async def load(scene):
                    await page.goto(f'http://localhost:8080/fixture?lang={lang}&scene={scene}', wait_until='networkidle')
                    await page.evaluate('document.fonts.ready')
                async def contained():
                    measurements = await page.evaluate('''() => ({width:document.documentElement.scrollWidth, controls:[...document.querySelectorAll('a,button,input,textarea')].filter(e=>e.getClientRects().length).map(e=>{const r=e.getBoundingClientRect();return {name:e.getAttribute('aria-label')||e.textContent||e.getAttribute('placeholder'),left:r.left,right:r.right}})})''')
                    assert measurements['width'] <= width, measurements
                    assert all(c['left'] >= -1 and c['right'] <= width + 1 for c in measurements['controls']), measurements
                async def no_writes():
                    assert await page.evaluate('window.fixtureForbiddenWrites') == []

                # Direct entry: no prior newbuild route may preload the theme CSS.
                await load('microsite')
                await expect(page.get_by_role('heading', level=1, name='Тестовый проект у моря')).to_be_visible()
                await expect(page.get_by_text('37%', exact=True)).to_have_count(0)
                await expect(page.get_by_text('Цена требует уточнения' if lang == 'ru' else 'Price requires confirmation', exact=True)).to_be_visible()
                await expect(page.get_by_text(re.compile(r'(?:от|From) 7[\s,]234[\s,]567 THB'))).to_be_visible()
                await expect(page.get_by_text('Synthetic unit / Тестовый юнит', exact=True)).to_be_visible()
                theme = await page.locator('.nb-theme').first.evaluate(r'''root => {
                    const style=getComputedStyle(root), form=root.querySelector('form');
                    const cta=root.querySelector('header a[href="#lead-form"]');
                    const rgb=color=>color.match(/[\d.]+/g).slice(0,3).map(Number);
                    const lum=color=>rgb(color).map(c=>{const v=c/255;return v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4}).reduce((s,v,i)=>s+v*[0.2126,0.7152,0.0722][i],0);
                    const fg=getComputedStyle(cta).color,bg=getComputedStyle(cta).backgroundColor,a=lum(fg),b=lum(bg);
                    return {background:style.backgroundColor,nbBackground:style.getPropertyValue('--nb-bg').trim(),canonicalBackground:style.getPropertyValue('--background').trim(),gold:style.getPropertyValue('--nb-gold').trim(),orange:style.getPropertyValue('--brand-orange').trim(),formBackground:getComputedStyle(form).backgroundColor,inputBackground:getComputedStyle(form.querySelector('input')).backgroundColor,ctaContrast:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
                }''')
                assert theme['nbBackground'] and theme['nbBackground'] == theme['canonicalBackground'], theme
                assert theme['gold'] and theme['gold'] == theme['orange'], theme
                assert theme['inputBackground'] == theme['background'], theme
                assert theme['formBackground'] not in ['rgba(0, 0, 0, 0)', 'transparent'], theme
                assert theme['ctaContrast'] >= 4.5, theme
                await contained()
                await page.screenshot(path=str(OUTPUT / f'{lang}-{width}-microsite.png'), full_page=True)
                await page.get_by_role('link', name='Запросить информацию', exact=True).click()
                await expect(page).to_have_url(re.compile('#lead-form$'))
                await no_writes()
                analytics = await page.evaluate('window.fixtureAnalytics')
                assert len(analytics) == 1 and analytics[0]['event_data']['project_id'] == 'synthetic-project', analytics

                await load('controls')
                wishlist = page.get_by_role('region', name='Wishlist', exact=True)
                await expect(wishlist.get_by_role('button', pressed=False)).to_have_count(2)
                await wishlist.get_by_role('button', name='Add to wishlist', exact=True).click()
                await expect(wishlist.get_by_role('button', pressed=True)).to_have_count(2)
                assert await page.evaluate('window.fixtureWishlist') == ['synthetic-product']
                priority = page.get_by_role('region', name='Priority', exact=True)
                selected = priority.get_by_role('button', name='Приоритет 2' if lang == 'ru' else 'Priority 2', pressed=True)
                await selected.focus()
                await selected.press('Enter')
                await expect(page.get_by_test_id('priority-boundary')).to_have_text('0')
                await expect(priority.get_by_role('button', pressed=True)).to_have_count(0)
                await priority.get_by_role('button', name='Приоритет 3' if lang == 'ru' else 'Priority 3').click()
                await expect(page.get_by_test_id('priority-boundary')).to_have_text('3')
                category = page.get_by_role('region', name='Vendor category', exact=True)
                await category.get_by_role('button', name=re.compile('Другое' if lang == 'ru' else 'Other')).click()
                choice = category.get_by_role('button', name='Другой бизнес' if lang == 'ru' else 'Other business', exact=True)
                await choice.click()
                await expect(page.get_by_test_id('category-boundary')).to_have_text('other')
                await expect(choice).to_have_count(0)
                # CategoryPicker's existing Framer entry lasts 150 ms after exit.
                await page.wait_for_timeout(200)
                await contained()
                await page.screenshot(path=str(OUTPUT / f'{lang}-{width}-controls.png'), full_page=True)
                await page.get_by_role('button', name='Открыть галерею' if lang == 'ru' else 'Open gallery').click()
                await page.get_by_role('button', name='Следующее фото' if lang == 'ru' else 'Next image').click()
                second = page.get_by_role('button', name='Фото 2' if lang == 'ru' else 'Image 2', exact=True)
                await expect(second).to_have_attribute('aria-current', 'true')
                await expect(page.get_by_role('link', name='Открыть фото' if lang == 'ru' else 'Open image')).to_have_attribute('href', re.compile('^data:image/svg'))
                await contained()
                await page.screenshot(path=str(OUTPUT / f'{lang}-{width}-lightbox.png'))
                await page.get_by_role('button', name='Закрыть' if lang == 'ru' else 'Close', exact=True).click()
                await expect(second).to_have_count(0)
                await no_writes()

                await load('reset')
                new_password = page.get_by_label('Новый пароль' if lang == 'ru' else 'New password', exact=True)
                confirm_password = page.get_by_label('Подтвердите пароль' if lang == 'ru' else 'Confirm password', exact=True)
                await expect(new_password).to_be_visible()
                await new_password.fill('synthetic-fixture-only')
                await confirm_password.fill('synthetic-fixture-only')
                toggle = page.get_by_role('button', name='Показать пароль' if lang == 'ru' else 'Show password', exact=True)
                await toggle.focus()
                await toggle.press('Enter')
                await expect(new_password).to_have_attribute('type', 'text')
                await expect(confirm_password).to_have_attribute('type', 'text')
                hide = page.get_by_role('button', name='Скрыть пароль' if lang == 'ru' else 'Hide password', pressed=True)
                await hide.click()
                await expect(new_password).to_have_attribute('type', 'password')
                await expect(confirm_password).to_have_attribute('type', 'password')
                await contained()
                await page.screenshot(path=str(OUTPUT / f'{lang}-{width}-reset.png'), full_page=True)
                await no_writes()
                assert not blocked, blocked
                assert not errors, errors
                results.append({'language':lang,'width':width,'micrositeDirectTheme':theme,'wishlist':'pass','priority':'pass','intakeCategory':'other','gallery':'pass','resetVisibility':'pass','overflow':'none','externalRequests':0,'forbiddenWrites':0,'runtimeErrors':0})
                await context.close()
        await browser.close()
    (OUTPUT / 'results.json').write_text(json.dumps(results, ensure_ascii=False, indent=2))
    print(json.dumps(results, ensure_ascii=False, indent=2))
asyncio.run(main())
