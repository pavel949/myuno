# Newbuild Drive source versioning — 2026-11-13

## Scope

Extends the existing `property_projects` / `project_units` catalogue and `project_drive_sources` / `drive_import_jobs` review flow. No parallel public catalogue, business-data seed, notification, frontend publication, scheduler or hold/payment activation.

## Contract

- Missing, empty or unrecognized source status becomes `unknown` and `needs_review`; neither AI nor the browser may substitute `available`.
- Unknown rows are not preselected. A reviewer may deliberately apply `unknown`, which remains unknown in both canonical unit status columns.
- Every normalized row retains its Drive file ID, name, modified time and link. Project/unit assertions retain proposed and raw source values, extraction method and review decision.
- A completed extraction creates a private immutable price-list snapshot linked to its source job and predecessor in the same project+source stream. Snapshots are evidence, not guest inventory.
- Diffs compare immutable snapshots. `removed_from_source` means only “not observed in this version”; it never deletes a unit or marks it sold.
- Apply/discard is admin-only, actor-bound, pending-state checked and transactional. Project fields are allowlisted. Canonical unit matching uses project + normalized unit code; ambiguous/duplicate identities fail instead of duplicating or overwriting arbitrary rows.
- Applying an exact existing code updates only reviewed commercial/catalogue fields and preserves physical/property/CRM/hold relations. Null source values do not erase last-known-good values. Missing status is the explicit exception: deliberate approval writes `unknown`.
- Public presentation restrictions remain unchanged. Archive rows and assertions are private and have no anon access.

## Isolated verification

Synthetic normalization and diff tests run without backend access. Six PostgreSQL tests execute the exact applied function contracts in a temporary local database, including unknown-status admission, admin authorization, field allowlisting, replay rejection and non-deletion of missing rows. Live migrations and function ACLs are checked by catalog reads only; no hosted import, review application or canonical business write is executed in this tranche.

## Rollback / activation boundary

`docs/hardening/rollback/0036_newbuild_source_versioning.sql` revokes the new mutation RPCs without deleting evidence. Reverting the frontend/Edge Function restores the previous entrypoints; archive tables remain private and retained. Existing production projects, units, prices, documents and statuses are not backfilled or rewritten.

Hosted apply and a real Drive import remain NO-GO until separately authorized operational acceptance with supplied source material. No real source sync is triggered here.
