import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  old_data?: Record<string, unknown>;
  new_data?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  // Joined
  admin_email?: string;
  admin_name?: string;
}

interface UseAuditLogsOptions {
  entityType?: string;
  entityId?: string;
  adminId?: string;
  action?: string;
  limit?: number;
  offset?: number;
}

export function useAuditLogs(options: UseAuditLogsOptions = {}) {
  const { entityType, entityId, adminId, action, limit = 50, offset = 0 } = options;

  return useQuery({
    queryKey: ['audit-logs', entityType, entityId, adminId, action, limit, offset],
    queryFn: async (): Promise<{ logs: AuditLog[]; total: number }> => {
      let query = supabase
        .from('admin_audit_logs')
        .select('*, profiles!admin_audit_logs_admin_id_fkey(email, full_name)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (entityType) {
        query = query.eq('entity_type', entityType);
      }
      if (entityId) {
        query = query.eq('entity_id', entityId);
      }
      if (adminId) {
        query = query.eq('admin_id', adminId);
      }
      if (action) {
        query = query.ilike('action', `%${action}%`);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const logs = (data || []).map((log: any) => ({
        ...log,
        admin_email: log.profiles?.email,
        admin_name: log.profiles?.full_name,
      })) as AuditLog[];

      return { logs, total: count || 0 };
    },
  });
}

// Helper to format action for display
export function formatAuditAction(action: string): { label: string; color: string } {
  const actionMap: Record<string, { label: string; color: string }> = {
    create: { label: 'Создание', color: 'bg-success/10 text-success' },
    update: { label: 'Изменение', color: 'bg-primary/10 text-primary' },
    delete: { label: 'Удаление', color: 'bg-red-100 text-red-800' },
    approve: { label: 'Одобрение', color: 'bg-success/10 text-success' },
    reject: { label: 'Отклонение', color: 'bg-accent/10 text-accent' },
    verify: { label: 'Верификация', color: 'bg-primary/10 text-primary' },
    suspend: { label: 'Приостановка', color: 'bg-accent/10 text-accent' },
    activate: { label: 'Активация', color: 'bg-success/10 text-success' },
  };

  const key = action.toLowerCase();
  for (const [k, v] of Object.entries(actionMap)) {
    if (key.includes(k)) return v;
  }

  return { label: action, color: 'bg-gray-100 text-gray-800' };
}

// Format entity type for display
export function formatEntityType(entityType?: string): string {
  const typeMap: Record<string, string> = {
    provider: 'Провайдер',
    service: 'Услуга',
    property: 'Объект',
    project: 'Проект',
    user: 'Пользователь',
    booking: 'Бронирование',
    order: 'Заказ',
    product: 'Товар',
    vendor: 'Вендор',
    contract: 'Контракт',
  };

  return entityType ? (typeMap[entityType] || entityType) : '—';
}
