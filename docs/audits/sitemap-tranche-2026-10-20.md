# Sitemap implementation: first route/link tranche

Base: verified main `39ed762985378d176ca06e405ea78a67c8e659b8` after PR135 merged. Only the three follow-up commits are included; merged navigation changes are not repeated. The separate bootstrap PR136 is outside this tranche.

## Completed

- Property-detail project facilities now use the same canonical allowlist as the complex page. Metadata and duplicate aliases do not become amenity claims. This is a separate commit.
- Removed the duplicate `/invest` self-redirect, duplicate top-level ClearView routes and public `/mc/sequences` redirect. Investment retains its landing; ClearView retains the existing property layout; CRM sequences retains ActiveCompanyProvider, MCGuard and MCLayout. Public outreach stays at `/outreach`.
- Corrected 16 authored link occurrences in five verified path families:

| Previous path | Verified destination | Intent |
| --- | --- | --- |
| `/areas` | `/area` | Area directory |
| `/clearview` | `/property/clearview` | Existing ClearView landing |
| `/dining` | `/restaurants` | Restaurant catalogue |
| `/legal/insurance` | `/insurance` | Insurance catalogue |
| `/landing/airport-transfer` | `/transfer` | Transfer information |
| `/landing/airport-transfer` with “Book a transfer” CTA | `/transport/airport-transfer` | Existing transfer booking workflow |

No global redirect rule or generic fallback was introduced. Other query parameters, persona definitions, text claims and booking writers were not changed.

A separate compatibility commit restores the existing `intent=rent-month` and `intent=rent-long` persona bookmarks in the shared residential query parser. They hydrate monthly/yearly search respectively when no explicit tenancy parameter exists. An explicit tenancy (including an explicitly cleared value) takes precedence. Dates, guest filters, persona and return context remain in the URL; no availability code changes.

## Inventory limits and remaining work

`node scripts/qa/content-route-inventory.mjs <output.json>` reads actual JSX route declarations, resolves imported route fragments and records parent layout/guard expressions. Catch-all routes are excluded from destination validation. It does not execute application readers or validate database entities.

The current authored-content scan includes live and draft configurations: 307 link occurrences, 72 unmatched occurrences across 50 distinct hrefs, and 36 dynamic-route matches requiring entity verification. These counts are not a claim about live-page exposure. In particular, matching `/property/:id` does not prove that an authored slug identifies an existing property.

Remaining unmatched destinations must be reviewed individually, including specialist legal/medical paths, wedding subpages, old owner-workspace links and concierge intents. They have not been silently redirected to generic catalogues. Public five-tab navigation, common booking tracking and workspace-entry clarification remain subsequent implementation steps.

## Validation

44 focused tests across six files passed: mounted route ownership, actual MC guard guest/member/admin behavior and return context, verified content links, existing cluster/persona contracts and property-to-complex context. Scoped lint has no errors (two existing semantic-copy warnings); whitespace checks pass.

The legacy-tenancy compatibility run passed 58 tests across the query parser and search-route integration suite. Two additional mounted monthly/yearly bookmark cases passed separately; they exercise the actual catalogue alias and preserve persona/return context. Scoped lint passed.

## Independent review corrections

The first `/property?...` redirect now reads router location and preserves the anchor as well as search parameters. Mounted monthly/yearly cases start at the authored `/property` entry, reach the final search and verify tenancy, persona, return context and anchor. No-query landing behavior remains unchanged.

The project facility registry now covers the explicit ALL_AMENITIES checkbox writer and the AI intake project's enum. Explicit project aliases map swimming_pool to pool, tennis_court to tennis, security to security_24h and bbq_area to bbq. Security retains the existing checkbox writer's canonical key on the shared read path. Unknown metadata remains outside the display allowlist. Alias-only and supported-facility versus metadata component cases verify the correction. The two focused suites passed 62 tests; scoped lint has no errors and one route-export warning.

The exact independently reviewed bootstrap head `93d343e2ab01202e074cd94e67e58726f9e92504` was merged intact into this candidate for cumulative CI. Its watchdog code was not edited. Root coordinates PR136 first and verifies the regenerated PR137 merge candidate before merging; local results do not claim production acceptance.
