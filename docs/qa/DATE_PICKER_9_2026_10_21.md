# date-fns 4 / DayPicker 9 integration

Base: main `fb4b944a4c736f680ddb8e4b178f833030e021b1`. This additive reconciliation preserves original PR 6 ancestry and current dependency/security overrides. date-fns is 4.1.0 and react-day-picker is 9.14.0; v8's declared peer contract excludes date-fns 4, so the related calendar consumer migration is required. No peer-resolution bypass, inventory predicate, date helper, backend, schema or production activation changes.

Followed [the versioned DayPicker v9 migration guide](https://daypicker.dev/v9/upgrading). The shared Calendar now uses v9 cell/button/state names and Chevron slot. Its navigation remains 44px, the caption aligns with the new single navigation sibling, range endpoints/interior and checkout-only markings remain visible, and owner touch-size selectors follow the actual day button. HomeSearchDateRange retains its existing custom check-in/check-out behavior through a controlled onSelect callback, keeps past dates visibly disabled and anchors navigation/today to the Bangkok civil date. Other 24 Calendar consumers already use controlled onSelect. No rental URL, half-open inventory or purchase semantics were changed.

The browser harness now activates real native buttons inside date-keyed grid cells. v9 separates the button from the cell and gives cells localized full-date ARIA labels; the old numeric gridcell locator was no longer the interactive control. Checks still require keyboard selection, disabled days, URL handoff, purchase omission, focus restoration and no overflow. Added range reopening/endpoints/interior and selected-text contrast settlement. Screenshots fast-forward finite transitions, rather than certifying a mid-transition text color. No assertion or timeout was relaxed.

Local evidence:

- TypeScript exited 0 with no diagnostics (heap 3072; subsequent visual adjustments are CSS classes and the typed Bangkok-today prop). Exact-head CI remains required.
- HomeDiscoverySearch: 19/19 tests passed; calendarDates: 8/8 passed. New real-DOM Calendar regressions: 2/2 passed (selection, disabled days, checkout-only marking, keyboard focus, range and month navigation).
- An earlier overloaded DOM rerun had four 5-second test/RPC timeouts. Stable ISO cell lookup avoids repeatedly traversing the entire localized accessibility tree; final relevant files passed without raising timeouts.
- Changed TSX/test lint: 0 errors, 1 existing warning. Both changed Python browser harnesses compile successfully.
- Styled homepage-search browser matrix: 10/10 RU/EN cases at 320/375/390/430/1280, including range/contrast/focus checks. Zero runtime errors or external requests. Artifacts: `/tmp/browser/myuno-date-v9-home`.
- Styled canonical property-search browser matrix: 8/8 RU/EN cases at 375/390/430/1280, preserving search, filter, history and rent/buy routes. Zero runtime errors or external requests. Artifacts: `/tmp/browser/myuno-date-v9-unified`.
- Inspected actual mobile 390 and desktop 1280 range screenshots. Source CSS came from the isolated candidate's Vite server; fixture data is synthetic and all browser backend/external traffic was denied. The existing system Chromium executable was used because the Python package's bundled browser is absent locally. CI retains its standard Playwright installation.

CI and compatibility with the still-unmerged PR 156 homepage must be recorded separately at their exact resulting heads. No main merge or publication is implied by these local checks.
