

# Simplified Team Member Onboarding & Permission Management

## Overview

One-click team member creation: Director enters name + email + role, the system auto-creates an account with login credentials and sends a welcome email. Full suspend/delete and granular permission controls from the Staff page.

## Database Changes

### 1. New table: `team_member_permissions`

Stores module-level access per MC member:

```text
| Column     | Type    | Purpose                          |
|------------|---------|----------------------------------|
| id         | uuid PK | Primary key                      |
| company_id | uuid FK | management_companies reference   |
| user_id    | uuid    | The team member                  |
| module     | text    | Module key                       |
| can_view   | boolean | Read access (default true)       |
| can_edit   | boolean | Write access (default false)     |
| granted_by | uuid    | Who set this                     |
| updated_at | timestamptz | Last update                  |
```

Modules: `properties`, `finance`, `crm`, `tasks`, `bookings`, `reports`, `staff`

RLS: MC directors/admins can read/write permissions for their company. Members can read their own permissions.

## Backend: Edge Function `invite-team-member`

A new edge function that:

1. Validates caller is `director` or `admin` in the specified MC (via `management_company_members`)
2. Creates auth user via `auth.admin.createUser()` with a generated 16-char password
3. Creates a `profiles` row (full_name, phone)
4. Inserts into `user_roles` with `staff` role
5. Inserts into `management_company_members` with selected role
6. Inserts default `team_member_permissions` based on role
7. Sends welcome email via the existing `send-email` function with login URL, email, and temporary password
8. Returns created user ID

## Frontend Changes

### 1. New: `AddTeamMemberDialog.tsx`

Single-step dialog replacing the multi-step `InviteTeamMemberDialog`:
- Full Name (required)
- Email (required)
- Phone (optional)
- Role selector: Director / Manager / Staff / Accountant
- On submit: calls `invite-team-member` edge function, shows success toast

### 2. New: `MemberPermissionsSheet.tsx`

Side sheet with a grid of toggle switches for each module (Properties, Finance, CRM, Tasks, Bookings, Reports, Staff) with View/Edit columns. Saves to `team_member_permissions` table.

### 3. New: `useTeamPermissions.ts`

Hook that:
- Fetches current user's permissions from `team_member_permissions`
- Provides `canAccess(module, action)` helper
- Used by sidebar to hide restricted modules

### 4. Modified: `StaffPage.tsx`

- Replace "+" button to open the new `AddTeamMemberDialog`
- Add dropdown actions: **Edit Permissions**, **Suspend** (sets `is_active=false` on MC member), **Delete** (removes MC membership)
- Suspend action also calls edge function to disable auth user login

### 5. Modified: `OwnerSidebar.tsx`

- Filter sidebar items based on `useTeamPermissions` -- hide modules the staff member cannot access

## Security

- Edge function uses `SUPABASE_SERVICE_ROLE_KEY` for admin user creation (already available by default)
- Caller authorization checked via `management_company_members` role before any action
- RLS on `team_member_permissions` prevents cross-company access
- Generated passwords are 16 chars with mixed case, digits, and symbols

## Files Summary

| Action  | File |
|---------|------|
| Create  | `supabase/functions/invite-team-member/index.ts` |
| Create  | `src/components/owner/team/AddTeamMemberDialog.tsx` |
| Create  | `src/components/owner/team/MemberPermissionsSheet.tsx` |
| Create  | `src/hooks/useTeamPermissions.ts` |
| Modify  | `src/pages/owner/StaffPage.tsx` |
| Modify  | `src/components/owner/OwnerSidebar.tsx` |
| DB Migration | Create `team_member_permissions` table + RLS |

