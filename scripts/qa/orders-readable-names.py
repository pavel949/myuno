import sys,json,threading,http.server,functools
from pathlib import Path
from playwright.sync_api import sync_playwright
out=Path(sys.argv[1])
class Handler(http.server.SimpleHTTPRequestHandler):
 def do_GET(self):
  if self.path.startswith('/orders/'):self.path='/index.html'
  super().do_GET()
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(out)));threading.Thread(target=server.serve_forever,daemon=True).start();rows=[]
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None,args=['--no-sandbox'])
 for width in [390,768,1440]:
  for theme in ['light','dark']:
   for state in ['named','historical','unavailable','loading','empty','error']:
    page=browser.new_page(viewport={'width':width,'height':844});errors=[];blocked=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    def route(r):
     if r.request.url.startswith('http://127.0.0.1:'):r.continue_()
     else:blocked.append(r.request.url);r.abort()
    page.route('**/*',route)
    page.goto(f'http://127.0.0.1:{server.server_port}/?state={state}&theme={theme}&lang=ru');page.get_by_role('navigation').wait_for()
    nav=page.get_by_role('navigation'); links=nav.get_by_role('link')
    assert links.count()==4
    for link in links.all():
     box=link.bounding_box();assert box['height']>=44 and box['width']>0,box
    assert page.get_by_role('tab').count()==0
    if state=='named':
     homes=page.get_by_role('link',name='Жильё',exact=True);homes.focus();page.keyboard.press('Enter');assert page.evaluate('location.hash')=='#property-bookings'
     services=page.get_by_role('link',name='Заказы услуг',exact=True);services.click();assert page.evaluate('location.hash')=='#service-orders'
     page.go_back();assert page.evaluate('location.hash')=='#property-bookings'
     page.go_forward();assert page.evaluate('location.hash')=='#service-orders'
     assert page.get_by_role('link',name='Заявки и обращения').get_attribute('href')=='/me/requests'
    if state=='unavailable':assert page.get_by_text('Название жилья недоступно').is_visible()
    if state in ['named','historical','unavailable']:assert page.get_by_text('synthetic-order-reference',exact=False).count()==1
    if state=='error':page.get_by_role('button').click();assert page.evaluate('window.readRetries')==1
    if state=='loading':assert page.get_by_role('status').is_visible()
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    name=f'orders-{width}-{theme}-{state}.png';page.screenshot(path=str(out/name),full_page=True)
    assert not errors,errors
    assert not blocked,blocked
    rows.append({'width':width,'theme':theme,'state':state,'result':'PASS','screenshot':name});page.close()
 browser.close()
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None,args=['--no-sandbox'])
 for width in [390,1440]:
  for theme in ['light','dark']:
   for state in ['named','loading','error','unavailable','checked_in','checked_out','deposit_paid','completed','future_status']:
    page=browser.new_page(viewport={'width':width,'height':844});errors=[];blocked=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    def route(r):
     if r.request.url.startswith('http://127.0.0.1:'):r.continue_()
     else:blocked.append(r.request.url);r.abort()
    page.route('**/*',route);page.goto(f'http://127.0.0.1:{server.server_port}/orders/synthetic-order-reference/tracking?state={state}&theme={theme}&lang=ru')
    if state in ['named', 'checked_in', 'checked_out', 'deposit_paid', 'completed', 'future_status']:
     page.get_by_text('Synthetic home with a long stored name',exact=False).wait_for()
     assert page.get_by_role('progressbar').count() == 0
     assert page.get_by_role('dialog').count() == 0
     labels = {'checked_in': 'Заехал', 'checked_out': 'Выехал', 'deposit_paid': 'Депозит оплачен', 'completed': 'Завершён', 'future_status': 'Статус неизвестен'}
     if state in labels: assert page.get_by_text(labels[state], exact=True).is_visible()
     assert page.get_by_role('link',name='Мои обращения').get_attribute('href')=='/me/requests'
    if state=='error':page.get_by_role('button',name='Повторить',exact=True).click();assert page.evaluate('window.readRetries')==1
    if state=='unavailable':page.get_by_text('Возможно, заказ был удалён или у вас нет доступа').wait_for()
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    name=f'detail-{width}-{theme}-{state}.png';page.screenshot(path=str(out/name),full_page=True)
    assert not errors,errors
    assert not blocked,blocked
    rows.append({'page':'actual OrderTracking synthetic shell/read hooks','width':width,'theme':theme,'state':state,'result':'PASS','screenshot':name});page.close()
 browser.close()
server.shutdown();assert len(rows)==72
(out/'results.json').write_text(json.dumps(rows,indent=2));print('72/72 PASS; external transport blocked; overview/detail synthetic read hooks and shell only')
