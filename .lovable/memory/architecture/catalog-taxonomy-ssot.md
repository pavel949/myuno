---
name: Catalog Taxonomy SSOT
description: src/lib/catalog/taxonomy.ts is SSOT for 6 clusters / 18 categories / ~68 services. verticalGroups.ts and clusterCatalog.ts are adapters — never edit data there.
type: feature
---

# Catalog SSOT

**File:** `src/lib/catalog/taxonomy.ts`

The single source of truth for cluster → category → service navigation across
Home grid, Discover, Footer, and Catalog pages. All other surfaces derive
from this file via thin adapters — no parallel data definitions allowed.

## Shape (audit 2026-05-27)

- **6 clusters** — `arrive`, `live`, `manage`, `invest`, `legal`, `build`
  (matches Master Taxonomy v1.0 Surfaces).
- **18 categories** — `CategoryId` union ↔ `CATEGORIES[]` align 1-1.
  Breakdown: arrive=3 · live=10 · manage=0 · invest=1 · legal=3 · build=1.
  *(manage=0 is intentional — operations live under `/operate/*`, not catalog.)*
- **~68 services** — all `verticalId` references resolve in
  `src/lib/taxonomies/verticals.ts` (20 vertical ids).

## Adapters (read-only consumers)

- `src/lib/nav/clusterCatalog.ts` — Home/Discover grid
- `src/lib/verticalGroups.ts` — Footer + legacy grouping
- `src/lib/taxonomies/index.ts` — central lookup hub (no name collisions
  with Master surfaces or JTBD clusters)

**Rule:** never hand-edit these files with cluster/category/service data.
Add to `catalog/taxonomy.ts` first; adapters auto-derive.

## Known drift (not a schema bug)

1. **DB ↔ static drift** — production `category_groups` / `categories` rows
   show `Arrive=14 · Live=27 · Invest=7 · Legal=7 · Build=4` vs SSOT
   `3/10/0/1/3/1`. Blind UPSERT is dangerous — needs a manual reconcile pass.
   Documented in the SSOT file header.
2. **JTBD tagging is sparse** — only codes `A`, `H`, `I` are used across
   services. Clusters B/C/D/E/F/G/J have no tags. Backlog, not a bug.
3. **Sports & Athletic Training** (spec §15, 14 services) — missing from
   both SSOT and DB. Known gap.

## When adding a new service

1. Add cluster + category + service entry to `src/lib/catalog/taxonomy.ts`.
2. If it needs a booking flow, register the vertical in `verticals.ts` and
   reference it via `verticalId`.
3. If it needs a DB dropdown enum, add it to `lookup_values` and register
   the type in `src/lib/taxonomies/index.ts`.

Never add cluster/category/service navigation data anywhere else.
