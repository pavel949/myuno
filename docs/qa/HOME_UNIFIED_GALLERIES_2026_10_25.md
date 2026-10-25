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
