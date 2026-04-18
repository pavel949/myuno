# myUNO — Feasibility Assessment

> **Verdict.** Feasible. Foundations exist. This is consolidation, not rebuild.
> **Pair document.** `docs/ARCHITECTURE_V2.md`.

---

## 01 · What already exists (ground truth)

✅ **Role system** — `app_role` ENUM (16 values), `ROLE_METADATA` EN/RU, `SWITCHABLE_ROLES`, self-activation flags.
✅ **Vertical registry** — `src/lib/verticals.ts` with 40+ entries as single source of truth.
✅ **Route registry** — `APP_ROUTES` in `src/lib/config/routes.ts`, `LEGACY_REDIRECTS`, lazy loading via `pageRegistry`.
✅ **Supabase + RLS** — public schema, RPC (`record_ledger_entries`, `process_payout`), 60+ edge functions, Deno 2.0 in flight.
✅ **MiniAppLayout** — every vertical already uses one shell wrapper.
✅ **Design tokens** — `src/styles/tokens.css` is SoT; Golos + DM Sans + JetBrains Mono; dark+light modes; shadcn/ui primitives.

⚠️ **Partial:** AI agents (specs in `.lovable/` but no unified runtime registry), event bus (specs exist, no typed app-level bus).

❌ **Missing:** role-stack semantics (primary + weighted secondaries), cluster IA, `/operate` consolidation, Investor surface.

---

## 02 · Your 7 roles, mapped to existing code

| Your role | app_role value(s) | Primary clusters | Primary surfaces | Status |
|---|---|---|---|---|
| Tourist | `user` + `tourist` | Arrive · Live | Home · Discover · Wallet | **Ready** |
| Property owner | `owner` + `property_manager` | Manage · Invest | Home · Operate/owner · Wallet | **~80%** |
| Resident | `user` + `resident` | Live · Legal | Home · Wallet · Me | **Ready** |
| Real-estate company | `partner` (new `company_type=agent`) | Invest · Manage | Operate/agent · Wallet | **Needs shell** |
| Local business | `vendor` + `partner` | Live · Manage | Operate/provider · Wallet | **~70%** |
| Investor | `investor` *(exists, unwired)* | Invest | Operate/invest · Discover | **Greenfield** |
| RE developer | `partner` (new `company_type=developer`) | Build · Invest | Operate/dev | **Portal exists** |

**Key observation.** Six of seven roles already have code, tables, and screens. Only Investor is true greenfield.

---

## 03 · Blueprint fit per pillar

| Pillar | Today | Fit | Work to close |
|---|:-:|---|---|
| 6 surfaces | ~11 shells | 55% | Collapse 5 portals into `/operate/*`. Keep `MiniAppLayout` for `/app/*`. |
| 6 clusters | Verticals exist, no cluster field | 30% | Add `cluster` to `VerticalDefinition`. Tag all entries. Lock colours. |
| Role stack | Flat array + single active | 40% | Add `roles_stack` + `primary_role` to `profiles`. Update AuthContext. |
| `/app/:cluster/:vertical` | Flat `/property`, `/yachts`, `/beauty`… | 45% | Nested routes alongside. 90-day redirect window. |
| Event bus | DB ledger + ad-hoc hooks | 35% | Typed app-level emitter. Registry. Subscribers. |
| Agent registry | Specs in `.lovable/`, no runtime | 40% | Runtime registry with `listensTo`/`produces`. |
| Canonical data model | 75% match | 75% | Add `Company` entity + `company_type` enum. |
| Trust-in-UI | Footer, `/docs` | 25% | Inline licence + audit markers on money screens. |

---

## 04 · Concrete code-level gaps

### Gap 01 · DB: Role stack & primary role
Add `profiles.roles_stack jsonb default '[]'::jsonb` and `profiles.primary_role app_role`. Migrate from existing `user_roles` join. RLS policies must read the stack.
Touches: `supabase/migrations`, `src/types/auth.ts`, `AuthContext`.

### Gap 02 · DB: Company entity + company_type enum
Promote Agency, Developer, Provider, MC from ad-hoc rows to formal `companies` table with `company_type` enum. Add `company_members` join so one Person can be "agent at A + owner of B".
Touches: new tables, RLS rewrite, Odoo CRM sync.

### Gap 03 · Routing: Cluster on every vertical
Add `cluster` field to `VerticalDefinition`. Generate `clusters.ts` reverse index. Declare cluster colours as CSS variables.
Touches: `src/lib/verticals.ts`, `src/styles/tokens.css`.

### Gap 04 · Routing: `/operate` consolidation
New `src/pages/operate/` with sub-routes. Existing `owner-portal/`, `developer-portal/`, `mc/`, `vendor/` folders re-exported under operate. Zero behaviour change — only path rewrite + single shell.
Touches: `src/pages/operate/`, `LEGACY_REDIRECTS`.

### Gap 05 · UX: Home hub — blended role feed
Today's `Index.tsx` is single-role. Replace with the `home.html` mockup: primary signal card + secondary slim cards + weighted Quick Actions + role sheet.
Touches: `src/pages/Index.tsx`, new role-sheet component.

### Gap 06 · Platform: Typed event bus + agent subscribers
Client emitter in `src/lib/events/` listens to Supabase realtime and local state. Agent registry subscribes. Notification router subscribes. Ship with 2–3 agents first.
Touches: `src/lib/events/`, `src/lib/agents/`.

### Gap 07 · Investor surface — greenfield
Deal pipeline (RE + non-RE), partner-matching, capital advisory formalisation. Park as phase 5.

