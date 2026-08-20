# Unit table consolidation — migration plan

Status: in progress · Owner: platform · Last updated: 2026-08-20

## Goal

One canonical unit table (`project_units`) and one canonical project table
(`real_estate_projects` view over `investment_projects` / `developments`).
`property_complexes` and `development_units` are deprecated duplicates and must
disappear from application code before they are dropped in the database.

Canonical chain (see `src/lib/real-estate/domains.ts`):

```text
LEVEL 1 · DEVELOPER   developers
LEVEL 2 · PROJECT     investment_projects / developments  (v_real_estate_projects)
LEVEL 3 · UNIT        properties (listing) · project_units (sales inventory)
```

## Current data volumes (2026-08-20)

| table                | rows | verdict                          |
| -------------------- | ---- | -------------------------------- |
| `project_units`      | 55   | canonical                        |
| `development_units`  | 5    | deprecated — backfill then drop  |
| `property_complexes` | 2    | deprecated — fold into projects  |
| `properties`         | 33   | canonical (listing level)        |

Volumes are tiny, so the migration is a data backfill, not a long dual-write
programme.

## Runtime switch

Kill-switch flag in `system_settings`: `feature_flag:legacy_unit_tables`.

- **off (default)** — code reads only `project_units`; legacy fallbacks are skipped.
- **on** — legacy `development_units` fallback is re-enabled (rollback path only).

Read it via `useLegacyUnitTablesEnabled()` (`src/lib/real-estate/unitSourceFlag.ts`).
Toggle it in Admin → Properties → "Real-estate data structure" panel.
Because `system_settings` is admin-read only, non-admin sessions resolve the flag
to `false`, i.e. canonical-only — which is the desired end state.

## Phases

1. **Observe (done).** Admin panel shows unit→project coverage and orphans.
2. **Switch (done).** Flag added, default off → `useProjectUnits` no longer
   falls back to `development_units` unless the flag is turned on.
3. **Backfill.** Copy the 5 `development_units` rows into `project_units`
   (`development_id` → `project_id`, `name` → `unit_code`, keep price/area/beds),
   and fold the 2 `property_complexes` rows into project records; store
   complex-only fields (CAM fee, juristic contacts) on the project row.
4. **Deactivate in code.** Remove `useDevelopmentUnits` and
   `usePropertyComplexes`; point `OwnerProperties` at the project level.
   Keep `domains.ts` entries marked `deprecated` for one release so the admin
   panel keeps reporting residual rows.
5. **Drop.** Once coverage shows `development_units` = 0 and
   `property_complexes` = 0 for two weeks, drop both tables plus their views and
   remove them from `REAL_ESTATE_DOMAIN_TABLES`.

## Rules while migrating

- No new code may read or write `property_complexes` / `development_units`.
- Every write goes to `project_units` with a non-null `project_id`.
- The developer is always derived through the project, never stored on the unit.
