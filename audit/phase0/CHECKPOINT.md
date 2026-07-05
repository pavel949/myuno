# Sprint 1 — Phase 0 Checkpoint (Diagnose & Secure)

> Branch `sprint-1/secure-wire-polish`. Read-only diagnosis + one safe client-side securing change.
> **Nothing was applied to any database.** All SQL below is a *proposal for your review* and is intentionally kept OUT of `supabase/migrations/` so Lovable Cloud cannot auto-apply it.

---

## (a) Actual prod RLS state — **UNVERIFIABLE FROM THIS SESSION (escalation)**

I could not run the live `pg_policies` query against production. Evidence:

- **Prod project `kakkwibljrjsawxgnupk` is not reachable.** The Supabase MCP in this session lists only four projects — `GlobalConnect` (`aemliebrdrfmbslqutkp`), `OwnerProp` (`fryejvtyzkuhjfsoofvu`), `OFFPLAN` (`ktfwmfdlmcgpbdnsggrb`), `myUNO - Main DB` (`hueotfhvvbxaijccmhnc`). Prod is not among them, nor is the mirror (`erfwtoavipwjqmylpizt`) named in `supabase/config.toml:1`.
- **No prod DB credentials** in env; the Supabase CLI is not linked (no `supabase/.temp/`); `config.toml` points at the mirror, not prod. This matches the audit's HIGH-1 and CLAUDE.md's explicit warning.
- **`myUNO - Main DB` is not a usable proxy.** I ran read-only checks against it. The Tier-3 tables **do not exist there at all** — `capital_contacts`, `capital_pipeline`, `capital_projects`, `capital_campaigns`, `capital_outreach`, `investment_deals`, `investor_inquiries`, `contact_identities`, `project_documents` all return `exists=false`. Only a subset (`profiles`, `crm_contacts`, `orders`, `payment_intents`, `ledger_entries`, `agent_deals`) is present, all with RLS enabled and **no** permissive (`USING true`) SELECT/ALL policies on the sampled sensitive tables. That is reassuring for that DB but says nothing authoritative about prod, and covers none of the Tier-3 surface.

**Per the mission, this is a stop-and-escalate condition:** the security unknown that reorders the sprint cannot be resolved without prod access.

**What I need from you (any one):**
1. Run `audit/phase0/verify-prod-rls.sql` yourself in the **prod** Supabase SQL editor (Lovable Cloud → the `kakkwibljrjsawxgnupk` project) and paste the output back, **or**
2. Grant this session access to the prod project (add it to the MCP), **or**
3. Confirm the mirror `erfwtoavipwjqmylpizt` is schema-faithful to prod and add *it* — I can then run the checks there as a proxy.

Until one of these happens, I treat prod RLS as **unconfirmed** and will not assume the hardening migrations from 2026-06-24/29 actually applied cleanly (they swallow exceptions on name mismatch — audit HIGH-1).

---

## (b) Tier-3 exposure & what I hardened

### Confirmed from code (authoritative regardless of prod)
- **`InvestorGuard` was cosmetic.** It granted `/capital` (+`/invest/dashboard`, `/invest/ops/*`) access if the runtime persona stack merely contained `investor` — `src/components/auth/InvestorGuard.tsx:46-48` (pre-change). That persona is **self-assignable**: `useUserPersonas` writes `user_personas` directly from the client (`src/hooks/useUserPersonas.ts:132-160`) and guest personas are localStorage (`:56-95`). Any visitor could toggle it and load the confidential workspace shell.
- **Underlying RLS (from migration source — pending prod confirmation):** `capital_*` tables are scoped `auth.uid() = user_id` (`supabase/migrations/20260414120000_capital_crm.sql:40-47`), so a self-assigned persona sees only its own empty CRM, not others' deals. `investment_deals` private columns sit behind a blanket `has_role('admin')` policy (`supabase/migrations/20260419010809_*.sql:130-151`); a self-assigned persona is **not** admin, so structured private data is blocked *if that policy is live on prod*.
- **The residual real risk I cannot close here:** `investment_deals.documents_urls` is a bare `jsonb` URL array (`20260419010809_*.sql:63`). If those documents live in a **public** storage bucket, table RLS is irrelevant — the URL alone leaks them. I could not determine the bucket or its publicity for prod (no prod storage access). The repo has `developer-documents`, `project-documents` (RLS-gated, incl. a `public`/`kyc` read tier — `20260705040349_*.sql`), and an `investment_documents` table, but which bucket backs `documents_urls` on real deals is unconfirmed.

