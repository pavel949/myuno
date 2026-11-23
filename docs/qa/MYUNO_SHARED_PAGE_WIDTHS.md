# Shared page widths

Use the existing PageShell and PageContainer profiles. The outer frame owns
horizontal gutters; do not nest another full-width frame inside it. Use one
width by purpose rather than copying a numeric maximum into a screen.

| Surface | Profile | Behaviour |
| --- | --- | --- |
| Long text | narrow | 48rem maximum, readable paragraphs |
| Input or checkout | form | 52rem maximum; no wide form |
| General content | default | 64rem maximum |
| Overview/dashboard | wide | 80rem with purposeful columns; profile overview uses this |
| Product detail | detail | 90rem, aligned chrome; media and desktop action rail |
| Admin/workspace | workspace | 96rem inside existing shell; retain sidebar and role guards |
| Catalogue | catalogue | 110rem for tiles/filters, not individual text lines |
| Map/canvas | full | Only when the display requires the viewport |

The initial detail migrations cover yachts, vehicles, experiences and service
provider details. On a narrow screen the action path remains a single column
or the existing mobile action bar. Existing public catalogue widths, compact
account settings, authentication and data/booking contracts remain unchanged.

## Acceptance

Measure aligned chrome and first body rail, document overflow and action
visibility at 320, 390, 1348, 1440, 1920 and on a short desktop viewport.
Keyboard focus must not disappear underneath the header, action bar or
assistant launcher. Run light/dark and RU/EN/TH against a real photo fixture,
a missing-photo fallback, an enquiry-only experience, provider error/retry
and a synthetic authenticated profile. Confirm unchanged CTA destination,
state and loading/error states without sending a booking, question or payment.
Record component versus browser versus production evidence separately.

For admin workspaces: the guard and navigation stay in AdminRouteLayout and
AdminLayout. Each top-level workspace owns one PageShell and PageHeader (use
structured actions for mobile overflow). Embedded tab content must not add
another outer frame. The full-width Admin Catalogue overview demonstrates the
contract; the query-addressed legacy tabs retain their existing wrapper.
