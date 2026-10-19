"""Browser gate for actual compact Home UI with synthetic hooks and local CSS.

Requires explicit --run-browser in an authorized browser environment. This script
does not start a server. Every allowed document/asset is fulfilled from OUTPUT;
all other requests and all mutation/network APIs are rejected. It exercises
presentation/navigation, not live permissions, saved preferences or real data.

Default smoke: 36 matrix cases across every surface/language/viewport, eight
preference exercises, 12 targeted access-boundary cases and two full interaction/
security groups. --exhaustive retains the 432-case matrix, 108 preference
exercises, 108 targeted access-boundary cases and 18 interaction groups.
--list-cases validates/prints this plan without importing Playwright or launching
a browser. Smoke has a fail-closed 150-second total browser budget; performance
is not considered verified until a real authorized run completes.
"""
import argparse
import asyncio
import json
import re
import sys
from pathlib import Path
from time import monotonic
from urllib.parse import urlencode, urlparse

PARSER = argparse.ArgumentParser(description=__doc__)
PARSER.add_argument('output', nargs='?', type=Path, default=Path('/tmp/browser/compact-personal-home-isolated'))
PARSER.add_argument('--run-browser', action='store_true')
PARSER.add_argument('--list-cases', action='store_true')
PARSER.add_argument('--exhaustive', action='store_true')
PARSER.add_argument('--timeout-seconds', type=int)
ARGS = PARSER.parse_args()
OUTPUT = ARGS.output
RUN_RESULTS = []
ORIGIN = 'http://compact-home.test'
WIDTHS = [375, 430, 1280]
ROLES = ['guest', 'resident', 'admin', 'owner', 'vendor', 'employee']
STATES = ['loading', 'empty', 'partial-error', 'live']
SMOKE_STATES = ['loading', 'empty', 'error', 'partial-error', 'live']
WORK = {'admin': '/mc', 'owner': '/my-property', 'vendor': '/vendor', 'employee': '/team', 'staff': '/staff', 'property_manager': '/mc', 'investor': '/invest/dashboard'}
COPY = {
    'en': {
        'open': 'Customize home', 'done': 'Done', 'retry': 'Retry', 'close': 'Close',
        'empty': 'No updates for selected topics yet.', 'loading': 'Loading updates for selected topics…',
        'error': 'Some updates for selected topics could not be loaded.', 'scope': 'For selected topics',
        'current': 'Current updates', 'workspace': 'Personal and work', 'personal': 'Personal', 'work': 'Work',
        'shortcuts': 'Personal shortcuts', 'search': 'Find a home, service or document',
        'homes': 'Homes', 'services': 'Services', 'bookings': 'Bookings & requests', 'help': 'Help',
        'notifications': 'Notifications', 'unread': 'Notifications — unread items', 'profile': 'Profile',
        'business': 'Open business workspace', 'unavailable': 'The business summary is not available here yet.',
        'account': 'Open My account', 'lifestyle': 'Lifestyle interests', 'add_owner': 'Add: Property owner',
        'order_live': 'Review pending orders: 2', 'order_loading': 'Checking pending orders…',
        'order_error': 'Pending orders could not be checked.', 'order_retry': 'Retry order check',
    },
    'ru': {
        'open': 'Настроить главную', 'done': 'Готово', 'retry': 'Повторить', 'close': 'Закрыть',
        'empty': 'По выбранным темам пока нет обновлений.', 'loading': 'Загружаем обновления по выбранным темам…',
        'error': 'Часть обновлений по выбранным темам не удалось загрузить.', 'scope': 'По выбранным темам',
        'current': 'Актуальное', 'workspace': 'Личное и работа', 'personal': 'Личное', 'work': 'Работа',
        'shortcuts': 'Личные разделы', 'search': 'Найти жильё, услугу, документ',
        'homes': 'Жильё', 'services': 'Услуги', 'bookings': 'Брони и заявки', 'help': 'Помощь',
        'notifications': 'Уведомления', 'unread': 'Уведомления — есть непрочитанные', 'profile': 'Профиль',
        'business': 'Открыть рабочий кабинет', 'unavailable': 'Сводка бизнеса здесь пока недоступна.',
        'account': 'Открыть «Моё»', 'lifestyle': 'Интересы и образ жизни', 'add_owner': 'Добавить: Собственник',
        'order_live': 'Проверить ожидающие заказы: 2', 'order_loading': 'Проверяем ожидающие заказы…',
        'order_error': 'Не удалось проверить ожидающие заказы.', 'order_retry': 'Повторить проверку',
    },
    'th': {
        'open': 'ปรับแต่งหน้าหลัก', 'done': 'เสร็จสิ้น', 'retry': 'ลองอีกครั้ง', 'close': 'ปิด',
        'empty': 'ยังไม่มีอัปเดตสำหรับหัวข้อที่เลือก', 'loading': 'กำลังโหลดอัปเดตสำหรับหัวข้อที่เลือก…',
        'error': 'ไม่สามารถโหลดอัปเดตบางรายการสำหรับหัวข้อที่เลือกได้', 'scope': 'สำหรับหัวข้อที่เลือก',
        'current': 'อัปเดตล่าสุด', 'workspace': 'ส่วนตัวและงาน', 'personal': 'ส่วนตัว', 'work': 'งาน',
        'shortcuts': 'ทางลัดส่วนตัว', 'search': 'ค้นหาที่พัก บริการ หรือเอกสาร',
        'homes': 'ที่พัก', 'services': 'บริการ', 'bookings': 'การจองและคำขอ', 'help': 'ความช่วยเหลือ',
        'notifications': 'การแจ้งเตือน', 'unread': 'การแจ้งเตือน มีรายการที่ยังไม่ได้อ่าน', 'profile': 'โปรไฟล์',
        'business': 'เปิดพื้นที่ทำงานธุรกิจ', 'unavailable': 'ยังไม่สามารถแสดงสรุปธุรกิจในหน้านี้ได้',
        'account': 'เปิดบัญชีของฉัน', 'lifestyle': 'ความสนใจและไลฟ์สไตล์', 'add_owner': 'เพิ่ม: เจ้าของอสังหาริมทรัพย์',
        'order_live': 'ตรวจสอบรายการที่รอดำเนินการ: 2', 'order_loading': 'กำลังตรวจสอบรายการที่รอดำเนินการ…',
        'order_error': 'ไม่สามารถตรวจสอบรายการที่รอดำเนินการได้', 'order_retry': 'ตรวจสอบอีกครั้ง',
    },
}


