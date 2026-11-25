"""Actual experience catalogue and request form with an isolated data boundary."""
import asyncio
import json
import os
from pathlib import Path
import shutil
import sys
from urllib.parse import parse_qs, urlencode, urlparse

from playwright.async_api import async_playwright, expect

OUT = Path(sys.argv[1]).resolve()
ROOT = Path.cwd()
ORIGIN = 'http://127.0.0.1:8936'
COPY = {
    'en': {'title': 'Experiences', 'overview_title': 'Experiences in Phuket', 'types': 'Experience type', 'tour': 'Tours', 'activity': 'Activities', 'island': 'Islands', 'category_menu': 'What would you like to explore?', 'clear': 'Clear filters', 'search': 'Search experiences…', 'sort': 'Sort experiences', 'empty': 'No offers match these filters', 'unknown': 'Unknown filter', 'retry': 'Try again', 'retry_category': 'Retry categories', 'loading': 'Loading experiences', 'all_categories': 'All categories', 'menu': 'Open menu', 'services': 'Services'},
    'ru': {'title': 'Впечатления', 'overview_title': 'Впечатления на Пхукете', 'types': 'Тип впечатления', 'tour': 'Экскурсии', 'activity': 'Активный отдых', 'island': 'Острова', 'category_menu': 'Что вам интересно?', 'clear': 'Сбросить фильтры', 'search': 'Найти впечатление…', 'sort': 'Сортировка', 'empty': 'По этим условиям пока нет предложений', 'unknown': 'Неизвестный фильтр', 'retry': 'Повторить', 'retry_category': 'Повторить загрузку тем', 'loading': 'Загружаем впечатления', 'all_categories': 'Все категории', 'menu': 'Открыть меню', 'services': 'Услуги'},
    'th': {'title': 'ประสบการณ์', 'overview_title': 'ประสบการณ์ในภูเก็ต', 'types': 'ประเภทประสบการณ์', 'tour': 'ทัวร์', 'activity': 'กิจกรรม', 'island': 'Islands', 'category_menu': 'คุณสนใจอะไร?', 'clear': 'ล้างตัวกรอง', 'search': 'ค้นหาประสบการณ์…', 'sort': 'เรียงลำดับประสบการณ์', 'empty': 'ยังไม่มีข้อเสนอที่ตรงกับตัวกรอง', 'unknown': 'ไม่พบตัวกรอง', 'retry': 'ลองอีกครั้ง', 'retry_category': 'ลองโหลดหมวดหมู่อีกครั้ง', 'loading': 'กำลังโหลดประสบการณ์', 'all_categories': 'ทุกหมวดหมู่', 'menu': 'เปิดเมนู', 'services': 'บริการ'},
}
INQUIRY = {
    'ru': {'title': 'Уточнить места у myUNO', 'date': 'Желаемая дата', 'guests': 'Гостей', 'sign_in': 'Войти и продолжить', 'send': 'Отправить заявку', 'tracker': 'Открыть мои заявки'},
    'en': {'title': 'Ask myUNO about availability', 'date': 'Preferred date', 'guests': 'Guests', 'sign_in': 'Sign in to continue', 'send': 'Send request', 'tracker': 'View my requests'},
    'th': {'title': 'สอบถามที่ว่างกับ myUNO', 'date': 'วันที่ต้องการ', 'guests': 'จำนวนผู้เข้าร่วม', 'sign_in': 'เข้าสู่ระบบเพื่อดำเนินการต่อ', 'send': 'ส่งคำขอ', 'tracker': 'ดูคำขอของฉัน'},
}


