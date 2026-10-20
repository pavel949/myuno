# Shared header gutters and bounded partner form

Independent branch from main342e2ecb; PR146 owner/business work is not included
or modified.

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

60 additional cases, alongside the unchanged existing75-case combined fixture:

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

No local browser operation, merge, deployment, production data or grant change.
Remote current-head geometry and coordinator acceptance remain required.
