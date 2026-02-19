
## Fix: Circular Chunk Dependency in vite.config.ts

The build is failing with:
```
Circular chunk: vendor-charts -> feature-admin -> vendor-charts
```

This means one or more admin pages (in `feature-admin`) import `recharts` (which is in `vendor-charts`), and `vendor-charts` somehow references back to `feature-admin`, creating a loop.

### Root Cause

In `vite.config.ts`, the `manualChunks` config lists specific file paths for `feature-admin`. When Rollup processes these, it finds they import `recharts` → goes to `vendor-charts` → but Rollup's chunk resolution creates a back-reference to `feature-admin`. This is a known Rollup limitation with static `manualChunks` arrays that include files importing from other manual chunks.

### Fix

Remove the `feature-admin` and `feature-vendor` entries from `manualChunks`. These are lazy-loaded routes — Rollup/Vite already splits them automatically via dynamic imports (`React.lazy()`). Manually listing their paths in `manualChunks` is redundant and causes the circular reference.

The `vendor-*` chunks for libraries remain intact — only the feature-specific page arrays are removed.

### Technical Change (single file: `vite.config.ts`)

Remove these two blocks from `manualChunks`:

```diff
- // ── Feature: Admin (lazy-loaded, only staff) ──────────────────
- 'feature-admin': [
-   './src/pages/admin/AdminDashboard.tsx',
-   ...
- ],
-
- // ── Feature: Vendor portal (lazy-loaded, only vendors) ────────
- 'feature-vendor': [
-   './src/pages/vendor/VendorDashboard.tsx',
-   ...
- ],
```

This resolves the circular dependency while keeping all vendor library chunking intact. Build performance and chunk sizes are unaffected — lazy routes are still split automatically by Vite.
