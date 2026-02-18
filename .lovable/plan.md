
# Comprehensive Application Quality Improvement Plan

## Audit Summary: What Needs to Be Fixed

Based on the full code audit, here are the 6 confirmed problems with clear priority:

---

## Priority 1 — Dead Code Removal (Low Effort, High Impact)

**26+ unused components** in `src/components/home/` that are never imported by any page or active component. These slow down the build, confuse developers, and add maintenance overhead.

Files confirmed as dead (no import found in pages or active components):
- `CategoryGroupsSection.tsx`
- `ContentModeToggle.tsx`
- `ContentPreviewRibbon.tsx`
- `DiscoveryCarousel.tsx`
- `DocumentExpiryWidget.tsx`
- `ExperiencesSection.tsx`
- `HomeCategoryRibbon.tsx`
- `HomeExploreSections.tsx`
- `HomeFeaturedProperties.tsx`
- `InvestorPromoCard.tsx`
- `KnowledgeHubBanner.tsx`
- `LifeOSFocusBar.tsx`
- `LifeSituationSelector.tsx`
- `ListWithUsBanner.tsx`
- `MarketplacePromoCarousel.tsx`
- `MorningDigest.tsx`
- `PersonaChips.tsx`
- `PersonaSelector.tsx`
- `PersonaSelectorBlock.tsx`
- `PopularServicesRow.tsx`
- `PromoBanner.tsx`
- `QuickStatsRibbon.tsx` (only used by `SmartWidget.tsx` which itself is dead)
- `RecommendedCarousel.tsx`
- `SafetyBanner.tsx`
- `SmartWidget.tsx`
- `ToursSection.tsx`
- `WaterSection.tsx`

**Action:** Delete all 27 files above.

---

## Priority 2 — Breakpoint Grey Zone Fix (Low Effort, High Impact)

**The problem:** `use-mobile.tsx` treats anything `< 768px` as mobile. `use-desktop.ts` treats anything `≥ 1024px` as desktop. Tablets (768–1023px) fall into a grey zone where `isMobile = false` and `isDesktop = false` simultaneously — causing UI logic to silently fail.

**Current state:**
```text
0–767px    → isMobile=true,  isDesktop=false  ✓
768–1023px → isMobile=false, isDesktop=false  ✗ (GREY ZONE)
1024px+    → isMobile=false, isDesktop=true   ✓
```

**Fix:** Merge into a single `useBreakpoint()` hook that returns a clear `'mobile' | 'tablet' | 'desktop'` value, and also export `isMobile` and `isDesktop` convenience booleans with no overlap:
- `isMobile` = width < 768px
- `isDesktop` = width ≥ 768px (eliminates the grey zone entirely — tablet joins desktop)

This matches how `AppLayout.tsx` and `AppHeader.tsx` actually behave on tablets today.

---

## Priority 3 — HeroBlock: 3 Queries → 1 Combined Query (Medium Effort, Medium Impact)

**The problem:** `HeroBlock.tsx` fires 3 separate database queries sequentially/in parallel:
1. `profiles` → name/avatar
2. `get_or_create_loyalty_status` RPC → tier name, cashback
3. `orders` count → activity streak

This causes 3 network round-trips on every home page load for logged-in users.

**Fix:** Create a single `useHeroData(userId)` hook that runs all 3 queries in true parallel using `Promise.all`, or consolidates profile + loyalty into one RPC call. The streak query (order count) remains separate since it hits a different table, but both fire simultaneously.

Result: Reduces hero load time from 3 sequential/parallel waterfall calls to 2 truly parallel calls.

---

## Priority 4 — Remove `Math.random()` from `useHomePageData` (Low Effort, Medium Impact)

**The problem:** In `useHomePageData.ts` line 209:
```ts
const shuffledOthers = [...otherItems].sort(() => Math.random() - 0.5);
```

`Math.random()` is called on every render, which:
- Defeats memoization (the array reference always changes)
- Causes unnecessary re-renders downstream
- Creates unstable UI (content jumps between renders)

**Fix:** Replace with a deterministic sort based on `rating` descending, or use a seeded shuffle based on the current date (stable per day). This makes `useMemo` actually effective.

---

## Priority 5 — `LifecycleSmartTip`: Fix Permanently Dismissed Tips (Low Effort, Medium Impact)

**The problem:** When all tips in a category are dismissed (via the X button), `localStorage` stores them permanently — they never re-appear even if the user's situation changes and the tip becomes relevant again.

**Fix:** 
- Store dismissed tips with a TTL timestamp (expire after 14 days)
- On load, filter out expired dismissals before saving back to `localStorage`
- This means tips rotate back naturally without manual clearing

---

## Priority 6 — `useHomePageData` Hook: Mark as Unused / Remove (Low Effort, Low Impact)

**The problem:** `useHomePageData.ts` fetches tours, properties, events, water activities for home page personalization — but no active component calls it. `HomeProductsSection` uses `useMarketplaceProducts` directly, and `QuickSolutionsGallery` uses static data.

**Fix:** Delete `useHomePageData.ts` and `useOptimizedRecommendations` export. This eliminates 4 unnecessary background API calls that fire silently on the home page if the hook is used anywhere transitionally.

**Verification first:** Confirm with a search that no page/component imports it before deletion.

---

## Implementation Order

```text
Step 1 — Delete 27 dead components         (~5 min, zero risk)
Step 2 — Delete useHomePageData.ts         (~2 min, verify first)
Step 3 — Fix breakpoint grey zone          (~15 min, update 2 hook files)
Step 4 — Fix Math.random() in hook         (~5 min, 1 file edit)
Step 5 — Fix SmartTip TTL dismissal        (~10 min, 1 file edit)
Step 6 — Consolidate HeroBlock queries     (~20 min, refactor 1 file)
```

Total estimated time: ~1 hour of implementation.

---

## Files to Be Modified/Deleted

| File | Action |
|---|---|
| `src/components/home/` (27 files) | Delete |
| `src/hooks/useHomePageData.ts` | Delete |
| `src/hooks/use-mobile.tsx` | Update |
| `src/hooks/use-desktop.ts` | Replace with unified hook |
| `src/hooks/useBreakpoint.ts` | Create (new) |
| `src/components/home/LifecycleSmartTip.tsx` | Update TTL logic |
| `src/hooks/useHomePageData.ts` | Delete |
| `src/components/home/HeroBlock.tsx` | Consolidate 3 queries |

---

## What Will NOT Change

- All currently visible UI on the home page remains identical
- No routes, navigation, or user-facing behavior is altered
- `QuickActionsGrid`, `QuickSolutionsGallery`, `HeroBlock` visual output stays the same
- All existing component APIs are backward-compatible
