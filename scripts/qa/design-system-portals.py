"""Actual layout pixels; synthetic data/outlets. ALL non-local transport denied.
Requires root-approved current compiled CSS path; never selects diagnostic CSS.
Safe-area check exercises token propagation, not real hardware env() measurement.
"""
import asyncio, hashlib, json, sys, shutil, traceback, os
from pathlib import Path
from playwright.async_api import async_playwright
OUTPUT, CSS = Path(sys.argv[1]), Path(sys.argv[2])
if not CSS.is_file(): raise RuntimeError('Current compiled CSS missing: ' + str(CSS))
SCENES = ['vendor', 'guest', 'team', 'capital', 'developer', 'owner']
SMOKE = os.environ.get('DS_PORTALS_SMOKE') == '1'
async def main():
    results = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, executable_path=shutil.which('chromium'), args=['--no-sandbox'])
        for scene in SCENES:
            for lang in (['ru'] if SMOKE else ['ru', 'en', 'th']):
                for width in ([390] if SMOKE else [375,390,430,768,1440]):
                    for theme in ['light', 'dark']:
                        row = dict(scene=scene, lang=lang, width=width, theme=theme, mode='actual layout / synthetic data and Outlet', assertions=[])
                        context = await browser.new_context(viewport={'width':width, 'height':900}, has_touch=width<640, service_workers='block')
                        errors, blocked = [], []
                        async def route(r):
                            url = r.request.url
                            pathname = url.split('?',1)[0].rsplit('/',1)[-1]
                            files = {'index.html': (OUTPUT/'index.html','text/html'), 'app.js':(OUTPUT/'app.js','text/javascript'), 'app.css':(OUTPUT/'app.css','text/css'), 'normal.css':(CSS,'text/css')}
                            if url.startswith('http://localhost:8080/') and pathname in files:
                                file, kind = files[pathname]
                                if file.is_file(): await r.fulfill(path=str(file),content_type=kind)
                                else: await r.fulfill(body='',content_type=kind)
                            else:
                                blocked.append(url)
                                await r.abort()
                        await context.route('**/*',route)
                        page = await context.new_page()
                        page.on('pageerror',lambda error: errors.append(str(error)))
                        try:
                            await page.goto(f'http://localhost:8080/index.html?scene={scene}&lang={lang}&theme={theme}',wait_until='networkidle')
                            await page.locator('#fixture-theme').wait_for()
                            await page.wait_for_timeout(200)
                            if errors: raise AssertionError(errors)
                            assert await page.locator('#fixture-theme-value').inner_text() == theme
                            if scene=='owner':
                                await page.get_by_text('Тестовый объект владельца' if lang=='ru' else 'Synthetic owner property',exact=True).wait_for()
                            else:
                                await page.locator('#fixture-draft').wait_for()
                                await page.locator('#fixture-draft').fill('Synthetic unsaved state')
                            row['assertions'].append('actual layout rendered, no page errors')
                            assert await page.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'horizontal page overflow'
                            row['assertions'].append('no horizontal page overflow')
                            route_before = await page.locator('#fixture-route').inner_text()
                            mounts = await page.evaluate('window.fixtureMounts')
                            for expected in ['dark' if theme=='light' else 'light',theme]:
                                await page.locator('#fixture-theme').click()
                                await page.wait_for_function("expected=>document.documentElement.getAttribute('data-theme-ready')===expected && document.querySelector('#fixture-theme-value').textContent===expected",arg=expected)
                            assert await page.locator('#fixture-theme-value').inner_text() == theme, 'theme roundtrip did not finish'
                            # Separate rapid-repeat regression: no readiness wait between real clicks.
                            await page.locator('#fixture-theme').click()
                            await page.locator('#fixture-theme').click()
                            await page.wait_for_function("expected=>document.documentElement.getAttribute('data-theme-ready')===expected && document.querySelector('#fixture-theme-value').textContent===expected",arg=theme)
                            assert await page.evaluate("expected=>document.documentElement.classList.contains('dark')===(expected==='dark') && localStorage.getItem('myuno-theme')===expected",theme), 'rapid-click theme DOM/storage mismatch'
                            row['assertions'].append('two rapid clicks without readiness waits return to the initial theme')
                            assert await page.locator('#fixture-route').inner_text() == route_before
                            if scene!='owner':
                                assert await page.locator('#fixture-draft').input_value()=='Synthetic unsaved state'
                                assert await page.evaluate('window.fixtureMounts')==mounts
                                assert await page.evaluate('window.fixtureUnmounts')==0
                                await page.locator('#fixture-draft').focus()
                            else: await page.get_by_role('button').filter(has_text='').first.focus()
                            await page.keyboard.press('Tab')
                            assert await page.evaluate("()=>{const e=document.activeElement;return e&&e!==document.body&&e.getClientRects().length>0}"), 'keyboard focus lost'
                            row['assertions'].append('repeat real ThemeProvider switching preserves route/draft mounts; keyboard focus remains usable')
                            # Actual capital/sidebar modal chrome only; no synthetic substitute menu.
                            triggers = page.get_by_role('button', name='Toggle Sidebar', exact=True)
                            if width<640 and await triggers.count() and await triggers.first.is_visible():
                                await triggers.first.click()
                                dialogs = page.get_by_role('dialog')
                                if await dialogs.count():
                                    await dialogs.last.wait_for(state='visible')
                                    await page.keyboard.press('Escape')
                                    await dialogs.last.wait_for(state='hidden')
                                    row['assertions'].append('actual sidebar mobile dialog opens/closes with Escape')
                                else: row['menu']='trigger present but no mobile dialog; inspect screenshot'
                            else: row['menu']='no sidebar toggle exposed in this layout; menu behavior not claimed'
                            if width<640:
                                padding = await page.locator('.ds-page-with-navigation,.ds-shell-with-navigation').evaluate_all("es=>es.map(e=>parseFloat(getComputedStyle(e).paddingBottom))")
                                row['bottomPaddingBefore']=padding
                                await page.evaluate("document.documentElement.style.setProperty('--bottom-nav-h','84px')")
                                simulated = await page.locator('.ds-page-with-navigation,.ds-shell-with-navigation').evaluate_all("es=>es.map(e=>parseFloat(getComputedStyle(e).paddingBottom))")
                                assert all(after >= before for before,after in zip(padding,simulated)), 'navigation clearance failed token increase'
                                if scene in ['team','capital','owner']: assert simulated and min(simulated)>=84, 'shared clearance absent'
                                row['safeArea']='synthetic 84px bottom-nav token propagates; physical env safe area unverified' if padding else 'UNVERIFIED: no matching clearance producer in this layout'
                                await page.evaluate("document.documentElement.style.removeProperty('--bottom-nav-h')")
                            await page.locator('#fixture-theme').scroll_into_view_if_needed()
                            filename=f'{scene}-{lang}-{width}-{theme}.png'
                            await page.screenshot(path=str(OUTPUT/filename),full_page=True)
                            row['screenshot']=filename
                            row['status']='PASS'
                        except Exception as error:
                            row['status']='FAIL';row['failure']=str(error);row['traceback']=traceback.format_exc()
                            await page.screenshot(path=str(OUTPUT/f'{scene}-{lang}-{width}-{theme}-FAIL.png'),full_page=True)
                        row['pageErrors']=errors; row['blockedRequests']=blocked
                        results.append(row)
                        await context.close()
        await browser.close()
    report={'scope':str(len(results))+' isolated actual-layout frames; backend/roles/data correctness not tested','cssPath':str(CSS),'cssSha256':hashlib.sha256(CSS.read_bytes()).hexdigest(),'manifest':json.loads((OUTPUT/'manifest.json').read_text()),'results':results}
    (OUTPUT/'results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
    failures=[row for row in results if row['status']!='PASS']
    print(json.dumps({'cases':len(results),'passed':len(results)-len(failures),'failed':len(failures),'report':str(OUTPUT/'results.json')}))
    if failures: raise SystemExit(1)
asyncio.run(main())
