"""Actual closed Chat + actual form/BottomBar. Synthetic Orders content model; no backend or AI."""
import asyncio,json,sys
from pathlib import Path
from urllib.parse import urlparse,urlencode
from playwright.async_api import async_playwright,expect
OUT=Path(sys.argv[1]);BEFORE='--before'in sys.argv
async def main():
 rows=[]
 async with async_playwright()as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None,headless=True,args=['--no-sandbox'])
  for lang in ['en','ru']:
   for width in [390,768,1440]:
    for enlarged in [False,True]:
     context=await browser.new_context(viewport={'width':width,'height':900},service_workers='block');blocked=[];errors=[]
     async def route(r):
      u=urlparse(r.request.url);name='fixture.html'if u.path=='/fixture'else u.path.lstrip('/');types={'fixture.html':'text/html','fixture.js':'text/javascript','fixture.css':'text/css'}
      if u.netloc=='localhost:8080'and r.request.method=='GET'and name in types:await r.fulfill(path=str(OUT/name),content_type=types[name])
      else:blocked.append(r.request.url);await r.abort()
     await context.route('**/*',route);page=await context.new_page();page.on('pageerror',lambda e:errors.append(str(e)));prefix=('BEFORE-'if BEFORE else'')+f'{lang}-{width}-{enlarged}';row={'lang':lang,'width':width,'enlarged':enlarged}
     try:
      async def goto(entry):await page.goto('http://localhost:8080/fixture?'+urlencode({'lang':lang,'enlarged':str(enlarged).lower(),'entry':entry}),wait_until='domcontentloaded');await page.evaluate('document.fonts.ready')
      await goto('/services/order/deep_cleaning');await expect(page.locator('form')).to_be_visible();await page.evaluate('window.scrollTo(0,document.documentElement.scrollHeight)');last=page.locator('#contact-line');await last.focus();await last.press('Space');await expect(last).to_have_attribute('aria-checked','true');await page.evaluate('window.scrollTo(0,document.documentElement.scrollHeight)');await page.evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')
      if not BEFORE:
       for option in ['whatsapp','phone','line']:
        hit=await page.locator(f'label[for="contact-{option}"]').bounding_box();circle=await page.locator(f'#contact-{option}').bounding_box()
        assert hit['height']>=44 and hit['x']>=0 and hit['x']+hit['width']<=width,(option,hit)
        assert abs(circle['width']-circle['height'])<1,(option,circle)
      footer=await page.locator('form .fixed.bottom-0').bounding_box();fab=await page.locator('[data-global-chat-launcher]').bounding_box();control=await last.bounding_box();label=await page.locator('label[for="contact-line"]').bounding_box();await expect(last).to_be_focused();assert label;assert footer and fab and control;row.update({'footer':footer,'chat':fab,'lastControl':control,'chatGap':footer['y']-(fab['y']+fab['height']),'controlGap':footer['y']-(control['y']+control['height']),'lastLabel':label,'labelGap':footer['y']-(label['y']+label['height'])});await page.screenshot(path=str(OUT/f'{prefix}-request.png'))
      row['labelIntersectsChat']=not(label['x']+label['width']<=fab['x'] or fab['x']+fab['width']<=label['x'] or label['y']+label['height']<=fab['y'] or fab['y']+fab['height']<=label['y'])
      if not BEFORE:assert not row['labelIntersectsChat'] and row['chatGap']>=15.9 and row['controlGap']>=15.9 and row['labelGap']>=15.9,row
      await page.get_by_test_id('leave-request').click();row['restoredVariable']=await page.evaluate('document.documentElement.style.getPropertyValue("--service-request-action-height")');assert row['restoredVariable']==''
      for path,name in [('/discover/services','services'),('/bookings','orders-model')]:
       await goto(path);await expect(page.locator('[data-global-chat-launcher]')).to_be_visible();nav=page.get_by_role('navigation').last
       if width<768:
        # BottomBar's real outer fixed node, not a token-derived height model.
        bar=page.locator('.fixed.bottom-0').last;b=await bar.bounding_box();c=await page.locator('[data-global-chat-launcher]').bounding_box();assert b and c;gap=b['y']-(c['y']+c['height']);row[name+'Gap']=gap
        if not BEFORE:assert gap>=15.9,(name,gap,b,c)
       else:
        await expect(page.locator('.fixed.bottom-0').last).to_be_hidden();c=await page.locator('[data-global-chat-launcher]').bounding_box();assert c;row[name+'ViewportBottomGap']=900-(c['y']+c['height']);assert row[name+'ViewportBottomGap']>=15.9
       await page.screenshot(path=str(OUT/f'{prefix}-{name}.png'))
      assert await page.evaluate('window.fixtureAttempts.length===0&&window.fixtureInquiries.length===0');assert not blocked and not errors,(blocked,errors);row['outcome']='OBSERVED'if BEFORE else'PASS'
     except Exception as e:row['outcome']='FAIL';row['error']=str(e);row['blocked']=blocked;row['pageErrors']=errors
     rows.append(row);print(json.dumps(row),flush=True);await context.close()
  await browser.close()
 (OUT/('before-results.json'if BEFORE else'results.json')).write_text(json.dumps({'cases':rows,'limits':['Actual closed Chat/form/BottomBar; embedded services, synthetic Orders content only','Fallback fonts; 150% root text size; no AI/PWA/geolocation/order writes']},indent=2));assert all(r['outcome']in['PASS','OBSERVED']for r in rows)
asyncio.run(main())
