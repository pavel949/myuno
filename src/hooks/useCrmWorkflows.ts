/**
 * @module useCrmWorkflows
 * CRUD hooks for crm_workflows and crm_workflow_actions
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { typedFrom } from '@/lib/untypedTables';

export interface CrmWorkflow {
  id: string;
  company_id: string;
  name: string;
  trigger_type: string;
  trigger_config: Record<string, unknown>;
  is_active: boolean;
  created_by: string;
  created_at: string;
}

export interface CrmWorkflowAction {
  id: string;
  workflow_id: string;
  action_order: number;
  action_type: string;
  action_config: Record<string, unknown>;
  delay_minutes: number;
}

export interface WorkflowWithActions extends CrmWorkflow {
  actions: CrmWorkflowAction[];
}

export const TRIGGER_TYPES = [
  { value: 'deal_created', labelEn: 'Deal Created', labelRu: 'Сделка создана' },
  { value: 'deal_stage_changed', labelEn: 'Deal Stage Changed', labelRu: 'Стадия сделки изменена' },
  { value: 'deal_won', labelEn: 'Deal Won', labelRu: 'Сделка выиграна' },
  { value: 'deal_lost', labelEn: 'Deal Lost', labelRu: 'Сделка проиграна' },
  { value: 'contact_created', labelEn: 'Contact Created', labelRu: 'Контакт создан' },
  { value: 'contact_updated', labelEn: 'Contact Updated', labelRu: 'Контакт обновлён' },
  { value: 'activity_logged', labelEn: 'Activity Logged', labelRu: 'Активность записана' },
] as const;

export const ACTION_TYPES = [
  { value: 'send_email', labelEn: 'Send Email', labelRu: 'Отправить email' },
  { value: 'create_task', labelEn: 'Create Task', labelRu: 'Создать задачу' },
  { value: 'update_field', labelEn: 'Update Field', labelRu: 'Обновить поле' },
  { value: 'send_notification', labelEn: 'Send Notification', labelRu: 'Отправить уведомление' },
  { value: 'assign_owner', labelEn: 'Assign Owner', labelRu: 'Назначить ответственного' },
  { value: 'enroll_sequence', labelEn: 'Enroll in Sequence', labelRu: 'Добавить в последовательность' },
  { value: 'webhook', labelEn: 'Webhook', labelRu: 'Вебхук' },
] as const;

export function useCrmWorkflows(companyId: string | undefined) {
  return useQuery({
    queryKey: ['crm-workflows', companyId],
    queryFn: async (): Promise<WorkflowWithActions[]> => {
      const { data: workflows, error } = await typedFrom('crm_workflows')
        .select('*')
        .eq('company_id', companyId!)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const ids = (workflows || []).map((w: { id: string }) => w.id);
      if (ids.length === 0) return [];

      const { data: actions, error: aErr } = await typedFrom('crm_workflow_actions')
        .select('*')
        .in('workflow_id', ids)
        .order('action_order');
      if (aErr) throw aErr;

      const actionMap = new Map<string, CrmWorkflowAction[]>();
      for (const a of (actions || []) as CrmWorkflowAction[]) {
        const arr = actionMap.get(a.workflow_id) || [];
        arr.push(a);
        actionMap.set(a.workflow_id, arr);
      }

      return (workflows as CrmWorkflow[]).map(w => ({
        ...w,
        actions: actionMap.get(w.id) || [],
      }));
    },
    enabled: !!companyId,
  });
}

export function useCreateWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (wf: Omit<CrmWorkflow, 'id' | 'created_at'>) => {
      const { data, error } = await typedFrom('crm_workflows').insert(wf).select().single();
      if (error) throw error;
      return data as CrmWorkflow;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-workflows'] }),
    onError: (err: Error) => {
      import('sonner').then(({ toast }) => toast.error(err.message || 'Failed to create workflow'));
    },
  });
}

export function useUpdateWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CrmWorkflow> & { id: string }) => {
      const { error } = await typedFrom('crm_workflows').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-workflows'] }),
    onError: (err: Error) => {
      import('sonner').then(({ toast }) => toast.error(err.message || 'Failed to update workflow'));
    },
  });
}

export function useDeleteWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await typedFrom('crm_workflows').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-workflows'] }),
    onError: (err: Error) => {
      import('sonner').then(({ toast }) => toast.error(err.message || 'Failed to delete workflow'));
    },
  });
}

export function useUpsertWorkflowActions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ workflowId, actions }: { workflowId: string; actions: Omit<CrmWorkflowAction, 'id'>[] }) => {
      // Safer upsert: verify delete succeeded before inserting
      const { error: delErr } = await typedFrom('crm_workflow_actions')
        .delete()
        .eq('workflow_id', workflowId);
      if (delErr) throw new Error(`Failed to clear old actions: ${delErr.message}`);

      if (actions.length > 0) {
        const { error: insertErr } = await typedFrom('crm_workflow_actions').insert(actions);
        if (insertErr) throw new Error(`Failed to save new actions: ${insertErr.message}`);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-workflows'] }),
    onError: (err: Error) => {
      import('sonner').then(({ toast }) => toast.error(err.message || 'Failed to update workflow actions'));
    },
  });
}
