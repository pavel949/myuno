"""Synthetic moderation UI only. Never click approval, rejection, or publication."""
import asyncio
import json
import re
import sys
from pathlib import Path
from urllib.parse import urlparse, urlencode, quote

from playwright.async_api import async_playwright, expect

OUTPUT = Path(sys.argv[1])
INITIAL_ROUTE = '/admin/operations?tab=moderation'
LABELS = {
    'en': {
        'draft': 'Drafts', 'previous': 'Previous', 'next': 'Next', 'pending': 'Pending review', 'inactive': 'Inactive catalog',
        'search': 'Search queue', 'type': 'Content type', 'category': 'Category',
        'clear': 'Clear filters', 'retry': 'Retry', 'review': 'Review',
        'catalog': 'Open category catalog', 'no_matches': 'No matching items',
        'empty': 'No pending items', 'inactive_empty': 'No inactive items',
        'harbor': 'Harbor', 'clinic': 'Synthetic clinic without a direct editor',
        'service': 'Transfer service', 'coffee': 'Local coffee',
        'unknown': 'Unknown', 'unavailable': 'Direct item review is not available for this type.',
    },
    'ru': {
        'draft': 'Черновики', 'previous': 'Назад', 'next': 'Далее', 'pending': 'На проверке', 'inactive': 'Неактивный каталог',
        'search': 'Поиск в очереди', 'type': 'Тип контента', 'category': 'Категория',
        'clear': 'Сбросить фильтры', 'retry': 'Повторить', 'review': 'Проверить',
        'catalog': 'Открыть каталог категории', 'no_matches': 'Ничего не найдено',
        'empty': 'Нет записей на проверке', 'inactive_empty': 'Нет неактивных записей',
        'harbor': 'Гавань', 'clinic': 'Тестовая клиника без прямого редактора',
        'service': 'Услуга трансфера', 'coffee': 'Местный кофе',
        'unknown': 'Неизвестно', 'unavailable': 'Прямой просмотр записи для этого типа недоступен.',
    },
}

LABELS['th'] = {
    'draft': 'ฉบับร่าง', 'previous': 'ก่อนหน้า', 'next': 'ถัดไป', 'pending': 'รอตรวจสอบ', 'inactive': 'รายการที่ไม่ใช้งาน',
    'search': 'ค้นหาในคิว', 'type': 'ประเภทเนื้อหา', 'category': 'หมวดหมู่',
    'clear': 'ล้างตัวกรอง', 'retry': 'ลองอีกครั้ง', 'review': 'ตรวจสอบ',
    'catalog': 'เปิดแคตตาล็อกหมวดหมู่', 'no_matches': 'ไม่พบรายการที่ตรงกัน',
    'empty': 'ไม่มีรายการรอตรวจสอบ', 'inactive_empty': 'ไม่มีรายการที่ไม่ใช้งาน',
    'harbor': 'Harbor', 'clinic': 'Synthetic clinic without a direct editor',
    'service': 'Transfer service', 'coffee': 'Local coffee', 'unknown': 'ไม่ทราบ',
    'unavailable': 'รายการประเภทนี้ยังไม่มีหน้าตรวจสอบโดยตรง',
}

async def expect_committed_route(page, expected, checkpoint):
    """Observe the committed router tree; do not treat urgent UI state as routing."""
    route_state = page.get_by_test_id('fixture-route')
    try:
        await expect(route_state).to_have_text(expected)
    except AssertionError:
        diagnostic = {
            'checkpoint': checkpoint, 'expected': expected,
            'actual': await route_state.all_text_contents(),
        }
        (OUTPUT / f'{checkpoint}-route-failure.json').write_text(
            json.dumps(diagnostic, ensure_ascii=False, indent=2))
        await page.screenshot(path=str(OUTPUT / f'{checkpoint}-route-failure.png'))
        print(json.dumps(diagnostic, ensure_ascii=False), flush=True)
        raise


async def geometry(page, width):
    result = await page.evaluate('''() => {
      const targets=[...document.querySelectorAll('[data-testid="moderation-row"], [data-testid="moderation-summary"], input, select, button, a')];
      const outside=targets.filter(element=>{
        const rect=element.getBoundingClientRect();
        return rect.width>0 && rect.height>0 && (rect.left < -1 || rect.right > innerWidth+1);
      }).map(element=>({tag:element.tagName,text:element.textContent?.trim(),left:element.getBoundingClientRect().left,right:element.getBoundingClientRect().right}));
      return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,outside};
    }''')
    assert result['scrollWidth'] <= width, result
    # The app globally hides horizontal overflow. Check actual controls too, so
    # clipped controls cannot pass solely because the root hides their overflow.
    assert not result['outside'], result
    return result