async def main():
    rows = []
    async with async_playwright() as p:
        bundled = Path(p.chromium.executable_path)
        if os.environ.get('CI') and not bundled.is_file():
            raise RuntimeError('CI must install the Playwright Chromium bundle')
        executable = str(bundled) if bundled.is_file() else shutil.which('chromium')
        if not executable:
            raise RuntimeError('No bundled or local Chromium available')
        browser = await p.chromium.launch(executable_path=executable, headless=True, args=['--no-sandbox'])
        for lang in ['ru', 'en', 'th']:
            for width in [375, 390, 430, 1440]:
                context = await browser.new_context(viewport={'width': width, 'height': 900}, reduced_motion='reduce', service_workers='block')
                blocked, errors = [], []

                async def route(request):
                    u = urlparse(request.request.url)
                    name = u.path.lstrip('/')
                    generated = (OUT / name).resolve()
                    public = (ROOT / 'public' / name).resolve()
                    if u.netloc == '127.0.0.1:8936' and request.request.method == 'GET':
                        if generated.is_relative_to(OUT) and generated.is_file():
                            await request.fulfill(path=str(generated))
                            return
                        if public.is_relative_to((ROOT / 'public').resolve()) and public.is_file():
                            await request.fulfill(path=str(public))
                            return
                    blocked.append({'method': request.request.method, 'url': request.request.url})
                    await request.abort()

                await context.route('**/*', route)
                page = await context.new_page()
                page.on('pageerror', lambda error: errors.append(str(error)))
                c = COPY[lang]
                prefix = f'{lang}-{width}'
                row = {'language': lang, 'width': width, 'outcome': 'FAIL', 'checks': []}

                async def goto(entry='/experiences?ref=synthetic', mode=None):
                    query = {'lang': lang, 'entry': entry}
                    if mode:
                        query['mode'] = mode
                    await page.goto(ORIGIN + '/fixture.html?' + urlencode(query), wait_until='networkidle')
                    if entry.startswith('/admin/'):
                        expected_title = 'Категории активностей' if lang == 'ru' else 'Experience Categories'
                    else:
                        overview = not (set(parse_qs(urlparse(entry).query)) - {'ref'})
                        expected_title = c['overview_title'] if overview else c['title']
                        await expect(page.locator('[data-marketplace-entry="experiences"]')).to_have_count(1 if overview else 0)
                        await expect(page.get_by_role('heading', level=1)).to_have_count(1)
                    await expect(page.get_by_role('heading', name=expected_title, exact=True, level=1)).to_be_visible()
                    await page.evaluate('document.fonts.ready')

                async def geometry():
                    assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth'), 'Page overflow'

                async def screenshot(name):
                    await geometry()
                    # Resolve actual native lazy images by viewing their cards, then
                    # capture from the document start so sticky chrome stays at top.
                    for card in await cards().all():
                        await card.scroll_into_view_if_needed()
                        await page.wait_for_timeout(60)
                    await page.evaluate('scrollTo({top:0,behavior:"instant"})')
                    await page.wait_for_timeout(100)
                    await page.screenshot(path=str(OUT / f'{prefix}-{name}.png'), full_page=True)

                def cards():
                    return page.locator('.public-commerce-catalog-card')

                async def titles():
                    return await cards().locator('h3').all_text_contents()

                filter_name={'ru':'Фильтры впечатлений','en':'Experience filters','th':'ตัวกรองประสบการณ์'}[lang]
                done_name={'ru':'Показать предложения','en':'Show offers','th':'แสดงข้อเสนอ'}[lang]
                async def open_filters():
                    await page.get_by_role('button',name=filter_name,exact=True).click()
                    await expect(page.get_by_role('dialog',name=filter_name,exact=True)).to_be_visible()
                async def apply_filters():
                    await page.get_by_role('button',name=done_name,exact=True).click()
                    await expect(page.get_by_role('dialog')).to_have_count(0)

                try:
                    await goto('/experiences?maxPrice=2500&duration=short&ref=budget-check')
                    await expect(cards()).to_have_count(2)
                    await open_filters()
                    maximum = page.get_by_role('spinbutton').last
                    await expect(maximum).to_have_value('2500')
                    await maximum.fill('1800')
                    await expect(cards()).to_have_count(2)
                    await expect(page.get_by_test_id('fixture-location')).to_contain_text('maxPrice=2500')
                    await apply_filters()
                    await expect(cards()).to_have_count(1)
                    await expect(page.get_by_test_id('fixture-location')).to_contain_text('maxPrice=1800')
                    await expect(page.get_by_test_id('fixture-location')).to_contain_text('ref=budget-check')
                    await page.get_by_role('button', name=c['clear'], exact=True).click()
                    await expect(page.get_by_test_id('fixture-location')).to_have_text('/experiences?ref=budget-check')
                    await expect(cards()).to_have_count(4)
                    row['checks'].append('Recorded THB budget and duration combine, update in the actual sheet and reset without losing source context')
                    await goto()
                    await expect(cards()).to_have_count(4)
                    toolbar = page.locator('[data-marketplace-toolbar]')
                    search_box = await toolbar.get_by_role('searchbox').bounding_box()
                    filter_box = await toolbar.get_by_role('button', name=filter_name, exact=True).bounding_box()
                    h1_box = await page.get_by_role('heading', level=1).bounding_box()
                    assert search_box and filter_box and h1_box
                    assert abs(search_box['x'] - h1_box['x']) <= 2, ('Experience gutters', h1_box, search_box)
                    assert abs((search_box['y'] + search_box['height']/2) - (filter_box['y'] + filter_box['height']/2)) <= 2
                    assert search_box['x'] + search_box['width'] < filter_box['x']
                    row['checks'].append('Overview search aligns with the title and filters share its row')
                    await toolbar.get_by_role('searchbox').press_sequentially('zz-no-match two words')
                    search = page.get_by_role('searchbox')
                    await expect(search).to_have_value('zz-no-match two words')
                    await expect(search).to_be_focused()
                    await expect(page.get_by_test_id('fixture-location')).to_have_text('/experiences?ref=synthetic&q=zz-no-match+two+words')
                    await expect(page.locator('[data-marketplace-entry="experiences"]')).to_have_count(0)
                    row['checks'].append('Uninterrupted typing keeps focus and the exact multiword URL')
                    await goto()
                    active = page.locator('.consumer-nav a[aria-current="page"]')
                    await expect(active).to_have_count(1)
                    await expect(active).to_have_attribute('href', '/experiences')
                    await expect(page.locator('.consumer-nav a[href="/discover/services"][aria-current]')).to_have_count(0)
                    if width == 390:
                        await page.get_by_role('button', name=c['menu'], exact=True).click()
                        dialog = page.get_by_role('dialog', name='myUNO', exact=True)
                        await expect(dialog.locator('a[aria-current="page"]')).to_have_count(1)
                        await expect(dialog.locator('a[aria-current="page"]')).to_have_attribute('href', '/experiences')
                        await page.keyboard.press('Escape')
                        await expect(dialog).not_to_be_visible()
                    menu = page.get_by_role('region', name=c['category_menu'], exact=True)
                    # Only groups backed by returned offers are promoted publicly.
                    await expect(menu.locator('[data-category-id]')).to_have_count(3)
                    await expect(menu.locator('[data-category-id="wellness"]')).to_have_count(0)
                    first=await cards().first.bounding_box()
                    assert first and first['y']<900,('First offer below initial viewport',first)
                    await menu.locator('[data-category-id="sea"]').click()
                    await expect(page.get_by_test_id('fixture-location')).to_contain_text('group=sea')
                    await expect(cards()).to_have_count(2)
                    await expect(page.locator('#experience-results-title')).to_be_focused()
                    await page.get_by_test_id('history-back').click()
                    await expect(cards()).to_have_count(4)
                    await page.get_by_test_id('history-forward').click()
                    await expect(cards()).to_have_count(2)
                    await page.get_by_test_id('history-back').click()
                    await screenshot('01-overview')
                    row['checks'].append('Only populated groups promoted; group filtering, focus and Back/Forward work')
                    await open_filters()
                    category_label={'ru':'Категория','en':'Category','th':'หมวดหมู่'}[lang]
                    await page.get_by_role('combobox',name=category_label,exact=True).select_option('islands')
                    await apply_filters()
                    await expect(page.get_by_test_id('fixture-location')).to_contain_text('category=islands')
                    await expect(page.get_by_test_id('fixture-location')).to_contain_text('ref=synthetic')
                    await expect(cards()).to_have_count(1)
                    await expect(page.get_by_role('button', name=filter_name, exact=True)).to_be_focused()
                    assert await page.evaluate('window.fixtureReadOptions.category') == 'islands'
                    await screenshot('02-category-results')
                    await expect(cards().first).to_have_attribute('href', '/experiences/island-tour')
                    assert await cards().first.evaluate('el=>el.tagName') == 'A'
                    await cards().first.focus()
                    await expect(cards().first).to_be_focused()
                    await cards().first.press('Enter')
                    await expect(page.get_by_role('heading', name='Synthetic detail boundary')).to_be_visible()
                    state = json.loads(await page.get_by_test_id('fixture-state').text_content())
                    assert state['publicJourneyOrigin']['href'] == '/experiences?ref=synthetic&category=islands', state
                    await page.get_by_test_id('history-back').click()
                    await expect(cards()).to_have_count(1)
                    await expect(page.get_by_test_id('fixture-location')).to_contain_text('category=islands')
                    await page.get_by_test_id('history-back').click()
                    await expect(menu).to_be_visible()
                    await expect(menu.locator('[data-category-id]')).to_have_count(3)
                    row['checks'].append('Category result, native card Enter/destination/public journey state and real router history preserve filters')

                    await goto('/experiences?ref=synthetic&type=tour')
                    await expect(cards()).to_have_count(3)
                    assert await page.evaluate('window.fixtureReadOptions.type') == 'tour'
                    await open_filters()
                    topic = page.get_by_role('combobox', name=category_label, exact=True)
                    diving = topic.locator('option[value="diving"]')
                    remove_type = {'ru':'Убрать тип','en':'Remove type','th':'ลบประเภท'}[lang]
                    await expect(diving).to_have_count(0)
                    await page.get_by_role('button', name=remove_type, exact=True).click()
                    await expect(diving).to_have_count(1)
                    await topic.select_option('diving')
                    await expect(page.get_by_test_id('fixture-location')).to_have_text('/experiences?ref=synthetic&type=tour')
                    assert await page.evaluate('window.fixtureReadOptions.type') == 'tour'
                    await page.keyboard.press('Escape')
                    await expect(page.get_by_role('dialog')).to_have_count(0)
                    await expect(page.get_by_role('button', name=filter_name, exact=True)).to_be_focused()
                    await expect(cards()).to_have_count(3)
                    await open_filters()
                    await expect(diving).to_have_count(0)
                    await page.get_by_role('button', name=remove_type, exact=True).click()
                    await topic.select_option('diving')
                    await apply_filters()
                    await expect(page.get_by_test_id('fixture-location')).to_have_text('/experiences?ref=synthetic&category=diving')
                    assert await page.evaluate('window.fixtureReadOptions.category') == 'diving'
                    await expect(cards()).to_have_count(1)
                    await page.get_by_test_id('history-back').click()
                    await expect(cards()).to_have_count(3)
                    assert await page.evaluate('window.fixtureReadOptions.type') == 'tour'
                    await open_filters()
                    await expect(page.get_by_role('button', name=remove_type, exact=True)).to_be_visible()
                    await apply_filters()
                    await screenshot('03-type-history')
                    row['checks'].append('Draft topic follows the edited legacy type, Escape restores it, Apply updates the real reader, and Back preserves the prior filter')

                    await page.get_by_role('button', name=c['clear'], exact=True).click()
                    search = page.get_by_role('searchbox', name=c['search'], exact=True)
                    await search.fill('Synthetic')
                    await open_filters()
                    select = page.get_by_role('combobox', name=c['sort'], exact=True)
                    await select.select_option('price_asc')
                    await expect(page.get_by_test_id('fixture-location')).not_to_contain_text('sort=')
                    await apply_filters()
                    await expect(page.get_by_test_id('fixture-location')).to_contain_text('sort=price_asc')
                    await expect(page.get_by_test_id('fixture-location')).to_contain_text('q=Synthetic')
                    expected = ['Тестовая культурная экскурсия', 'Тестовый дайвинг', 'Тестовая экскурсия на остров', 'Тестовое предложение без цены'] if lang == 'ru' else ['Synthetic culture tour', 'Synthetic diving activity', 'Synthetic island tour', 'Synthetic unknown price']
                    assert await titles() == expected, await titles()
                    assert '฿' not in await cards().last.inner_text(), 'Unknown price was presented as a recorded amount'
                    await open_filters()
                    await select.select_option('price_desc')
                    await expect(page.get_by_test_id('fixture-location')).to_contain_text('sort=price_asc')
                    await apply_filters()
                    await expect(page.get_by_test_id('fixture-location')).to_contain_text('sort=price_desc')
                    assert await titles() == [expected[2], expected[1], expected[0], expected[3]], await titles()
                    await page.get_by_test_id('history-back').click()
                    await open_filters()
                    await expect(select).to_have_value('price_asc')
                    assert await titles() == expected, await titles()
                    await apply_filters()
                    await expect(search).to_have_value('Synthetic')
                    await screenshot('04-search-sort')
                    row['checks'].append('Actual search/native sort persist in URL/history; unknown prices remain last and never become free')

                    await goto('/experiences?type=unrecognized&ref=synthetic')
                    await expect(page.get_by_text(c['unknown'], exact=True)).to_be_visible()
                    await expect(cards()).to_have_count(0)
                    await page.get_by_role('button', name=c['clear'], exact=True).click()
                    await expect(page.get_by_test_id('fixture-location')).to_have_text('/experiences?ref=synthetic')
                    await expect(cards()).to_have_count(4)
                    await goto('/experiences?q=unmatched-zz')
                    await expect(page.get_by_text(c['empty'], exact=True)).to_be_visible()
                    await expect(page.get_by_role('alert')).to_have_count(0)
                    await screenshot('05-empty')
                    await goto(mode='error')
                    await expect(page.get_by_role('alert')).to_have_count(1)
                    await expect(page.get_by_text(c['empty'], exact=True)).to_have_count(0)
                    await screenshot('06-read-error')
                    await page.get_by_role('button', name=c['retry'], exact=True).click()
                    await expect(cards()).to_have_count(4)
                    await expect(page.get_by_role('alert')).to_have_count(0)
                    assert await page.evaluate('window.fixtureReadRetries') == 1
                    await goto(mode='loading')
                    await expect(page.get_by_role('status', name=c['loading'], exact=True)).to_be_visible()
                    await expect(page.get_by_text(c['empty'], exact=True)).to_have_count(0)
                    await screenshot('07-loading')
                    await goto(mode='category-error')
                    await expect(page.get_by_role('alert')).to_have_count(1)
                    await expect(cards()).to_have_count(4)
                    await page.get_by_role('button', name=c['retry_category'], exact=True).click()
                    await expect(page.get_by_role('alert')).to_have_count(0)
                    await expect(menu).to_be_visible()
                    await expect(menu.locator('[data-category-id]')).to_have_count(3)
                    assert await page.evaluate('window.fixtureCategoryRetries') == 1
                    row['checks'].append('Unknown filters, genuine empty, read failure/loading and category failure remain distinct and retryable')
                    await goto('/admin/experience-categories')
                    await expect(page.locator('details')).to_have_count(8)
                    mobile_categories = page.get_by_test_id('mobile-category-cards')
                    if width < 768:
                        await expect(mobile_categories).to_be_visible()
                        await expect(mobile_categories.locator('article')).to_have_count(9)
                        assert await mobile_categories.locator('article').first.evaluate('(el) => el.getBoundingClientRect().height') < 260
                    else:
                        await expect(mobile_categories).not_to_be_visible()
                    await geometry()
                    await page.screenshot(path=str(OUT / f'{prefix}-08-admin-structure.png'), full_page=True)
                    await page.locator('details').first.locator('summary').click()
                    # Prepare opens a real editor; writes are captured by an isolated stub.
                    await page.locator('details').first.get_by_role('button', name='Подготовить' if lang == 'ru' else 'Prepare', exact=True).first.click()
                    dialog = page.get_by_role('dialog')
                    await expect(dialog).to_be_visible()
                    await expect(dialog.get_by_role('switch')).to_have_attribute('data-state','unchecked')
                    await geometry()
                    await page.screenshot(path=str(OUT / f'{prefix}-09-admin-prepare.png'), full_page=True)
                    await dialog.get_by_role('button',name='Сохранить' if lang == 'ru' else 'Save',exact=True).click()
                    await expect(dialog).not_to_be_visible()
                    saved=await page.evaluate('window.fixturePreparedCategory')
                    assert saved['slug']=='waterpark' and saved['is_active'] is False, saved
                    row['checks'].append('Actual admin has eight groups and prepares hidden waterpark category through explicit Save; writes stubbed')

                    inquiry = INQUIRY[lang]
                    entry = '/experiences/island-tour/request-fixture?ref=synthetic'
                    await page.goto(ORIGIN + '/fixture.html?' + urlencode({'lang': lang, 'entry': entry}), wait_until='networkidle')
                    dialog = page.get_by_role('dialog', name=inquiry['title'], exact=True)
                    await expect(dialog).to_be_visible()
                    await dialog.get_by_label(inquiry['date'], exact=True).fill('2099-11-23')
                    await dialog.get_by_label(inquiry['guests'], exact=True).fill('4')
                    await dialog.get_by_role('button', name=inquiry['sign_in'], exact=True).click()
                    assert await page.evaluate('window.fixtureInquiries.length') == 0
                    await page.get_by_role('button', name='Complete synthetic sign-in', exact=True).click()
                    await expect(dialog.get_by_label(inquiry['date'], exact=True)).to_have_value('2099-11-23')
                    await expect(dialog.get_by_label(inquiry['guests'], exact=True)).to_have_value('4')
                    await expect(page.get_by_test_id('fixture-location')).to_have_text(entry + '&inquiry=1')
                    assert await page.evaluate('window.fixtureInquiries.length') == 0
                    await geometry()
                    assert await dialog.evaluate('(el) => el.scrollWidth <= el.clientWidth + 1'), 'Inquiry dialog overflow'
                    await page.screenshot(path=str(OUT / f'{prefix}-10-request-review.png'), full_page=True)
                    await dialog.get_by_role('button', name=inquiry['send'], exact=True).click()
                    await expect(dialog.get_by_role('status')).to_contain_text('synthetic-experience-receipt')
                    await expect(dialog.get_by_role('link', name=inquiry['tracker'], exact=True)).to_have_attribute('href', '/me/requests?source=experience#experience-synthetic-experience-receipt')
                    submitted = await page.evaluate('window.fixtureInquiries')
                    assert len(submitted) == 1 and submitted[0]['guests_count'] == 4 and submitted[0]['preferred_language'] == lang, submitted
                    assert submitted[0]['vertical_metadata']['listing_id'] == 'island-tour', submitted
                    assert submitted[0]['preferred_dates'] == [{'date': '2099-11-23', 'time': ''}], submitted
                    row['checks'].append('Actual localized request holds date and party through synthetic sign-in, then displays the exact CRM receipt')
                    await geometry()
                    assert not errors, errors
                    assert not blocked, blocked
                    row.update(outcome='PASS', pageErrors=errors, blockedRequests=blocked)
                except Exception as error:
                    row.update(error=str(error), pageErrors=errors, blockedRequests=blocked)
                    await page.screenshot(path=str(OUT / f'{prefix}-FAIL.png'), full_page=True)
                rows.append(row)
                print(json.dumps({'language': lang, 'width': width, 'outcome': row['outcome'], 'error': row.get('error')}, ensure_ascii=False), flush=True)
                await context.close()
        await browser.close()
    failed = [row for row in rows if row['outcome'] != 'PASS']
    result = {'cases': len(rows), 'passed': len(rows) - len(failed), 'failed': len(failed), 'results': rows,
              'scope': 'Actual catalogue, shared category grid/sheets, public header, MiniAppLayout/FeatureLayout, native controls and experience request; synthetic reads/auth/receipt. Full detail layout is outside the fixture.'}
    (OUT / 'results.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'cases': len(rows), 'passed': result['passed'], 'failed': result['failed']}))
    if len(rows) != 12 or failed:
        raise SystemExit(1)


asyncio.run(main())
