# MC authoring activation evidence — 2026-10-25

Base: `775bd61cef82011eb1f530bcce8dfe666f661a03`, repository `pavel949/myuno`.
Status: isolated backend happy path verified; production activation **NO-GO**.
No production business write, role change, grant, RLS change, migration or deployment was performed.

## Concrete deliverables

`scripts/db/build-mc-authoring-activation.mjs` builds one transaction from bounded candidates. It first makes the existing public property catalogue read-only, then installs task and four-table operational ceilings before property authoring; complex authoring follows its property/Space prerequisite. It excludes platform-admin permission delegation, published revisions, off-plan work and notification changes. It never connects to a database. Source SHA256 values are embedded. The complex candidate's two broad permissive policies are disabled with `ALTER POLICY ... USING(false)` rather than dropped; new checked policies and the restrictive read ceiling provide the reviewed replacement paths. No table/function/policy is dropped, no business data is backfilled, and no member/permission rows are seeded. The existing source candidate relaxes complex owner NOT NULL only together with its governed-row constraint; it does not fabricate an owner.

Generate review artifacts into new files:

```sh
node scripts/db/build-mc-authoring-activation.mjs forward /tmp/mc-authoring-forward.sql
node scripts/db/build-mc-authoring-activation.mjs rollback /tmp/mc-authoring-rollback.sql
sha256sum /tmp/mc-authoring-forward.sql /tmp/mc-authoring-rollback.sql
```

Current forward SHA256: `e26c1d0e2f50199d26b49cb0977f21390a5fed07a2337a4bea384d94cdedab11`.
Current rollback SHA256: `9eaa40b33775cbf9a2f642187642bcc159c0b0a785e9441dc00f4648bde965c1`.
The generated SQL remains outside both applied migration journals. Rollback excludes removal of the separately governed platform-admin delegation policies, because that delegation is absent from this activation. Do not replay historical migrations or apply unrelated candidate files.

## What was actually verified

Real PostgreSQL **17.6**, own Unix-socket-only cluster, synthetic actors and records. No hosted credentials are accepted by the tests. The cumulative case clones the pre-candidate local database, installs the exact generated transaction and uses actual SQL/RLS calls across separate actor transactions:

| Step | Isolated result | Production result |
| --- | --- | --- |
| Create complex; submit and protected-admin approve | Passed; hidden before approval | Blocked: RPC/schema absent |
| Create canonical physical property in explicit Space | Passed; owner/provider not inferred | Existing creation only; authoring helpers absent |
| Link property to approved same-company complex | Passed | Not activated |
| Save description, media URL, characteristics and rules; reopen | Passed; same property ID and stored content | Not activated |
| Repeat save and reject stale version | Passed; no extra physical row | Not activated |
| Submit/review property; public allowlisted read | Passed; draft absent, approved row visible | Not activated |
| Create task; explicitly assign operational staff | Passed | Not exercised |
| Assigned staff read/complete; manager reload result | Passed, including source task-activity trigger | Not exercised |
| Other staff and outsider read/update | Denied | Not exercised |
| Public catalogue DML | Synthetic pre-activation UPDATE succeeded; anon UPDATE/authenticated DELETE denied after activation; rollback retains denial | Read-only metadata confirms updatable view and DML grants; no write attempted |
| Failure at end of activation transaction | No new author column or complex RPC survived | Not attempted |
| Atomic fail-closed rollback | RPC denied; canonical property and restrictive task ceiling retained | Not attempted |

The task fixture models the live task permissive policy inventory (`mc_members_manage_tasks` only), together with the Space ceiling and candidate module/action ceiling. Its historical extra permissive policy is neutralized locally. Operational assignment and task permission rows are explicit isolated fixture setup, never production seeds or implicit content-author rights. This does not prove that an unconfigured production employee already has these assignments.

Validation: property PostgreSQL suite 114, complex PostgreSQL suite 75, vendor-notification PostgreSQL suite 15, property client contract 19, complex client contract 33: **256 passed**. After disabling rather than dropping legacy complex policies, the property suite (including cumulative forward/failure/rollback) passed again. Repository typecheck, changed TypeScript ESLint and `git diff --check` passed. This is SQL/RLS execution evidence; no browser-to-production acceptance is claimed. Existing revision tests also run within the property suite, but revision SQL is explicitly excluded from this activation transaction.

