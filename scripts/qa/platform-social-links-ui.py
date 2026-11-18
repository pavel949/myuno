"""Actual form/save readback/footer with a local synthetic transport; no production writes."""
import asyncio,json,os,shutil,sys
from pathlib import Path
from urllib.parse import urlparse
from playwright.async_api import async_playwright,expect
OUT=Path(sys.argv[1]).resolve();ROOT=Path.cwd()
async def main():
 rows=[]
 async with async_playwright() as p:
  bundled=Path(p.chromium.executable_path)
  if os.environ.get('CI') and not bundled.is_file():raise RuntimeError('CI must use installed Playwright Chromium')
  browser=await p.chromium.launch(executable_path=str(bundled) if bundled.is_file() else shutil.which('chromium'),headless=True)
  for lang,width in [('ru',375),('ru',390),('ru',430),('en',1440),('th',390)]:
   context=await browser.new_context(viewport={'width':width,'height':900},service_workers='block',reduced_motion='reduce');blocked=[];errors=[]
   async def guard(route):
    q=route.request;u=urlparse(q.url)
    if u.netloc=='127.0.0.1:8943' and q.method=='GET':
     for base in [OUT,ROOT/'public']:
      file=(base/u.path.lstrip('/')).resolve()
      if file.is_relative_to(base) and file.is_file():await route.fulfill(path=str(file));return
    blocked.append(q.url);await route.abort()
   await context.route('**/*',guard);page=await context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
   row={'lang':lang,'width':width,'outcome':'FAIL'}
   try:
    await page.goto('http://127.0.0.1:8943/index.html?lang='+lang,wait_until='networkidle')
    youtube=page.get_by_role('textbox',name='YouTube',exact=True);await expect(youtube).to_be_visible();await expect(youtube).to_have_value('')
    await expect(page.get_by_role('link',name='Instagram',exact=True)).to_have_count(0)
    for label,url in [('YouTube','https://www.youtube.com/@synthetic'),('Instagram','https://www.instagram.com/synthetic'),('LinkedIn','https://www.linkedin.com/company/synthetic'),('Facebook','https://www.facebook.com/synthetic')]:await page.get_by_role('textbox',name=label,exact=True).fill(url)
    await page.get_by_role('button',name={'ru':'Сохранить','en':'Save','th':'บันทึก'}[lang],exact=True).click()
    for label in ['YouTube','Instagram','LinkedIn','Facebook']:
     link=page.get_by_role('link',name=label,exact=True);await expect(link).to_be_visible();await expect(link).to_have_attribute('target','_blank');await expect(link).to_have_attribute('rel','noopener noreferrer')
    assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth'),'Overflow'
    await page.screenshot(path=str(OUT/f'{lang}-{width}-saved.png'),full_page=True)
    await page.get_by_role('textbox',name='Instagram',exact=True).fill('');await page.get_by_role('button',name={'ru':'Сохранить','en':'Save','th':'บันทึก'}[lang],exact=True).click()
    await expect(page.get_by_role('link',name='Instagram',exact=True)).to_have_count(0)
    await expect(page.get_by_role('link',name='YouTube',exact=True)).to_have_count(1)
    assert not blocked,blocked
    assert not errors,errors
    row['outcome']='PASS'
   except Exception as e:row['error']=str(e);await page.screenshot(path=str(OUT/f'{lang}-{width}-FAIL.png'),full_page=True)
   row.update(pageErrors=errors,blockedRequests=blocked);rows.append(row);await context.close()
  await browser.close()
 (OUT/'results.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2));print(json.dumps(rows,ensure_ascii=False));assert len(rows)==5 and all(r['outcome']=='PASS' for r in rows)
asyncio.run(main())