async def assert_isolated(page, source='queue'):
    counters = await page.evaluate('''() => ({
      writes:window.fixtureWrites,dataCalls:window.fixtureDataCalls,
      clientCalls:window.fixtureClientCalls,networkCalls:window.fixtureNetworkCalls,
      fixtureReads:window.fixtureReadCalls,
      dashboardReads:window.fixtureDashboardReads,analyticsReads:window.fixtureAnalyticsReads,
    })''')
    assert counters['writes'] == 0, counters
    assert counters['dataCalls'] == 0, counters
    assert counters['clientCalls'] == 0, counters
    assert counters['networkCalls'] == 0, counters
    if source == 'dashboard':
        assert counters['fixtureReads'] == 0, counters
        assert counters['dashboardReads'] >= 2, counters
        assert counters['analyticsReads'] >= 1, counters
    else:
        assert counters['fixtureReads'] >= 1, counters
    return counters


async def screenshot(page, name, width):
    metrics = await geometry(page, width)
    await page.screenshot(path=str(OUTPUT / f'{name}.png'), full_page=True)
    return metrics


def tab(page, label):
    # A count badge may contribute to the tab's accessible name.
    return page.get_by_role('tab', name=re.compile(r'^' + re.escape(label) + r'(?:\s|$)'))


async def assert_last_read(page, **expected):
    actual = await page.evaluate('() => window.fixtureReadOptions.at(-1)')
    for key, value in expected.items():
        assert actual.get(key) == value, {'expected': expected, 'actual': actual}


