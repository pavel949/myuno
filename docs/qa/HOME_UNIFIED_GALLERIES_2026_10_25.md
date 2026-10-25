# Homepage unified galleries — draft implementation

Base: c640a9350078735b352b3f141c5a10611edde0e7. Separate from the saved owner-intake WIP and frozen MC/backend PR183. No merge, publication, migration, role change or live business writes.

## Implemented scope

One HomeGallery section wraps the existing HorizontalRail for areas, linked communities, specific homes and service categories. Native touch scrolling, partial next mobile card, keyboard arrows/Home/End, focus reveal, reduced motion and desktop controls are retained without autoplay. Card facts remain domain-owned. Empty successful community/service supply is omitted; failed reads remain explicit and retryable. The extra experience feed/process section is removed from this homepage composition, not from the application.

Service destinations derive from the existing live taxonomy and established route allowlist. Flowers, airport transfers/Fast Track, cars/bikes and home services are presentation groups, not new database categories. Fast Track has its own destination and is shown only for an exact active matching row; it is not bundled into a transfer purchase. The All services link reaches /discover/services, with shared live category groups filtered by its existing URL-backed search. Existing request functions, marketplace providers and return paths remain.

The owner footer invites individual discussion after reviewing the property and expectations; it does not promise fixed commissions or acceptance. Existing consultation form/business activation is not changed by this PR.

## PR180 reconciliation and unresolved photo requirement

Reviewed feat/area-first-release at d110172028acf6d7ad6ac2712f64b564153a3c96. Reuse is deliberately limited to compatible existing area identity/navigation: Laguna is an existing /area/laguna guide, alongside current Kamala, Surin and Bang Tao. No second area taxonomy, count service, editorial guide copy or unaccepted media pipeline is introduced. PR180's HomeLocationGallery re-export will require explicit manual integration rather than overwriting this shared-gallery composition. Nai Yang's proposed guide and source-backed area-content expansion stay with PR180.

**Updated user-approved interim treatment: original illustrative covers; factual district photography remains incomplete.** The project tree does not contain verified reusable geography photographs for these cards. A vehicle image containing a district name and project-specific pictures are not neighborhood evidence. PR180's documented media-access denials are not retried; no provider/tool switch, unrelated stock photo or fabricated photograph is substituted. After the user explicitly requested temporary covers, cards now use an original repository coastal vector with a visible localized Illustration label. It depicts no specific district. A central homeAreaCovers config makes per-area replacement explicit and requires provenance. This is a completed temporary illustration treatment, not a completed district photographic gallery. District-correct image bytes, usage rights/provenance and crop/load visual acceptance are required before closing that requirement.

## Verification limits

All runtime fixtures use synthetic public reads and deny backend/external writes. They are not production inventory, authenticated workflows, successful delivery or font-fidelity proof. Full-page screenshots may show fixed navigation at the captured viewport position. Final exact-head test and CI results are recorded in the PR after completion; pending checks must not be reported as passed. Original mismatched counts/destinations in tests are updated to assert the new four-gallery/five-service-link contract. Native keyboard/swipe/focus coverage is preserved.

## Exact-head CI follow-up: fixture boundaries and bounded full matrix

The b3d1d672 revision passed Verify and Design but failed Connected. Reproduction established two independent fixture defects; no application behavior was removed to satisfy them.

- Services discovery added the actual ServiceCatalogGroups but its legacy fixture did not provide the catalog-hook boundary. The isolated unmodified bundle raised `No QueryClient set`; its missing combobox was a consequence. The producer now supplies explicit synthetic approved catalog data and rejects accidental inclusion of the real catalog hook. Existing dropdown/search/request-navigation/return checks remain; all 8 RU/EN ×375/390/430/1280 cases pass locally. Page errors now fail before the first element assertion, and optional output directories prevent cross-audit artifact collisions.
- The complete homepage matrix is 8 widths ×3 languages plus empty/error/loading: 27 cases. Local attempts under the unchanged 180-second aggregate cap reproduced the timeout, including after replacing arbitrary waits with explicit scroll readiness. The connected runner now schedules three independent language shards with distinct evidence directories, keeping its maximum of two simultaneous browsers and 180 seconds per fixture. EN includes all three state cases; RU/TH include every data width. A mandatory aggregate rejects missing, duplicate, wrong-language or incomplete-layout evidence. No locale, viewport, native mobile tap/swipe, keyboard, intention or route assertion was dropped. The standalone producer still supports the complete matrix.

The complete three-shard local run passed 27/27 in 137 seconds: RU 75.794s/8 cases, EN 82.070s/11, TH 60.944s/8. Runner contract tests passed 15/15, including negative completeness tests. Connected now has 24 fixture groups in place of 22 because the one homepage group is partitioned into three; this does not imply two newly covered business processes. Final remote exact-head checks must finish before readiness. All evidence remains synthetic and fallback-font; nothing was deployed or sent to a live guest/provider.
