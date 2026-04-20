# Multi-role super access (system admin)

This complements [QA_MULTI_ROLE_SETUP.md](./QA_MULTI_ROLE_SETUP.md) with the **goal**: one account can open every major workspace (admin, team, staff, vendor, owner, MC) for support and QA.

## Enable automatic grants (recommended)

1. In Supabase SQL (or migration), enable the allowlist for your org or user id:

```sql
UPDATE public.qa_multi_role_auto_config
SET
  is_enabled = true,
  email_domain_suffixes = ARRAY['yourcompany.com']::text[],
  extra_user_ids = ARRAY[]::uuid[]
WHERE id = 1;
```

Or set `extra_user_ids` to your `auth.users.id` for a single account.

2. Sign out and sign in (or new tab). The app calls `ensure_multi_role_qa_bundle()` once per session ([useEnsureMultiRoleQaBundle.ts](../src/hooks/useEnsureMultiRoleQaBundle.ts)).

3. Open the avatar menu → you should see switches for Provider, Owner, MC, Admin, Team, Staff (depending on grants).

## Manual grants (same as QA doc)

If auto-bundle is off, use the SQL in [QA_MULTI_ROLE_SETUP.md](./QA_MULTI_ROLE_SETUP.md) Option B.

## Validation checklist (smoke)

After login, switch context from the avatar menu and confirm the first route loads without `AccessDenied`:

| Context | Expected first route |
|---------|----------------------|
| Admin / super-view | `/admin` |
| Team (uno_team) | `/team` |
| Staff | `/staff` |
| Vendor | `/vendor` |
| Owner (building) | `/owner` |
| MC (property_manager) | `/mc` |

**Note:** RLS still applies. Empty data on a screen usually means policy on that table, not a broken switch.

## Policy model

Server-side rules live in `role_context_policy` and `resolve_user_context()` — see migration `*_role_context_policy*.sql`. Admins can record explicit grants in `user_context_switch_grants` when a user must be allowed outside normal membership rules.

## Platform “view as” (audit-only UX)

Admins can start a **view-as** session (logged in `platform_impersonation_log`) for support. This does **not** change Supabase `auth.uid()`; it is a UI/session hint plus audit trail. True user JWT impersonation would require a separate Edge Function with service role — not enabled by default.
