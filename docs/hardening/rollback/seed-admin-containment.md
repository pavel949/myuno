# Exposed test administrator containment — 2026-11-27

Owner approved fixing the exact compromised seeded administrator after the proposed disable-account action. Scope: only that identity, not other security findings or test users.

## Contract and sequence

1. Isolated local tests must pass for `docs/hardening/seed-admin-containment.sql`.
2. Apply the forward constraint and remove only the exposed identity's admin role, preserving another active admin. Existing guards, policies, writers and all normal administrator accounts remain unchanged.
3. Use the existing authorized `admin-manage-user` suspend action as the owner. Its platform-admin protection remains intact: the retired test identity is no longer an administrator. Do not introduce an admin-protection bypass or edit managed auth tables.
4. Verify the identity is banned and has no admin role, and that the owner's active admin authority remains. Do not test the exposed password or retrieve its value.

The historical applied seed remains immutable. Its obsolete shared credential must not be reused or moved into a secret as a working administrator password. The containment constraint prevents the exposed identity from regaining its admin role, including via accidental seed replay. Do not replay the seed.

## Security-preserving rollback

Never restore the exposed credential, admin role, or unban the compromised test identity. If unrelated operation regresses, revert only unrelated code using a forward change; keep this narrow ban/constraint. Provision any replacement test identity outside production with unique credentials via the supported account flow and explicit approval, not this historical seed. No account deletion or financial/inventory mutation is required.

Stop after verification with a GO/NO-GO report for this selected containment. This grants no E3, Order Mutation, URL-import, publication or further migration permission.