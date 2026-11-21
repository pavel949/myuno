# Project source link and diff preview (offline only)

Baseline: `pavel949/myuno@6112f01033159464d87ba2113c96424cd0011a4b`.
This slice is a library and synthetic tests, not a new source store, job,
authorisation boundary, admin screen, parser, migration or live scheduler.

## Data and trust boundaries

1. Resolve the exact existing `property_projects.id` and its assigned developer
   from an operator-authorised read. A project/developer mismatch is review-only.
   Preserve the existing source shape `developerId + projectId + sourceId`
   and `SOURCE_TYPES`. Treat `property_projects.offplan_catalog` as existing
   provenance, not evidence of a deployed permanent source/job table.
2. Validate a candidate link against the hosts reviewed for that project. Accept
   only HTTPS, an explicit path, and no userinfo/query/hash/non-default port.
   This is a deliberately narrow offline input policy. Canonical links requiring
   a query, credentials, URL aliases, or unreviewed hosts need explicit operator
   review outside this path. Do not log or publish Drive/Telegram links or IDs.
   Host admission alone is not project association or right to read, reuse or
   publish materials. A preview must additionally match the full link, exact
   source ID, project, developer and type in the supplied trusted operator input.
   The existing approval metadata comes from that input, not the candidate.
3. Supply only a reviewed parser's local immutable snapshot and the existing
   versioned sales-unit baseline, never a public browser payload. Bind source ID,
   project ID, revision and parser version and carry the parser-supplied content
   SHA-256. This wrapper validates hash format only; it does not read raw bytes
   or authenticate a parser attestation. A future adapter must hash bytes and
   produce the receipt before building this input. Existing staging separately
   hashes parsed rows for its batch identity.
4. Feed `price_availability` into the existing `stageImport` engine. No
   other source type is silently treated as a price feed. Project+unit linkage,
   exact physical identity, explicit price units and the existing review
   thresholds remain authoritative. Omitted units are counted, not marked sold;
   missing or failed snapshots preserve last-known-good. There is no apply
   function. The result is a **private**, reduced diff (no URL, raw error,
   source revision ID, physical ID or owner data).
5. Submit `format: 'purchase-offer-preview-v1'` only for explicitly mapped
   multi-tenure input. The same staging module accepts the existing canonical
   project-unit bridges and prior offer observations. A stable offer key and
   explicit tenure distinguish quotes on one physical unit. Availability of
   the unit is an observation, separate from a missing or explicitly
   not-offered ownership option. Promotional prices need their own validity.
   No new registry, fake unit IDs, destructive stock change or DB apply.

## Manual and scheduled semantics

Both paths pass the same admitted snapshot through the same pure function.
`scheduled_preview` returns `not_due` when its supplied UTC due date is later
than its supplied clock. This is a deterministic due check, not a cron
installation, job lease, cadence, retry queue or source download. No process
wakes, fetches, writes, sends notifications, publishes or changes inventory.

To connect later: first verify persistent operator bindings, provider read
rights, and the existing deployment's job surface. Admit the exact actor,
project, source and reviewed adapter; keep fetched assets outside committed
artifacts. Reuse the same preview with bounded per-source cadence, a
single-flight lease/receipt per exact revision/hash, stale warnings and
operational visibility. Keep manual approval separate from preview; a schedule
must never publish or change inventory. Before release, exercise rollback and
race tests against a non-production contract, not a Lovable preview that shares
live data. No production readiness is claimed.

Run:
`node --test scripts/lib/offplan-source-preview.test.mjs scripts/lib/offplan-staging.test.mjs scripts/lib/offplan-purchase-offer-preview.test.mjs`
