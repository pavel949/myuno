import functools,http.server,json,os,sys,threading
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
out=Path(sys.argv[1]).resolve()
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(out)));threading.Thread(target=server.serve_forever,daemon=True).start();origin=f'http://127.0.0.1:{server.server_address[1]}'
rows=[]
try:
 with sync_playwright() as p:
  options={'headless':True}
  if os.environ.get('CHROMIUM_PATH'):options['executable_path']=os.environ['CHROMIUM_PATH']
  browser=p.chromium.launch(**options)
  for width in [375,390,430,1440]:
   for lang in ['ru','en']:
    context=browser.new_context(viewport={'width':width,'height':1000},service_workers='block',reduced_motion='reduce');context.route('**/*',lambda r:r.continue_() if r.request.url.startswith(origin+'/') else r.abort());page=context.new_page()
    for scene in ['transfer-valid','transfer-missing','transfer-picker-missing','fast-arrival','fast-departure','fast-invalid']:
     errors=[]
     def on_error(e):errors.append(str(e))
     page.on('pageerror',on_error);row={'scene':scene,'width':width,'lang':lang,'outcome':'FAIL'}
     try:
      page.goto(origin+f'/?scene={scene}&lang={lang}',wait_until='networkidle');page.wait_for_timeout(400)
      if scene.startswith('fast'):
       expect(page.get_by_text('Synthetic Guest — ••••3456',exact=True)).to_be_visible()
       assert 'TEST123456' not in page.locator('#actual-page').inner_text()
       button=page.get_by_role('button',name='Забронировать' if lang=='ru' else 'Book Now',exact=True)
       if scene=='fast-invalid':expect(button).to_be_disabled();expect(page.get_by_role('alert')).to_be_visible()
       else:expect(button).to_be_enabled()
      elif 'missing' in scene:
       unknown='Стоимость требует подтверждения' if lang=='ru' else 'Price requires confirmation'
       expect(page.get_by_text(unknown,exact=True).first).to_be_visible();assert '฿800' not in page.locator('#actual-page').inner_text()
       button=page.get_by_role('button',name=('Далее' if lang=='ru' else 'Continue') if 'picker' in scene else unknown,exact=True);expect(button).to_be_disabled();expect(page.get_by_role('status')).to_be_visible()
      else:expect(page.get_by_role('button',name=('Забронировать • наличные' if lang=='ru' else 'Book • Cash'),exact=False)).to_be_enabled()
      assert not errors,errors
      assert page.evaluate('window.fixtureWrites')==0
      assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),'Horizontal overflow'
      if width in [390,1440] and lang=='ru':page.screenshot(path=str(out/f'{scene}-{width}.png'))
      row['outcome']='PASS'
     except Exception as e:row['error']=str(e);page.screenshot(path=str(out/f'FAIL-{scene}-{width}-{lang}.png'))
     rows.append(row);page.remove_listener('pageerror',on_error)
    context.close()
  browser.close()
finally:server.shutdown()
(out/'results.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2));failed=[r for r in rows if r['outcome']!='PASS'];print(json.dumps({'cases':len(rows),'passed':len(rows)-len(failed),'failed':len(failed),'failures':failed},ensure_ascii=False));assert not failed,failed
