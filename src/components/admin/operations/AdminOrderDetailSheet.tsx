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
  MessageSquare, CheckCircle, XCircle, Truck, Clock, FileText,
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

const PAYMENT_LABELS: Record<string, { en: string; ru: string }> = {
  cash: { en: '💵 Cash', ru: '💵 Наличные' },
  wallet: { en: '👛 Wallet', ru: '👛 Кошелёк' },
  stripe: { en: '💳 Card', ru: '💳 Карта' },
  bank_transfer: { en: '🏦 Transfer', ru: '🏦 Перевод' },
  concierge_advance: { en: '🤝 Advance', ru: '🤝 Аванс' },
};

export function AdminOrderDetailSheet({ orderId, onClose, onStatusChanged }: AdminOrderDetailSheetProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
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

      // Get profile info
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('id', data.customer_user_id)
        .single();

      // Get email from auth (not possible client-side, use participant or metadata)
      return { ...data, _profile: profile };
    },
    enabled: !!orderId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ newStatus, reason }: { newStatus: OrderStatus; reason?: string }) => {
      if (!order) throw new Error('No order');

      // Update order status
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', order.id);
      if (updateError) throw updateError;

      // Add status history
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

      // Notify customer via edge function
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
      const label = isRu
        ? ORDER_STATUS_CONFIG[newStatus]?.labelRu
        : ORDER_STATUS_CONFIG[newStatus]?.labelEn;
      toast(isRu ? 'Статус обновлён' : 'Status Updated', {
        description: isRu ? `Заказ переведён в "${label}"` : `Order moved to "${label}"`,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-order-detail', orderId] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      onStatusChanged();
      setShowCancelInput(false);
      setCancelReason('');
    },
    onError: (err: any) => {
      toast.error(isRu ? 'Ошибка' : 'Error', {
        description: err.message,
      });
    },
  });

  const copyForSupplier = () => {
    if (!order) return;
    const primary = order.order_participants?.find((p: any) => p.role === 'primary');
    const pickup = order.order_addresses?.find((a: any) => a.address_type === 'pickup');
    const dropoff = order.order_addresses?.find((a: any) => a.address_type === 'dropoff');
    const serviceAddr = order.order_addresses?.find((a: any) => a.address_type === 'service');
    const emoji = ORDER_TYPE_EMOJI[order.order_type] || '📦';
    const paymentMethod = (order.metadata as any)?.payment_method || 'cash';
    const paymentLabel = PAYMENT_LABELS[paymentMethod]?.en || paymentMethod;

    const lines = [
      `${emoji} ORDER #${order.order_number || order.id.slice(0, 8)}`,
      `Type: ${order.order_type}`,
      `Amount: ${order.total_amount} ${order.currency || 'THB'}`,
      `Payment: ${paymentLabel}`,
      '',
      `👤 Customer:`,
      primary?.name || order._profile?.full_name || 'Guest',
      primary?.phone ? `📱 ${primary.phone}` : '',
      primary?.email ? `📧 ${primary.email}` : '',
      '',
      order.start_at ? `📅 Date: ${format(new Date(order.start_at), 'dd.MM.yyyy HH:mm')}` : '',
      '',
      ...(order.order_items?.map((item: any) =>
        `• ${item.item_name} x${item.qty || 1} — ${item.amount} ${order.currency || 'THB'}`
      ) || []),
      '',
      pickup ? `📍 From: ${pickup.address_text}` : '',
      dropoff ? `🏁 To: ${dropoff.address_text}` : '',
      serviceAddr ? `📍 Location: ${serviceAddr.address_text}` : '',
      '',
      order.notes ? `📝 Notes: ${order.notes}` : '',
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(lines);
    toast(isRu ? 'Скопировано!' : 'Copied!');
  };

  const openWhatsApp = () => {
    if (!order) return;
    const primary = order.order_participants?.find((p: any) => p.role === 'primary');
    const text = `Order #${order.order_number || order.id.slice(0, 8)} — ${order.order_type} — ${order.total_amount} ${order.currency || 'THB'}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const status = (order?.status || 'pending') as OrderStatus;
  const statusCfg = ORDER_STATUS_CONFIG[status] || ORDER_STATUS_CONFIG.pending;
  const primary = order?.order_participants?.find((p: any) => p.role === 'primary');
  const paymentMethod = (order?.metadata as any)?.payment_method || 'cash';

  const statusActions: { label: string; labelRu: string; status: OrderStatus; icon: React.ElementType; variant: 'default' | 'outline' | 'destructive' }[] = [];
  if (status === 'pending') {
    statusActions.push({ label: 'Confirm', labelRu: 'Подтвердить', status: 'confirmed', icon: CheckCircle, variant: 'default' });
  }
  if (status === 'confirmed') {
    statusActions.push({ label: 'Start Work', labelRu: 'В работу', status: 'in_progress', icon: Truck, variant: 'default' });
  }
  if (status === 'in_progress') {
    statusActions.push({ label: 'Complete', labelRu: 'Завершить', status: 'completed', icon: CheckCircle, variant: 'default' });
  }
  if (['pending', 'confirmed'].includes(status)) {
    statusActions.push({ label: 'Cancel', labelRu: 'Отклонить', status: 'cancelled', icon: XCircle, variant: 'destructive' });
  }

  return (
    <Sheet open={!!orderId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {ORDER_TYPE_EMOJI[order?.order_type || ''] || '📦'}
            {isRu ? 'Заказ' : 'Order'} #{order?.order_number || order?.id?.slice(0, 8)}
          </SheetTitle>
          <SheetDescription>
            {order?.created_at && format(new Date(order.created_at), 'dd.MM.yyyy HH:mm')}
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            {isRu ? 'Загрузка...' : 'Loading...'}
          </div>
        ) : order ? (
          <div className="space-y-5 mt-4">
            {/* Status Badge */}
            <div className="flex items-center gap-2">
              <Badge className={`${statusCfg.bgColor} ${statusCfg.color} border-0 text-sm px-3 py-1`}>
                {isRu ? statusCfg.labelRu : statusCfg.labelEn}
              </Badge>
              <Badge variant="outline" className="capitalize">{order.order_type}</Badge>
            </div>

            <Separator />

            {/* Customer Info */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <User className="h-4 w-4" />
                {isRu ? 'Клиент' : 'Customer'}
              </h4>
              <div className="bg-muted/50 rounded-none p-3 space-y-1.5 text-sm">
                <p className="font-medium">{primary?.name || order._profile?.full_name || 'Guest'}</p>
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

            {/* Schedule */}
            {order.start_at && (
              <>
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {isRu ? 'Дата и время' : 'Date & Time'}
                  </h4>
                  <p className="text-sm bg-muted/50 rounded-none p-3">
                    📅 {format(new Date(order.start_at), 'dd.MM.yyyy HH:mm')}
                    {order.end_at && ` — ${format(new Date(order.end_at), 'dd.MM.yyyy HH:mm')}`}
                  </p>
                </div>
                <Separator />
              </>
            )}

            {/* Items */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Package className="h-4 w-4" />
                {isRu ? 'Состав заказа' : 'Order Items'}
              </h4>
              <div className="bg-muted/50 rounded-none p-3 space-y-2">
                {order.order_items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.item_name} {item.qty > 1 ? `×${item.qty}` : ''}</span>
                    <span className="font-medium">{item.amount} {order.currency || 'THB'}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>{isRu ? 'Итого' : 'Total'}</span>
                  <span>{order.total_amount} {order.currency || 'THB'}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {isRu ? 'Оплата' : 'Payment'}: {PAYMENT_LABELS[paymentMethod]?.[isRu ? 'ru' : 'en'] || paymentMethod}
                </div>
              </div>
            </div>

            {/* Addresses */}
            {order.order_addresses && order.order_addresses.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {isRu ? 'Адреса' : 'Addresses'}
                  </h4>
                  <div className="bg-muted/50 rounded-none p-3 space-y-2 text-sm">
                    {order.order_addresses.map((addr: any) => (
                      <div key={addr.id}>
                        <span className="text-xs uppercase text-muted-foreground">
                          {addr.address_type === 'pickup' ? (isRu ? 'Откуда' : 'From') :
                           addr.address_type === 'dropoff' ? (isRu ? 'Куда' : 'To') :
                           addr.address_type === 'service' ? (isRu ? 'Место' : 'Location') :
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

            {/* Notes */}
            {order.notes && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {isRu ? 'Примечания' : 'Notes'}
                  </h4>
                  <p className="text-sm bg-muted/50 rounded-none p-3">{order.notes}</p>
                </div>
              </>
            )}

            <Separator />

            {/* Actions */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">{isRu ? 'Действия' : 'Actions'}</h4>

              {/* Status change buttons */}
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
                        {isRu ? action.labelRu : action.label}
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
                      {isRu ? action.labelRu : action.label}
                    </Button>
                  );
                })}
              </div>

              {/* Cancel reason input */}
              {showCancelInput && (
                <div className="space-y-2">
                  <Textarea
                    placeholder={isRu ? 'Причина отклонения...' : 'Cancellation reason...'}
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
                      {isRu ? 'Подтвердить отмену' : 'Confirm Cancel'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setShowCancelInput(false); setCancelReason(''); }}
                    >
                      {isRu ? 'Назад' : 'Back'}
                    </Button>
                  </div>
                </div>
              )}

              <Separator />

              {/* Utility actions */}
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={copyForSupplier}>
                  <Copy className="h-4 w-4 mr-1" />
                  {isRu ? 'Скопировать для поставщика' : 'Copy for Supplier'}
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