def context_plan(surface, lang, width):
    """Distribute all roles over each language and width; do not imply full Cartesian coverage."""
    core = ARGS.exhaustive or (lang == 'en' and width == 375)
    if ARGS.exhaustive:
        matrix = [(role, state) for role in ROLES for state in STATES]
        preferences = ROLES
    else:
        language_index = list(COPY).index(lang)
        width_index = WIDTHS.index(width)
        offset = (2 * width_index + 2 * language_index) % len(ROLES)
        matrix = []
        for index in range(2):
            role = ROLES[(offset + index) % len(ROLES)]
            state = {'guest': 'empty', 'resident': 'loading', 'admin': 'live', 'owner': 'error', 'vendor': 'partial-error', 'employee': 'empty'}[role]
            matrix.append((role, state))
        preferences = ['guest', 'resident'] if core else ['resident'] if width == 375 else []
    base = {'surface': surface, 'language': lang, 'width': width}
    return {
        'matrix': [{**base, 'kind': 'matrix', 'id': f'matrix/{surface}/{lang}/{width}/{role}/{state}', 'role': role, 'state': state, 'expectedState': 'empty' if role == 'guest' else state} for role, state in matrix],
        'preferences': [{**base, 'kind': 'preferences', 'id': f'preferences/{surface}/{lang}/{width}/{role}', 'role': role} for role in preferences],
        'interaction': [{**base, 'kind': 'interaction', 'id': f'interaction/{surface}/{lang}/{width}'}] if core else [],
        'boundaries': [{**base, 'kind': 'access-boundary', 'id': f'access-boundary/{surface}/{lang}/{width}/{name}', 'name': name, 'role': role, 'extra': extra, 'destination': destination} for name, role, extra, destination in [
            ('staff', 'staff', {}, '/staff'), ('property-manager', 'property_manager', {}, '/mc'),
            ('investor', 'investor', {}, '/invest/dashboard'), ('self-managed-owner', 'owner', {'owner-portal': '0'}, '/mc'),
            ('context-loading', 'admin', {'context-loading': '1'}, None),
            ('owner-type-loading', 'admin', {'owner-loading': '1'}, None),
        ]] if core else [],
    }


