"""Actual OrderTracking + BottomBar + closed chat; synthetic reads/shell, no domain acceptance."""
import asyncio,json,sys
from pathlib import Path
from urllib.parse import urlparse,urlencode
from playwright.async_api import async_playwright,expect
OUT=Path(sys.argv[1]);BEFORE='--before'in sys.argv
async def main():
 rows=[]
 async with async_playwright()as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None,headless=True,args=['--no-sandbox'])
  for width in [320,390,768,1440]:
   for enlarged in [False,True]:
    context=await browser.new_context(viewport={'width':width,'height':900},service_workers='block');blocked=[];errors=[]
    async def route(r):
     u=urlparse(r.request.url);name='fixture.html'if u.path=='/fixture'else u.path.lstrip('/');types={'fixture.html':'text/html','fixture.js':'text/javascript','fixture.css':'text/css'}
     if u.netloc=='localhost:8080'and r.request.method=='GET'and name in types:await r.fulfill(path=str(OUT/name),content_type=types[name])
     else:blocked.append(r.request.url);await r.abort()
    await context.route('**/*',route);page=await context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
    await page.goto('http://localhost:8080/fixture?'+urlencode({'lang':'ru','enlarged':str(enlarged).lower(),'actor':'member'}));cta=page.get_by_role('link',name='Мои обращения',exact=True);
    try:await expect(cta).to_be_visible()
    except Exception:
     await page.screenshot(path=str(OUT/'fixture-error.png'));print('fixture errors',errors,'body',await page.locator('body').inner_text());raise
    await expect(page.locator('[data-global-chat-launcher]')).to_be_visible();await page.evaluate('document.fonts.ready');await page.evaluate('window.scrollTo(0,document.documentElement.scrollHeight)');await page.evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')
    measurements=await cta.evaluate('''a=>{const b=a.getBoundingClientRect(),root=a.closest('[data-order-contact-actions]')||a.closest('.fixed'),r=root.getBoundingClientRect();const range=document.createRange();range.selectNodeContents(a);const label=range.getBoundingClientRect();const at=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2);return{button:{x:b.x,y:b.y,width:b.width,height:b.height},bar:{x:r.x,y:r.y,width:r.width,height:r.height},label:{x:label.x,y:label.y,width:label.width,height:label.height},iconsContained:[...a.querySelectorAll('svg')].every(s=>{const r=s.getBoundingClientRect();return r.x>=b.x-.5&&r.right<=b.right+.5&&r.y>=b.y-.5&&r.bottom<=b.bottom+.5}),labelContained:label.x>=b.x-.5&&label.right<=b.right+.5&&label.y>=b.y-.5&&label.bottom<=b.bottom+.5,hit:at?.closest('a')===a,hitTarget:at?.outerHTML?.slice(0,200)}}''')
    call=page.get_by_role('link',name='Позвонить',exact=True)
    callMeasurement=await call.evaluate('''a=>{const b=a.getBoundingClientRect(),r=document.createRange();r.selectNodeContents(a);const t=r.getBoundingClientRect(),at=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2);return{button:{x:b.x,y:b.y,width:b.width,height:b.height},iconsContained:[...a.querySelectorAll('svg')].every(s=>{const r=s.getBoundingClientRect();return r.x>=b.x-.5&&r.right<=b.right+.5&&r.y>=b.y-.5&&r.bottom<=b.bottom+.5}),labelContained:t.x>=b.x-.5&&t.right<=b.right+.5&&t.y>=b.y-.5&&t.bottom<=b.bottom+.5,hit:at?.closest('a')===a}}''');measurements['call']=callMeasurement
    chat=await page.locator('[data-global-chat-launcher]').bounding_box();nav=page.locator('nav').last;navbox=await nav.bounding_box();measurements.update({'chat':chat,'nav':navbox});violations=[]
    if not measurements['labelContained']:violations.append('CTA label outside button')
    if not measurements['iconsContained']:violations.append('CTA icon outside button')
    if not callMeasurement['iconsContained']:violations.append('Call icon outside button')
    if not measurements['hit']:violations.append('CTA center intercepted')
    if not callMeasurement['hit']:violations.append('Call center intercepted')
    if not callMeasurement['labelContained']:violations.append('Call label outside button')
    b=measurements['button'];chatIntersectsCTA=bool(chat and b['x']<chat['x']+chat['width'] and chat['x']<b['x']+b['width'] and b['y']<chat['y']+chat['height'] and chat['y']<b['y']+b['height']);measurements['chatIntersectsCTA']=chatIntersectsCTA
    if chatIntersectsCTA:violations.append('chat overlaps requests CTA')
    callButton=callMeasurement['button']
    if chat and callButton['x']<chat['x']+chat['width'] and chat['x']<callButton['x']+callButton['width'] and callButton['y']<chat['y']+chat['height'] and chat['y']<callButton['y']+callButton['height']:violations.append('chat overlaps call CTA')
    measurements['actionChatClearance']=chat['y']-(measurements['bar']['y']+measurements['bar']['height'])
    # CSSOM scrollHeight/scrollY are integer-rounded; retain strict rectangle non-overlap,
    # but allow at most half a CSS pixel when comparing gap with the resolved DS spacing role.
    role=await page.evaluate('''()=>{const probe=document.createElement('div');probe.style.cssText='position:fixed;top:0;left:0;width:0;height:var(--layout-page-space-y);visibility:hidden;pointer-events:none';document.body.append(probe);const value=probe.getBoundingClientRect().height;probe.remove();return value}''')
    assert role>0,role
    measurements.update({'requiredPageSpaceRolePx':role,'roundingToleranceCssPx':0.5,'scrollHeight':await page.evaluate('document.documentElement.scrollHeight'),'scrollY':await page.evaluate('scrollY'),'innerHeight':await page.evaluate('innerHeight')})
    if measurements['actionChatClearance']<role-0.5:violations.append('actions not safely above chat')
    if width<768 and navbox:
     b=measurements['bar'];gap=navbox['y']-(b['y']+b['height']);measurements['barNavGap']=gap
     if gap<0:violations.append('contact bar overlaps BottomBar')
     chatGap=b['y']-(chat['y']+chat['height']);measurements['chatActionGap']=chatGap
     if BEFORE and chatGap<role-0.5:violations.append('chat overlaps/too close to contact bar')
    if await page.evaluate('document.documentElement.scrollWidth>innerWidth'):violations.append('horizontal page overflow')
    assert not blocked,blocked
    assert not errors,errors
    name=f'{width}-{enlarged}.png';await page.screenshot(path=str(OUT/name));rows.append({'width':width,'enlarged150pct':enlarged,'before':BEFORE,'measurements':measurements,'violations':violations,'screenshot':name})
    await context.close()
  await browser.close()
 assert len(rows)==8
 (OUT/'results.json').write_text(json.dumps(rows,indent=2));
 if not BEFORE:assert not any(r['violations']for r in rows),rows
 print(json.dumps({'cases':8,'casesWithDefects':sum(bool(r['violations'])for r in rows),'mode':'before evidence'if BEFORE else'acceptance'}))
asyncio.run(main())
