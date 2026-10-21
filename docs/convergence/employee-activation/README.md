# Employee authoring: atomic source assembly plan

**SOURCE ONLY / NO-GO for production activation.** Input reference: `0ea175ea1887c45cbff3f21b91d535ddd3020038` (19 October 2026). Current integrated-head CI and live equivalence are separate pending gates. This plan creates reviewable files; it neither connects to a database nor authorizes applying SQL.

## Scope and user boundary

The current user scope is the existing founder/admin and one intended employee. Employee connection is deferred. Preserve the founder's verified auth identity, protected platform-admin role and existing company-director memberships. No identity repair, new admin, role promotion or broad historical-company migration is needed or authorized.

The generated SQL contains reusable checked workflow definitions and their required restrictive boundaries. It contains **no named-user grants, employee invitation, company/Space seed, membership mutation, enforcement toggle or existing-property assignment**. The source's grants to database roles are consequential security changes and still require explicit approval; they are not permission to grant an employee access.

## Generate review artifacts only

From the repository root:

- Core candidate: `node scripts/source-bundles/employee-publication.mjs --out /tmp/employee-authoring.candidate.sql`
- Only if separately in approved scope, include platform-admin delegation: `node scripts/source-bundles/employee-publication.mjs --include-admin-delegation --out /tmp/employee-authoring-with-delegation.candidate.sql`
- Fail-closed rollback candidate: `node scripts/source-bundles/employee-publication.mjs --rollback --out /tmp/employee-authoring-rollback.candidate.sql`

The generator refuses to overwrite an existing file. It has no database library, URL, credentials, shell execution, deployment or migration registration. Keep outputs outside active migration journals. Do not pass generated SQL to a production executor at this stage.

The manifest pins every input file by SHA-256. Any source change stops generation until the changed source, ordering, tests and reference commit are reviewed and the manifest is deliberately updated. Generating a file is not approval of its contents. Do not refresh checksums automatically to silence drift.

## Atomic order

All included SQL is assembled into **one outer BEGIN/COMMIT**, in this order:

1. `employee-task-capability.candidate.sql`: restrictive task action ceilings.
2. `employee-operational-membership.candidate.sql`: restrictive ceilings on the four surviving operational tables. Does not recreate absent `property_meters` or restore historical permissive inspection policies.
3. `vendor-notification-row-shape.candidate.sql`: JSON-based optional title/name access, retaining notification recipients, status gates and grants.
4. `checked-publication.candidate.sql`: checked property creator/read/list/save/review, immutable author, safe projection and direct-write guard; revokes the legacy client publisher.
5. `checked-complex-publication.candidate.sql`: checked complex workflow, safe public projection, ownership/Space contract, MC bypass containment and protected admin review audit.
6. `published-revisions.candidate.sql`: reuses property fields/author helper/validators for approved-property revision proposals. Canonical published content remains unchanged until exact-version approval.
7. Optional `platform-admin-authoring-delegation.candidate.sql`: policies only, no permission rows. Its authorizer requires selected-company Space enforcement already verified true before use.

The restrictive task/operational definitions appear before the broadened creator, and nothing becomes externally effective until the final commit. No per-file transaction can commit an intermediate creator-only state. The assembler recognizes comments, SQL strings/identifiers and dollar-quoted PL/pgSQL bodies; it removes exactly the two outer wrapper statements from each checksummed input, preserving every other source byte. Additional top-level transaction control, malformed strings/comments or psql meta commands cause failure. The generated transaction pins standard-conforming string syntax locally; it changes no permanent setting.

Dependencies are existing reviewed private helpers and base-table/public-projection boundaries. The checked property file defines the Space picker used by the complex file. The revision file consumes property author/content helpers and asserts its anonymous revision-column boundary. A missing prerequisite must abort the whole candidate; do not bypass its guard or apply a subset ad hoc.

## Frontend-first deployment order

After the applicable review/merge approval, merge the compatible frontend and have the user **manually publish it first**. Verify the served revision and existing public complex amenities/name lookups before any SQL activation. Until the new view exists, these read-only catalogue consumers may query the same explicit safe columns on `property_complexes`, with `is_active = true` and existing RLS, only after an exact missing-`public_complex_catalog` error (`42P01` or `PGRST205`). Permission failures, transport failures, missing rows and unrelated schema errors never trigger this compatibility read. The independently authorized private-name query remains separate. Checked authoring RPC failures remain visible, isolated unavailable states; they never switch to raw employee writes.

