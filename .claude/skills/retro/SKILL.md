---
name: retro
description: >
  Run a development retrospective for myUNO. Use for weekly/sprint retros or
  when asked to reflect on recent work, what went well/badly, and what to
  improve. Triggers: retro, retrospective, weekly review, "look back on the
  week", lessons learned.
---

# Retro — Development Retrospective

A short, honest look back to improve how we build myUNO.

## Gather the period's reality
- `git log --since="1 week ago" --oneline` (or the asked window) and the merged
  PRs (`mcp__github__list_pull_requests`, state merged) for `pavel949/myuno`.
- Note recurring themes: payments/checkout, auth/roles, i18n cleanup, DS
  compliance, lead routing — the live workstreams in CLAUDE.md §2–3.

## Structure
1. **Shipped** — what actually landed (commits/PRs), with impact.
2. **What went well** — patterns to keep (e.g. atomic migrations, audit markers,
   feature-flag gating).
3. **What hurt** — bugs that recurred, rework, gaps in tests/docs. Be specific
   and blameless; cite commits/PRs.
4. **Trends** — is the same class of bug recurring (e.g. order-not-created,
   role assignment)? Is tech debt accumulating (raw colors, hardcoded strings,
   `any` count drifting)?
5. **Actions** — 3–5 concrete, owned, checkable improvements for next period
   (e.g. "add a regression test for ledger entry creation").

## Output
A tight retro: shipped / well / hurt / trends / actions. Prioritise the actions;
don't produce a wall of text. Offer to file the top action(s) as issues.
