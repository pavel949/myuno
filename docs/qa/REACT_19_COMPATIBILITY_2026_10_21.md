# React 19 compatibility — 21 October 2026

The candidate preserves main `fb4b944a4c736f680ddb8e4b178f833030e021b1` and original PR 5 head `c84081ba457b7f213b943392e4e13c3dd1b04286` as merge parents. No source or history is discarded, and no force push is required.

## Dependency and source contract

React and ReactDOM are pinned together at 19.2.4, with @types/react 19.2.14 and @types/react-dom 19.2.3. Helmet 3.0.0 and Vaul 1.1.2 replace versions whose declared peers excluded React 19. Ordinary npm resolution and npm ls pass without legacy-peer-deps, force or custom peer overrides. Lockfile changes include the resolved Radix/Floating UI peer graph and scheduler; they are exercised by real drawer, sheet and application checks.

Registry metadata for react-day-picker 8.10.2 explicitly permits React 19. Its date-fns 2/3 peer remains a separate PR 6 concern; this branch does not duplicate the Calendar 9 migration. Updating both branches requires ordinary dependency integration and final combined checks.

The [official React 19 upgrade guide](https://react.dev/blog/2024/04/25/react-19-upgrade-guide) requires explicit useRef initial values and scoped JSX types. Existing refs that began undefined now explicitly receive undefined; their lifecycle and cancellation behavior remain unchanged. FETPage uses ReactElement instead of the removed global JSX namespace. No auth, inventory, payment or backend contract is changed.

## Existing controlled-help focus defect

The actual application exposed a pre-existing focus gap: ConciergeHelpSheet is controlled without a SheetTrigger, so Escape returned focus to body. The same result was reproduced with the existing React 18.3.1 fixture at 390 and 1440. A separate commit captures the external opener before default dialog autofocus and restores it on close only while it is connected. Initial autofocus is preserved. No form, request or validation behavior changes.

Two real-component regressions verify StrictMode open/Escape/focus and preserved fields/failed submission before focus return. Submission is a stub; no actual request is sent.

## Executed checks

- Six focused files: 36/36 passed, covering actual SEOHead/Helmet updates, Vaul drawer, Radix sheet focus, ErrorBoundary, InvestorGuard, anonymous Landing in three languages, AppLayout and MeShell.
- Controlled HelpSheet regressions: 2/2 passed.
- Narrow lint: passed with no errors; existing warnings remain.
- Actual main.tsx/App browser: six cases passed at 390 and 1440. Public head/home, pointer and native Enter help opening, Escape/focus return, and private /mc/properties → /auth?redirect=%2Fmc%2Fproperties all passed without JavaScript page errors. Auth email entry was visible; no credential submission or successful private session is claimed.
- Screenshots in `/tmp/browser/react19-app-entry` were inspected for mobile public entry, desktop help and mobile authentication gate. They show the existing main homepage, not acceptance of the separately proposed PR 156 layout.
- Full TypeScript, full tests, production build and exact final CI remain pending; local compute is serialized across backlog branches. The candidate must not be described as ready until those gates pass.

## Reproduce the safe application smoke

Start the real app locally with a synthetic backend:

```sh
VITE_SUPABASE_URL=http://127.0.0.1:54321 VITE_SUPABASE_PUBLISHABLE_KEY=synthetic-react19-public-key VITE_SENTRY_DSN= npm run dev -- --host 127.0.0.1 --port 8085 --strictPort
```

Then run:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium python3 scripts/qa/react-runtime-app-smoke.py
```

The smoke only loads localhost application GETs and supplies synthetic localhost backend GET responses. Every external or POST request is aborted, including read RPCs; no authentication dispatch, production business write, migration, deployment or settings change occurs. This is runtime compatibility evidence, not a hosted catalog/RLS certificate. Without an executable override, Playwright uses its installed Chromium.

## Full-suite regression correction

The first full run at `b508dd36c` passed TypeScript and 3912 tests, but failed five assertions. Four unchanged booking-calendar tests exposed a real nested-popover regression: npm had upgraded Dialog to 1.3.1 while existing Popover components used an older internal focus/dismissal generation. Merely awaiting the calendar did not resolve it. Pinning Dialog to main's React-19-compatible 1.1.17 restores the shared modal contract; all four original calendar tests then pass unchanged. The lockfile no longer carries the unnecessary newer modal primitive graph.

The partner confirmation test now awaits the heading becoming visible through its real Framer entrance transition, retaining the visible-result assertion. The new drawer unit supplies an animationend event because JSDOM does not execute CSS animations; it still asserts the real closed state and final unmount. Native Chromium separately confirms drawer close/unmount and focus restoration at 390 and 1440.

The resulting four focused files pass 12/12, including the original regressions and the head/drawer/sheet/help tests. Fresh exact-head full verification is required; the failed first run is not represented as green.
