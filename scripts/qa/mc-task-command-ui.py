"""Actual task editor/gateway, synthetic memory-only RPC, all network denied."""
import asyncio
import json
import sys
from pathlib import Path
from playwright.async_api import async_playwright, expect

OUTPUT = Path(sys.argv[1])

async def main():
    results = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        for language in ['en', 'ru']:
            for width in [375, 1280]:
                for state in ['confirmed', 'conflict', 'unknown', 'legacy']:
                    context = await browser.new_context(viewport={'width': width, 'height': 900}, service_workers='block')
                    blocked, errors = [], []
                    async def isolated(route):
                        url = route.request.url
                        filename = 'fixture.html' if url.startswith('http://localhost:8080/fixture?') else url.rsplit('/', 1)[-1]
                        types = {'fixture.html': 'text/html', 'fixture.js': 'text/javascript', 'fixture.css': 'text/css'}
                        if url.startswith('http://localhost:8080/') and filename in types:
                            await route.fulfill(path=str(OUTPUT / filename), content_type=types[filename])
                        else:
                            blocked.append(url)
                            await route.abort()
                    await context.route('**/*', isolated)
                    page = await context.new_page()
                    page.on('pageerror', lambda error: errors.append(str(error)))
                    await page.goto(f'http://localhost:8080/fixture?lang={language}&state={state}', wait_until='networkidle')
                    await page.get_by_role('button', name='Выполнено' if language == 'ru' else 'Completed', exact=True).click()
                    await page.get_by_role('button', name='Сохранить' if language == 'ru' else 'Save', exact=True).click()
                    rejected = state in ['conflict', 'unknown']
                    await expect(page.get_by_test_id('persisted-result')).to_contain_text('pending' if rejected else 'completed')
                    if not rejected:
                        await expect(page.get_by_test_id('persisted-result')).to_contain_text('synthetic-staff')
                        await expect(page.get_by_role('button', name='Сохранить' if language == 'ru' else 'Save', exact=True)).to_have_count(0)
                    else:
                        await expect(page.get_by_role('button', name='Сохранить' if language == 'ru' else 'Save', exact=True)).to_be_enabled()
                    evidence = await page.evaluate('({requests:window.fixtureRequests,legacyWrites:window.fixtureLegacyWrites,success:window.fixtureSuccess,errors:window.fixtureErrors,external:window.fixtureExternalCalls})')
                    assert len(evidence['requests']) == (0 if state in ['unknown', 'legacy'] else 1), evidence
                    assert evidence['legacyWrites'] == (1 if state == 'legacy' else 0), evidence
                    assert len(evidence['success']) == (0 if rejected else 1), evidence
                    assert len(evidence['errors']) == (1 if rejected else 0), evidence
                    assert evidence['external'] == 0 and not errors and not blocked, (evidence, errors, blocked)
                    await page.screenshot(path=str(OUTPUT / f'{language}-{width}-{state}.png'), full_page=True)
                    results.append({'language': language, 'width': width, 'state': state, 'requests': evidence['requests'], 'legacyWrites': evidence['legacyWrites'], 'runtimeErrors': errors, 'externalDataCalls': evidence['external']})
                    await context.close()
        await browser.close()
    (OUTPUT / 'results.json').write_text(json.dumps(results, indent=2))
    print(json.dumps(results, indent=2))

asyncio.run(main())
