# Real-estate data domains (developer → project → unit)

_Last updated: 2026-08-20 · SSOT for real-estate table ownership_

Code mirror: `src/lib/real-estate/domains.ts`. SQL mirror: table/column `COMMENT`s.
When any of the three disagree, fix the code and the comments — not this doc.

## Levels

| Level | Table | Rows (2026-08-20) | Owns |
|---|---|---|---|
| 1 · Developer | `developers` | 126 | Company profile, verification, track record |
| 2 · Project | `property_projects` | 266 | Newbuild complex / villa development / off-plan phase, juristic person, unit mix, ClearView grade |
| 3 · Unit | `properties` | 33 | Public listing of a rentable/sellable unit |
| 3 · Unit | `project_units` | 55 | Sales inventory of a project unit (availability, holds, sold-to) |
| 3 · Unit | `resale_properties` | 3 | Secondary-market unit (asking price, assignment premium) |

## Links

```text
developers.id
   └── property_projects.developer_id        (266/266 linked)
         ├── properties.project_id           (nullable = standalone listing)
         ├── project_units.project_id        (55/55 linked)
         │     └── project_units.property_id → properties.id (same physical unit)
         └── resale_properties.development_id
```

## Rules

1. A unit never stores `developer_id`. Derive it through the project via
   `v_real_estate_domain_chain` or `useRealEstateDomainChain`.
2. `properties.project_id = null` is valid (single villa, private resale), but the
   unit must show up as "needs linking" in `/admin/properties`.
3. Deprecated duplicates — read-only, no new writers:
   - `property_complexes` (level 2) → use `property_projects`
   - `development_units` (level 3) → use `project_units`
4. New real-estate queries join through the canonical views, not ad-hoc joins.

## Views

- `v_real_estate_projects` — project → developer with resolved developer names.
- `v_real_estate_domain_chain` — every unit-level row with `unit_source`,
  `project_id`, `developer_id`, `is_linked_to_project`.

Both are `security_invoker = on`, so existing RLS applies unchanged.

## Admin surface

`/admin/properties` renders `RealEstateDomainHealthPanel`: table ownership map,
linkage coverage per unit table, and the list of units awaiting a project link.
