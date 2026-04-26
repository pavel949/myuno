## Problem

In the **All Services** drawer (screenshots) categories with query-string sub-routes show all items as the same label:

- **Home & Living** → 12 entries all shown as "Home services" (should be Cleaning, Laundry, Handyman, Plumbing, Electrical, AC repair, Gardening, Pest control, Locksmith, Storage, Flowers, Services hub).
- **Tourism & Activities** → "Experiences / Tours / Water & activities" all shown as "Experiences".

The data in the SSOT (`src/lib/catalog/taxonomy.ts`) is correct — the **rendering** layer collapses them.

## Root cause

`src/lib/nav/clusterCatalog.ts` → `getClusterServiceLocalizedLabel()` calls `findAppEntryByServicePath(service.path)`, and that helper strips the query string from BOTH sides of the comparison:

```ts
function normalizeServicePath(p: string) {
  const q = p.indexOf('?');
  return q >= 0 ? p.slice(0, q) : p;
}
function findAppEntryByServicePath(path: string) {
  const base = normalizeServicePath(path);
  return Object.values(APP_REGISTRY).find(
    (e) => normalizeServicePath(e.route) === base   // ← bug
  );
}
```

So `/services?category=laundry`, `/services?category=handyman`, `/services?category=plumbing`, … all reduce to `/services` and match the umbrella `services` registry entry → every sub-service inherits its label ("Home services"). Same pattern collapses every `/experiences?type=…` into "Experiences".

This also affects the secondary localization triplet path (the `getAppEntryLabel` override masks the per-service `labelEn/Ru` that the SSOT provides).

## Fix

**1. Make path matching exact, with a safe fallback.**

In `src/lib/nav/clusterCatalog.ts`:

```ts
function findAppEntryByServicePath(path: string) {
  // Exact match first (preserves ?category=…, ?type=…)
  const exact = Object.values(APP_REGISTRY).find((e) => e.route === path);
  if (exact) return exact;

  // Fallback: base-path match ONLY when the incoming path has no query
  // (so the umbrella entry still wins for plain "/services" but never
  // for "/services?category=laundry").
  if (path.includes('?')) return undefined;
  return Object.values(APP_REGISTRY).find(
    (e) => normalizeServicePath(e.route) === path,
  );
}
```

This restores per-service labels from the SSOT (`labelRu`/`labelEn` already defined in `taxonomy.ts`) while keeping registry-driven labels for routes that genuinely match in `APP_REGISTRY`.

**2. Add a regression test** in `src/lib/nav/__tests__/clusterCatalog.test.ts` that asserts:
- Every service in `cat-home-living` resolves to a unique localized label (no duplicates).
- Every service in `cat-tourism` resolves to a unique label.
- Plain `/services` still resolves to the umbrella "Services hub / Home services" label.

**3. Tighten `cat-home-living` SSOT labels** so the drawer reads naturally even when the registry lookup is bypassed. The existing values are already specific (Cleaning / Laundry / Handyman / …) — just verify and keep.

## Verification

- Open the bottom **All Services** drawer on `/`, expand "Home & Living" → expect 12 distinct labels matching screenshots' intended content.
- Expand "Tourism & Activities" → expect Experiences, Tours, Water & activities, Yachts, Events.
- Run `bunx vitest run src/lib/nav` and `src/test/catalog/taxonomy-coverage.test.ts` — both green.
- Confirm Home grid and `/discover` are unaffected (they read directly from SSOT, not via the registry override).

## Out of scope (noted, will not change in this pass)

- The crammed `/me` tab strip in screenshot 4 is a separate cosmetic issue (7 pills inside a `flex gap-1 overflow-x-auto` row that visually collide on the 384 px viewport). Worth a follow-up to either (a) collapse the active pill to icon-only on `<sm`, or (b) add `min-w-max` to each NavLink so they always reserve their full width before scrolling. Flag it now, fix in a dedicated UX pass.

## Files touched

- `src/lib/nav/clusterCatalog.ts` — fix `findAppEntryByServicePath`.
- `src/lib/nav/__tests__/clusterCatalog.test.ts` — add label-uniqueness assertions.
