# Two selected INSERT-policy fixes

## Applied boundary

Only the two requested persisted findings were reviewed for remediation and status changes. Other findings were not fixed or ignored.

Applied through Lovable Cloud: `drizzle/migrations/0036_bind_selected_insert_policies_to_actor.sql`.

- Organizations: add nullable `created_by` without a backfill, then set the default to `auth.uid()`. Change the existing INSERT policy to authenticated callers whose inserted creator equals their own identity. Existing payloads may omit the field; a forged or NULL creator is denied. This does not redefine organization membership, verification or activation, nor does it claim that their separate policies are certified.
- Property activity: require `actor_id=auth.uid()` and the existing `can_manage_property_e28_private` helper and `actor_private_property_ceiling`. Generic employment and the scope ceiling alone do not authorize activity. Preserve the restrictive scope policy, SELECT policies, triggers and privileged writers.

All other policies on both tables compared unchanged against the pre-apply SELECT-only snapshot. No business rows changed, no notifications, invitation/Auth changes, enforcement activation, edge deployment or frontend publication.

## Evidence

- Live catalog before: both permissive INSERT policies checked only `auth.uid() IS NOT NULL`.
- Live catalog after: organization creator and property actor/object checks installed; role audience now `authenticated`.
- `created_by` is nullable with default `auth.uid()`; old rows were deliberately not assigned invented authorship.
- Recheck with `security.run_security_scan`: neither selected finding appears. Other scan findings left untouched.
- `bun run test src/lib/__tests__/selectedInsertPolicies.postgres.test.ts`: **12/12 PASS**, real PostgreSQL in an ephemeral Unix-socket-only cluster, no hosted credentials. Covers legacy NULL, default self creator, forged/NULL/anonymous creator, own/foreign property, forged/NULL actor, denied scope, existing admin capability and privileged service writer. Initial local initdb library-path issue corrected by using the actual package binaries; no production test writes.
- Isolated helper fixtures exercise policy composition, not full hosted owner/provider/staff workflow acceptance. Production verification is catalog-only; hosted business-write E2E remains unverified.
- Latest observed automatic build before final report: OK at 05:33:27 UTC.

## Stop gate

GO for the two narrowly selected policy replacements, not platform-wide security or E3. Existing generic creation defaults, membership bootstrap, inactive-vendor read-back and action-specific authorization are outside this scope and are not silently changed or certified. Emergency rollback in `docs/hardening/rollback/0036_selected_insert_containment.sql` fails closed instead of restoring broad INSERT; it is not applied.