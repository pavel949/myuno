"""Responsive tests of actual public journey components with synthetic read boundaries."""
import functools
import http.server
import json
import pathlib
import sys
import threading
from playwright.sync_api import sync_playwright

output = pathlib.Path(sys.argv[1]).resolve()
handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(output))
server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
thread = threading.Thread(target=server.serve_forever, daemon=True)
thread.start()
base = f"http://127.0.0.1:{server.server_port}"
results = []
try:
    with sync_playwright() as runtime:
        browser = runtime.chromium.launch()
        try:
            for lang in ("ru", "en"):
                for width in (320, 375, 390, 430, 1440):
                    page = browser.new_page(viewport={"width": width, "height": 1000})
                    errors = []
                    forbidden = []
                    page.on("pageerror", lambda error: errors.append(str(error)))
                    def guard(route):
                        url = route.request.url
                        if url.startswith("https://fixture.invalid/"):
                            route.fulfill(status=200, content_type="image/svg+xml", body='<svg xmlns="http://www.w3.org/2000/svg" width="900" height="700"><rect width="900" height="700" fill="lightgrey"/><text x="80" y="350" font-size="36">SYNTHETIC QA PHOTO</text></svg>')
                        elif url.startswith(base + "/") or url.startswith("data:"):
                            route.continue_()
                        else:
                            forbidden.append(url)
                            route.abort()
                    page.route("**/*", guard)
                    page.goto(f"{base}/?lang={lang}")
                    page.locator(".property-journey").wait_for()
                    def geometry():
                        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), f"overflow: {lang} {width}"
                    geometry()
                    guide = "Открыть путеводитель" if lang == "ru" else "Explore the area guide"
                    page.get_by_role("link", name=guide).click()
                    page.locator(".property-journey-return").wait_for()
                    assert page.get_by_test_id("qa-location").inner_text() == "/area/bang-tao"
                    geometry()
                    page.locator(".property-journey-return").click()
                    assert page.get_by_test_id("qa-location").inner_text() == "/property/synthetic-unit?mode=rent&checkIn=2026-12-01&checkOut=2026-12-08&guests=3"
                    thumb = "Показать фото 3" if lang == "ru" else "Show photo 3"
                    photo = "Открыть фото 3" if lang == "ru" else "Open photo 3"
                    page.get_by_role("button", name=thumb).click()
                    page.get_by_role("button", name=photo).click()
                    assert page.get_by_test_id("qa-photo").inner_text() == "2"
                    long_stay = "Снять надолго" if lang == "ru" else "Long stay"
                    assert "tenancy=long" in page.get_by_role("link", name=long_stay).get_attribute("href")
                    if width in (390, 1440):
                        page.screenshot(path=str(output / f"detail-{lang}-{width}.png"), full_page=True)
                    buy = "Купить" if lang == "ru" else "Buy"
                    page.get_by_role("link", name=buy, exact=True).click()
                    assert page.get_by_test_id("qa-location").inner_text() == "/property/synthetic-unit?mode=buy"
                    page.goto(f"{base}/?lang={lang}&page=home")
                    page.locator(".home-listing h3 a").wait_for()
                    geometry()
                    assert page.locator(".home-listing a a").count() == 0, "nested card anchors"
                    page.locator(".home-listing h3 a").click()
                    assert page.get_by_test_id("qa-location").inner_text() == "/property/synthetic-unit?mode=rent"
                    assert not errors, errors
                    assert not forbidden, forbidden
                    results.append({"language": lang, "width": width, "outcome": "PASS", "checks": ["geometry", "actual area round trip", "gallery", "offer intent", "home card", "no production network"]})
                    page.close()
        finally:
            browser.close()
finally:
    server.shutdown()
    server.server_close()
    (output / "results.json").write_text(json.dumps(results, ensure_ascii=False, indent=2))
assert len(results) == 10, results
print(json.dumps({"cases": len(results), "outcome": "PASS"}))
