import React, { useState, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ChevronRight, Clock, CheckCircle, XCircle, AlertCircle, Eye, Package } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ORDER_STATUS_CONFIG } from '@/types/orders';
import type { OrderStatus } from '@/types/orders';
import { AdminOrderDetailSheet } from './AdminOrderDetailSheet';
import { useSearchParams } from 'react-router-dom';
import { applyOrderQueue, parseOrderQueue, parseQueuePage } from '@/lib/adminDashboardQueues';
import { pickLang } from '@/lib/i18n/pickLang';

const orderStatusCards = [
  { status: 'pending', icon: AlertCircle, color: 'text-warning' },
  { status: 'confirmed', icon: Clock, color: 'text-info' },
  { status: 'completed', icon: CheckCircle, color: 'text-success' },
  { status: 'cancelled', icon: XCircle, color: 'text-destructive' },
] as const;

export function OperationsBookingsTab() {
  const { t, language } = useLanguage();
  const [params, setParams] = useSearchParams();
  const queue = parseOrderQueue(params);
  const page = parseQueuePage(params, 'order_page');
  const pageSize = 100;
  const listHeading = useRef<HTMLHeadingElement>(null);
  const queryClient = useQueryClient();

  const searchQuery = queue.search;
  const statusFilter = queue.status;
  const updateFilter = (key: string, value: string) => setParams(previous => {
    const next = new URLSearchParams(previous);
    if (!value || value === 'all') next.delete(key); else next.set(key, value);
    if (key !== 'order_page') next.delete('order_page');
    return next;
  });
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const { data: result, isLoading, error, isFetching, refetch } = useQuery({
    queryKey: ['admin-orders', statusFilter, queue.createdBefore, page],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (id, item_name, item_type, qty, unit_price, amount),
          order_participants (id, name, phone, email, role),
          order_addresses (id, address_type, address_text, notes)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);
      query = applyOrderQueue(query, queue);

      const { data, error, count } = await query;
      if (error) throw error;
      return { rows: data, count };
    },
  });
  const orders = result?.rows;

  // Fetch profiles for customer names
  const customerIds = [...new Set(orders?.map((o) => o.customer_user_id) || [])];
  const { data: profiles } = useQuery({
    queryKey: ['admin-order-profiles', customerIds],
    queryFn: async () => {
      if (!customerIds.length) return [];
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, phone')
        .in('id', customerIds);
      return data || [];
    },
    enabled: customerIds.length > 0,
  });

  const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

  const statusCounts = useQuery({
    queryKey: ['admin-order-status-counts', queue.createdBefore],
    queryFn: async () => Promise.all(orderStatusCards.map(async ({ status }) => {
      const response = await applyOrderQueue(
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        { status, createdBefore: queue.createdBefore },
      );
      return response.error ? null : response.count;
    })),
  });

  const openStatus = (status: typeof orderStatusCards[number]['status']) => {
    setParams(previous => {
      const next = new URLSearchParams(previous);
      next.set('status', status);
      next.delete('order_page');
      next.delete('q');
      return next;
    });
    listHeading.current?.focus();
  };

  const filteredOrders = orders?.filter((o) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const profile = profileMap.get(o.customer_user_id);
    const customerName = profile?.full_name || '';
    const primaryParticipant = o.order_participants?.find((p: any) => p.role === 'primary');
    return (
      o.order_number?.toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q) ||
      customerName.toLowerCase().includes(q) ||
      primaryParticipant?.name?.toLowerCase().includes(q) ||
      o.order_items?.some((item: any) => item.item_name?.toLowerCase().includes(q))
    );
  });

  const getCustomerDisplay = (order: any) => {
    const primary = order.order_participants?.find((p: any) => p.role === 'primary');
    if (primary) return { name: primary.name, phone: primary.phone };
    const profile = profileMap.get(order.customer_user_id);
    return { name: profile?.full_name || t('admin.orders.noCustomer'), phone: profile?.phone || null };
  };

  return (
    <div className="space-y-4">
      {error && <div role="alert" className="border border-destructive p-4">
        {pickLang(language, { en: 'Could not load orders. Counts and results are unavailable.', ru: 'Не удалось загрузить заказы. Счётчики и результаты недоступны.', th: 'โหลดคำสั่งซื้อไม่สำเร็จ จำนวนและผลลัพธ์ไม่พร้อมใช้งาน' })}
        <Button variant="outline" disabled={isFetching} onClick={() => { void refetch(); void statusCounts.refetch(); }}>{pickLang(language, { en: 'Retry', ru: 'Повторить', th: 'ลองอีกครั้ง' })}</Button>
      </div>}
      {queue.createdBefore && (
        <p className="text-sm text-muted-foreground">
          {pickLang(language, { en: 'Created before', ru: 'Созданы до', th: 'สร้างก่อน' })}{' '}
          <time dateTime={queue.createdBefore}>
            {new Intl.DateTimeFormat(language, {
              dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Bangkok',
            }).format(new Date(queue.createdBefore))} (ICT)
          </time>
        </p>
      )}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        {orderStatusCards.map(({ status, icon: Icon, color }, index) => {
          const selected = statusFilter === status;
          return (
            <Button
              key={status}
              type="button"
              variant="secondary"
              aria-label={`${statusCounts.data?.[index] ?? "—"} ${t(`admin.orders.stats.${status}`)}`}
              aria-pressed={selected}
              onClick={() => openStatus(status)}
              className="h-auto min-h-20 min-w-0 flex-col items-start gap-1 whitespace-normal bg-card p-3 text-left aria-pressed:border-primary aria-pressed:bg-primary/5"
            >
              <span className="flex w-full items-center gap-2">
                <Icon aria-hidden="true" className={`h-4 w-4 shrink-0 ${color}`} />
                <span className="text-xl font-semibold tabular-nums">{statusCounts.data?.[index] ?? '—'}</span>
                <ChevronRight aria-hidden="true" className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
              </span>
              <span className="min-w-0 text-sm leading-tight [overflow-wrap:anywhere]">{t(`admin.orders.stats.${status}`)}</span>
            </Button>
          );
        })}
      </div>
      {statusCounts.data?.some(count => count === null) && (
        <p className="text-xs text-muted-foreground">
          {pickLang(language, { en: 'Some counts are unavailable.', ru: 'Некоторые счётчики недоступны.', th: 'จำนวนบางรายการไม่พร้อมใช้งาน' })}
        </p>
      )}

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle ref={listHeading} tabIndex={-1} className="flex scroll-mt-36 items-center gap-2 focus:outline-none">
            <Package className="h-5 w-5" />
            {t('admin.orders.title')}

          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('admin.orders.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => updateFilter('q', e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={value => updateFilter('status', value)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={t('admin.orders.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin.orders.filter.all')}</SelectItem>
                <SelectItem value="pending">{t('admin.orders.filter.pending')}</SelectItem>
                <SelectItem value="confirmed">{t('admin.orders.filter.confirmed')}</SelectItem>
                <SelectItem value="in_progress">{t('admin.orders.filter.inProgress')}</SelectItem>
                <SelectItem value="completed">{t('admin.orders.filter.completed')}</SelectItem>
                <SelectItem value="cancelled">{t('admin.orders.filter.cancelled')}</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => setParams(previous => { const next = new URLSearchParams(previous); ['q', 'status', 'created_before', 'order_page'].forEach(key => next.delete(key)); return next; })}>{pickLang(language, { en: 'Reset filters', ru: 'Сбросить фильтры', th: 'ล้างตัวกรอง' })}</Button>
          </div>
          <p className="text-xs text-muted-foreground">{pickLang(language, {en:'Text search applies to this page; status and date filters apply to all orders.',ru:'Текстовый поиск — на текущей странице; статус и дата — по всем заказам.',th:'ค้นหาข้อความในหน้านี้ ตัวกรองสถานะและวันที่ใช้กับทุกคำสั่งซื้อ'})}</p>
          {!error && !isLoading && <div className="flex flex-wrap items-center gap-3 py-3">
            <p role="status" className="text-sm">{pickLang(language, {en:'Matching orders',ru:'Подходящие заказы',th:'คำสั่งซื้อที่ตรงกัน'})}: {result?.count ?? pickLang(language,{en:'Count unavailable',ru:'Количество недоступно',th:'จำนวนไม่พร้อมใช้งาน'})} · {pickLang(language,{en:'Page',ru:'Страница',th:'หน้า'})} {page+1}</p>
            <Button variant="outline" disabled={page===0||isFetching} onClick={()=>updateFilter('order_page',String(page-1))}>{pickLang(language,{en:'Previous',ru:'Назад',th:'ก่อนหน้า'})}</Button>
            <Button variant="outline" disabled={isFetching||result?.count==null||(page+1)*pageSize>=result.count} onClick={()=>updateFilter('order_page',String(page+1))}>{pickLang(language,{en:'Next',ru:'Далее',th:'ถัดไป'})}</Button>
          </div>}

          {error ? null : isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('admin.orders.loading')}
            </div>

          ) : (
            <>
              <div className="grid gap-2 md:hidden">
                {filteredOrders?.map(order => {
                  const status = (order.status || 'pending') as OrderStatus;
                  const style = ORDER_STATUS_CONFIG[status] || ORDER_STATUS_CONFIG.pending;
                  return (
                    <Button
                      key={order.id}
                      type="button"
                      variant="secondary"
                      className="h-auto min-h-14 justify-between gap-2 whitespace-normal bg-card p-3 text-left"
                      onClick={() => setSelectedOrderId(order.id)}
                    >
                      <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">
                        <span className="block">{getCustomerDisplay(order).name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {order.order_number || order.id.slice(0, 8)} · {order.order_type}
                        </span>
                      </span>
                      <Badge className={`${style.bgColor} ${style.color} min-w-0 border-0 [overflow-wrap:anywhere]`}>
                        {t(`admin.orders.statusLabel.${status}`)}
                      </Badge>
                      <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0" />
                    </Button>
                  );
                })}
                {!filteredOrders?.length && (
                  <p className="py-6 text-center text-muted-foreground">{t('admin.orders.empty')}</p>
                )}
              </div>
              <div className="hidden rounded-none border overflow-x-auto md:block">
                <Table className="min-w-[720px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin.orders.col.orderNumber')}</TableHead>
                      <TableHead>{t('admin.orders.col.type')}</TableHead>
                      <TableHead>{t('admin.orders.col.customer')}</TableHead>
                      <TableHead>{t('admin.orders.col.date')}</TableHead>
                      <TableHead>{t('admin.orders.col.amount')}</TableHead>
                      <TableHead>{t('admin.orders.col.status')}</TableHead>
                      <TableHead className="w-[50px]"></TableHead>

                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders?.map((order) => {
                      const customer = getCustomerDisplay(order);
                      const status = (order.status || 'pending') as OrderStatus;
                      const statusCfg = ORDER_STATUS_CONFIG[status] || ORDER_STATUS_CONFIG.pending;

                      return (
                        <TableRow
                          key={order.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setSelectedOrderId(order.id)}
                        >
                          <TableCell className="font-mono text-xs font-medium">
                            {order.order_number || order.id.slice(0, 8)}
                          </TableCell>
                          <TableCell className="capitalize text-sm">
                            {order.order_type}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">{customer.name}</div>
                            {customer.phone && (
                              <div className="text-xs text-muted-foreground">{customer.phone}</div>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {order.start_at
                              ? format(new Date(order.start_at), 'dd.MM.yyyy HH:mm')
                              : order.created_at
                              ? format(new Date(order.created_at), 'dd.MM.yyyy HH:mm')
                              : t('admin.orders.noDate')}
                          </TableCell>
                          <TableCell className="font-medium">
                            {order.total_amount?.toLocaleString()} {order.currency || 'THB'}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${statusCfg.bgColor} ${statusCfg.color} border-0`}>
                              {t(`admin.orders.statusLabel.${status}`)}
                            </Badge>

                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 min-h-[44px] min-w-[44px]"
                              aria-label="View"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedOrderId(order.id);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {(!filteredOrders || filteredOrders.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          {t('admin.orders.empty')}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
          {orders && orders.length >= 1000 && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {t('admin.orders.limitNotice')}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Sheet */}
      <AdminOrderDetailSheet
        orderId={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
        onStatusChanged={() => {
          void refetch();
          void queryClient.invalidateQueries({ queryKey: ['admin-order-status-counts'] });
          void queryClient.invalidateQueries({ queryKey: ['operations-overview'] });
        }}
      />
    </div>
  );
}

