"""Exercise the real rates workspace with synthetic prices and zero backend requests."""
import asyncio
import json
import os
from pathlib import Path
import re
import sys
from urllib.parse import urlparse

from playwright.async_api import async_playwright, expect

OUT = Path(sys.argv[1])
ASSETS = {
    "/": ("index.html", "text/html"),
    "/fixture.js": ("fixture.js", "text/javascript"),
    "/fixture.css": ("fixture.css", "text/css"),
}


async def fixture_route(route):
    url = urlparse(route.request.url)
    asset = ASSETS.get(url.path)
    if route.request.method == "GET" and url.netloc == "localhost:8080" and asset:
        filename, content_type = asset
        await route.fulfill(path=str(OUT / filename), content_type=content_type)
    else:
        await route.abort()


async def run():
    results = []
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(
            headless=True, executable_path=os.environ.get("PLAYWRIGHT_CHROMIUM_EXECUTABLE")
        )
        for language in ("ru", "en", "th"):
            for width in (375, 390, 430, 1440):
                touch = width < 768
                context = await browser.new_context(
                    viewport={"width": width, "height": 900},
                    has_touch=touch, locale=language, service_workers="block",
                )
                await context.route("**/*", fixture_route)
                errors = []
                page = await context.new_page()
                page.on("pageerror", lambda error: errors.append(str(error)))
                await page.goto(f"http://localhost:8080/?lang={language}")
                first = page.get_by_role("button", name=re.compile(r"^2026-10-21 2500"))
                last = page.get_by_role("button", name=re.compile(r"^2026-10-24 4500"))
                await expect(first).to_be_enabled()
                await expect(last).to_be_enabled()
                await page.screenshot(path=str(OUT / f"{language}-{width}.png"), full_page=True)
                for day in (first, last):
                    await (day.tap() if touch else day.click())
                if touch:
                    trigger = page.get_by_role("button", name={
                        "ru": "Изменить цену за ночь", "en": "Edit nightly price", "th": "แก้ไขราคาต่อคืน",
                    }[language])
                    await expect(page.get_by_role("dialog")).to_have_count(0)
                    await trigger.tap()
                    dialog = page.get_by_role("dialog", name={
                        "ru": "Цена на выбранные даты", "en": "Price for selected dates", "th": "ราคาสำหรับวันที่เลือก",
                    }[language])
                    await expect(dialog).to_be_visible()
                    await expect(dialog.get_by_role("heading")).to_be_focused()
                    await page.screenshot(path=str(OUT / f"{language}-{width}-sheet.png"), full_page=True)
                await expect(page.locator("#calendar-price-from")).to_have_value("2026-10-21")
                await expect(page.locator("#calendar-price-through")).to_have_value("2026-10-24")
                await page.locator("#calendar-price-amount").fill("3400.50")
                await page.locator("button[type=submit]").click()
                await page.wait_for_function("Boolean(window.fixtureLastSave)")
                if touch:
                    await expect(dialog).not_to_be_visible()
                    await expect(trigger).to_be_focused()
                saved = await page.evaluate("window.fixtureLastSave")
                assert saved["p_from"] == "2026-10-21", saved
                assert saved["p_to"] == "2026-10-25", saved
                assert saved["p_price"] == 3400.5, saved
                assert saved["p_expected"]["2026-10-21"]["booking"] == "fixture-booking", saved
                assert await page.evaluate("document.documentElement.scrollWidth <= innerWidth"), (language, width)
                assert not errors, errors
                results.append({"language": language, "width": width, "status": "passed"})
                await context.close()
        await browser.close()
    (OUT / "results.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
    print(json.dumps(results))


asyncio.run(run())
