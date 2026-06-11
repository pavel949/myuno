import { useEffect, useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plane, MapPin, Phone, Calendar, Car, MessageCircle, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type OrderStatus = Database['public']['Enums']['order_status'];

const STATUS_FILTERS: Array<{ id: string; labelEn: string; labelRu: string }> = [
  { id: 'active', labelEn: 'Active', labelRu: 'Активные' },
  { id: 'pending', labelEn: 'Pending', labelRu: 'Ожидают' },
  { id: 'confirmed', labelEn: 'Confirmed', labelRu: 'Подтверждены' },
  { id: 'completed', labelEn: 'Completed', labelRu: 'Выполнены' },
  { id: 'all', labelEn: 'All', labelRu: 'Все' },
];

const statusColors: Record<string, string> = {
  pending: 'bg-warning/10 text-warning',
  confirmed: 'bg-primary/10 text-primary',
  in_progress: 'bg-info/10 text-info',
  completed: 'bg-success/10 text-success',
  cancelled: 'bg-destructive/10 text-destructive',
};

export default function OperatorTransfers() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>('active');

  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ['operator-transfers', filter],
    queryFn: async () => {
      let q = supabase
        .from('orders')
        .select(`
          id, order_number, status, total_amount, currency, start_at, created_at, metadata,
          order_participants(name, phone, email, role),
          order_addresses(address_type, address_text),
          order_translations(field, lang, value)
        `)
        .eq('order_type', 'vehicle')
        .order('start_at', { ascending: true, nullsFirst: false })
        .limit(200);

      if (filter === 'active') q = q.in('status', ['pending', 'confirmed', 'in_progress'] as OrderStatus[]);
      else if (filter !== 'all') q = q.eq('status', filter as OrderStatus);

      const { data, error } = await q;
      if (error) throw error;
      return (data || []).filter((o) => {
        const meta = o.metadata as Record<string, unknown> | null;
        return meta?.transfer_type === 'airport' || meta?.direction || meta?.flight_number;
      });
    },
    refetchInterval: 60_000,
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('operator-transfers-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: 'order_type=eq.vehicle' }, () => {
        queryClient.invalidateQueries({ queryKey: ['operator-transfers'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const updateStatus = useMutation({
    mutationFn: async ({ orderId, newStatus }: { orderId: string; newStatus: OrderStatus }) => {
      const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
      if (error) throw error;
      await supabase.from('order_status_history').insert({
        order_id: orderId,
        to_status: newStatus,
        reason: `Operator update → ${newStatus}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operator-transfers'] });
      toast.success('Статус обновлён');
    },
    onError: () => toast.error('Ошибка обновления'),
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 md:p-6 lg:p-8 space-y-5 max-w-[1536px] mx-auto w-full">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-display font-bold">Операторская · Трансферы</h1>
            <p className="text-sm text-muted-foreground">
              {orders?.length || 0} заказов · live updates
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" /> Обновить
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTERS.map(f => (
                <SelectItem key={f.id} value={f.id}>{f.labelRu} / {f.labelEn}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !orders?.length ? (
          <div className="text-center py-20 text-muted-foreground">Нет заказов</div>
        ) : (
          <div className="space-y-3">
            {orders.map(order => {
              const meta = (order.metadata || {}) as Record<string, unknown>;
              const participants = (order.order_participants || []) as Array<{ name: string; phone: string | null; email: string | null; role: string }>;
              const addresses = (order.order_addresses || []) as Array<{ address_type: string; address_text: string }>;
              const translations = (order.order_translations || []) as Array<{ field: string; lang: string; value: string }>;
              const primary = participants.find(p => p.role === 'primary') || participants[0];
              const pickup = addresses.find(a => a.address_type === 'pickup');
              const dropoff = addresses.find(a => a.address_type === 'dropoff');
              const scheduledDate = order.start_at ? format(new Date(order.start_at), 'dd.MM.yyyy HH:mm') : '—';
              const translateField = (field: string, lang: string) =>
                translations.find(t => t.field === field && t.lang === lang)?.value;

              const guestPhone = primary?.phone?.replace(/\D/g, '') || '';

              return (
                <div key={order.id} className="p-4 rounded-none border border-border/50 bg-card space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">#{order.order_number}</span>
                      <Badge className={statusColors[order.status] || 'bg-muted text-muted-foreground'}>
                        {order.status}
                      </Badge>
                      {(meta.night_surcharge_applied as boolean) && (
                        <Badge className="bg-warning/10 text-warning">🌙 ночной</Badge>
                      )}
                    </div>
                    <span className="font-bold text-lg tabular-nums">{order.currency} {order.total_amount?.toLocaleString()}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4 shrink-0" />
                      <span className="tabular-nums">{scheduledDate}</span>
                    </div>
                    {meta.flight_number && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Plane className="w-4 h-4 shrink-0" />
                        <span>{meta.flight_number as string} · {(meta.terminal as string) === 'international' ? 'Int\'l' : 'Domestic'}</span>
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
                      <div className="flex items-start gap-2 text-muted-foreground md:col-span-2">
                        <MapPin className="w-4 h-4 shrink-0 text-success mt-0.5" />
                        <div className="flex-1">
                          <div>{pickup.address_text}</div>
                          {translateField('pickup_address', 'en') && (
                            <div className="text-xs opacity-70">EN: {translateField('pickup_address', 'en')}</div>
                          )}
                          {translateField('pickup_address', 'th') && (
                            <div className="text-xs opacity-70">TH: {translateField('pickup_address', 'th')}</div>
                          )}
                        </div>
                      </div>
                    )}
                    {dropoff && (
                      <div className="flex items-start gap-2 text-muted-foreground md:col-span-2">
                        <MapPin className="w-4 h-4 shrink-0 text-destructive mt-0.5" />
                        <div className="flex-1">
                          <div>{dropoff.address_text}</div>
                          {translateField('dropoff_address', 'en') && (
                            <div className="text-xs opacity-70">EN: {translateField('dropoff_address', 'en')}</div>
                          )}
                          {translateField('dropoff_address', 'th') && (
                            <div className="text-xs opacity-70">TH: {translateField('dropoff_address', 'th')}</div>
                          )}
                        </div>
                      </div>
                    )}
                    {meta.comments && (
                      <div className="md:col-span-2 text-xs text-muted-foreground italic border-l-2 border-border pl-2">
                        💬 {meta.comments as string}
                        {translateField('comments', 'en') && <div>EN: {translateField('comments', 'en')}</div>}
                        {translateField('comments', 'th') && <div>TH: {translateField('comments', 'th')}</div>}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-border/30 flex-wrap">
                    {order.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => updateStatus.mutate({ orderId: order.id, newStatus: 'confirmed' as OrderStatus })}
                        disabled={updateStatus.isPending}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1.5" /> Подтвердить
                      </Button>
                    )}
                    {(order.status === 'pending' || order.status === 'confirmed') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus.mutate({ orderId: order.id, newStatus: 'cancelled' as OrderStatus })}
                        disabled={updateStatus.isPending}
                      >
                        <XCircle className="w-4 h-4 mr-1.5" /> Отклонить
                      </Button>
                    )}
                    {order.status === 'confirmed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus.mutate({ orderId: order.id, newStatus: 'completed' as OrderStatus })}
                        disabled={updateStatus.isPending}
                      >
                        Завершить
                      </Button>
                    )}
                    {guestPhone && (
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                      >
                        <a href={`https://wa.me/${guestPhone}`} target="_blank" rel="noopener noreferrer">
                          <MessageCircle className="w-4 h-4 mr-1.5" /> WhatsApp гостю
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
