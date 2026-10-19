"""Synthetic Today QA: local assets only; no SPA/auth boot or database access.

Run the browser portion in the authorized central CI environment. For local
source/CSS verification without launching a browser, use today-ui.mjs --bundle-only.
"""
import asyncio
import json
import sys
from pathlib import Path
from urllib.parse import parse_qs, urlsplit
from playwright.async_api import async_playwright, expect

OUTPUT = Path(sys.argv[1])
RETURN_TO = '/mc/today?space=synthetic-space#tasks'
STATES = ['populated', 'empty', 'loading', 'error', 'no-properties', 'truncated', 'long-tasks']
LABELS = {
    'ru': {
        'tasks': 'Задачи к выполнению', 'attention': 'Требует внимания',
        'requests': 'Обращения гостей', 'stays': 'Заезды и проживание',
        'properties': 'Объекты', 'open_property': 'Открыть объект:',
        'calendar': 'Календарь', 'task_nav': 'Задачи', 'refresh': 'Обновить',
        'loading': 'Загрузка сведений на сегодня', 'go_properties': 'Перейти к объектам',
        'incomplete': 'Сводка на сегодня неполная', 'due': 'На сегодня: 2026-10-17',
        'undated': 'Дата не указана', 'ops_title': 'Уборка перед заездом',
        'empty_tasks': 'В выбранных объектах нет открытых задач на сегодня, просроченных или без даты',
    },
    'en': {
        'tasks': 'Tasks to act on', 'attention': 'Needs attention',
        'requests': 'Guest requests', 'stays': 'Today’s stays',
        'properties': 'Properties', 'open_property': 'Open property:',
        'calendar': 'Calendar', 'task_nav': 'Tasks', 'refresh': 'Refresh',
        'loading': 'Loading today’s data', 'go_properties': 'Go to properties',
        'incomplete': 'Today’s snapshot is incomplete', 'due': 'Due today: 2026-10-17',
        'undated': 'Date not recorded', 'ops_title': 'Pre-arrival cleaning',
        'empty_tasks': 'No open tasks due or undated in the loaded property scope',
    },
    'th': {
        'tasks': 'งานที่ต้องดำเนินการ', 'attention': 'ต้องดำเนินการ',
        'requests': 'คำขอของแขก', 'stays': 'การเข้าพักวันนี้',
        'properties': 'ที่พัก', 'open_property': 'เปิดที่พัก:',
        'calendar': 'ปฏิทิน', 'task_nav': 'งาน', 'refresh': 'รีเฟรช',
        'loading': 'กำลังโหลดข้อมูลวันนี้', 'go_properties': 'ไปที่ที่พัก',
        'incomplete': 'สรุปวันนี้ไม่ครบถ้วน', 'due': 'ครบกำหนดวันนี้: 2026-10-17',
        'undated': 'ไม่ได้บันทึกวันที่', 'ops_title': 'Pre-arrival cleaning',
        'empty_tasks': 'ไม่มีงานที่ครบกำหนดหรือไม่ระบุวันที่ในขอบเขตที่พักที่โหลด',
    },
}


