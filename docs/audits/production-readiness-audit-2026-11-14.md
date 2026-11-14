# Production-readiness audit — technical, functional, UX, UI

**Date:** 2026-11-14 · **Branch:** `claude/app-audit-production-jei0lj` · **Base:** `be1224b`
**Change class (PROJECT.md §20):** A — routine UI/accessibility/test fixes. No auth, RLS, schema, money, inventory or edge-function changes.

Audit docs are evidence, not normative authority (PROJECT.md §19).

## 1. Method and limits

| Layer | How it was checked |
|---|---|
| Types | `tsc -b --noEmit`, whole repository, single process |
| Unit / contract | `vitest run`, whole repository, with a local PostgreSQL 16 for the `*.postgres.test.ts` suites |
| Build | `npm run build` including every prebuild gate (fonts, design, service tags, catalogue map) |
| Lint | `eslint` on every changed file |
| UX / UI | Real app in headless Chromium, 23 public routes × RU 375px and EN 1280px, plus 320 / 600 / 768 / 900 / 1024 / 1440 spot checks; automated metrics (page overflow, mid-word breaks, landmarks, headings, titles, target sizes, unnamed controls) and screenshot review |

**Not covered — treat as UNKNOWN, not as passing:**

- The sandbox cannot reach the production Supabase project or `myuno.app`. The backend was stubbed in two modes: every request failing, and every read returning an empty list. **No real catalogue content, prices, photos or availability were seen.**
- Authenticated workspaces (owner, MC, vendor, admin, agent, investor) and every transactional flow (booking, checkout, payment, refund) were not exercised in a browser. Their server contracts are covered only by the existing test suites.
- Web fonts load from Google Fonts, which was blocked; screenshots used fallback fonts, so text widths are approximate. Layout fixes were given margin rather than tuned to the pixel.
- No Lighthouse, Safari/Firefox or real-device run.

## 2. Health gates

| Gate | Result |
|---|---|
| Repository-wide typecheck | **Pass** — exit 0, 2m37s. This closes the merge blocker recorded in `platform-cleanup-master-2026-11-14.md` ("a clean repository-wide TypeScript pass was not obtained"). |
| Unit suite at base | 4,543 passed, 2 failed, 8 suites not runnable (no `postgres` on `PATH`) |
| Postgres security suites | **Pass** — 13 files, 504 tests (RLS, order mutation, inventory, operating spaces, public projections) once `/usr/lib/postgresql/16/bin` is on `PATH` |
| Production build | **Pass** — exit 0, 2m18s |
| Design gate | **Pass** — 0 new/structural findings |
| Lint on changed files | 0 errors |

The two failures at base:

1. `navigationModel.test.ts › public business entry` — **pre-existing**. Commit `4956121` moved "For business" from the top menu into the header's "For partners" menu and left the test asserting the old layout. Test updated to the shipped contract.
2. `convergence-guard.test.ts` — introduced and fixed within this change (a `text-white` class on an edited line).

## 3. Findings fixed in this change

### P0 — desktop homepage: primary actions were clipped

The hero had a fixed height. After the four goal cards were added, they no longer fit: at 1280px only the top ~25px of the cards was visible ("Rent a…", "Experie…"), the rest sat under the overlapping search bar, and the "I own property" link was not visible at all. Confirmed on unmodified `be1224b`. The same clipping applied at tablet widths.

**Fix:** the hero grows with its content (`min-height` instead of `height`).

### P0 — Russian mobile UI: words chopped mid-word

Measured with a per-word line-box detector across 21 routes at 375px: 10 split words on 6 routes, all in primary navigation or primary actions.

| Where | Before | Cause | Fix |
|---|---|---|---|
| Home goal cards | "Купить недвижим·ость", "Впечатле·ния"; descriptions clamped to "На отпуск, несколь…" | 2 columns ≈ 90px of text; `overflow-wrap: anywhere` | 1 column on phones, 2×2 above; whole labels and full descriptions |
| Home goal cards, desktop | 8 split words at 1280–1440px | 4 columns inside a width-capped hero | 2×2 grid |
| `/property` intent tabs | "Аренд·а", "Покупк·а" | flex children allowed to shrink | `nowrap`, fluid gap, scroll instead of squeeze |
| `/search` popular categories | "Рестора·ны", "Недвижим·ость" | 2 columns with a 40px icon | 1 column below 420px, smaller icon |
| `/install` benefits | "Уведомлени·я" | 2 columns | 1 column below 420px |
| `/transport` sort control | "Рекомендуемы·е" | toolbar could not wrap | `nowrap`, wrapping toolbar |

