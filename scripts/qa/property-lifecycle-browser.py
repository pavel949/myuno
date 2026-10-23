"""Only local synthetic gateway. Screenshots are isolated evidence, not production."""
import asyncio,json,sys
from pathlib import Path
from urllib.parse import urlparse
from playwright.async_api import async_playwright,expect
base,out=sys.argv[1],Path(sys.argv[2]);out.mkdir(parents=True,exist_ok=True)
guest='00000000-0000-4000-8000-000000000005';manager='00000000-0000-4000-8000-000000000004'
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  ctx=await browser.new_context(viewport={'width':390,'height':844},service_workers='block',reduced_motion='reduce');errors=[];blocked=[]
  async def route(r):
   if urlparse(r.request.url).netloc==urlparse(base).netloc:await r.continue_()
   else:blocked.append(r.request.url);await r.abort()
  await ctx.route('**/*',route);page=await ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
  lost={'create':False,'cancel':False}
  async def lose_ack(r):
   body=r.request.post_data_json
   operation=body.get('name')
   key='create' if operation=='create_property_reservation_checked' else 'cancel' if operation=='change_property_booking' and body['args']['p_patch'].get('status')=='cancelled' else None
   if key and not lost[key]:
    response=await r.fetch();assert (await response.json())['data']['success'];lost[key]=True;await r.abort()
   else:await r.continue_()
  await page.route(base+'/rpc',lose_ack)
  await page.goto(base+'/?actor='+guest);await page.get_by_role('button',name='Reserve selected property').click();await expect(page.get_by_role('alert')).to_be_visible();await page.get_by_role('button',name='Reserve selected property').click();await expect(page.get_by_test_id('command-result')).to_be_visible();created=json.loads(await page.get_by_test_id('command-result').inner_text());id=created['order']['id'];assert created['order']['status']=='pending' and created['replayed'] is True
  await page.goto(base+'/?surface=detail&actor='+guest+'&order='+id);await expect(page.get_by_test_id('property-reservation-status')).to_have_text('Awaiting confirmation');await page.screenshot(path=str(out/'01-guest-pending-390.png'),full_page=True)
  operator=await ctx.new_page();operator.on('pageerror',lambda e:errors.append(str(e)));await operator.goto(base+'/?actor='+manager+'&order='+id);await operator.get_by_role('button',name='Read manager reservation').click();await expect(operator.get_by_test_id('command-result')).to_be_visible();await operator.get_by_role('button',name='Confirm in PMS').click();await expect(operator.get_by_test_id('command-result')).to_contain_text('confirmed')
  await page.get_by_role('button',name='Refresh status',exact=True).click();await expect(page.get_by_test_id('property-reservation-status')).to_have_text('Confirmed');await page.screenshot(path=str(out/'02-guest-confirmed-390.png'),full_page=True)
  await page.get_by_role('button',name='Cancel reservation',exact=True).click();await expect(page.get_by_role('alertdialog')).to_be_visible();await page.screenshot(path=str(out/'03-cancel-dialog-390.png'),full_page=True);await page.keyboard.press('Escape');await expect(page.get_by_role('alertdialog')).not_to_be_visible();await expect(page.get_by_test_id('property-reservation-status')).to_have_text('Confirmed');await page.get_by_role('button',name='Cancel reservation',exact=True).click();await page.get_by_role('button',name='Yes, cancel',exact=True).click();await expect(page.get_by_role('alert')).to_be_visible();await expect(page.get_by_test_id('property-reservation-status')).to_have_text('Confirmed');await page.get_by_role('button',name='Cancel reservation',exact=True).click();await page.get_by_role('button',name='Yes, cancel',exact=True).click();await expect(page.get_by_test_id('property-reservation-status')).to_have_text('Cancelled');await page.reload();await expect(page.get_by_test_id('property-reservation-status')).to_have_text('Cancelled');await page.screenshot(path=str(out/'04-guest-cancelled-390.png'),full_page=True)
  await operator.get_by_role('button',name='Read manager reservation').click();await expect(operator.get_by_test_id('command-result')).to_contain_text('cancelled')
  await page.set_viewport_size({'width':1440,'height':1000});await page.screenshot(path=str(out/'05-guest-cancelled-1440.png'),full_page=True)
  assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth');assert not blocked and not errors,(blocked,errors)
  (out/'browser-results.json').write_text(json.dumps({'result':'PASS','order_id':id,'journey':['guest reserve with lost response and stable replay','manager read','manager confirm','guest persisted refresh','guest cancel with lost response and stable replay','guest reload','manager cancelled read'],'environment':'disposable PostgreSQL; synthetic auth/shell; real adapters and detail component','errors':errors,'blocked':blocked},indent=2));await browser.close()
asyncio.run(main())