async def main():
    results = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        for lang, labels in LABELS.items():
            for width in [375, 390, 430, 1280]:
                context = await browser.new_context(
                    viewport={'width': width, 'height': 1800}, has_touch=width < 640,
                    service_workers='block', timezone_id='Asia/Bangkok', locale=lang,
                )
                blocked, errors, served = [], [], []

                async def route(r):
                    url = urlsplit(r.request.url)
                    assets = {
                        '/fixture': ('fixture.html', 'text/html'),
                        '/fixture.js': ('fixture.js', 'text/javascript'),
                        '/fixture.css': ('fixture.css', 'text/css'),
                    }
                    if url.scheme == 'http' and url.netloc == 'localhost:8080' and url.path in assets:
                        file, content_type = assets[url.path]
                        served.append(url.path)
                        await r.fulfill(path=str(OUTPUT / file), content_type=content_type)
                    else:
                        blocked.append(r.request.url)
                        await r.abort()

                await context.route('**/*', route)
                page = await context.new_page()
                page.on('pageerror', lambda e: errors.append(str(e)))
                # Fix display date as well as synthetic projection date for stable captures.
                await page.clock.set_fixed_time('2026-10-17T05:00:00Z')

                async def visit(state='populated'):
                    await page.goto(f'http://localhost:8080/fixture?lang={lang}&state={state}', wait_until='networkidle')
                    await expect(page.locator('html')).to_have_attribute('lang', lang)
                    await expect(page.get_by_test_id('route-boundary')).to_have_text(RETURN_TO)
                    await page.evaluate('document.fonts.ready')

                async def bounds():
                    data = await page.evaluate('''()=>({
                        width:document.documentElement.scrollWidth,
                        controls:[...document.querySelectorAll('a,button')].map(e=>{
                            const r=e.getBoundingClientRect();
                            return {label:e.getAttribute('aria-label')||e.textContent,left:r.left,right:r.right,height:r.height,width:r.width}
                        }),
                        overflow:[...document.querySelectorAll('#root p,#root h1,#root h2,#root h3,#root dt,#root dd,#root a,#root button')]
                            .filter(e=>e.scrollWidth>e.clientWidth+1).map(e=>({text:e.textContent,width:e.clientWidth,scrollWidth:e.scrollWidth}))
                    })''')
                    assert data['width'] <= width, data
                    assert all(c['left'] >= -1 and c['right'] <= width + 1 and c['height'] >= 44 and c['width'] >= 44 for c in data['controls']), data
                    assert not data['overflow'], data

                await visit()
                await bounds()
                tasks = page.locator('section[aria-labelledby="today-tasks"]')
                attention = page.get_by_role('region', name=labels['attention'], exact=True)
                routine = page.get_by_role('region', name=labels['requests'], exact=True)
                stays = page.get_by_role('region', name=labels['stays'], exact=True)
                headings = await page.get_by_role('heading', level=2).all_text_contents()
                assert headings[0].startswith(labels['tasks']), headings
                assert await page.locator('section').first.get_attribute('aria-labelledby') == 'today-tasks'
                assert await tasks.locator('li').count() == 2
                await expect(tasks.get_by_text(labels['ops_title'], exact=True)).to_be_visible()
                await expect(tasks.get_by_text('Contact guest', exact=True)).to_be_visible()
                await expect(tasks.get_by_text(labels['due'], exact=True)).to_be_visible()
                await expect(tasks.get_by_text(labels['undated'], exact=True)).to_be_visible()
                await expect(attention.get_by_text('synthetic urgent request', exact=True)).to_be_visible()
                await expect(attention.get_by_text('synthetic high request', exact=True)).to_be_visible()
                await expect(attention.get_by_text('synthetic normal request', exact=True)).to_have_count(0)
                await expect(routine.get_by_text('synthetic normal request', exact=True)).to_be_visible()
                await expect(routine.get_by_text('synthetic urgent request', exact=True)).to_have_count(0)
                assert await stays.locator('li').count() == 3
                assert '2026-10-17' in await stays.inner_text() and '2026-10-18' in await stays.inner_text()
                await page.screenshot(path=str(OUTPUT / f'{lang}-{width}-populated.png'), full_page=True)
                for region, name in [(tasks, 'tasks'), (routine, 'requests'), (page.get_by_role('region', name=labels['properties'], exact=True), 'units')]:
                    await region.screenshot(path=str(OUTPUT / f'{lang}-{width}-{name}.png'))

                # Same synthetic ID in both canonical sources must stay unambiguous.
                for index, source in enumerate(['ops', 'crm']):
                    if index:
                        await visit()
                    link = tasks.get_by_role('link').nth(index)
                    href = await link.get_attribute('href')
                    route_url = urlsplit(href)
                    assert route_url.path == '/mc/tasks', href
                    assert parse_qs(route_url.query) == {
                        'source': [source], 'id': ['shared-id'], 'company': ['synthetic-company'],
                        'returnTo': [RETURN_TO],
                    }, href
                    await link.focus()
                    assert await link.evaluate('(e)=>e===document.activeElement && getComputedStyle(e).boxShadow!=="none"')
                    if not index:
                        await link.screenshot(path=str(OUTPUT / f'{lang}-{width}-focus.png'))
                    await link.press('Enter')
                    await expect(page.get_by_test_id('route-boundary')).to_have_text(href)
                await visit()
                await expect(attention).to_have_count(1)
                await attention.get_by_role('link', name=labels['open_property']).first.click()
                await expect(page.get_by_test_id('route-boundary')).to_have_text('/mc/properties/synthetic-property')
                await stays.get_by_role('link', name=labels['open_property']).first.click()
                await expect(page.get_by_test_id('route-boundary')).to_have_text('/mc/properties/synthetic-property')
                for name, path in [(labels['calendar'], '/mc/calendar'), (labels['task_nav'], '/mc/tasks')]:
                    await page.get_by_role('link', name=name, exact=True).click()
                    await expect(page.get_by_test_id('route-boundary')).to_have_text(path)
                await page.get_by_role('button', name=labels['refresh']).click()
                assert await page.evaluate('window.fixtureRefresh') == 1

                for state in STATES[1:]:
                    await visit(state)
                    await bounds()
                    if state == 'long-tasks':
                        assert await tasks.locator('li').count() == 2
                        await expect(tasks.get_by_role('link').first).to_contain_text('ОченьДлинное' if lang == 'ru' else 'LongUnbroken')
                    else:
                        assert await page.get_by_role('link', name=labels['open_property']).count() == 0
                    if state in ['error', 'truncated']:
                        await expect(page.get_by_role('alert')).to_be_visible()
                        assert await page.locator('section').count() == 0
                        assert await page.locator('dl').count() == 0
                        if state == 'truncated':
                            await expect(page.get_by_role('alert')).to_contain_text(labels['incomplete'])
                            for name, path in [(labels['task_nav'], '/mc/tasks'), (labels['calendar'], '/mc/calendar')]:
                                await page.get_by_role('link', name=name, exact=True).click()
                                await expect(page.get_by_test_id('route-boundary')).to_have_text(path)
                    elif state == 'empty':
                        await expect(tasks.get_by_text(labels['empty_tasks'], exact=True)).to_be_visible()
                        assert await tasks.get_by_role('link').count() == 0
                    elif state == 'loading':
                        await expect(page.get_by_role('status', name=labels['loading'])).to_be_visible()
                        assert await page.locator('section').count() == 0
                    elif state == 'no-properties':
                        await page.get_by_role('link', name=labels['go_properties']).click()
                        await expect(page.get_by_test_id('route-boundary')).to_have_text('/mc/properties')
                    await page.screenshot(path=str(OUTPUT / f'{lang}-{width}-{state}.png'), full_page=True)
                assert not blocked, blocked
                assert not errors, errors
                results.append({
                    'language': lang, 'width': width, 'states': STATES,
                    'taskFirst': 'pass', 'sourceQualifiedLinks': 'pass', 'returnContext': 'pass',
                    'incompleteSnapshot': 'pass', 'priority': 'pass', 'routeBoundaries': 'pass',
                    'focusTouch': 'pass', 'overflow': 'none', 'servedLocalAssets': len(served),
                    'externalRequests': 0, 'runtimeErrors': 0,
                    'fonts': 'installed fallback fonts; remote webfonts intentionally not fetched',
                })
                await context.close()
        await browser.close()
    (OUTPUT / 'results.json').write_text(json.dumps(results, ensure_ascii=False, indent=2))
    print(json.dumps(results, ensure_ascii=False, indent=2))


asyncio.run(main())