def case_manifest():
    contexts = [context_plan(surface, lang, width) for surface in ['legacy', 'v2'] for lang in COPY for width in WIDTHS]
    matrix = [case for context in contexts for case in context['matrix']]
    preferences = [case for context in contexts for case in context['preferences']]
    interactions = [case for context in contexts for case in context['interaction']]
    boundaries = [case for context in contexts for case in context['boundaries']]
    cases = matrix + preferences + interactions + boundaries
    assert len({case['id'] for case in cases}) == len(cases)
    assert len(matrix) == (432 if ARGS.exhaustive else 36)
    assert len(preferences) == (108 if ARGS.exhaustive else 8)
    assert len(interactions) == (18 if ARGS.exhaustive else 2)
    assert len(boundaries) == (108 if ARGS.exhaustive else 12)
    assert len({(case['surface'], case['language'], case['width']) for case in matrix}) == 18
    for surface in ['legacy', 'v2']:
        group = [case for case in matrix if case['surface'] == surface]
        assert {case['expectedState'] for case in group} == set(STATES if ARGS.exhaustive else SMOKE_STATES)
        for lang in COPY:
            assert {case['role'] for case in group if case['language'] == lang} == set(ROLES)
            assert {case['expectedState'] for case in group if case['language'] == lang} == set(STATES if ARGS.exhaustive else SMOKE_STATES)
        for width in WIDTHS:
            assert {case['role'] for case in group if case['width'] == width} == set(ROLES)
            assert {case['expectedState'] for case in group if case['width'] == width} == set(STATES if ARGS.exhaustive else SMOKE_STATES)
    return {
        'status': 'planned-not-run', 'mode': 'exhaustive' if ARGS.exhaustive else 'smoke',
        'counts': {'matrixCases': len(matrix), 'preferenceCases': len(preferences), 'interactionGroups': len(interactions), 'accessBoundaryCases': len(boundaries), 'totalPlannedGroups': len(cases)},
        'coverage': {'surfaces': ['legacy', 'v2'], 'languages': list(COPY), 'widths': WIDTHS, 'matrixRoles': ROLES, 'sourceStates': SMOKE_STATES, 'matrixSourceStates': STATES if ARGS.exhaustive else SMOKE_STATES, 'surfaceLanguageViewportCombinations': 18, 'rolesInEveryLanguageAndWidthPerSurface': True, 'additionalAccessBoundaries': ['staff', 'property_manager', 'investor', 'self-managed-owner', 'context-loading', 'owner-type-loading']},
        'interactionCoverage': ['search-and-actions-routing', 'workspace-allowlist-and-persistence', 'stale-revoked-malicious-destinations', 'same-mount-actor-isolation', 'employment-is-not-management', 'owner-portal-and-management-variants', 'staff-and-loading-access-boundaries', 'notification-states-and-no-mutation', 'pending-order-loading-error-null-count-live-and-actor-switch', 'preferences-loading-error', 'unavailable-source-no-topics-long-name'],
        'preferenceCoverage': ['reorder-add-remove', 'interest-does-not-grant-access', 'close-reopen-and-Escape', 'localized375px-sheet', 'fixed-footer', '44px-targets'],
        'matrixChecks': ['actual-page-composition', 'truthful-source-state', 'role-navigation', 'compact-height', '44px-targets', 'visible-keyboard-focus', 'no-overflow', 'zero-external-requests-and-mutations'],
        'defaultBrowserBudgetSeconds': 1200 if ARGS.exhaustive else 150,
        'runtimeStatus': 'unverified until an authorized browser run finishes', 'cases': cases,
    }


MANIFEST = case_manifest()

INIT = """(() => {
    const params = new URLSearchParams(location.search);
    if (location.pathname === '/fixture') {
        if (params.get('reset') !== '0') localStorage.clear();
        for (const [key,value] of Object.entries(JSON.parse(params.get('seed') || '{}'))) localStorage.setItem(key,value);
    }
    window.fixtureNetworkAttempts = [];
    const reject = (kind) => (...args) => {
        window.fixtureNetworkAttempts.push({kind, target: String(args[0] || '')});
        throw Error('Fixture network API forbidden: ' + kind);
    };
    window.fetch = reject('fetch');
    window.XMLHttpRequest = reject('XMLHttpRequest');
    window.WebSocket = reject('WebSocket');
    window.EventSource = reject('EventSource');
    navigator.sendBeacon = reject('sendBeacon');
})();"""


