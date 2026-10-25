"""Actual root and selected read-only forms; all transport/writes denied, no save acceptance."""
import asyncio,json,re,shutil,sys
from pathlib import Path
from playwright.async_api import async_playwright
OUT=Path(sys.argv[1])
async def main():
 rows=[]
 cases=[(surface,lang,width,theme,'normal') for surface,langs in [('admin',['en','ru']),('mc',['en','ru','th'])] for lang in langs for width in [390,768,1440] for theme in ['light','dark']]
 cases += [('admin','ru',390,theme,state) for theme in ['light','dark'] for state in ['loading','empty','error']]
 cases += [('mc','ru',390,theme,'loading') for theme in ['light','dark']]
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True,executable_path=shutil.which('chromium'),args=['--no-sandbox'])
  for surface,lang,width,theme,state in cases:
   context=await browser.new_context(viewport={'width':width,'height':900},service_workers='block');page=await context.new_page();errors=[];blocked=[]
   page.on('pageerror',lambda error:errors.append(str(error)))
   async def route(r):
    url=r.request.url;file=url.split('?',1)[0].rsplit('/',1)[-1]
    if url.startswith('http://localhost:8080/') and file in ['app.js','normal.css']:await r.fulfill(path=str(OUT/file),content_type='text/javascript' if file.endswith('.js') else 'text/css')
    elif url.startswith('http://localhost:8080/') and url.split('?',1)[0].endswith('/settings'):await r.fulfill(path=str(OUT/'index.html'),content_type='text/html')
    else:blocked.append(url);await r.abort()
   await context.route('**/*',route)
   row={'route':'/admin/settings' if surface=='admin' else '/mc/settings','language':lang,'width':width,'theme':theme,'state':state,'scope':'actual roots +Notification/Flags/Org/CompanyProfile read forms; synthetic SDK/auth and parent-clearance model'}
   try:
    url=f'http://localhost:8080/{surface}/settings?lang={lang}&theme={theme}&state={state}'+('&tab=profile' if surface=='mc' else '')
    await page.goto(url,wait_until='networkidle');frame=page.locator('#actual-settings .ds-frame-workspace');await frame.wait_for()
    info=await frame.evaluate('e=>({max:getComputedStyle(e).maxWidth,gutter:getComputedStyle(e).paddingLeft,bottom:getComputedStyle(e).paddingBottom,classes:e.className})');row['frame']=info
    assert info['max']=='1536px' and info['gutter']=={390:'16px',768:'24px',1440:'40px'}[width],info
    assert 'ds-page-with-navigation' not in info['classes'],'duplicate nav clearance'
    original=await page.evaluate("document.documentElement.style.getPropertyValue('--layout-width-workspace')");await page.evaluate("document.documentElement.style.setProperty('--layout-width-workspace','1000px')");assert await frame.evaluate("e=>getComputedStyle(e).maxWidth==='1000px'")
    await page.evaluate("v=>{if(v)document.documentElement.style.setProperty('--layout-width-workspace',v);else document.documentElement.style.removeProperty('--layout-width-workspace')}",original)
    if surface=='admin':
     if state=='loading':await page.get_by_role('status').filter(has_text='Загрузка настроек').wait_for();assert await page.locator('#admin-notification-emails').count()==0
     elif state=='error':await page.get_by_role('alert').filter(has_text='недоступны').wait_for();assert await page.locator('#admin-notification-emails').count()==0
     else:
      email=page.locator('#admin-notification-emails');await email.wait_for();assert await email.input_value()==('' if state=='empty' else 'synthetic-ops@example.test')
     if state=='normal':
      first=page.get_by_role('tab').first;await first.focus();await page.keyboard.press('End');await page.locator('input#org_country').wait_for();row['keyboardTabs']='End activates actual organization read form; Home returns to system'
      # Focus the active tab, not its form field, before returning by keyboard.
      await page.get_by_role('tab',selected=True).focus();await page.keyboard.press('Home');await page.locator('#admin-notification-emails').wait_for()
    else:
     if state=='loading':await page.get_by_role('status').wait_for();assert await page.get_by_placeholder('My Property Company').count()==0
     else:
      branding={'en':'Company Branding','ru':'Бренд компании','th':'แบรนด์บริษัท'}[lang];await page.get_by_role('button',name=branding,exact=True).wait_for()
      before=page.url;finance=page.get_by_role('button',name=re.compile({'en':'^Finance','ru':'^Финансы','th':'^การเงิน'}[lang]));await finance.click();assert 'tab=finance' in page.url
      await page.go_back();await page.wait_for_url(before);assert await finance.get_attribute('aria-expanded')=='false';row['back']='native BrowserRouter history restores profile-only accordion selection'
      await page.get_by_role('button',name=branding,exact=True).click();name=page.get_by_placeholder('My Property Company');await name.wait_for();assert await name.input_value()=='Synthetic management company with a longer name';await name.focus();await page.keyboard.press('Tab');assert await page.evaluate('document.activeElement!==document.body')
    assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth'),'page overflow'
    filename=f'{surface}-{lang}-{width}-{theme}-{state}.png';await page.screenshot(path=str(OUT/filename),full_page=True);row['screenshot']=filename
    if surface=='admin' and state=='error':
     await page.get_by_role('button',name='Повторить загрузку',exact=True).click();await page.locator('#admin-notification-emails').wait_for();assert await page.locator('#admin-notification-emails').input_value()=='synthetic-ops@example.test';row['retry']='actual NotificationSettings read retry recovers; no save invoked'
    await page.locator('#fixture-end').scroll_into_view_if_needed();await page.evaluate('scrollTo(0,document.documentElement.scrollHeight)')
    if width<768:
     end=await page.locator('#fixture-end').bounding_box();nav=await page.locator('[data-fixed-nav]').bounding_box();assert end['y']+end['height']<=nav['y']+1,{'end':end,'nav':nav};row['clearance']='content end above fixed source-matched parent model; physical notch not tested'
    assert await page.evaluate('window.fixtureReads>0'),'actual child read never executed'
    assert await page.evaluate('window.fixtureForbidden')==0,'mutation or forbidden operation attempted'
    assert not errors,errors
    assert not blocked,blocked
    row['result']='PASS'
   except Exception as error:row['result']='FAIL';row['failure']=str(error);await page.screenshot(path=str(OUT/f'{surface}-{lang}-{width}-{theme}-{state}-FAIL.png'),full_page=True)
   row['pageErrors']=errors;row['blockedRequests']=blocked;rows.append(row);await context.close()
  await browser.close()
 assert len(rows)==38,'matrix incomplete'
 (OUT/'results.json').write_text(json.dumps({'scope':'two operator roots, no writes/save/auth acceptance','unsupported':'MC CompanyProfileSettings hides query errors; no invented MC error/empty readiness claim; explicit nested domain boundaries listed in manifest','manifest':json.loads((OUT/'manifest.json').read_text()),'cases':rows},ensure_ascii=False,indent=2));print(json.dumps({'cases':len(rows),'passed':sum(r['result']=='PASS' for r in rows),'failed':sum(r['result']=='FAIL' for r in rows)}))
 if any(r['result']=='FAIL' for r in rows):raise SystemExit(1)
asyncio.run(main())
