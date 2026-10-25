import asyncio,json,sys,shutil
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
from dialog_readiness import wait_for_dialog_ready
from urllib.parse import urlparse,urlencode
from playwright.async_api import async_playwright,expect
out=Path(sys.argv[1])
async def main():
 rows=[]
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox'])
  for lang,width,theme in [(lang,width,theme) for lang in ['ru','en','th'] for width in [390,1440] for theme in ['light','dark']]:
   context=await browser.new_context(viewport={'width':width,'height':900},service_workers='block');errors=[];blocked=[]
   async def route(r):
    u=urlparse(r.request.url);name='fixture.html' if u.path=='/fixture' else u.path.lstrip('/');types={'fixture.html':'text/html','fixture.js':'text/javascript','fixture.css':'text/css','image-a.svg':'image/svg+xml','image-b.svg':'image/svg+xml'}
    if u.netloc=='localhost:8080' and r.request.method=='GET' and name in types:await r.fulfill(path=str(out/name),content_type=types[name])
    else:blocked.append(r.request.url);await r.abort()
   await context.route('**/*',route);page=await context.new_page();page.on('pageerror',lambda e:errors.append(str(e)));row={'lang':lang,'width':width,'theme':theme,'outcome':'FAIL'};prefix=f'{lang}-{width}-{theme}'
   try:
    await page.goto('http://localhost:8080/fixture?'+urlencode({'lang':lang,'theme':theme}),wait_until='domcontentloaded');await page.get_by_role('heading',name='Shared public surface candidate',exact=True).wait_for();await page.evaluate('document.fonts.ready')
    assert not errors,errors
    assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth'),'overflow'
    risk=page.get_by_text('Высокий риск затопления' if lang=='ru' else 'High flood risk',exact=True);await expect(risk).to_be_visible()
    row['dangerChip']=await risk.locator('..').evaluate('(e)=>({color:getComputedStyle(e).color,background:getComputedStyle(e).backgroundColor,border:getComputedStyle(e).borderColor})')
    await page.screenshot(path=str(out/f'{prefix}-overview.png'),full_page=True)
    for state in ['warning','success','unavailable']:
     opener=page.get_by_role('button',name='Open '+state,exact=True);await opener.click();dialog=page.get_by_role('dialog');await expect(dialog).to_be_visible()
     await wait_for_dialog_ready(page,dialog,keyboard=True,failure_path=out/f'{prefix}-{state}-readiness')
     await page.screenshot(path=str(out/f'{prefix}-signup-{state}.png'),full_page=True)
     await page.keyboard.press('Escape');await expect(dialog).to_have_count(0)
    if lang in ['ru','en']:
     remove=page.get_by_role('button',name='Удалить фото 2' if lang=='ru' else 'Remove photo 2',exact=True);await remove.focus();await remove.press('Enter');await expect(remove).to_have_count(0);assert await page.evaluate('window.fixtureImages')==['/image-a.svg']
    assert not await page.evaluate('window.fixtureForbidden')
    assert not errors and not blocked,(errors,blocked)
    row['outcome']='PASS'
   except Exception as e:
    row['error']=str(e);row['errors']=errors;row['blocked']=blocked;await page.screenshot(path=str(out/f'{prefix}-FAIL.png'),full_page=True)
   rows.append(row);print(json.dumps(row),flush=True);await context.close()
  await browser.close()
 (out/'results.json').write_text(json.dumps(rows,indent=2));assert len(rows)==12 and all(r['outcome']=='PASS' for r in rows)
asyncio.run(main())
