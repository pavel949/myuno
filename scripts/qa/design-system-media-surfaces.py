"""Actual isolated viewer/editor/cropper. No auth/upload/AI acceptance.

Asserts actual shared-dialog focus containment, return, close-once behavior
and local cropper interactions; no complete accessibility compliance claim.
"""
import asyncio,json,re,sys
from pathlib import Path
from urllib.parse import urlencode,urlparse
from playwright.async_api import async_playwright,expect
from dialog_readiness import wait_for_dialog_ready
OUT=Path(sys.argv[1]);META=json.loads((OUT/'provenance.json').read_text())
CASES=[(*case,motion) for case in [('en',390,'light'),('en',390,'dark'),('ru',1440,'light'),('ru',1440,'dark')] for motion in ['no-preference','reduce']]

def rgba(value):
 values=[float(x) for x in re.findall(r'[\d.]+',value)];return [v/255 for v in values[:3]],values[3] if len(values)>3 else 1

def contrast(a,b):
 def luminance(c):return sum(w*(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4) for v,w in zip(c,[.2126,.7152,.0722]))
 lo,hi=sorted([luminance(a),luminance(b)]);return (hi+.05)/(lo+.05)

async def main():
 rows=[]
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
  for lang,width,theme,motion in CASES:
   context=await browser.new_context(viewport={'width':width,'height':1000},reduced_motion=motion,service_workers='block');errors=[];blocked=[];release=asyncio.Event();held=[]
   allowed={'fixture.html','theme.css','bright.svg','dark.svg','third.svg',*META['scriptFiles'],*META['componentCSS']}
   async def route(r):
    u=urlparse(r.request.url);name='fixture.html' if u.path=='/fixture' else u.path.lstrip('/')
    if u.netloc=='localhost:8080' and r.request.method=='GET' and name in allowed:
     if name in META['cropperChunks']:held.append(name);await release.wait()
     mime='text/html' if name.endswith('.html') else 'text/css' if name.endswith('.css') else 'image/svg+xml' if name.endswith('.svg') else 'text/javascript'
     await r.fulfill(path=str(OUT/name),content_type=mime)
    else:blocked.append({'url':r.request.url,'method':r.request.method});await r.abort()
   await context.route('**/*',route);page=await context.new_page();page.on('pageerror',lambda e:errors.append(str(e)));row={'lang':lang,'width':width,'theme':theme,'motion':motion,'boundedOutcome':'FAIL','modalFocusChecks':{}};prefix=f'{lang}-{width}-{theme}-{motion}'
   try:
    await page.goto('http://localhost:8080/fixture?'+urlencode({'lang':lang,'theme':theme}),wait_until='domcontentloaded');await page.get_by_role('button',name='Open viewer',exact=True).wait_for();await page.evaluate('document.fonts.ready')
    original_body_overflow=await page.evaluate('getComputedStyle(document.body).overflow')
    opener=page.get_by_role('button',name='Open viewer',exact=True);await opener.click();viewer=page.get_by_role('dialog',name='Просмотр фотографий' if lang=='ru' else 'Photo viewer',exact=True)
    row['earlyFullscreenFrames']=await viewer.evaluate('''async e=>{const frames=[];for(let i=0;i<4;i++){await new Promise(requestAnimationFrame);const r=e.getBoundingClientRect();frames.push({x:r.x,y:r.y,width:r.width,height:r.height,animation:getComputedStyle(e).animationName});}return frames;}''')
    for frame in row['earlyFullscreenFrames']:assert abs(frame['x'])<1 and abs(frame['y'])<1 and abs(frame['width']-width)<1 and abs(frame['height']-1000)<1,frame
    await wait_for_dialog_ready(page,viewer,keyboard=True,failure_path=OUT/f'{prefix}-viewer-readiness')
    rect=await viewer.bounding_box();assert rect and abs(rect['x'])<1 and abs(rect['y'])<1 and abs(rect['width']-width)<1 and abs(rect['height']-1000)<1,rect
    assert await page.evaluate('getComputedStyle(document.body).overflow')=='hidden'
    bright=page.get_by_alt_text('Synthetic bright scene',exact=True);await bright.evaluate('(e)=>e.decode()');next_button=page.get_by_role('button',name='Вперёд' if lang=='ru' else 'Next',exact=True)
    first_thumb=viewer.get_by_role('button',name='Фото 1 из 3' if lang=='ru' else 'Photo 1 of 3',exact=True);await expect(first_thumb).to_have_attribute('aria-current','true');await expect(viewer.locator('[aria-current=true]')).to_have_count(1)
    row['touchTargetBounds']={}
    for label,control in [('close',viewer.get_by_role('button',name='Закрыть' if lang=='ru' else 'Close',exact=True)),('next',next_button)]:
     box=await control.bounding_box();assert box and box['width']>=44 and box['height']>=44,(label,box);row['touchTargetBounds'][label]=box
    row['modalFocusChecks']['focusInsideOnOpen']=await viewer.evaluate('(e)=>e.contains(document.activeElement)');assert row['modalFocusChecks']['focusInsideOnOpen']
    for key in ['Shift+Tab',*(['Tab']*10)]:
     await page.keyboard.press(key);assert await viewer.evaluate('(e)=>e.contains(document.activeElement)'), 'Focus escaped to background'
    row['modalFocusChecks']['tabContained']=True
    colors=await next_button.evaluate('(e)=>({foreground:getComputedStyle(e).color,background:getComputedStyle(e).backgroundColor})');fg,_=rgba(colors['foreground']);bg,alpha=rgba(colors['background']);worst=[alpha*c+(1-alpha) for c in bg];row['arrowWorstWhitePhotoContrast']=contrast(fg,worst);assert row['arrowWorstWhitePhotoContrast']>=3,(colors,row['arrowWorstWhitePhotoContrast'])
    await page.screenshot(path=str(OUT/f'{prefix}-viewer-bright.png'))
    await next_button.hover();await page.wait_for_function("e=>parseFloat(getComputedStyle(e).backgroundColor.split(',').at(-1))>=0.74",arg=await next_button.element_handle());await page.screenshot(path=str(OUT/f'{prefix}-viewer-arrow-hover.png'))
    await page.keyboard.press('ArrowRight');await expect(viewer.get_by_role('button',name='Фото 2 из 3' if lang=='ru' else 'Photo 2 of 3',exact=True)).to_have_attribute('aria-current','true');previous=viewer.get_by_role('button',name='Назад' if lang=='ru' else 'Previous',exact=True);previous_box=await previous.bounding_box();assert previous_box and previous_box['width']>=44 and previous_box['height']>=44;row['touchTargetBounds']['previous']=previous_box;await expect(page.get_by_alt_text('Synthetic dark scene',exact=True)).to_be_visible();await page.get_by_alt_text('Synthetic dark scene',exact=True).evaluate('(e)=>e.decode()');await page.screenshot(path=str(OUT/f'{prefix}-viewer-dark.png'))
    await page.keyboard.press('ArrowLeft');await expect(bright).to_be_visible()
    # Actual thumbnail click, followed by the actual close button.
    third_thumb=viewer.get_by_role('button',name='Фото 3 из 3' if lang=='ru' else 'Photo 3 of 3',exact=True);await third_thumb.click();await expect(third_thumb).to_have_attribute('aria-current','true');await expect(first_thumb).not_to_have_attribute('aria-current','true');await expect(viewer.locator('[aria-current=true]')).to_have_count(1);await expect(page.get_by_alt_text('Synthetic third scene',exact=True)).to_be_visible()
    await page.get_by_role('button',name='Закрыть' if lang=='ru' else 'Close',exact=True).click();await expect(viewer).to_have_count(0)
    await expect(opener).to_be_focused();assert await page.evaluate('window.fixtureViewerCloses')==1;row['modalFocusChecks']['closeButtonReturnedFocus']=True
    await opener.click();await wait_for_dialog_ready(page,viewer,keyboard=True);await page.keyboard.press('Escape');await expect(viewer).to_have_count(0);await expect(opener).to_be_focused();assert await page.evaluate('window.fixtureViewerCloses')==2;row['modalFocusChecks']['escapeReturnedFocus']=True;row['modalFocusChecks']['oneCallbackPerDismissal']=True
    await page.wait_for_function('!document.body.hasAttribute("data-scroll-locked")');assert await page.evaluate('getComputedStyle(document.body).overflow')==original_body_overflow;row['modalFocusChecks']['bodyScrollRestored']=True
    await page.get_by_role('button',name='Open editor',exact=True).click();editor=page.get_by_role('dialog',name=re.compile('^Редактирование фото'));await wait_for_dialog_ready(page,editor,keyboard=True,failure_path=OUT/f'{prefix}-editor-readiness')
    preview=editor.get_by_alt_text('Preview',exact=True);await preview.evaluate('(e)=>e.decode()');await page.screenshot(path=str(OUT/f'{prefix}-editor-view.png'))
    # Real local canvas rotation and history restoration. No save/upload.
    await editor.get_by_role('button',name='Повернуть',exact=True).click();await expect(preview).to_have_attribute('src',re.compile('^data:image/webp'))
    await editor.get_by_role('button',name='Отменить',exact=True).click();await expect(preview).to_have_attribute('src','/bright.svg')
    await editor.get_by_role('button',name='Обрезать',exact=True).click();spinner=editor.locator('.animate-spin');await expect(spinner).to_be_visible();assert held,'Actual lazy cropper request was not held'
    row['cropLoadingSpinner']=await spinner.evaluate('(e)=>({color:getComputedStyle(e).color,classes:e.getAttribute("class")})');assert 'text-media-foreground' in row['cropLoadingSpinner']['classes'];await page.screenshot(path=str(OUT/f'{prefix}-crop-loading.png'))
    release.set();stencil=editor.locator('.advanced-cropper-rectangle-stencil');await expect(stencil).to_be_visible();handle=editor.locator('.advanced-cropper-handler-wrapper--east-south').first;await expect(handle).to_be_visible()
    before=await stencil.bounding_box();box=await handle.bounding_box();assert before and box
    await page.mouse.move(box['x']+box['width']/2,box['y']+box['height']/2);await page.mouse.down();await page.mouse.move(box['x']+box['width']/2-35,box['y']+box['height']/2-25,steps=8);await page.mouse.up()
    await page.wait_for_function('([e,w,h])=>{const r=e.getBoundingClientRect();return Math.abs(r.width-w)>1||Math.abs(r.height-h)>1}',arg=[await stencil.element_handle(),before['width'],before['height']]);after=await stencil.bounding_box();row['cropStencil']={'before':before,'after':after};assert after and (abs(after['width']-before['width'])>1 or abs(after['height']-before['height'])>1),row['cropStencil']
    await page.screenshot(path=str(OUT/f'{prefix}-crop-resized.png'));await editor.get_by_role('button',name='Применить обрезку',exact=True).click();await expect(preview).to_have_attribute('src',re.compile('^data:image/webp'));await preview.evaluate('(e)=>e.decode()');row['croppedImage']=await preview.evaluate('(e)=>({width:e.naturalWidth,height:e.naturalHeight})');await page.screenshot(path=str(OUT/f'{prefix}-editor-cropped.png'))
    await editor.get_by_role('button',name='Отменить',exact=True).click();await expect(preview).to_have_attribute('src','/bright.svg');await page.screenshot(path=str(OUT/f'{prefix}-editor-undo.png'))
    await page.keyboard.press('Escape');await expect(editor).to_have_count(0)
    assert not await page.evaluate('window.fixtureForbidden');assert not errors and not blocked,(errors,blocked);assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth'),'page overflow'
    row['boundedOutcome']='PASS'
   except Exception as e:
    row['error']=str(e);row['pageErrors']=errors;row['blocked']=blocked;await page.screenshot(path=str(OUT/f'{prefix}-FAIL.png'),full_page=True)
   finally:
    release.set();rows.append(row);print(json.dumps(row,ensure_ascii=False),flush=True);await context.close()
  await browser.close()
 result={'scope':'Actual isolated media presentation, navigation and local canvas interactions; NOT full modal accessibility acceptance','cases':rows,'passed':sum(r['boundedOutcome']=='PASS' for r in rows),'total':len(rows),'limits':['Focus containment/return asserted; not complete accessibility compliance','No AI/storage/save/network writers invoked','Local synthetic images, fallback fonts; no App/auth acceptance']}
 (OUT/'results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));assert result['passed']==result['total'],result
asyncio.run(main())
