# Admin catalogs: navigation tranche

## Verified source gap
The catalog entry led to technical tabs, then nested service/property/product tabs. Experiences were absent from this entry, although existing experience and category editors exist. Property developers, projects and units already have distinct canonical editors. Services use existing categories and providers; no new taxonomy or data model is needed for the navigation change.

## Change
Default `/admin/catalog` is a task-first hub: Experiences, Services, Real estate. Each opens existing protected editors. Technical views remain accessible under Additional tools and original `?tab=` links. URL-addressable legacy tabs and provider query context remain supported. No queries, writes, schema, routes or authorization changes are introduced by the hub. Experience taxonomy work belongs to its independent tranche.

## Remaining gaps (not resolved by navigation)
- Dynamic experience category selection is provided by merged PR #251, preserved by this tranche.
- Detailed highlights/includes/requirements are not fully editable through the current experience form.
- Full public card readiness and booking/delivery require per-domain acceptance, not merely this hub.

## Verification
Five focused component/navigation tests passed after synchronization with main including PR #251 and #256. Earlier exact-head CI passed verify/security/semantic and catalog viewport acceptance; final synchronized-head CI is required. Desktop and mobile fixture screenshots were inspected; CTA alignment was corrected. Design audit: zero new/structural findings. Local full typecheck was killed by memory pressure; CI must pass before acceptance. Local Chromium cannot launch due to sandbox socket restrictions, including the reviewed escalation attempt. Added isolated fixture and CI for 375/390/430/1440 viewport evidence. This is the actual hub component with synthetic language/router context, not authenticated full-app acceptance. Inspect screenshots and verify live protected navigation after deployment before calling visual acceptance complete.

Rollback: revert navigation/component commit; existing editor routes and records are unchanged.
