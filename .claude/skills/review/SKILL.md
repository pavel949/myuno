---
name: review
description: >
  Review the current working diff for myUNO before merge. Use when asked to
  "review my diff/changes", "check this before I commit", or do a code review.
  Triggers: code review, review my diff, check my changes, pre-merge review.
---

# Review — Pre-Merge Code Review

Review the working changes against myUNO's rules. Delegate the heavy lifting to
the **code-reviewer** agent for non-trivial diffs; this skill is the checklist
and entry point.

## Gather the diff
`git diff` and `git diff --staged`; read changed files in full context (not just
hunks). Run `npm run lint` and `npx tsc --noEmit` and include the real output.

## Checklist (cite file:line, classify Blocker / Should-fix / Nit)
- **Types:** no `any`; matches generated `types.ts`; that file not hand-edited.
- **Supabase:** singleton client; `public` schema only (no `v2`); queries in
  try/catch; RLS honored (`app_role`, 18 values).
- **Payments/security:** Stripe flow intact (checkout → `stripe-webhook` →
  `orders` → `record_ledger_entries`); no agent-executed money moves; audit
  markers on money screens; no hardcoded secrets/admin contacts (use
  `_shared/admin-config.ts` / `system_settings`); checkouts via
  `_shared/checkout-handler.ts`.
- **UX:** loading + error states for every async op; mobile-first 375px;
  44×44 targets; `Sheet` on mobile.
- **Design (DS 2.1):** semantic tokens only, no raw colors/hex; radii 0/2px/full;
  approved fonts; no mint/glass/glow/gradient.
- **i18n:** RU + EN for every user-facing string; no stray dashes.
- **Architecture:** no new top-level routes/shells; no cross-cluster imports;
  features behind `feature_flag:*`.
- **Hygiene:** no `console.log`; conventional-commit-ready.

## Output
Findings grouped by severity with one-line fixes, the lint/tsc results, and a
verdict: **APPROVE** or **CHANGES REQUESTED**. For deep reviews, hand off to the
`code-reviewer` agent and relay its verdict.
