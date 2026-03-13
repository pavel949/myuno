import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plane, MapPin, Phone, Calendar, Car } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type OrderStatus = Database['public']['Enums']['order_status'];

const STATUS_OPTIONS: OrderStatus[] = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];

const statusColors: Record<string, string> = {
  pending: 'bg-warning/10 text-warning',
  confirmed: 'bg-primary/10 text-primary',
  in_progress: 'bg-info/10 text-info',
  completed: 'bg-success/10 text-success',
  cancelled: 'bg-destructive/10 text-destructive',
};

export default function AdminTransfers() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-transfers', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select(`
          id, order_number, status, total_amount, currency, start_at, created_at, metadata,
          order_participants(name, phone, email, role),
          order_addresses(address_type, address_text)
        `)
        .eq('order_type', 'vehicle')
        .order('created_at', { ascending: false })
        .limit(100);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as OrderStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ orderId, newStatus }: { orderId: string; newStatus: OrderStatus }) => {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
      if (error) throw error;

      await supabase.from('order_status_history').insert({
        order_id: orderId,
        to_status: newStatus,
        reason: `Admin status update to ${newStatus}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-transfers'] });
      toast({ title: isRu ? 'Статус обновлён' : 'Status updated' });
    },
    onError: () => {
      toast({ title: isRu ? 'Ошибка обновления' : 'Update failed', variant: 'destructive' });
    },
  });

  // Filter only transfer-type orders (metadata.transfer_type === 'airport')
  const transferOrders = orders?.filter(o => {
    const meta = o.metadata as Record<string, unknown> | null;
    return meta?.transfer_type === 'airport' || meta?.direction;
  }) || [];

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-5 max-w-[1536px] mx-auto w-full">
      <div>
        <h1 className="text-2xl font-display font-bold">{isRu ? 'Трансферы' : 'Airport Transfers'}</h1>
        <p className="text-sm text-muted-foreground">{transferOrders.length} {isRu ? 'заказов' : 'orders'}</p>
      </div>

      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={isRu ? 'Все статусы' : 'All statuses'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isRu ? 'Все' : 'All'}</SelectItem>
            {STATUS_OPTIONS.map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : transferOrders.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          {isRu ? 'Нет заказов на трансфер' : 'No transfer orders yet'}
        </div>
      ) : (
        <div className="space-y-3">
          {transferOrders.map(order => {
            const meta = (order.metadata || {}) as Record<string, unknown>;
            const participants = order.order_participants as Array<{ name: string; phone: string | null; email: string | null; role: string }> | null;
            const addresses = order.order_addresses as Array<{ address_type: string; address_text: string }> | null;
            const primary = participants?.find(p => p.role === 'primary') || participants?.[0];
            const pickup = addresses?.find(a => a.address_type === 'pickup');
            const dropoff = addresses?.find(a => a.address_type === 'dropoff');
            const scheduledDate = order.start_at ? format(new Date(order.start_at), 'dd.MM.yyyy HH:mm') : '—';

            return (
              <div key={order.id} className="p-4 rounded-xl border border-border/50 bg-card space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">#{order.order_number}</span>
                    <Badge className={statusColors[order.status] || 'bg-muted text-muted-foreground'}>
                      {order.status}
                    </Badge>
                  </div>
                  <span className="font-bold text-lg">{order.currency} {order.total_amount?.toLocaleString()}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span>{scheduledDate}</span>
                  </div>
                  {meta.flight_number && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Plane className="w-4 h-4 shrink-0" />
                      <span>{meta.flight_number as string} · {(meta.terminal as string) === 'international' ? 'Int\'l' : 'Dom'}</span>
                    </div>
                  )}
                  {meta.vehicle_name && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Car className="w-4 h-4 shrink-0" />
                      <span>{meta.vehicle_name as string} · 👥{(meta.passengers as number) || 1}</span>
                    </div>
                  )}
                  {primary && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-4 h-4 shrink-0" />
                      <span>{primary.name} {primary.phone && `· ${primary.phone}`}</span>
                    </div>
                  )}
                  {pickup && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4 shrink-0 text-success" />
                      <span className="truncate">{pickup.address_text}</span>
                    </div>
                  )}
                  {dropoff && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4 shrink-0 text-destructive" />
                      <span className="truncate">{dropoff.address_text}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-border/30">
                  <span className="text-xs text-muted-foreground mr-auto">
                    {isRu ? 'Статус:' : 'Status:'}
                  </span>
                  <Select
                    value={order.status}
                    onValueChange={(val) => updateStatus.mutate({ orderId: order.id, newStatus: val as OrderStatus })}
                  >
                    <SelectTrigger className="w-[160px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