### What I applied this phase (safe, code-only, reversible)
- **`src/components/auth/InvestorGuard.tsx`** — removed the self-assignable-persona access path; access now requires a **server-resolved** role (`admin`/`uno_team`/`capital_team`/`investor` from `useResolvedContext`, or admin mode). This is UI-gating only and does not touch the DB. **Behaviour change to sign off:** any real investor who was reaching `/capital` via a self-toggled persona will now be redirected to `/invest` until granted a proper server role. Admins/uno_team/capital_team are unaffected. Trivially reversible.

### What I did NOT apply, and why (needs your go-ahead)
- **`audit/phase0/proposed-tier3-rls-hardening.sql`** — a draft that (1) replaces the blanket-admin gate on `investment_deals` with `capital_team OR admin`, (2) adds explicit deny-by-default confirmation on `capital_*`, and (3) documents the document-bucket lockdown. I did **not** put it in `supabase/migrations/` and did **not** apply it, because: I can't test it against the real prod schema, untested RLS can lock out legitimate access or miss a case, and the mission says propose-and-wait when exposure can't be safely closed this phase. **Recommendation:** review it, then (if you approve) I move it into `supabase/migrations/` and you apply via Lovable Cloud against a schema you can roll back.

### Proposal: if the document bucket turns out public
If your check of `verify-prod-rls.sql` (§a) shows the bucket backing `documents_urls` is public **and** real deals have documents, I recommend **temporarily flipping that bucket private** (one line) until the proper access model exists — this is the "take the surface offline safely" option. I will not do this unilaterally; say the word.

---

## (c) `external-data-api` token — rotation plan (do NOT rotate yet)

**Blast radius (from `supabase/functions/external-data-api/index.ts`):** authenticates on a single static `EXTERNAL_API_TOKEN`, then uses `SUPABASE_SERVICE_ROLE_KEY` (bypasses all RLS) for GET/POST/PATCH/**DELETE** over a whitelist that includes **`crm_contacts`** and **`providers`** (PII) plus `properties`, `property_projects`, `property_developers`, `crm_companies`. CORS `Access-Control-Allow-Origin: *`, no visible rate limit. One leaked token = full read/write/delete of CRM + provider PII.

**Dependencies:** I found **no in-repo caller** — `grep` across `src`, `supabase`, `api`, `scripts`, `vercel.json` returns only the `config.toml` registration. By design ("secure proxy for external scripts") the consumers are **external automation scripts you hold outside this repo**. I cannot enumerate those from the codebase — **you must identify every holder of the current token before cutover.**

**Proposed coordinated rotation (on your go-ahead):**
1. You list every external script/service using `EXTERNAL_API_TOKEN`.
2. Generate a new token; add it as a **second** accepted value in the function (dual-accept window) — I can prepare this diff.
3. Update each external consumer to the new token.
4. Remove the old token; drop `DELETE` from allowed methods, tighten CORS to known origins, add rate limiting, and consider splitting read-only vs write tokens. I can prepare all of these.
5. Rotate the underlying `SUPABASE_SERVICE_ROLE_KEY` only if you suspect the old token leaked (larger blast radius — separate coordination).

---

## Ready for Phase 1?
Phase 1 (buyer-signal engine + identity bridge) does not depend on the prod-RLS answer, but the mission ordering puts this checkpoint first. **Awaiting your sign-off**, and specifically your decision on: (1) how to resolve the prod-RLS verification, (2) whether to approve the Tier-3 RLS hardening draft, (3) the token-rotation go-ahead + consumer list.
