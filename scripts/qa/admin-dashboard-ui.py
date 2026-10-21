"""Remote-CI-only dashboard rendering, reads, navigation and access evidence.

The actual UI is rendered with synthetic read hooks. Destination lists and the
sidebar are explicit boundaries; source count/list equality has separate tests.
"""
import asyncio
import json
import os
import re
from pathlib import Path
import sys
from urllib.parse import urlencode, urlparse
from playwright.async_api import async_playwright, expect

OUTPUT = Path(sys.argv[1])
CASES = [(lang, width, scenario, 'admin') for lang in ['ru', 'en', 'th']
         for width in [375, 768, 1280, 1920]
         for scenario in ['full', 'one-source-failure', 'stale', 'no-snapshots']]
CASES += [(lang, width, 'full', role) for lang in ['ru', 'en', 'th']
          for width in [375, 1280] for role in ['staff', 'unauthorized']]


async def bounds(page, *, fills_work_area):
    geometry = await page.evaluate("""()=>{
        const area=document.querySelector('[data-testid="dashboard-work-area"]'),ar=area.getBoundingClientRect();
        const visible=e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden';
        const bad=[...area.querySelectorAll('button,a,input,select,h1,h2,h3')].filter(visible).map(e=>{
            const r=e.getBoundingClientRect();return {tag:e.tagName,text:(e.textContent||e.getAttribute('aria-label')||'').trim().slice(0,100),left:r.left,right:r.right,width:r.width};
        }).filter(r=>r.left<ar.left-1||r.right>ar.right+1||r.width<0);
        const frame=area.firstElementChild,fr=frame.getBoundingClientRect();
        return{viewport:innerWidth,documentWidth:document.documentElement.scrollWidth,area:{left:ar.left,right:ar.right,width:ar.width},frame:{left:fr.left,right:fr.right,width:fr.width},bad};
    }""")
    assert geometry['documentWidth'] <= geometry['viewport'], geometry
    assert not geometry['bad'], geometry
    # Actual PageShell fills the work area after the explicitly synthetic rail.
    if fills_work_area:
        assert abs(geometry['frame']['width'] - geometry['area']['width']) <= 1, geometry
    return geometry


async def check_admin(page, scenario):
    await expect(page.get_by_role('heading', level=1)).to_have_count(1)
    await page.wait_for_function("document.querySelector('[data-count-key=\"pendingOrders\"]')?.dataset.countState!=='loading'")
    await expect(page.locator('[data-testid="dashboard-period-analytics"] [aria-busy]')).to_have_attribute('aria-busy', 'false')
    await expect(page.locator('[data-queue]')).to_have_count(4)
    expected = {'pendingContent': 11, 'pendingListings': 7, 'pendingProperties': 4,
                'pendingProviders': 3, 'pendingOrders': 5, 'openTickets': 6,
                'pendingManualPayments': 2, 'pendingPartnerApplications': 4, 'openDisputes': 1}
    count_proof = {}
    for key, value in expected.items():
        elements = page.locator(f'[data-count-key="{key}"]')
        assert await elements.count() > 0, key
        state = 'unavailable' if scenario == 'one-source-failure' and key == 'pendingProviders' else 'stale' if scenario == 'stale' else 'ready'
        for element in await elements.all():
            await expect(element).to_have_attribute('data-count-state', state)
            if state != 'unavailable':
                await expect(element.locator('span').first).to_have_text(str(value))
            else:
                assert await element.locator('span').first.inner_text() not in ['0', '3'], key
        count_proof[key] = {'value': None if state == 'unavailable' else value, 'state': state}
    if scenario == 'one-source-failure':
        await expect(page.get_by_role('alert')).to_have_count(1)
    if scenario == 'stale':
        assert await page.locator('[data-count-state="stale"]').count() > 0
    review = page.locator('[data-queue="pendingContent"]')
    await expect(review.locator('a[href="/admin/operations?tab=moderation&type=listing"] [data-count-key] > span:first-child')).to_have_text('7')
    await expect(review.locator('a[href="/admin/operations?tab=moderation&type=property"] [data-count-key] > span:first-child')).to_have_text('4')
    destinations = [
        '/admin/providers?filter=unverified', '/admin/operations?tab=bookings&status=pending',
        '/admin/tickets?status=active', '/admin/operations?tab=manual-payments&manual_status=review',
        '/admin/properties?action=new', '/admin/services?action=new',
    ]
    for href in destinations:
        assert await page.locator(f'a[href="{href}"]').count() > 0, href
    age = page.locator('[data-decision="pendingOrders24h"] a')
    await expect(age).to_have_attribute('href', '/admin/operations?tab=bookings&status=pending&created_before=2026-10-19T00%3A00%3A00.000Z')
    # Configuration and delivery are distinct in the real status component.
    status = page.get_by_test_id('platform-status')
    await expect(status.locator('dl > div')).to_have_count(6)
    states = await status.locator('dl > div > dd').all_inner_texts()
    assert states[1] == states[2] and states[3] == states[4], states
    assert states[0] != states[1] and states[5] != states[1], states
    if await page.locator('html').get_attribute('lang') == 'en':
        assert states == ['Not configured', 'Configured', 'Configured', 'Unavailable', 'Unavailable', 'Not verified end to end'], states
    analytics = page.get_by_test_id('dashboard-period-analytics')
    cells = analytics.locator('[aria-busy] > div > p:last-child')
    if scenario == 'no-snapshots':
        await expect(cells).to_have_text(['—', '—', '—'])
        await expect(analytics.locator('p[role="status"]')).to_contain_text('0/7')
    else:
        await expect(cells).to_have_text(['14', '840', '84'])
    return {'counts': count_proof, 'destinations': destinations, 'snapshotCells': await cells.all_inner_texts(), 'platformStatuses': states}


