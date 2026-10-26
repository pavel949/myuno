"""Local owned PostgreSQL gateway only; synthetic auth; no external network."""
import asyncio
import json
import sys
import os
from pathlib import Path
from urllib.parse import urlparse
from playwright.async_api import async_playwright, expect

base, output = sys.argv[1], Path(sys.argv[2])
output.mkdir(parents=True, exist_ok=True)
guest = '00000000-0000-4000-8000-000000000005'
manager = '00000000-0000-4000-8000-000000000004'
other_guest = '00000000-0000-4000-8000-000000000009'

async def main():
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(executable_path=os.environ.get('MC_PILOT_CHROMIUM_PATH','/usr/bin/chromium'), args=['--no-sandbox'])
        context = await browser.new_context(viewport={'width': 390, 'height': 844}, service_workers='block', reduced_motion='reduce')
        errors, blocked = [], []
        async def local_only(route):
            if urlparse(route.request.url).netloc == urlparse(base).netloc:
                await route.continue_()
            else:
                blocked.append(route.request.url)
                await route.abort()
        await context.route('**/*', local_only)
        page = await context.new_page()
        page.on('pageerror', lambda error: errors.append(str(error)))
        lost = False
        async def lose_first_ack(route):
            nonlocal lost
            body = route.request.post_data_json
            if body.get('name') == 'create_property_reservation_checked' and not lost:
                response = await route.fetch()
                assert (await response.json())['data']['success']
                lost = True
                await route.abort()
            else:
                await route.continue_()
        await page.route(base + '/rpc', lose_first_ack)
        await page.goto(base + '/?actor=' + guest)
        await expect(page.get_by_role('button', name='Request to book', exact=True)).to_be_enabled()
        await page.get_by_role('button', name='Request to book', exact=True).click()
        await expect(page.get_by_text('Save not confirmed. Retry the request: its identity has been retained.')).to_be_visible()
        await page.get_by_role('button', name='Request to book', exact=True).click()
        await expect(page.get_by_role('heading', name='Request submitted')).to_be_visible()
        await page.get_by_role('button', name='Check status', exact=True).click()
        await expect(page.get_by_test_id('property-reservation-status')).to_have_text('Awaiting manager confirmation')
        await page.screenshot(path=str(output / '01-guest-pending-390.png'), full_page=True)
        order_id = await page.evaluate("JSON.parse(localStorage.getItem('mc-isolated-created-order')||'null')")
        assert order_id
        guest_list=await context.new_page()
        await guest_list.goto(base+'/?surface=guest-list&actor='+guest)
        await expect(guest_list.get_by_test_id('guest-list-status')).to_have_text('pending')
        operator = await context.new_page()
        operator.on('pageerror', lambda error: errors.append(str(error)))
        await operator.goto(base + '/?surface=pms&actor=' + manager + '&order=' + order_id)
        await expect(operator.get_by_test_id('command-result')).to_be_visible()
        await expect(operator.get_by_test_id('calendar-state')).to_have_text('pending:reserved')
        await operator.get_by_role('button', name='Confirm in PMS', exact=True).click()
        await expect(operator.get_by_test_id('command-result')).to_contain_text('confirmed')
        await expect(operator.get_by_test_id('calendar-state')).to_have_text('confirmed:reserved')
        await guest_list.get_by_role('button',name='Refresh my requests',exact=True).click()
        await expect(guest_list.get_by_test_id('guest-list-status')).to_have_text('confirmed')
        await page.get_by_role('button', name='Refresh status', exact=True).click()
        await expect(page.get_by_test_id('property-reservation-status')).to_have_text('Confirmed')
        await page.screenshot(path=str(output / '02-guest-confirmed-390.png'), full_page=True)
        stranger = await context.new_page()
        await stranger.goto(base + '/?surface=receipt&actor=' + other_guest + '&order=' + order_id)
        await expect(stranger.get_by_role('alert')).to_contain_text('could not be verified')
        await expect(stranger.get_by_test_id('property-reservation-status')).to_have_count(0)
        await operator.get_by_role('button', name='Cancel in PMS', exact=True).click()
        await expect(operator.get_by_test_id('command-result')).to_contain_text('cancelled')
        await expect(operator.get_by_test_id('calendar-state')).to_have_text('cancelled:released')
        await guest_list.get_by_role('button',name='Refresh my requests',exact=True).click()
        await expect(guest_list.get_by_test_id('guest-list-status')).to_have_text('cancelled')
        await page.get_by_role('button', name='Refresh status', exact=True).click()
        await expect(page.get_by_test_id('property-reservation-status')).to_have_text('Cancelled')
        await page.goto(base + '/?surface=receipt&actor=' + guest + '&order=' + order_id)
        await expect(page.get_by_test_id('property-reservation-status')).to_have_text('Cancelled')
        await page.set_viewport_size({'width': 1440, 'height': 1000})
        await page.screenshot(path=str(output / '03-guest-cancelled-1440.png'), full_page=True)
        assert lost and not blocked and not errors, (blocked, errors)
        (output / 'browser-results.json').write_text(json.dumps({'result': 'PASS', 'environment': 'owned PostgreSQL; actual inquiry/receipt/PMS hook; synthetic Auth/provider boundary', 'journey': ['actual inquiry lost-ack retry', 'guest persisted pending receipt', 'manager confirms through actual PMS hook', 'guest confirmed refresh', 'other guest denied', 'manager cancels', 'guest reload cancelled; exact hold released'], 'blocked': blocked, 'errors': errors}, indent=2))
        await browser.close()

asyncio.run(main())
