# Employee invitation candidate rollback

SOURCE ONLY; no activation has occurred.

Disable `TEAM_MEMBER_INVITES_ENABLED` and rebuild with `VITE_TEAM_MEMBER_ACCESS_ENABLED` absent/false. Keep the replacement endpoint fail-closed. Existing account/permission data remains unchanged by this rollback.

Never redeploy the former generated-password handler or restore `staff_members.id == auth.users.id` assumptions. Preserve platform invitation role/link partial-failure reporting. Reconcile any partially completed invitation through explicit administrator review; do not delete accounts, reset passwords, reactivate memberships or overwrite permissions automatically.

The companion SQL authoring/access candidate has its own independent rollback and approval gate. Disabling this invitation UI does not prove or change that SQL state.

## Async context safety follow-up

Keep actor/company lifetime invalidation, fixed in-memory request credentials, actual-dispatch cancellation and single-intent permission updates when disabling the feature. Do not restore shared-session continuation or paired stale checkbox writes. Cancellation is not rollback of already-dispatched requests; verify the original target before any approved retry. Keep the company scope-cutover prerequisite on invitations and new grants. Do not switch `operating_spaces_enforced` or revoke legitimate memberships as a rollback shortcut.
