# Migration baseline squash — runbook

## Why
The `supabase/migrations/` history (759 files) does **not** replay cleanly on a
fresh database. It was built largely through the Supabase dashboard, so the
migration files drifted from the real schema: some tables referenced in
migrations were created via the dashboard and never captured (e.g. categories
`drinks`/`thai-fashion` — fixed in PR #26), and some are **dead references** to
objects that don't exist even on prod (e.g. `public.partners`, only
`partner_applications` exists).

A full replay against a faithful Supabase Postgres surfaces ~50+ failures
(missing/out-of-order tables, dead references, FK/seed ordering). Hand-patching
each historical migration is impractical and risky.

**Production is unaffected** — it already contains every object. The only thing
that breaks is a *fresh* apply: Supabase **preview branches** and `supabase db
reset` (local). The "Supabase Preview" check is **not required** to merge.

The correct fix is to **rebaseline**: replace the drifted history with a single
baseline dumped from the real prod schema, and tell the remote that baseline is
already applied. After this, preview branches and local resets replay only the
clean baseline.

## Who runs this
Someone with the **Supabase CLI** installed and **prod access** (project linked
or a direct `--db-url`). It cannot be done from the Claude sandbox (no Docker,
no prod DB credentials, `execute_sql` blocked).

Main project ref: `hueotfhvvbxaijccmhnc` ("myUNO - Main DB").

## Prerequisites
```bash
supabase --version            # v1.200+ recommended
supabase login
supabase link --project-ref hueotfhvvbxaijccmhnc
git checkout -b chore/migration-baseline-squash
```

## Procedure (test on a branch first!)

> Do a dry run on a **throwaway preview branch** before touching the main
> project's migration metadata. None of this changes the prod *schema* — only
> the migration *history table* (via `migration repair`). But verify first.

### 1. Dump the current prod schema as the new baseline
```bash
# helper does steps 1–3; or run manually:
./scripts/migration-squash/squash.sh
```
Manual equivalent:
```bash
BASE_TS=20260101000000        # EARLIER than every existing migration timestamp
supabase db dump --linked -f "supabase/migrations/${BASE_TS}_baseline_schema.sql"
# Reference/seed data the app + previews expect (categories, lookup_values, …):
supabase db dump --linked --data-only --schema public -f supabase/seed.sql
```

### 2. Archive the old migration files
```bash
mkdir -p supabase/migrations_archive
git mv supabase/migrations/2026*.sql supabase/migrations_archive/   # keep ONLY the new baseline file
```
The baseline uses an **earlier** timestamp than all archived files, so
`supabase db push` will never try to run it on prod (it's "in the past").

### 3. Tell the remote the baseline is already applied
```bash
supabase migration list                                   # inspect local-vs-remote
supabase migration repair --status applied "${BASE_TS}"   # baseline = applied, do NOT run it
```
Old remote versions whose files you removed stay recorded as applied; `db push`
ignores them (no files). Optionally tidy the list later with
`migration repair --status reverted <old_version>`.

### 4. Verify a clean fresh apply
```bash
# Local (needs Docker): resets a fresh DB and applies ONLY the baseline + seed
supabase db reset
# Then push a test commit and confirm the PR's "Supabase Preview" → Migrations ✅
```

## Rollback
Nothing here drops or alters prod schema. To revert: restore files from
`supabase/migrations_archive/`, delete the baseline file, and
`migration repair --status reverted "${BASE_TS}"`.

## After squash
- New migrations go on top of the baseline as usual.
- Keep migrations **idempotent / self-sufficient** (guard dashboard-created
  objects with `IF NOT EXISTS` / `IF EXISTS`) so the history never drifts again.
- Consider enabling the Supabase Preview check as **required** once green, to
  prevent future drift.
