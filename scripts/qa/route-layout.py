import sys,json,threading,http.server,functools
from pathlib import Path
from playwright.sync_api import sync_playwright
out=Path(sys.argv[1]);before=sys.argv[2]=='1';server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(http.server.SimpleHTTPRequestHandler,directory=str(out)));threading.Thread(target=server.serve_forever,daemon=True).start();rows=[]
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None,args=['--no-sandbox'])
 for width in [390,1440]:
  for theme in ['light','dark']:
   for mode in ['mc','property','team']:
    page=browser.new_page(viewport={'width':width,'height':844});errors=[];blocked=[];page.on('pageerror',lambda e:errors.append(str(e)))
    def route(r):
     if r.request.url.startswith('http://127.0.0.1:'):r.continue_()
     else:blocked.append(r.request.url);r.abort()
    page.route('**/*',route);page.goto(f'http://127.0.0.1:{server.server_port}/?mode={mode}&theme={theme}')
    if mode!='team':
     page.get_by_role('status').wait_for();assert page.get_by_role('status').locator('svg').is_visible();scope=page.get_by_role('status').get_attribute('data-loading-scope');assert scope==('viewport' if before else 'content');height=page.get_by_role('status').bounding_box()['height'];assert height>=844 if before else height<400
    else:
     page.get_by_label('Synthetic draft').fill('Synthetic unsaved draft');assert page.get_by_label('Synthetic draft').input_value()=='Synthetic unsaved draft';height=None
    assert page.get_by_role('main').count()==(2 if before and mode=='team' else 1)
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    name=f'{mode}-{width}-{theme}.png';page.screenshot(path=str(out/name),full_page=True);assert not errors,errors;assert not blocked,blocked;rows.append({'mode':mode,'width':width,'theme':theme,'loadingHeight':height,'result':'PASS','screenshot':name});page.close()
 browser.close()
server.shutdown();assert len(rows)==12;(out/'results.json').write_text(json.dumps(rows,indent=2));print('12/12 PASS baseline='+str(before)+' actual route fallbacks/TeamLayout; modeled shell, no backend')
