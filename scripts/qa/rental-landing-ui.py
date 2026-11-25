import asyncio,json,os,sys,threading
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from playwright.async_api import async_playwright,expect
from computed_text_contrast import assert_computed_contrast
out=Path(sys.argv[1]); rows=[]
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args): pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(out)))
threading.Thread(target=server.serve_forever,daemon=True).start();base=f'http://127.0.0.1:{server.server_port}'
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH'),headless=True,args=['--no-sandbox'])
  for lang in ['ru','en','th']:
   for width in [320,375,390,768,1440]:
    blocked=[];errors=[]
    context=await browser.new_context(viewport={'width':width,'height':900},service_workers='block')
    async def route(r):
     if r.request.url.startswith(base+'/'):await r.continue_()
     else:blocked.append(r.request.url);await r.abort()
    await context.route('**/*',route);page=await context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
    await page.goto(f'{base}/fixture.html?lang={lang}')
    try:await expect(page.locator('#rental-title')).to_be_visible()
    except AssertionError as e:raise AssertionError(f'Rental mount failed {lang}/{width}; pageErrors={errors}; blocked={blocked}') from e
    await page.evaluate('document.fonts.ready');await expect(page.locator('.rental-community')).to_have_count(1)
    assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth'),f'overflow {lang}/{width}'
    for id in ['rental-areas','rental-communities','rental-search','rental-guide','rental-life']:await expect(page.locator('#'+id)).to_have_count(1)
    await expect(page.locator('#rental-life a[href="/experiences"]')).to_have_count(1);await expect(page.locator('#rental-life a[href="/discover/services"]')).to_have_count(1)
    periods=page.locator('#rental-search .home-search-duration button')
    await expect(periods).to_have_count(3)
    if width <= 390:
     form=await page.locator('#rental-search form').bounding_box()
     assert form and form['y'] < 480,(lang,width,'search should appear immediately after the marketplace introduction',form)
    for period in await periods.all():
     m=await period.evaluate('''node=>{const box=node.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(node);const lines=[...range.getClientRects()];return {width:box.width,height:box.height,clipped:lines.some(r=>r.x<box.x-1||r.right>box.right+1),lines:new Set(lines.filter(r=>r.width>0).map(r=>Math.round(r.y))).size}}''')
     assert m['width']>=44 and m['height']>=44 and not m['clipped'],(lang,width,'rental period clipped or undersized',m)
     if lang=='ru':assert m['lines']==1,(lang,width,'rental period label broke across lines',m)
    assert await page.evaluate('window.fixtureRentRead.filters.listingType')=='rent'
    assert await page.evaluate('window.fixtureProjectRead.ids')==['synthetic-community']
    await page.screenshot(path=str(out/f'{lang}-{width}.png'),full_page=True)
    # The real request form must mount and reject incomplete data without any backend call.
    request_form=page.locator('form').filter(has=page.locator('input[type="tel"]'))
    await expect(request_form).to_have_count(1)
    await request_form.locator('button[type="submit"]').click()
    await expect(request_form.get_by_role('alert')).to_be_visible()
    # Native controls use the existing canonical search; optional dates stay absent.
    await page.locator('#rental-search input[type="search"]').fill('Synthetic home')
    await page.locator('#rental-search button[type="submit"]').click()
    await expect(page.get_by_test_id('location')).to_contain_text('/property/search?mode=rent')
    await expect(page.get_by_test_id('location')).to_contain_text('q=Synthetic+home')
    assert not blocked,blocked
    assert not errors,errors
    rows.append({'language':lang,'width':width,'status':'PASS','noExternalRequests':True,'sharedSearch':'PASS'})
    await context.close()
  for theme in ['light','dark']:
   for width in [375,430,1440]:
    blocked=[];errors=[]
    context=await browser.new_context(viewport={'width':width,'height':900},color_scheme=theme,service_workers='block')
    async def contrast_route(r):
     if r.request.url.startswith(base+'/'):await r.continue_()
     else:blocked.append(r.request.url);await r.abort()
    await context.route('**/*',contrast_route)
    page=await context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
    fixture='fixture-dark.html' if theme=='dark' else 'fixture.html'
    await page.goto(f'{base}/{fixture}?lang=en')
    await expect(page.locator('#rental-title')).to_be_visible()
    assert await page.evaluate("document.documentElement.classList.contains('dark')")==(theme=='dark')
    measurements=await assert_computed_contrast(page,[
     ('#rental-search input[type="search"][placeholder]',1,'placeholder'),
     ('#rental-search input[type="number"][placeholder]',1,'placeholder'),
    ])
    assert not blocked,blocked
    assert not errors,errors
    rows.append({'theme':theme,'width':width,'status':'PASS','textContrast':measurements})
    await context.close()
  for state in ['loading','empty','error']:
   context=await browser.new_context(viewport={'width':375,'height':900},service_workers='block');page=await context.new_page()
   async def deny(r):
    if r.request.url.startswith(base+'/'):await r.continue_()
    else:raise AssertionError('External request in state acceptance')
   await context.route('**/*',deny);await page.goto(f'{base}/fixture.html?lang=en&state={state}')
   if state=='loading':await expect(page.get_by_role('status')).to_contain_text('Loading communities')
   elif state=='empty':await expect(page.locator('#rental-communities')).to_contain_text('This selection has no communities')
   else:
    await expect(page.get_by_role('alert')).to_be_visible();await page.get_by_role('button',name='Try again',exact=True).click();await expect(page.locator('.rental-community')).to_have_count(1);await expect(page.get_by_role('alert')).to_have_count(0)
   assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   rows.append({'state':state,'status':'PASS'});await context.close()
  await browser.close()
try:asyncio.run(main())
finally:server.shutdown()
(out/'results.json').write_text(json.dumps(rows,indent=2));print(json.dumps(rows))
