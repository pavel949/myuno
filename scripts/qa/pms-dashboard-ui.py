"""Synthetic real-component PMS chrome/navigation QA. Every non-local request is denied."""
import asyncio, json, re, sys
from pathlib import Path
from playwright.async_api import async_playwright, expect
OUTPUT = Path(sys.argv[1])
async def main():
    results = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        for lang in ['ru', 'en']:
            for width in [375, 390, 430, 1280]:
                context = await browser.new_context(viewport={'width':width, 'height':1200}, has_touch=width<640, service_workers='block')
                blocked, errors = [], []
                async def route(r):
                    url = r.request.url
                    file = 'fixture.html' if '/fixture?' in url else url.rsplit('/',1)[-1]
                    types = {'fixture.html':'text/html','fixture.js':'text/javascript','fixture.css':'text/css'}
                    if url.startswith('http://localhost:8080/') and file in types:
                        await r.fulfill(path=str(OUTPUT/file), content_type=types[file])
                    else:
                        blocked.append(url)
                        await r.abort()
                await context.route('**/*', route)
                page = await context.new_page()
                page.on('pageerror', lambda e: errors.append(str(e)))
                async def bounds():
                    data = await page.evaluate('''()=>({width:document.documentElement.scrollWidth,controls:[...document.querySelectorAll('header a,header button,main a,main button,main select')].filter(e=>e.getClientRects().length).map(e=>{const r=e.getBoundingClientRect();return {label:e.textContent,left:r.left,right:r.right,height:r.height,width:r.width}})})''')
                    assert data['width'] <= width, data
                    assert all(c['left'] >= -1 and c['right'] <= width+1 for c in data['controls']), data
                    if width < 640:
                        assert all(c['height'] >= 44 and c['width'] >= 44 for c in data['controls']), data
                async def load(state='empty'):
                    await page.goto(f'http://localhost:8080/fixture?lang={lang}&state={state}', wait_until='networkidle')
                await load()
                await bounds()
                nav = page.get_by_role('navigation', name='Рабочие разделы' if lang=='ru' else 'Workspace shortcuts')
                await expect(nav.get_by_role('link')).to_have_count(3)
                labels = await nav.get_by_role('link').evaluate_all("""links => links.map(link => {
                    const label = link.querySelector('span');
                    const range = document.createRange();
                    range.selectNodeContents(label);
                    const lines = [...range.getClientRects()];
                    const bounds = link.getBoundingClientRect();
                    return {text:label.textContent,lines:lines.length,contained:lines.every(line => line.left>=bounds.left && line.right<=bounds.right)};
                })""")
                assert all(label['lines'] == 1 and label['contained'] for label in labels), labels
                primary_contrast = await nav.get_by_role('link').first.evaluate(r"""link => {
                    const rgb = color => color.match(/[\d.]+/g).slice(0,3).map(Number);
                    const luminance = color => rgb(color).map(channel => {
                        const value=channel/255;
                        return value<=0.04045 ? value/12.92 : ((value+0.055)/1.055)**2.4;
                    }).reduce((sum,value,index)=>sum+value*[0.2126,0.7152,0.0722][index],0);
                    const background=getComputedStyle(link).backgroundColor;
                    const contrast=element=>{
                        const foreground=getComputedStyle(element).color;
                        const a=luminance(foreground),b=luminance(background);
                        return {foreground,background,ratio:(Math.max(a,b)+0.05)/(Math.min(a,b)+0.05)};
                    };
                    return {label:contrast(link.querySelector('span')),icon:contrast(link.querySelector('svg'))};
                }""")
                assert primary_contrast['label']['ratio'] >= 4.5, primary_contrast
                assert primary_contrast['icon']['ratio'] >= 3, primary_contrast
                await page.screenshot(path=str(OUTPUT/f'{lang}-{width}-empty.png'), full_page=True)
                for label, path in [('Объекты' if lang=='ru' else 'Properties','/mc/properties'),('Календарь' if lang=='ru' else 'Calendar','/mc/calendar'),('Задачи' if lang=='ru' else 'Tasks','/mc/tasks')]:
                    link = nav.get_by_role('link', name=label, exact=True)
                    await link.focus()
                    assert await link.evaluate('(e)=>e===document.activeElement && getComputedStyle(e).boxShadow!=="none"')
                    await link.press('Enter')
                    await expect(page.get_by_test_id('route-boundary')).to_have_text(path)
                await load()
                await page.get_by_role('combobox', name='Дополнительные блоки' if lang=='ru' else 'More dashboard sections').select_option('property_manager')
                await expect(page.get_by_test_id('view-boundary')).to_have_text('property_manager')
                await expect(page.get_by_test_id('route-boundary')).to_have_text('/mc')
                await page.get_by_role('button', name='Меню аккаунта' if lang=='ru' else 'Account menu', exact=True).click()
                await expect(page.get_by_role('menu')).to_be_visible()
                await page.keyboard.press('Escape')
                if width < 640:
                    preferences = 'Язык, валюта и тема' if lang=='ru' else 'Language, currency and theme'
                    await page.get_by_role('button', name=preferences, exact=True).click()
                    panel = page.get_by_role('dialog', name=preferences)
                    await expect(panel).to_be_visible()
                    box = await panel.bounding_box()
                    assert box['x'] >= 0 and box['x'] + box['width'] <= width, box
                    await panel.get_by_role('button', name='Тема: Светлая' if lang=='ru' else 'Theme: Light').click()
                    await page.get_by_role('menuitem', name='Тёмная' if lang=='ru' else 'Dark', exact=True).click()
                    assert await page.evaluate('window.fixtureTheme') == 'dark'
                    await panel.get_by_test_id('language-switch').click()
                    await page.get_by_role('menuitem', name=re.compile('EN.*English')).click()
                    assert await page.evaluate('window.fixtureLanguage') == 'en'
                    await expect(page.locator('[role="menu"]')).to_have_count(0)
                    await page.screenshot(path=str(OUTPUT/f'{lang}-{width}-preferences.png'))
                    await page.keyboard.press('Escape')
                    await page.get_by_role('button', name='Поиск' if lang=='ru' else 'Search', exact=True).click()
                    await expect(page.get_by_role('dialog', name='Synthetic search boundary')).to_be_visible()
                    await page.get_by_role('button', name='Close search').click()
                    await page.get_by_role('button', name='Toggle Sidebar').click()
                    await expect(page.get_by_role('dialog')).to_be_visible()
                    await page.screenshot(path=str(OUTPUT/f'{lang}-{width}-sidebar.png'))
                    await page.keyboard.press('Escape')
                for state in ['loading', 'error', 'populated']:
                    await load(state)
                    await bounds()
                    if state == 'loading':
                        await expect(page.get_by_role('status')).to_have_count(4)
                    elif state == 'error':
                        await expect(page.get_by_role('alert')).to_have_count(4)
                        await page.get_by_role('button', name='Повторить' if lang=='ru' else 'Retry', exact=True).first.click()
                        assert await page.evaluate('window.fixtureRetries') == 1
                        assert await page.get_by_text('В ближайшие 7 дней нет просроченных или предстоящих платежей.' if lang=='ru' else 'No overdue or upcoming payments are expected in the next 7 days.').count() == 0
                    else:
                        await expect(page.get_by_role('button', name='Synthetic client follow-up', exact=False)).to_be_visible()
                    await page.screenshot(path=str(OUTPUT/f'{lang}-{width}-{state}.png'), full_page=True)
                assert not blocked, blocked
                assert not errors, errors
                results.append({'language':lang,'width':width,'states':4,'routeBoundaries':'pass','singleLineLabels':'pass','primaryContrast':primary_contrast,'viewPreference':'pass','headerMenus':'pass','overflow':'none','externalRequests':0,'runtimeErrors':0})
                await context.close()
        await browser.close()
    (OUTPUT/'results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
    print(json.dumps(results,ensure_ascii=False,indent=2))
asyncio.run(main())
