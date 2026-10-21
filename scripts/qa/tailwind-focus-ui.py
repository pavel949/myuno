"""Keyboard focus, forced colors and real control styles; deny external requests."""
import asyncio
import json
import sys
from pathlib import Path
from urllib.parse import urlparse
from playwright.async_api import async_playwright, expect

OUTPUT = Path(sys.argv[1])


async def main():
    results = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        for theme in ['light', 'dark']:
            for width in [390, 1440]:
                context = await browser.new_context(viewport={'width': width, 'height': 850},
                                                    color_scheme=theme, service_workers='block')
                blocked, errors = [], []

                async def route(r):
                    url = urlparse(r.request.url)
                    name = 'fixture.html' if url.path == '/fixture' else url.path.lstrip('/')
                    types = {'fixture.html': 'text/html', 'fixture.js': 'text/javascript', 'fixture.css': 'text/css'}
                    if url.netloc == 'localhost:8080' and name in types:
                        await r.fulfill(path=str(OUTPUT / name), content_type=types[name])
                    else:
                        blocked.append(r.request.url)
                        await r.abort()

                await context.route('**/*', route)
                page = await context.new_page()
                page.on('pageerror', lambda error: errors.append(str(error)))
                await page.goto('http://localhost:8080/fixture', wait_until='networkidle')
                await page.evaluate('(dark)=>document.documentElement.classList.toggle("dark",dark)', theme == 'dark')
                button = page.get_by_role('button', name='Find a home')
                field = page.get_by_role('textbox', name='Your search')
                await page.keyboard.press('Tab')
                await expect(button).to_be_focused()
                style = await button.evaluate('''el => {
                    const s=getComputedStyle(el), b=el.getBoundingClientRect();
                    return {shadow:s.boxShadow,width:b.width,height:b.height,color:s.color,background:s.backgroundColor,cursor:s.cursor};
                }''')
                assert style['shadow'] != 'none', style
                assert style['width'] >= 44 and style['height'] >= 44, style
                assert style['cursor'] == 'pointer', style
                contrast = await button.evaluate('''el => {
                    const s=getComputedStyle(el), canvas=document.createElement('canvas'), ctx=canvas.getContext('2d');
                    function luminance(color){ctx.fillStyle=color;ctx.fillRect(0,0,1,1);const rgb=ctx.getImageData(0,0,1,1).data;
                      return [0.2126,0.7152,0.0722].reduce((v,w,i)=>{let n=rgb[i]/255;return v+w*(n<=.04045?n/12.92:((n+.055)/1.055)**2.4);},0);}
                    const a=luminance(s.color),b=luminance(s.backgroundColor);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
                }''')
                assert contrast >= 4.5, {'contrast': contrast, 'style': style}
                assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth')
                await page.screenshot(path=str(OUTPUT / f'{theme}-{width}-keyboard.png'), animations='disabled')
                await page.emulate_media(forced_colors='active')
                for control in [button, field]:
                    await expect(control).to_be_focused()
                    await expect(control).to_have_css('outline-style', 'solid')
                    await expect(control).to_have_css('outline-width', '2px')
                    await expect(control).to_have_css('outline-offset', '2px')
                    outline = await control.evaluate('el=>{const s=getComputedStyle(el);return {style:s.outlineStyle,width:s.outlineWidth,offset:s.outlineOffset};}')
                    assert outline == {'style': 'solid', 'width': '2px', 'offset': '2px'}, outline
                    await page.screenshot(path=str(OUTPUT / f'{theme}-{width}-forced-{await control.get_attribute("aria-label") or "button"}.png'), animations='disabled')
                    await page.keyboard.press('Tab')
                assert not blocked and not errors, {'blocked': blocked, 'errors': errors}
                results.append({'theme': theme, 'width': width, 'outcome': 'PASS', 'contrast': contrast,
                                'forced_colors': 'PASS', 'external_requests': blocked, 'runtime_errors': errors})
                await context.close()
        await browser.close()
    (OUTPUT / 'results.json').write_text(json.dumps(results, indent=2))
    print(json.dumps(results, indent=2))


asyncio.run(main())
