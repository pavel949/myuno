"""Explicitly local isolated geometry audit over existing allowed service/property fixtures.

No CI-only runner is invoked and no production reader/writer or external request is allowed.
The actual FeatureLayout, PropertySearchPage/ConsumerHeader and service form own their geometry.
"""
import asyncio, json, os, shutil, sys
from pathlib import Path
from urllib.parse import quote, urlparse
from playwright.async_api import async_playwright, expect
SERVICES, PROPERTY, OUT = map(Path, sys.argv[1:4])
RECORD_ONLY = '--record-only' in sys.argv
WIDTHS = [320,390,430,1280,1440,1920,2560]
async def main():
    OUT.mkdir(parents=True,exist_ok=True)
    rows=[]
    async with async_playwright() as playwright:
        browser=await playwright.chromium.launch(headless=True,executable_path=None if os.environ.get('CI') else shutil.which('chromium'))
        for surface in ['services','housing','form']:
            base=PROPERTY if surface=='housing' else SERVICES
            for width in WIDTHS:
                context=await browser.new_context(viewport={'width':width,'height':1000},device_scale_factor=1,service_workers='block')
                errors=[]
                async def route(request):
                    parsed=urlparse(request.request.url)
                    name='fixture.html' if parsed.path=='/fixture' else parsed.path.lstrip('/')
                    types={'fixture.html':'text/html','fixture.js':'text/javascript','fixture.css':'text/css','synthetic-property.svg':'image/svg+xml'}
                    if parsed.netloc=='localhost:8080' and request.request.method=='GET' and name in types and (base/name).is_file():
                        await request.fulfill(path=str(base/name),content_type=types[name])
                    else: await request.abort()
                await context.route('**/*',route)
                page=await context.new_page()
                page.on('pageerror',lambda error:errors.append(str(error)))
                entry='/property/search' if surface=='housing' else '/services/order/ac_cleaning' if surface=='form' else '/discover/services'
                await page.goto('http://localhost:8080/fixture?lang=en&navEntry=1&entry='+quote(entry,safe=''),wait_until='networkidle')
                assert await page.evaluate('innerWidth')==width
                assert await page.evaluate('devicePixelRatio')==1
                assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(surface,width,'document overflow')
                selector='.property-discovery' if surface=='housing' else '.public-commerce-form' if surface=='form' else '.public-commerce--services.ds-frame-catalogue'
                frame=page.locator(selector)
                await expect(frame).to_be_visible()
                metric=await frame.evaluate('e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return{left:r.left,right:r.right,width:r.width,paddingLeft:parseFloat(s.paddingLeft),paddingRight:parseFloat(s.paddingRight),maxWidth:s.maxWidth}}')
                row={'surface':surface,'viewport':width,'frame':metric,'innerWidth':await page.evaluate('innerWidth'),'outcome':'PASS'}
                if surface!='form':
                    expected_frame=min(width,1760)
                    assert abs(metric['width']-expected_frame)<1,(surface,width,metric)
                    grid=page.get_by_test_id('property-results-grid' if surface=='housing' else 'service-catalogue-results')
                    await expect(grid).to_be_visible()
                    geometry=await grid.evaluate('e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return{width:r.width,columns:s.gridTemplateColumns.split(" ").length,columnWidths:s.gridTemplateColumns,gap:s.gap}}')
                    row['grid']=geometry
                    if not RECORD_ONLY:
                        expected_columns=4 if width>=1440 else 3 if width>=1024 else 2 if width>=640 else 1
                        assert geometry['columns']==expected_columns,(surface,width,geometry)
                    if surface=='housing':
                        await expect(page.locator('[data-property-mode]')).to_have_attribute('data-property-mode','all')
                        assert await grid.locator(':scope > *').count()>=20
                        header=page.locator('.consumer-header-inner')
                        header_metric=await header.evaluate('e=>({width:e.getBoundingClientRect().width,left:e.getBoundingClientRect().left})')
                        row['consumerHeader']=header_metric
                        assert abs(header_metric['width']-metric['width'])<1,(row,'header/content mismatch')
                    else:
                        feature_header=page.locator('.ds-frame-catalogue').first
                        row['featureHeader']=await feature_header.evaluate('e=>({width:e.getBoundingClientRect().width,left:e.getBoundingClientRect().left})')
                        assert abs(row['featureHeader']['width']-metric['width'])<1
                else:
                    assert abs(metric['width']-min(width,832))<1,(surface,width,metric)
                    row['formHeader']=await page.locator('.public-commerce-form-header > div').evaluate('e=>({width:e.getBoundingClientRect().width})')
                    assert abs(row['formHeader']['width']-metric['width'])<1
                if width==1920:
                    token='--layout-width-form' if surface=='form' else '--layout-width-catalogue'
                    replacement=760 if surface=='form' else 1600
                    await page.evaluate('([name,value])=>document.documentElement.style.setProperty(name,value)',[token,str(replacement)+'px'])
                    overridden=await frame.evaluate('e=>e.getBoundingClientRect().width')
                    assert abs(overridden-replacement)<1,(surface,'token propagation',overridden)
                    aligned=page.locator('.public-commerce-form-header > div') if surface=='form' else page.locator('.consumer-header-inner') if surface=='housing' else page.locator('.ds-frame-catalogue').first
                    assert abs(await aligned.evaluate('e=>e.getBoundingClientRect().width')-replacement)<1
                    row['tokenOverride']={'token':token,'measuredWidth':overridden}
                    await page.evaluate('(name)=>document.documentElement.style.removeProperty(name)',token)
                    assert abs(await frame.evaluate('e=>e.getBoundingClientRect().width')-metric['width'])<1
                assert not errors,errors
                await page.screenshot(path=str(OUT/f'{surface}-{width}.png'),full_page=False)
                rows.append(row)
                print(json.dumps(row),flush=True)
                await context.close()
        await browser.close()
    assert len(rows)==21
    (OUT/'results.json').write_text(json.dumps(rows,indent=2))
asyncio.run(main())
