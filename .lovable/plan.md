# Audit current app against the proposed schema in `myUno_final-handoff.zip`

## Why a plan is needed

The handoff zip is a binary upload accessible only through `code--copy`, which is not available in read-only/plan mode. I cannot read its README or any of its contents until we switch to default mode. Approving this short plan unblocks extraction.

The audit itself is also non-trivial: `src/integrations/supabase/types.ts` is ~900 KB and the `public` schema has 200+ tables; the comparison needs a structured pass, not a freeform read.

## Steps once approved

1. **Extract the handoff**
   - `code--copy user-uploads://myUno_final-handoff.zip /tmp/handoff/in.zip`
   - `unzip /tmp/handoff/in.zip -d /tmp/handoff/`
   - List contents, read top-level `README.md`, identify the proposed schema file (likely `09-data-schema.md` per `CLAUDE.md` §1.4, or a `schema.sql` / `schema.json`).

2. **Inventory the proposed schema**
   Build a normalized list of:
   - tables (name, purpose)
   - columns (name, type, nullability, defaults)
   - enums
   - foreign keys
   - RLS policies (if specified)
   - indexes (if specified)
   Save to `/tmp/handoff/proposed.json` for diffing.

3. **Inventory the current `public` schema**
   Pull live shape via `supabase--read_query` against `information_schema` (tables, columns, FKs) and `pg_catalog` (enums, policies, indexes). Save to `/tmp/handoff/current.json`.
   Cross-check against `src/integrations/supabase/types.ts` to catch any drift between code-generated types and the live DB.

4. **Diff & classify findings**
   For every proposed table/column produce one of:
   - `MATCH` — exists with compatible shape
   - `MISSING` — proposed but not in DB
   - `EXTRA` — in DB but not in proposal (orphan / legacy)
   - `MISMATCH` — exists with different type, nullability, default, or FK target
   - `RENAMED` (heuristic) — same purpose, different name
   Also flag:
   - tables without RLS where the proposal expects user-scoped data
   - enums missing values
   - FK targets pointing at deprecated tables (e.g. anything still referencing `auth.users` via FK, which violates the project rule in `CLAUDE.md` §`supabase-db`)

5. **App-side impact scan**
   For every `MISSING` / `MISMATCH` finding, `rg` the codebase for:
   - `supabase.from('<table>')` callers
   - hook files in `src/hooks/` referencing the table
   - components that render fields the proposal renamed/dropped
   This converts the schema diff into a concrete list of code locations that would break.

6. **Deliverable**
   A single markdown report at `/mnt/documents/schema-audit.md` with:
   - executive summary (counts: matched / missing / extra / mismatched)
   - per-table table of findings
   - prioritized remediation list (P0 = breaks app, P1 = security/RLS gap, P2 = naming/cleanup)
   - explicit "do NOT change" list (Supabase-reserved schemas: `auth`, `storage`, `realtime`, `supabase_functions`, `vault` per project rules)

   No DB migrations or code changes are produced in this pass — audit only. Remediation will be a follow-up loop you can scope from the report.

## Out of scope (per project rules)

- No edits to `src/integrations/supabase/types.ts`, `client.ts`, or `.env`.
- No migrations or destructive SQL.
- No assumptions about RLS correctness beyond what the proposal and `pg_policies` reveal.
- No claims about tables I cannot read — every cited table will come from the live DB or the handoff doc.

## Open question

If the handoff zip turns out to contain something other than a schema spec (e.g. it is a code bundle, design files, or a different doc set), I'll stop, summarize what's actually inside, and ask you to point me at the right artifact before producing the audit.
