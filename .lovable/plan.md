## Goal

Close every remaining gap in the persona-landing + persona-tagged-discovery system identified across this conversation. The 26 personas, mapping, and core wiring are in place; this loop wires up the missing surfaces so a user can land on **any** persona page, click through to **any** catalog, and see **filtered** results (with graceful "show all" fallback).

## Audit summary — what's already done vs. what's still missing

| Area | Status |
|---|---|
| 26 persona configs (P1–P26) all `live` in `personaLandings.ts` | ✅ done |
| `/for/:persona` route + `PersonaLandingPage.tsx` rendering | ✅ done |
| `personaTagMap.ts` (listing + app vocabularies) covers all 26 | ✅ done |
| `slugAliases.ts` (vegan/halal/etc.) | ✅ done |
| `usePersonaFilter` hook + `PersonaFilterChip` component | ✅ done |
| `?persona=` propagation from PersonaLanding + ClusterLanding | ✅ done |
| `listings.persona_tags` column + GIN index + backfill | ✅ done |
| Catalog filtering: Restaurants, Services, Pets, Market, Property | ✅ done |
| **Sitemap missing `/for/conscious-eaters`** | ❌ gap |
| **No `/for` hub page** — users can't discover the 26 landings | ❌ gap |
| **Home-page surface** for persona landings (carousel/grid) | ❌ gap |
| **Catalog filter missing on**: Beauty/Spa, Fitness, Wellness, Cleaning, Transport, Yachts, Events, Flowers, Education, Pharmacy, Medical, Legal, Insurance, Babysitter, Delivery, Experiences, Classifieds, OffplanIndex, ResaleIndex, HotelsIndex, LandIndex, CommercialIndex, DevelopersIndex, InvestmentIndex | ❌ gap |
| **9 apps in `appRegistry.ts` with empty `personaTags: []`** | ❌ gap |

## Plan

### 1 · Sitemap (1 file)
- Append `/for/conscious-eaters` entry to `public/sitemap-landings.xml` (RU/EN/x-default hreflang, matching the existing template).
- Verify via `grep -c '<loc>' public/sitemap-landings.xml` → 27.

### 2 · Persona Directory hub at `/for` (3 files)
- **New page** `src/pages/landings/PersonaDirectoryPage.tsx`: grid of all 26 live personas grouped by intent (Travel · Settle · Invest · Operate · Lifestyle modifiers). Each card → `/for/:slug`, themed via `getPersonaTheme`. SEO tags + canonical `/for`.
- Register route `<Route path="/for" element={<PersonaDirectoryPage />} />` in `src/components/layout/AnimatedRoutes.tsx`.
- Append `/for` to `public/sitemap-landings.xml`.

### 3 · Home-page persona discovery surface (1 file)
- **New component** `src/components/home/PersonaDiscoveryStrip.tsx`: horizontally-scrollable strip showing 8 most-relevant personas (with "View all →" linking to `/for`). Uses `getPersonaTheme` for icon + accent, `withPersonaParam` for outbound links.
- Mount in `src/components/home/PersonaAwareSections.tsx` after the existing concierge section.

### 4 · Catalog persona-filter wiring (24 files)
Apply the proven 3-line pattern (`usePersonaFilter()` → `applyFilter` → `<PersonaFilterChip />`) to remaining catalogs. Each one filters against `tags`, `persona_tags`, `features`, `amenities`, or domain-specific arrays:

| Catalog | Filter source |
|---|---|
| BeautySpaIndex | `service_type`, `tags` |
| FitnessIndex | `categories`, `tags` |
| WellnessIndex | `tags`, `service_type` |
| CleaningIndex | `tags` |
| TransportIndex | `vehicle_type`, `tags` |
| YachtsIndex | `tags`, `features` |
| EventsIndex | `tags`, `category` |
| FlowersIndex | `occasion`, `tags` |
| EducationIndex | `categories`, `tags` |
| PharmacyIndex | `tags` |
| MedicalIndex | `specialties`, `tags` |
| LegalServicesIndex | `services`, `tags` |
| InsuranceIndex | `categories` |
| BabysitterIndex | `tags`, `languages` |
| DeliveryIndex | `tags` |
| ExperiencesIndex | `tags`, `category` |
| ClassifiedsIndex | `tags`, `category` |
| OffplanIndex / ResaleIndex / HotelsIndex / LandIndex / CommercialIndex / DevelopersIndex | `persona_tags`, `amenities`, `tags` |
| InvestmentIndex | `tags`, `vertical` |

For pages without a natural tag column: fall back to `applyFilter(items, () => [])` → graceful "no filter applied" state. Chip still renders so user sees "Filtered for: <persona> · Show all".

### 5 · App-registry `personaTags` backfill (1 file)
Open `src/lib/appRegistry.ts`, find the 9 apps with `personaTags: []`, and assign at least one tag from the canonical vocabulary (`tourist | nomad | family | couple | business | property_owner | relocation`). Use the app's vertical to infer.

### 6 · Verification
- `npm run lint` clean.
- `npx tsc --noEmit` clean.
- Manual route check:
  - `/for` renders 26 cards.
  - `/for/conscious-eaters?lang=en` resolves.
  - `/restaurants?persona=conscious-eaters` shows vegan/veg listings + chip.
  - `/yachts?persona=hnw` shows premium chip.
  - Sitemap count = 27.

## Out-of-scope (deferred)

- Translating the new directory page into all i18n keys beyond RU/EN (already bilingual via existing pattern).
- Filling listing tags for inventory that doesn't yet have any tags — that's a content-ops job, not code. Graceful fallback already handles it.
- Cluster-landing → catalog persona pass-through is already done.

After approval, I'll implement everything in one pass and run the build verification.