

# Employee Activity Log System

## Overview

Build a system to track and display what each team member does in the system. Directors/owners can see a full activity log per employee -- what pages they visit, what actions they take (creating tasks, editing properties, viewing contacts, etc.).

## Database Changes

### 1. Update RLS policy on `team_activity_log`

The current SELECT policy only allows admins (by `user_roles`) and the user themselves to see activity. We need MC directors/managers to also see activity of their company members:

```sql
DROP POLICY "Team members can view own activity" ON team_activity_log;

CREATE POLICY "View team activity"
ON team_activity_log FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY(ARRAY['admin'::app_role, 'staff'::app_role])
  )
  OR EXISTS (
    SELECT 1 FROM management_company_members AS mgr
    JOIN management_company_members AS mem
      ON mgr.company_id = mem.company_id
    WHERE mgr.user_id = auth.uid()
      AND mgr.role IN ('director', 'admin')
      AND mem.user_id = team_activity_log.user_id
  )
);
```

## Frontend: New Files

### 1. `src/hooks/useTeamActivityLog.ts`

Hook with two exports:

- **`useLogActivity()`** -- mutation that inserts into `team_activity_log`. Called automatically from key user actions (task creation, property edits, contact views, permission changes, etc.).
- **`useMemberActivityLog(userId)`** -- query that fetches the last 100 activity entries for a specific team member, ordered by `created_at` desc.

### 2. `src/components/owner/team/MemberActivitySheet.tsx`

A side-sheet (like `MemberPermissionsSheet`) showing a chronological activity feed for a selected staff member:

- Header with member name and "Activity Log" title
- Scrollable list of activity items, each showing:
  - Icon based on `action_type` (e.g., eye for "view", pencil for "edit", plus for "create")
  - Action label (RU/EN): "Viewed contact", "Created task", "Edited property", etc.
  - Entity info from `entity_type` + `entity_id`
  - Relative timestamp ("5 min ago", "2 hours ago")
- Empty state if no activity recorded

### 3. Automatic Activity Logging

Add `useLogActivity()` calls in key hooks:

- **`useCrmTasks.ts`** -- log when tasks are created/completed
- **`usePropertyCare.ts`** -- log when properties are edited
- **Sidebar navigation** -- log page visits via a lightweight wrapper

For the initial implementation, we'll add logging to the most critical operations and expand coverage over time.

## Frontend: Modified Files

### `src/pages/owner/StaffPage.tsx`

- Add "Activity Log" (`History` icon) item to the `StaffCard` dropdown menu
- Add state for `activityTarget` (selected staff member)
- Render `MemberActivitySheet` when a staff member is selected

## Action Type Mapping

| action_type | Entity Type | Label EN | Label RU |
|---|---|---|---|
| page.view | page | Viewed page | Просмотр страницы |
| task.create | task | Created task | Создал задачу |
| task.complete | task | Completed task | Завершил задачу |
| property.edit | property | Edited property | Редактировал объект |
| contact.view | contact | Viewed contact | Просмотрел контакт |
| permission.change | permission | Changed permissions | Изменил права |
| staff.edit | staff | Edited staff | Редактировал сотрудника |
| document.upload | document | Uploaded document | Загрузил документ |

## Technical Summary

| Action | File |
|---|---|
| Create | `src/hooks/useTeamActivityLog.ts` |
| Create | `src/components/owner/team/MemberActivitySheet.tsx` |
| Modify | `src/pages/owner/StaffPage.tsx` (add dropdown item + sheet) |
| Modify | `src/hooks/useCrmTasks.ts` (add activity logging on create/complete) |
| DB Migration | Update RLS policy on `team_activity_log` |