async def interactions(page):
    search = page.locator('input').first
    provider_title = await page.locator('[data-queue="pendingProviders"] h3').inner_text()
    await search.fill(provider_title)
    await expect(page.locator('[data-queue]')).to_have_count(1)
    await expect(page.locator('[data-queue="pendingProviders"]')).to_have_count(1)
    await search.press('Escape')
    await expect(search).to_have_value('')
    await expect(page.locator('[data-queue]')).to_have_count(4)
    await search.fill('no-synthetic-queue-match')
    await expect(page.locator('[data-queue]')).to_have_count(0)
    await search.press('Escape')
    await expect(page.locator('[data-queue]')).to_have_count(4)
    # Native DOM clicks call the actual handler three times in one task, before
    # React's disabled-state update can serve as the single-flight guard.
    before = await page.evaluate('({...window.fixtureReads})')
    refresh = page.locator('header button').first
    await expect(refresh).to_be_enabled()
    await refresh.evaluate('e=>{e.click();e.click();e.click();}')
    await page.wait_for_function('before=>Object.keys(before).every(key=>window.fixtureReads[key]===before[key]+1)', arg=before)
    await expect(refresh).to_be_enabled()
    after = await page.evaluate('({...window.fixtureReads})')
    assert all(after[key] == before[key] + 1 for key in before), {'before': before, 'after': after}
    # Observe a real Link push; this fixture does not substitute for destination
    # queue filters or claim a destination list was rendered.
    target = '/admin/providers?filter=unverified'
    await page.locator(f'a[href="{target}"]').first.click()
    await expect(page.get_by_test_id('fixture-location')).to_have_text(target)
    await page.get_by_test_id('fixture-back').evaluate('e=>e.click()')
    await expect(page.get_by_test_id('fixture-location')).to_have_text('/admin')
    await page.get_by_test_id('fixture-forward').evaluate('e=>e.click()')
    await expect(page.get_by_test_id('fixture-location')).to_have_text(target)
    period = page.get_by_test_id('dashboard-period-analytics').locator('select')
    await period.select_option('30')
    await expect(page.get_by_test_id('dashboard-period-analytics').locator('[aria-busy]')).to_have_attribute('aria-busy', 'false')
    await expect(page.get_by_test_id('dashboard-period-analytics').locator('[aria-busy] > div > p:last-child').first).to_have_text('60')
    values = await page.get_by_test_id('dashboard-period-analytics').locator('[aria-busy] > div > p:last-child').all_inner_texts()
    assert [re.sub(r'\D', '', value) for value in values] == ['60', '3600', '360'], values
    return {'singleFlight': {'before': before, 'after': after}, 'linkPushAndMemoryHistory': target, 'period': 30}


async def main():
    if not os.environ.get('CI') or os.environ.get('GITHUB_ACTIONS') != 'true':
        raise RuntimeError('Browser execution is remote GitHub CI-only')
    results = []
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        for lang, width, scenario, role in CASES:
            context = await browser.new_context(viewport={'width': width, 'height': 1100}, service_workers='block')
            blocked, errors = [], []
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
            row = {'language': lang, 'width': width, 'scenario': scenario, 'role': role, 'outcome': 'FAIL'}
            try:
                await page.goto('http://localhost:8080/fixture?' + urlencode({'lang': lang, 'scenario': scenario, 'role': role}), wait_until='networkidle')
                await page.evaluate('document.fonts.ready')
                if role == 'admin':
                    row['proof'] = await check_admin(page, scenario)
                    if scenario == 'full':
                        row['interactions'] = await interactions(page)
                else:
                    await expect(page.locator('[data-queue]')).to_have_count(0)
                    await expect(page.get_by_test_id('platform-status')).to_have_count(0)
                    await expect(page.get_by_test_id('dashboard-period-analytics')).to_have_count(0)
                    if role == 'staff':
                        await expect(page.get_by_test_id('staff-boundary')).to_be_visible()
                    else:
                        await expect(page.get_by_role('alert')).to_be_visible()
                    assert await page.evaluate('Object.values(window.fixtureReads).every(value=>value===0)&&Object.values(window.fixtureHookCalls).every(value=>value===0)')
                    row['accessProof'] = {'noPlatformReads': True, 'noPlatformHooks': True}
                row['geometry'] = await bounds(page, fills_work_area=role == 'admin')
                assert not await page.evaluate('window.fixtureForbidden'), 'Forbidden data access'
                assert not blocked and not errors, {'blocked': blocked, 'runtimeErrors': errors}
                row['outcome'] = 'PASS'
            except Exception as error:
                row.update(error=str(error), blocked=blocked, runtimeErrors=errors)
            results.append(row)
            (OUTPUT / 'results.json').write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
            await page.screenshot(path=str(OUTPUT / f'{lang}-{width}-{scenario}-{role}-{row["outcome"]}.png'), full_page=True)
            await context.close()
        await browser.close()
    assert len(results) == 60 and all(row['outcome'] == 'PASS' for row in results), {'complete': len(results), 'failed': sum(row['outcome'] != 'PASS' for row in results)}


if __name__ == '__main__':
    asyncio.run(main())
