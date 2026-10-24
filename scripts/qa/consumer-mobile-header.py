"""Actual isolated consumer header. All traffic intercepted; no auth/business writes."""
import asyncio,json,sys,itertools
from pathlib import Path
from urllib.parse import urlparse,urlencode
from playwright.async_api import async_playwright,expect
OUT=Path(sys.argv[1]);BASELINE='--baseline' in sys.argv
async def main():
 rows=[]
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None,headless=True,args=['--no-sandbox'])
  cases=list(itertools.product([320,360,390,430,768,1440],['ru','en','th'],['light','dark'],['no','yes'])) if not BASELINE else [(390,'ru',t,a) for t in ['light','dark'] for a in ['no','yes']]+[(1440,'en','light',a) for a in ['no','yes']]
  cases += [(390,'en','dark','no'),(390,'en','dark','yes'),(1440,'en','dark','no'),(1440,'en','dark','yes')] if not BASELINE else []
  for index,(width,lang,theme,auth) in enumerate(cases):
   overlay=not BASELINE and index>=72
   context=await browser.new_context(viewport={'width':width,'height':900},service_workers='block');blocked=[];errors=[]
   async def route(r):
    u=urlparse(r.request.url);name=u.path.lstrip('/')
    if u.netloc=='fixture.invalid' and r.request.method=='GET' and name in ['app.js','theme.css']:
     await r.fulfill(path=str(OUT/name),content_type='text/css' if name.endswith('css') else 'text/javascript')
    elif u.netloc=='fixture.invalid' and r.request.method=='GET' and r.request.is_navigation_request():await r.fulfill(path=str(OUT/'fixture.html'),content_type='text/html')
    else:blocked.append(r.request.url);await r.abort()
   await context.route('**/*',route);page=await context.new_page();page.on('pageerror',lambda e:errors.append(str(e)));prefix=f'{width}-{lang}-{theme}-{auth}'+('-overlay' if overlay else '');row={'case':prefix,'outcome':'FAIL'}
   try:
    await page.goto('http://fixture.invalid/discover/services?'+urlencode({'lang':lang,'theme':theme,'auth':auth,'overlay':'yes' if overlay else 'no'})+'#offers',wait_until='domcontentloaded');header=page.locator('.consumer-header');await header.get_by_role('link',name='myUNO',exact=True).wait_for();await page.evaluate('document.fonts.ready')
    row['headerBox']=await header.bounding_box();row['triggers']=await header.locator('button[aria-haspopup]').evaluate_all('(es)=>es.filter(e=>e.getClientRects().length).map(e=>({name:e.getAttribute("aria-label"),box:{x:e.getBoundingClientRect().x,y:e.getBoundingClientRect().y,width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}}))')
    await page.screenshot(path=str(OUT/f'{prefix}-closed.png'))
    if BASELINE:row['outcome']='OBSERVED';continue
    assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth'), 'Page overflow'
    if overlay:
     await expect(header.get_by_role('button',name='Pause motion',exact=True)).to_be_visible()
    if width<=820:
     assert row['headerBox']['height']<=73,row['headerBox']
     assert len(row['triggers'])==1,row['triggers']
     box=row['triggers'][0]['box'];assert box['width']>=44 and box['height']>=44,box
     brand=await header.get_by_role('link',name='myUNO',exact=True).bounding_box();assert abs((brand['y']+brand['height']/2)-(box['y']+box['height']/2))<2,'Second row'
    label={'ru':'Меню аккаунта' if auth=='yes' else 'Открыть меню','en':'Account menu' if auth=='yes' else 'Open menu','th':'เมนูบัญชี' if auth=='yes' else 'เปิดเมนู'}[lang]
    trigger=header.get_by_role('button',name=label,exact=True)
    if width<=820:
     await trigger.click();surface=page.get_by_role('menu') if auth=='yes' else page.get_by_role('dialog',name='myUNO',exact=True);await expect(surface).to_be_visible();await page.wait_for_function('(e)=>getComputedStyle(e).opacity===\"1\" && !e.getAnimations().some(a=>a.playState===\"running\")',arg=await surface.element_handle())
     service={'ru':'Услуги','en':'Services','th':'บริการ'}[lang];role='menuitem' if auth=='yes' else 'link';await expect(surface.get_by_role(role,name=service,exact=True)).to_be_visible()
     cart={'ru':'Корзина','en':'Cart','th':'ตะกร้า'}[lang];await expect(surface.get_by_role(role,name=cart,exact=True)).to_be_visible()
     if auth=='yes':
      row['menuTargetMetrics']=await surface.locator('[role=menuitem]').evaluate_all('(es)=>es.map(e=>({height:e.getBoundingClientRect().height,minHeight:getComputedStyle(e).minHeight}))');assert all(e['height']>=44 for e in row['menuTargetMetrics']), row['menuTargetMetrics']
      await expect(surface.get_by_role('menuitem',name={'ru':'Настройки','en':'Settings','th':'การตั้งค่า'}[lang],exact=True)).to_be_visible();await expect(surface.get_by_text({'ru':'Кабинет собственника','en':'Owner portal','th':'พอร์ทัลเจ้าของ'}[lang],exact=True)).to_be_visible()
     else:
      prefs=surface.get_by_test_id('global-preferences-controls');await expect(prefs).to_be_visible();assert await prefs.locator('button').count()==3
      sign=surface.get_by_role('link',name={'ru':'Войти','en':'Sign in','th':'เข้าสู่ระบบ'}[lang],exact=True);href=await sign.get_attribute('href');assert 'redirect=' in href and '%23offers' in href,href
     await page.wait_for_function('(e)=>getComputedStyle(e).opacity===\"1\" && !e.getAnimations().some(a=>a.playState===\"running\")',arg=await surface.element_handle());await page.screenshot(path=str(OUT/f'{prefix}-open.png'))
     if auth=='no' and width==390:
      prefs=surface.get_by_test_id('global-preferences-controls');controls=prefs.locator('button')
      await controls.nth(0).click();await page.get_by_role('menuitem',name='Тёмная' if lang=='ru' else 'Dark',exact=True).click();await expect(surface).to_be_visible()
      await controls.nth(1).click();await page.get_by_role('menuitem',name='English',exact=False).click();await expect(surface).to_be_visible()
      await controls.nth(2).click();currency=page.get_by_role('menuitem',name='USD',exact=False)
      row['currencyLayer']=await currency.evaluate('(e)=>getComputedStyle(e.parentElement).zIndex');assert row['currencyLayer']=='150'
      await currency.click();await expect(surface).to_be_visible();row['preferences']=await page.evaluate('window.fixturePreferences');assert len(row['preferences'])==3,row['preferences'];await page.screenshot(path=str(OUT/f'{prefix}-preferences-updated.png'))
     await page.keyboard.press('Escape');await expect(surface).not_to_be_visible();await expect(trigger).to_be_focused()
     # Reopen with keyboard, navigate cart via real menu/link without invoking any writer.
     await page.keyboard.press('Enter');surface=page.get_by_role('menu') if auth=='yes' else page.get_by_role('dialog',name='myUNO',exact=True);await expect(surface).to_be_visible();await page.keyboard.press('ArrowDown' if auth=='yes' else 'Tab');assert await surface.evaluate('(e)=>e.contains(document.activeElement)'), 'Keyboard focus left menu';await surface.get_by_role(role,name=cart,exact=True).click();await expect(page.locator('#route')).to_have_text('/cart')
    else:
     await expect(header.locator('.consumer-nav')).to_be_visible();await expect(header.get_by_test_id('global-preferences-controls')).to_be_visible()
     if lang=='en' and not overlay:
      await header.get_by_test_id('global-preferences-controls').locator('button').nth(2).click();currency=page.get_by_role('menuitem',name='USD',exact=False);row['currencyLayer']=await currency.evaluate('(e)=>getComputedStyle(e.parentElement).zIndex');assert row['currencyLayer']=='150';await currency.click();assert 'currency:USD' in await page.evaluate('window.fixturePreferences')
    assert not errors and not blocked,(errors,blocked);assert not await page.evaluate('window.fixtureWrites');row['outcome']='PASS'
   except Exception as e:
    row['error']=str(e);row['errors']=errors;row['blocked']=blocked;await page.screenshot(path=str(OUT/f'{prefix}-FAIL.png'))
   finally:
    rows.append(row);print(json.dumps(row,ensure_ascii=False),flush=True);await context.close();(OUT/'results.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
  await browser.close()
 if not BASELINE:assert len(rows)==76 and all(r['outcome']=='PASS' for r in rows),[(r['case'],r.get('error')) for r in rows if r['outcome']!='PASS']
asyncio.run(main())
