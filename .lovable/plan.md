# Persona system → full canonical alignment + persona-tagged discovery

## TL;DR

The system is **already very rich**: 25 persona landings exist (P1–P25, all `live`), the canonical type tree is in place, the modifier system covers halal/kosher/lgbtq/accessibility, and `/for/:slug` routes work end-to-end. The gaps are narrower than your message suggests — and one gap (vegan/dietary persona, broader cultural-religious diet coverage) **is real** and worth fixing now.

The other real gap is **persona-tagged discovery**: services/listings have a free-text `tags` column today (only 68 of 500 rows tagged, and tags are floral/event-themed, not persona-themed). When a user lands on `/for/halal` and clicks "Restaurants", the catalog **does not filter by `audience=halal`** — it shows everything. We add a persona-aware filter contract so click-throughs auto-apply the persona tag and gracefully fall back to "show all" when no tag is set.

I will **not** rewrite anything that already works. The persona registry, landing renderer, theme system, slug aliases, segmentation framework — all stay. We add what is missing and tag what is untagged.

---

## What already exists (leave as-is)

- **25 persona landings P1–P25** in `src/content/landings/personaLandings.ts`, all `status: 'live'`. Includes `halal` (P17), `lgbtq` (P18), `accessibility` (P19), `pet-owners` (P13), `medical` (P14), `weddings` (P15), `athletes` (P16), `retirees` (P20), `families` (P7), `digital-nomads` (P4) etc.
- **Canonical types** (`src/types/canonical.ts`): `PersonaCode` P1–P25, `LifecycleStage`, `HouseholdType`, `ClusterId`, modifier vocabulary.
- **Routing** `/for/:persona` (with legacy aliases via `slugAliases.ts`) and bilingual SEO via `LandingSeoHead`.
- **Theme system** `personaTheme.ts` — gradient/icon per persona.
- **Modifier UI** in onboarding step covering 10 modifiers (pet-owner, medical, halal, kosher, accessibility, lgbtq, athlete, wedding, family-young, family-school).
- **Detection engine** `detectPersona.ts` — rules-based fallback before the AI call.

## Gaps to close (this loop)

### Gap 1 · Missing persona: dietary/lifestyle eaters (vegan + extended diet vocabulary)
The canon §4 has 25 personas. Canon also lists `halal` and `kosher` modifiers but **does not have a top-level "vegan/plant-based" persona** even though Phuket has ~120 vegan/vegetarian restaurants and a real expat segment. The user explicitly asked for it.

**Fix** — add **P26 · Conscious Eaters** (vegan / vegetarian / plant-based / gluten-free travellers and residents). One canonical persona, multi-modifier inside (`vegan`, `vegetarian`, `gluten-free`). Slug: `conscious-eaters`. Aliases: `vegan`, `vegetarian`, `plant-based`, `gluten-free`.

This requires:
- Extending `PersonaCode` from `P1..P25` to `P1..P26`.
- Adding modifier `vegan` to `CanonicalModifier` (kosher/halal already exist).
- Adding a new entry to `PERSONA_LANDINGS` with full bilingual content (pains, services, FAQ, CTA) following the live template (mirror `halal`'s structure). Same for theme.
- Wiring aliases in `slugAliases.ts` (`vegan` → `conscious-eaters`, `vegetarian` → `conscious-eaters`, `plant-based` → `conscious-eaters`, `gluten-free` → `conscious-eaters`).
- Adding a `vegan` toggle to onboarding `ModifiersStep`.
- Updating the canon doc `01-segmentation-framework.md` §4.2 to add P26 row.

### Gap 2 · Persona-tagged discovery — apps don't filter by persona
Today `landing.services[i].href` points at `/restaurants`, `/services`, etc. None of these read a `?persona=` query param. Click-through experience is identical regardless of who you are.

**Fix** — establish a single, simple convention with two parts:

**a) URL contract.** Every persona-landing CTA href gets `?persona=<slug>` appended automatically by the renderer. Catalog pages read it. Standardising on `?persona=` (single key, kebab-case slug) keeps it discoverable and shareable.

**b) Filter behaviour.** Every catalog/index page that already uses `useSearchParams()` (Restaurants, Services, Property, Market, Events, Tours, Transport, Beauty, Education, Medical, Experiences) gets a tiny shared hook `usePersonaFilter()` that:
  - reads `searchParams.get('persona')`
  - if present, filters listings where `tags && tags.contains(personaSlug) OR tags && tags.contains(matched-modifier)` (e.g., `halal` persona → `halal`, `vegan` persona → `vegan` or `vegetarian` or `plant-based`)
  - if absent OR no listings match → returns the unfiltered set (graceful fallback you asked for: "if no tag, show all offers")
  - shows a small dismissable chip "Filtered for: ☪️ Halal — clear" so the user understands what's happening

The mapping persona-slug → tag-vocabulary lives in **one place**: `src/lib/landings/personaTagMap.ts` (new). Format:
```ts
export const PERSONA_TAGS: Record<string, string[]> = {
  halal:              ['halal', 'muslim-friendly', 'mosque-nearby'],
  'conscious-eaters': ['vegan', 'vegetarian', 'plant-based', 'gluten-free'],
  'pet-owners':       ['pet-friendly', 'pet'],
  families:           ['kids-friendly', 'family'],
  weddings:           ['wedding', 'celebration', 'romantic'],
  // …all 26 personas mapped
};
```

This is the single source of truth — touched here when we add a persona, never elsewhere.

