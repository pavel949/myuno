# WIP preservation checkpoint — 2026-10-25

This branch preserves local development for continuation in Claude Code. It is **not a ready release, activation approval or completed production acceptance**. The original PR #183 branch is frozen and is not updated by this checkpoint. No merge, deployment, production SQL, catalogue ACL or role change was performed as part of preservation.

Base local commit before preservation: `a8c851dc216b16edd85fd2939dfc631d5f6e8351`, including main `c640a9350078735b352b3f141c5a10611edde0e7` and earlier MC checkpoint commits. Functional work was stopped; preservation does not fix remaining defects or rerun development operations.

## Preserved source

- Managed property/complex create/read/save, actor-bound operations, durable creation request identities and recovery, source-only additive candidates and restrictive-stop rollback.
- Task command candidates, explicit per-property opt-in metadata, scoped create/assign/edit/complete gateways, task UI integration and isolated tests.
- Guest canonical reservation gateway/receipt, guest and manager list/queue/bulk consumer changes, source-only reservation candidate adapted from the existing PR160 contract, and synthetic PostgreSQL/browser fixtures.
- Media actor-change guards, authoring/property-editor/task/guest browser fixtures, source-contract tests and activation/firebreak notes.

No applied migration journal was changed. Candidate SQL is retained for review, not permission to execute. Historical hashes/test counts in earlier evidence documents describe earlier snapshots; **regenerate and independently review exact forward/rollback hashes for the final chosen batch**. The authoring generator and reservation packet are distinct dependency gates; do not apply one and assume every saved UI dependency is deployed.

## Verification limits

Saved isolated runs included passing authoring/property PostgreSQL and task-command tests, focused client/UI suites, and network-denying Chromium authoring/editor/task scenarios. A dedicated synthetic guest run exercised lost-response retry, pending receipt, manager confirm/cancel, guest isolation and hold release against an owned PostgreSQL cluster. These results are not production acceptance and do not certify the final combined working tree.

The narrow task type fix passed repository typecheck and 97 targeted unit tests at its checkpoint. Its standard build stopped at a receipt design precheck. The receipt was subsequently changed to the normal PageContainer primitive and design check passed, but **a final consolidated typecheck, complete unit/PostgreSQL suite and production build after all saved guest/task edits have not been certified**. Do not infer an all-green build from earlier scoped results. Existing lint warnings remain.

## Remaining release blockers

1. Review the final combined source and exact deployment equivalence; run all required checks, including real browser request and task scenarios.
2. Review and separately authorize database schema/RPC/RLS/ACL activation before publishing UI that calls undeployed contracts. Never replay the historical migration set.
3. The existing real resort/unit inventory needs an explicitly approved ID-preserving company/Space configuration. No duplicate properties, project, resort or invented employee/owner should be created.
4. The selected real inventory has no established ownership relation for the current reservation bridge. Company management is not ownership; do not substitute creator/manager/company IDs into an auth-user owner field.
5. Existing-property task opt-in and actual staff assignments are separate configuration approvals. Booking preparation on command-governed properties and nonzero task costs remain separate gates.
6. Browser media guards do not revoke an uploader's existing server-side custody of public bytes. Staff post-publication media custody is not certified.
7. Any controlled production smoke requires a separate exact plan; a reservation changes availability. Restrictive rollback freezes commands and preserves data/receipts/holds; it is not automatic undo or replay recovery.

## Excluded from Git

Private runtime inventory, actual company/member/property UUID manifests, access-impact reports, prepared real-data mapping SQL and private isolated mapping fixtures remain outside the repository in `/tmp`. Browser screenshots/logs, build outputs, caches and generated MCP/version artifacts are not part of the source checkpoint. No private file contents or real runtime identifiers are included here.
