"""Actual catalogue/page/hook, synthetic reads, no external network or business writes."""
import asyncio, json, os, sys
from pathlib import Path
from urllib.parse import urlparse
from playwright.async_api import async_playwright, expect
OUT=Path(sys.argv[1])
async def main():
 results=[]
 async with async_playwright() as p:
  bundled=Path(p.chromium.executable_path)
  executable=str(bundled) if bundled.exists() else ('/usr/bin/chromium' if not os.environ.get('CI') and Path('/usr/bin/chromium').exists() else None)
  if not executable: raise RuntimeError('Installed Playwright Chromium required in CI')
  browser=await p.chromium.launch(executable_path=executable,headless=True)
  for lang in (['ru'] if os.environ.get('CATALOG_BEFORE') else ['en','ru','th']):
   for width in ([390] if os.environ.get('CATALOG_BEFORE') else [320,375,390,430,1440]):
    context=await browser.new_context(viewport={'width':width,'height':900},service_workers='block')
    errors=[];blocked=[]
    async def route(r):
     parsed=urlparse(r.request.url);name='fixture.html' if parsed.path=='/fixture' else parsed.path.lstrip('/')
     types={'fixture.html':'text/html','fixture.js':'text/javascript','fixture.css':'text/css','synthetic-property.svg':'image/svg+xml'}
     if parsed.netloc=='localhost:8080' and name in types:await r.fulfill(path=str(OUT/name),content_type=types[name])
     else:blocked.append(r.request.url);await r.abort()
    await context.route('**/*',route)
    page=await context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
    await page.goto(f'http://localhost:8080/fixture?lang={lang}&entry=/property/browse')
    grid=page.get_by_test_id('property-results-grid')
    await expect(grid).to_be_visible()
    if os.environ.get('CATALOG_BEFORE'):
     await page.screenshot(path=str(OUT/f'before-{lang}-{width}.png'),full_page=False)
     results.append({'lang':lang,'width':width,'mode':await page.locator('[data-property-mode]').get_attribute('data-property-mode'),'rendered':await grid.locator(':scope > *').count(),'requests':await page.evaluate('window.fixtureCatalog.calls.map(c=>c.operations)')})
     await context.close();continue
    await expect(page.locator('[data-property-mode]')).to_have_attribute('data-property-mode','all')
    # Scroll and explicit Load more share the real infinite-query cursor. Exhaust all pages.
    more=page.get_by_role('button',name={'en':'Load more','ru':'Загрузить ещё','th':'โหลดเพิ่มเติม'}[lang],exact=True)
    for expected in [40,47]:
     if await grid.locator(':scope > *').count()<expected:
      await page.evaluate('scrollTo(0,document.body.scrollHeight)')
      await expect(grid.locator(':scope > *')).to_have_count(expected)
    await expect(grid.locator(':scope > *')).to_have_count(47)
    assert await page.evaluate('new Set(window.fixtureCatalog.calls.map(c=>c.table)).size===1')
    assert not await grid.get_by_text('synthetic-draft',exact=True).count()
    assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(lang,width)
    await page.evaluate('scrollTo(0,0)')
    await page.screenshot(path=str(OUT/f'catalogue-{lang}-{width}.png'),full_page=False)
    query=page.get_by_role('searchbox',name={'en':'Property name','ru':'Название объекта','th':'ชื่อที่พัก'}[lang])
    submit=page.get_by_role('button',name={'en':'Find a home','ru':'Найти жильё','th':'ค้นหาที่พัก'}[lang],exact=True)
    await query.fill('Needle');await submit.click();await expect(grid.locator(':scope > *')).to_have_count(1)
    await expect(grid).to_contain_text('Needle')
    await query.fill('Absent');await submit.click()
    reset=page.get_by_role('button',name={'en':'Reset filters','ru':'Сбросить фильтры','th':'ล้างตัวกรอง'}[lang],exact=True)
    await expect(reset).to_be_visible();await page.screenshot(path=str(OUT/f'empty-{lang}-{width}.png'));await reset.click();await expect(grid).to_be_visible()
    await page.get_by_test_id('history-back').click();await expect(reset).to_be_visible()
    await page.get_by_test_id('history-forward').click();await expect(grid).to_be_visible()
    await query.fill('Slow');await submit.click();await query.fill('Needle');await submit.click()
    await expect(grid.locator(':scope > *')).to_have_count(1);await expect(grid).to_contain_text('Needle')
    await page.wait_for_timeout(250);await expect(grid).to_contain_text('Needle')
    await page.get_by_role('button',name={'en':'Map','ru':'Карта','th':'แผนที่'}[lang],exact=True).click()
    await expect(page.get_by_test_id('synthetic-map')).to_be_visible()
    await expect(page.get_by_test_id('synthetic-map')).to_have_attribute('data-ids','synthetic-home-035')
    assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    await page.screenshot(path=str(OUT/f'filtered-{lang}-{width}.png'),full_page=False)
    assert not errors,errors
    assert not blocked,blocked
    results.append({'lang':lang,'width':width,'status':'PASS','published_count':47,'blocked_external':len(blocked),'pageerrors':errors})
    await context.close()
  if not os.environ.get('CATALOG_BEFORE'):
   # A separate case exercises the actual button without competing auto-scroll loads.
   context=await browser.new_context(viewport={'width':390,'height':900},service_workers='block')
   await context.add_init_script("window.IntersectionObserver=class {observe(){} unobserve(){} disconnect(){} takeRecords(){return []}}")
   blocked=[];errors=[]
   await context.route('**/*',route)
   page=await context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
   await page.goto('http://localhost:8080/fixture?lang=en&entry=/property/browse')
   grid=page.get_by_test_id('property-results-grid');await expect(grid.locator(':scope > *')).to_have_count(20)
   more=page.get_by_role('button',name='Load more',exact=True)
   await more.click();await expect(grid.locator(':scope > *')).to_have_count(40)
   await more.click();await expect(grid.locator(':scope > *')).to_have_count(47)
   await expect(more).to_have_count(0)
   assert not errors,errors
   assert not blocked,blocked
   results.append({'lang':'en','width':390,'variant':'manual-pagination','status':'PASS','published_count':47,'pageerrors':errors})
   await context.close()
  await browser.close()
 if not os.environ.get('CATALOG_BEFORE'): assert len(results)==16 and all(case['status']=='PASS' for case in results)
 (OUT/'results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2));print(json.dumps({'cases':len(results),'output':str(OUT)}))
asyncio.run(main())
