

# Design System Consistency Audit

## Summary of Issues Found

The codebase has a well-defined DS2.0 foundation but suffers from **inconsistent application** across pages. Below are the specific violations grouped by category.

---

## 1. Two Competing Header Patterns

**Problem**: Mini-apps use two different header components with completely different visual styles:

- **`CatalogHeader`** (19 pages) — Dark navy gradient (`from-[hsl(222_47%_11%)]`), white text, hardcoded HSL colors
- **`UnifiedHeader`** (7 pages via `MiniAppLayout`) — Light `bg-background/95` with backdrop blur, semantic tokens

**Affected pages using CatalogHeader**: Flowers, Restaurants, Beauty, Cleaning, Events, Pets, Pharmacy, Education, Classifieds, and more.

**Affected pages using MiniAppLayout/UnifiedHeader**: Discover, Market, Experiences, Investment, and more.

**Fix**: Standardize all mini-apps to use one header pattern. `UnifiedHeader` is the DS2.0-compliant choice (semantic tokens, no hardcoded colors). Refactor `CatalogHeader` pages to use `MiniAppLayout` or deprecate `CatalogHeader`.

---

## 2. Hardcoded Colors (188 files, 2136 matches)

**Violations of "no hardcoded colors" rule**:

| Pattern | Count | Examples |
|---------|-------|---------|
| `text-white` | ~500+ | CatalogHeader, hero sections, badges, buttons |
| `bg-[#hex]` | ~50 | SupportFAB (`bg-[#25D366]`, `bg-[#0088cc]`) |
| `bg-green-500` | ~30 | ClinicDetail, GTrustPage, status indicators |
| `bg-blue-500` | ~20 | GTrustPage, trust levels |
| `bg-emerald-600` | ~5 | InvestmentIndex hero |
| `bg-amber-500` | ~10 | Timeline, status indicators |
| `text-green-800` | ~5 | TicketDetail resolution |

**Fix**: Replace with semantic tokens (`text-success`, `bg-success`, `bg-info`, `text-primary-foreground`, etc.). Brand-specific colors (WhatsApp green, Telegram blue) are acceptable exceptions.

---

## 3. Non-standard Shadows (70 files, 479 matches)

**DS2.0 rule**: Use only `[box-shadow:var(--shadow-elevation-N)]` tokens.

**Violations**:
- `shadow-sm` / `shadow-md` / `shadow-lg` / `shadow-xl` used in 70 files
- `shadow-2xl` on UnifiedHeader search results dropdown
- `shadow-lg shadow-primary/20` on landing page CTAs

**Fix**: Replace all Tailwind shadow utilities with elevation tokens. Map: `shadow-sm` → `elevation-1`, `shadow-md` → `elevation-2`, `shadow-lg` → `elevation-3`, `shadow-xl` → `elevation-4`.

---

## 4. Border Radius Inconsistency

**DS2.0 rule**: Interactive cards use `rounded-xl` (16px), not `rounded-2xl`.

**Violations**: 710 matches of `rounded-2xl`/`rounded-3xl` across 69 files, many on interactive cards and form sections (booking forms, education forms, medical forms all use `rounded-2xl` on clickable/interactive containers).

**Fix**: Audit and downgrade interactive containers from `rounded-2xl` → `rounded-xl`. Keep `rounded-2xl` only for hero/display cards per DS2.0 spec.

---

## 5. Font Usage Inconsistencies

**Mostly correct**: `font-display` (Space Grotesk) used on headings across 51 files. However:

- Some headings use only `font-bold` without `font-display` (relying on global CSS `h1-h6` rules, which is fine)
- `UnifiedSectionHeader` uses `text-lg font-bold` without `font-display` — this is OK since global h2 style applies
- `CatalogHeader` title uses `text-lg font-bold` with `text-white` — hardcoded color, no `font-display`

**Minor issue**: The `MiniAppHero` title uses `text-sm font-medium` which is too small for a hero component title.

---

## 6. Spacing Inconsistencies

**Content padding varies across layout patterns**:

| Component | Padding |
|-----------|---------|
| `PageContainer` | `p-4 md:p-6 lg:p-8 xl:p-10` |
| `MiniAppLayout` content | `px-4 md:px-6 lg:px-8` |
| `CatalogHeader` pages | Manual `px-4` per page |

Content spacing within pages: `space-y-4 md:space-y-6` (MiniAppLayout) vs `space-y-5 md:space-y-6` (PageContainer) — minor but inconsistent.

---

## 7. Form Section Styling

Booking/form pages (Education, Medical, Experience) use raw divs with `bg-card rounded-2xl border p-5` instead of the DS2.0 `Surface` component or `Card` component.

**Fix**: Replace with `<Surface variant="card" padding="md">` or `<Card>` for consistency.

---

## Recommended Fix Priority

| Priority | Area | Impact | Effort |
|----------|------|--------|--------|
| **P1** | Unify header pattern (CatalogHeader → MiniAppLayout) | High — visual consistency across all verticals | Medium (19 pages) |
| **P1** | Replace hardcoded colors with semantic tokens | High — dark mode breakage, brand consistency | High (188 files) |
| **P2** | Replace Tailwind shadows with elevation tokens | Medium — visual hierarchy | Medium (70 files) |
| **P2** | Fix rounded-2xl on interactive cards | Medium — DS2.0 compliance | Low-Medium |
| **P3** | Standardize form sections with Surface/Card | Low — cosmetic consistency | Low |
| **P3** | Normalize content spacing | Low — minor inconsistency | Low |

---

## Proposed Implementation Approach

Given the scale (188+ files with hardcoded colors), I recommend a **phased approach**:

1. **Phase 1**: Unify all mini-app headers by migrating CatalogHeader pages to MiniAppLayout (highest visual impact, 19 pages)
2. **Phase 2**: Fix hardcoded colors in the most-visible pages first (landing, discover, detail pages)
3. **Phase 3**: Shadow and radius cleanup pass

Shall I proceed with Phase 1 (header unification)?

