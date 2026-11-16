/**
 * Vendor orders — read-only list of the commercial orders addressed to the
 * active provider organisation. It shows exactly the set the dashboard's
 * "Orders" counter counts (useVendorOrders), and opens one order from the URL
 * (`?order=<id>`), so a dashboard link always lands on the order it named.
 *
 * Status changes stay on the dashboard; this page adds no order mutation.
 */
import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { enUS, ru as ruLocale } from 'date-fns/locale';
import { ShoppingBag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang, type LangValues } from '@/lib/i18n/pickLang';
import { useVendorOrders } from '@/hooks/useOrders';
import { getCurrencySymbol } from '@/lib/config/currencies';
import type { Order } from '@/types/orders';

const STATUS_FILTERS = ['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const STATUS_LABELS: Record<string, LangValues> = {
  all: { ru: 'Все', en: 'All', th: 'ทั้งหมด' },
  pending: { ru: 'Ожидает', en: 'Pending', th: 'รอดำเนินการ' },
  confirmed: { ru: 'Подтверждён', en: 'Confirmed', th: 'ยืนยันแล้ว' },
  in_progress: { ru: 'В работе', en: 'In progress', th: 'กำลังดำเนินการ' },
  completed: { ru: 'Завершён', en: 'Completed', th: 'เสร็จสิ้น' },
  cancelled: { ru: 'Отменён', en: 'Cancelled', th: 'ยกเลิก' },
};

const STATUS_CLASSES: Record<string, string> = {
  pending: 'bg-muted text-muted-foreground',
  confirmed: 'bg-info/20 text-info',
  in_progress: 'bg-warning/20 text-warning',
  completed: 'bg-success/20 text-success',
  cancelled: 'bg-danger/10 text-danger',
};

function isStatusFilter(value: string | null): value is StatusFilter {
  return STATUS_FILTERS.some(status => status === value);
}

/** Stored amount in the order's own currency; never converted or abbreviated. */
function formatOrderAmount(amount: number, currency: string): string {
  return `${getCurrencySymbol(currency || 'THB')}${Number(amount || 0).toLocaleString()}`;
}

