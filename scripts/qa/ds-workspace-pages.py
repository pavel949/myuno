"""Actual page-frame QA; nested widgets/auth/reads are synthetic, all transport blocked."""
import asyncio,json,shutil,sys
from pathlib import Path
from playwright.async_api import async_playwright
OUT=Path(sys.argv[1])
ROUTES={'owner':{'component':'OwnerDashboard','route':'/mc','kind':'management workspace, not personal owner portal'},'vendor':{'component':'VendorDashboard','route':'/vendor'},'settings':{'component':'VendorSettings','route':'/vendor/settings','source':'unchanged canonical PageContainer'}}
async def main():
 rows=[]
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True,executable_path=shutil.which('chromium'),args=['--no-sandbox'])
  cases=[(page,lang,width,theme,'normal') for page in ['owner','vendor','settings'] for lang in ['en','ru'] for width in [390,768,1024,1440] for theme in ['light','dark']]
  cases += [(page,'en',width,theme,state) for page,state in [('owner','first-time'),('vendor','loading')] for width in [390,1440] for theme in ['light','dark']]
  for name,lang,width,theme,state in cases:
   context=await browser.new_context(viewport={'width':width,'height':900},service_workers='block');page=await context.new_page();errors=[];blocked=[]
   page.on('pageerror',lambda error:errors.append(str(error)))
   async def route(r):
    file=r.request.url.split('?',1)[0].rsplit('/',1)[-1];types={'index.html':'text/html','app.js':'text/javascript','normal.css':'text/css'}
    if r.request.url.startswith('http://localhost:8080/') and file in types:await r.fulfill(path=str(OUT/file),content_type=types[file])
    else:blocked.append(r.request.url);await r.abort()
   await context.route('**/*',route)
   row={'page':name,'routeIdentity':ROUTES[name],'language':lang,'width':width,'theme':theme,'state':state,'scope':'actual page, synthetic nested widgets/data and fixed-nav model'}
   try:
    await page.goto(f'http://localhost:8080/index.html?page={name}&lang={lang}&theme={theme}&state={state}',wait_until='networkidle');await page.locator('.ds-frame').first.wait_for();await page.wait_for_timeout(400)
    assert not errors,errors
    frame=page.locator('#actual-page .ds-frame').first
    info=await frame.evaluate('e=>({max:getComputedStyle(e).maxWidth,gutter:getComputedStyle(e).paddingLeft,bottom:getComputedStyle(e).paddingBottom,classes:e.className})');row['frame']=info
    expected_gutter={390:'16px',768:'24px',1024:'32px',1440:'40px'}[width]
    assert info['gutter']==expected_gutter,info
    assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth'),'horizontal page overflow'
    if name in ['owner','vendor'] and state!='first-time':assert 'ds-frame-workspace' in info['classes'] and info['max']=='1536px',info
    if state=='first-time':assert info['max']=='672px',info
    if name=='vendor':assert 'ds-page-with-navigation' not in info['classes'],'duplicate inner navigation clearance'
    original=await page.evaluate("document.documentElement.style.getPropertyValue('--layout-width-workspace')")
    if name in ['owner','vendor'] and state!='first-time':
     await page.evaluate("document.documentElement.style.setProperty('--layout-width-workspace','1000px')")
     assert await frame.evaluate("e=>getComputedStyle(e).maxWidth==='1000px'"),'named workspace width did not propagate'
     await page.evaluate("v=>{if(v)document.documentElement.style.setProperty('--layout-width-workspace',v);else document.documentElement.style.removeProperty('--layout-width-workspace')}",original)
    if name=='vendor' and state=='normal':
     await page.get_by_text('SYNTHETIC-CANCELLED',exact=True).wait_for()
     badge=page.get_by_text('Cancelled' if lang=='en' else 'Отменён',exact=True)
     assert await badge.evaluate("e=>e.classList.contains('text-danger')")
     contrast=await badge.evaluate(r"""el=>{
      const rgba=value=>{const match=value.match(/^rgba?\((.*)\)$/);if(!match)throw Error('Unsupported computed color '+value);const parts=match[1].split(/[ ,/]+/).filter(Boolean).map(Number);return[parts[0],parts[1],parts[2],parts[3]??1]};
      const over=(fg,bg)=>{const a=fg[3]+bg[3]*(1-fg[3]);return a?[...fg.slice(0,3).map((v,i)=>(v*fg[3]+bg[i]*bg[3]*(1-fg[3]))/a),a]:[0,0,0,0]};
      const layers=[];for(let node=el;node;node=node.parentElement){const css=getComputedStyle(node);if(Number(css.opacity)!==1)throw Error('Group opacity requires a separate paint calculation');if(css.backgroundImage!=='none')throw Error('Image background requires pixel contrast measurement');layers.push({node:node.tagName,background:rgba(css.backgroundColor)})}
      let background=[255,255,255,1];for(const layer of [...layers].reverse())background=over(layer.background,background);
      const foreground=over(rgba(getComputedStyle(el).color),background);
      const luminance=rgb=>rgb.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4)).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
      const [low,high]=[luminance(foreground),luminance(background)].sort((a,b)=>a-b);return{ratio:(high+.05)/(low+.05),foreground,background,layers};
     }""")
     row['cancelledBadgeContrast']=contrast
     assert contrast['ratio']>=4.5,{'cancelledBadgeContrast':contrast}

    if name=='settings':
     disabled=page.get_by_role('button',name='Notifications' if lang=='en' else 'Уведомления',exact=False);assert await disabled.is_disabled(),'Soon gate changed'
    await page.locator('#fixture-end').scroll_into_view_if_needed();await page.evaluate('scrollTo(0,document.documentElement.scrollHeight)');await page.wait_for_timeout(80)
    if width<768:
     rect=await page.locator('#fixture-end').bounding_box();nav=await page.locator('[data-synthetic-fixed-nav]').bounding_box();assert rect['y']+rect['height']<=nav['y']+1,{'end':rect,'nav':nav}
     row['bottomClearance']='PASS under source-matched NavShell fixed-nav model, not actual route/auth shell'
     if name=='vendor' and state=='normal' and lang=='en':
      bottom_file=f'{name}-{lang}-{width}-{theme}-{state}-bottom.png';await page.screenshot(path=str(OUT/bottom_file));row['bottomScreenshot']=bottom_file
    assert await page.evaluate('window.fixtureWrites')==0
    await page.evaluate('scrollTo(0,0)');filename=f'{name}-{lang}-{width}-{theme}-{state}.png';await page.screenshot(path=str(OUT/filename),full_page=True);row['screenshot']=filename
    assert not errors,errors
    assert not blocked,{'unexpectedBlockedTransport':blocked}
    row['result']='PASS'
   except Exception as error:row['result']='FAIL';row['failure']=str(error);await page.screenshot(path=str(OUT/f'{name}-{lang}-{width}-{theme}-{state}-FAIL.png'),full_page=True)
   row['pageErrors']=errors;row['blockedRequests']=blocked;rows.append(row);await context.close()
  await browser.close()
 assert len(rows)==56,'incomplete workspace page matrix'
 report={'manifest':json.loads((OUT/'manifest.json').read_text()),'scope':'page geometry/palette only; no backend, actor, write/save, revenue or widget acceptance','unsupportedErrorStates':'NOT TESTED: current page hooks do not expose usable page error states; no fake error UI added','cases':rows}
 (OUT/'results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps({'cases':len(rows),'passed':sum(r['result']=='PASS' for r in rows),'failed':sum(r['result']=='FAIL' for r in rows)}))
 if any(r['result']=='FAIL' for r in rows):raise SystemExit(1)
asyncio.run(main())