A global hypothesis (`body { word-break: break-word }`) was tested and **rejected**: removing it changed nothing in the measurements, so it was reverted rather than shipped on a guess.

After: **0 split words** at 320 / 375 / 600 / 768 / 1024 / 1280 / 1440.

### P1 — homepage: three competing entry points

Within the first screen and a half the guest homepage offered: four goal cards plus "Not sure? We'll help you choose" → `/discover`; a full-width bar "What are you looking for? · Choose" → `/discover` (same destination, and in Russian the identical label "С чего начнём?" twice on one screen); and four plan links.

**Fix:** removed the duplicate bar and its component. Goal cards remain the single primary choice; plan links remain as tenancy shortcuts. This is a visible product change — see §5.

### P1 — 13 of 25 public routes shared one generic tab title

`/auth`, `/thai-services`, `/transport`, `/pricing`, `/how-it-works`, `/list-with-us`, `/support`, `/cart`, `/favorites`, `/search`, `/map`, `/restaurants`, `/install` and the 404 page were all titled "myUNO — Phuket Super-App for Foreigners". Tabs, history entries and screen readers could not tell them apart (WCAG 2.4.2), and the wording contradicts PROJECT.md §02 ("not a mini-app collection").

**Fix:** `RouteTitleFallback` titles any page that declares no title from its own H1. Explicit `SEOHead` titles still win, because React hoists a page's `<title>` ahead of the static one. No per-page edits; future pages are covered automatically. Also fixed: the **English** default meta description was Russian text.

### P1 — signed-out `/profile` rendered a blank page

The page returned `null` with the comment "Redirect handled by route guards", but the route has no guard. **Fix:** redirect to sign-in with a return path, using the existing `redirectToAuth` helper.

### P1 — landmarks

Guest home and `/pricing` had no `<main>`; `/discover` and `/list-with-us` had two nested ones; the guest home had no skip link. **Fix:** exactly one `<main>` on all 23 routes; skip link added to the home page.

### P2 — transport filter drawer

When closed on mobile the drawer was only translated off-screen, so nine filter controls stayed in the tab order and the accessibility tree. The close button had no accessible name and a 27px target; filter rows were 20px tall. **Fix:** closed drawer is `invisible`; named 44px close button; 44px rows.

### P2 — cookie banner

Covered ~27% of a 375×812 screen; a 44px-tall inline "Learn more" link stretched the paragraph's last line; title and body repeated each other. **Fix:** ~25% shorter, de-duplicated copy, normal inline link. Consent semantics unchanged.

### P2 — small items

- `VerticalContextBanner` dismiss button: hard-coded English `aria-label`, 24px target → localized, 44px.
- `/pricing` back link: 20px target → 44px.

## 4. Verified as working

- **Failed data is not shown as empty.** With the backend failing, `/discover/services` resolves to "The catalogue is temporarily unavailable — Try again" and `/property` to "Homes could not be loaded. Your search is kept." Neither shows a false zero.
- No page-level horizontal overflow on any audited route at any audited width.
- No images without `alt`, no leaked i18n keys, no uncaught page errors.
- RU and EN both render complete on all audited routes.

## 5. Decisions for the owner

1. **Homepage bar removal.** The "What are you looking for? · Choose" bar was added recently and is now removed as a duplicate. If it was intentional (for example as an SEO or A/B element), revert `src/pages/Landing.tsx` and `HomeSearchEntry.tsx`; the hero fix does not depend on it.
2. **Static `<title>` and Open Graph tags in `index.html`** still say "Phuket Super-App for Foreigners". Runtime titles are fixed, but link previews and non-JS crawlers read the static tags. Changing them is a positioning decision.
3. **`/auth` headline** reads "Everything for life in Phuket, in one app · 68+ services under one account", which also conflicts with PROJECT.md §02.

## 6. Open findings — not changed here

