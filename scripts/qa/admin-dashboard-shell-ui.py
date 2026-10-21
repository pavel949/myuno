"""Remote-only actual admin shell supplement; no sidebar/page adapters.

Data/auth contexts are synthetic and all page requests are denied except the
three static fixture assets. This does not certify live data or physical devices.
"""
import asyncio
import json
import os
from pathlib import Path
import sys
from urllib.parse import urlencode, urlparse
from playwright.async_api import async_playwright, expect
from dialog_readiness import wait_for_dialog_ready, dialog_diagnostics

OUTPUT = Path(sys.argv[1])
CASES = [(lang, width, state) for lang in ['ru', 'en', 'th']
         for width in [320, 2560] for state in ['full', 'all-zero', 'total-source-failure']]


async def geometry(page):
    result = await page.evaluate("""()=>{
        const root=document.querySelector('[data-canvas="admin"]')||document.querySelector('[data-testid="dashboard-work-area"]').closest('[data-canvas]');
        const header=root.querySelector('header'),inner=header.firstElementChild,
            area=root.querySelector('[data-testid="dashboard-work-area"]'),frame=area.firstElementChild;
        const box=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return{left:r.left,right:r.right,width:r.width,padding:parseFloat(s.paddingLeft)}};
        const visible=e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden';
        const bad=[...document.querySelectorAll('button,a,input,select,h1,h2,h3')].filter(visible).map(e=>{
            const r=e.getBoundingClientRect();return{text:(e.textContent||e.getAttribute('aria-label')||'').trim().slice(0,110),left:r.left,right:r.right,tag:e.tagName};
        }).filter(r=>r.left < -1 || r.right > innerWidth+1);
        const touchTargets=[...inner.querySelectorAll('button,a')].filter(visible).map(e=>({label:e.getAttribute('aria-label')||e.textContent,...box(e),height:e.getBoundingClientRect().height}));
        return{viewport:innerWidth,documentWidth:document.documentElement.scrollWidth,header:box(header),headerInner:box(inner),area:box(area),frame:box(frame),bad,touchTargets};
    }""")
    assert result['documentWidth'] <= result['viewport'], result
    assert not result['bad'], result
    assert abs(result['headerInner']['width'] - result['area']['width']) <= 1, result
    assert abs(result['headerInner']['left'] + result['headerInner']['padding'] - result['frame']['left'] - result['frame']['padding']) <= 1, result
    assert abs(result['frame']['width'] - result['area']['width']) <= 1, result
    if result['viewport'] < 768:
        assert len(result['touchTargets']) >= 5, result
        assert all(item['width'] >= 44 and item['height'] >= 44 for item in result['touchTargets']), result
    return result


async def tab_to(page, target, *, limit=100):
    for _ in range(limit):
        if await target.evaluate('(element) => element === document.activeElement'):
            return
        await page.keyboard.press('Tab')
    raise AssertionError({'keyboardTargetNotReached': await target.get_attribute('aria-label'),
                          'focused': await page.evaluate('document.activeElement?.outerHTML.slice(0,500)')})


