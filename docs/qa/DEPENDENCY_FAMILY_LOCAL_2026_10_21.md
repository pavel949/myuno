# Local dependency-family compatibility candidate

This local branch combines the reviewed homepage and dependency migrations for joint verification. It has not been pushed or merged externally. It is not a production release or a claim of fully green integration.

## Sources and exclusions

Base: `fb4b944a4c736f680ddb8e4b178f833030e021b1`.

- Homepage: `600b1f95af93d9da538cc0f5491551472a7512b6`, plus reviewed bouquet-error and scoped calendar-layer fixes in `f2e441517c0b13d3362e74e8ecac3e36c7083e07`.
- Dates: `718b4d4c7fbe40d75e054c9fb33d09632556b6bc`.
- React: `132fae881b24f34d098c5c49662dd1880815ed10`.
- Hooks: `d35f96a573d06dd883ca49398c0def0a4d6cdc17`.
- Refresh: `7f077402b88881adfba0604882ec929da0b63b32`.
- Tailwind: `e2ff749927531bae0a34cd2ecc7d2ecea1e48d85`.
- Integration repairs preserve the missing `within` import and await actual cold registry imports in the service-route test.

Excluded: Lucide PR 8 and its blocked push repair, Auth WIP, UI 51, the company loading/checklist change whose upload was denied, critical booking writer 125, transport backlog and FX writer. No excluded source is copied here. No security check, existing rule, assertion or timeout is weakened.

Ordinary strict-peer npm ci passed. The installed census is React/DOM 19.2.4, Dialog 1.1.17, DayPicker 9.14.0, date-fns 4.1.0, Helmet 3.0.0, Vaul 1.1.2, Tailwind/PostCSS 4.2.2, tailwind-merge 3.5.0, Hooks 7.0.1, Refresh 0.5.2 and Lucide 0.462.0.

## Verification ledger

| Check | Result and exact scope |
| --- | --- |
| Reference-build TypeScript | PASS, 258.27 seconds at `fc552c1b80a6f31bb6152f0474cff895480971df` |
| Initial migration-focused suite | PASS, 47 tests in seven files at that source |
| Full local suite | **RED**, 3926 passed / 4 failed in 292 files, 1446.79 seconds at that source |
| Initial unchanged failure isolation | 25 passed / 1 failed; only cold service-route import reproduced |
| Final targeted suite | PASS, 73 tests in ten files, 57.79 seconds at `9d7015a01bce8242aaca442dea23fa8f9a2f7185` |
| Production build | PASS in 3m 5s before the later bootstrap HTML and homepage read/layer fixes; final exact-source build remains required |
| Full lint | PASS, 0 errors / 2492 warnings before the final homepage fixes; the final changed homepage files also passed independent scoped lint |
| Actual main/App browser | PASS, eight synthetic cases at `9d7015a01bce8242aaca442dea23fa8f9a2f7185`; details below |
| Final complete remote integration | **PENDING**; no final full-suite success is inferred from focused passes |

The full local failures were one cold `/discover/services` route expectation, one Russian developer-menu timeout and two React runtime timeouts (head and drawer). The original full RED log remains preserved. Unchanged isolation passed the menu and React cases; this does not prove a resource cause or erase their full-run failures. Resource snapshots recorded process/RSS/heap/cgroup counters, no OOM kill, absent PSI files and observed host delays without attributing a definitive cause.

A wrapper around the real registry loader measured `GoalEntryPage` resolving successfully in 1673.46ms, versus 332.70ms for `ServicesIndex`. No import rejection occurred. The temporary wrapper was removed. Installed Vitest documentation describes `dynamicImportSettled()` as awaiting imports initiated by synchronous calls, including nested imports. The retained test mounts the actual cold route synchronously, then awaits import completion inside async `act`. Loading boundaries, real pages, filter/return assertions, the one-second UI wait and five-second test deadline remain intact. All 16 affected service cases pass without suspended/act warnings. No preload or arbitrary delay is introduced.

## Actual application regressions and final browser proof

Standalone component fixtures had missed the bootstrap reset: generated padding utilities and `--spacing: 0.25rem` existed, but the unlayered universal reset in `index.html` overrode them. Matched-rule evidence showed a real service-card padding of zero. Tailwind's reviewed fix places only that reset in the canonical base layer. The focus fixture now includes the actual critical CSS. Its original-reset negative control fails at zero versus 24px padding; the fixed four-case matrix passes, including actual control padding, contrast, keyboard and forced colors.

Actual tablet/desktop screenshots then exposed the calendar behind the search sheet. The unchanged 768px native-pointer negative test failed because the z-120 sheet intercepted a visible day button. The reviewed homepage fix changes only the date popover's layer to z-130; global popovers remain untouched.

The final actual-App matrix exercises empty and error states at 390/768/1440, plus empty states at 320/1920. It verifies:

- Keyboard search entry, title focus, optional area/guest fields and unchanged date/filter URL semantics.
- Unforced native pointer selection and a center-point hit test at 768/1440/1920, keyboard checkout selection, range ARIA, Escape and focus restoration.
- Calendar footer padding, actual service-card/help padding, viewport bounds and absence of horizontal page overflow.
- Rendered property empty/error results after navigation, rather than accepting only the URL.
- All five homepage error alerts, including the actual bouquet-hook failure, and honest cold service-route error/empty states at 390/1440.
- No JavaScript page errors. All external and non-GET requests and websockets are blocked; local synthetic GETs return empty or HTTP 500 data.

Representative final pixels were inspected: 320/390/768/1440 calendars, 1920 search entry, 390 property results/services, and 390 error homepage. Pre-fix screenshots remain NO-GO evidence and are not substituted for final screenshots.

This is synthetic browser acceptance with external fonts blocked and fallback typography. It does not certify real catalog contents, real RLS/integration availability, currency read RPCs (POST denied), production fonts or deployment. No actual booking/auth submission is made.

Evidence: `/workspace/artifacts/dependency-family-9d7015a0-20261021`, with 35 PNGs and a SHA-256 manifest. Original primary and extreme result JSON files remain under `/tmp/browser/myuno-dependency-family-app-9d7015a0-{final,extremes}`. Full and focused logs use `/tmp/myuno-deps-family-*.log`.

## Reproduce the browser audit

Run the dev server from this repository with synthetic configuration:

```sh
VITE_SUPABASE_URL=http://127.0.0.1:54321 VITE_SUPABASE_PUBLISHABLE_KEY=synthetic-family-public-key VITE_SENTRY_DSN= NODE_OPTIONS=--max-old-space-size=3072 node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 8084 --strictPort
```

In another terminal, use the retained standalone harness. Its functional body matches the tested scratch script; only cwd/output/width/state/Chromium options were generalized. It has not been added to a workflow or fixture registry.

```sh
python scripts/qa/dependency-family-app-smoke.py /tmp/browser/family-primary --widths 390 768 1440 --states empty error
python scripts/qa/dependency-family-app-smoke.py /tmp/browser/family-extremes --widths 320 1920 --states empty
```

The browser defaults to `/usr/bin/chromium`; `PLAYWRIGHT_CHROMIUM_EXECUTABLE` can select another supported installation. Python compilation and CLI help were checked. Build/dev-generated version and banner-managed MCP files were inspected and restored after stopping the owned process.
