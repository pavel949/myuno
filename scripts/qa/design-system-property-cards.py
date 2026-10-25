"""Actual card presentation/navigation; synthetic catalogue and denied transport."""
import asyncio,json,sys,io,re
from PIL import Image
from pathlib import Path
from urllib.parse import urlparse,urlencode
from playwright.async_api import async_playwright,expect
OUT=Path(sys.argv[1])
def contrast(a,b):
 def lum(c):return sum(w*(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4) for v,w in zip([n/255 for n in c],[.2126,.7152,.0722]))
 lo,hi=sorted([lum(a),lum(b)]);return (hi+.05)/(lo+.05)
async def main():
 rows=[]
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None,headless=True,args=['--no-sandbox'])
  for lang in ['en','ru','th']:
   for width in [390,1440]:
    for theme in ['light','dark']:
     context=await browser.new_context(viewport={'width':width,'height':1000},service_workers='block');blocked=[];errors=[];row={'lang':lang,'width':width,'theme':theme,'outcome':'FAIL'};prefix=f'{lang}-{width}-{theme}'
     async def route(r):
      u=urlparse(r.request.url);name='fixture.html' if u.path=='/fixture' else u.path.lstrip('/')
      if u.netloc=='localhost:8080' and r.request.method=='GET' and name in ['fixture.html','app.js','theme.css','bright.svg','dark.svg','placeholder.svg']:
       await r.fulfill(path=str(OUT/name),content_type='text/html' if name.endswith('html') else 'text/css' if name.endswith('css') else 'image/svg+xml' if name.endswith('svg') else 'text/javascript')
      else:blocked.append({'url':r.request.url,'method':r.request.method});await r.abort()
     await context.route('**/*',route);page=await context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
     try:
      await page.goto('http://localhost:8080/fixture?'+urlencode({'lang':lang,'theme':theme}),wait_until='domcontentloaded');cards=page.locator('[data-catalog-kind]');await expect(cards).to_have_count(7);await page.evaluate('document.fonts.ready');await page.locator('img').evaluate_all('(images)=>{images.forEach(i=>i.loading="eager");return Promise.all(images.map(i=>i.decode()))}')
      assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth'),'Horizontal page overflow'
      row['titleMetrics']=await cards.locator('h3 a').evaluate_all('(links)=>links.map(e=>({height:e.getBoundingClientRect().height,lineHeight:getComputedStyle(e).lineHeight,whiteSpace:getComputedStyle(e).whiteSpace}))')
      png=await page.screenshot(path=str(OUT/f'{prefix}-cards.png'),full_page=True);pixels=Image.open(io.BytesIO(png)).convert('RGB');row['pixelContrast']=[]
      for selector,kind in [('[data-listing-id="project-0"] .absolute.top-3 .gap-1','status-bright'),('[data-listing-id="project-1"] .absolute.top-3 .gap-1','status-dark'),('[data-listing-id="project-0"] .text-media-foreground span:first-child','progress-bright'),('[data-listing-id="project-1"] .text-media-foreground span:first-child','progress-dark'),('[data-listing-id="resale-0"] .text-danger','premium')]:
       e=page.locator(selector).first;info=await e.evaluate('(e)=>{const r=e.getBoundingClientRect();return {x:r.x+scrollX,y:r.y+scrollY,w:r.width,h:r.height,color:getComputedStyle(e).color}}');fg=[float(n) for n in re.findall(r'[\d.]+',info['color'])][:3]
       x=int(info['x']-2 if kind.startswith('progress') else info['x']+3);y=int(info['y']+info['h']/2 if kind.startswith('progress') else info['y']+info['h']-3);bg=pixels.getpixel((x,y));ratio=contrast(fg,bg);row['pixelContrast'].append({'kind':kind,'foreground':fg,'sample':{'x':x,'y':y,'rgb':bg},'ratio':ratio});assert ratio>=4.5,row['pixelContrast'][-1]
      progress=page.locator('[data-listing-id="project-0"] [role="progressbar"]');await expect(progress).to_have_attribute('aria-valuenow','65');expectedName=await page.locator('[data-listing-id="project-0"] h3 a').inner_text();expectedName+=' — '+('Прогресс строительства' if lang=='ru' else 'Construction progress');await expect(progress).to_have_accessible_name(expectedName);row['progressAccessibleName']=expectedName;r=await progress.bounding_box();assert r
      fill=pixels.getpixel((int(r['x']+r['width']*.25),int(r['y']+r['height']/2)));track=pixels.getpixel((int(r['x']+r['width']*.9),int(r['y']+r['height']/2)));row['progressIndicatorContrast']={'fill':fill,'track':track,'ratio':contrast(fill,track)};assert row['progressIndicatorContrast']['ratio']>=3,row['progressIndicatorContrast']
      project=page.locator('[data-listing-id="project-0"]');await project.get_by_role('link').focus();await expect(project.get_by_role('link')).to_be_focused();await page.screenshot(path=str(OUT/f'{prefix}-keyboard.png'));await page.keyboard.press('Enter');await expect(page.get_by_test_id('location')).to_have_text('/property/offplan/project-0')
      # Nested control Enter must not invoke parent project navigation.
      fav=page.locator('[data-listing-id="project-1"] button').first;box=await fav.bounding_box();assert box and box['width']>=44 and box['height']>=44;row['favouriteBounds']=box
      await fav.focus();await page.keyboard.press('Enter');await expect(page.get_by_test_id('location')).not_to_have_text('/property/offplan/project-1')
      resale=page.locator('[data-listing-id="resale-0"]');await resale.get_by_role('link').focus();await page.keyboard.press('Enter');await expect(page.get_by_test_id('location')).to_have_text('/property/resale/resale-0')
      await page.locator('[data-listing-id="project-2"]').click();await expect(page.get_by_test_id('location')).to_have_text('/property/offplan/project-2')
      await page.locator('[data-listing-id="resale-1"]').click();await expect(page.get_by_test_id('location')).to_have_text('/property/resale/resale-1')
      assert not errors and not blocked,(errors,blocked);row['outcome']='PASS'
     except Exception as e:
      row['error']=str(e);row['blocked']=blocked;row['pageErrors']=errors;await page.screenshot(path=str(OUT/f'{prefix}-FAIL.png'),full_page=True)
     rows.append(row);print(json.dumps(row),flush=True);await context.close()
  await browser.close()
 result={'cases':rows,'passed':sum(r['outcome']=='PASS' for r in rows),'total':len(rows),'limits':['Synthetic component fixture; not full route/auth acceptance','Fallback fonts; canonical font loading unverified','No backend/collection writes; signed-out favourite route exercised']};(OUT/'results.json').write_text(json.dumps(result,indent=2));assert result['passed']==result['total'],result
asyncio.run(main())
