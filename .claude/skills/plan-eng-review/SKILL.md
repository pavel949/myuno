---
name: plan-eng-review
description: >
  Architecture / engineering-plan review for myUNO. Use before a large refactor
  or new subsystem, or to review a proposed technical approach against the
  target architecture. Triggers: architecture review, design doc, "review my
  plan", refactor plan, system design, tech approach.
---

# Plan / Engineering Review — Architecture Gate

Pressure-test a technical plan against myUNO's target architecture before code.

## Read first
- `docs/canonical/architecture/OVERVIEW.md` — dependency map, decision tree.
- `docs/canonical/architecture/ARCHITECTURE_V2.md` — target architecture
  (roles · clusters · surfaces · agents) and the **§13 hard rules**.
- `docs/canonical/architecture/FEASIBILITY.md` — migration path & current
  implementation status per role.

## §13 hard rules (a plan that breaks one is rejected)
1. No new top-level route — nest under a cluster or `/operate/*`.
2. No new shell — reuse `MiniAppLayout` or the Operate shell.
3. No hardcoded hex — use `src/styles/tokens.css` variables.
4. No cross-cluster imports — use shared L4 primitives / L3 services.
5. No agent auto-executed money moves — user-confirmed intent only.
6. Every money-moving screen shows an audit marker (tx + ledger + timestamp).
7. Every new feature gated behind `feature_flag:*` until GA.

## Review dimensions
1. **Fit** — does it respect Surface vs Canvas vs JTBD-cluster distinctions and
   the `app_role` (18) authorization model? Does it belong (PROJECT.md 5-test)?
2. **Data** — schema/RLS impact (`docs/canonical/09-data-schema.md`); migrations
   reversible-minded; ledger/audit on money paths.
3. **Layering** — respects L3 services / L4 primitives boundaries; no leaks.
4. **Risk & rollout** — blast radius, feature-flag plan, observability, rollback.
5. **Effort** — phasing; what can ship behind a flag first.

## Output
Verdict (**Approve / Approve-with-changes / Reject**), the §13 rules checked,
the top risks, and a phased plan. If it contradicts canon, stop and escalate to
Pavel. No implementation in this mode.
