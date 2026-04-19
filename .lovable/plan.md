

## Plan: Commercial Real Estate & Land Plots — Persona-Gated Section

### Goal
Add a new section "Коммерческая недвижимость и земельные участки" inside the Property Hub (`/property`) that becomes visible only when the user has selected the **Business** (`business`) or **Investor** (`investor`) persona. It supports both rent and sale, with card structures purpose-built for commercial assets (offices, warehouses, retail/F&B units, hotels, land plots, etc.).

### Why a separate section (not just new property_type values)
Today `properties.property_type` only contains residential values (apartment / studio / condo / villa) and the Property Hub tabs (Nightly / Long-term / Buy / New Build / Resale / My) are residential-centric. Commercial buyers care about completely different fields (yield, NOI, lease term remaining, cap rate, zoning, frontage, Chanote, FAR, road access, electricity load). A dedicated zone with its own card and detail layout is the right architectural choice — and it cleanly mirrors the existing pattern of `InvestmentBusinessZone` under the Investment Hub.

---

### 1. Data model (new migration)

Add to `public.properties` (no schema split — keep SSOT per memory `architecture/property/unified-pms-and-discovery-standard`):

- `asset_class text` — new high-level discriminator: `'residential' | 'commercial' | 'land'` (default `'residential'` for all existing rows).
- Extend `property_type` allowed values via app code only (DB stays text):
  - Commercial: `office`, `retail`, `warehouse`, `restaurant_space`, `hotel_building`, `mixed_use`, `medical_clinic`, `coworking`, `showroom`.
  - Land: `land_residential`, `land_commercial`, `land_agricultural`, `land_beachfront`.
- New nullable commercial/land columns (all optional, JSON-friendly):
  - `floor_area_sqm numeric`, `land_size_rai numeric`, `land_size_sqm numeric`
  - `frontage_m numeric`, `road_access text`
  - `zoning text`, `title_deed_type text` (Chanote / Nor Sor 3 Gor / etc.)
  - `electricity_load_kw numeric`, `water_supply text`
  - `current_lease_term_months int`, `lease_remaining_months int`, `monthly_rent_thb numeric`
  - `noi_annual_thb numeric`, `cap_rate_pct numeric`, `yield_pct numeric`
  - `existing_tenant_anonymized boolean default false`
  - `permitted_uses text[]` (e.g. `{F&B, retail, office}`)
  - `building_condition text`, `year_built int` (already exists if present — reuse)
- Indexes: `(asset_class)`, `(asset_class, listing_type)`, GIN on `permitted_uses`.
- RLS: inherit existing properties policies (no change).

### 2. Routes (extend `APP_ROUTES`)

```
COMMERCIAL:        '/property/commercial'
COMMERCIAL_BROWSE: '/property/commercial/browse'   // ?intent=rent|sale&type=office|warehouse|...
COMMERCIAL_DETAIL: (id) => `/property/commercial/${id}`
LAND:              '/property/land'
LAND_BROWSE:       '/property/land/browse'         // ?intent=rent|sale&type=residential|commercial|...
LAND_DETAIL:       (id) => `/property/land/${id}`
```

Both routes reuse `PropertyHub` shell (Outlet) so navigation stays consistent.

### 3. Persona-aware tab visibility

Extend `PropertyHubTabs` (`src/pages/property/PropertyHub.tsx`):
- Add two new tab configs: `commercial` (icon `Briefcase`) and `land` (icon `Trees`/`Map`).
- Add `personaGated?: UserPersona[]` to `TabConfig`.
- In `PropertyHub`, read `personas` from `useUserPersonas()` and filter:
  ```ts
  const showCapitalTabs = personas.some(p => p === 'business' || p === 'investor');
  const visibleTabs = TABS.filter(t =>
    (!t.authOnly || user) &&
    (!t.personaGated || t.personaGated.some(p => personas.includes(p)))
  );
  ```
- Tabs render in horizontal scroll strip (no layout break on mobile).
- When persona is **not** business/investor, the tabs are simply hidden (URL still works for shared links).

Reflect the same gating on the `/property` landing page (`PropertyIndex` / `PropertyLanding`) by adding a "Commercial & Land" hero card that appears only for those personas, plus an inline hint: "Видно, потому что выбрана роль Бизнес / Инвестор".

### 4. Card structure (`CommercialPropertyCard`)

A new card component in `src/components/property/commercial/`:

