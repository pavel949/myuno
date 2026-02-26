
# Unified Task & Team Management Hub

## Problem Analysis

Currently, the system has fragmented task management:
- **CRM Tasks** (`/owner/tasks`) -- business tasks (calls, meetings, follow-ups) in a narrow mobile layout (`max-w-lg`)
- **Operational Tasks** (`/owner/operations`) -- property service tasks (check-in, cleaning, maintenance)
- **Staff Page** (`/owner/staff`) -- employee directory with no task visibility
- No way to see all tasks across both systems in one place
- CRM Tasks lack descriptions, comments, and subtask support
- Staff cards don't show assigned/pending tasks count

## Plan

### 1. Unified Task Hub (`/owner/tasks`)

Replace the narrow CrmTasksPage with a full-width task command center containing 3 tabs:

| Tab | Content |
|---|---|
| **Business Tasks** | CRM tasks (calls, meetings, deals) -- current crm_tasks data |
| **Operations** | Property operational tasks (cleaning, check-in/out, maintenance) -- current operational_tasks data |
| **All** | Combined feed sorted by due date, with type badges |

Key improvements:
- Full-width layout using `PageContainer` instead of `max-w-lg`
- Task cards show description, assigned person name, and linked property
- Click on a task opens a detail sheet with: edit fields, notes/comments text area, completion button
- Quick inline status toggle (pending -> in_progress -> done)
- Summary KPI row: Overdue / Today / This Week / Completed

### 2. Enhanced Task Creation

Upgrade the "New Task" sheet:
- Add **Description** textarea field
- Add toggle: "Business Task" vs "Operational Task" to route to correct table
- For operational tasks: show property selector + task type (cleaning, maintenance, etc.)
- For business tasks: show CRM type grid (call, meeting, follow-up) + contact/deal link
- Keep existing fields: priority, due date, assign to team member

### 3. Staff + Tasks Integration

On the Staff Page (`/owner/staff`), add to each StaffCard:
- A badge showing count of active tasks assigned to that staff member
- A "View Tasks" action in the dropdown menu that navigates to `/owner/tasks?assignee={staffId}`
- Task filter on the unified hub accepts `assignee` query param

### 4. Task Detail Sheet

New component `TaskDetailSheet.tsx`:
- Title (editable inline)
- Status selector (Pending / In Progress / Done)
- Priority selector
- Due date picker
- Assignee selector (from company members)
- Property link
- Description textarea
- Simple notes/activity log (stored in `crm_tasks.description` for business tasks)
- Complete / Delete actions

## Technical Details

### Files to Create
- `src/components/owner/tasks/UnifiedTaskHub.tsx` -- main 3-tab layout
- `src/components/owner/tasks/TaskDetailSheet.tsx` -- task detail/edit sheet
- `src/components/owner/tasks/TaskSummaryKPIs.tsx` -- overdue/today/week counters

### Files to Modify
- `src/pages/owner/CrmTasksPage.tsx` -- replace with unified hub wrapper
- `src/pages/owner/StaffPage.tsx` -- add task count badges and "View Tasks" action to StaffCard
- `src/hooks/useCrmTasks.ts` -- add `assigned_to` filter support and description update
- `src/components/owner/OwnerSidebar.tsx` -- consolidate: rename "Tasks" in Operations group, ensure single entry point

### No Database Changes Required
Both `crm_tasks` and `property_operational_tasks` tables already have the needed columns (status, priority, due_date, assigned_to, description, property_id). The plan uses existing data infrastructure.