## Live read-only evidence

Lovable database status is enabled, Supabase stack; PostgreSQL 17.6. SELECT metadata queries work. The execution context reports CREATE on public, TRIGGER rights on both canonical tables, PostgreSQL role membership and BYPASSRLS. Therefore an existing technical activation route is Lovable `query_database` after authorization; absence from a different connector is not a universal access blocker. Actual DDL capability was not tested by writing.

Confirmed absent: the six checked complex RPCs and property authoring Space/list/read/save helpers. `create_managed_property_checked(uuid,uuid,text,text,text,text)` exists but is not the content-author draft contract. All 156 content field names exist on live `properties`. Complex owner is NOT NULL and governed authoring/review columns are absent. All six original preflight queries executed successfully: 11 helper definitions, 53 policies, 10 triggers, 364 column definitions, 52 constraints and four relation security records. Subsequent read-only checks covered client table/view grants, catalogue updatability and task/activity/audit constraints. Same-company Space composite FKs and the unique Space key exist. This metadata inventory is not a claim of complete production-equivalent isolated replay.

The live `public_property_catalog` reports `is_updatable=YES`, `is_insertable_into=YES`, no check option, and legacy INSERT/UPDATE/DELETE grants for anon/authenticated. The isolated test reproduces an anonymous catalogue UPDATE before activation, then proves DML denial after the new `public-property-catalog-readonly.candidate.sql` and after rollback. No production exploitation was attempted. This finite publication boundary fix is necessary for the requested guest projection, independently of the absent authoring RPCs.

The current property moderation trigger references `NEW.name_en` on a property row. Providerless managed shells return before that expression; this is not a claim that provider-backed publication is repaired. Live task completion has a separate legacy auto-expense path for status `done` and positive cost. The tested path is `completed` with no cost; paid/expense operations are outside acceptance.

Public HTML recheck: shell fetch returned HTTP 403; web reader retrieved the page title but no raw HTML. This execution did **not** independently reconfirm the advertised SHA or asset filename. The parent audit's `775bd61c` / `index-Bz0vrKil.js` remains attributed prior evidence.

## Remaining gates and action-time approval

1. Complete live metadata equivalence, especially column types/defaults, constraints, public projection grants and every invoked trigger. The synthetic fixture is intentionally not a full production clone.
2. Initial create RPCs lack a durable retry key. Replayed initial create after a lost response can create another shell. The cumulative test proves repeat **save**, not idempotent initial creation. Resolve this before reliable operational GO; do not relabel the gap as covered.
3. Verify browser actor/session/company changes, media storage upload permissions, guest and buyer projections, and editor reload against the activated backend. A stored media URL is not proof of a storage upload. No sales `project_units` row is created in this tranche; it remains a sales record referencing the same physical property.
4. Complete task assignment/assignee validation, server-authoritative completion identity, conflict behavior and production operational membership configuration. The bounded restrictive ceiling does not itself provide a new least-privilege staff onboarding/assignment workflow.
5. Dashboard error-to-zero behavior remains unresolved; no dashboard readiness claim is made.

The exact security-critical action requiring separate parent/user approval is application of the forward SQL with the SHA256 above to the existing production database. It revokes public-catalogue DML privileges and changes checked RPC EXECUTE grants, direct-write triggers, restrictive operational/task policies, complex policy paths and governed complex schema. This action is **pending authorization and other gates**, not denied and not attempted. General “fix it” authorization is insufficient by the explicit task instruction. Rollback is a separate action-time approval targeting the rollback hash above; it freezes checked authoring while preserving data, read-only safe projections and restrictive ceilings.

After backend gates and explicit SQL authorization, run metadata-only postflight before any UI publication. A controlled production acceptance run requires another specific approved plan: existing authorized company/Space and actor accounts, one clearly identified draft complex/property, one zero-cost task, no invitation, notification, booking/payment or fictional public listing. Public approval must use legitimate supplied listing content; otherwise verify public visibility only in isolation. Record IDs privately outside this public repository. Do not merge/publish UI promises on the strength of this isolated result.
