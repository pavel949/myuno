

# Plan: Admin User Management

## Problem
The `profiles` table has no `status` column — there's no field to track whether a user is active, suspended, or deactivated. The `ControlUsersTab` component only has a "Reset Password" button with no management actions. There are no RLS policies allowing admins to UPDATE profiles, and no backend function to manage auth-level user status (ban/delete).

## Solution

### 1. Database Migration
- Add `status` column to `profiles` table: `TEXT DEFAULT 'active'` (values: `active`, `suspended`, `deactivated`)
- Add `suspended_at`, `deactivated_at`, `status_changed_by` columns for audit
- Add admin UPDATE policy on `profiles` for users with `admin` role
- Log status changes to `admin_audit_logs`

### 2. Edge Function: `admin-manage-user`
Create a new edge function that uses the **service role** key to perform auth-level operations:
- **suspend** — sets `profiles.status = 'suspended'`, calls `auth.admin.updateUserById()` with `ban_duration: '876000h'` (100 years)
- **activate** — sets `profiles.status = 'active'`, removes ban
- **deactivate** — sets `profiles.status = 'deactivated'`, bans in auth
- **delete** — soft-deletes by setting status to `deactivated` (or hard-delete via `auth.admin.deleteUser()` with confirmation)
- **update_roles** — add/remove roles in `user_roles` table
- All operations require the caller to have `admin` role (verified server-side)
- All operations write to `admin_audit_logs`

### 3. Update `ControlUsersTab` UI
Expand the user detail panel with action buttons:
- **Status badge** showing active/suspended/deactivated with color coding
- **Activate / Suspend / Deactivate** buttons (contextual based on current status)
- **Delete User** button with confirmation dialog
- **Role management** — toggle roles (add/remove `vendor`, `owner`, `staff`, etc.)
- Bulk actions using the existing `BulkActionsBar` component for multi-select operations
- Toast notifications for success/error feedback
- Refetch user list after any action

### 4. Security
- Edge function validates caller is admin via `has_role()` check server-side
- Prevents admin from deactivating/deleting themselves
- All changes logged with actor ID, action type, and timestamp

### Files to Create/Edit
- `supabase/migrations/new_migration.sql` — add status columns + RLS
- `supabase/functions/admin-manage-user/index.ts` — new edge function
- `src/components/admin/control/ControlUsersTab.tsx` — full UI rebuild with management actions