async def main():
    if not ARGS.run_browser:
        raise SystemExit('Browser gate not executed. Pass --run-browser only in an authorized environment.')
    from playwright.async_api import async_playwright, expect, TimeoutError as PlaywrightTimeoutError

    results = RUN_RESULTS
    started = monotonic()
    build_report = json.loads((OUTPUT / 'build-report.json').read_text())
    assert build_report['productionDataModules'] == 0
    (OUTPUT / 'results.json').unlink(missing_ok=True)
    build_report['browserValidation'] = 'running'
    (OUTPUT / 'build-report.json').write_text(json.dumps(build_report, indent=2))
    expect.set_options(timeout=4000)
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        for surface in ['legacy', 'v2']:
            for lang, copy in COPY.items():
                for width in WIDTHS:
                    plan = context_plan(surface, lang, width)
                    context = await browser.new_context(
                        viewport={'width': width, 'height': 850}, has_touch=width < 768,
                        timezone_id='Asia/Bangkok', service_workers='block', reduced_motion='reduce',
                    )
                    context.set_default_timeout(4000)
                    context.set_default_navigation_timeout(6000)
                    blocked, errors = [], []

                    async def route(request_route):
                        request = request_route.request
                        parsed = urlparse(request.url)
                        name = 'fixture.html' if parsed.path == '/fixture' else parsed.path.lstrip('/')
                        assets = {'fixture.html': 'text/html', 'fixture.js': 'text/javascript', 'fixture.css': 'text/css'}
                        if parsed.netloc == 'compact-home.test' and request.method == 'GET' and name in assets:
                            await request_route.fulfill(path=str(OUTPUT / name), content_type=assets[name])
                        else:
                            blocked.append({'method': request.method, 'url': request.url})
                            await request_route.abort()

                    await context.route('**/*', route)
                    await context.add_init_script(INIT)
                    page = await context.new_page()
                    page.on('pageerror', lambda error: errors.append(str(error)))
                    case = {}

                    async def navigate(role='resident', state='empty', **extra):
                        nonlocal case
                        if page.url.startswith(ORIGIN):
                            # Preserve evidence from a previous document before its
                            # in-page telemetry is replaced by the next fixture.
                            await assert_safe()
                        params = {'surface': surface, 'lang': lang, 'role': role, 'state': state, **extra}
                        case = params
                        await page.goto(f'{ORIGIN}/fixture?{urlencode(params)}', wait_until='domcontentloaded')
                        await expect(page.get_by_role('heading', level=1)).to_be_visible()
                        await page.wait_for_function('''() => {
                            if (!window.fixture || !window.fixtureQueryClient || !document.styleSheets.length) return false;
                            const f=window.fixture.getState();
                            if (!f.user) return true;
                            const query=window.fixtureQueryClient.getQueryState(['home-pending-orders',f.user.id]);
                            return f.orders==='loading' ? query?.fetchStatus==='fetching' : ['success','error'].includes(query?.status);
                        }''')

                    def workspace():
                        return page.get_by_role('navigation', name=copy['workspace'], exact=True)

                    def work_link():
                        return workspace().get_by_role('link', name=re.compile('^' + re.escape(copy['work']) + ':'))

                    async def assert_safe():
                        assert not blocked, blocked
                        assert not errors, errors
                        safety = await page.evaluate('({network:window.fixtureNetworkAttempts,telemetry:window.fixture.telemetry})')
                        assert not safety['network'], safety
                        assert not safety['telemetry']['forbiddenCalls'], safety
                        assert safety['telemetry']['notificationMutations'] == 0, safety

                    async def bounds(dialog=None):
                        # Wait for the actual Radix sheet animation instead of guessing a delay.
                        deadline, previous, stable = monotonic() + 5, None, 0
                        while True:
                            geometry = await page.evaluate('''() => {
                                const roots = [...document.querySelectorAll('main, [role="dialog"]')];
                                const offenders = roots.flatMap(root => [...root.querySelectorAll('h1,h2,p,a,button,summary')]).filter(el => {
                                    const b=el.getBoundingClientRect();
                                    return b.width && b.height && getComputedStyle(el).visibility !== 'hidden' &&
                                        (b.left < -1 || b.right > innerWidth+1 || el.scrollWidth > el.clientWidth+1);
                                }).map(el => ({tag:el.tagName,text:el.textContent.slice(0,90),width:el.clientWidth,scrollWidth:el.scrollWidth}));
                                return {width:document.documentElement.scrollWidth,viewport:innerWidth,offenders};
                            }''')
                            box = await dialog.bounding_box() if dialog else None
                            valid = geometry['width'] <= width and not geometry['offenders']
                            if dialog:
                                valid = valid and bool(box) and box['x'] >= -1 and box['x'] + box['width'] <= width + 1 and abs(box['y'] + box['height'] - 850) <= 1
                            snapshot = (geometry, box)
                            stable = stable + 1 if valid and snapshot == previous else (1 if valid else 0)
                            if stable >= 3:
                                return
                            if monotonic() >= deadline:
                                raise AssertionError({'case': case, 'geometry': geometry, 'dialog': box})
                            previous = snapshot
                            await asyncio.sleep(0.05)

                    async def tap_targets(root=None):
                        root = root or page.get_by_test_id('fixture-home')
                        # One browser round-trip instead of two per control.
                        failures = await root.locator('a[href],button,summary').evaluate_all('''controls => controls.flatMap(el => {
                            const box=el.getBoundingClientRect();
                            if (!box.width || !box.height || getComputedStyle(el).visibility==='hidden') return [];
                            return box.width>=43.9 && box.height>=43.9 ? [] : [{label:el.textContent,width:box.width,height:box.height}];
                        })''')
                        assert not failures, {'case': case, 'controls': failures}

                    async def visible_keyboard_focus(control):
                        await control.focus()
                        await page.keyboard.press('Tab')
                        await page.keyboard.press('Shift+Tab')
                        await expect(control).to_be_focused()
                        style_reader = r'''el => {
                            const s=getComputedStyle(el);
                            const ring=s.boxShadow.split(/,(?![^(]*\))/).some(shadow =>
                                !/rgba\([^)]*,\s*0\)/.test(shadow) && /(?:[1-9]\d*|0\.[1-9]\d*)px/.test(shadow));
                            return {visible:el.matches(':focus-visible'), outline:s.outlineStyle,width:parseFloat(s.outlineWidth),color:s.outlineColor,shadow:s.boxShadow,ring};
                        }'''
                        indicator_ready = r'''style => {
                            const outline=!['none','hidden'].includes(style.outline) && style.width>=1 &&
                                !['transparent','rgba(0, 0, 0, 0)'].includes(style.color);
                            return style.visible && (outline || style.ring);
                        }'''
                        # Global button transitions can expose a zero-width/transparent
                        # first frame even with reduced motion. Wait for the SAME
                        # visible-indicator predicate, never an arbitrary delay.
                        handle = await control.element_handle()
                        assert handle is not None, 'Focus target detached before indicator readiness'
                        try:
                            await page.wait_for_function(
                                f'el => document.activeElement===el && ({indicator_ready})(({style_reader})(el))',
                                arg=handle, polling='raf', timeout=1000,
                            )
                        except PlaywrightTimeoutError as error:
                            style = await control.evaluate(style_reader)
                            raise AssertionError({'message': 'Visible keyboard focus indicator was not ready within 1000ms', 'case': case, 'style': style}) from error
                        finally:
                            await handle.dispose()
                        await expect(control).to_be_focused()
                        style = await control.evaluate(style_reader)
                        outline = style['outline'] not in ['none', 'hidden'] and style['width'] >= 1 and style['color'] not in ['transparent', 'rgba(0, 0, 0, 0)']
                        assert style['visible'] and (outline or style['ring']), style

                    async def ready_dialog():
                        dialog = page.get_by_role('dialog', name=copy['open'], exact=True)
                        await expect(dialog).to_be_visible()
                        await expect(dialog).to_have_attribute('data-state', 'open')
                        await bounds(dialog)
                        await page.wait_for_function('''() => {
                            const el=document.querySelector('[role="dialog"][data-state="open"]');
                            return el && el.contains(document.activeElement) && getComputedStyle(el).pointerEvents !== 'none';
                        }''')
                        return dialog

                    async def assert_workspace(role):
                        if role in WORK:
                            await expect(workspace()).to_be_visible()
                            await expect(work_link()).to_have_attribute('href', WORK[role])
                            personal = workspace().get_by_role('link', name=copy['personal'], exact=True)
                            await expect(personal).to_have_attribute('href', '/')
                            await expect(personal).to_have_attribute('aria-current', 'page')
                        else:
                            await expect(workspace()).to_have_count(0)

                    async def preferences(role):
                        await navigate(role)
                        trigger = page.get_by_role('button', name=copy['open'], exact=True)
                        await visible_keyboard_focus(trigger)
                        await trigger.press('Enter')
                        dialog = await ready_dialog()
                        await tap_targets(dialog)
                        rows = dialog.locator('ol > li')
                        await expect(rows).to_have_count(3)
                        await rows.nth(2).get_by_role('button').nth(0).press('Enter')
                        await expect(page.get_by_test_id('selection')).to_have_text('["pet_owner","couple","family"]')
                        await dialog.get_by_role('region', name=copy['lifestyle'], exact=True).get_by_role('button').first.click()
                        await expect(rows).to_have_count(4)
                        await rows.nth(3).get_by_role('button').nth(2).click()
                        await expect(rows).to_have_count(3)
                        # A chosen interest cannot manufacture an owner workspace.
                        await dialog.get_by_role('button', name=copy['add_owner'], exact=True).click()
                        await expect(rows).to_have_count(4)
                        await dialog.locator('.overflow-y-auto').evaluate('(el)=>{el.scrollTop=el.scrollHeight}')
                        done = dialog.get_by_role('button', name=copy['done'], exact=True)
                        box = await done.bounding_box()
                        assert box and box['y'] >= 0 and box['y'] + box['height'] <= 850
                        await bounds(dialog)
                        if role == 'resident':
                            await page.screenshot(path=str(OUTPUT / f'{surface}-{lang}-{width}-preferences.png'))
                        await done.click()
                        await expect(dialog).to_have_count(0)
                        await assert_workspace(role)
                        await trigger.click()
                        dialog = await ready_dialog()
                        await expect(page.get_by_test_id('selection')).to_have_text('["pet_owner","couple","family","property_owner"]')
                        await page.keyboard.press('Escape')
                        await expect(dialog).to_have_count(0)
                        await trigger.click()
                        dialog = await ready_dialog()
                        await dialog.get_by_role('button', name=copy['close'], exact=True).click()
                        await expect(dialog).to_have_count(0)
                        await assert_safe()

                    try:
                        for test_case in plan['matrix']:
                            role, state = test_case['role'], test_case['state']
                            await navigate(role, state)
                            await expect(page.get_by_role('dialog')).to_have_count(0)
                            await assert_workspace(role)
                            await expect(page.get_by_test_id('location')).to_have_text('/')
                            shortcuts = page.get_by_role('navigation', name=copy['shortcuts'], exact=True)
                            await expect(shortcuts.get_by_role('link')).to_have_count(4)
                            await expect(page.get_by_text(copy['scope'], exact=True)).to_be_visible()
                            expected = 'empty' if role == 'guest' else state
                            for key in ['loading', 'empty', 'error']:
                                present = expected == key or (key == 'error' and expected == 'partial-error')
                                await expect(page.get_by_text(copy[key], exact=True)).to_have_count(1 if present else 0)
                            await expect(page.get_by_text('13:20', exact=True)).to_have_count(1 if expected in ['live', 'partial-error'] else 0)
                            if expected == 'partial-error':
                                await page.get_by_role('button', name=copy['retry'], exact=True).click()
                                assert await page.evaluate('window.fixture.telemetry.retries') == 1
                            body = await page.locator('body').inner_text()
                            assert not any(value in body for value in ['Fri 15:00', 'Term 2', 'Tonight', 'Демо', 'All clear', 'Всё в порядке']), body
                            # Stable actions precede topic updates/preferences and lower recommendations.
                            positions = await page.evaluate('''() => {
                                const search=document.querySelector('a[href="/search"]');
                                const actions=search.nextElementSibling;
                                const updates=document.querySelector('main section[aria-label]');
                                const customize=document.querySelector('button[aria-haspopup="dialog"]');
                                const lower=document.querySelector('[data-testid="synthetic-PersonalGrid"]');
                                const before=(a,b)=>!!(a.compareDocumentPosition(b)&Node.DOCUMENT_POSITION_FOLLOWING);
                                return {header:document.querySelector('header').getBoundingClientRect().height,actionsBottom:actions.getBoundingClientRect().bottom,order:before(search,actions)&&before(actions,updates)&&before(updates,customize)&&before(customize,lower)};
                            }''')
                            assert positions['header'] <= 140 and positions['actionsBottom'] <= 470 and positions['order'], positions
                            await bounds()
                            await tap_targets()
                            await visible_keyboard_focus(page.get_by_role('link', name=copy['search'], exact=True))
                            await assert_safe()
                            if (ARGS.exhaustive and role in ['resident', 'admin'] and state in ['empty', 'partial-error']) or (not ARGS.exhaustive and test_case['id'] == plan['matrix'][0]['id']):
                                await page.screenshot(path=str(OUTPUT / f'{surface}-{lang}-{width}-{role}-{state}.png'))
                            results.append({**test_case, 'result': 'pass'})

                        for pref_case in plan['preferences']:
                            await preferences(pref_case['role'])
                            results.append({**pref_case, 'result': 'pass'})
                        if not plan['interaction']:
                            print(f'PASS {surface} {lang} {width}: {len(plan["matrix"])} matrix cases, {len(plan["preferences"])} preference exercises; core checks scheduled separately', flush=True)
                            continue

                        # Actual Link/navigate destinations, using only MemoryRouter.
                        for key, href in [('search', '/search'), ('homes', '/property'), ('services', '/services'), ('bookings', '/me'), ('help', '/support')]:
                            await navigate()
                            link = page.get_by_role('link', name=copy[key], exact=True)
                            await expect(link).to_have_attribute('href', href)
                            await link.click()
                            await expect(page.get_by_test_id('location')).to_have_text(href)
                            await assert_safe()
                        for key, href in [('notifications', '/notifications'), ('profile', '/me/profile')]:
                            await navigate()
                            await page.get_by_role('button', name=copy[key], exact=True).click()
                            await expect(page.get_by_test_id('location')).to_have_text(href)
                            await assert_safe()

                        # Saved workspace links must remain exact members of the current allowlist.
                        storage_key = 'myuno:home-workspace:synthetic-a'
                        await navigate('admin', seed=json.dumps({storage_key: '/admin'}))
                        await expect(work_link()).to_have_attribute('href', '/admin')
                        await expect(page.get_by_test_id('location')).to_have_text('/')
                        await work_link().click()
                        await expect(page.get_by_test_id('location')).to_have_text('/admin')
                        await workspace().locator('summary').click()
                        await workspace().locator('details a[href="/vendor"]').click()
                        await expect(page.get_by_test_id('location')).to_have_text('/vendor')
                        assert await page.evaluate('(key)=>localStorage.getItem(key)', storage_key) == '/vendor'
                        await navigate('admin', reset='0')
                        await expect(work_link()).to_have_attribute('href', '/vendor')
                        for invalid in ['/missing-workspace', '/admin?escalate=1', '/admin#fragment', '/vendor/../../admin', ' /admin', 'https://example.invalid/private', '//example.invalid/private', 'javascript:window.fixtureInjected=true']:
                            await navigate('admin', seed=json.dumps({storage_key: invalid}))
                            await expect(work_link()).to_have_attribute('href', '/mc')
                            await expect(page.get_by_test_id('location')).to_have_text('/')
                            assert await page.evaluate('window.fixtureInjected === undefined')
                            await assert_safe()
                        await navigate('vendor', seed=json.dumps({storage_key: '/admin'}))
                        await expect(work_link()).to_have_attribute('href', '/vendor')
                        await navigate('admin', seed=json.dumps({storage_key: '/admin'}))
                        await page.evaluate('window.fixture.setState({account:"b"})')
                        await expect(page.get_by_test_id('actor')).to_have_text('synthetic-b')
                        await expect(work_link()).to_have_attribute('href', '/mc')
                        await page.evaluate('window.fixture.setState({account:"a"})')
                        await expect(work_link()).to_have_attribute('href', '/admin')
                        await page.evaluate('window.fixture.setState({role:"vendor"})')
                        await expect(work_link()).to_have_attribute('href', '/vendor')
                        await page.evaluate('window.fixture.setState({role:"resident"})')
                        await expect(workspace()).to_have_count(0)
                        await page.evaluate('window.fixture.setState({role:"employee"})')
                        await expect(work_link()).to_have_attribute('href', '/team')
                        await expect(workspace().locator('a[href="/mc"]')).to_have_count(0)
                        for boundary_case in plan['boundaries']:
                            await navigate(boundary_case['role'], **boundary_case['extra'])
                            if boundary_case['destination'] is None:
                                await expect(workspace()).to_have_count(0)
                            else:
                                await expect(work_link()).to_have_attribute('href', boundary_case['destination'])
                            await assert_safe()
                            results.append({**boundary_case, 'result': 'pass'})

                        # Bell has no speculative dot. Opening it must never mark anything read.
                        for notification_state in ['empty', 'loading', 'error', 'unread']:
                            await navigate(notifications=notification_state)
                            bell = page.get_by_role('button', name=copy['unread' if notification_state == 'unread' else 'notifications'], exact=True)
                            await expect(bell.locator('span[aria-hidden="true"]')).to_have_count(1 if notification_state == 'unread' else 0)
                            await bell.click()
                            await expect(page.get_by_test_id('location')).to_have_text('/notifications')
                            await assert_safe()
                        await navigate(notifications='unread')
                        await page.evaluate('window.fixture.setState({account:"b",notifications:"empty"})')
                        await expect(page.get_by_role('button', name=copy['notifications'], exact=True)).to_be_visible()
                        await expect(page.get_by_role('button', name=copy['unread'], exact=True)).to_have_count(0)

                        # Real pending-order UI/query, synthetic result. Unknown/error != zero.
                        for order_state in ['empty', 'loading', 'error', 'unknown', 'live']:
                            await navigate(orders=order_state)
                            key = 'order_error' if order_state in ['error', 'unknown'] else f'order_{order_state}'
                            if order_state != 'empty':
                                await expect(page.get_by_text(copy[key], exact=True)).to_be_visible()
                            else:
                                for absent in ['order_loading', 'order_error', 'order_live']:
                                    await expect(page.get_by_text(copy[absent], exact=True)).to_have_count(0)
                            if order_state in ['error', 'unknown']:
                                await page.get_by_role('button', name=copy['order_retry'], exact=True).click()
                            if order_state == 'live':
                                await expect(page.get_by_role('link', name=copy['order_live'], exact=True)).to_have_attribute('href', '/me')
                                assert not re.search(r'฿|THB|USD|EUR|[$€]|due|к оплате', await page.get_by_role('link', name=copy['order_live'], exact=True).inner_text(), re.I)
                            await bounds()
                            await assert_safe()
                        await navigate(orders='live')
                        await expect(page.get_by_text(copy['order_live'], exact=True)).to_be_visible()
                        await page.evaluate('window.fixture.setState({account:"b",orders:"empty"})')
                        await page.wait_for_function('''() =>
                            window.fixture.getState().user.id==='synthetic-b' &&
                            window.fixtureQueryClient.getQueryState(['home-pending-orders','synthetic-b'])?.status==='success'
                        ''')
                        await expect(page.get_by_text(copy['order_live'], exact=True)).to_have_count(0)
                        await expect(page.get_by_text(copy['order_loading'], exact=True)).to_have_count(0)
                        reads = await page.evaluate('window.fixture.telemetry.orderReads')
                        assert {entry['actor'] for entry in reads} == {'synthetic-a', 'synthetic-b'}, reads

                        for pref_state in ['preferences-loading', 'preferences-error']:
                            await navigate(state=pref_state)
                            await page.get_by_role('button', name=copy['open'], exact=True).click()
                            dialog = await ready_dialog()
                            for button in await dialog.locator('section button').all():
                                await expect(button).to_be_disabled()
                            await expect(dialog.get_by_role('alert' if pref_state.endswith('error') else 'status')).to_be_visible()
                            await expect(dialog.get_by_role('button', name=copy['done'], exact=True)).to_be_enabled()
                            await bounds(dialog)
                        await navigate(state='error')
                        await expect(page.get_by_text(copy['error'], exact=True)).to_be_visible()
                        await expect(page.get_by_text(copy['empty'], exact=True)).to_have_count(0)
                        await navigate(topics='business')
                        await expect(page.get_by_text(copy['unavailable'], exact=True)).to_be_visible()
                        await expect(page.get_by_role('link', name=copy['business'], exact=True)).to_have_attribute('href', '/vendor')
                        await expect(page.get_by_text(copy['empty'], exact=True)).to_have_count(0)
                        await navigate(topics='none')
                        await expect(page.get_by_role('region', name=copy['current'], exact=True)).to_have_count(0)
                        await expect(page.get_by_role('navigation', name=copy['shortcuts'], exact=True)).to_be_visible()
                        await navigate(**{'long-name': '1'})
                        await bounds()
                        await assert_safe()
                        results.append({
                            **plan['interaction'][0], 'result': 'pass',
                            'additionalChecks': MANIFEST['interactionCoverage'],
                            'externalRequests': 0, 'forbiddenMutations': 0, 'runtimeErrors': 0,
                        })
                        print(f'PASS {surface} {lang} {width}: {len(plan["matrix"])} matrix cases, {len(plan["preferences"])} preference exercises, {len(plan["boundaries"])} access boundaries + core interaction/security checks', flush=True)
                    except Exception as error:
                        failure = {'case': case, 'error': str(error), 'blockedRequests': blocked, 'runtimeErrors': errors}
                        prefix = f'{surface}-{lang}-{width}-failure'
                        try:
                            await page.screenshot(path=str(OUTPUT / f'{prefix}.png'), timeout=3000)
                            (OUTPUT / f'{prefix}.html').write_text(await page.content())
                        except Exception as capture_error:
                            failure['captureError'] = str(capture_error)
                        (OUTPUT / f'{prefix}.json').write_text(json.dumps(failure, ensure_ascii=False, indent=2))
                        raise
                    finally:
                        await asyncio.wait_for(context.close(), timeout=3)
        await asyncio.wait_for(browser.close(), timeout=5)
    expected_ids = {case['id'] for case in MANIFEST['cases']}
    actual_ids = [case['id'] for case in results]
    assert len(actual_ids) == len(set(actual_ids)) and set(actual_ids) == expected_ids, {'missing': sorted(expected_ids-set(actual_ids)), 'unexpected': sorted(set(actual_ids)-expected_ids)}
    report = {
        'result': 'pass', 'mode': MANIFEST['mode'], 'elapsedSeconds': round(monotonic()-started, 3),
        'actualExecuted': executed_counts(results), 'planned': MANIFEST['counts'], 'cases': results,
        'limitations': [build_report['fonts'], build_report['surfaceScope'], build_report['dataScope']],
    }
    (OUTPUT / 'results.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))
    build_report['browserValidation'] = 'pass'
    build_report['browserElapsedSeconds'] = report['elapsedSeconds']
    build_report['runtimeStatus'] = f'Authorized {MANIFEST["mode"]} browser run completed; see results.json for measured elapsed time and executed cases.'
    (OUTPUT / 'build-report.json').write_text(json.dumps(build_report, indent=2))
    print(json.dumps({key: value for key, value in report.items() if key != 'cases'}, ensure_ascii=False, indent=2))


def executed_counts(results):
    return {
        'matrixCases': sum(case['kind']=='matrix' for case in results),
        'preferenceCases': sum(case['kind']=='preferences' for case in results),
        'accessBoundaryCases': sum(case['kind']=='access-boundary' for case in results),
        'interactionGroups': sum(case['kind']=='interaction' for case in results),
        'totalCompletedGroups': len(results),
    }


async def bounded_main():
    budget = ARGS.timeout_seconds if ARGS.timeout_seconds is not None else MANIFEST['defaultBrowserBudgetSeconds']
    if budget <= 0 or budget > MANIFEST['defaultBrowserBudgetSeconds']:
        raise SystemExit(f'Browser budget must be 1..{MANIFEST["defaultBrowserBudgetSeconds"]} seconds for this mode.')
    started = monotonic()
    try:
        await asyncio.wait_for(main(), timeout=budget)
    except BaseException as error:
        status = 'timed-out' if isinstance(error, asyncio.TimeoutError) else 'failed'
        if ARGS.run_browser and (OUTPUT / 'build-report.json').exists():
            report = {'result': status, 'mode': MANIFEST['mode'], 'elapsedSeconds': round(monotonic()-started, 3), 'budgetSeconds': budget, 'error': str(error) or type(error).__name__, 'actualCompleted': executed_counts(RUN_RESULTS), 'planned': MANIFEST['counts'], 'cases': RUN_RESULTS}
            (OUTPUT / 'results.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))
            build_report = json.loads((OUTPUT / 'build-report.json').read_text())
            build_report['browserValidation'] = status
            build_report['browserElapsedSeconds'] = report['elapsedSeconds']
            build_report['runtimeStatus'] = 'Browser gate did not finish successfully; only completed groups are reported.'
            (OUTPUT / 'build-report.json').write_text(json.dumps(build_report, indent=2))
        raise


if __name__ == '__main__':
    if ARGS.list_cases:
        if ARGS.run_browser:
            PARSER.error('--list-cases cannot be combined with --run-browser')
        print(json.dumps(MANIFEST, ensure_ascii=False, indent=2))
    else:
        asyncio.run(bounded_main())
