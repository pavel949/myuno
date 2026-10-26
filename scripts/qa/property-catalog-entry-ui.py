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
  if not os.environ.get('CATALOG_BEFORE'):
   # Actual header/bottom navigation and direct All bookmarks, never substitute nav links.
   for lang in ['en','ru','th']:
    for width in [320,390,1440]:
     context=await browser.new_context(viewport={'width':width,'height':900},service_workers='block')
     blocked=[];errors=[];await context.route('**/*',route)
     page=await context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
     homes={'en':'Homes','ru':'Жильё','th':'ที่พัก'}[lang]
     start=f'http://localhost:8080/fixture?lang={lang}&navEntry=1&entry=/fixture-start'
     await page.goto(start)
     if width<768:
      bottom=page.get_by_test_id('actual-bottom').get_by_role('link',name=homes,exact=True)
      await expect(bottom).to_have_attribute('href','/property');await bottom.click()
      await expect(page.locator('[data-property-mode]')).to_have_attribute('data-property-mode','all')
      await expect(page.get_by_test_id('property-results-grid').locator(':scope > *')).to_have_count(20)
      assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth')
      await page.screenshot(path=str(OUT/f'actual-bottom-tab-{lang}-{width}.png'))
      await page.goto(start)
      await page.get_by_test_id('actual-header').get_by_role('button',name={'en':'Open menu','ru':'Открыть меню','th':'เปิดเมนู'}[lang]).click()
      link=page.get_by_role('dialog').get_by_role('link',name=homes,exact=True)
     else:link=page.get_by_test_id('actual-header').get_by_role('navigation').get_by_role('link',name=homes,exact=True)
     await expect(link).to_have_attribute('href','/property');await link.click()
     await expect(page.locator('[data-property-mode]')).to_have_attribute('data-property-mode','all')
     await expect(page.get_by_test_id('property-results-grid').locator(':scope > *')).to_have_count(20)
     if width<768: await expect(page.get_by_role('dialog')).to_have_count(0)
     assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth')
     await page.screenshot(path=str(OUT/f'actual-homes-tab-{lang}-{width}.png'))
     assert await page.evaluate("window.fixtureCatalog.calls.every(c=>!c.operations.some(op=>op[0]==='or'&&String(op[1]).includes('listing_type.eq.rent')))")
     # Explicit goal remains rental-specific, unlike the general Homes tab.
     await page.goto(f'http://localhost:8080/fixture?lang={lang}&entry=/discover/stay&tenancy=short')
     await expect(page.locator('[data-property-mode]')).to_have_attribute('data-property-mode','rent')
     await expect(page.get_by_test_id('property-results-grid').locator(':scope > *')).to_have_count(15)
     hidden='mode=all&guests=8&instant=1&f.guestsAtLeast=10&f.instantBooking=yes&tenancy=long&checkIn=2027-05-01&checkOut=2027-05-03&f.priceLevel=3'
     await page.goto(f'http://localhost:8080/fixture?lang={lang}&entry=/property/search&priceCases=1&opaque=keep&sort=price_asc&{hidden}#results')
     grid=page.get_by_test_id('property-results-grid');await expect(grid.locator(':scope > *')).to_have_count(20)
     current=await page.get_by_test_id('location').text_content()
     assert not any(key in current for key in ['guests=','instant=','f.guestsAtLeast=','f.instantBooking=','checkIn=','checkOut=','tenancy=','f.priceLevel=']),current
     assert 'opaque=keep'in current and current.endswith('#results'),current
     await expect(page.get_by_test_id('navigation-state')).to_contain_text('synthetic-navigation')
     assert await page.evaluate("window.fixtureCatalog.calls.every(c=>!c.operations.some(op=>op[0]==='gte'&&op[1]==='max_guests'||op[0]==='eq'&&op[1]==='instant_booking'))")
     cards=grid.locator('[data-listing-id]')
     assert await cards.evaluate_all('(nodes)=>nodes.slice(0,3).map(el=>el.dataset.listingId)')==['synthetic-home-003','synthetic-home-006','synthetic-home-000']
     for i,amount in enumerate(['1,000,000','2,000,000','3,000,000']):await expect(cards.nth(i)).to_contain_text(amount)
     groups=await grid.locator(':scope > [data-property-price-group]').evaluate_all('(nodes)=>nodes.map(el=>el.dataset.propertyPriceGroup)')
     assert groups==sorted(groups),groups
     await expect(page.get_by_test_id('property-price-sort-note')).to_be_visible()
     sort=page.get_by_role('combobox',name={'en':'Sort homes','ru':'Сортировка','th':'เรียงลำดับที่พัก'}[lang]);await sort.press('Enter')
     await page.get_by_role('option',name={'en':'Price: High → Low','ru':'Цена: по убыванию','th':'ราคา: สูงไปต่ำ'}[lang],exact=True).press('Enter')
     await expect(cards.first).to_have_attribute('data-listing-id','synthetic-home-018')
     groups=await grid.locator(':scope > [data-property-price-group]').evaluate_all('(nodes)=>nodes.map(el=>el.dataset.propertyPriceGroup)');assert groups==sorted(groups),groups
     await page.get_by_role('button',name={'en':'Rent','ru':'Аренда','th':'เช่า'}[lang],exact=True).click()
     await expect(page.locator('[data-property-mode]')).to_have_attribute('data-property-mode','rent')
     await page.get_by_test_id('history-back').click();await expect(page.locator('[data-property-mode]')).to_have_attribute('data-property-mode','all')
     history_location = await page.get_by_test_id('location').text_content()
     assert not any(key in history_location for key in ['guests=','instant=','tenancy=']),history_location
     await expect(page.get_by_test_id('navigation-state')).to_contain_text('synthetic-navigation')
     await page.get_by_test_id('history-forward').click();await expect(page.locator('[data-property-mode]')).to_have_attribute('data-property-mode','rent')
     await page.get_by_test_id('history-back').click();await expect(page.locator('[data-property-mode]')).to_have_attribute('data-property-mode','all')
     assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth')
     await page.screenshot(path=str(OUT/f'actual-nav-grouped-price-{lang}-{width}.png'))
     assert not errors and not blocked,(errors,blocked)
     results.append({'lang':lang,'width':width,'variant':'actual-navigation-price-stay-regressions','status':'PASS','header':'actual','bottom':'actual'if width<768 else'hidden desktop','grouped_visible_prices':'PASS','no_hidden_stay':'PASS','history_state':'PASS'})
     await context.close()
  await browser.close()
 if not os.environ.get('CATALOG_BEFORE'): assert len(results)==25 and all(case['status']=='PASS' for case in results)
 (OUT/'results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2));print(json.dumps({'cases':len(results),'output':str(OUT)}))
asyncio.run(main())
