import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ORDER_STATUS_CONFIG } from '@/types/orders';
import type { OrderStatus } from '@/types/orders';
import {
  User, Phone, Mail, MapPin, Calendar, Package, Copy,
  MessageSquare, CheckCircle, XCircle, Truck, FileText,
} from 'lucide-react';
import { format } from 'date-fns';

import { toast } from 'sonner';
interface AdminOrderDetailSheetProps {
  orderId: string | null;
  onClose: () => void;
  onStatusChanged: () => void;
}

type OrderParticipant = { id: string; name: string | null; phone: string | null; email: string | null; role: string };
type OrderAddress = { id: string; address_type: string; address_text: string; notes: string | null };
type OrderItem = { id: string; item_name: string; item_type: string | null; qty: number | null; unit_price: number | null; amount: number; metadata: unknown };
type OrderMetadata = { payment_method?: string } | null;

const ORDER_TYPE_EMOJI: Record<string, string> = {
  restaurant: '🍽️', flowers: '💐', yacht: '🛥️', tour: '🗺️',
  transport: '🚗', cleaning: '🧹', beauty: '💅', medical: '🏥',
  pet_service: '🐾', education: '📚', legal: '⚖️', event: '🎉',
  property: '🏠', vehicle: '🚙', water_activity: '🌊', experience: '✨',
  activity: '✨', babysitter: '👶', food: '🍽️', service: '📦', mixed: '📦',
};

type StatusAction = { labelKey: string; status: OrderStatus; icon: React.ElementType; variant: 'default' | 'outline' | 'destructive' };

