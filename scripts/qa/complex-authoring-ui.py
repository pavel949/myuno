"""Network-denying complex authoring UI fixture. All writes stay in memory."""
import asyncio
import json
import sys
from pathlib import Path
from playwright.async_api import async_playwright, expect

OUTPUT = Path(sys.argv[1])
COPY = {
    'en': {'new': 'New complex', 'name': 'Name (EN)', 'save': 'Save draft', 'open': 'Open', 'submit': 'Submit for review', 'pending': 'Awaiting review', 'close': 'Close', 'review': 'Review details', 'publish': 'Approve and publish'},
    'ru': {'new': 'Новый комплекс', 'name': 'Название (EN)', 'save': 'Сохранить черновик', 'open': 'Открыть', 'submit': 'Отправить на проверку', 'pending': 'На проверке', 'close': 'Закрыть', 'review': 'Проверить данные', 'publish': 'Одобрить и опубликовать'},
    'th': {'new': 'โครงการใหม่', 'name': 'ชื่อ (EN)', 'save': 'บันทึกฉบับร่าง', 'open': 'เปิด', 'submit': 'ส่งเพื่อตรวจสอบ', 'pending': 'รอตรวจสอบ', 'close': 'ปิด', 'review': 'ตรวจสอบรายละเอียด', 'publish': 'อนุมัติและเผยแพร่'},
}

async def geometry(dialog, page, width):
    await page.wait_for_timeout(250)
    measured = await dialog.evaluate('''element => {
      const body=element.querySelector('[data-complex-form-scroll]');
      const actions=element.querySelector('[data-complex-form-actions]');
      const b=body.getBoundingClientRect(), a=actions.getBoundingClientRect(), d=element.getBoundingClientRect();
      const button=actions.querySelector('button:last-child'), r=button.getBoundingClientRect();
      const top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
      return {scrollWidth:document.documentElement.scrollWidth,bodyBottom:b.bottom,footerTop:a.top,footerBottom:a.bottom,dialogTop:d.top,dialogBottom:d.bottom,buttonTopmost:!!top&&(button===top||button.contains(top))};
    }''')
    assert measured['scrollWidth'] <= width, measured
    assert measured['bodyBottom'] <= measured['footerTop'] + 1, measured
    assert 0 <= measured['dialogTop'] and measured['dialogBottom'] <= 812, measured
    assert measured['footerBottom'] <= 812 and measured['buttonTopmost'], measured
    return measured

async def main():
    results = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        for language, copy in COPY.items():
            for width in [375, 390, 430, 1280]:
                context = await browser.new_context(viewport={'width': width, 'height': 812}, is_mobile=width < 640, has_touch=width < 640, service_workers='block')
                blocked, errors = [], []
                async def isolated_route(route):
                    url = route.request.url
                    filename = 'fixture.html' if url.startswith('http://localhost:8080/fixture?') else url.rsplit('/', 1)[-1]
                    types = {'fixture.html': 'text/html', 'fixture.js': 'text/javascript', 'fixture.css': 'text/css'}
                    if url.startswith('http://localhost:8080/') and filename in types:
                        await route.fulfill(path=str(OUTPUT / filename), content_type=types[filename])
                    else:
                        blocked.append(url)
                        await route.abort()
                await context.route('**/*', isolated_route)
                page = await context.new_page()
                page.on('pageerror', lambda error: errors.append(str(error)))
                await page.goto(f'http://localhost:8080/fixture?lang={language}', wait_until='networkidle')
                await page.get_by_role('button', name=copy['new'], exact=True).click()
                dialog = page.get_by_role('dialog')
                await expect(dialog).to_be_visible()
                await dialog.get_by_label(copy['name'], exact=True).fill('Synthetic reviewed complex')
                await expect(dialog.locator('#complex-authoring-space')).to_have_value('synthetic-space')
                measured = await geometry(dialog, page, width)
                await page.screenshot(path=str(OUTPUT / f'{language}-{width}-new.png'))
                await dialog.get_by_role('button', name=copy['save'], exact=True).click()
                await expect(dialog).to_have_count(0)
                await expect(page.get_by_text('Synthetic reviewed complex', exact=True)).to_be_visible()
                await page.get_by_role('button', name=copy['open'], exact=True).click()
                await expect(dialog).to_be_visible()
                await expect(dialog.get_by_label(copy['name'], exact=True)).to_have_value('Synthetic reviewed complex')
                await dialog.get_by_role('button', name=copy['submit'], exact=True).click()
                await expect(dialog).to_have_count(0)
                await expect(page.get_by_text(copy['pending'], exact=True)).to_be_visible()
                await page.get_by_role('button', name=copy['open'], exact=True).click()
                await expect(dialog.get_by_label(copy['name'], exact=True)).to_be_disabled()
                await expect(dialog.get_by_role('button', name=copy['submit'], exact=True)).to_have_count(0)
                await geometry(dialog, page, width)
                await page.screenshot(path=str(OUTPUT / f'{language}-{width}-pending.png'))
                assert await page.evaluate('window.fixtureWrites') == 2
                assert await page.evaluate('window.fixtureDataCalls') == 0
                assert not errors, errors
                assert not any('supabase' in url or '/rest/' in url or '/functions/' in url for url in blocked), blocked
                await page.goto(f'http://localhost:8080/fixture?lang={language}&screen=review', wait_until='networkidle')
                await page.get_by_role('button', name=copy['review'], exact=True).click()
                await expect(dialog).to_be_visible()
                await expect(dialog.get_by_label(copy['name'], exact=True)).to_be_disabled()
                review_geometry = await geometry(dialog, page, width)
                await page.screenshot(path=str(OUTPUT / f'{language}-{width}-admin-review.png'))
                await dialog.get_by_role('button', name=copy['publish'], exact=True).click()
                await expect(dialog).to_have_count(0)
                await expect(page.get_by_role('button', name=copy['review'], exact=True)).to_have_count(0)
                assert await page.evaluate('window.fixtureWrites') == 1
                assert await page.evaluate('window.fixtureDataCalls') == 0
                assert not errors, errors
                results.append({'language': language, 'width': width, 'geometry': measured, 'reviewGeometry': review_geometry, 'syntheticWrites': 3, 'externalDataCalls': 0, 'runtimeErrors': errors})
                await context.close()
        await browser.close()
    (OUTPUT / 'results.json').write_text(json.dumps(results, ensure_ascii=False, indent=2))
    print(json.dumps(results, ensure_ascii=False, indent=2))

asyncio.run(main())
