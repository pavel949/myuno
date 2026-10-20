"""Remote-CI-only breakpoint gutters and synthetic partner state geometry."""
import asyncio
import json
import os
from pathlib import Path
import sys
from urllib.parse import urlparse
from playwright.async_api import async_playwright, expect

ASSETS = Path(sys.argv[1])
OUTPUT = Path('/tmp/browser/header-partner-isolated')
BOUNDARIES = [639, 640, 767, 768, 820, 821, 1023, 1024, 1100, 1101, 1279, 1280]
CASES = [('en', width, surface, 'normal') for width in BOUNDARIES for surface in ['chrome', 'overlay']]
CASES += [(lang, width, surface, 'normal') for lang in ['ru', 'th'] for width in [639, 768, 1024, 1280] for surface in ['chrome', 'overlay']]
CASES += [(lang, width, 'partner', state) for lang in ['ru', 'en'] for width in [320, 768, 1280] for state in ['normal', 'success', 'error']]
CASES += [('th', width, 'partner', 'normal') for width in [320, 1280]]


async def overflow(locator):
    return await locator.evaluate_all("""els=>els.filter(e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden').map(e=>{const r=e.getBoundingClientRect();return{text:(e.textContent||e.getAttribute('placeholder')||'').trim().slice(0,100),left:r.left,right:r.right,overflow:e.scrollWidth>e.clientWidth+1}}).filter(r=>r.left < -1||r.right>innerWidth+1||r.overflow)""")


async def chrome(page, surface, width):
    header = page.locator('.consumer-header')
    inner = header.locator('.consumer-header-inner')
    await expect(inner).to_be_visible()
    metrics = await inner.evaluate("""e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e),f=document.querySelector('[data-testid="canonical-frame"]'),fr=f.getBoundingClientRect(),fs=getComputedStyle(f);return{padding:parseFloat(s.paddingLeft),rightPadding:parseFloat(s.paddingRight),left:r.left+parseFloat(s.paddingLeft),frameLeft:fr.left+parseFloat(fs.paddingLeft),framePadding:parseFloat(fs.paddingLeft)}}""")
    expected = 24 if surface == 'overlay' and width <= 820 else 56 if surface == 'overlay' else metrics['framePadding']
    assert abs(metrics['padding']-expected)<=1 and abs(metrics['rightPadding']-expected)<=1, metrics
    if surface == 'chrome':
        assert abs(metrics['left']-metrics['frameLeft'])<=1, metrics
    bad = await overflow(header.locator('button,a'))
    assert not bad, {'headerBounds': bad}
    menu = header.locator('.consumer-menu')
    if await menu.is_visible():
        await menu.click()
        dialog = page.get_by_role('dialog')
        await expect(dialog).to_be_visible()
        menu_metrics = await dialog.evaluate("""e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect(),a=e.querySelector('nav a'),ar=a.getBoundingClientRect();return{padding:parseFloat(s.paddingLeft),rightPadding:parseFloat(s.paddingRight),left:r.left,firstLink:ar.left}}""")
        expected_menu = 24 if surface == 'overlay' else metrics['framePadding']
        assert abs(menu_metrics['padding']-expected_menu)<=1 and abs(menu_metrics['rightPadding']-expected_menu)<=1, menu_metrics
        assert abs(menu_metrics['firstLink']-menu_metrics['left']-expected_menu)<=2, menu_metrics
        bad = await overflow(dialog.locator('button,a'))
        assert not bad, {'menuBounds': bad}
        await dialog.locator('button').last.click()
        await expect(dialog).not_to_be_visible()
        metrics['menu'] = menu_metrics
    return metrics


