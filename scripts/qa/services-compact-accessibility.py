"""Actual embedded catalogue + request form; synthetic read/write boundary, no live requests."""
import asyncio,json,sys
from pathlib import Path
from urllib.parse import urlparse,urlencode
from playwright.async_api import async_playwright,expect
OUTPUT=Path(sys.argv[1]);BEFORE='--before' in sys.argv
async def main():
 rows=[]
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None,headless=True,args=['--no-sandbox'])
  for lang in (['en'] if BEFORE else ['en','ru']):
   for width in [390,768,1440]:
    context=await browser.new_context(viewport={'width':width,'height':1000},service_workers='block');errors=[];blocked=[]
    async def route(r):
     u=urlparse(r.request.url);name='fixture.html' if u.path=='/fixture' else u.path.lstrip('/')
     types={'fixture.html':'text/html','fixture.js':'text/javascript','fixture.css':'text/css'}
     if u.netloc=='localhost:8080' and r.request.method=='GET' and name in types:await r.fulfill(path=str(OUTPUT/name),content_type=types[name])
     else:blocked.append({'url':r.request.url,'method':r.request.method});await r.abort()
    await context.route('**/*',route);page=await context.new_page();page.on('pageerror',lambda e:errors.append(str(e)));prefix=('BEFORE-' if BEFORE else '')+f'{lang}-{width}';row={'lang':lang,'width':width,'outcome':'FAIL'}
    async def goto(**query):await page.goto('http://localhost:8080/fixture?'+urlencode({'lang':lang,**query}),wait_until='domcontentloaded');await page.evaluate('document.fonts.ready')
    try:
     if not BEFORE and width in [390,1440]:
      await goto(mode='groups')
      group=page.get_by_test_id('service-catalogue-results')
      await expect(page.get_by_test_id('service-discovery-menu')).to_be_visible()
      await page.locator('[data-category-id=cat-transport]').click()
      await expect(group.get_by_role('link')).to_have_count(4)
      await expect(group.locator('a[href="/transport/airport-transfer"]')).to_be_visible()
      await expect(group.locator('a[href="/transport/fast-track"]')).to_be_visible()
      await page.get_by_role('button',name='Reset all' if lang=='en' else 'Сбросить всё',exact=True).click()
      search=page.get_by_role('searchbox')
      await search.fill('Flowers')
      await expect(group.get_by_role('link')).to_have_count(1)
      await expect(group.locator('a[href="/flowers"]')).to_be_visible()
      await expect(page.get_by_test_id('location')).to_contain_text('q=Flowers')
      assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth')
      await page.screenshot(path=str(OUTPUT/f'{prefix}-groups-search.png'),full_page=True)
     await goto();await expect(page.get_by_test_id('service-discovery-menu')).to_be_visible();assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth');await page.screenshot(path=str(OUTPUT/f'{prefix}-catalogue.png'),full_page=True)
     if BEFORE:
      await goto(entry='/services/order/deep_cleaning');await expect(page.locator('form')).to_be_visible();await page.screenshot(path=str(OUTPUT/f'{prefix}-form.png'),full_page=True);row['outcome']='BEFORE_CAPTURE'
     else:
      help_button=page.get_by_role('button',name='Describe your task' if lang=='en' else 'Описать задачу',exact=True);await help_button.click();dialog=page.get_by_role('dialog');await expect(dialog).to_be_visible();await expect(dialog.get_by_placeholder('For example: help with plumbing' if lang=='en' else 'Например: помощь с сантехникой')).to_be_visible()
      await dialog.locator('#hr-message').fill('Synthetic task with no real submission');await dialog.get_by_role('button',name='Send to a concierge' if lang=='en' else 'Отправить').click();await expect(dialog.locator('#hr-email')).to_have_attribute('aria-invalid','true');assert await page.evaluate('window.fixtureInquiries.length')==0;await page.screenshot(path=str(OUTPUT/f'{prefix}-help-contact.png'),full_page=True)
      await dialog.locator('#hr-email').fill('synthetic@example.test');await dialog.get_by_role('button',name='Send to a concierge' if lang=='en' else 'Отправить').click();await expect(dialog.get_by_role('alert')).to_be_visible();assert await page.evaluate('window.fixtureInquiries.length')==1;await page.keyboard.press('Escape');await expect(dialog).to_have_count(0);await expect(help_button).to_be_focused()
      await page.locator('[data-category-id=cat-home-services]').click()
      await expect(page.locator('[data-home-category-id]')).to_have_count(11);await page.locator('[data-home-category-id=cleaning]').click()
      await expect(page.get_by_test_id('location')).to_contain_text('category=cleaning');await page.get_by_role('button',name='QA history back').click();await expect(page.get_by_test_id('location')).to_have_text('/discover/services?category=cat-home-services');await page.get_by_role('button',name='QA history forward').click();await expect(page.get_by_test_id('location')).to_contain_text('category=cleaning')
      card=page.get_by_test_id('service-request-card').filter(has_text='Deep Cleaning' if lang=='en' else 'Генеральная уборка').first;await card.focus();await card.press('Enter');await expect(page.get_by_test_id('location')).to_contain_text('/services/order/deep_cleaning?returnTo=%2Fdiscover%2Fservices%3Fcategory%3Dcleaning')
      for label in (['Address','Preferred Date','Describe the problem','Your name','Phone'] if lang=='en' else ['Адрес','Предпочтительная дата','Опишите проблему','Ваше имя','Телефон']):await expect(page.get_by_label(label,exact=False).first).to_be_visible()
      await expect(page.get_by_role('radiogroup',name='Preferred Time' if lang=='en' else 'Удобное время')).to_be_visible();await expect(page.get_by_role('radiogroup',name='How to contact you?' if lang=='en' else 'Как с вами связаться?')).to_be_visible()
      await page.get_by_role('button',name='Submit Request' if lang=='en' else 'Отправить заявку',exact=True).click();await expect(page.locator('[aria-invalid="true"]').first).to_be_visible();assert await page.evaluate('window.fixtureAttempts.length')==0;await page.screenshot(path=str(OUTPUT/f'{prefix}-invalid.png'),full_page=True)
      await page.get_by_label('Address' if lang=='en' else 'Адрес',exact=False).first.fill('Synthetic address');await page.get_by_label('Your name' if lang=='en' else 'Ваше имя',exact=False).fill('Synthetic person');await page.get_by_label('Phone' if lang=='en' else 'Телефон',exact=False).first.fill('+66000000000');await page.get_by_role('button',name='Submit Request' if lang=='en' else 'Отправить заявку',exact=True).click();await expect(page.get_by_text('Isolated auth destination')).to_be_visible();assert await page.evaluate('window.fixtureAttempts.length')==0
      await goto(actor='member',entry='/services/order/deep_cleaning?returnTo=%2Fdiscover%2Fservices%3Fcategory%3Dcleaning');await page.get_by_label('Address' if lang=='en' else 'Адрес',exact=False).first.fill('Synthetic address');await page.get_by_label('Your name' if lang=='en' else 'Ваше имя',exact=False).fill('Synthetic person');await page.get_by_label('Phone' if lang=='en' else 'Телефон',exact=False).first.fill('+66000000000');submit=page.get_by_role('button',name='Submit Request' if lang=='en' else 'Отправить заявку',exact=True);await submit.click();await expect(page.get_by_role('alert')).to_be_visible();assert await page.evaluate('window.fixtureAttempts.length')==1;await page.screenshot(path=str(OUTPUT/f'{prefix}-retry.png'),full_page=True);await submit.click();assert await page.evaluate('window.fixtureAttempts.length')==2
      await page.get_by_role('button',name='Go back',exact=True).click();await expect(page.get_by_test_id('location')).to_have_text('/discover/services?category=cleaning')
      await goto(mode='loading');await expect(page.get_by_role('status',name='Loading services' if lang=='en' else 'Загружаем услуги')).to_be_visible();await page.screenshot(path=str(OUTPUT/f'{prefix}-marketplace-loading.png'),full_page=True)
      await goto(mode='error');market_error=page.get_by_text('Could not load services.' if lang=='en' else 'Не удалось загрузить услуги.',exact=True);await expect(market_error).to_be_visible();await page.get_by_role('button',name='Retry' if lang=='en' else 'Повторить',exact=True).click();await expect(market_error).to_have_count(0);await expect(page.get_by_text('No published provider offers yet. Choose a catalogue section or describe your task.' if lang=='en' else 'Пока нет опубликованных предложений специалистов. Выберите раздел каталога или опишите задачу.',exact=True)).to_be_visible();assert await page.evaluate('window.fixtureAttempts.length')==0
      await goto(entry='/discover/services?category=unavailable-fixture');await expect(page.get_by_text('No services found' if lang=='en' else 'Услуги не найдены',exact=True)).to_be_visible();await page.get_by_role('button',name='Clear search and filters' if lang=='en' else 'Сбросить поиск и фильтры',exact=True).click();await expect(page.get_by_test_id('location')).to_have_text('/discover/services');await expect(page.get_by_test_id('service-discovery-menu')).to_be_visible()
      assert not errors and not blocked,(errors,blocked);assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth');row['outcome']='PASS'
    except Exception as e:row['error']=str(e);row['pageErrors']=errors;row['blocked']=blocked;await page.screenshot(path=str(OUTPUT/f'{prefix}-FAIL.png'),full_page=True)
    rows.append(row);print(json.dumps(row),flush=True);await context.close()
  await browser.close()
 result={'cases':rows,'limits':['Actual embedded catalogue and request form; not shared App/header acceptance','Synthetic order failure interception only, no real persistence/payment/geolocation','Fallback fonts; EN/RU existing form locales']};(OUTPUT/('before-results.json' if BEFORE else 'results.json')).write_text(json.dumps(result,indent=2));assert all(r['outcome']in['PASS','BEFORE_CAPTURE']for r in rows),result
asyncio.run(main())
