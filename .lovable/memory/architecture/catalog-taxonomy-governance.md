---
name: Catalog Taxonomy Governance
description: Legacy lookup_type / category_groups DB taxonomy. Superseded by Catalog SSOT for cluster→category→service navigation. Still relevant for lookup_values typing.
type: reference
---

# Catalog Taxonomy Governance

**Status:** Partially superseded.
**For navigation taxonomy (clusters / categories / services), use
[Catalog SSOT](mem://architecture/catalog-taxonomy-ssot).**
This file documents the lower-level `lookup_values` / `category_groups` /
`categories` DB taxonomy and the `verticals.ts` registry, which are still
the source of truth for booking flows, vertical ids, and dropdowns.

## What changed (2026-04-24)

The high-level cluster→category→service catalog was unified into a single
source of truth at `src/lib/catalog/taxonomy.ts`. Six parallel catalogs
(`verticalGroups`, `clusterCatalog`, `appRegistry`, DB `category_groups`,
`life_situations`, canonical doc) were collapsed into:

- **6 canonical clusters** (`arrive`, `live`, `manage`, `invest`, `legal`, `build`)
- **18 canonical categories** (arrive=3 · live=10 · manage=0 · invest=1 · legal=3 · build=1), mapped via `categories.slug` → `clusterId`. `CategoryId` union ↔ `CATEGORIES[]` align 1-1.
- **~68 services** total, all `verticalId` refs resolve in `verticals.ts` (20 verticals)
- **`cluster_life_situations`** bridge table for the 17 life situations
- `verticalGroups.ts` and `nav/clusterCatalog.ts` are now thin adapters — never edit data there

Drift between Home grid, Footer, Discover, and Catalog page is fixed:
they all derive from the SSOT.

## Still authoritative here

- **`lookup_values` (51 lookup types)** — dropdowns, statuses, enums.
  Synced with `src/lib/taxonomies/index.ts`.
- **`verticals.ts`** — 20 vertical ids used by booking flows
  (`yacht`, `transfer`, `cleaning`, etc.). Service entries in the SSOT
  reference these via `verticalId`.
- **`useTaxonomyWithFallback.ts`** — `SERVICE_CATEGORY → HOME_SERVICE_CATEGORY`
  fallback for legacy lookups.

## Deprecated DB groupings

The old 6-group `category_groups` shape (`Home & Living`, `Transport`,
`Leisure & Activities`, `Health & Wellness`, `Life Admin`, `Home Maintenance`)
was reparented into the 6 canonical clusters via the 2026-04-24 migration.
Existing `categories` rows preserved their FK ids; only their `category_group_id`
moved. Deactivated groups (Water Sports, Other, Professional) and the
`kids-education` duplicate remain inactive.

## Rule

When adding a new service:

1. **Add it to `src/lib/catalog/taxonomy.ts` first** (cluster + category + service entry).
2. If it needs a vertical-specific booking flow, add it to `verticals.ts`
   and reference via `verticalId` in the SSOT.
3. If it needs a DB-backed dropdown enum, add it to `lookup_values` and
   register the `lookup_type` in `src/lib/taxonomies/index.ts`.

Do **not** add cluster/category/service navigation data anywhere else.