export function AdminOrderDetailSheet({ orderId, onClose, onStatusChanged }: AdminOrderDetailSheetProps) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelInput, setShowCancelInput] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: ['admin-order-detail', orderId],
    queryFn: async () => {
      if (!orderId) return null;
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (id, item_name, item_type, qty, unit_price, amount, metadata),
          order_participants (id, name, phone, email, role),
          order_addresses (id, address_type, address_text, notes)
        `)
        .eq('id', orderId)
        .single();
      if (error) throw error;

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('id', data.customer_user_id)
        .single();

      return { ...data, _profile: profile };
    },
    enabled: !!orderId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ newStatus, reason }: { newStatus: OrderStatus; reason?: string }) => {
      if (!order) throw new Error('No order');

      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', order.id);
      if (updateError) throw updateError;

      const { data: { user } } = await supabase.auth.getUser();
      const { error: historyError } = await supabase
        .from('order_status_history')
        .insert({
          order_id: order.id,
          from_status: order.status,
          to_status: newStatus,
          actor_user_id: user?.id || null,
          reason: reason || null,
        });
      if (historyError) console.error('Status history error:', historyError);

      try {
        await supabase.functions.invoke('notify-order-status-change', {
          body: {
            order_id: order.id,
            new_status: newStatus,
            reason: reason || null,
          },
        });
      } catch (e) {
        console.error('Notification error:', e);
      }
    },
    onSuccess: (_, { newStatus }) => {
      const label = t(`admin.orders.statusLabel.${newStatus}`);
      toast(t('admin.orders.detail.statusUpdated'), {
        description: `${t('admin.orders.detail.statusMovedTo')} "${label}"`,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-order-detail', orderId] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      onStatusChanged();
      setShowCancelInput(false);
      setCancelReason('');
    },
    onError: (err: Error) => {
      toast.error(t('admin.orders.detail.error'), {
        description: err.message,
      });
    },
  });

  const copyForSupplier = () => {
    if (!order) return;
    const primary = order.order_participants?.find((p: OrderParticipant) => p.role === 'primary');
    const pickup = order.order_addresses?.find((a: OrderAddress) => a.address_type === 'pickup');
    const dropoff = order.order_addresses?.find((a: OrderAddress) => a.address_type === 'dropoff');
    const serviceAddr = order.order_addresses?.find((a: OrderAddress) => a.address_type === 'service');
    const emoji = ORDER_TYPE_EMOJI[order.order_type] || '📦';
    const paymentMethod = (order.metadata as OrderMetadata)?.payment_method || 'cash';
    const paymentLabel = t(`admin.orders.detail.payment.${paymentMethod}`);

    const lines = [
      `${emoji} ${t('admin.orders.detail.order').toUpperCase()} #${order.order_number || order.id.slice(0, 8)}`,
      `${t('admin.orders.col.type')}: ${order.order_type}`,
      `${t('admin.orders.col.amount')}: ${order.total_amount} ${order.currency || 'THB'}`,
      `${t('admin.orders.detail.payment')}: ${paymentLabel}`,
      '',
      `👤 ${t('admin.orders.detail.customer')}:`,
      primary?.name || order._profile?.full_name || t('admin.orders.detail.guest'),
      primary?.phone ? `📱 ${primary.phone}` : '',
      primary?.email ? `📧 ${primary.email}` : '',
      '',
      order.start_at ? `📅 ${t('admin.orders.col.date')}: ${format(new Date(order.start_at), 'dd.MM.yyyy HH:mm')}` : '',
      '',
      ...(order.order_items?.map((item: OrderItem) =>
        `• ${item.item_name} x${item.qty || 1} — ${item.amount} ${order.currency || 'THB'}`
      ) || []),
      '',
      pickup ? `📍 ${t('admin.orders.detail.from')}: ${pickup.address_text}` : '',
      dropoff ? `🏁 ${t('admin.orders.detail.to')}: ${dropoff.address_text}` : '',
      serviceAddr ? `📍 ${t('admin.orders.detail.location')}: ${serviceAddr.address_text}` : '',
      '',
      order.notes ? `📝 ${t('admin.orders.detail.notes')}: ${order.notes}` : '',
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(lines);
    toast(t('admin.orders.detail.copied'));
  };

  const openWhatsApp = () => {
    if (!order) return;
    const text = `${t('admin.orders.detail.order')} #${order.order_number || order.id.slice(0, 8)} — ${order.order_type} — ${order.total_amount} ${order.currency || 'THB'}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const status = (order?.status || 'pending') as OrderStatus;
  const statusCfg = ORDER_STATUS_CONFIG[status] || ORDER_STATUS_CONFIG.pending;
  const primary = order?.order_participants?.find((p: OrderParticipant) => p.role === 'primary');
  const paymentMethod = (order?.metadata as OrderMetadata)?.payment_method || 'cash';

  const statusActions: StatusAction[] = [];
  if (status === 'pending') {
    statusActions.push({ labelKey: 'admin.orders.detail.confirm', status: 'confirmed', icon: CheckCircle, variant: 'default' });
  }
  if (status === 'confirmed') {
    statusActions.push({ labelKey: 'admin.orders.detail.startWork', status: 'in_progress', icon: Truck, variant: 'default' });
  }
  if (status === 'in_progress') {
    statusActions.push({ labelKey: 'admin.orders.detail.complete', status: 'completed', icon: CheckCircle, variant: 'default' });
  }
  if (['pending', 'confirmed'].includes(status)) {
    statusActions.push({ labelKey: 'admin.orders.detail.cancel', status: 'cancelled', icon: XCircle, variant: 'destructive' });
  }

  return (
    <Sheet open={!!orderId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {ORDER_TYPE_EMOJI[order?.order_type || ''] || '📦'}
            {t('admin.orders.detail.order')} #{order?.order_number || order?.id?.slice(0, 8)}
          </SheetTitle>
          <SheetDescription>
            {order?.created_at && format(new Date(order.created_at), 'dd.MM.yyyy HH:mm')}
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            {t('admin.orders.detail.loading')}
          </div>
        ) : order ? (
          <div className="space-y-5 mt-4">
            <div className="flex items-center gap-2">
              <Badge className={`${statusCfg.bgColor} ${statusCfg.color} border-0 text-sm px-3 py-1`}>
                {t(`admin.orders.statusLabel.${status}`)}
              </Badge>
              <Badge variant="outline" className="capitalize">{order.order_type}</Badge>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <User className="h-4 w-4" />
                {t('admin.orders.detail.customer')}
              </h4>
              <div className="bg-muted/50 rounded-none p-3 space-y-1.5 text-sm">
                <p className="font-medium">{primary?.name || order._profile?.full_name || t('admin.orders.detail.guest')}</p>
                {(primary?.phone || order._profile?.phone) && (
                  <a
                    href={`tel:${primary?.phone || order._profile?.phone}`}
                    className="flex items-center gap-1.5 text-primary hover:underline"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {primary?.phone || order._profile?.phone}
                  </a>
                )}
                {primary?.email && (
                  <a
                    href={`mailto:${primary.email}`}
                    className="flex items-center gap-1.5 text-primary hover:underline"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    {primary.email}
                  </a>
                )}
              </div>
            </div>

            <Separator />

            {order.start_at && (
              <>
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {t('admin.orders.detail.dateTime')}
                  </h4>
                  <p className="text-sm bg-muted/50 rounded-none p-3">
                    📅 {format(new Date(order.start_at), 'dd.MM.yyyy HH:mm')}
                    {order.end_at && ` — ${format(new Date(order.end_at), 'dd.MM.yyyy HH:mm')}`}
                  </p>
                </div>
                <Separator />
              </>
            )}

            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Package className="h-4 w-4" />
                {t('admin.orders.detail.items')}
              </h4>
              <div className="bg-muted/50 rounded-none p-3 space-y-2">
                {order.order_items?.map((item: OrderItem) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.item_name} {item.qty && item.qty > 1 ? `×${item.qty}` : ''}</span>
                    <span className="font-medium">{item.amount} {order.currency || 'THB'}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>{t('admin.orders.detail.total')}</span>
                  <span>{order.total_amount} {order.currency || 'THB'}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {t('admin.orders.detail.payment')}: {t(`admin.orders.detail.payment.${paymentMethod}`)}
                </div>
              </div>
            </div>

            {order.order_addresses && order.order_addresses.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {t('admin.orders.detail.addresses')}
                  </h4>
                  <div className="bg-muted/50 rounded-none p-3 space-y-2 text-sm">
                    {order.order_addresses.map((addr: OrderAddress) => (
                      <div key={addr.id}>
                        <span className="text-xs uppercase text-muted-foreground">
                          {addr.address_type === 'pickup' ? t('admin.orders.detail.from') :
                           addr.address_type === 'dropoff' ? t('admin.orders.detail.to') :
                           addr.address_type === 'service' ? t('admin.orders.detail.location') :
                           addr.address_type}
                        </span>
                        <p>{addr.address_text}</p>
                        {addr.notes && <p className="text-muted-foreground text-xs">{addr.notes}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {order.notes && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {t('admin.orders.detail.notes')}
                  </h4>
                  <p className="text-sm bg-muted/50 rounded-none p-3">{order.notes}</p>
                </div>
              </>
            )}

            <Separator />

            <div className="space-y-3">
              <h4 className="text-sm font-semibold">{t('admin.orders.detail.actions')}</h4>

              <div className="flex flex-wrap gap-2">
                {statusActions.map((action) => {
                  if (action.status === 'cancelled') {
                    return (
                      <Button
                        key={action.status}
                        variant="destructive"
                        size="sm"
                        onClick={() => setShowCancelInput(true)}
                        disabled={updateStatusMutation.isPending}
                      >
                        <action.icon className="h-4 w-4 mr-1" />
                        {t(action.labelKey)}
                      </Button>
                    );
                  }
                  return (
                    <Button
                      key={action.status}
                      variant={action.variant}
                      size="sm"
                      onClick={() => updateStatusMutation.mutate({ newStatus: action.status })}
                      disabled={updateStatusMutation.isPending}
                    >
                      <action.icon className="h-4 w-4 mr-1" />
                      {t(action.labelKey)}
                    </Button>
                  );
                })}
              </div>

              {showCancelInput && (
                <div className="space-y-2">
                  <Textarea
                    placeholder={t('admin.orders.detail.cancelReasonPlaceholder')}
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => updateStatusMutation.mutate({ newStatus: 'cancelled', reason: cancelReason })}
                      disabled={updateStatusMutation.isPending}
                    >
                      {t('admin.orders.detail.confirmCancel')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setShowCancelInput(false); setCancelReason(''); }}
                    >
                      {t('admin.orders.detail.back')}
                    </Button>
                  </div>
                </div>
              )}

              <Separator />

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={copyForSupplier}>
                  <Copy className="h-4 w-4 mr-1" />
                  {t('admin.orders.detail.copyForSupplier')}
                </Button>
                <Button variant="outline" size="sm" onClick={openWhatsApp}>
                  <MessageSquare className="h-4 w-4 mr-1" />
                  WhatsApp
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