async def keyboard_flow(page, width):
    search = page.get_by_test_id('dashboard-work-area').locator('input').first
    await tab_to(page, search)
    await expect(search).to_be_focused()
    title = await page.locator('[data-queue="pendingProviders"] h3').inner_text()
    await page.keyboard.type(title)
    await expect(page.locator('[data-queue]')).to_have_count(1)
    await page.keyboard.press('Escape')
    await expect(search).to_have_value('')
    await expect(search).to_be_focused()
    await expect(page.locator('[data-queue]')).to_have_count(4)
    # Open the actual global search through its visible header control using
    # keyboard navigation. No element.focus(), forced click or injected geometry.
    opener = page.locator('[data-canvas] > [data-sidebar="inset"] > header button').filter(has=page.locator('svg.lucide-search'))
    if await opener.count() == 0:
        opener = page.locator('header button').filter(has=page.locator('svg.lucide-search'))
    visible = [button for button in await opener.all() if await button.is_visible()]
    assert len(visible) == 1, len(visible)
    opener = visible[0]
    await tab_to(page, opener)
    await page.keyboard.press('Enter')
    dialog = page.get_by_role('dialog', name='Search', exact=True)
    await expect(dialog).to_be_visible()
    await wait_for_dialog_ready(page, dialog, keyboard=True,
        failure_path=OUTPUT / f'keyboard-search-{width}-readiness')
    await expect(dialog.locator('input').first).to_be_focused()
    lang = await page.locator('html').get_attribute('lang')
    await page.screenshot(path=str(OUTPUT / f'{lang}-{width}-global-search-open.png'), full_page=True)
    await page.keyboard.press('Escape')
    await expect(dialog).to_have_count(0)
    await expect(opener).to_be_focused()
    # Sidebar trigger opens a real mobile Sheet; its Escape focus behavior is
    # observed separately from the search dialog and avatar dropdown.
    menu_proof = {'searchFocusReturned': True, 'dashboardSearchKeptFocus': True}
    # The real AdminLayout owns Ctrl/Cmd+K; TopBar must not open global search
    # concurrently. Keep actual keyboard events and the original focused field.
    command_proof = {}
    for shortcut in ['Control+k', 'Meta+k']:
        await tab_to(page, search)
        await page.keyboard.press(shortcut)
        command = page.get_by_role('dialog', name='Command Menu', exact=True)
        modifier = 'ctrl' if shortcut == 'Control+k' else 'meta'
        diagnostic_path = OUTPUT / f'{lang}-{width}-command-{modifier}'
        proof = {'shortcut': shortcut, 'phase': 'opening'}
        try:
            await expect(command).to_be_visible()
            await expect(page.get_by_role('dialog')).to_have_count(1)
            # Visibility and auto-focus can precede passive Radix layer setup.
            # Observe the same actual portal settling contract as search/Sheet.
            proof['ready'] = await wait_for_dialog_ready(page, command, keyboard=True,
                failure_path=diagnostic_path.with_name(diagnostic_path.name + '-readiness'))
            await expect(command.locator('input')).to_be_focused()
            proof['phase'] = 'escape'
            await page.keyboard.press('Escape')
            await expect(page.get_by_role('dialog')).to_have_count(0)
            proof['phase'] = 'focus-return'
            await expect(search).to_be_focused()
            proof.update(dismissed=True, focusReturned=True, phase='complete',
                closed=await dialog_diagnostics(page, command))
            command_proof[modifier] = proof
        except Exception as error:
            proof.update(error=str(error), afterEscape=await dialog_diagnostics(page, command))
            diagnostic_path.with_suffix('.json').write_text(json.dumps(proof, ensure_ascii=False, indent=2), encoding='utf-8')
            await page.screenshot(path=str(diagnostic_path.with_suffix('.png')), full_page=True)
            raise
    menu_proof['singleCommandDialog'] = True
    menu_proof['commandFocusReturned'] = True
    menu_proof['commands'] = command_proof
    if width < 1024:
        preferences = page.locator('header button').filter(has=page.locator('svg.lucide-sliders-horizontal'))
        await tab_to(page, preferences)
        await page.keyboard.press('Enter')
        settings = page.get_by_role('dialog')
        await expect(settings).to_be_visible()
        await expect(settings.get_by_test_id('global-preferences-controls')).to_be_visible()
        await page.keyboard.press('Escape')
        await expect(settings).to_have_count(0)
        await expect(preferences).to_be_focused()
        menu_proof['preferencesFocusReturned'] = True
    avatar = page.locator('header button[aria-haspopup="menu"]').last
    await tab_to(page, avatar)
    await page.keyboard.press('Enter')
    await expect(page.get_by_role('menu')).to_be_visible()
    await page.keyboard.press('Escape')
    await expect(page.get_by_role('menu')).to_have_count(0)
    await expect(avatar).to_be_focused()
    menu_proof['avatarFocusReturned'] = True
    return menu_proof


async def navigation_inventory(page, width):
    inventory = await page.evaluate('window.fixtureNavInventory')
    expected = json.loads((OUTPUT / 'bundle-inputs.json').read_text(encoding='utf-8'))['expectedAdminRoutes']
    assert len(inventory) == 74 and len(set(inventory)) == 74 and sorted(inventory) == sorted(expected), inventory
    trigger = page.locator('header [data-sidebar="trigger"]')
    if width < 768:
        await tab_to(page, trigger)
        await page.keyboard.press('Enter')
        sidebar = page.locator('[data-sidebar="sidebar"][data-mobile="true"]')
        await expect(sidebar).to_be_visible()
        await wait_for_dialog_ready(page, sidebar, keyboard=True,
            failure_path=OUTPUT / f'keyboard-sidebar-{width}-readiness')
    else:
        sidebar = page.locator('[data-sidebar="sidebar"]').first
        await expect(sidebar).to_be_visible()
    for _ in range(12):
        closed = sidebar.locator('[data-sidebar="group-label"][aria-expanded="false"]')
        if not await closed.count():
            break
        await closed.first.click()
    await expect(sidebar.locator('[data-sidebar="group-label"][aria-expanded="false"]')).to_have_count(0)
    await expect(sidebar.locator('[data-sidebar="menu-button"]')).to_have_count(74)
    active = sidebar.locator('[data-sidebar="menu-button"][data-active="true"]')
    await expect(active).to_have_count(1)
    lang = await page.locator('html').get_attribute('lang')
    await page.screenshot(path=str(OUTPUT / f'{lang}-{width}-navigation-open.png'), full_page=True)
    if width < 768:
        await page.keyboard.press('Escape')
        await expect(sidebar).to_have_count(0)
        await expect(trigger).to_be_focused()
    return {'uniqueActualRoutes': len(inventory), 'renderedMenuButtons': 74, 'singleActiveToday': True}


