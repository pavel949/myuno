# Manual experience publication boundary repair

Not applied. Not an auto migration. Review and activate separately from application deployment.

## Exact scope
One transaction changes `listings_public_read` only for experiences, adds the same gate to existing public SECURITY DEFINER discovery/count RPCs, and replaces the recursive provider UPDATE condition with owner matching plus a SECURITY INVOKER immutable-field guard. Admin ALL and other policies remain unchanged. Non-experience public read semantics intentionally remain unchanged, including pre-existing RPC behavior.

Experience public reads require active + approved + attributes.status=published and exclude explicit temporarily_closed/permanently_closed/closed. Unknown operating status is not a claim of being open. Providers keep their existing own-draft read capability. Admin keeps existing management rights. Provider descriptive updates are allowed; system/moderation/identity and unknown future keys remain immutable. This does not fix or certify the legacy supplier UI payload.

## Release gate
- Exact-head isolated PostgreSQL role harness must pass; this is not full-schema Supabase staging.
- Independent review of exact SQL and current production definitions/grants/triggers required.
- Compare each marked apply.sql body to the corresponding tested fixture, plus fixture-sha256.json; no last-minute untested SQL edits.
- Read-only preflight must confirm captured policy/function/trigger definitions and absence of the new guard names. If changed, stop and re-review; do not overwrite blindly.
- Preflight and activation must share a controlled DDL window: stop on ANY definition/owner/grant/role drift, prevent parallel DDL until commit, and repeat read-only preflight immediately before activation. Separate preflight is not an atomic drift lock.
- Confirm administrator has_role and provider ownership contracts still match snapshots. Preserve live definitions for incident diagnosis, not as permission to restore insecure predicates.
- Verify transaction privileges and deployment identity before activation. Application deploy does not activate this file.

## Post-activation acceptance
Anonymous and ordinary member: no drafts, explicitly closed or unapproved experiences in direct listings, detail, resolver or count. Provider: own draft readable; another draft not readable; own descriptive update succeeds, ownership/moderation/operational edits denied. Admin: read/edit draft and system fields succeeds. Existing timestamp still updates. No destructive test of real user records: use agreed synthetic test rows and cleanup, or rollback-contained test transaction under correct roles. Record exact SQL hash, actor, time, results and rollback decision.

## Fail-closed recovery
Do not restore the old leaking read/RPC definitions or recursive UPDATE policy. containment.sql disables provider UPDATE while leaving administrator policy and guard in place. Public restrictive gates remain. Recheck current policy set first, because permissive policies combine with OR. If public discovery itself malfunctions, disable that surface while retaining database restrictions, then investigate. No automatic broad permission restoration.

## Explicit unresolved issues
Supplier editor uses mismatched legacy view fields; no end-to-end certification. Existing provider INSERT policy, broad TRUNCATE/TRIGGER grants, public-column minimisation and trusted-definer mutation paths need separate audits. This narrow repair does not establish complete commercial/security readiness. There is no accessible verified staging environment.