### Gap 08 · Design tokens: kill tokens.json
Delete `src/design-system/tokens.json` (DS2.0 Navy, never shipped). Lint rule against hardcoded hex. Update `DESIGN.md`.

---

## 05 · Migration path (6 phases, ~13 sprints)

| # | Phase | Deliverable | Effort |
|---|---|---|---|
| **P1 · 01** | Role stack DB + AuthContext | Migration + RLS + types. No UI. | ~1 sprint |
| **P1 · 02** | Home hub | Port `home.html` to `Index.tsx`. Role sheet. | ~1 sprint |
| **P2 · 03** | Cluster taxonomy | `cluster` field + tagging + CSS vars + `/discover/cluster/:id` | ~1 sprint |
| **P2 · 04** | `/operate` + Company entity | Companies table. New shell. 301s from old portals. | ~2 sprints |
| **P3 · 05** | Event bus + 3 agents | Typed emitter. Visa Guardian, Yield Optimiser, Payout Reconciler. | ~2 sprints |
| **P4 · 06** | Cluster routes + redirects | `/app/:cluster/:vertical` template. Migrate. 90-day redirects. | ~2 sprints |
| **P5 · 07** | Investor surface | Deal flow, partner matching, accredited gate. | ~3 sprints |
| **P6 · 08** | Trust + tokens + cleanup | Inline markers. Delete `tokens.json`. Kill legacy folders. | ~1 sprint |

Phases 1–4 (~8 sprints) deliver the visible transformation. Phase 5 is bonus. Phase 6 is cleanup that can be interleaved.

---

## 06 · Risks & guardrails

1. **RLS during role-stack migration.** Policies today read single active role. Review every policy. Feature-flag the switch. Run parallel for 1 week.
2. **Legacy URL fallout.** 40+ routes rename. SEO + PWA shortcuts + WhatsApp deep links break if redirects miss. Generate programmatically from route registry.
3. **Company entity RBAC complexity.** Feature-flag. Migrate one company_type at a time: providers → MCs → agents → developers.
4. **Agent drift.** Central registry, every intent logged to `/admin/agents`, kill-switch flag, user always sees accept/decline — never auto-executes money moves.
5. **Design-token split.** Delete `tokens.json` with a lint rule. DS2.0 Navy never shipped; cut it.
6. **Feature freeze fatigue.** Every phase ships value end-to-end. Phases 1–2 alone deliver the new home — visible, marketable.

---

## 07 · Claude Code handoff — prompts

Paste these into Claude Code sessions. Each is independently runnable.

### Audit

```
Audit src/pages against docs/ARCHITECTURE_V2.md §06 Route tree.
List every route that doesn't fit /app/:cluster/:vertical or one of
the 6 surfaces. Output a redirect table as Markdown.
```

### Phase 1 — Role stack

```
Implement Phase 1 per docs/FEASIBILITY.md §05 P1·01:

1. Supabase migration:
   - Add profiles.roles_stack jsonb default '[]'::jsonb
   - Add profiles.primary_role app_role
   - Backfill from user_roles
2. Update all RLS policies to read roles_stack
3. Update src/types/auth.ts with RoleStack type
4. Refactor AuthContext to expose roles[] + primary
5. No UI changes in this PR
6. Add pgTAP tests for RLS policies

Open a feature branch pavel/p1-role-stack, one PR.
```

### Phase 1 — Home

```
Port the Home hub mockup (available separately as home.html) to
src/pages/Index.tsx using:
- shadcn/ui primitives
- src/styles/tokens.css vars
- New AuthContext from the role-stack PR

Preserve:
- Blended signal stack (primary card + secondary slim cards)
- Weighted Quick Actions with role colour dots
- Role sheet (bottom drawer) — add/remove/reorder/set primary
- Activity feed with role tags

Keep visual fidelity ±5px. Do not introduce new colours.
```

### Phase 2 — Cluster tagging

```
Add 'cluster' field to VerticalDefinition per
docs/ARCHITECTURE_V2.md §04.
- Values: 'arrive' | 'live' | 'manage' | 'invest' | 'legal' | 'build'
- Tag every entry in src/lib/verticals.ts
- Generate src/lib/clusters.ts as reverse index
- Add cluster-colour CSS vars to tokens.css
- No route changes in this PR
```

### Phase 2 — /operate consolidation

```
Create /operate surface per docs/ARCHITECTURE_V2.md §05-06:
- New src/pages/operate/ with OperateShell
- Sub-routes: owner, agent, dev, provider, mc, invest
- Re-export existing owner-portal/*, developer-portal/*, mc/*, vendor/*
  pages under new paths (no behaviour change)
- Add LEGACY_REDIRECTS for old paths (90-day window)
- Feature-flag the new shell: feature_flag:operate_v2
```

---

## 08 · What design tooling does vs Claude Code

| Tool | Role |
|---|---|
| **Design environment** | Produces design + architecture artifacts (this doc, blueprint, mockups, UI explorations). Cannot commit to GitHub. |
| **Claude Code** | Reads `CLAUDE.md` + these docs. Writes code, refactors, runs tests, opens PRs against your actual repo. |
| **You** | Import MD to repo, run Claude Code sessions, bring screenshots/questions back to the design environment for iteration. |

---

## 09 · Handoff checklist

- [x] `docs/ARCHITECTURE_V2.md` — target architecture blueprint
- [x] `docs/FEASIBILITY.md` — this assessment + migration path
- [ ] `docs/visual/home.html` — Home hub mockup (copy manually if available)
- [ ] `docs/visual/architecture.html` — visual blueprint
- [x] Root `CLAUDE.md` patched with §1.5 pointer block
- [ ] Phase 1 sprint opened: Role Stack DB + AuthContext