async def partner(page, state):
    frame = page.locator('main > .max-w-3xl')
    await expect(frame).to_have_count(1)
    await expect(page.locator('[data-fixture-auto-frame]')).to_have_count(0)
    if state != 'normal':
        form = page.locator('form')
        await form.locator('button[type="button"]').first.click()
        required = form.locator('input[required]')
        assert await required.count() == 4
        for index, value in enumerate(['Synthetic business', 'Synthetic contact', 'fixture@example.invalid', '123456789']):
            await required.nth(index).fill(value)
        await form.locator('textarea').fill('Synthetic partner description only')
        await form.locator('button[type="submit"]').click()
        await page.wait_for_function("window.fixturePartnerCalls.filter(x=>x.operation==='synthetic-insert').length===1")
        if state == 'success':
            await expect(page.locator('form')).to_have_count(0)
            await expect(page.get_by_role('heading', name='Заявка принята!' if await page.locator('html').get_attribute('lang') == 'ru' else 'Application Received!')).to_be_visible()
            await page.wait_for_function("window.fixturePartnerCalls.filter(x=>x.operation==='synthetic-notification').length===1")
        else:
            await expect(form.locator('button[type="submit"]')).to_be_enabled()
            await expect(required.nth(0)).to_have_value('Synthetic business')
    geometry = await frame.evaluate("""e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return{width:r.width,left:r.left,right:r.right,padding:parseFloat(s.paddingLeft),expectedLeft:Math.max(0,(innerWidth-768)/2)}}""")
    assert geometry['width']<=768 and abs(geometry['left']-geometry['expectedLeft'])<=1, geometry
    bad = await overflow(frame.locator('input,textarea,button'))
    assert not bad, {'partnerBounds': bad}
    calls = await page.evaluate('window.fixturePartnerCalls')
    assert sum(x['operation']=='synthetic-insert' for x in calls)==(0 if state=='normal' else 1), calls
    assert sum(x['operation']=='synthetic-notification' for x in calls)==(1 if state=='success' else 0), calls
    if state != 'normal':
        payload = next(x['payload'] for x in calls if x['operation']=='synthetic-insert')
        assert payload['user_id']=='synthetic' and payload['status']=='pending' and payload['contact_email']=='fixture@example.invalid', payload
    return {'frame': geometry, 'syntheticCalls': calls}


async def main():
    if not os.environ.get('CI') or os.environ.get('GITHUB_ACTIONS')!='true':
        raise RuntimeError('Browser execution is remote GitHub CI-only')
    OUTPUT.mkdir(parents=True, exist_ok=True)
    results = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        for lang, width, surface, state in CASES:
            context = await browser.new_context(viewport={'width': width, 'height': 900}, service_workers='block', reduced_motion='reduce')
            blocked, errors = [], []
            async def route(request):
                parsed = urlparse(request.request.url)
                name = 'fixture.html' if parsed.path=='/fixture' else parsed.path.lstrip('/')
                types = {'fixture.html':'text/html','fixture.js':'text/javascript','fixture.css':'text/css'}
                if parsed.netloc=='localhost:8080' and name in types:
                    await request.fulfill(path=str(ASSETS/name),content_type=types[name])
                else:
                    blocked.append(request.request.url)
                    await request.abort()
            await context.route('**/*', route)
            page = await context.new_page()
            page.on('pageerror', lambda error: errors.append(str(error)))
            row = {'lang':lang,'width':width,'surface':surface,'state':state,'outcome':'FAIL'}
            try:
                await page.goto(f'http://localhost:8080/fixture?lang={lang}&surface={surface}&state={state}',wait_until='networkidle')
                await page.evaluate('document.fonts.ready')
                row['geometry'] = await partner(page,state) if surface=='partner' else await chrome(page,surface,width)
                assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth'), 'document overflow'
                assert not blocked and not errors, {'blocked':blocked,'runtimeErrors':errors}
                row['outcome']='PASS'
            except Exception as error:
                row.update(error=str(error),details=error.args[0] if error.args and isinstance(error.args[0],dict) else None,blocked=blocked,runtimeErrors=errors)
            results.append(row)
            (OUTPUT/'results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
            await page.screenshot(path=str(OUTPUT/f'{lang}-{width}-{surface}-{state}-{row["outcome"]}.png'),full_page=True)
            await context.close()
        await browser.close()
    assert len(results)==60 and all(x['outcome']=='PASS' for x in results), {'completed':len(results),'failed':sum(x['outcome']!='PASS' for x in results)}


if __name__=='__main__':
    asyncio.run(main())
