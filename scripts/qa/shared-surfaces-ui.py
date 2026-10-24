"""Real primitives: responsive actions, validation, long dialogs, layered controls."""
import asyncio,json,sys,shutil,os
from pathlib import Path
from urllib.parse import urlparse
from playwright.async_api import async_playwright,expect
OUTPUT=Path(sys.argv[1])
REPRESENTATIVE=os.environ.get('SHARED_SURFACES_REPRESENTATIVE')=='1'
EXPECTED_PADDING=float(os.environ.get('SHARED_SURFACES_EXPECT_CARD_PADDING','16'))
async def main():
 results=[]
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path=shutil.which('chromium'),args=['--no-sandbox'])
  for lang in (['ru'] if REPRESENTATIVE else ['ru','en']):
   for width in ([390,1440] if REPRESENTATIVE else [320,375,390,430,768,1024,1440,1920]):
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
      error_contrast=await page.get_by_role('alert').evaluate(r"""el=>{
       const rgb=s=>(s.match(/[\d.]+/g)||[]).map(Number);
       const lum=c=>c.slice(0,3).map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((a,x,i)=>a+x*[.2126,.7152,.0722][i],0);
       let bg;for(let node=el;node;node=node.parentElement){const c=rgb(getComputedStyle(node).backgroundColor);if(c.length===3||c[3]===1){bg=c;break;}}
       if(!bg)throw Error('No opaque error-message background found');
       const a=lum(rgb(getComputedStyle(el).color)),b=lum(bg);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
      }""")
      assert error_contrast>=4.5,f'Error text contrast {error_contrast}'

      await expect(page.get_by_role('button',name='Disabled',exact=True)).to_be_disabled()
      async def bounds(locator):
       await expect(locator).to_be_visible()
       await page.wait_for_function('el => {const b=el.getBoundingClientRect();return b.x>=-1 && b.y>=-1 && b.right<=innerWidth+1 && b.bottom<=innerHeight+1}',arg=await locator.element_handle())
       box=await locator.bounding_box();assert box and box['x']>=-1 and box['y']>=-1 and box['x']+box['width']<=width+1 and box['y']+box['height']<=641,box
       assert await locator.evaluate('(el)=>el.scrollWidth<=el.clientWidth+1')
      assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth')
      assert await page.get_by_test_id('canonical-card-header').evaluate('(el)=>parseFloat(getComputedStyle(el).paddingLeft)') == EXPECTED_PADDING
      assert await page.get_by_test_id('canonical-section').locator('..').evaluate('(el)=>parseFloat(getComputedStyle(el).paddingLeft)') == EXPECTED_PADDING
      assert await page.get_by_test_id('canonical-inset').evaluate('(el)=>getComputedStyle(el).boxShadow') == 'none'
      button_size=await page.get_by_test_id('canonical-button-size').evaluate('(el)=>parseFloat(getComputedStyle(el).fontSize)')
      assert button_size==15,f'Canonical Button inherited parent font size: {button_size}'
      assert await page.get_by_test_id('canonical-button-size').evaluate('(el)=>getComputedStyle(el).fontWeight')=='500'
      await page.evaluate("document.documentElement.style.setProperty('--type-body-size','21px')")
      assert await page.get_by_test_id('canonical-button-size').evaluate('(el)=>parseFloat(getComputedStyle(el).fontSize)')==21
      await page.evaluate("document.documentElement.style.removeProperty('--type-body-size')")
      await page.screenshot(path=str(OUTPUT/f'{lang}-{width}-{theme}-primitives.png'),full_page=True)
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
      results.append({'language':lang,'width':width,'theme':theme,'outcome':'PASS','errorTextContrast':error_contrast,'errors':errors})
     except Exception as e:
      results.append({'language':lang,'width':width,'theme':theme,'outcome':'FAIL','error':str(e)})
      await page.screenshot(path=str(OUTPUT/f'FAIL-{lang}-{width}-{theme}.png'))
      raise
     finally:
      (OUTPUT/'results.json').write_text(json.dumps(results,indent=2));await context.close()
  await browser.close()
 expected=4 if REPRESENTATIVE else 32
 assert len(results)==expected
 print(f'PASS: {expected} responsive shared-surface scenarios')
asyncio.run(main())
