# Shared header gutters and bounded partner form

Originally independent from main342e2ecb. At coordinator request, PR146 head
33df84dbf73bc20c527f1cc1300b04935b53078c is now integrated by normal merge,
preserving both histories and all owner/business anchor work.

## Verified findings and changes

The consumer header used18px padding through820px and24px through1100px,
disagreeing with `ECOSYSTEM_PAGE_CONTAINER` at768–820 and1024–1100. Non-overlay
header padding now follows the same16/24/32/40px values at0/768/1024/1280.
The absolutely positioned mobile menu trigger follows that inset too. The actual
portaled Sheet menu gets the same gutter through a non-overlay-only class;
its selector outranks the Sheet's generic p-6 utility. The unused legacy
consumer-mobile-menu CSS receives the same scoped fallback behavior. Homepage
overlay selectors and their24/56px insets are preserved.

BecomePartnerPage normal and success branches each nested PageContainer inside
AppLayout's default horizontal container. Both now explicitly opt out of the
outer container and use one `max-w-3xl` (768px) PageContainer. The success message
retains its inner `max-w-md`. No submission, auth return, draft, notification,
copy, route or permission logic changes.

## Reduced real-component CI matrix

60 additional cases, alongside PR146's full105-case combined fixture:

- EN non-overlay and overlay at all requested boundaries:639/640,767/768,
  820/821,1023/1024,1100/1101,1279/1280 (24cases).
- RU/TH both headers at639/768/1024/1280, proving localized controls at each
  canonical token transition without multiplying every redundant edge (16cases).
- Partner normal/success/error at320/768/1280 in RU/EN (18cases), plus TH normal
  at320/1280 (2cases; existing page uses English fallback for Thai).

Header geometry compares actual ConsumerHeader padding and content edge to a
real element using `PUBLIC_CONTENT_LAYOUT.marketing`. Menu dialog padding and
first link hit-box edge are measured after the real trigger opens the Sheet.
Overlay padding is checked separately against unchanged24/56px behavior.
Control bounds and document overflow remain enforced.

Partner cases use actual BecomePartnerPage, PageContainer, fields and submit
handler. They assert one centered frame <=768px and no auto outer frame, field
and button bounds, retained error form/values, success view and exact synthetic
request/notification counts. The AppLayout fixture adapter now respects its
actual automatic-container opt-out semantics while retaining real NavShell.

All partner reads/inserts/notifications are in-memory synthetic stubs guarded to
that surface/table/function; all other database access throws. No data reaches
Supabase, providers, email or a real recipient. Each browser context is new and
network-denying; forms touch only synthetic context storage. Error toast calls
are covered by the JSDOM test; global production toast rendering is not included
in geometry. Canonical Google Fonts remain unavailable; system-fallback geometry
does not certify canonical fonts or physical safe-area devices.

The new early CI step has its own180s bound, incremental results/screenshots and
artifact, and is an additional final enforcement condition. Original mandatory
gates and network restrictions are retained. Both browser scripts refuse local
execution. Local verification is JSDOM/source, syntax and bundle-only.

No local browser operation, merge to main, deployment, production data or grant change.

Integration resolution: only combined-layout-ui.mjs conflicted. Its entry now
retains the union of actual owner/business/partner/header/overlay surfaces and
required-module assertions, plus the container-aware adapter and strictly
synthetic partner transport. Both Python matrices and the workflow merged
without conflict;105+60 cases and every mandatory outcome gate are retained.
No merge to main or release is performed by this worker.
Remote current-head geometry and coordinator acceptance remain required.

CI follow-up to integrated dadf745: artifact12244420019 has105/105 combined
passes but59/60 header/partner passes. The TH639 menu links were sampled one
384px sheet-width to the right (656 vs settled272); the later failure screenshot
shows the sheet at255..639. SheetContent retains its real500ms entry animation.
The geometry harness now waits at most5s for no pending/running own animations
and100ms stable actual rectangle before measuring. Padding, link bounds,
document overflow, all60 cases and final mandatory enforcement remain intact.

Separate PR146 artifact12243254429 confirms an Escape failure after opening
the real property card dropdown/editor atTH1280. It lacks failure-time DOM,
focus and layer diagnostics, so its exact cause remains unproven. Source shows
Radix menus remain registered dismissable layers until exit animation unmount;
the fixture previously sent Escape after visibility alone. The fixture now
requires the actual exiting menu to detach, sheet to settle and focus to be
inside it before sending one Escape. It retains the original5s zero-dialog
assertion and captures before/after focus, layers, animations and screenshot on
failure. Successful cases persist readiness evidence incrementally. This
checks ready keyboard interaction; it does not certify immediate Escape during
an overlapping menu/sheet transition. No product animation, focus or close
handler changed. Three pure Node VM predicate tests cover active/pending
animations and geometry movement, and run in the existing required CI step.
New-head remote browser evidence remains required; no blind rerun was made.