```text
┌─ cover image (16:9, badge top-left: "Office" / "Аренда" / "Sale") ─┐
│  Verified ✓ chip (top-right if developer_verified)                  │
├──────────────────────────────────────────────────────────────────────┤
│ Title (RU/EN) · District                                             │
│ ฿ 180,000 / month  ·  $5,200 USD                                     │
│ — or —                                                               │
│ ฿ 45,000,000  ·  Cap rate 6.8%  ·  NOI ฿3.06M/yr                    │
├──────────────────────────────────────────────────────────────────────┤
│ 🏢 320 m² · 🏬 Floor 2 · 🚗 12 parking · ⚡ 60 kW                    │
│ Permitted: F&B · Retail   ·   Lease left: 3 yrs                      │
│ Title: Chanote                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

Mode-aware spec rendering (reuses `propertyTypeConfig.ts` pattern):
- **Office / Coworking:** floor, total floors, ceiling height, AC type, fiber.
- **Warehouse / Logistics:** clear height, dock doors, floor load (kg/m²), truck access.
- **Retail / Restaurant:** frontage, foot-traffic zone, exhaust hood ready, grease trap, prior tenant type.
- **Hotel / Mixed-use:** rooms count, F&B units, license status.

`LandPlotCard` (separate component): cover, **rai/ngan/wah** breakdown, zoning, title type, road frontage, utilities reachable (Yes/No chips), aerial map preview.

All cards expose 3 primary CTAs: **View details · Request viewing · Save**.

### 5. Browse page (`CommercialBrowsePage`, `LandBrowsePage`)

Reuse `PropertySearchPage` skeleton but with commercial-specific filters:
- Intent toggle: Rent ↔ Sale (mirrors residential)
- Type chips: Office / Retail / Warehouse / Restaurant / Hotel / Mixed-use
- Sliders: area (m²), price, cap rate, lease term remaining
- Toggles: chanote only, with current tenant, ready-to-operate
- Land page swaps these for: rai range, zoning multi-select, title type, sea/road frontage, utilities present.

Sort: relevance, price asc/desc, cap rate desc, area desc, newest.

### 6. Detail page (`CommercialPropertyDetail`)

Sections:
1. Hero gallery + intent badge + key numbers strip (Price / Cap rate / NOI / Area).
2. Investment Snapshot (yield, payback, current rent, lease term left, anonymized tenant info if `existing_tenant_anonymized`).
3. Specs (type-aware, see card section).
4. Title & Compliance (deed type, zoning, permitted uses, building license).
5. Location map + nearby (Google Maps standard).
6. Documents (lease abstract, title deed teaser — gated for verified investors via existing `commercial_terms_redacted` flag already on properties table).
7. CTAs: Request viewing → creates lead in CRM (source `commercial_inquiry`), Request financials → ships NDA via existing AI Legal Agent flow (memory `features/crm/legal-and-financial-terms`).

### 7. Hooks & adapters

- `src/hooks/useCommercialProperties.ts` — `asset_class IN ('commercial')`.
- `src/hooks/useLandPlots.ts` — `asset_class = 'land'`.
- `src/hooks/useCommercialProperty.ts` (single).
- Extend `src/lib/real-estate/listingViewModel.ts` with `surfaceFromCommercial()` returning `kind: 'commercial_listing'` or `'land_listing'`, intent `'sale' | 'rent'`.
- Add taxonomy entries to `src/lib/taxonomies/index.ts` (canonical SSOT).

### 8. Cross-linking with Investment Hub

In `InvestmentBusinessZone` add a banner: "Looking for a venue / land for your business? → Browse commercial RE", deep-linking to `/property/commercial?intent=rent`.
In `InvestmentRealEstateZone` add a card: "High-yield commercial assets" → `/property/commercial?intent=sale`.

### 9. Persona discovery flow (UX)

If a user lands directly on `/property/commercial` without business/investor persona:
- Show inline persona prompt: "Включить роль 'Бизнес' или 'Инвестор', чтобы видеть эти разделы в навигации?" with one-click toggle (uses existing `useUserPersonas().togglePersona`).
- Content still renders — gating only affects tab visibility, not URL access (good for SEO and shared links).

### 10. Files to create / modify

**Create:**
- `supabase/migrations/<ts>_property_commercial_land.sql`
- `src/components/property/commercial/CommercialPropertyCard.tsx`
- `src/components/property/commercial/LandPlotCard.tsx`
- `src/components/property/commercial/CommercialFilters.tsx`
- `src/components/property/commercial/LandFilters.tsx`
- `src/pages/property/CommercialIndex.tsx`
- `src/pages/property/CommercialBrowsePage.tsx`
- `src/pages/property/CommercialDetail.tsx`
- `src/pages/property/LandIndex.tsx`
- `src/pages/property/LandBrowsePage.tsx`
- `src/pages/property/LandDetail.tsx`
- `src/hooks/useCommercialProperties.ts`
- `src/hooks/useLandPlots.ts`

**Modify:**
- `src/lib/config/routes.ts` — add `COMMERCIAL*` and `LAND*` routes.
- `src/pages/property/PropertyHub.tsx` — add 2 persona-gated tabs + `useUserPersonas` filter.
- `src/pages/property/PropertyIndex.tsx` / `PropertyLanding.tsx` — persona-gated promo card.
- `src/AnimatedRoutes.tsx` (or wherever routes are wired) — register new routes.
- `src/lib/real-estate/listingViewModel.ts` — extend kinds.
- `src/lib/taxonomies/index.ts` — add commercial/land taxonomies.
- `src/lib/propertyTypeConfig.ts` — add type-aware labels for commercial/land.
- `src/i18n/*` — RU/EN strings.
- `src/lib/appVersion.ts` → `3.41.0`.

### 11. Phasing

- **Phase 1 (this PR):** Migration + routes + tab gating + Commercial browse list + card + minimal detail page (read-only). Land scaffolded with empty state.
- **Phase 2:** Land browse + detail, advanced filters, financial gating with NDA flow.
- **Phase 3:** Lead → CRM → Capital advisory pipeline integration, anonymized tenant disclosure rules, document vault.

### 12. Open questions (please confirm before Phase 1)

| # | Question | Default if no answer |
|---|----------|----------------------|
| 1 | Should commercial listings appear in the global `/map` and `/search`? | Yes, with new pin colors (gold for commercial, brown for land). |
| 2 | Anonymous browsing OK or auth-gated for sale prices > ฿20M? | Open browsing; only **financials/lease docs** gated. |
| 3 | Allow MC owners to publish commercial properties in `/mc/properties/new`? | Yes — extend the property-create wizard with `asset_class` step. |
| 4 | Pricing display currency? | THB primary, USD secondary (matches existing `useCurrency`). |

