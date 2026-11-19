"""Read-only UI regression for changed actual leaf pages; local assets only."""
import functools,http.server,json,os,sys,threading
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
out=Path(sys.argv[1]).resolve()
handler=functools.partial(http.server.SimpleHTTPRequestHandler,directory=str(out))
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
origin=f'http://127.0.0.1:{server.server_address[1]}'
rows=[]
try:
 with sync_playwright() as p:
  options={'headless':True}
  if os.environ.get('CHROMIUM_PATH'):options['executable_path']=os.environ['CHROMIUM_PATH']
  browser=p.chromium.launch(**options)
  for width in [375,390,430,1440]:
   for lang in ['ru','en','th']:
    for theme in ['light','dark']:
     context=browser.new_context(viewport={'width':width,'height':1000},reduced_motion='reduce',service_workers='block')
     context.route('**/*',lambda route:route.continue_() if route.request.url.startswith(origin+'/') else route.abort())
     page=context.new_page()
     for scene in (['finance'] if lang=='th' else ['management','services','vendor-landing','finance','portfolio','payouts']):
      errors=[]
      def on_error(error):errors.append(str(error))
      page.on('pageerror',on_error)
      row={'scene':scene,'width':width,'lang':lang,'theme':theme,'outcome':'FAIL'}
      try:
       page.goto(origin+f'/?scene={scene}&lang={lang}&theme={theme}',wait_until='networkidle')
       expect(page.locator('#actual-scene')).to_be_visible()
       page.wait_for_function("document.querySelector('#actual-scene')?.innerText.length>100")
       page.wait_for_timeout(150)
       metrics=page.evaluate("""()=>({overflow:document.documentElement.scrollWidth>innerWidth,gradients:[...document.querySelectorAll('#actual-scene *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(e).backgroundImage.includes('gradient')}).map(e=>e.className),writes:window.fixtureWrites,body:document.querySelector('#actual-scene').innerText})""")
       assert not errors,errors
       assert not metrics['overflow'],'Horizontal overflow'
       assert not metrics['gradients'],metrics['gradients']
       assert metrics['writes']==0,'Unexpected mutation'
       if scene=='finance':
        cash={'ru':'Не сверено','en':'Not reconciled','th':'ยังไม่ได้กระทบยอด'}[lang]
        accruals={'ru':'Начисления без сверки','en':'Unreconciled accruals','th':'รายได้ค้างรับที่ยังไม่กระทบยอด'}[lang]
        expenses={'ru':'Расходы по записям','en':'Recorded expenses','th':'ค่าใช้จ่ายตามรายการบันทึก'}[lang]
        expect(page.get_by_text(cash,exact=True)).to_be_visible()
        expect(page.get_by_role('heading',name=accruals,exact=True)).to_be_visible()
        expect(page.get_by_role('heading',name=expenses,exact=True)).to_be_visible()
        assert '48.5M' not in metrics['body'] and '80.9M' not in metrics['body']
        assert '12,000' in metrics['body'] or '12 000' in metrics['body']
       if scene=='portfolio':
        card=page.locator('a[href="/mc/properties/synthetic-home"]')
        assert card.locator('.grid p').evaluate_all("els=>els.every(e=>{const range=document.createRange();range.selectNodeContents(e);return new Set([...range.getClientRects()].map(r=>Math.round(r.top))).size===1})"),'Property metrics split into narrow lines'
        card.press('Enter')
        expect(page.locator('#route')).to_have_text('/mc/properties/synthetic-home')
       if scene=='vendor-landing':
        assert not any(term in metrics['body'] for term in ['Escrow','escrow','Guaranteed payment','Гарантированная оплата','every Friday','каждую пятницу','0%'])
        # Real CTA still enters the existing onboarding auth boundary.
        page.get_by_role('button',name='Подать заявку' if lang=='ru' else 'Apply to join',exact=True).click()
        expect(page.locator('#route')).to_have_text('/auth?redirect=/vendor/onboarding')
       if width in [390,1440] and lang=='ru' and theme=='light':page.screenshot(path=str(out/f'{scene}-{width}.png'))
       row.update(outcome='PASS',writes=metrics['writes'])
      except Exception as error:
       row['error']=str(error);page.screenshot(path=str(out/f'FAIL-{scene}-{width}-{lang}-{theme}.png'))
      rows.append(row);page.remove_listener('pageerror',on_error)
     context.close()
  browser.close()
finally:server.shutdown()
(out/'results.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
failed=[row for row in rows if row['outcome']!='PASS']
print(json.dumps({'cases':len(rows),'passed':len(rows)-len(failed),'failed':len(failed),'failures':failed},ensure_ascii=False))
assert not failed,failed