Only after that frontend verification and every activation gate below may a separately authorized operator apply the reviewed atomic SQL. The transaction installs the safe view and removes the old raw public-read policy together. Each new catalogue request tries the view first, including after an earlier missing-view response; no persisted legacy-mode switch is used. Verify the public view path again after SQL activation and ensure intended operator clients are on the published frontend revision. Applying SQL before the compatible frontend would break older public readers; publishing the compatible frontend alone does not activate employee authoring. This document does not authorize merging, publishing or applying SQL.

## Stop gates before any application

1. **Exact final commit CI:** real isolated PostgreSQL suites for publication, operational ceilings, vendor trigger compatibility, complex publication and revisions; aggregate source typecheck/lint; synthetic employee/admin browser flows. Skipped local PostgreSQL tests are not a pass. Reconcile any test fixture failure against deployed metadata; do not weaken expectations merely to obtain green CI.
2. **Fresh read-only equivalence:** compare all source table/column/constraint, helper/function owner and ACL, trigger, policy, view and dependency assumptions against the target database. Verify no candidate-name collisions, unreviewed SECURITY DEFINER writers or broader grants. Earlier Lovable metadata established the missing meter table, zero Spaces/enforcement-off state, protected founder authority and vendor row-shape defect; it does not prove the later complex/revision changes are live-safe. No business-row reads are required for this metadata gate.
3. **Independent review and exact approval:** review the generated artifact, its ordered source hashes and rollback together. Obtain explicit approval for the exact DDL/RLS/RPC/grant/public-publisher changes and chosen optional delegation scope. General permission to inspect Lovable or finish UI work is insufficient.
4. **Separate pilot configuration decision:** only when employee connection is resumed, verify the intended employee, select one company and the intended Space name, and obtain exact approval for minimal company/Space membership and module actions. Do not alter the other company. Do not enable enforcement blindly or create a broad catch-all Space. Protected founder access remains intact; existing property-to-Space migration is unnecessary if this employee is authorized only to author new drafts. Any existing-property operational assignment needs its own approval.
5. **Supervised transaction and verification:** only after the above gates and approval, a separately authorized operator may apply the reviewed atomic artifact. Re-read metadata/grants afterward and test explicitly approved allowed/denied actor flows. Do not create live business records as QA without separate authorization. Require the verified, user-published compatible frontend before this transaction; afterward verify that catalogue reads use the new view. Missing checked RPCs remain visible failures, never raw employee-content fallbacks. The narrowly defined pre-view public catalogue compatibility read above grants no new authority.

No activation GO or live-workflow claim follows from this source assembly task. Stop on any mismatch or failed gate; preserve production data and founder authority.

## Fail-closed rollback

The rollback assembler creates one transaction in reverse consumer order: freeze property-revision RPCs, freeze complex RPCs, then freeze initial-property authoring RPCs and remove the optional platform-admin delegation policies if present. It restores the narrower owner/admin notification authority.

It retains canonical rows, author/scope/review metadata, revision proposals, audit records, restrictive task/operational/read/write/audit guards, safe catalogue projections and legacy publisher EXECUTE revocation. The vendor JSON compatibility repair remains in place. No destructive schema rollback, old broad MC grant restoration, employee/identity deletion or casual enforcement-off toggle is included. Company membership, permission revocation and Space cutover rollback remain separately approved administrative decisions.

The rollback assumes the full selected core transaction committed. If the activation transaction aborted, it left no committed partial activation to undo; verify that fact rather than blindly running rollback against absent functions.

## Verification for this assembler

- 33 focused source tests pass: exact input hashes, dependency order, one transaction in core/optional/rollback modes, byte preservation, quoted/nested transaction text, malformed input rejection, drift rejection, no access seeds, rollback scope and no file overwrite.
- Independent source review found and prompted repairs for CR-only line-comment boundaries and malformed transaction wrappers. Regression coverage includes both; current pinned SQL had neither malformed input.
- Targeted strict TypeScript checked against the repository's ES2020 target. ESLint has no errors for the generator/test source; the declaration file is typechecked and outside ESLint's configured extensions.
- No SQL database execution, live validation, migration registration, push, build or full-project typecheck was performed by this assembly task.

### Reviewed syntax repair (19 October 2026)

Reference `0ea175ea1887c45cbff3f21b91d535ddd3020038` adds parentheses around the three complex create/save/review CASE operands inside PL/pgSQL IF conditions. PostgreSQL treats an unparenthesized CASE THEN as the IF-expression delimiter, causing the observed CI setup syntax error ([PostgreSQL 16 expression reader](https://github.com/postgres/postgres/blob/REL_16_STABLE/src/pl/plpgsql/src/pl_gram.y#L2534-L2637)). Independent source review confirmed this narrow repair preserves all authorization/state conditions. Only the complex candidate checksum changed; all nine other input checksums were rechecked unchanged. The new source regression passes; a fresh real PostgreSQL CI result is still required.
