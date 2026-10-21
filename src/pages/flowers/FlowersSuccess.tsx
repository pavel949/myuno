import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Package, MapPin, Calendar, User, Gift } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { useOrderReturnRead } from '@/hooks/useOrderReturnRead';
import { CrossSellRecommendations } from '@/components/orders/CrossSellRecommendations';
import { UnifiedSuccessLayout } from '@/components/orders/UnifiedSuccessLayout';

const FlowersSuccess = () => {
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const sessionId = searchParams.get('session_id');

  const { order: record, confirmed, isLoading, status } = useOrderReturnRead({
    orderTypes: ['flowers'], sessionId, children: 'items',
  });
  const order = record ? { ...record, items: (record.order_items || []).map(item => ({
    product_name: item.item_name, qty: item.qty, unit_price: item.unit_price,
  })) } : null;
  // A confirmed historical order does not identify the current cart. Receipt
  // revisits must not delete new or unrelated items; reconciliation belongs to
  // the accepted checkout/cart association, not this read-only page.

  const meta = order?.metadata || {};
  const statusLabel = order?.status === 'confirmed'
    ? (isRu ? 'Подтверждён' : 'Confirmed')
    : order?.status === 'pending' ? (isRu ? 'Ожидает' : 'Pending') : (isRu ? 'Проверьте статус' : 'Check status');

  const details = order ? (
    <div className="space-y-4 text-left">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <Package className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <p className="font-medium text-sm">
              {order.order_number || (isRu ? 'Заказ оформлен' : 'Order placed')}
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(order.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs">{statusLabel}</Badge>
      </div>

      {order.items?.length > 0 && (
        <div className="space-y-1 border-t border-border pt-3">
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{item.product_name} × {item.qty}</span>
              <span>{Number.isFinite(item.unit_price) && Number.isFinite(item.qty) ? (item.unit_price * item.qty).toLocaleString() : '—'} {order.currency}</span>
            </div>
          ))}
          <div className="flex justify-between font-semibold text-sm pt-2 border-t border-border">
            <span>{isRu ? 'Итого' : 'Total'}</span>
            <span>{order.total_amount?.toLocaleString()} {order.currency}</span>
          </div>
        </div>
      )}

      {(meta.recipient_name || meta.delivery_address || meta.delivery_date) && (
        <div className="space-y-2 border-t border-border pt-3">
          {meta.recipient_name && (
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-muted-foreground shrink-0" />
              <span>{meta.recipient_name as string}</span>
            </div>
          )}
          {meta.delivery_address && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="truncate">{meta.delivery_address as string}</span>
            </div>
          )}
          {meta.delivery_date && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
              <span>{meta.delivery_date as string}{meta.delivery_slot ? ` · ${meta.delivery_slot}` : ''}</span>
            </div>
          )}
          {meta.gift_wrap && (
            <div className="flex items-center gap-2 text-sm">
              <Gift className="w-4 h-4 text-muted-foreground shrink-0" />
              <span>{isRu ? 'Праздничная упаковка' : 'Gift wrap included'}</span>
            </div>
          )}
        </div>
      )}
    </div>
  ) : null;

  return (
    <UnifiedSuccessLayout
      isLoading={isLoading}
      status={status}
      hideWhatsApp={!order}
      orderNumber={order?.order_number}
      note={{
        ru: 'Проверьте состав заказа, время и условия доставки в разделе заказов.',
        en: 'Check the order contents, timing and delivery arrangements in My orders.',
      }}
      details={details}
      extras={confirmed ? <CrossSellRecommendations orderType="flowers" /> : undefined}
      primaryHref="/bookings"
      secondaryHref="/flowers"
      totalAmount={order?.total_amount}
      currency={order?.currency}
      whatsappSummary={
        order
          ? {
              ru: `Цветы${order.items.length ? ` · ${order.items.length} поз.` : ''}${meta.delivery_date ? ` · доставка ${meta.delivery_date as string}` : ''}`,
              en: `Flowers${order.items.length ? ` · ${order.items.length} item(s)` : ''}${meta.delivery_date ? ` · delivery ${meta.delivery_date as string}` : ''}`,
            }
          : undefined
      }
    />
  );
};

export default FlowersSuccess;
