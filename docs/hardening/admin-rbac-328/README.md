# Administrative role hardening after PR #328 (review only)
Base 454a4431c256ae6c7ca1d19ffd3ff0466598eb55. Branch changes are NOT a deployed fix. Lovable drafts/preview share production data; do not use them for mutation QA.
## Contract
* Both existing admin identities remain equal; no superadmin enum, email allowlist or account/role seeding.
* Protected admin/uno_team rows cannot be written directly by browser actors. Generic role endpoint refuses either protected role; team grant/revoke use checked RPC and atomic audit/permission cleanup. New team invitations use the same checked grant.
* Only active platform admins pass the new function gates. Nonplatform generic role changes are checked/audited transactionally; existing direct nonprotected business role consumers remain, and must be reviewed separately before claiming all role changes are audited.
* Profile lifecycle fields reject direct browser modification. Permanent deletion is disabled through generic endpoint; archive retains data. Auth and DB operations are not atomic; persistent audit intent and explicit incomplete receipt require manual reconciliation.
* Audit log history cannot be edited/deleted by clients; identity events cannot be forged. Existing non-identity client audit writers retain actor-bound insert until individually migrated.
## Safe acceptance / NO-GO
1. Run full isolated PostgreSQL and unit suite; verify both admin identities, team, ordinary, guest, revoked actor, case-normalized self target, direct INSERT/UPDATE/DELETE, old and new row checks and audit rollback.
2. Inventory all RPCs/service-role role writers and existing team-permission races, profile/session lifecycle dependencies, policy/grant drift and remaining direct ordinary role paths. Verify full Auth ban/reactivation, session invalidation and partial intent reconciliation with synthetic identities in truly isolated environment. No real emails.
3. Browser RU/EN/TH 375/390/430/1440: roles error/retry, team add/remove, protected target and archive; preserve member onboarding. Verify design-system register using canonical generator, not hand-edited hashes.
4. Separate product decision for owner-only Superadmin authority and guarded last-admin recovery; do not infer an identity or seed any roles. Existing app_role enum has no superadmin.
5. Obtain explicit separate approval for migration, Edge Function and UI activation. Before applying, compare exact live schema/grants/function manifest to candidate; confirm isolated evidence; prepare security-preserving rollback. SQL deliberately outside migration paths. Migration must be versioned using approved project migration tooling, then matched bundle deployment and read-back evidence. No merge or publish on basis of this review branch alone.
## Rollback
Pause affected admin controls/edge functions; retain restrictive ceilings, immutable audit and protected lifecycle fields. Never restore the old FOR ALL protected-role write behavior; revoke new RPC EXECUTE only if the affected UI/edge routes are paused. Reconcile pending lifecycle intent receipts manually. No real records are changed by this PR.

## Staged production activation plan (24 November 2026)
The owner explicitly authorized SQL activation. The tested full candidate passed all 12 isolated PostgreSQL tests and the complete 6043-test run on 07473219. Production still serves the old UNO Team client that writes membership directly. Applying the full protected-role ceiling before publishing the replacement would break legitimate team management, including a legacy zero-row delete reporting success. Therefore:
- `phase1.candidate.sql`: install the same checked functions, active-admin ceilings, lifecycle and audit protections; restrict direct role mutation for admin only. Existing uno_team membership flow is intentionally retained until phase 2. This is a staged restriction of the tested SQL; not an independent full Auth test.
- `phase2.candidate.sql`: after matched UI/Edge publication, widen the three ceilings to admin and uno_team. Do not replay rls.candidate.sql on an activated database.
- Record exact executed SQL, observed function ACLs/policies, unchanged aggregate roles and cutover status. No direct role assignment, no production DML tests, no invented Superadmin.
- One unrelated inherited lint failure in chat-messages.ts is corrected without changing the regex match set. Full latest CI remains required before release.
