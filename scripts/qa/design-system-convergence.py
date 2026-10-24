"""Actual screen/theme acceptance with synthetic reads; every external request denied."""
import asyncio,json,shutil,sys,re
from pathlib import Path
from urllib.parse import urlparse,urlencode
from playwright.async_api import async_playwright

OUT=Path(sys.argv[1]);BASELINE='--baseline' in sys.argv
ROLES=['public','pms','admin']
CASES=[(r,l,w,t,v,'normal') for r in ROLES for l in (['ru'] if BASELINE else ['ru','en','th']) for w in [390,1440] for t in ['light','dark'] for v in (['normal'] if BASELINE else ['normal','rebrand'])]
if not BASELINE:
 CASES += [(r,'ru',w,t,'normal','normal') for r in ROLES for w in [320,375,430,768,1920] for t in ['light','dark']]
 CASES += [(r,'ru',390,t,'normal',s) for r in ROLES for t in ['light','dark'] for s in ['loading','error']]

def rgba(value):
 nums=[float(n) for n in re.findall(r'[\d.]+',value)]
 return nums[:3]+[nums[3] if len(nums)>3 else 1]
def composite(top,bottom):return [top[i]*top[3]+bottom[i]*(1-top[3]) for i in range(3)]+[1]
def lum(c):
 a=[v/255 for v in c[:3]];a=[v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in a]
 return sum(v*k for v,k in zip(a,[.2126,.7152,.0722]))
def contrast(a,b):return (max(lum(a),lum(b))+.05)/(min(lum(a),lum(b))+.05)

async def main():
 results=[];normal={}
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox'])
  for role,lang,width,theme,variant,state in CASES:
   folder=OUT/role;errors=[];blocked=[]
   context=await browser.new_context(viewport={'width':width,'height':900},reduced_motion='reduce',service_workers='block')
   await context.add_init_script(f"localStorage.setItem('myuno-theme',{json.dumps(theme)});")
   async def route(r):
    u=urlparse(r.request.url);name='fixture.html' if u.path=='/fixture' else u.path.lstrip('/')
    if name=='variant.css':name=variant+'.css'
    file=(folder/name).resolve()
    if u.netloc=='localhost:8080' and r.request.method=='GET' and file.is_relative_to(folder.resolve()) and file.is_file():await r.fulfill(path=str(file))
    else:blocked.append({'url':r.request.url,'method':r.request.method});await r.abort()
   await context.route('**/*',route)
   page=await context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
   row=dict(role=role,lang=lang,width=width,theme=theme,variant=variant,state=state,outcome='FAIL')
   try:
    query={'lang':lang}
    if state!='normal':query['scenario' if role=='admin' else 'state']='one-source-failure' if role=='admin' and state=='error' else state
    await page.goto('http://localhost:8080/fixture?'+urlencode(query),wait_until='networkidle')
    await page.evaluate('(l)=>document.documentElement.lang=l',lang)
    await page.locator('h1').first.wait_for()
    await page.locator('[data-ds-primary]').wait_for()
    await page.evaluate('document.fonts.ready')
    await page.wait_for_timeout(220)
    assert await page.evaluate('document.documentElement.classList.contains("dark")')==(theme=='dark'),'theme not applied by actual ThemeProvider'
    assert not errors,errors
    assert not blocked,blocked
    metrics=await page.evaluate("""(role)=>{const style=e=>{const s=getComputedStyle(e);return {color:s.color,background:s.backgroundColor,font:s.fontFamily,width:e.getBoundingClientRect().width}};const frame=document.querySelector(role==='public'?'.home-hero-copy':role==='admin'?'[data-testid=dashboard-work-area]>div':'.ds-frame')||document.querySelector('#root>div');const fr=frame.getBoundingClientRect();return{frame:{inset:role==='public'?fr.left:parseFloat(getComputedStyle(frame).paddingLeft),width:fr.width},body:style(document.body),heading:style(document.querySelector('h1')),primary:style(document.querySelector('[data-ds-primary]')),probe:style(document.querySelector('[data-testid=ds-probes]')),statuses:Array.from(document.querySelectorAll('[data-ds-status]')).map(e=>({status:e.dataset.dsStatus,...style(e)})),overflow:document.documentElement.scrollWidth>innerWidth}}""",role)
    assert not metrics['overflow'],'page overflow'
    # Real mounted input and existing ThemeProvider, not a CSS-class-only toggle.
    draft=page.get_by_test_id('ds-draft');await draft.fill('Synthetic unsaved value')
    for _ in range(2):await page.get_by_test_id('ds-theme-toggle').click();await page.wait_for_timeout(180)
    assert await draft.input_value()=='Synthetic unsaved value','theme switch lost mounted form state'
    assert await page.evaluate('document.documentElement.classList.contains("dark")')==(theme=='dark')
    for status in metrics['statuses']:
     bg=composite(rgba(status['background']),rgba(metrics['probe']['background']))
     status['contrast']=round(contrast(rgba(status['color']),bg),2)
     assert status['contrast']>=4.5,{'statusContrast':status}
    key=(role,lang,width,theme,state)
    if variant=='normal':normal[key]=metrics
    else:
     prior=normal[key]
     assert metrics['frame']['inset']>prior['frame']['inset'],'one-source gutter scale did not propagate'
     if role=='pms' and width==1440:assert metrics['frame']['width']<prior['frame']['width'],'named width source did not propagate'
     assert metrics['heading']['font']!=prior['heading']['font'],'display font source did not propagate'
     assert metrics['body']['font']!=prior['body']['font'],'body font source did not propagate'
     assert metrics['body']['background']!=prior['body']['background'] or metrics['primary']['background']!=prior['primary']['background'],'brand hue source did not propagate'
     assert [(s['status'],s['color']) for s in metrics['statuses']]==[(s['status'],s['color']) for s in prior['statuses']],'brand change recolored semantic statuses'
    row['metrics']=metrics
    screenshot=f'{role}-{lang}-{width}-{theme}-{variant}-{state}.png'
    await page.screenshot(path=str(OUT/screenshot))
    row.update(outcome='PASS',screenshot=screenshot)
   except Exception as e:
    row['error']=str(e)
    await page.screenshot(path=str(OUT/f'FAIL-{role}-{lang}-{width}-{theme}-{variant}-{state}.png'))
   row.update(errors=errors,blockedRequests=blocked);results.append(row)
   await context.close()
  await browser.close()
 (OUT/'results.json').write_text(json.dumps({'mode':'isolated actual components, no live business acceptance','fontFidelity':'fallback stacks; external font loading intentionally blocked','cases':results},indent=2,ensure_ascii=False)+'\n')
 failed=[r for r in results if r['outcome']!='PASS'];print(json.dumps({'cases':len(results),'passed':len(results)-len(failed),'failed':len(failed),'failures':[{k:r.get(k) for k in ['role','lang','width','theme','variant','state','error']} for r in failed]},ensure_ascii=False))
 if failed:sys.exit(1)

asyncio.run(main())
