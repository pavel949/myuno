# Multi-role & super-access regression checklist

Run after changes to `resolve_user_context`, `user_active_context`, role switcher UI, or guards.

## Admin / QA bundle

1. Enable QA multi-role bundle per [QA_MULTI_ROLE_SETUP.md](./QA_MULTI_ROLE_SETUP.md) or [MULTI_ROLE_SUPER_ACCESS.md](./MULTI_ROLE_SUPER_ACCESS.md).
2. Re-login and open the avatar menu: **Platform** section lists `admin`, `uno_team`, `staff`, `investor` (only roles you hold); **Workspaces** lists `vendor`, `owner`, `property_manager` as applicable.
3. Each role switch updates `user_active_context` and navigates to the role default path without errors.

## Resolver / policy

4. `resolve_user_context` (or client `useResolvedContext`) returns `role` / `mode` consistent with assignments and `role_context_policy` / `user_context_switch_grants` (see migration `20260420180000_role_context_policy_and_impersonation.sql`).
5. Non-admin users cannot activate contexts they are not granted; invalid combinations fall back safely (e.g. `user` mode) per server logic.

## View-as (admin)

6. **View as user (audit)** opens the dialog; resolving by email or profile UUID finds a profile and calls `enter`; duplicate self-target is rejected.
7. **PlatformViewAsBanner** shows while active; **Exit** clears session hint and logs `exit` via `log_platform_impersonation`.
8. RLS still applies: you remain authenticated as your admin user (no JWT swap).

## Guards

9. `RoleGuard` / `AdminGuard` / `VendorGuard` / `OwnerGuard`: access follows **server-resolved** role and permissions from `useResolvedContext`, not only client `active_role` (see component JSDoc).
10. `MCGuard`: admins pass; MC members need resolved MC context / active company as before.

## Smoke routes (optional)

- `/admin` — admin
- `/team` — uno_team / admin
- `/vendor` — vendor
- `/owner` — owner / MC / admin per guard
- `/mc` — MC / admin
- `/investor` — investor
