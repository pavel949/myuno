"""Shared component geometry/interaction, not full-page role acceptance."""
import asyncio,json,os,shutil,sys
from pathlib import Path
from urllib.parse import urlparse
from playwright.async_api import async_playwright,expect
OUT=Path(sys.argv[1]);BASELINE='--baseline' in sys.argv
async def main():
 rows=[]
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True,executable_path=None if os.environ.get('CI') else shutil.which('chromium'),args=['--no-sandbox'])
  cases=[('ru',390,'light'),('ru',1440,'dark')] if BASELINE else [(l,w,t) for l in ['ru','en','th'] for w in [390,1440] for t in ['light','dark']]
  if not BASELINE and os.environ.get('DS_SECTION_REPRESENTATIVE')=='1':cases=[('ru',390,'light')]
  for lang,width,theme in cases:
   previous=None;normal_metrics=None
   for variant in ['normal'] if BASELINE else ['normal','scaled','icons','gap-small','gap-large']:
    context=await browser.new_context(viewport={'width':width,'height':844},reduced_motion='reduce',service_workers='block');errors=[];blocked=[]
    async def route(r):
     u=urlparse(r.request.url);name='fixture.html' if u.path=='/fixture' else u.path.lstrip('/')
     if u.netloc=='localhost:8080' and r.request.method=='GET' and name in ['fixture.html','fixture.js','normal.css','scaled.css','icons.css','gap-small.css','gap-large.css']:
      if name=='normal.css':name=variant+'.css'
      await r.fulfill(path=str(OUT/name),content_type='text/html' if name.endswith('.html') else 'text/javascript' if name.endswith('.js') else 'text/css')
     else:blocked.append(r.request.url);await r.abort()
    await context.route('**/*',route);page=await context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
    await page.goto('http://localhost:8080/fixture?lang='+lang,wait_until='networkidle');await page.evaluate('(t)=>document.documentElement.classList.toggle("dark",t==="dark")',theme)
    assert not errors and not blocked,(errors,blocked)
    assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth'),'overflow'
    metrics=await page.evaluate('''()=>Object.fromEntries([...document.querySelectorAll('[data-probe]')].map(e=>{const h=e.querySelector('header,.ds-section-heading,section>div'),a=e.querySelector('a,button'),s=h?getComputedStyle(h):null;return[e.dataset.probe,{gap:s?.gap,bottom:s?.marginBottom,contentGap:h?.nextElementSibling?h.nextElementSibling.getBoundingClientRect().top-h.getBoundingClientRect().bottom:null,actionHeight:a?.getBoundingClientRect().height,scale:getComputedStyle(document.documentElement).getPropertyValue('--section-space-scale').trim()}]}))''')
    if not BASELINE:
     for surface in ['page','ds','section','unified','public']:
      glyph=await page.locator(f'[data-probe={surface}] .ds-section-action-icon').first.bounding_box()
      expected=24 if variant=='icons' else 16
      assert abs(glyph['width']-expected)<.1 and abs(glyph['height']-expected)<.1,{'surface':surface,'tokenExpected':expected,'actualGlyph':glyph}
     for key in ['ds','section','unified']:
      assert metrics[key]['actionHeight']>=44,metrics
     if variant.startswith('gap-'):
      for key in ['section','public']:
       before=normal_metrics[key]['contentGap'];after=metrics[key]['contentGap']
       assert before>0 and after>0 and (after<before if variant=='gap-small' else after>before),(key,variant,before,after)
     rail_glyph=await page.locator('[data-probe=public] .home-rail-controls svg').first.bounding_box()
     assert abs(rail_glyph['width']-(24 if variant=='icons' else 16))<.1,rail_glyph
     if variant=='scaled':
      for key in ['ds','section','unified','public']:assert metrics[key]['gap']!=previous[key]['gap'],(key,previous,metrics)
      assert metrics['page']['bottom']!=previous['page']['bottom'],(previous,metrics)
    if variant=='normal':normal_metrics=metrics
    previous=metrics
    await page.screenshot(path=str(OUT/f'{lang}-{width}-{theme}-{variant}.png'),full_page=True)
    if not BASELINE:
     await page.locator('[data-probe=page] a[href="/services?q=page-header"]').click();await expect(page.get_by_test_id('route')).to_have_text('/services?q=page-header');await page.get_by_test_id('back').click()
     if width<768:
      more=page.get_by_role('button',name={'ru':'Другие действия','en':'More actions','th':'การดำเนินการเพิ่มเติม'}[lang]);await more.click()
      item=page.locator('[role=menuitem][href="/documents?tab=synthetic"]');await expect(item).to_be_visible()
      await page.get_by_role('menu').evaluate('(e)=>Promise.all(e.getAnimations().map(a=>a.finished))')
      glyph=await item.locator('.ds-section-menu-icon').bounding_box();assert abs(glyph['width']-(24 if variant=='icons' else 16))<.1,glyph
      await item.focus();await page.keyboard.press('Enter');await expect(page.get_by_test_id('route')).to_have_text('/documents?tab=synthetic');await expect(page.get_by_role('menu')).to_have_count(0);await page.get_by_test_id('back').click()
     await page.locator('[data-probe=ds] button').click();assert await page.evaluate('window.fixtureActions')==1
     link=page.locator('[data-probe=unified] a');await expect(link).to_have_attribute('href','/services?q=synthetic');await link.focus();await page.keyboard.press('Enter');await expect(page.get_by_test_id('route')).to_have_text('/services?q=synthetic');await page.get_by_test_id('back').click();await expect(page.get_by_test_id('route')).to_have_text('/')
    rows.append({'lang':lang,'width':width,'theme':theme,'variant':variant,'metrics':metrics,'outcome':'PASS'});await context.close()
  await browser.close()
 (OUT/'results.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2));print(json.dumps({'passed':len(rows),'mode':'fresh baseline' if BASELINE else 'actual shared components; source scale variant'}))
asyncio.run(main())
