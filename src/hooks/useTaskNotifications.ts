import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCallback } from 'react';

/**
 * Creates in-app notifications for task events:
 * - task_assigned: when a task is assigned to someone
 * - task_status_request: when manager requests a status update
 * - task_reminder: from cron when due_date is approaching
 */
export function useTaskNotifications() {
  const { user } = useAuth();

  const notify = useCallback(async (params: {
    recipientId: string;
    type: 'task_assigned' | 'task_status_request' | 'task_reminder';
    title: string;
    body?: string;
    propertyId?: string | null;
    metadata?: Record<string, unknown>;
  }) => {
    if (!user || params.recipientId === user.id) return; // don't notify yourself
    try {
      await supabase.from('owner_notifications').insert({
        owner_id: params.recipientId,
        type: params.type,
        title: params.title,
        body: params.body ?? null,
        property_id: params.propertyId ?? null,
        metadata: params.metadata ?? {},
        is_read: false,
      } as any);
    } catch (e) {
      console.error('Failed to send task notification', e);
    }
  }, [user]);

  const notifyAssignment = useCallback((params: {
    assigneeId: string;
    taskTitle: string;
    taskId: string;
    taskSource: 'crm' | 'ops';
    propertyId?: string | null;
  }) => {
    return notify({
      recipientId: params.assigneeId,
      type: 'task_assigned',
      title: `Вам назначена задача: ${params.taskTitle}`,
      body: params.taskSource === 'crm' ? 'Бизнес-задача' : 'Операционная задача',
      propertyId: params.propertyId,
      metadata: { task_id: params.taskId, task_source: params.taskSource },
    });
  }, [notify]);

  const notifyStatusRequest = useCallback((params: {
    assigneeId: string;
    taskTitle: string;
    taskId: string;
    taskSource: 'crm' | 'ops';
    propertyId?: string | null;
    requesterName?: string;
  }) => {
    return notify({
      recipientId: params.assigneeId,
      type: 'task_status_request',
      title: `Запрос статуса: ${params.taskTitle}`,
      body: params.requesterName
        ? `${params.requesterName} запрашивает обновление по задаче`
        : 'Руководитель запрашивает обновление по задаче',
      propertyId: params.propertyId,
      metadata: { task_id: params.taskId, task_source: params.taskSource },
    });
  }, [notify]);

  return { notify, notifyAssignment, notifyStatusRequest };
}