async def exercise_queue(page, language, width):
    labels = LABELS[language]
    prefix = f'{language}-{width}'
    rows = page.get_by_test_id('moderation-row')
    count = page.get_by_test_id('moderation-count')
    search = page.get_by_role('textbox', name=labels['search'], exact=True)
    kind = page.get_by_label(labels['type'], exact=True)
    category = page.get_by_label(labels['category'], exact=True)
    clear = page.get_by_role('button', name=labels['clear'], exact=True)

    await page.goto(f'http://localhost:8080/fixture?lang={language}&case=default', wait_until='networkidle')
    await expect(rows).to_have_count(2)
    await expect(count).to_have_text('2')
    await expect(kind).to_have_value('listing')
    assert await kind.locator('option').evaluate_all('(options)=>options.map(option=>option.value)') == ['listing', 'property']
    await expect_committed_route(page, INITIAL_ROUTE, prefix + '-initial')
    await assert_last_read(page, source='listing', page=0, queue='pending', search='')
    initial_geometry = await screenshot(page, prefix + '-pending', width)

    # Provider names are display context, not a server name/UUID filter.
    await search.fill('Synthetic provider')
    await expect(rows).to_have_count(0)
    await expect(count).to_have_text('0')
    await clear.click()
    await kind.select_option('property')
    await expect(rows).to_have_count(2)
    await search.fill(labels['harbor'])
    await expect(rows).to_have_count(1)
    await expect(rows.first).to_contain_text(labels['harbor'])
    await category.select_option('villa')
    await expect(category).to_have_value('villa')
    await expect(rows).to_have_count(1)
    await assert_last_read(page, source='property', page=0, search=labels['harbor'], category='villa')
    await screenshot(page, prefix + '-combined-filters', width)
    await clear.click()
    await expect(search).to_have_value('')
    await expect(kind).to_have_value('property')
    await expect(category).to_have_value('all')
    await expect(rows).to_have_count(2)
    await assert_last_read(page, source='property', page=0, search='', category='all')

    await kind.select_option('listing')
    await expect(rows).to_have_count(2)
    await category.select_option('clinic')
    await expect(rows).to_have_count(1)
    await expect(rows.first).to_contain_text(labels['clinic'])
    await expect(rows.first.get_by_role('button', name=labels['review'], exact=True)).to_be_disabled()
    catalog = rows.first.get_by_role('button', name=labels['catalog'], exact=True)
    await expect(catalog).to_be_enabled()
    await expect(rows.first).to_contain_text(labels['unavailable'])
    await screenshot(page, prefix + '-unsupported-editor', width)
    await catalog.click()
    await expect_committed_route(page, '/admin/clinics', prefix + '-clinic-collection')
    await assert_isolated(page)
    await page.reload(wait_until='networkidle')
    await expect_committed_route(page, INITIAL_ROUTE, prefix + '-return-to-queue')
    await expect(rows).to_have_count(2)

    await search.fill('synthetic-unmatched-query')
    await expect(rows).to_have_count(0)
    await expect(page.get_by_text(labels['no_matches'], exact=True)).to_be_visible()
    await screenshot(page, prefix + '-no-matches', width)
    await clear.click()
    await expect(rows).to_have_count(2)

    await tab(page, labels['inactive']).click()
    await expect_committed_route(page, INITIAL_ROUTE + '&queue=inactive', prefix + '-inactive-queue')
    await expect(tab(page, labels['inactive'])).to_have_attribute('aria-selected', 'true')
    await expect(rows).to_have_count(2)
    await expect(count).to_have_text('2')
    await expect(kind).to_have_value('service')
    assert await kind.locator('option').evaluate_all('(options)=>options.map(option=>option.value)') == ['service', 'product']
    await expect(category).to_be_disabled()
    inactive_text = await rows.all_text_contents()
    assert not any(re.search(r'\bPending\b|Ожидает|На проверке', text, re.I) for text in inactive_text), inactive_text
    await assert_last_read(page, source='service', queue='inactive', page=0)
    await screenshot(page, prefix + '-inactive', width)
    await search.fill(labels['service'])
    await expect(rows).to_have_count(1)
    await clear.click()
    await kind.select_option('product')
    await category.select_option('groceries')
    await expect(rows).to_have_count(1)
    await expect(rows.first).to_contain_text(labels['coffee'])
    await clear.click()
    await expect(rows).to_have_count(2)

    await tab(page, labels['draft']).click()
    await expect(tab(page, labels['draft'])).to_have_attribute('aria-selected', 'true')
    await expect(kind).to_have_value('listing')
    await expect(rows).to_have_count(2)
    await assert_last_read(page, source='listing', queue='draft', page=0)
    # Drafts cannot be approved or rejected through the pending-only writer.
    draft_actions = rows.get_by_role('button', name=re.compile(r'Approve|Reject|Одобрить|Отклонить|อนุมัติ|ไม่อนุมัติ'))
    await expect(draft_actions).to_have_count(4)
    for button in await draft_actions.all():
        await expect(button).to_be_disabled()

    await tab(page, labels['pending']).click()
    await expect(tab(page, labels['pending'])).to_have_attribute('aria-selected', 'true')
    await kind.select_option('property')
    await expect(rows).to_have_count(2)
    await search.fill(labels['harbor'])
    await expect(rows).to_have_count(1)
    review = rows.first.get_by_role('button', name=labels['review'], exact=True)
    await expect(review).to_be_enabled()
    await review.click()
    return_route = '/admin/operations?' + urlencode({'tab': 'moderation', 'q': labels['harbor'], 'type': 'property'})
    property_route = '/admin/properties?edit=fixture-property-a&return=' + quote(return_route, safe='')
    await expect_committed_route(page, property_route, prefix + '-property-review')
    return {'geometry': initial_geometry, 'route': await page.get_by_test_id('fixture-route').text_content(), 'isolation': await assert_isolated(page)}