### P1

- **First-load JavaScript ≈ 650–700 kB gzipped.** Entry chunk 295 kB gz (1.02 MB raw) plus nine preloaded vendor chunks, including all of `lucide-react` (128 kB gz). The project's own landing budget is 150 kB. This needs a dedicated measurement tranche (entry-chunk composition, icon imports, eager providers, three i18n dictionaries totalling 200 kB source), not a blind refactor.
- **Fonts:** one render-blocking Google Fonts request for eight families, including JetBrains Mono, Unbounded and Golos Text, which the design system lists as retired or fallback-only. Third-party dependency on the critical path.
- **CSP** is delivered by `<meta>` with `script-src 'unsafe-inline' 'unsafe-eval'`; `frame-ancestors` is ignored in a meta tag (the browser logs this on every load). Move to response headers in `vercel.json` and drop `unsafe-eval` if the Maps loader allows it.
- **Real provider supply:** per `TODO.md`, 33 approved service rows map to 14 providers and none appears in `public_provider_catalog`. The services marketplace is therefore empty in production regardless of UI quality. Operational/RLS question — class C, not touched.
- **Earlier audit's open P1s remain:** query-error states in `DeveloperLeads` / `DeveloperProjects`, an explicit error prop for `UnifiedCatalogShell`, and 66 unmatched content hrefs.

### P2

- Two H1s on `/how-it-works`, `/invest`, `/install` (layout header title plus page title); no H1 on `/cart`, `/search`, `/map`.
- Desktop filter chips of 28–36px on `/thai-services`, `/experiences`, `/favorites`, `/search`, `/map`, `/restaurants` (acceptable for pointer; verify on touch laptops).
- `/property` with zero results says "Try changing filters · Reset filters" even when no filter is applied.
- Bottom tab bar highlights "Services" on `/discover`, which is the cross-domain goal hub.
- Dev-only: `public/version.json` is committed, so every local session shows an "Update available" prompt; `supabase/functions/mcp/index.ts` is regenerated with a different dependency version on every dev start and build, which makes accidental edge-function diffs likely.
- Dead CSS for `.home-search-entry*` (24 rules across three stylesheets) after the bar removal.
- ~690 `any` usages outside tests; 4,000 baseline design-token findings (tracked, not growing).
- **`CLAUDE.md` is stale** against the code and PROJECT.md v3.2.1: it states React 18 (code is 19.2), v3.55.5 "last sync 2026-06-21", 165 edge functions / 757 migrations (now 178 / 823), and frames the product as "59 micro-apps", which PROJECT.md §02 explicitly rejects. It is loaded as the instruction file for AI agents, so the drift actively misdirects them.

## 7. Files changed

- `src/styles/homepage-refinement.css`, `src/styles/property-search.css`
- `src/pages/Landing.tsx`, `Search.tsx`, `Install.tsx`, `Profile.tsx`, `PricingPage.tsx`, `transport/TransportIndex.tsx`, `discover/DiscoveryHubPage.tsx`
- `src/components/home/HomeSearchEntry.tsx`, `legal/CookieConsentBanner.tsx`, `listing-wizard/ListingWizard.tsx`, `transport/TransportFilterSidebar.tsx`, `vertical/VerticalContextBanner.tsx`, `seo/SEOHead.tsx`
- New: `src/components/seo/RouteTitleFallback.tsx` (+ test)
- `src/App.tsx`, `index.html` (marker attribute on the static `<title>` only)
- Tests: `navigationModel.test.ts`, `Landing.anonymous-home.test.tsx`, `Landing.motion.test.tsx`, `HomeSearchEntry.test.tsx`

## 8. Recommended next tranches

1. **Deploy and re-check live** — the earlier audit found production serving an older bundle than source; repeat this sweep against the real backend with real content.
2. **Authenticated walkthrough with a stubbed session** — owner, MC and vendor workspaces at 375 / 1280, same metrics.
3. **Performance tranche** — entry-chunk composition, icon strategy, font self-hosting; target ≤ 300 kB gz first load.
4. **Provider publication** — resolve why approved providers are absent from the public projection (class C: evidence → contract → tests).
5. **State-recovery batch** from the earlier audit (developer portal, catalogue shell error contract).
