# Services, Orders and consumer mobile header

This batch depends on the reviewed design-system stack through `04ba44df4cd98bac80619abaa486ab626a7c9249` (PRs 169–171). It does not merge or publish that stack, enable booking writers, or change business records.

## Changes

- One consumer mobile header row: authenticated visitors use the existing account menu; guests use the existing navigation sheet. Secondary preferences/cart remain reachable. Desktop and workspace authorization/navigation remain intact.
- Compact request-service cards retain their actual descriptions, indicative prices, durations and urgency conditions. Service-specific enquiry copy preserves the existing one-contact validation and transport.
- Request fields have associated labels, help and error messages. Footer clearance is measured so the actual chat launcher and the last contact control remain apart, including enlarged text. The prior clearance variable is restored when leaving the form.
- Guest property orders choose the property line item and enrich names through a single public catalogue projection. Missing public names retain historical human-readable snapshots or a neutral unavailable label. Commercial order IDs still open the existing order-tracking route; no inferred inventory IDs.
- Orders overview uses native, responsive navigation links, not incomplete ARIA tabs. Tracking reads/timelines are actor-scoped, abortable, and distinguish errors from unavailable rows. Property details remain read-only and retain authoritative dates, amounts and statuses. Shared progress now forwards its known numeric value to Radix and has an accessible name.

## Verification contract

The four QA adapters render actual components while replacing transport/context boundaries with synthetic data. Browser requests are restricted to their local fixture assets. They do not certify production authentication, RLS, backend submission delivery, payment, cancellation or live account records.

- Consumer header: 76 guest/authenticated, RU/EN/TH, light/dark, mobile/tablet/desktop cases; actual menu/preferences/cart controls, 44px targets, focus/Escape, motion action and no page overflow.
- Services: six language/viewport journeys through category/query/history, empty/error/retry, request CTA and return URL, associated validation, relevant enquiry copy and synthetic submit failure/retry.
- Floating clearance: 12 actual form/chat/bottom-bar scenarios, including 150% root text. Embedded service and Orders-model resting offsets are checked separately; that model is not a full Orders application shell.
- Orders: 52 overview/detail read-state cases. Native section links additionally exercise keyboard activation and browser Back/Forward. Read-hook unit regressions cover actor switch/logout, unauthorized/error states, and public name enrichment.

Source review is independent of browser evidence. No application writer, role grant, price calculation or backend schema is changed. Unknown future tracking statuses still inherit the pre-existing pending fallback; that limitation is not evidence of a completed booking lifecycle.

## Evidence and limits

Local evidence is recorded under `artifacts/myuno-services-orders-mobile-20261024` outside this checkout. CI retains its independently generated reports/screenshots in the Design system verification artifact. Screenshots use fallback fonts and isolated contexts; production typography and authenticated full-app sessions remain unverified.

The two supplied Library screenshots could not be materialized: the supported helper returned `library file transfer failed: download failed` on the initial attempts and one bounded retry. Original pixels were not inspected. Defects and results were independently reproduced with actual components, with the parent's permission; no alternate transfer route was used.

Deferred, separate batches: route/layout alias regressions and search/filter/date/location behavior, including sort URL persistence. The rest of the platform is not claimed fully unified.