async def exercise_states(page, language, width):
    labels = LABELS[language]
    prefix = f'{language}-{width}'
    rows = page.get_by_test_id('moderation-row')
    count = page.get_by_test_id('moderation-count')
    retry = page.get_by_role('button', name=labels['retry'], exact=True)
    results = []
    await page.goto(f'http://localhost:8080/fixture?lang={language}&case=loading', wait_until='networkidle')
    await expect(count).to_have_text('…')
    await expect(rows).to_have_count(0)
    await expect(page.get_by_text(labels['empty'], exact=True)).to_have_count(0)
    await screenshot(page, prefix + '-loading', width)
    results.append({'case': 'loading', **await assert_isolated(page)})

    # Former mixed newest-N scenario now verifies source-local exact counts and
    # actual server pages. A match beyond page one must still be searchable.
    await page.goto(f'http://localhost:8080/fixture?lang={language}&case=capped', wait_until='networkidle')
    await expect(rows).to_have_count(50)
    await expect(count).to_have_text('240')
    await page.get_by_role('button', name=labels['next'], exact=True).click()
    await expect(rows).to_have_count(50)
    await expect(rows.first).to_contain_text('50')
    await assert_last_read(page, source='listing', page=1)
    await expect_committed_route(page, INITIAL_ROUTE + '&page=1', prefix + '-server-page')
    search = page.get_by_role('textbox', name=labels['search'], exact=True)
    await search.fill('Synthetic listing 239')
    await expect(rows).to_have_count(1)
    await expect(count).to_have_text('1')
    await expect(rows.first).to_contain_text('239')
    await assert_last_read(page, source='listing', page=0, search='Synthetic listing 239')
    await page.get_by_role('button', name=labels['clear'], exact=True).click()
    await expect(rows).to_have_count(50)
    await page.get_by_label(labels['type'], exact=True).select_option('property')
    await expect(rows).to_have_count(8)
    await expect(count).to_have_text('8')
    await assert_last_read(page, source='property', page=0)
    await screenshot(page, prefix + '-source-specific-exact-count', width)
    results.append({'case': 'paged', **await assert_isolated(page)})

    await page.goto(f'http://localhost:8080/fixture?lang={language}&case=empty', wait_until='networkidle')
    await expect(rows).to_have_count(0)
    await expect(page.get_by_text(labels['empty'], exact=True)).to_be_visible()
    await screenshot(page, prefix + '-empty-pending', width)
    await tab(page, labels['inactive']).click()
    await expect_committed_route(page, INITIAL_ROUTE + '&queue=inactive', prefix + '-empty-inactive-queue')
    await expect(tab(page, labels['inactive'])).to_have_attribute('aria-selected', 'true')
    await expect(page.get_by_text(labels['inactive_empty'], exact=True)).to_be_visible()
    await screenshot(page, prefix + '-empty-inactive', width)
    results.append({'case': 'empty', **await assert_isolated(page)})

    for scenario in ['error', 'partial', 'retry']:
        await page.goto(f'http://localhost:8080/fixture?lang={language}&case={scenario}', wait_until='networkidle')
        await expect(retry).to_be_visible()
        await expect(rows).to_have_count(0)
        await expect(count).to_have_text(labels['unknown'])
        await expect(page.get_by_text(labels['empty'], exact=True)).to_have_count(0)
        await screenshot(page, prefix + '-' + scenario, width)
        if scenario == 'partial':
            # Failure in listings does not taint an independently fetched source.
            await page.get_by_label(labels['type'], exact=True).select_option('property')
            await expect(rows).to_have_count(2)
            await expect(count).to_have_text('2')
            await expect(retry).to_have_count(0)
            await assert_last_read(page, source='property', page=0)
        if scenario == 'retry':
            await retry.click()
            await expect(rows).to_have_count(2)
            await expect(retry).to_have_count(0)
            await expect(count).to_have_text('2')
            await screenshot(page, prefix + '-retry-recovered', width)
        results.append({'case': scenario, **await assert_isolated(page)})
    return results


