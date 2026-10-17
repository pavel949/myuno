"""Isolated Today QA: local assets only; safe route boundaries, no guest data."""
import asyncio, json, sys
from pathlib import Path
from playwright.async_api import async_playwright, expect
OUTPUT = Path(sys.argv[1])
async def main():
    results = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        for lang in ['ru', 'en']:
            for width in [375, 390, 430, 1280]:
                context = await browser.new_context(viewport={'width':width,'height':1800}, has_touch=width<640, service_workers='block', timezone_id='Asia/Bangkok')
                blocked, errors = [], []
                async def route(r):
                    url = r.request.url
                    file = 'fixture.html' if '/fixture?' in url else url.rsplit('/',1)[-1]
                    types = {'fixture.html':'text/html','fixture.js':'text/javascript','fixture.css':'text/css'}
                    if url.startswith('http://localhost:8080/') and file in types:
                        await r.fulfill(path=str(OUTPUT/file), content_type=types[file])
                    else:
                        blocked.append(url); await r.abort()
                await context.route('**/*', route)
                page = await context.new_page()
                page.on('pageerror', lambda e: errors.append(str(e)))
                async def bounds():
                    data = await page.evaluate('''()=>({width:document.documentElement.scrollWidth, controls:[...document.querySelectorAll('a,button')].map(e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,height:r.height,width:r.width}})})''')
                    assert data['width'] <= width, data
                    assert all(c['left']>=-1 and c['right']<=width+1 and c['height']>=44 and c['width']>=44 for c in data['controls']), data
                await page.goto(f'http://localhost:8080/fixture?lang={lang}', wait_until='networkidle')
                await bounds()
                attention = page.get_by_role('region', name='Требует внимания' if lang=='ru' else 'Needs attention')
                routine = page.get_by_role('region', name='Обращения гостей' if lang=='ru' else 'Guest requests')
                await expect(attention.get_by_text('synthetic urgent request',exact=True)).to_be_visible()
                await expect(attention.get_by_text('synthetic high request',exact=True)).to_be_visible()
                await expect(attention.get_by_text('synthetic normal request',exact=True)).to_have_count(0)
                await expect(routine.get_by_text('synthetic normal request',exact=True)).to_be_visible()
                await expect(routine.get_by_text('synthetic urgent request',exact=True)).to_have_count(0)
                headings = await page.get_by_role('heading',level=2).all_text_contents()
                assert headings[0] == ('Требует внимания' if lang=='ru' else 'Needs attention'), headings
                stays = page.get_by_role('region', name='Заезды и проживание' if lang=='ru' else 'Today’s stays')
                assert await stays.locator('li').count() == 3
                assert '2026-10-17' in await stays.inner_text() and '2026-10-18' in await stays.inner_text()
                await page.screenshot(path=str(OUTPUT/f'{lang}-{width}-populated.png'))
                link = attention.get_by_role('link').first
                await link.focus()
                assert await link.evaluate('(e)=>e===document.activeElement && getComputedStyle(e).boxShadow!=="none"')
                await link.screenshot(path=str(OUTPUT/f'{lang}-{width}-focus.png'))
                await link.press('Enter')
                await expect(page.get_by_test_id('route-boundary')).to_have_text('/mc/properties/synthetic-property')
                await stays.get_by_role('link',name='Открыть объект:' if lang=='ru' else 'Open property:').first.click()
                await expect(page.get_by_test_id('route-boundary')).to_have_text('/mc/properties/synthetic-property')
                for name,path in [('Календарь' if lang=='ru' else 'Calendar','/mc/calendar'),('Задачи' if lang=='ru' else 'Tasks','/mc/tasks')]:
                    await page.get_by_role('link',name=name,exact=True).click()
                    await expect(page.get_by_test_id('route-boundary')).to_have_text(path)
                await page.get_by_role('button',name='Обновить' if lang=='ru' else 'Refresh').click()
                assert await page.evaluate('window.fixtureRefresh') == 1
                for state in ['empty','loading','error','no-properties']:
                    await page.goto(f'http://localhost:8080/fixture?lang={lang}&state={state}',wait_until='networkidle')
                    await bounds()
                    assert await page.get_by_role('link', name='Открыть объект:' if lang=='ru' else 'Open property:').count()==0
                    if state=='error':
                        await expect(page.get_by_role('alert')).to_be_visible()
                        assert await page.locator('section').count()==0
                    elif state=='loading':
                        await expect(page.get_by_role('status',name='Загрузка сведений на сегодня' if lang=='ru' else 'Loading today’s data')).to_be_visible()
                    elif state=='no-properties':
                        await page.get_by_role('link',name='Перейти к объектам' if lang=='ru' else 'Go to properties').click()
                        await expect(page.get_by_test_id('route-boundary')).to_have_text('/mc/properties')
                    await page.screenshot(path=str(OUTPUT/f'{lang}-{width}-{state}.png'))
                assert not blocked, blocked
                assert not errors, errors
                results.append({'language':lang,'width':width,'states':5,'priority':'pass','routeBoundaries':'pass','focusTouch':'pass','overflow':'none','externalRequests':0,'runtimeErrors':0})
                await context.close()
        await browser.close()
    (OUTPUT/'results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
    print(json.dumps(results,ensure_ascii=False,indent=2))
asyncio.run(main())