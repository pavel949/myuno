# QA multi-role access

This project supports switching between platform roles from the avatar menu (`UserAvatarMenu`) after your account has the corresponding rows in the database.

## What was added

- **Schema**: `user_active_context.mode` may be `staff` (platform staff), distinct from MC mode `mc`.
- **RPC** `resolve_user_context`: resolves `staff` mode when the user has `staff` in `user_roles`.
- **Seed data**: fixed UUIDs for a QA vendor org, QA owner org, and QA management company (see migration `20260418120000_qa_multi_role_access.sql`).
- **Client**: `useUserContext` exposes `property_manager` separately from building `owner`; `staff` uses mode `staff` (no longer mapped to `mc`).
- **Automatic bundle** (recommended): table `qa_multi_role_auto_config` + RPC `ensure_multi_role_qa_bundle()`. After login, the app calls the RPC once per tab session; the database applies the same grants as the manual SQL when your email domain (or explicit user id) is allowlisted.

## Grant all roles to your user

### Option 0 — automatic (one SQL update per environment)

1. Apply migration `20260418121000_qa_multi_role_auto_rpc.sql` (included in normal `supabase db push` / deploy).
2. In Supabase SQL Editor, enable the bundle and set **either** allowed email domains (part after `@`) **or** explicit user UUIDs:

```sql
UPDATE public.qa_multi_role_auto_config
SET
  is_enabled = true,
  email_domain_suffixes = ARRAY['yourcompany.com'],  -- lowercase; repeat for multiple domains
  extra_user_ids = ARRAY[]::uuid[]                  -- optional: add specific auth user ids
WHERE id = 1;
```

3. Sign out and sign in (or open a new tab). The client runs `ensure_multi_role_qa_bundle` once; if `applied` is true in the JSON result, roles and org memberships are created idempotently.

Default row has `is_enabled = false` so production stays unchanged until you run the `UPDATE` above.

### Option A — edit migration (local / one deploy)

1. Open `supabase/migrations/20260418120000_qa_multi_role_access.sql`.
2. In the `DO $$` block, set `v_target_email` to your login email (lowercase), e.g. `'you@example.com'`.
3. Apply migrations (`supabase db push` or your pipeline).

If the email is not found in `auth.users`, the migration logs a notice and skips user grants (schema + seed orgs/MC still apply).

### Option B — SQL in Supabase Dashboard (after migration is applied)

Replace `:user_id` with your UUID from **Authentication → Users**.

```sql
-- Platform roles
INSERT INTO public.user_roles (user_id, role) VALUES
  (:user_id, 'admin'::public.app_role),
  (:user_id, 'uno_team'::public.app_role),
  (:user_id, 'staff'::public.app_role),
  (:user_id, 'vendor'::public.app_role)
ON CONFLICT (user_id, role) DO NOTHING;

-- Orgs + memberships (IDs match migration seed)
INSERT INTO public.org_members (org_id, user_id, role, is_active) VALUES
  ('a0000000-0000-4000-8000-000000000001', :user_id, 'owner', true),
  ('a0000000-0000-4000-8000-000000000002', :user_id, 'owner', true)
ON CONFLICT (org_id, user_id) DO UPDATE SET is_active = true, role = EXCLUDED.role;

INSERT INTO public.management_company_members (company_id, user_id, role, is_active) VALUES
  ('a0000000-0000-4000-8000-000000000003', :user_id, 'owner', true)
ON CONFLICT (company_id, user_id) DO UPDATE SET is_active = true, role = EXCLUDED.role;
```

## Smoke checklist (manual)

After login, open the avatar menu and switch roles; each navigation should load without `AccessDenied`:

| Role | Expected first route |
|------|----------------------|
| admin | `/admin` |
| uno_team | `/team` |
| staff | `/staff` |
| vendor | `/vendor` |
| owner | `/owner` |
| property_manager (УК) | `/mc` |

**Note:** RLS and RPC still enforce real permissions. If a screen loads but data is empty, check policies for that table — the UI switch only changes active context, not Supabase auth identity.

## Automated vs manual validation

End-to-end login flows are not run in this repo’s default CI for this feature. After applying grants to your user, run the table above manually once per environment and record:

| Check | Pass / Fail | Notes |
|-------|---------------|-------|
| admin → `/admin` | | |
| uno_team → `/team` | | |
| staff → `/staff` | | |
| vendor → `/vendor` | | |
| owner → `/owner` | | |
| property_manager → `/mc` | | |

`npx tsc --noEmit` was run successfully after the client changes.
