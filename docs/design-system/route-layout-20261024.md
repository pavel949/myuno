# Bounded route and layout corrections

Depends on Services/Orders draft PR172 (`9adf934a8c5d93c27e3aca7d12c9fff2e71b8504`). No release, writer, authorization or backend change.

| Surface | Evidence and decision |
| --- | --- |
| `/mc/properties/:id/manage` | Actual Router regression: route-relative `../editor` resolved to `/mc/editor`, losing property ID and query/hash/state. Redirect to the existing fixed-prefix editor with encoded ID, exact query/hash/state and replacement history. |
| MC and Property Hub lazy content | Actual local route fallback had viewport scope (844px in the fixture) inside its existing shell. Use the existing content scope (192px), preserving shared loader defaults. |
| Team layout | Parent NavShell owns `main`; Team had a nested `main`. Change the inner wrapper to `div`, retaining class, child position and draft value. No menu removed. |
| `/vendor/orders`, `/vendor/bookings` | Preserve compatibility. The orders path is used by the email function; identical destination alone does not justify removal. |
| `/invest/raise`, `/invest/submit`; `/invest/:id`, `/invest/project/:id` | Preserve existing entry/detail aliases. Canonical consolidation is not proved or implemented in this batch. |
| `/me/bookings` | Existing AppLayout suppression already prevents nested chrome. No redundant fix. |

Before: four focused regression failures. After: five focused tests pass, including canonical editor ID/query/hash/state, Back after replace, local content loading, one Team main and retained draft. Browser evidence comprises 12 before and 12 after contexts (390/1440, light/dark). Independent bounded source review: GO.

The browser uses actual route declarations, LoadingState and TeamLayout, with synthetic pending pages and modeled parent shell/sidebar. It does not prove live role guards, real Team menus, backend operations or whole-platform route correctness. Network/writers remain blocked. Full exact-head CI is required. The dedicated design workflow retains fresh screenshots and JSON.
