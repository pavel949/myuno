export const TASK_COMPLETED_STATUSES = ['completed', 'done'] as const;
export const TASK_CLOSED_STATUSES = ['completed', 'done', 'cancelled'] as const;
export const CRM_TASK_ACTIVE_STATUSES = ['pending', 'in_progress'] as const;

export function isTaskCompletedStatus(status: string | null | undefined): boolean {
  if (!status) return false;
  return (TASK_COMPLETED_STATUSES as readonly string[]).includes(status);
}

export function isTaskClosedStatus(status: string | null | undefined): boolean {
  if (!status) return false;
  return (TASK_CLOSED_STATUSES as readonly string[]).includes(status);
}

export function isCrmTaskActiveStatus(status: string | null | undefined): boolean {
  if (!status) return false;
  return (CRM_TASK_ACTIVE_STATUSES as readonly string[]).includes(status);
}

