"""Real service hub/components with isolated catalogue readers; all external traffic denied."""
import asyncio, json, sys, os, shutil, time
from pathlib import Path
from urllib.parse import urlparse, quote
from playwright.async_api import async_playwright, expect
OUTPUT = Path(sys.argv[1])
async def main():
    provider_only=os.environ.get('SERVICES_DISCOVERY_SCOPE')=='provider'
    themes=os.environ.get('SERVICES_DISCOVERY_THEMES','light,dark').split(',')
    languages=os.environ.get('SERVICES_DISCOVERY_LANGUAGES','ru,en,th').split(',')
    widths=[int(value) for value in os.environ.get('SERVICES_DISCOVERY_WIDTHS','320,375,390,430,1440').split(',')]
    expected=2 if provider_only else len(themes)*len(languages)*len(widths)+10
    started=time.monotonic()
    results = []
    (OUTPUT/'results.json').unlink(missing_ok=True)
    (OUTPUT/'summary.json').unlink(missing_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, executable_path=None if os.environ.get('CI') else shutil.which('chromium'))
        async def route(r):
            parsed=urlparse(r.request.url)
            name='fixture.html' if parsed.path=='/fixture' else parsed.path.lstrip('/')
            types={'fixture.html':'text/html','fixture.js':'text/javascript','fixture.css':'text/css'}
            if parsed.netloc=='localhost:8080' and name in types: await r.fulfill(path=str(OUTPUT/name),content_type=types[name])
            else: await r.abort()
        semaphore=asyncio.Semaphore(2)
        async def run_case(appearance,lang,width):
            async with semaphore:
                context=await browser.new_context(viewport={'width':width,'height':900},service_workers='block')
                errors=[]
                await context.route('**/*',route)
                page=await context.new_page()
                page.on('pageerror',lambda e:errors.append(str(e)))
                entry='/discover/services?ref=fixture'
                url='http://localhost:8080/fixture?lang='+lang+'&theme='+appearance+'&entry='+quote(entry,safe='')
                await page.goto(url,wait_until='networkidle')
                assert not errors, errors
                assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth'), (lang,width,'initial overflow')
                await expect(page.get_by_role('link',name={'ru':'Мои заявки','en':'My requests','th':'คำขอของฉัน'}[lang])).to_have_attribute('href','/bookings')
                await expect(page.locator('[data-testid=service-catalogue-results] a[href="/yachts"]')).to_be_visible()
                await expect(page.locator('[data-testid=service-catalogue-results] a[href="/transport/fast-track"]')).to_have_count(1)
                await page.screenshot(path=str(OUTPUT/f'{lang}-{width}-{appearance}-catalogue.png'),full_page=True)
                await page.locator('[data-testid=service-catalogue-results] a[href="/yachts"]').click()
                await expect(page.get_by_test_id('location')).to_have_text('/yachts')
                await page.go_back()
                await expect(page.get_by_test_id('service-catalogue-results')).to_be_visible()
                # Switch via keyboard: actual Radix tabs, no force click.
                tabs=page.get_by_role('tab')
                await tabs.nth(1).focus()
                await tabs.nth(1).press('ArrowLeft')
                await expect(tabs.nth(0)).to_have_attribute('aria-selected','true')
                await page.get_by_role('combobox').scroll_into_view_if_needed()
                await page.get_by_role('combobox').press('Enter')
                await page.get_by_role('listbox').evaluate('(el)=>Promise.all(el.getAnimations().map(a=>a.finished))')
                await page.get_by_role('option',name='Приезд' if lang=='ru' else 'Arrival',exact=True).click()
                await expect(page.locator('[data-testid=service-catalogue-results] a[href="/transport/airport-transfer"]')).to_have_count(1)
                await expect(page.locator('[data-testid=service-catalogue-results] a[href="/yachts"]')).to_have_count(0)
                await tabs.nth(0).press('ArrowRight')
                await expect(tabs.nth(1)).to_have_attribute('aria-selected','true')
                await page.get_by_role('combobox').scroll_into_view_if_needed()
                await page.get_by_role('combobox').press('Enter')
                await page.get_by_role('option',name='Отдых и экскурсии' if lang=='ru' else 'Tourism & Activities',exact=True).click()
                await expect(page.get_by_text({'ru':'Услуги не найдены','en':'No services found','th':'ไม่พบบริการ'}[lang],exact=True)).to_be_visible()
                await page.get_by_role('button',name={'ru':'Сбросить поиск и фильтры','en':'Clear search and filters','th':'ล้างการค้นหาและตัวกรอง'}[lang]).click()
                # Real category popover and all 11 home children; Escape restores focus.
                parent=page.get_by_role('combobox').first
                await parent.scroll_into_view_if_needed()
                await parent.press('Enter')
                home={'ru':'Бытовые услуги','en':'Home services','th':'Home services'}[lang]
                option=page.get_by_role('option').filter(has_text=home)
                if await option.count()!=1:
                    option=page.get_by_role('option').filter(has_text='Home').first if lang=='th' else option
                await page.get_by_role('listbox').evaluate('(el)=>Promise.all(el.getAnimations().map(a=>a.finished))')
                await option.click()
                try:
                    await expect(parent).to_have_text(home)
                except Exception:
                    print(json.dumps({'selectionFailure':await page.get_by_test_id('location').text_content(),'parent':await parent.text_content(),'lang':lang,'width':width}),flush=True)
                    await page.screenshot(path=str(OUTPUT/f'{lang}-{width}-{appearance}-selection-failure.png'),full_page=True)
                    raise
                child=page.get_by_role('combobox').nth(1)
                await child.scroll_into_view_if_needed()
                await child.press('Enter')
                await expect(page.get_by_role('option')).to_have_count(12)
                await page.screenshot(path=str(OUTPUT/f'{lang}-{width}-{appearance}-home-menu.png'))
                await page.get_by_role('listbox').press('Escape')
                await expect(child).to_be_focused()
                await child.scroll_into_view_if_needed()
                await child.press('Enter')
                await page.get_by_role('option',name={'ru':'Кондиционеры','en':'Air Conditioning','th':'เครื่องปรับอากาศ'}[lang],exact=True).click()
                search=page.get_by_role('searchbox')
                await search.fill('Чистка' if lang=='ru' else 'Cleaning')
                await expect(page.get_by_test_id('service-request-card')).to_have_count(1)
                assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth'), (lang,width,'filtered overflow')
                await page.screenshot(path=str(OUTPUT/f'{lang}-{width}-{appearance}-filtered.png'),full_page=True)
                action=page.get_by_test_id('service-request-card')
                await action.press('Enter')
                await expect(page.get_by_test_id('location')).to_contain_text('/services/order/')
                await expect(page.get_by_role('heading',level=1)).to_be_visible()
                await page.get_by_role('button',name='Go back').click()
                await expect(page.get_by_test_id('location')).to_contain_text('/discover/services?')
                await expect(search).to_have_value('Чистка' if lang=='ru' else 'Cleaning')
                await expect(child).to_have_text({'ru':'Кондиционеры','en':'Air Conditioning','th':'เครื่องปรับอากาศ'}[lang])
                # Rapid searches settle synchronously; no stale results / duplicate actions.
                await search.fill('zz-no-match')
                await expect(page.get_by_test_id('service-request-card')).to_have_count(0)
                await search.fill('Cleaning')
                await search.fill('zz-no-match')
                reset=page.get_by_role('button',name={'ru':'Сбросить поиск и фильтры','en':'Clear search and filters','th':'ล้างการค้นหาและตัวกรอง'}[lang])
                await reset.click()
                await expect(page.get_by_test_id('service-catalogue-results')).to_be_visible()
                await expect(page.get_by_test_id('location')).to_contain_text('ref=fixture')
                assert not errors, errors
                results.append({'lang':lang,'width':width,'theme':appearance,'scenario':'interactive','registeredFontFaces':await page.evaluate('document.fonts.size'),'passed':True})
                print(json.dumps({'completed':len(results),'expected':expected,'lang':lang,'width':width,'theme':appearance}),flush=True)
                await context.close()
        if not provider_only:
            await asyncio.gather(*(run_case(theme,lang,width) for theme in themes for lang in languages for width in widths))
            # Distinct states must be real, not populated screenshots labelled loading.
            for phase in ['loading','error','empty']:
                context=await browser.new_context(viewport={'width':390,'height':900},service_workers='block')
                await context.route('**/*',route)
                page=await context.new_page()
                await page.goto('http://localhost:8080/fixture?lang=en&phase='+phase,wait_until='networkidle')
                if phase=='loading': await expect(page.get_by_role('status')).to_have_text('Loading catalogue…')
                elif phase=='error':
                    await expect(page.get_by_role('alert')).to_be_visible()
                    await page.get_by_role('button',name='Try again').click()
                    assert await page.evaluate('window.fixtureRetry')==1
                else: await expect(page.get_by_text('No services found',exact=True)).to_be_visible()
                await expect(page.get_by_test_id('service-catalogue-results')).to_have_count(0)
                await page.screenshot(path=str(OUTPUT/f'en-390-{phase}.png'),full_page=True)
                results.append({'lang':'en','width':390,'scenario':phase,'passed':True})
                await context.close()
        for width in [390,1440]:
            context=await browser.new_context(viewport={'width':width,'height':900},service_workers='block')
            await context.route('**/*',route)
            page=await context.new_page()
            errors=[]
            page.on('pageerror',lambda error:errors.append(str(error)))
            await page.goto('http://localhost:8080/fixture?lang=en&phase=provider&entry='+quote('/discover/services?q=synthetic&ref=provider',safe=''),wait_until='networkidle')
            await expect(page.get_by_role('heading',name='Provider offers',exact=True)).to_be_visible()
            await expect(page.get_by_text('No services found',exact=True)).to_have_count(0)
            await expect(page.get_by_text('Synthetic AC service',exact=True)).to_be_visible()
            await expect(page.get_by_role('link',name='Synthetic team',exact=True)).to_have_attribute('href','/services/provider/provider-synthetic?returnTo=%2Fdiscover%2Fservices%3Fq%3Dsynthetic%26ref%3Dprovider')
            await expect(page.get_by_text('The provider must confirm',exact=False)).to_be_visible()
            assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth')
            await page.screenshot(path=str(OUTPUT/f'en-{width}-provider-offer.png'),full_page=True)
            await page.get_by_role('combobox').press('Enter')
            await page.get_by_role('option',name='Home services',exact=True).click()
            await expect(page.get_by_text('Synthetic AC service',exact=True)).to_have_count(0)
            await expect(page.get_by_text('Clear the category and situation',exact=False)).to_be_visible()
            await page.get_by_role('button',name='Browse provider offers',exact=True).click()
            await expect(page.get_by_role('searchbox')).to_have_value('synthetic')
            await expect(page.get_by_text('Synthetic AC service',exact=True)).to_be_visible()
            await page.get_by_role('searchbox').fill('zz-no-match')
            await expect(page.get_by_text('No services found',exact=True)).to_have_count(1)
            await expect(page.get_by_role('heading',name='Provider offers',exact=True)).to_have_count(0)
            assert not errors, errors
            results.append({'lang':'en','width':width,'scenario':'provider-layer','passed':True})
            await context.close()
        if not provider_only:
            context=await browser.new_context(viewport={'width':390,'height':900},service_workers='block')
            await context.route('**/*',route)
            page=await context.new_page()
            await page.goto('http://localhost:8080/fixture?lang=en&entry='+quote('/discover/services?situation=emergency&q=AC&ref=review',safe=''),wait_until='networkidle')
            await expect(page.get_by_text('AC Cleaning',exact=True)).to_have_count(0)
            await expect(page.get_by_text('Specific home requests are not classified by situation',exact=False)).to_be_visible()
            await page.screenshot(path=str(OUTPUT/'en-390-home-situation-unresolved.png'),full_page=True)
            await page.get_by_role('button',name='Browse home requests',exact=True).click()
            await expect(page.get_by_text('AC Cleaning',exact=True)).to_be_visible()
            await expect(page.get_by_role('searchbox')).to_have_value('AC')
            await expect(page.get_by_test_id('location')).to_contain_text('ref=review')
            await expect(page.get_by_test_id('location')).not_to_contain_text('situation=')
            assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth')
            results.append({'lang':'en','width':390,'scenario':'home-situation-boundary','passed':True})
            await context.close()
        if not provider_only:
            for width in [390,1440]:
                context=await browser.new_context(viewport={'width':width,'height':900},service_workers='block')
                await context.route('**/*',route)
                page=await context.new_page()
                errors=[]
                page.on('pageerror',lambda error:errors.append(str(error)))
                await page.goto('http://localhost:8080/fixture?lang=en&phase=db-home&entry='+quote('/discover/services?category=cat-home-services&ref=db#cards',safe=''),wait_until='networkidle')
                home=page.get_by_role('link',name='Home services All home services',exact=True)
                await expect(home).to_have_attribute('href','/discover/services?category=cat-home-services')
                for repeat in range(2):
                    await home.click()
                    await expect(page.get_by_text('Deep Cleaning',exact=True)).to_be_visible()
                    await expect(page.get_by_test_id('location')).to_contain_text('category=cat-home-services')
                    await page.go_back()
                    await expect(page.get_by_test_id('location')).to_have_text('/discover/services?category=cat-home-services&ref=db#cards')
                    await expect(home).to_be_visible()
                await page.screenshot(path=str(OUTPUT/f'en-{width}-db-home.png'),full_page=True)
                assert not errors, errors
                results.append({'lang':'en','width':width,'scenario':'db-home-navigation','passed':True})
                await page.goto('http://localhost:8080/fixture?lang=en&entry='+quote('/discover/arrival?ref=life#services',safe=''),wait_until='networkidle')
                await expect(page.get_by_role('link',name='Service transfer')).to_have_attribute('href','/transport/airport-transfer')
                await expect(page.get_by_role('link',name='Service yacht')).to_have_attribute('href','/yachts')
                await expect(page.get_by_text('This offering is not available to open yet.')).to_be_visible()
                await expect(page.get_by_role('link',name='unknown-service')).to_have_count(0)
                for name,target in [('Service transfer','/transport/airport-transfer'),('Service yacht','/yachts')]:
                    await page.get_by_role('link',name=name,exact=True).click()
                    await expect(page.get_by_test_id('location')).to_have_text(target)
                    await page.go_back()
                    await expect(page.get_by_test_id('location')).to_have_text('/discover/arrival?ref=life#services')
                await page.screenshot(path=str(OUTPUT/f'en-{width}-lifeos-identities.png'),full_page=True)
                assert not errors, errors
                results.append({'lang':'en','width':width,'scenario':'lifeos-seeded-identities','passed':True})
                await context.close()
        await browser.close()
    assert len(results)==expected and len({(r['lang'],r['width'],r.get('theme'),r['scenario']) for r in results})==expected
    (OUTPUT/'summary.json').write_text(json.dumps({'expected':expected,'scope':'provider' if provider_only else 'full','passed':len(results),'configuredConcurrency':2,'elapsedSeconds':round(time.monotonic()-started,2),'evidence':'isolated real components; synthetic readers; no external requests; no registered web fonts'},indent=2))
    (OUTPUT/'results.json').write_text(json.dumps(results,indent=2))
    print(json.dumps(results))
asyncio.run(main())
