"""Real primitives: responsive actions, validation, long dialogs, layered controls."""
import asyncio,json,sys
from pathlib import Path
from urllib.parse import urlparse
from playwright.async_api import async_playwright,expect
OUTPUT=Path(sys.argv[1])
async def main():
 results=[]
 async with async_playwright() as p:
  browser=await p.chromium.launch()
  for lang in ['ru','en']:
   for width in [320,375,390,430,768,1024,1440,1920]:
    for theme in ['light','dark']:
     context=await browser.new_context(viewport={'width':width,'height':640},reduced_motion='reduce',service_workers='block')
     errors=[];blocked=[]
     async def route(r):
      u=urlparse(r.request.url);name='fixture.html' if u.path=='/fixture' else u.path.lstrip('/')
      types={'fixture.html':'text/html','fixture.js':'text/javascript','fixture.css':'text/css'}
      if u.netloc=='localhost:8080' and name in types:await r.fulfill(path=str(OUTPUT/name),content_type=types[name])
      else:blocked.append(r.request.url);await r.abort()
     await context.route('**/*',route)
     page=await context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
     try:
      await page.goto('http://localhost:8080/fixture?lang='+lang)
      await page.evaluate('(theme)=>document.documentElement.classList.toggle("dark",theme==="dark")',theme)
      save='Сохранить изменения' if lang=='ru' else 'Save changes'
      extra='Открыть документы' if lang=='ru' else 'Open documents'
      for label in [save,extra]:
       button=page.get_by_role('button',name=label,exact=True);await expect(button).to_be_visible()
       assert await button.locator('span').is_visible(),'Action label hidden'
      await page.get_by_role('button',name='Validate',exact=True).click()
      await expect(page.get_by_role('alert')).to_have_text('Укажите электронную почту' if lang=='ru' else 'Enter your email')
      await expect(page.get_by_role('textbox')).to_have_attribute('aria-invalid','true')
      await expect(page.get_by_role('button',name='Disabled',exact=True)).to_be_disabled()
      async def bounds(locator):
       await expect(locator).to_be_visible()
       await page.wait_for_function('el => {const b=el.getBoundingClientRect();return b.x>=-1 && b.y>=-1 && b.right<=innerWidth+1 && b.bottom<=innerHeight+1}',arg=await locator.element_handle())
       box=await locator.bounding_box();assert box and box['x']>=-1 and box['y']>=-1 and box['x']+box['width']<=width+1 and box['y']+box['height']<=641,box
       assert await locator.evaluate('(el)=>el.scrollWidth<=el.clientWidth+1')
      assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth')
      trigger=page.get_by_role('button',name='Dialog',exact=True);await trigger.click()
      dialog=page.get_by_role('dialog');await expect(dialog).to_be_visible();await bounds(dialog)
      assert await dialog.evaluate('(el)=>Number(getComputedStyle(el).zIndex)>100')
      await page.screenshot(path=str(OUTPUT/f'{lang}-{width}-{theme}-dialog.png'))
      await dialog.get_by_role('button',name='Done',exact=True).click();await expect(dialog).to_have_count(0);await expect(trigger).to_be_focused()
      await trigger.press('Enter');await bounds(dialog);await expect(dialog.locator(':focus')).to_have_count(1);await page.keyboard.press('Escape');await expect(dialog).to_have_count(0);await expect(trigger).to_be_focused()
      await trigger.click();await bounds(dialog);await page.evaluate('() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');await page.mouse.click(2,2);await expect(dialog).to_have_count(0)
      sheetTrigger=page.get_by_role('button',name='Sheet',exact=True);await sheetTrigger.click();await expect(dialog).to_be_visible();await bounds(dialog)
      await dialog.get_by_role('button',name='Popover',exact=True).click()
      popup=page.get_by_role('button',name='Popover action',exact=True);await expect(popup).to_be_visible();await popup.click()
      await page.keyboard.press('Escape')
      await dialog.get_by_role('button',name='Options',exact=True).click();menu=page.get_by_role('menu');await expect(menu).to_be_visible();await bounds(menu)
      await menu.get_by_role('menuitem',name='Option 30',exact=True).click();await expect(menu).to_have_count(0)
      await page.keyboard.press('Escape');await expect(dialog).to_have_count(0);await expect(sheetTrigger).to_be_focused()
      await page.screenshot(path=str(OUTPUT/f'{lang}-{width}-{theme}.png'))
      assert not errors,errors
      # Font URLs may be requested, but all external requests are denied.
      assert all('/fonts/' in x for x in blocked),blocked
      results.append({'language':lang,'width':width,'theme':theme,'outcome':'PASS','errors':errors})
     except Exception as e:
      results.append({'language':lang,'width':width,'theme':theme,'outcome':'FAIL','error':str(e)})
      await page.screenshot(path=str(OUTPUT/f'FAIL-{lang}-{width}-{theme}.png'))
      raise
     finally:
      (OUTPUT/'results.json').write_text(json.dumps(results,indent=2));await context.close()
  await browser.close()
 assert len(results)==32
 print('PASS: 32 responsive shared-surface scenarios')
asyncio.run(main())
