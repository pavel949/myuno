import asyncio,json,sys
from pathlib import Path
from urllib.parse import urlparse
from playwright.async_api import async_playwright,expect,TimeoutError as PlaywrightTimeout
OUT=Path(sys.argv[1]);ROOT=Path(__file__).resolve().parents[2]
async def main():
 results=[]
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  for guard in ['owner','admin','staff','vendor','team','mc','investor']:
   for portal in [False,True]:
    for width in [390,1440]:
     case=f'{guard}-{"portal" if portal else "inline"}-{width}'
     context=await browser.new_context(viewport={'width':width,'height':844},service_workers='block',reduced_motion='reduce')
     async def route(r):
      u=urlparse(r.request.url);f=OUT/('index.html' if u.path=='/' else u.path.lstrip('/'))
      if u.path.startswith('/fonts/'):f=ROOT/'public'/u.path.lstrip('/')
      if r.request.method=='GET' and u.netloc=='guard.invalid' and f.is_file():await r.fulfill(path=str(f),content_type={'.html':'text/html','.css':'text/css','.woff2':'font/woff2'}.get(f.suffix,'text/javascript'))
      else:await r.abort()
     await context.route('**/*',route);page=await context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
     await page.goto(f'http://guard.invalid/?guard={guard}&portal={int(portal)}',wait_until='networkidle')
     field=page.get_by_role('textbox',name='Unsaved draft');await expect(field).to_be_visible();await field.fill('Unsaved '+case)
     await page.screenshot(path=str(OUT/(case+'-before.png')))
     # Headless visibility is unreliable: use React Query's actual focus-manager signal.
     await page.evaluate('window.fixtureSetFocused(false)');other=await context.new_page();await other.goto('about:blank')
     await page.evaluate('window.fixtureBegin()');await page.bring_to_front();await page.evaluate('window.fixtureSetFocused(true)')
     await expect(page.get_by_role('status',name='Loading myUNO')).to_be_visible()
     curtain=page.get_by_role('dialog',name='Checking access')
     await expect(curtain).to_be_visible()
     assert await curtain.evaluate('(el)=>{const r=el.getBoundingClientRect(),bg=getComputedStyle(el).backgroundColor;return r.x===0&&r.y===0&&r.width>=innerWidth&&r.height>=innerHeight&&!bg.includes("rgba")}'), 'Curtain must be opaque and cover the viewport'
     pending={'case':case,'draftNodes':await page.locator('input').count(),'mounts':await page.evaluate('window.fixtureMounts'),'unmounts':await page.evaluate('window.fixtureUnmounts')}
     await page.screenshot(path=str(OUT/(case+'-pending.png')))
     if portal:
      cdp=await context.new_cdp_session(page);tree=await cdp.send('Accessibility.getFullAXTree')
      assert not any(not n.get('ignored') and n.get('role',{}).get('value')=='textbox' for n in tree['nodes']), 'Pending portal remains in accessibility tree'
      try:
       await page.locator('input').click(timeout=350)
       raise AssertionError('Pending portal accepted input')
      except PlaywrightTimeout:pass
      await page.keyboard.press('Escape')
      await expect(page.get_by_role('dialog',name='Checking access')).to_be_visible()
     if guard=='owner' and portal and width==390:
      await expect(page.get_by_role('button',name='Retry',exact=True)).to_be_visible(timeout=15000)
      await page.screenshot(path=str(OUT/(case+'-deadline-retry.png')))
      await page.keyboard.press('Tab')
      await expect(page.get_by_role('button',name='Retry',exact=True)).to_be_focused()
      await page.keyboard.press('Enter')
      await expect(page.get_by_role('status',name='Loading myUNO')).to_be_visible()
     await page.evaluate("window.fixtureFinish('success')");await expect(field).to_be_visible()
     await expect(field).to_be_focused()
     pending['afterValue']=await field.input_value();pending['afterMounts']=await page.evaluate('window.fixtureMounts')
     await page.screenshot(path=str(OUT/(case+'-after.png')))
     assert pending['draftNodes']==1 and pending['afterValue']=='Unsaved '+case and pending['afterMounts']==1,pending
     # A failed verification removes cached authority and the old draft.
     await page.evaluate('window.fixtureSetFocused(false)');await page.evaluate('window.fixtureBegin()');await page.evaluate('window.fixtureSetFocused(true)')
     await expect(page.get_by_role('status',name='Loading myUNO')).to_be_visible();await page.evaluate("window.fixtureFinish('error')")
     await expect(page.get_by_role('alert')).to_contain_text('Could not verify access');await expect(page.locator('input')).to_have_count(0)
     await page.get_by_role('button',name='Retry',exact=True).click();await expect(field).to_be_visible();await expect(field).to_have_value('')
     # Same-account drafts must never transfer to another account, even on a late reply.
     await field.fill('Actor A secret');await page.evaluate('window.fixtureSetFocused(false)');await page.evaluate('window.fixtureBegin()');await page.evaluate('window.fixtureSetFocused(true)')
     await expect(page.get_by_role('status',name='Loading myUNO')).to_be_visible();await page.evaluate("window.fixtureSwitch('actor-b')")
     await expect(page.locator('input')).to_have_count(0);await page.evaluate("window.fixtureFinish('success')");await expect(field).to_be_visible();await expect(field).to_have_value('')
     # Confirmed revocation must remove protected content, including portaled forms.
     await page.evaluate('window.fixtureSetFocused(false)');await page.evaluate('window.fixtureBegin()');await page.evaluate('window.fixtureSetFocused(true)')
     await expect(page.get_by_role('status',name='Loading myUNO')).to_be_visible()
     if guard=='mc':await page.evaluate('window.fixtureRevokeMembership()')
     await page.evaluate("window.fixtureFinish('revoke')")
     await expect(page.locator('input')).to_have_count(0)
     if guard=='mc':await expect(page.locator('#route')).to_have_text('/mc/onboarding')
     elif guard=='investor':await expect(page.locator('#route')).to_have_text('/invest')
     else:await expect(page.get_by_role('heading',name='Access Restricted')).to_be_visible()
     assert await page.evaluate('window.fixtureWrites')==0
     assert not errors,errors
     pending.update({'errorRetry':True,'accountSwitch':True,'revocation':True,'focusRestored':True,'portalBlocked':portal,'writes':0})
     results.append(pending);(OUT/'results.json').write_text(json.dumps(results,indent=2))
     await context.close()
  await browser.close()
 print(json.dumps({'passed':len(results),'output':str(OUT),'focus':'controlled React Query focus signal; headless tab visibility not certified'}))
asyncio.run(main())
