# Sitemap implementation: first route/link tranche

Base: pending navigation PR135 (`866e9abd35f8f27d474990949d02e6879965773f`), itself based on main `1f3cf2164c7e64dd4a6aa8330a38fa864a94cdb1`. PR135 and the separate bootstrap PR136 are unchanged.

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

## Inventory limits and remaining work

`node scripts/qa/content-route-inventory.mjs <output.json>` reads actual JSX route declarations, resolves imported route fragments and records parent layout/guard expressions. Catch-all routes are excluded from destination validation. It does not execute application readers or validate database entities.

The current authored-content scan includes live and draft configurations: 307 link occurrences, 72 unmatched occurrences across 50 distinct hrefs, and 36 dynamic-route matches requiring entity verification. These counts are not a claim about live-page exposure. In particular, matching `/property/:id` does not prove that an authored slug identifies an existing property.

Remaining unmatched destinations must be reviewed individually, including specialist legal/medical paths, wedding subpages, old owner-workspace links and concierge intents. They have not been silently redirected to generic catalogues. Public five-tab navigation, common booking tracking and workspace-entry clarification remain subsequent implementation steps.

## Validation

44 focused tests across six files passed: mounted route ownership, actual MC guard guest/member/admin behavior and return context, verified content links, existing cluster/persona contracts and property-to-complex context. Scoped lint has no errors (two existing semantic-copy warnings); whitespace checks pass.
