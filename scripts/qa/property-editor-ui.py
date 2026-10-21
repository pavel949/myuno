"""Real sheet, form, and photo dialogs; synthetic records and network denial only."""
import asyncio
import json
import sys
from pathlib import Path
from playwright.async_api import async_playwright, expect

OUTPUT = Path(sys.argv[1])

async def is_topmost(locator):
    return await locator.evaluate('''e => {
      const r=e.getBoundingClientRect();
      const top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
      return !!top && (e===top || e.contains(top));
    }''')

async def expect_committed_route(page, expected, checkpoint):
    route_state = page.get_by_test_id('fixture-route')
    try:
        await expect(route_state).to_have_text(expected)
    except AssertionError:
        diagnostic = {'checkpoint': checkpoint, 'expected': expected, 'actual': await route_state.all_text_contents()}
        (OUTPUT / f'{checkpoint}-route-failure.json').write_text(json.dumps(diagnostic, ensure_ascii=False, indent=2))
        await page.screenshot(path=str(OUTPUT / f'{checkpoint}-route-failure.png'))
        print(json.dumps(diagnostic, ensure_ascii=False), flush=True)
        raise

async def main():
    results = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        for language in ['ru', 'en']:
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
                route_state = page.get_by_test_id('fixture-route')
                sheet_title = 'Редактировать объект' if language == 'ru' else 'Edit Property'
                sheet = page.get_by_role('dialog', name=sheet_title, exact=True)
                await expect(sheet).to_be_visible()
                await sheet.get_by_role('tab', name='Фото' if language == 'ru' else 'Photos', exact=True).click()
                # Chromium exposes decorative SVGs as image roles too. Count actual
                # gallery assets and their order, not every image-role element.
                photos = sheet.locator('img[alt^="Photo "]')
                await expect(photos).to_have_count(15)
                assert await photos.evaluate_all('(images) => images.map(image => image.alt)') == [f'Photo {i}' for i in range(1, 16)]
                await page.wait_for_timeout(350)  # finish the real sheet transition before geometry checks
                body = sheet.locator('[data-property-form-scroll]')
                footer = sheet.locator('[data-property-form-actions]')
                save = footer.get_by_role('button', name='Сохранить' if language == 'ru' else 'Save', exact=True)
                close = sheet.get_by_role('button', name='Закрыть редактор' if language == 'ru' else 'Close editor')
                geometry = await sheet.evaluate('''e => {
                  const body=e.querySelector('[data-property-form-scroll]');
                  const footer=e.querySelector('[data-property-form-actions]');
                  const b=body.getBoundingClientRect(),f=footer.getBoundingClientRect();
                  const scrollers=[e,...e.querySelectorAll('*')].filter(n=>getComputedStyle(n).overflowY==='auto' && n.scrollHeight>n.clientHeight+1);
                  return {bodyBottom:b.bottom,footerTop:f.top,footerBottom:f.bottom,scrollers:scrollers.length,scrollWidth:document.documentElement.scrollWidth,width:innerWidth};
                }''')
                assert geometry['bodyBottom'] <= geometry['footerTop'] + 1, geometry
                assert geometry['footerBottom'] <= 812 and geometry['scrollers'] == 1, geometry
                assert geometry['scrollWidth'] <= width, geometry
                assert await is_topmost(save), 'Save is covered by the gallery'
                assert await is_topmost(close), 'Sheet close is covered'
                await page.screenshot(path=str(OUTPUT / f'{language}-{width}-gallery-top.png'))
                await body.evaluate('e=>e.scrollTop=e.scrollHeight')
                assert await is_topmost(save), 'Save is covered at gallery bottom'
                assert await is_topmost(close), 'Sheet close is covered after scrolling'
                await page.screenshot(path=str(OUTPUT / f'{language}-{width}-gallery-bottom.png'))
                await body.evaluate('e=>e.scrollTop=0')

                cloud = sheet.get_by_role('button', name='Облачная ссылка' if language == 'ru' else 'Cloud link', exact=True)
                await cloud.click()
                help_dialog = page.get_by_role('dialog', name='Фото по облачной ссылке' if language == 'ru' else 'Photos from a cloud link', exact=True)
                await expect(help_dialog).to_be_visible()
                paste = help_dialog.get_by_role('button', name='Вставить ссылку' if language == 'ru' else 'Paste link', exact=True)
                await page.wait_for_timeout(250)
                assert await is_topmost(paste), 'Cloud help is painted behind the sheet'
                assert await help_dialog.evaluate("e=>Number(getComputedStyle(e).zIndex)>120")
                await page.screenshot(path=str(OUTPUT / f'{language}-{width}-cloud-help.png'))
                await paste.click()
                importer = page.get_by_role('dialog', name='Загрузить фото с сайта', exact=True)
                await expect(importer).to_be_visible()
                await page.wait_for_timeout(250)
                source_input = importer.locator('input[type=url]')
                assert await is_topmost(source_input), 'URL input is covered by the parent sheet'
                await source_input.fill('https://example.invalid/synthetic-only')
                await source_input.press('Tab')
                assert await importer.evaluate('e=>e.contains(document.activeElement)'), 'Keyboard focus left the child dialog'
                await page.screenshot(path=str(OUTPUT / f'{language}-{width}-url-importer.png'))
                await page.keyboard.press('Escape')
                await expect(importer).to_have_count(0)
                await expect(sheet).to_be_visible()
                await expect(route_state).to_contain_text('edit=synthetic-property')

                await sheet.get_by_role('button', name='Редактировать фото 1' if language == 'ru' else 'Edit photo 1', exact=True).click()
                image_editor = page.get_by_role('dialog').filter(has=page.get_by_text('Редактирование фото', exact=True))
                await expect(image_editor).to_be_visible()
                await page.wait_for_timeout(250)
                image_cancel = image_editor.get_by_role('button', name='Отмена', exact=True)
                image_close = image_editor.get_by_role('button', name='Close', exact=True)
                assert await is_topmost(image_cancel), 'Photo-editor footer is covered or outside the viewport'
                assert await is_topmost(image_close), 'Photo-editor close is covered'
                await page.screenshot(path=str(OUTPUT / f'{language}-{width}-image-editor.png'))
                await image_cancel.click()
                await expect(image_editor).to_have_count(0)
                await expect(sheet).to_be_visible()
                await expect(photos).to_have_count(15)
                assert await photos.evaluate_all('(images) => images.map(image => image.alt)') == [f'Photo {i}' for i in range(1, 16)]

                await close.click()
                await expect(sheet).to_have_count(0)
                expected_route='/admin/properties?provider=synthetic-provider&status=pending'
                # Sheet state closes urgently; startTransition navigation can commit later.
                # This retains the exact route contract and reports the actual route on timeout.
                await expect_committed_route(page, expected_route, f'{language}-{width}-close')
                await expect(sheet).to_have_count(0)
                # Revisit a fresh deep link so outside/Escape also proves URL cleanup.
                await page.reload(wait_until='networkidle')
                await expect(sheet).to_be_visible()
                await expect(route_state).to_contain_text('edit=synthetic-property')
                if width == 1280:
                    await page.wait_for_timeout(350)
                    await page.mouse.click(10, 400)
                else:
                    await page.keyboard.press('Escape')
                await expect(sheet).to_have_count(0)
                # Sheet state closes urgently; startTransition navigation can commit later.
                # This retains the exact route contract and reports the actual route on timeout.
                await expect_committed_route(page, expected_route, f'{language}-{width}-outside-or-escape')
                await expect(sheet).to_have_count(0)
                assert await page.evaluate('window.fixtureWrites') == 0
                assert await page.evaluate('window.fixtureDataCalls') == 0
                assert not errors, errors
                assert not any('supabase' in url or '/rest/' in url or '/functions/' in url for url in blocked), blocked
                results.append({'language':language,'width':width,'geometry':geometry,'mutations':0,'dataCalls':0,'committedRoute':await route_state.text_content(),'runtimeErrors':errors,'blockedRequests':len(blocked)})
                await context.close()
        await browser.close()
    (OUTPUT / 'results.json').write_text(json.dumps(results, ensure_ascii=False, indent=2))
    print(json.dumps(results, ensure_ascii=False, indent=2))

asyncio.run(main())
