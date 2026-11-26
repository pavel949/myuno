# Security regression evidence: Design Bible v4 + Round 4A HQ (#357)

## Sensitive surface

- **New:** `supabase/migrations/20261125120000_hq_dual_approvals.sql` — `hq_dual_approvals` table and the `hq_can_approve`, `hq_record_approval`, `hq_publish_clearview_report` RPCs, plus a `due_diligence_reports` publish-guard trigger.
- `src/hooks/useClearViewReview.ts` / `src/hooks/useDualApproval.ts` — admin reads and writes on `due_diligence_reports`, and approvals that go only through those RPCs.
- `src/components/newbuilds/ClearViewReport.tsx` — the admin one-click "Publish" button is removed. It now links to the two-person review editor; unpublishing stays direct.
- `src/hooks/useHqPayoutRun.ts` — **read-only** aggregation over existing money tables. It sends no money and calls no write RPC.
- `src/components/auth/GoogleSignInButton.tsx` and ~290 other files — class-string change only (`rounded-none` → `rounded-sm`/`rounded-md`, done by `scripts/v4-radius-codemod.mjs`). There is no logic change.

## Controls asserted

1. RLS is on for `hq_dual_approvals`, and no INSERT/UPDATE/DELETE policy or grant exists, so clients cannot forge approvals. Only admin and finance can read.
2. All three functions are `SECURITY DEFINER` with `SET search_path = public`. EXECUTE is revoked from `PUBLIC` and `anon`.
3. The approver is always `auth.uid()`, never a parameter. Every approval and every publish writes a row to `admin_audit_logs`.
4. Publishing needs **two distinct admins**, and each sign-off must be later than the report's `updated_at`. Editing a report therefore invalidates earlier sign-offs.
5. A trigger blocks `is_published` going false → true unless the transaction-local marker is set. Only `hq_publish_clearview_report` sets that marker. This closes the bypass through the pre-existing `"Admins manage DD reports" FOR ALL` policy.
6. The role pairing between `hqAccessPolicy.APPROVAL_ROLES` and the SQL `hq_can_approve` is checked by a unit test (`src/lib/__tests__/round4aHq.test.ts`).

## Reproduction

```sh
npx vitest run src/test/security/hqDualApprovals.test.ts src/lib/__tests__/round4aHq.test.ts \
  src/components/page/__tests__/SystemState.test.tsx src/components/newbuilds
npx tsc --noEmit -p tsconfig.app.json
node scripts/design-system-audit.mjs
node scripts/validate-fonts.mjs
```

Result in this session: the security suite (9 tests) and the Round 4A logic and state tests pass. The ClearView newbuilds suites (11 files, 62 tests) pass. `tsc` is clean, the design audit has 0 new findings, and the font validator passes.

## Limits

These are static assertions on the migration SQL plus unit tests with mocked transport. They are **not** a live RLS/RPC test against Postgres: the migration has not been applied, because it is applied through Lovable Cloud only. They are not a general scanner either. Two follow-ups remain open for review:

- `admin_process_payout` does not yet require a payout-run approval above ฿1M. This would change a live money RPC.
- Existing published reports can still have their content edited by an admin under the `FOR ALL` policy. Only the publish transition is guarded.

## Full-suite run (merged tree `ad8e29d`)

`npx vitest run`: **551 files / 5621 tests passed**, 207 skipped. 12 files failed to load, all `src/lib/__tests__/*.postgres.test.ts`. They need a local `postgres` binary (`Command failed: which postgres`), which this container lacks. These DB-backed suites run in CI.
