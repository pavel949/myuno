"""Network-denying browser proof for actual admin property/project review pages."""
import asyncio, json, re, sys
from pathlib import Path
from urllib.parse import urlencode, urlparse
from playwright.async_api import async_playwright, expect
from dialog_readiness import wait_for_dialog_ready, dialog_diagnostics
OUTPUT = Path(sys.argv[1])

async def main():
    results = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        for lang in ['ru', 'en', 'th']:
            for width in [375, 390, 430, 1280]:
                context = await browser.new_context(viewport={'width': width, 'height': 1200}, has_touch=width < 640, service_workers='block')
                blocked, errors = [], []
                async def route(r):
                    parsed = urlparse(r.request.url)
                    name = 'fixture.html' if parsed.path == '/fixture' else parsed.path.removeprefix('/')
                    types = {'fixture.html': 'text/html', 'fixture.js': 'text/javascript', 'fixture.css': 'text/css'}
                    if parsed.netloc == 'localhost:8080' and r.request.method == 'GET' and name in types:
                        await r.fulfill(path=str(OUTPUT / name), content_type=types[name])
                    else:
                        blocked.append(r.request.url)
                        await r.abort()
                await context.route('**/*', route)
                page = await context.new_page()
                page.on('pageerror', lambda e: errors.append(str(e)))
                is_ru = lang == 'ru'
                async def load(view, query='', state='populated'):
                    await page.goto('http://localhost:8080/fixture?' + urlencode({'lang': lang, 'page': view, 'route': query, 'state': state}), wait_until='networkidle')
                    if view == 'properties':
                        await expect(page.get_by_role('status').filter(has_text=re.compile('^' + re.escape('На этой странице нет предложений на проверке.' if is_ru else 'No pending proposals on this page.' if lang != 'th' else 'ไม่มีข้อเสนอที่รอตรวจสอบในหน้านี้') + '$'))).to_be_visible()
                async def bounds():
                    data = await page.evaluate('''()=>({width:document.documentElement.scrollWidth,controls:[...document.querySelectorAll('button,input,[role="combobox"]')].filter(e=>e.getClientRects().length).map(e=>{const r=e.getBoundingClientRect();return {label:e.textContent,left:r.left,right:r.right}}),filters:[...document.querySelectorAll('fieldset button')].map(e=>({label:e.textContent,height:e.getBoundingClientRect().height,scroll:e.scrollWidth,width:e.clientWidth}))})''')
                    assert data['width'] <= width, data
                    assert all(c['left'] >= -1 and c['right'] <= width + 1 for c in data['controls']), data
                    assert all(c['height'] >= 44 and c['scroll'] <= c['width'] + 1 for c in data['filters']), data
                async def no_writes():
                    assert await page.evaluate('window.fixtureForbiddenWrites') == []
                async def capture(name):
                    await bounds()
                    await page.screenshot(path=str(OUTPUT / f'{lang}-{width}-{name}.png'), full_page=True)
                async def contrast():
                    ratio = await page.locator('fieldset button[aria-pressed="true"]').first.evaluate(r'''e=>{
                        const luminance=color=>color.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
                        const s=getComputedStyle(e),a=luminance(s.color),b=luminance(s.backgroundColor);return(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
                    }''')
                    assert ratio >= 4.5, ratio
                    return ratio

                await load('properties', '?provider=synthetic-provider&status=pending&activity=active&source=fixture')
                pending_home = 'Объект на модерации' if is_ru else 'Pending coastal home'
                approved_home = 'Одобренный объект' if is_ru else 'Approved coastal home'
                await expect(page.get_by_role('heading', name=pending_home, exact=True)).to_be_visible()
                await expect(page.get_by_role('heading', name=approved_home, exact=True)).to_have_count(0)
                properties_contrast = await contrast()
                await capture('properties-pending')
                approved = page.get_by_role('button', name=re.compile(r'^' + (('Одобрено' if is_ru else 'Approved' if lang != 'th' else 'อนุมัติแล้ว')) + r'\s+1$'))
                await approved.focus()
                await expect(approved).to_be_focused()
                await approved.press('Enter')
                await expect(page.get_by_test_id('route-boundary')).to_contain_text('provider=synthetic-provider&status=approved&activity=active&source=fixture')
                await expect(page.get_by_role('heading', name=approved_home, exact=True)).to_be_visible()
                # The card and dropdown are real; the unchanged form is a named fixture boundary.
                await page.get_by_role('button', name='Действия' if is_ru else 'Actions', exact=True).click()
                await page.get_by_role('menuitem', name='Редактировать' if is_ru else 'Edit', exact=True).click()
                await expect(page.get_by_role('dialog', name=('Редактировать объект' if is_ru else 'Edit Property' if lang != 'th' else 'แก้ไขที่พัก'))).to_be_visible()
                await expect(page.get_by_test_id('property-editor-boundary')).to_be_visible()
                dialog = page.get_by_role('dialog')
                ready = await wait_for_dialog_ready(page, dialog, keyboard=True,
                    failure_path=OUTPUT / f'{lang}-{width}-property-editor-readiness-failure')
                await page.keyboard.press('Escape')
                try:
                    await expect(page.get_by_role('dialog')).to_have_count(0)
                except Exception:
                    (OUTPUT / f'{lang}-{width}-property-escape-failure.json').write_text(json.dumps({
                        'beforeEscape': ready, 'afterEscape': await dialog_diagnostics(page, dialog)
                    }, indent=2), encoding='utf-8')
                    await page.screenshot(path=str(OUTPUT / f'{lang}-{width}-property-escape-failure.png'), full_page=True)
                    raise
                await no_writes()
                await load('properties')
                await expect(page.get_by_text(('Модерация: неизвестно' if is_ru else 'Approval: unknown' if lang != 'th' else 'การอนุมัติ: ไม่ทราบ'), exact=True)).to_be_visible()
                await expect(page.get_by_text(('Активность: неизвестно' if is_ru else 'Activity: unknown' if lang != 'th' else 'การใช้งาน: ไม่ทราบ'), exact=True)).to_be_visible()
                await capture('properties-all')
                await page.get_by_role('textbox', name=('Поиск объектов' if is_ru else 'Search properties' if lang != 'th' else 'ค้นหาที่พัก'), exact=True).fill('no-synthetic-match')
                await expect(page.get_by_text(('Нет совпадений' if is_ru else 'No matching properties' if lang != 'th' else 'ไม่พบที่พักที่ตรงกัน'), exact=True)).to_be_visible()
                await capture('properties-no-match')
                await no_writes()

                await load('projects', '?filter=pending&stage=offplan&source=newbuilds')
                pending_project = 'Проект на модерации' if is_ru else 'Pending coastal project'
                await expect(page.get_by_role('heading', name=pending_project, exact=True)).to_be_visible()
                await expect(page.get_by_role('heading', name='Проект без обновлений' if is_ru else 'Approved older project', exact=True)).to_have_count(0)
                await expect(page.get_by_role('combobox', name=('Стадия строительства' if is_ru else 'Construction stage' if lang != 'th' else 'สถานะการก่อสร้าง'))).to_have_text(('Офф-план' if is_ru else 'Off-Plan' if lang != 'th' else 'ขายก่อนก่อสร้าง'))
                projects_contrast = await contrast()
                await capture('projects-pending')
                await page.get_by_role('button', name=('Проверить' if is_ru else 'Review details' if lang != 'th' else 'ตรวจสอบข้อมูล'), exact=True).click()
                await expect(page.get_by_role('dialog', name=('Редактировать проект' if is_ru else 'Edit Project' if lang != 'th' else 'แก้ไขโครงการ'))).to_be_visible()
                project_ready = await wait_for_dialog_ready(page, page.get_by_role('dialog'), keyboard=True,
                    failure_path=OUTPUT / f'{lang}-{width}-project-editor-readiness-failure')
                await page.keyboard.press('Escape')
                await expect(page.get_by_role('dialog')).to_have_count(0)
                await expect(page.get_by_test_id('route-boundary')).to_have_text('/admin/projects?filter=pending&stage=offplan&source=newbuilds')
                await no_writes()
                await load('projects', '?filter=stale')
                await expect(page.get_by_role('heading', name='Проект без обновлений' if is_ru else 'Approved older project', exact=True)).to_be_visible()
                await expect(page.get_by_role('heading', name=pending_project, exact=True)).to_have_count(0)
                await capture('projects-stale')
                # Existing KPI predicates, not new status assignments.
                for review in ['orphan', 'needs_review']:
                    await load('projects', '?filter=' + review)
                    await expect(page.get_by_role('heading', name=pending_project, exact=True)).to_be_visible()
                    await expect(page.get_by_role('button', name=('Проверить' if is_ru else 'Review details' if lang != 'th' else 'ตรวจสอบข้อมูล'), exact=True)).to_have_count(1)
                    await no_writes()
                await load('projects')
                await capture('projects-all')
                stage = page.get_by_role('combobox', name=('Стадия строительства' if is_ru else 'Construction stage' if lang != 'th' else 'สถานะการก่อสร้าง'))
                await stage.click()
                await page.get_by_role('option', name=('Сдан' if is_ru else 'Completed' if lang != 'th' else 'สร้างเสร็จ'), exact=True).click()
                await expect(page.get_by_role('listbox')).to_have_count(0)
                await expect(page.get_by_test_id('route-boundary')).to_contain_text('stage=completed')
                await expect(page.get_by_role('button', name=('Проверить' if is_ru else 'Review details' if lang != 'th' else 'ตรวจสอบข้อมูล'), exact=True)).to_have_count(1)
                await no_writes()

                for view in ['properties', 'projects']:
                    load_error_text = ({'ru': 'Не удалось загрузить объекты. Статусы и количество недоступны.', 'en': 'Could not load properties. Statuses and counts are unavailable.', 'th': 'โหลดที่พักไม่ได้ จึงไม่ทราบสถานะและจำนวน'} if view == 'properties' else {'ru': 'Не удалось загрузить проекты. Статусы и количество недоступны.', 'en': 'Could not load projects. Statuses and counts are unavailable.', 'th': 'โหลดโครงการไม่ได้ จึงไม่ทราบสถานะและจำนวน'})[lang]
                    load_error = page.get_by_role('alert').filter(has_text=load_error_text)
                    loading_text = ({'ru': 'Загрузка объектов…', 'en': 'Loading properties…', 'th': 'กำลังโหลดที่พัก…'} if view == 'properties' else {'ru': 'Загрузка проектов…', 'en': 'Loading projects…', 'th': 'กำลังโหลดโครงการ…'})[lang]
                    count_unavailable = 'Количество недоступно' if is_ru else 'Count unavailable' if lang != 'th' else 'ไม่ทราบจำนวน'
                    empty_count = 'Показано: 0 из 0' if is_ru else 'Showing 0 of 0' if lang != 'th' else 'แสดง 0 จาก 0 รายการ'
                    for state in ['loading', 'error', 'empty']:
                        await load(view, state=state)
                        if state == 'loading':
                            await expect(page.get_by_role('status').filter(has_text=re.compile('^' + re.escape(loading_text) + '$'))).to_be_visible()
                            await expect(page.get_by_role('button', name=re.compile(r'^' + (('Все' if is_ru else 'All' if lang != 'th' else 'ทั้งหมด')) + r'\s+—$'))).to_be_visible()
                        elif state == 'error':
                            await expect(load_error).to_be_visible()
                            await expect(page.get_by_role('status').filter(has_text=re.compile('^' + re.escape(count_unavailable) + '$'))).to_be_visible()
                        else:
                            await expect(page.get_by_role('status').filter(has_text=re.compile('^' + re.escape(empty_count) + '$'))).to_be_visible()
                            await expect(page.get_by_role('alert')).to_have_count(0)
                        await capture(view + '-' + state)
                        if state == 'error':
                            await load_error.get_by_role('button', name=('Повторить' if is_ru else 'Retry' if lang != 'th' else 'ลองอีกครั้ง'), exact=True).click()
                            await expect(load_error).to_have_count(0)
                            await expect(page.get_by_role('alert')).to_have_count(0)
                            assert await page.evaluate('window.fixtureRetries') == 1
                        await no_writes()
                assert not blocked, blocked
                assert not errors, errors
                results.append({'language': lang, 'width': width, 'properties': 'pass', 'projects': 'pass', 'urlComposition': 'pass', 'editorBoundaries': 'pass', 'readStates': 'pass', 'filterContrast': {'properties': properties_contrast, 'projects': projects_contrast}, 'horizontalOverflow': 'none', 'externalRequests': 0, 'businessWrites': 0, 'runtimeErrors': 0})
                results[-1]['dialogReadiness'] = {'property': ready, 'project': project_ready}
                (OUTPUT / 'results.json').write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
                await context.close()
        await browser.close()
    (OUTPUT / 'results.json').write_text(json.dumps(results, ensure_ascii=False, indent=2))
    print(json.dumps(results, ensure_ascii=False, indent=2))
asyncio.run(main())
