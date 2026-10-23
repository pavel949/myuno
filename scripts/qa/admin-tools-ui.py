"""Read-only actual-component browser QA; synthetic SDK/query boundaries only."""
import functools
import http.server
import json
import pathlib
import sys
import threading
import shutil
from playwright.sync_api import sync_playwright, expect
from dialog_readiness import DIALOG_SETTLED

output = pathlib.Path(sys.argv[1]).resolve()
class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_): pass
server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Handler, directory=str(output)))
threading.Thread(target=server.serve_forever, daemon=True).start()
base = f'http://127.0.0.1:{server.server_port}'
results, errors, blocked = [], [], []
try:
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=shutil.which('chromium'), headless=True, args=['--no-sandbox'])
        for width in [390, 1440]:
            page = browser.new_page(viewport={'width': width, 'height': 900}, reduced_motion='reduce')
            page.on('pageerror', lambda e: errors.append(str(e)))
            def route(request):
                if request.request.url.startswith(base + '/'):
                    request.continue_()
                else:
                    blocked.append(request.request.url)
                    request.abort()
            page.route('**/*', route)
            for language in ['en', 'ru']:
                page.goto(f'{base}/fixture.html?surface=settings&lang={language}')
                tablist = page.get_by_role('tablist')
                tablist.wait_for()
                tabs = tablist.get_by_role('tab')
                assert tabs.count() == 5
                for tab in tabs.all():
                    box = tab.bounding_box()
                    assert box and box['x'] >= 0 and box['x'] + box['width'] <= width + 1
                    assert tab.inner_text().strip()
                    assert tab.evaluate('(e) => e.scrollWidth <= e.clientWidth + 1')
                for name in (['Sync key from backend', 'Test geocoding'] if language == 'en' else ['Синхронизировать ключ', 'Проверить геокодинг']):
                    button = page.get_by_role('button', name=name, exact=True)
                    box = button.bounding_box()
                    assert box and box['x'] >= 0 and box['x'] + box['width'] <= width + 1 and box['height'] >= 44
                tabs.nth(0).focus(); tabs.nth(0).press('ArrowRight')
                expect(tabs.nth(1)).to_have_attribute('aria-selected', 'true')
                tabs.nth(0).click()
                for link in page.get_by_role('link', name='Cities & Regions' if language == 'en' else 'Города', exact=True).all():
                    assert link.get_attribute('href') == '/admin/cities'
                assert page.get_by_text('Site availability controls', exact=True).count() == 0
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')
                page.screenshot(path=str(output / f'settings-{language}-{width}.png'), full_page=True)
                results.append(f'settings {language} {width}: labels, keyboard tabs, Maps targets, links, no overflow')
            for surface in ['logs', 'audit', 'roles']:
                page.goto(f'{base}/fixture.html?surface={surface}&scenario=error')
                page.get_by_role('alert').wait_for()
                assert 'unknown' in page.get_by_role('alert').inner_text()
                assert page.get_by_text('0 users', exact=True).count() == 0
                assert page.get_by_text('No audit entries yet', exact=True).count() == 0
                page.screenshot(path=str(output / f'{surface}-unavailable-{width}.png'), full_page=True)
                page.get_by_role('button', name='Retry', exact=True).click()
                page.get_by_role('alert').wait_for(state='hidden')
                if surface == 'roles':
                    assert page.get_by_text('0 users', exact=True).count() == 6
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')
                assert page.evaluate('window.fixtureForbidden') == []
                results.append(f'{surface} {width}: error distinct from empty/count, real query retry, no overflow')
            page.goto(f'{base}/fixture.html?surface=audit&scenario=full')
            combo = page.get_by_role('combobox', name='Entity type')
            combo.click(); page.get_by_role('option', name='All', exact=True).wait_for()
            page.wait_for_function(DIALOG_SETTLED, arg=page.get_by_role('listbox').element_handle(), timeout=5000)
            page.keyboard.press('Escape')
            entry = page.get_by_role('button', name='Open audit entry: Synthetic review event')
            entry.focus(); entry.press('Enter'); page.get_by_role('dialog').wait_for()
            page.wait_for_function(DIALOG_SETTLED, arg=page.get_by_role('dialog').element_handle(), timeout=5000)
            page.wait_for_function('(e)=>e.contains(document.activeElement)', arg=page.get_by_role('dialog').element_handle(), timeout=5000)
            page.screenshot(path=str(output / f'audit-detail-{width}.png'), full_page=True)
            page.keyboard.press('Escape'); page.get_by_role('dialog').wait_for(state='hidden')
            results.append(f'audit {width}: All filter opens, keyboard detail, Escape closes')
            page.goto(f'{base}/fixture.html?surface=control')
            page.get_by_role('link', name='Users & access Users, roles and RBAC').wait_for()
            assert page.get_by_role('link').count() == 3
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')
            page.screenshot(path=str(output / f'control-hub-{width}.png'), full_page=True)
            results.append(f'control {width}: compatible canonical links, no overflow')
            page.close()
        browser.close()
    assert not errors, errors
    assert not blocked, blocked
    assert len(results) == 14 and len(set(results)) == 14, results
    (output / 'browser-results.json').write_text(json.dumps({'result': 'PASS', 'environment': 'actual components and canonical CSS; synthetic auth/query/SDK boundaries; no production writes', 'scenarios': results, 'errors': errors, 'blocked': blocked}, indent=2))
    (output / 'results.json').write_text(json.dumps([{'scenario': result, 'result': 'PASS'} for result in results], indent=2))
    print(f'PASS {len(results)} browser scenarios')
finally:
    server.shutdown()
    server.server_close()
