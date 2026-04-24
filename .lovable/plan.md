# Persist filters on `/property/browse`

Make the catalog state (`mode`, `tenancy`, `categories`, `UniversalFilter` values) survive reloads, deep links, and back-navigation. Sharing the URL must reproduce the exact filtered view.

## What persists

- `mode` — `rent` | `buy` (already partially in URL)
- `tenancy` — `short` | `long` (already partially in URL)
- `cats` — selected category icon ribbon ids (comma-joined)
- `f.<sectionId>` — every active key from `UniversalFilter` `FilterValues` (arrays joined with `,`, single strings as-is, empty/null entries omitted)

## Source-of-truth precedence

1. **URL** (`useSearchParams`) — primary, makes links shareable.
2. **localStorage** key `myuno:propertyBrowse:filters:v1` — fallback only when the user lands on `/property/browse` with NO relevant query params (clean entry from menu / external nav).
3. **Defaults** — `mode=rent`, `tenancy=short`, no categories, no filters.

A shared link always wins over local storage. Opening the page from a clean URL restores the user's last session.

## Behavior

- On mount in `PropertyIndex`:
  - Read URL params first. If none of the persisted keys are present, hydrate from `localStorage` and write them back into the URL via `setSearchParams(..., { replace: true })` so the displayed URL stays a faithful share link.
  - Initialize `propertyMode`, `selectedCategories`, `filterValues` from the merged source.
- On any change to `propertyMode`, `selectedCategories`, or `filterValues`:
  - Serialize → write to URL with `setSearchParams(next, { replace: true })` (no history spam).
  - Mirror the same serialized object to `localStorage` (debounced via simple `useEffect`, no extra deps).
- The existing "Сбросить / Clear" button clears categories + filter values AND removes all `cats` / `f.*` params from the URL and from localStorage. `mode` and `tenancy` are preserved (they are tab state, owned by `PropertyHubTabs`).
- `useEffect` that already reacts to `searchParamsUrl` for `mode` is kept; we extend it to also re-sync `selectedCategories` and `filterValues` when the URL changes externally (e.g. user pastes a new shared link, browser back/forward).

## Files to edit

- `src/pages/property/PropertyIndex.tsx` — wire up the hydration, URL-sync, and localStorage logic.
- `src/lib/propertyBrowseFilters.ts` (new, ~80 LOC) — small pure helpers:
  - `serializeFilters(filterValues, categories): Record<string,string>`
  - `parseFiltersFromParams(searchParams): { filterValues, categories, hasAny }`
  - `LS_KEY = 'myuno:propertyBrowse:filters:v1'`
  - `loadFromStorage()`, `saveToStorage(payload)` with try/catch.

No changes needed to `UniversalFilter`, `AirbnbCategoryRibbon`, `PropertyHubTabs`, or routing.

## Edge cases handled

- Quota / disabled storage → wrapped in try/catch, silently ignored.
- Stale storage with keys no longer present in `filterConfig` → ignored at render (UniversalFilter only renders configured sections), and pruned the next time the user changes filters.
- Legacy bookmarks like `/property/browse?mode=rent&tenancy=short` keep working — the new params are additive.
- SSR / first paint: no flicker because hydration runs synchronously in `useState` initializers.

## Manual QA checklist

1. Apply 2 categories + 2 filter sections → URL updates with `cats=…&f.bedrooms=…`.
2. Copy URL, open in incognito → same filtered view renders.
3. Reload page on `/property/browse` after applying filters → state restored.
4. Open `/property/browse` from the menu (clean URL) after step 1 → last filters reapplied from localStorage and reflected in the URL.
5. Click "Сбросить" → `cats` and `f.*` params disappear, localStorage cleared, `mode`/`tenancy` preserved.
6. Browser back/forward across two filter states → UI follows the URL.