async def main():
    if not os.environ.get('CI') or os.environ.get('GITHUB_ACTIONS') != 'true':
        raise RuntimeError('Browser execution is remote GitHub CI-only')
    rows = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        for lang, width, state in CASES:
            context = await browser.new_context(viewport={'width': width, 'height': 1200}, service_workers='block')
            errors, blocked = [], []
            async def intercept(route):
                parsed = urlparse(route.request.url)
                name = 'fixture.html' if parsed.path == '/fixture' else parsed.path.lstrip('/')
                types = {'fixture.html': 'text/html', 'fixture.js': 'text/javascript', 'fixture.css': 'text/css'}
                if parsed.netloc == 'localhost:8080' and route.request.method == 'GET' and name in types:
                    await route.fulfill(path=str(OUTPUT / name), content_type=types[name])
                else:
                    blocked.append(route.request.url)
                    await route.abort()
            await context.route('**/*', intercept)
            page = await context.new_page()
            page.on('pageerror', lambda error: errors.append(str(error)))
            row = {'language': lang, 'width': width, 'state': state, 'actualShell': True, 'actualAdminLayout': True, 'outcome': 'FAIL'}
            try:
                await page.goto('http://localhost:8080/fixture?' + urlencode({'lang': lang, 'scenario': state}), wait_until='networkidle')
                await page.evaluate('document.fonts.ready')
                await expect(page.locator('[data-queue]')).to_have_count(4)
                await expect(page.locator('[data-queue="pendingOrders"] [data-count-key]')).to_have_attribute('data-count-state', 'empty' if state == 'all-zero' else 'unavailable' if state == 'total-source-failure' else 'ready')
                if state == 'all-zero':
                    await expect(page.locator('[data-decision]')).to_have_count(0)
                    for count in await page.locator('[data-count-key]').all():
                        await expect(count).to_have_attribute('data-count-state', 'empty')
                        await expect(count.locator('span').first).to_have_text('0')
                if state == 'total-source-failure':
                    for count in await page.locator('[data-count-key]').all():
                        await expect(count).to_have_attribute('data-count-state', 'unavailable')
                        assert await count.locator('span').first.inner_text() != '0'
                    assert await page.get_by_role('alert').count() >= 3
                row['geometry'] = await geometry(page)
                if state == 'full':
                    row['keyboard'] = await keyboard_flow(page, width)
                    row['navigation'] = await navigation_inventory(page, width)
                    row['afterInteractionGeometry'] = await geometry(page)
                assert not errors and not blocked, {'runtimeErrors': errors, 'blocked': blocked}
                assert not await page.evaluate('window.fixtureForbidden'), 'Forbidden transport'
                row['outcome'] = 'PASS'
            except Exception as error:
                row.update(error=str(error), runtimeErrors=errors, blocked=blocked,
                    focus=await page.evaluate('document.activeElement?.outerHTML.slice(0,600)'))
                diagnostic = {'language': lang, 'width': width, 'state': state,
                    'error': row['error'], 'focus': row['focus']}
                print('Admin shell fixture failure: ' + json.dumps(diagnostic, ensure_ascii=False)[:6000], flush=True)
            rows.append(row)
            (OUTPUT / 'results.json').write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding='utf-8')
            await page.screenshot(path=str(OUTPUT / f'{lang}-{width}-{state}-{row["outcome"]}.png'), full_page=True)
            await context.close()
        await browser.close()
    assert len(rows) == 18 and all(row['outcome'] == 'PASS' for row in rows), {'completed': len(rows), 'failed': sum(row['outcome'] != 'PASS' for row in rows)}


if __name__ == '__main__':
    asyncio.run(main())
