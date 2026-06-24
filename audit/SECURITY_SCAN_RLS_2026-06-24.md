# myUNO — RLS Security Scan Report

**Date:** 2026-06-24
**Tool:** [vibe-scanner](https://github.com/pavel949/vibe-scanner) (local mode, static analysis of SQL migrations)
**Target:** `supabase/migrations/` — 771 migration files
**Coverage:** 551 tables, 1,486 RLS policies analyzed
**Raw artifacts:** `audit/myuno-scan.json` (full machine-readable), `audit/myuno-scan-full.md` (all 2,217 findings)

> ⚠️ This is a **static, migration-file** scan. It reflects the declared/final state of
> RLS in the SQL, not the live database. A remote scan (Supabase Management API or
> Lovable token) would additionally cover `storage.*` tables, `service_role` BYPASSRLS,
> and all `SECURITY DEFINER` functions — recommended as a follow-up.

---

## 1. Raw totals

| Severity | Count |
|----------|------:|
| CRITICAL | 356 |
| HIGH | 1,039 |
| MEDIUM | 424 |
| LOW | 162 |
| WARNING | 236 |
| **Total** | **2,217** |

The scanner exits non-zero (CI-fail) because CRITICAL/HIGH findings exist.

## 2. Read this first — the raw numbers are inflated by false positives

I verified findings against the actual SQL. The biggest single bucket (RLS-025
"tautology", 329 CRITICAL) is **substantially over-counted**:

- The detector flags `is_active = true`, `approval_status = 'approved'`, and similar
  **column comparisons** as "always-true tautologies." There are ~687 `<column> = true`
  comparisons across the migrations, and many legitimate, properly-filtered policies are
  caught by this.
- **Verified false positive:** `listings.listings_public_read` is
  `USING (is_active = true AND (approval_status = 'approved' OR approval_status IS NULL))`
  — a correct, filtered public-read policy, flagged as a tautology.
- **Verified false positive:** `crm_nurture_queue` insert policy is
  `WITH CHECK (company_id IN (SELECT company_id FROM management_company_members WHERE user_id = auth.uid() AND is_active = true))`
  — a correct membership check, flagged because of the inner `is_active = true`.

Similarly, **RLS-048 "infinite loop"** mostly flags normal cross-table `EXISTS`
subqueries (e.g. `order_items` checking `orders`), which are not actually recursive
unless the referenced table's policy points back. **RLS-054 "missing FORCE RLS"** (551
findings) is a real hardening recommendation but **low real-world risk on Supabase** —
the app connects as `anon`/`authenticated`, not the table owner, so the owner-bypass it
warns about isn't on the normal request path.

**Bottom line:** treat the scan as a *triage list*, not a literal vulnerability count.
The genuinely actionable items are below.

---

## 3. Genuinely actionable findings (worth a human look)

### 3a. Tables with RLS enabled but NO policies — confirm intent (RLS-002, 18 tables)
RLS with zero policies = deny-all for non-owners. That's *safe-but-broken* if the table
is meant to be read/written by users, and a real exposure only if a permissive policy is
expected to exist elsewhere. Several of these hold sensitive data and deserve a direct check:

`lead_attributions`, `email_send_state`, `email_unsubscribe_tokens`, `floor_plans`,
`marketplace_international_shipping`, `reservations`, `payment_schedules`,
`contact_disclosure_events`, `masked_channels`, `email_send_log`,
`qa_multi_role_auto_config`, `crm_oauth_states`, `owner_reports`, `unit_holds`,
`rln_events`, `commission_agreements`, `suppressed_emails`, `commission_events`

> Note: at least `reservations` *does* have `CREATE POLICY` statements in the migrations,
> so this rule also has false positives (likely from consolidated/duplicated migration
> files). Verify each table's effective policies in the live DB.

### 3b. Genuine `USING(true)` public reads — confirm each should truly be world-readable
Of the 329 RLS-025 hits, **233 are on SELECT**. The genuinely bare `USING(true)` ones are
public-reference/catalog tables (`lookup_values`, `development_units`, `visa_services`,
`yachts`, `lead_magnets`, `platform_events`, `product_availability`, …). Most are
intentional public catalog data — but walk the list and confirm none expose PII or
internal records. **The write-side ones matter more:** 31 INSERT + 16 UPDATE + 36 ALL +
13 DELETE policies were flagged — these are the ones to verify are not literally `true`
with no membership/ownership guard.

### 3c. UPDATE policies missing `WITH CHECK` (RLS-011, 150 HIGH)
An UPDATE policy with only `USING` lets a row be updated into a state that the policy
would otherwise forbid (e.g. reassigning `owner_id`/`company_id` to escape scope). Add a
matching `WITH CHECK` to UPDATE policies on ownership-scoped tables.

### 3d. Missing auth check in policy (RLS-008, 205 HIGH)
Policies with no `auth.uid()` / `auth.jwt()` reference. Overlaps with the public-read set
(intentional) — filter `audit/myuno-scan.json` by `rule_id == "RLS-008"` and review the
write-side ones first.

### 3e. Missing INSERT/SELECT policies (RLS-004 / RLS-003, 73 + 19)
Tables with RLS on and some policies but missing coverage for an operation. Usually
intentional (read-only or write-only tables) — quick confirm.

---

## 4. Suggested next steps

1. **Run a remote scan** for full coverage (storage tables, `service_role`,
   `SECURITY DEFINER` functions) against the prod ref `kakkwibljrjsawxgnupk`:
   ```bash
   uv run rls-scanner --lovable-token "<token>" --lovable-project "<project-id>"
   ```
2. **Triage the ~18 no-policy tables** (§3a) against the live DB — these are the
   highest-signal, lowest-noise items.
3. **Audit write-side `USING(true)`** policies (§3b) — 96 INSERT/UPDATE/ALL/DELETE hits.
4. **Add `WITH CHECK` to ownership-scoped UPDATE policies** (§3c).
5. Optionally apply `FORCE ROW LEVEL SECURITY` as defense-in-depth on sensitive tables.

## 5. How to reproduce
```bash
cd vibe-scanner && uv sync
uv run rls-scanner ../myuno/supabase/ -o json -f myuno-scan.json
uv run rls-scanner ../myuno/supabase/ -o markdown -f myuno-scan.md
```
