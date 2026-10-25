-- Freeze checked managed-task mutations without restoring broad employee writes.
-- Retain task rows, completion evidence, audit, invoker guard and read ceilings.
BEGIN;
REVOKE EXECUTE ON FUNCTION public.create_managed_task_checked(uuid,uuid,uuid,text,text,date,text),
 public.assign_managed_task_checked(uuid,timestamptz,uuid),
 public.complete_managed_task_checked(uuid,timestamptz,text),
 public.edit_managed_task_checked(uuid,timestamptz,jsonb) FROM authenticated;
COMMIT;
