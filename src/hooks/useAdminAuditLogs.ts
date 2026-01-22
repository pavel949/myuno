import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AuditLogEntry {
  id: string;
  admin_id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  old_data: unknown;
  new_data: unknown;
  created_at: string;
  admin_name?: string | null;
  admin_email?: string | null;
}

// Map action types to display info
export const ACTION_CONFIG: Record<string, { labelEn: string; labelRu: string; color: string }> = {
  'booking.created': { labelEn: 'New booking', labelRu: 'Новый заказ', color: 'text-success' },
  'booking.confirmed': { labelEn: 'Booking confirmed', labelRu: 'Заказ подтверждён', color: 'text-success' },
  'booking.cancelled': { labelEn: 'Booking cancelled', labelRu: 'Заказ отменён', color: 'text-destructive' },
  'provider.registered': { labelEn: 'Provider registered', labelRu: 'Провайдер зарегистрирован', color: 'text-info' },
  'provider.approved': { labelEn: 'Provider approved', labelRu: 'Провайдер одобрен', color: 'text-success' },
  'provider.rejected': { labelEn: 'Provider rejected', labelRu: 'Провайдер отклонён', color: 'text-destructive' },
  'content.approved': { labelEn: 'Content approved', labelRu: 'Контент одобрен', color: 'text-primary' },
  'content.rejected': { labelEn: 'Content rejected', labelRu: 'Контент отклонён', color: 'text-destructive' },
  'user.created': { labelEn: 'User registered', labelRu: 'Пользователь зарегистрирован', color: 'text-info' },
  'property.created': { labelEn: 'Property added', labelRu: 'Объект добавлен', color: 'text-info' },
  'property.approved': { labelEn: 'Property approved', labelRu: 'Объект одобрен', color: 'text-success' },
  'order.created': { labelEn: 'New order', labelRu: 'Новый заказ', color: 'text-success' },
  'order.completed': { labelEn: 'Order completed', labelRu: 'Заказ выполнен', color: 'text-success' },
  'payout.processed': { labelEn: 'Payout processed', labelRu: 'Выплата обработана', color: 'text-primary' },
  'ticket.created': { labelEn: 'New ticket', labelRu: 'Новый тикет', color: 'text-warning' },
  'ticket.resolved': { labelEn: 'Ticket resolved', labelRu: 'Тикет решён', color: 'text-success' },
};

export function useAdminAuditLogs(limit: number = 10) {
  return useQuery({
    queryKey: ['admin-audit-logs', limit],
    queryFn: async (): Promise<AuditLogEntry[]> => {
      // Fetch audit logs
      const { data: logs, error } = await supabase
        .from('admin_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      if (!logs || logs.length === 0) return [];

      // Get admin profiles
      const adminIds = [...new Set(logs.map(l => l.admin_id).filter(Boolean))];
      let adminMap: Record<string, { full_name: string | null; email: string | null }> = {};
      
      if (adminIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', adminIds);

        adminMap = (profiles || []).reduce((acc, p) => {
          acc[p.id] = { full_name: p.full_name, email: p.email };
          return acc;
        }, {} as Record<string, { full_name: string | null; email: string | null }>);
      }

      return logs.map(log => ({
        ...log,
        admin_name: log.admin_id ? adminMap[log.admin_id]?.full_name : null,
        admin_email: log.admin_id ? adminMap[log.admin_id]?.email : null,
      }));
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

// Hook for real-time subscription to new audit logs
export function useAdminAuditLogsRealtime(onNewLog?: (log: AuditLogEntry) => void) {
  return useQuery({
    queryKey: ['admin-audit-logs-subscription'],
    queryFn: async () => {
      // This is just for setting up the subscription
      const channel = supabase
        .channel('admin-audit-logs-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'admin_audit_logs',
          },
          (payload) => {
            if (onNewLog && payload.new) {
              onNewLog(payload.new as AuditLogEntry);
            }
          }
        )
        .subscribe();

      return { channel };
    },
    enabled: !!onNewLog,
  });
}