### Gap 3 · Listings are 86% untagged
Only 68/500 listings have any tags, and existing tags are floral/event-themed, not persona-themed. Without tags, persona filters return empty sets and trigger the "show all" fallback every time — defeating the point.

**Fix** — two-pronged:
1. **Migration: add a `persona_tags text[]` column to `public.listings`** (additive, separate from free-text `tags`, so we don't pollute the existing tag vocabulary). Indexed with GIN.
2. **Backfill (one INSERT query, no AI required for v1)** — derive obvious persona tags from existing listing fields:
   - Restaurants with `cuisine='indian' OR features @> ARRAY['halal']` → tag `halal`
   - Restaurants with `cuisine='vegetarian' OR features @> ARRAY['vegan']` → tag `conscious-eaters`
   - Listings with `pet_friendly=true` → tag `pet-owners`
   - Properties with `bedrooms >= 3 AND amenities @> ARRAY['kids-pool']` → tag `families`
   - etc.
   
   The backfill is best-effort (rows we can't classify stay empty and benefit from the show-all fallback). Manual tagging UI is **out of scope** for this loop — vendors get a future ticket to self-tag from their dashboard.

### Gap 4 · Persona landing → app discovery surface
The persona landing pages list a few hand-picked services in `landing.services[]`. They do not show "all apps available filtered for you". Users have to know what to click.

**Fix** — add a single new section to `PersonaLandingView` rendered after `services[]`: **"All apps available for you"** — a 3-column grid pulled from `appRegistry.ts` (which already exists), filtered by `appsAvailableForPersona(slug)` using the same `PERSONA_TAGS` map. Each app card href gets `?persona=<slug>` appended. Empty state: "All apps are available — start anywhere" + grid of all apps.

---

## Implementation steps (in order)

1. **Canon + types**
   - `docs/canonical/01-segmentation-framework.md` — add P26 row in §4.2 with `modifier: vegan/vegetarian/plant-based/gluten-free`.
   - `src/types/canonical.ts` — extend `PersonaCode` to include `'P26'` and add to `PERSONA_CODES`.
   - `src/lib/segmentation/detectPersona.ts` — add `'vegan'` to `CanonicalModifier` and to `MODIFIER_OPTIONS`.

2. **New persona landing**
   - `src/content/landings/personaLandings.ts` — append `P26_CONSCIOUS_EATERS` (full bilingual content modelled on the `halal` entry).
   - `src/lib/landings/personaTheme.ts` — add theme for `conscious-eaters` (green palette, leaf icon).
   - `src/lib/landings/slugAliases.ts` — add the 4 aliases.
   - `src/components/onboarding/v2/ModifiersStep.tsx` — add `vegan: { en: 'Vegan / vegetarian', ru: 'Веган / вегетарианец', icon: '🌱' }` label.

3. **Persona-tag map + filter hook (single source of truth)**
   - New `src/lib/landings/personaTagMap.ts` — exports `PERSONA_TAGS` (covers all 26 personas) and helpers `getPersonaTags(slug)`, `getAppsForPersona(slug)`.
   - New `src/hooks/usePersonaFilter.ts` — reads `?persona=` from URL, returns `{ personaSlug, personaTags, applyFilter<T>(items, getTags), clearFilter() }`. Includes the empty-set fallback.
   - New `src/components/landings/PersonaFilterChip.tsx` — the dismissable "Filtered for X" chip rendered at the top of each filtered catalog.

4. **Renderer wiring**
   - `src/pages/landings/PersonaLandingPage.tsx` — automatically suffix every `service.href` with `?persona=<slug>` (use a small helper so it doesn't double-append if the href already has a query string).
   - Add new "All apps for you" section pulling from `appRegistry.ts` + `getAppsForPersona`.

5. **Catalog wiring (the discovery half)**
   - Wire `usePersonaFilter()` into the existing `useSearchParams`-using pages: Restaurants, Services, Market, Property, Events, Tours, Transport, Beauty, Education, Medical, Experiences. Each: 1–3 lines of code (compose the filter into the existing query, render the chip).

6. **Database — additive migration**
   - `ALTER TABLE public.listings ADD COLUMN persona_tags text[] DEFAULT '{}'::text[];`
   - `CREATE INDEX idx_listings_persona_tags ON public.listings USING GIN(persona_tags);`
   - Backfill via a single SQL `UPDATE` deriving from existing fields (cuisine, features, amenities, category). RLS unchanged (`persona_tags` inherits the existing listings policy).
   - One-shot SQL — no Edge Function, no AI call.

7. **Tests**
   - Extend `personaLandings.test.ts` so the inventory check expects 26 personas.
   - New unit tests for `usePersonaFilter` (with-tag, no-match → fallback, no-param → passthrough).
   - New test for the alias resolver covering `vegan` → `conscious-eaters`.

## What does NOT change

- No new top-level routes (canon §13.1) — `/for/:slug` already exists.
- No new shells, no new layouts.
- The 25 existing persona landings are untouched.
- The `tags` free-text column on `listings` is untouched (existing taxonomy preserved).
- The cluster system (A..J landings) is untouched — out of scope.
- No AI calls added — backfill is deterministic SQL.
- No new edge functions.

## Open question (one)

The 10 cluster landings (A..J — Arrival/Extension/Settlement/…) currently don't propagate persona either. Should I add the same `?persona=` pass-through to cluster landings in this loop, or leave it as a follow-up? **Default if you don't answer: leave it for a follow-up** — clusters serve a different mental model (lifecycle, not identity), and the most concrete win is on persona pages where the user has just self-identified.
