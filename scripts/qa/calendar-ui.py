"""Synthetic calendar QA: real calendar rendering, no auth/network/writers."""
import asyncio, json, sys
from pathlib import Path
from playwright.async_api import async_playwright, expect
OUTPUT=Path(sys.argv[1])
async def main():
    results=[]
    async with async_playwright() as p:
        browser=await p.chromium.launch(headless=True)
        for tz,lang,width in [(tz,lang,width) for tz in ['UTC','Asia/Bangkok','America/New_York'] for lang in ['ru','en'] for width in [375,390,430,1280]]:
                context=await browser.new_context(viewport={'width':width,'height':1800},has_touch=width<640,service_workers='block',timezone_id=tz)
                blocked=[]; errors=[]
                async def route(r):
                    url=r.request.url
                    file='fixture.html' if '/fixture?' in url else url.rsplit('/',1)[-1]
                    types={'fixture.html':'text/html','fixture.js':'text/javascript','fixture.css':'text/css'}
                    if url.startswith('http://localhost:8080/') and file in types:
                        await r.fulfill(path=str(OUTPUT/file),content_type=types[file])
                    else:
                        blocked.append(url); await r.abort()
                await context.route('**/*',route)
                page=await context.new_page(); page.on('pageerror',lambda e:errors.append(str(e)))
                await page.goto(f'http://localhost:8080/fixture?lang={lang}',wait_until='networkidle')
                async def bounds(stage):
                    data=await page.evaluate('''()=>({scroll:document.documentElement.scrollWidth,controls:[...document.querySelectorAll('button,input,[role="combobox"]')].filter(e=>e.getBoundingClientRect().width>0 && !e.closest('[role="region"]')).map(e=>{let r=e.getBoundingClientRect();return {label:e.textContent,left:r.left,right:r.right}})})''')
                    assert data['scroll']<=width,(stage,data)
                    assert all(c['left']>=-1 and c['right']<=width+1 for c in data['controls']),(stage,data)
                await bounds('initial')
                portfolio=page.get_by_role('button',name='Все объекты' if lang=='ru' else 'Portfolio',exact=True)
                single=page.get_by_role('button',name='Один объект' if lang=='ru' else 'Single property',exact=True)
                assert await (portfolio if width>=768 else single).get_attribute('aria-pressed')=='true'
                await single.click(); await expect(single).to_have_attribute('aria-pressed','true')
                await page.get_by_role('combobox').click()
                await page.get_by_role('option',name='Вторые тестовые апартаменты' if lang=='ru' else 'Second synthetic apartment',exact=True).click()
                await page.get_by_role('combobox').click()
                await page.get_by_role('option',name='Просторные семейные апартаменты с панорамным видом на море' if lang=='ru' else 'Spacious family apartment with panoramic sea view',exact=True).click()
                for action,dialog in [('Добавить бронирование' if lang=='ru' else 'Add Booking','AddBookingFromCalendarDialog'),('Добавить задачу' if lang=='ru' else 'Add Task','CreateServiceTaskDialog')]:
                    await page.get_by_role('button',name=action,exact=True).click()
                    await expect(page.get_by_role('dialog',name=dialog)).to_be_visible()
                    await page.get_by_role('button',name='Close fixture').click()
                period=page.get_by_role('group',name='Месяц календаря' if lang=='ru' else 'Calendar month')
                before=await period.get_by_role('heading').inner_text()
                await page.get_by_role('button',name='Следующий месяц' if lang=='ru' else 'Next month').click()
                assert await period.get_by_role('heading').inner_text()!=before
                await page.get_by_role('button',name='Предыдущий месяц' if lang=='ru' else 'Previous month').click()
                assert await period.get_by_role('heading').inner_text()==before
                await page.get_by_role('button',name='Alexandra / Александра — synthetic booking:').first.click()
                await expect(page.get_by_role('dialog',name='CalendarDayEventsSheet')).to_contain_text('fixture-booking')
                await page.get_by_role('button',name='Close fixture').click()
                checkout_label=await page.evaluate('window.fixtureCheckoutLabel')
                checkout_day=page.get_by_role('button',name=checkout_label,exact=True)
                # The fixture week starts on the current Monday, so its checkout day (+7) can fall in the next month; open that month first, then restore the original one.
                opened_next=await checkout_day.count()==0
                if opened_next: await page.get_by_role('button',name='Следующий месяц' if lang=='ru' else 'Next month').click()
                await checkout_day.click()
                events=page.get_by_role('dialog',name='CalendarDayEventsSheet')
                await expect(events).to_contain_text('fixture-booking')
                await expect(events).to_have_attribute('data-occupied','false')
                await page.get_by_role('button',name='Close fixture').click()
                if opened_next:
                    await page.get_by_role('button',name='Предыдущий месяц' if lang=='ru' else 'Previous month').click()
                    assert await period.get_by_role('heading').inner_text()==before
                await bounds('single'); await page.screenshot(path=str(OUTPUT/f'{lang}-{width}-single.png'))
                await portfolio.click(); await expect(portfolio).to_have_attribute('aria-pressed','true')
                await page.get_by_role('combobox').click()
                await page.get_by_role('option',name='Проект с длинным названием — тестовая группа объектов' if lang=='ru' else 'Project with a long name — synthetic property group',exact=True).click()
                await expect(page.get_by_text('Объектов в календаре: 1' if lang=='ru' else 'Properties in calendar: 1')).to_be_visible()
                nav=page.get_by_role('group',name='Период календаря' if lang=='ru' else 'Calendar period')
                before=await nav.locator('span').inner_text()
                await page.get_by_role('button',name='Вперёд' if lang=='ru' else 'Next',exact=True).click()
                assert await nav.locator('span').inner_text()!=before
                await page.get_by_role('button',name='Назад' if lang=='ru' else 'Previous',exact=True).click()
                assert await nav.locator('span').inner_text()==before
                await page.get_by_role('button',name='Сегодня' if lang=='ru' else 'Today',exact=True).click()
                await page.get_by_role('button',name='Alexandra / Александра — synthetic booking:').click()
                await expect(page.get_by_role('dialog',name='BookingDetailSheet')).to_contain_text('fixture-booking')
                await page.get_by_role('button',name='Close fixture').click()
                await page.get_by_role('button',name='Уборка' if lang=='ru' else 'Cleaning',exact=True).click()
                await expect(page.get_by_role('dialog',name='TaskDetailSheet')).to_contain_text('fixture-task')
                await page.get_by_role('button',name='Close fixture').click()
                cell=page.get_by_role('button',name=('Просторные семейные апартаменты с панорамным видом на море' if lang=='ru' else 'Spacious family apartment with panoramic sea view')+': '+checkout_label,exact=True)
                await cell.press('Enter')
                await expect(page.get_by_role('dialog',name='CalendarDayEventsSheet')).to_contain_text('fixture-booking')
                await expect(page.get_by_role('dialog',name='CalendarDayEventsSheet')).to_have_attribute('data-occupied','false')
                await page.get_by_role('button',name='Close fixture').click()
                await bounds('portfolio'); await page.screenshot(path=str(OUTPUT/f'{lang}-{width}-portfolio.png'))
                assert not errors,errors
                assert not blocked,blocked
                results.append({'timezone':tz,'language':lang,'width':width,'checkoutEventNotOccupied':'pass','modes':'pass','scope':'pass','navigation':'pass','bookingTaskBoundaries':'pass','overflow':'none','runtimeErrors':errors,'externalRequests':len(blocked)})
                await context.close()
        await browser.close()
    (OUTPUT/'results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)); print(json.dumps(results,ensure_ascii=False,indent=2))
asyncio.run(main())