async def exercise_dashboard_unknown(page, language, width):
    """Measure the real KPI text, including wrapped Unknown/Неизвестно glyphs."""
    labels = LABELS[language]
    prefix = f'{language}-{width}-dashboard-unknown'
    await page.goto(f'http://localhost:8080/fixture?lang={language}&case=dashboard-unknown', wait_until='networkidle')
    alerts = page.get_by_test_id('fixture-dashboard-alerts')
    kpis = page.get_by_test_id('fixture-dashboard-kpis')
    await expect(alerts.get_by_text(labels['unknown'], exact=True)).to_be_visible()
    await expect(kpis.get_by_text(labels['unknown'], exact=True)).to_be_visible()
    await expect(page.get_by_text(re.compile(r'All clear!|Всё в порядке!'))).to_have_count(0)
    await expect(page.get_by_test_id('moderation-row')).to_have_count(0)
    await expect_committed_route(page, '/admin', prefix)
    cards = kpis.locator(':scope > div > div')
    await expect(cards).to_have_count(6)
    pending_card = cards.filter(has=page.get_by_text('На модерации' if language == 'ru' else 'รออนุมัติ' if language == 'th' else 'Pending', exact=True))
    await expect(pending_card).to_have_count(1)
    await expect(pending_card.locator('p').nth(1)).to_have_text(labels['unknown'])

    # Root overflow is hidden by application CSS. Bounding boxes alone cannot
    # detect cropped text, so inspect rendered text line rectangles, the actual
    # text column, and icon separation inside all six real KPI cards.
    text_geometry = await cards.evaluate_all('''cards => cards.map(card => {
      const pack=rect=>({left:rect.left,right:rect.right,top:rect.top,bottom:rect.bottom,width:rect.width,height:rect.height});
      const layout=card.firstElementChild;
      const column=layout.firstElementChild;
      const icon=layout.lastElementChild;
      const cardRect=card.getBoundingClientRect(),columnRect=column.getBoundingClientRect(),iconRect=icon.getBoundingClientRect();
      const paragraphs=[...column.querySelectorAll('p')].map(element=>{
        const range=document.createRange();range.selectNodeContents(element);
        return {text:element.textContent,box:pack(element.getBoundingClientRect()),clientWidth:element.clientWidth,scrollWidth:element.scrollWidth,clientHeight:element.clientHeight,scrollHeight:element.scrollHeight,lines:[...range.getClientRects()].map(pack)};
      });
      return {card:pack(cardRect),column:pack(columnRect),icon:pack(iconRect),paragraphs};
    })''')
    for card in text_geometry:
        assert card['card']['left'] >= -1 and card['card']['right'] <= width + 1, card
        assert card['column']['width'] > 0, card
        assert card['column']['right'] <= card['icon']['left'] + 1, card
        for paragraph in card['paragraphs']:
            assert paragraph['scrollWidth'] <= paragraph['clientWidth'] + 1, card
            assert paragraph['scrollHeight'] <= paragraph['clientHeight'] + 1, card
            assert paragraph['lines'], card
            for line in paragraph['lines']:
                assert line['left'] >= card['column']['left'] - 1, card
                assert line['right'] <= card['column']['right'] + 1, card
                assert line['top'] >= card['card']['top'] - 1, card
                assert line['bottom'] <= card['card']['bottom'] + 1, card

    page_geometry = await screenshot(page, prefix, width)
    (OUTPUT / f'{prefix}-geometry.json').write_text(json.dumps(text_geometry, ensure_ascii=False, indent=2))
    return {'case': 'dashboard-unknown', 'geometry': page_geometry, 'kpiTextGeometry': text_geometry, **await assert_isolated(page, 'dashboard')}


async def main():
    results = []
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        try:
            for language in ['ru', 'en', 'th']:
                for width in [375, 390, 430, 1280]:
                    context = await browser.new_context(
                        viewport={'width': width, 'height': 812},
                        is_mobile=width < 640, has_touch=width < 640, service_workers='block')
                    blocked, errors = [], []

                    async def isolated_route(route):
                        parsed = urlparse(route.request.url)
                        assets = {'/fixture': ('fixture.html', 'text/html'), '/fixture.js': ('fixture.js', 'text/javascript'), '/fixture.css': ('fixture.css', 'text/css')}
                        if parsed.scheme == 'http' and parsed.netloc == 'localhost:8080' and parsed.path in assets:
                            filename, content_type = assets[parsed.path]
                            await route.fulfill(path=str(OUTPUT / filename), content_type=content_type)
                        else:
                            blocked.append(route.request.url)
                            await route.abort()

                    await context.route('**/*', isolated_route)
                    page = await context.new_page()
                    page.on('pageerror', lambda error: errors.append(str(error)))
                    try:
                        queue = await exercise_queue(page, language, width)
                        states = await exercise_states(page, language, width)
                        dashboard = await exercise_dashboard_unknown(page, language, width)
                        assert not errors, errors
                        assert not any('supabase' in url or '/rest/' in url or '/functions/' in url for url in blocked), blocked
                        results.append({'language': language, 'width': width, 'queue': queue, 'states': states, 'dashboard': dashboard, 'runtimeErrors': errors, 'blockedRequests': blocked})
                    except Exception:
                        await page.screenshot(path=str(OUTPUT / f'{language}-{width}-failure.png'), full_page=True)
                        (OUTPUT / f'{language}-{width}-failure.json').write_text(json.dumps({
                            'language': language, 'width': width, 'runtimeErrors': errors,
                            'blockedRequests': blocked, 'route': await page.get_by_test_id('fixture-route').all_text_contents(),
                        }, ensure_ascii=False, indent=2))
                        raise
                    finally:
                        await context.close()
        finally:
            await browser.close()
    (OUTPUT / 'results.json').write_text(json.dumps(results, ensure_ascii=False, indent=2))
    print(json.dumps(results, ensure_ascii=False, indent=2))


asyncio.run(main())