export default function VendorOrders() {
  const { language } = useLanguage();
  const t = (values: LangValues) => pickLang(language, values);
  const locale = language === 'ru' ? ruLocale : enUS;
  const [searchParams, setSearchParams] = useSearchParams();
  const { orders, isLoading, error, refetch } = useVendorOrders();

  const statusParam = searchParams.get('status');
  const status: StatusFilter = isStatusFilter(statusParam) ? statusParam : 'all';
  const selectedId = searchParams.get('order');

  const visibleOrders = useMemo(
    () => (status === 'all' ? orders : orders.filter(order => order.status === status)),
    [orders, status],
  );
  const selectedOrder: Order | undefined = selectedId ? orders.find(order => order.id === selectedId) : undefined;

  const updateParams = (change: (params: URLSearchParams) => void, replace = false) => {
    const next = new URLSearchParams(searchParams);
    change(next);
    setSearchParams(next, { replace });
  };

  const statusBadge = (value: string) => (
    <Badge className={`whitespace-nowrap ${STATUS_CLASSES[value] || 'bg-muted'}`}>
      {STATUS_LABELS[value] ? t(STATUS_LABELS[value]) : value}
    </Badge>
  );
  const formatDate = (value: string) => format(new Date(value), 'd MMM yyyy, HH:mm', { locale });

  return (
    <div className="space-y-4 p-4 md:p-6">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 font-display text-h3">
          <ShoppingBag className="h-5 w-5 text-info" aria-hidden="true" />
          {t({ ru: 'Заказы', en: 'Orders', th: 'คำสั่งซื้อ' })}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t({
            ru: 'Заказы клиентов, оформленные на вашу организацию. Бронирования услуг находятся в разделе «Бронирования».',
            en: 'Customer orders placed with your organisation. Service bookings are listed under Bookings.',
            th: 'คำสั่งซื้อของลูกค้าที่ส่งถึงองค์กรของคุณ การจองบริการอยู่ในหน้าการจอง',
          })}
        </p>
      </header>

      <div className="flex flex-wrap gap-2" role="group" aria-label={t({ ru: 'Статус заказа', en: 'Order status', th: 'สถานะคำสั่งซื้อ' })}>
        {STATUS_FILTERS.map(value => (
          <Button
            key={value}
            type="button"
            variant={status === value ? 'default' : 'outline'}
            aria-pressed={status === value}
            className="min-h-11"
            onClick={() => updateParams(params => { if (value === 'all') params.delete('status'); else params.set('status', value); }, true)}
          >
            {t(STATUS_LABELS[value])}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2" role="status" aria-label={t({ ru: 'Загружаем заказы', en: 'Loading orders', th: 'กำลังโหลดคำสั่งซื้อ' })}>
          {[1, 2, 3, 4].map(row => <Skeleton key={row} className="h-16" />)}
        </div>
      ) : error ? (
        <div role="alert" className="space-y-3 border border-border p-6">
          <p>{t({ ru: 'Не удалось загрузить заказы. Это не означает, что заказов нет.', en: 'Orders could not be loaded. This does not mean there are no orders.', th: 'ไม่สามารถโหลดคำสั่งซื้อได้ ซึ่งไม่ได้หมายความว่าไม่มีคำสั่งซื้อ' })}</p>
          <Button variant="outline" className="min-h-11" onClick={() => { void refetch(); }}>
            {t({ ru: 'Повторить', en: 'Try again', th: 'ลองอีกครั้ง' })}
          </Button>
        </div>
      ) : visibleOrders.length === 0 ? (
        <p className="border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {status === 'all'
            ? t({ ru: 'Заказов пока нет.', en: 'No orders yet.', th: 'ยังไม่มีคำสั่งซื้อ' })
            : t({ ru: 'Нет заказов с этим статусом.', en: 'No orders with this status.', th: 'ไม่มีคำสั่งซื้อในสถานะนี้' })}
        </p>
      ) : (
        <ul className="space-y-2">
          {visibleOrders.map(order => (
            <li key={order.id}>
              <button
                type="button"
                onClick={() => updateParams(params => params.set('order', order.id))}
                className="flex min-h-16 w-full min-w-0 flex-wrap items-center justify-between gap-3 border border-border bg-card p-3 text-left hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="min-w-0 flex-1">
                  <span className="block break-words text-sm font-medium">{order.order_number || order.id.slice(0, 8)}</span>
                  <span className="block text-xs text-muted-foreground">{formatDate(order.created_at)}</span>
                </span>
                <span className="flex shrink-0 flex-wrap items-center gap-2">
                  <span className="whitespace-nowrap font-mono text-sm tabular-nums">{formatOrderAmount(order.total_amount, order.currency)}</span>
                  {statusBadge(order.status)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Sheet open={Boolean(selectedId)} onOpenChange={open => { if (!open) updateParams(params => params.delete('order')); }}>
        <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {selectedOrder
                ? `${t({ ru: 'Заказ', en: 'Order', th: 'คำสั่งซื้อ' })} ${selectedOrder.order_number || selectedOrder.id.slice(0, 8)}`
                : t({ ru: 'Заказ', en: 'Order', th: 'คำสั่งซื้อ' })}
            </SheetTitle>
            <SheetDescription>
              {selectedOrder
                ? formatDate(selectedOrder.created_at)
                : isLoading
                  ? t({ ru: 'Загружаем заказ…', en: 'Loading order…', th: 'กำลังโหลดคำสั่งซื้อ…' })
                  : t({ ru: 'Этот заказ не найден среди заказов вашей организации.', en: 'This order was not found among your organisation’s orders.', th: 'ไม่พบคำสั่งซื้อนี้ในองค์กรของคุณ' })}
            </SheetDescription>
          </SheetHeader>
          {selectedOrder && (
            <div className="space-y-4 pt-4 text-sm">
              <dl className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-xs text-muted-foreground">{t({ ru: 'Статус', en: 'Status', th: 'สถานะ' })}</dt>
                  <dd className="mt-1">{statusBadge(selectedOrder.status)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">{t({ ru: 'Сумма', en: 'Total', th: 'ยอดรวม' })}</dt>
                  <dd className="mt-1 font-mono tabular-nums">{formatOrderAmount(selectedOrder.total_amount, selectedOrder.currency)}</dd>
                </div>
              </dl>
              {selectedOrder.order_items && selectedOrder.order_items.length > 0 && (
                <section aria-labelledby="vendor-order-items" className="space-y-2">
                  <h2 id="vendor-order-items" className="text-xs uppercase tracking-wide text-muted-foreground">{t({ ru: 'Состав заказа', en: 'Items', th: 'รายการ' })}</h2>
                  <ul className="divide-y divide-border border-y border-border">
                    {selectedOrder.order_items.map(item => (
                      <li key={item.id} className="flex items-start justify-between gap-3 py-2">
                        <span className="min-w-0 break-words">{item.item_name} × {item.qty}</span>
                        <span className="shrink-0 font-mono tabular-nums">{formatOrderAmount(item.amount, selectedOrder.currency)}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {selectedOrder.notes && (
                <section aria-labelledby="vendor-order-notes" className="space-y-1">
                  <h2 id="vendor-order-notes" className="text-xs uppercase tracking-wide text-muted-foreground">{t({ ru: 'Комментарий клиента', en: 'Customer note', th: 'หมายเหตุจากลูกค้า' })}</h2>
                  <p className="whitespace-pre-wrap break-words">{selectedOrder.notes}</p>
                </section>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
