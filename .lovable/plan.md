

## Design Audit — Developer & Newbuilds Client-Facing Pages

### Scope (10 public pages + 1 layout + 3 cards)

**A. Property Hub catalog (Light theme, AppLayout):**
- `/property/offplan` — `OffplanIndex.tsx`
- `/property/offplan/:id` — `OffplanDetail.tsx`
- `/property/developers` — `DevelopersIndex.tsx`
- `/property/developers/:id` — `DeveloperDetail.tsx`

**B. Newbuilds tools (Dark Luxury Editorial, NewbuildsLayout):**
- `/newbuilds` — `NewbuildsLanding.tsx`
- `/newbuilds/map` — `NewbuildsMap.tsx`
- `/newbuilds/compare` — `NewbuildsCompare.tsx`
- `/newbuilds/areas`, `/newbuilds/areas/:slug`
- `/newbuilds/calculator`
- `/newbuilds/due-diligence`

**C. Cards/components:** `CatalogProjectCard`, `NbProjectCard`, `NewbuildProjectDeepTabs`, `ClearViewReport`

---

### Critical findings

**1. Two parallel design systems for the same product (HIGH)**
- `/property/offplan` uses **myUNO Light** (DM Sans, mint primary, AppLayout, BottomNav).
- `/newbuilds/*` uses **Dark Luxury Editorial** (Playfair, gold #C9A84C, dark bg).
- `NewbuildsLayout` defaults to `nb-theme--light` (per memory: "unified Property Hub theme") — but every child page (`NewbuildsLanding`, `Calculator`, `Areas`, `DueDiligence`, `Compare`) hardcodes **dark gold colors** via inline `style={{ color: 'hsl(var(--nb-gold))' }}` and `nb-blueprint nb-grain` backgrounds. Result: gold text on near-white cream → **WCAG AA contrast fails** in many spots.
- The shared "Catalog" tab in NewbuildsLayout sends users to `/property/offplan` (Light theme) — visual whiplash.

**2. Hardcoded colors everywhere (HIGH — brand book violation)**
Brand book mandates semantic tokens only. Found 80+ `style={{ color: 'hsl(var(--nb-...))' }}` and raw hex/rgba (`#22c55e`, `rgba(22,163,74,0.15)`, `#eab308`, `#ef4444`) in:
- `CatalogProjectCard.tsx` (REC_COLORS, formatPrice block)
- `NewbuildsLanding.tsx` (hero, tool cards — every color inline)
- `NewbuildsCalculator/Areas/DueDiligence/Compare` (every heading + label)
- `OffplanIndex.tsx` (`text-success`, `bg-accent-amber`)

These should map to `--primary`, `--success`, `--warning`, `--destructive`, `--muted-foreground` tokens.

**3. Typography mismatch with brand book (MEDIUM)**
- Brand book: **DM Sans (body) + Space Grotesk (display)**; Newbuilds memory: **Cormorant Garamond / Playfair Display**.
- `newbuilds-theme.css` declares `Playfair Display` for `--font-display-nb`, but `index.html` is unverified to load it. Falls back to Georgia serif.
- `OffplanIndex` and `DevelopersIndex` use `font-bold text-xl` headings without `font-display` class → renders in DM Sans, breaking display hierarchy.

**4. Emojis & exclamation in UI text (brand book violation)**
- ⭐ used as a star indicator in `DevelopersIndex` line 106, `DeveloperDetail` line 157, `OffplanIndex` filter buttons. Brand book: "Никаких эмодзи в UI". Should be `<Star fill />` from Lucide (already imported elsewhere).
- `DevelopersIndex` "I'm a developer — list my company" uses em-dash, OK; no exclamation issues found here.

**5. Navigation & layout inconsistency (MEDIUM)**
- `OffplanIndex` / `DevelopersIndex` / `OffplanDetail` / `DeveloperDetail` use `AppLayout` (gets BottomNav, global header, ecosystem container).
- `NewbuildsLanding` and tool pages use `NewbuildsLayout` only — **no BottomNav, no global nav, no Back button** on top-level. Users get lost.
- `NewbuildsLayout` sticky tab bar duplicates "Каталог" → links out to AppLayout page → user loses the newbuilds nav. No "back to /newbuilds" affordance once they leave.
- `OffplanDetail` uses `BackButton` (good); `DeveloperDetail` uses `BackButton` (good); `NewbuildsCalculator/Areas/DueDiligence` use a custom inline `<Link><ChevronLeft/></Link>` — three different back patterns.

**6. Hero patterns are 3 different designs**
- `OffplanIndex` hero: `bg-gradient-to-br from-primary/10 via-background to-accent/5 rounded-2xl border` (Light, soft).
- `DevelopersIndex` hero: same gradient pattern (consistent with OffplanIndex ✓).
- `NewbuildsLanding` hero: gold pill + centered text + gold CTA on dark surface.
- `NewbuildsCalculator/Areas/DueDiligence`: `nb-blueprint nb-grain` blueprint pattern with giant `nb-display text-5xl` gold title.

No single hero pattern.

**7. CatalogProjectCard vs OffplanProjectCard fork (MEDIUM)**
Two cards rendering nearly the same data:
- `CatalogProjectCard` (newbuilds-themed, dark gold borders, used in `NewbuildsLanding`/featured strips).
- `OffplanProjectCard` (used in `OffplanIndex`, `DeveloperDetail`).
Different price formatting (`฿2.5M` vs full formatPrice from currency context), different badges, different tag systems.

**8. Loading & empty states inconsistent**
- `OffplanIndex`/`DevelopersIndex`/`OffplanDetail`/`DeveloperDetail`: `<Skeleton>` ✓
- `NewbuildsLanding`: literal "…" placeholder for stats (same anti-pattern fixed earlier on home).
- Empty states: `DevelopersIndex` has Building2 icon + text ✓; `NewbuildsCompare` shows "Нет проектов для сравнения" with serif heading. Different visual language.

**9. Accessibility gaps**
- `DevelopersIndex` row uses `<div onClick>` with no `role="button"`, no `tabIndex`, no `onKeyDown` — non-keyboard accessible (same issue we fixed on PropertyTourBanner).
- `NewbuildsLanding` tool cards: `<Link>` ✓ (OK).
- Colored tag pills (REC BUY/WATCH/AVOID) rely on color alone — add icon or text prefix.
- Missing `aria-label` on icon-only contact links in `DeveloperDetail` (Phone, Mail, Globe).

**10. Mobile-first issues at 339px viewport**
- `NewbuildsLayout` sticky nav has 7 tabs in horizontal scroll — usable but no scroll hint.
- `OffplanIndex` filter rows: 2 horizontal scrollers stacked + Filters Sheet trigger = visually noisy.
- `DeveloperDetail` cover height `h-32` + logo `-mt-12` overlap works but logo can clip at smallest sizes.
- `NewbuildsLanding` hero `text-2xl md:text-3xl` is fine, but `pt-20` on tool pages wastes vertical space on mobile.

---

### Recommendations (priority order)

**P0 — Decide theme strategy (1 decision blocks everything else)**
Pick one:
- (a) **Unify on Light Property Hub theme** — kill the dark luxury surfaces in `/newbuilds/*`, keep gold as an accent token only. Aligns with brand book ("Caregiver × Architect", warm cream).
- (b) **Keep dark luxury for `/newbuilds`** — but then `NewbuildsLayout` must NOT default to `nb-theme--light`, and "Каталог" tab must stay inside the dark theme (build a dark variant of OffplanIndex or reroute).

**P0 — Replace all hardcoded colors with semantic tokens**
- Map gold accents to `--primary` (or new `--accent-luxury` token).
- Replace REC colors with `--success / --warning / --destructive`.
- Remove inline `style={{ color: 'hsl(var(--nb-...))' }}` everywhere; use Tailwind utility classes bound to tokens.

**P0 — Replace ⭐ emojis with `<Star />` Lucide icons** (3 files).

**P1 — Unify card component** — Promote `OffplanProjectCard` as the single card, support a `variant="luxury"` for newbuilds context if needed.

**P1 — Single hero template** — Build `<NewbuildsHero title icon stat actions />` shared between Landing, Calculator, Areas, Due Diligence, Compare, OffplanIndex, DevelopersIndex.

**P1 — Single back-nav pattern** — `<BackButton />` everywhere; remove ad-hoc ChevronLeft links.

**P1 — Add BottomNav to /newbuilds tool pages** — or make NewbuildsLayout wrap an AppLayout shell (children-first composition).

**P2 — A11y pass**
- `DevelopersIndex` rows → `role="button" tabIndex={0} onKeyDown` + `focus-visible:ring`.
- Add `aria-label` to icon-only contact links.
- Add text prefix to REC pills (already there ✓ — keep).

**P2 — Loading state cleanup** — Replace "…" placeholders in `NewbuildsLanding` stats with `<Skeleton className="h-4 w-12 inline-block" />`.

**P2 — Mobile polish**
- Reduce hero `pt-20 pb-12` to `pt-8 pb-6 md:pt-20 md:pb-12` on tool pages.
- Add fade-mask at the right edge of NewbuildsLayout sticky tab scroller.

---

### Suggested implementation order (if approved)

1. **Token consolidation** — add `--accent-luxury` (gold) and `--accent-luxury-foreground` to `tokens.css`; rewrite `newbuilds-theme.css` to reference shared tokens, not duplicate `--nb-*`.
2. **Theme decision applied** — assume (a) unify light, with luxury accent — repaint NewbuildsLanding/Calculator/Areas/DueDiligence/Compare using `bg-card`, `text-foreground`, `text-muted-foreground`, `text-primary`, removing inline gold styles.
3. **Star emojis → Lucide** in 3 files.
4. **Shared `<NewbuildsHero />` + `<NewbuildsBack />`** — replace 5 ad-hoc heroes and 5 back links.
5. **Promote OffplanProjectCard** as canonical; deprecate CatalogProjectCard or reduce to thin wrapper.
6. **A11y: DevelopersIndex rows + DeveloperDetail contact links.**
7. **Loading polish in NewbuildsLanding.**
8. **Visual QA at 339px and 1280px.**

Estimated scope: ~12 files edited, ~600 lines changed, no DB or routing changes.

