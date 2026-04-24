

# Area Landings — `/area/:slug`

## Scope

Public, indexable area-guide hub at `/area/:slug` for the 10 Phuket districts already defined in `src/lib/config/phuketAreas.ts`. Each page shows the area profile, a seeded list of active listings (rentals + offplan), search shortcuts into existing catalogs, and contextual links back to the persona/cluster landings most relevant to that area. Index page at `/area`.

Note: a similar concept exists at `/newbuilds/areas/:slug` but it's scoped to the editorial "Newbuilds" theme and only shows offplan projects. The new `/area/*` is the universal, marketing-grade public funnel under the standard `AppLayout` shell, cross-linking ALL relevant content (rentals, offplan, persona, cluster, services).

## What we build

### 1. Data layer — `src/content/landings/areaLandings.ts`
Augments existing `PHUKET_AREAS` with landing-specific metadata (no DB change):
- `relatedPersonaSlugs: string[]` — chosen from `LIVE_PERSONA_SLUGS` based on `popular_for` tags (e.g. `family` → `families`, `expat` → `ru-expats`, `luxury` → `hnw`, `value` → `passive-investors`, `tourism` → `tourists`)
- `relatedClusterSlugs: string[]` — typically `arrival`, `settlement`, `lifestyle`, `investment`
- `seo: { metaTitle, metaDescription, ogImage, canonicalPath, hreflangAlternates }` (bilingual)
- `heroImage?: string` — placeholder using existing OG default
- Helper `getAreaLandingBySlug(slug)` and `LIVE_AREA_SLUGS` constant

### 2. Hooks for seeded listings — reuse, no new hooks
- Rentals: `useProperties({ district })` already supports filter by district (verified via `surfaceFromProperty`)
- Offplan: `useOffplanProjects()` filter by `district` client-side
- Display via existing `surfaceFromOffplanProject` / `surfaceFromProperty` → `UnifiedListingSurface` cards (consistent with the rest of the catalog)

### 3. Pages
- **`src/pages/area/AreaLandingPage.tsx`** — `/area/:slug`
  - Hero: name (RU/EN), description, 4 stat tiles (price/m², yield, distance to airport, beach)
  - "Ищете жильё в {area}?" — 2 search CTAs that deep-link to `/property/browse?district={slug}` and `/property/offplan?district={slug}`
  - Up to 6 rental listings (live), up to 6 offplan projects (live), each as `Link` cards
  - Pros / Cons grid (from existing data)
  - **Cross-links section** — "Подходит для:" with chips → live persona landings, "Жизненные сценарии:" → live cluster landings (filtered by `LIVE_PERSONA_SLUGS` / `LIVE_CLUSTER_SLUGS` so we never link to a 404)
  - Nearby areas (3 closest)
  - `LandingSeoHead`-equivalent: reuse existing `<SEOHead>` with `Place` + `BreadcrumbList` schema (mirrors `NewbuildsAreaDetail` pattern)
  - Renders `<NotFound />` for unknown slug
- **`src/pages/area/AreaIndexPage.tsx`** — `/area` index grid of all 10 areas (links to each detail), bilingual

### 4. Routing
- Add to `src/lib/config/routes.ts`:
  ```
  AREA_INDEX: '/area',
  AREA_DETAIL: (slug: string) => `/area/${slug}`,
  ```
- Register in `src/components/layout/pageRegistry.ts` (lazy)
- Add 2 routes in `src/components/layout/AnimatedRoutes.tsx` near the persona/cluster landing routes

### 5. SEO & sitemap
- Update `public/sitemap-landings.xml`: append `<!-- Area landings (10 live) -->` block with all 10 area URLs + RU/EN hreflang
- `<title>` template: `«{Имя} — район Пхукета · myUNO»` (≤60 chars per canon)
- Meta description includes price/m², yield, headline pros (formula in §2.4 of `10-semantic-core.md`)
- Schema: `Place` + `BreadcrumbList` + `ItemList` of nearby listings

### 6. Tests (vitest)
`src/content/landings/__tests__/areaLandings.test.ts`:
- Every area in `PHUKET_AREAS` has matching landing config
- Every `relatedPersonaSlugs` entry is in `LIVE_PERSONA_SLUGS`
- Every `relatedClusterSlugs` entry is in `LIVE_CLUSTER_SLUGS`
- `LIVE_AREA_SLUGS` = 10 (all areas live by default since data is complete)
- Slugs are kebab-case, ASCII

## What we do NOT build

- New tables or migrations (all data is static + existing catalog tables)
- Per-area editorial articles (separate `pillar` content, out of scope)
- Mapbox/Google Map embed on the area page (link to `/property/map?district={slug}` instead — keeps initial JS small)
- New design tokens (use semantic tokens + `AppLayout`, no Newbuilds dark theme)

## Persona/cluster mapping (concrete)

| Area | popular_for | Personas linked | Clusters linked |
|---|---|---|---|
| bang-tao | luxury, family, golf, expat | hnw, families, ru-expats | investment, settlement, lifestyle |
| laguna | luxury, golf, resort | hnw, passive-investors | investment, lifestyle |
| kamala | family, quiet, value | families, passive-investors, ru-expats | settlement, lifestyle |
| surin | luxury, villa, sunset | hnw | investment, lifestyle |
| layan | nature, quiet, emerging | passive-investors, hnw | investment, lifestyle |
| nai-harn | expat, value, beach | ru-expats, retirees, snowbirds | settlement, lifestyle |
| rawai | expat, value, local | ru-expats, retirees, digital-nomads | settlement, lifestyle |
| cherngtalay | family, value, school | families, passive-investors | settlement, investment |
| kata | tourism, rental, surf | tourists, passive-investors | arrival, lifestyle |
| phuket-town | culture, budget, local | digital-nomads, ru-expats | settlement, arrival |

(All mapped slugs verified live in `LIVE_PERSONA_SLUGS`/`LIVE_CLUSTER_SLUGS`.)

## Files touched

Created (4):
- `src/content/landings/areaLandings.ts`
- `src/content/landings/__tests__/areaLandings.test.ts`
- `src/pages/area/AreaLandingPage.tsx`
- `src/pages/area/AreaIndexPage.tsx`

Edited (4):
- `src/lib/config/routes.ts` — add `AREA_INDEX`, `AREA_DETAIL`
- `src/components/layout/pageRegistry.ts` — 2 lazy exports
- `src/components/layout/AnimatedRoutes.tsx` — 2 routes
- `public/sitemap-landings.xml` — add 10 URLs

## Acceptance

1. `/area` → grid of 10 areas
2. `/area/bang-tao` (and other 9) → 200 with full content, listings, cross-links
3. `/area/unknown-slug` → 404 (NotFound component)
4. Every cross-link chip resolves to a live page (no 404 from area pages)
5. `npx tsc --noEmit` clean; vitest green
6. `sitemap-landings.xml` includes all 10 area URLs with hreflang
7. Mobile 375px renders without horizontal scroll

Implementation time: single sprint, ~1 hour.

