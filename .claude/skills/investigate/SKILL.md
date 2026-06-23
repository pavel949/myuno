---
name: investigate
description: >
  Root-cause debugging for myUNO. Use when something is broken: a bug, error,
  500/4xx, failed payment/checkout, broken booking, auth/role glitch, blank
  screen, or "why is this happening?". Triggers: bug, error, broken, crash,
  stack trace, 500, regression, "not working".
---

# Investigate — Root Cause Analysis

Find the real cause before touching code. No speculative fixes.

## Read first
`/CLAUDE.md` (esp. §4 DB/env and the audit-findings list in §3) and, for the
unknown area, `docs/canonical/architecture/OVERVIEW.md`.

## Process
1. **Reproduce / pin the symptom.** Exact error text, which route/component,
   which `app_role`, which environment. All three environments share the same
   prod DB `kakkwibljrjsawxgnupk`.
2. **Locate** with Grep/Glob; read the failing path in full, including
   `_shared/` helpers for edge functions.
3. **Form a hypothesis, then confirm it** against the code/logs before fixing.
   Cite `file:line`. Common myUNO traps:
   - Payments: order not created after Stripe webhook; ledger entries missing;
     reconciliation mismatch (`orders` ↔ `ledger_entries`).
   - Auth: first-login role assignment, impersonation, `useIsAdmin`.
   - Data: wrong assumption about `app_role` (18 values) vs consumer role-stack;
     RLS denying a query; `supabase.schema('v2')` misuse (no v2 exists).
   - UI: missing loading/error state hiding a rejected promise.
4. **Check logs** — Supabase `get_logs`/`get_advisors`, Sentry, edge function
   logs — but never assume the MCP Supabase project is prod (it is
   `hueotfhvvbxaijccmhnc`, not live).
5. **Propose the minimal fix**, name the blast radius, and what test proves it.

## Output
Root cause (`file:line`), why it happens, the minimal fix, and how to verify.
Only implement the fix if the user asked you to fix (not just diagnose).
