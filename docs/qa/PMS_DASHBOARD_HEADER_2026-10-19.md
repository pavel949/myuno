# PMS dashboard header: scoped UI candidate

## Observed problem and action hierarchy

The supplied mobile screenshots show the management-view strip clipped horizontally, crowded global controls, and repeated empty-state paragraphs. Source confirms the strip changed dashboard composition, while the overview immediately below it stayed the same. It was not workspace navigation.

The candidate makes the first actions actual `Объекты / Календарь / Задачи` links from the existing owner sidebar model. The composition preference remains below the common overview as an explicitly labelled “Дополнительные блоки” select explaining that it changes the sections below. The existing preference values and invalidation handler remain intact.

For the MC header only, the mobile preference controls move into a labelled popover. Sidebar, brand, search and account remain visible; the existing account menu content and access remain intact. The compact account trigger and header controls retain 44px targets.

The overview keeps its four real sections and destinations. It removes repeated “События”, empty box, “Следующее действие” and redundant descriptive copy. Existing event rows, amounts, timestamps and source data are unchanged. Exposed query errors now render an error with retry instead of an empty summary; the operational-task hook only exposes its existing query error. No query, scoping, authorization, business writer or schema changes.

## Local evidence

- Focused dashboard tests: `src/components/owner/dashboard/__tests__/DashboardNavigation.test.tsx`.
- `node scripts/qa/pms-dashboard-ui.mjs --bundle-only`: successful actual-component fixture bundle. Production data imports are forbidden by the bundler assertion.
- Python fixture syntax validated. Browser execution was not run locally; screenshots and viewport acceptance remain pending CI.
- Focused ESLint has no new warnings/errors. `UserAvatarMenu` retains its pre-existing `QUICK_OPERATE_PRIORITY` dependency warning.
- `git diff --check`: clean.
- Full typecheck attempt exhausted the local Node default ~2GB heap. It is not a passing result. Aggregate typecheck/build/tests are reserved for root CI.

## CI browser fixture

Run `node scripts/qa/pms-dashboard-ui.mjs` with the existing preview on localhost:8080. The fixture uses the real TopBar, account menu, sidebar, greeting, destinations, overview and composition select. Synthetic hooks isolate data; a synthetic search boundary validates its trigger only. It does not prove the full search implementation or full dashboard lazy-widget flow.

The fixture matrix covers RU/EN at 375, 390, 430 and 1280px, empty/loading/error/populated states, destination links, preference selection, account/sidebar/search triggers, focus and horizontal bounds. Browser routing denies all non-local requests. Artifacts are written to `/tmp/browser/pms-dashboard-isolated`, following the existing CI fixture convention.

No production changes or production UX acceptance are claimed. Rollback is the UI commit revert; no database rollback is needed.
