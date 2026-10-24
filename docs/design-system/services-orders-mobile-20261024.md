# Services, Orders and consumer mobile header

This batch depends on the reviewed design-system stack through `04ba44df4cd98bac80619abaa486ab626a7c9249` (PRs 169–171). It does not merge or publish that stack, enable booking writers, or change business records.

## Changes

- One consumer mobile header row: authenticated visitors use the existing account menu; guests use the existing navigation sheet. Secondary preferences/cart remain reachable. Desktop and workspace authorization/navigation remain intact.
- Compact request-service cards retain their actual descriptions, indicative prices, durations and urgency conditions. Service-specific enquiry copy preserves the existing one-contact validation and transport.
- Request fields have associated labels, help and error messages. Footer clearance is measured so the actual chat launcher and the last contact control remain apart, including enlarged text. The prior clearance variable is restored when leaving the form.
- Guest property orders choose the property line item and enrich names through a single public catalogue projection. Missing public names retain historical human-readable snapshots or a neutral unavailable label. Commercial order IDs still open the existing order-tracking route; no inferred inventory IDs.
- Orders overview uses native, responsive navigation links, not incomplete ARIA tabs. Tracking reads/timelines are actor-scoped, abortable, and distinguish errors from unavailable rows. Property details remain read-only and retain authoritative dates, amounts and statuses. The existing generic service progress forwards its known numeric value to Radix and has an accessible name. Property details show their stored status/history without imposing generic service percentages. Unsupported statuses never receive an invented progress value, and unknown statuses are labelled neutrally. Property/unknown-kind records cannot mount the review writer until resource identity and dismissal are separately verified.

## Verification contract

The four QA adapters render actual components while replacing transport/context boundaries with synthetic data. Browser requests are restricted to their local fixture assets. They do not certify production authentication, RLS, backend submission delivery, payment, cancellation or live account records.

- Consumer header: 76 guest/authenticated, RU/EN/TH, light/dark, mobile/tablet/desktop cases; actual menu/preferences/cart controls, 44px targets, focus/Escape, motion action and no page overflow.
- Services: six language/viewport journeys through category/query/history, empty/error/retry, request CTA and return URL, associated validation, relevant enquiry copy and synthetic submit failure/retry.
- Floating clearance: 12 actual form/chat/bottom-bar scenarios, including 150% root text. A separate eight-case composition uses actual OrderTracking, BottomBar and closed Chat: five before-fix cases exposed intercepted or clipped contacts; all eight pass after property actions move into normal responsive flow. PageContainer owns the local gutters; its parent no longer adds a second content container. Final status badges do not split words. Embedded service and Orders-model resting offsets are checked separately; that model is not a full Orders application shell.
- Orders: 90 overview/detail read-state cases, including checked-in/out, deposit-paid, completed and unknown property states. Native section links additionally exercise keyboard activation and browser Back/Forward. Read-hook unit regressions cover actor switch/logout, unauthorized/error states, and public name enrichment.

Review follow-up reproduced 16 failures at the old boundary; 40 focused regressions pass after containment, with the actual review component retained and its synthetic writer forbidden for property records. Known non-property review UI is preserved but its target and dismissal contracts remain outside this acceptance.

The order-action gap assertion resolves the actual design-system spacing role (16–48 CSS pixels) with a 0.5 CSS-pixel rounding tolerance, since scrollHeight/scrollY are integers and element bounds are fractional. Strict rectangle non-overlap, hit-testing and text/icon containment are separate checks. The parent shell is synthetic and adds no extra NavShell padding; this is conservative geometry evidence, not a complete authenticated App acceptance.

Source review is independent of browser evidence. No application writer, role grant, price calculation or backend schema is changed. Property reviews are safely contained, not implemented as a complete review workflow. The broader booking lifecycle and other vertical review contracts are not certified by this read-only UI batch.

## Evidence and limits

Local evidence is recorded under `artifacts/myuno-services-orders-mobile-20261024` outside this checkout. CI retains its independently generated reports/screenshots in the Design system verification artifact. Screenshots use fallback fonts and isolated contexts; production typography and authenticated full-app sessions remain unverified.

The two supplied Library screenshots could not be materialized: the supported helper returned `library file transfer failed: download failed` on the initial attempts and one bounded retry. Original pixels were not inspected. Defects and results were independently reproduced with actual components, with the parent's permission; no alternate transfer route was used.

Deferred, separate batches: route/layout alias regressions and search/filter/date/location behavior, including sort URL persistence. The rest of the platform is not claimed fully unified.
