import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Calendar, Clock, CheckCircle, XCircle, AlertCircle, Eye, Package } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ORDER_STATUS_CONFIG } from '@/types/orders';
import type { OrderStatus } from '@/types/orders';
import { AdminOrderDetailSheet } from './AdminOrderDetailSheet';

export function OperationsBookingsTab() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ['admin-orders', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (id, item_name, item_type, qty, unit_price, amount),
          order_participants (id, name, phone, email, role),
          order_addresses (id, address_type, address_text, notes)
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(200);

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter as any);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

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

  const stats = {
    pending: orders?.filter((o) => o.status === 'pending').length || 0,
    confirmed: orders?.filter((o) => o.status === 'confirmed').length || 0,
    completed: orders?.filter((o) => o.status === 'completed').length || 0,
    cancelled: orders?.filter((o) => o.status === 'cancelled').length || 0,
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
    return { name: profile?.full_name || '—', phone: profile?.phone || null };
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-warning" />
            <div>
              <p className="text-2xl font-bold">{stats.pending}</p>
              <p className="text-sm text-muted-foreground">{isRu ? 'Ожидают' : 'Pending'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-8 w-8 text-info" />
            <div>
              <p className="text-2xl font-bold">{stats.confirmed}</p>
              <p className="text-sm text-muted-foreground">{isRu ? 'Подтверждено' : 'Confirmed'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-success" />
            <div>
              <p className="text-2xl font-bold">{stats.completed}</p>
              <p className="text-sm text-muted-foreground">{isRu ? 'Завершено' : 'Completed'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <XCircle className="h-8 w-8 text-destructive" />
            <div>
              <p className="text-2xl font-bold">{stats.cancelled}</p>
              <p className="text-sm text-muted-foreground">{isRu ? 'Отменено' : 'Cancelled'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {isRu ? 'Все заказы' : 'All Orders'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={isRu ? 'Поиск по имени, номеру...' : 'Search by name, number...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={isRu ? 'Статус' : 'Status'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isRu ? 'Все' : 'All'}</SelectItem>
                <SelectItem value="pending">{isRu ? 'Ожидают' : 'Pending'}</SelectItem>
                <SelectItem value="confirmed">{isRu ? 'Подтверждённые' : 'Confirmed'}</SelectItem>
                <SelectItem value="in_progress">{isRu ? 'В работе' : 'In Progress'}</SelectItem>
                <SelectItem value="completed">{isRu ? 'Завершённые' : 'Completed'}</SelectItem>
                <SelectItem value="cancelled">{isRu ? 'Отменённые' : 'Cancelled'}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              {isRu ? 'Загрузка...' : 'Loading...'}
            </div>
          ) : (
            <div className="rounded-none border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isRu ? '№ Заказа' : 'Order #'}</TableHead>
                    <TableHead>{isRu ? 'Тип' : 'Type'}</TableHead>
                    <TableHead>{isRu ? 'Клиент' : 'Customer'}</TableHead>
                    <TableHead>{isRu ? 'Дата' : 'Date'}</TableHead>
                    <TableHead>{isRu ? 'Сумма' : 'Amount'}</TableHead>
                    <TableHead>{isRu ? 'Статус' : 'Status'}</TableHead>
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
                            : '—'}
                        </TableCell>
                        <TableCell className="font-medium">
                          {order.total_amount?.toLocaleString()} {order.currency || 'THB'}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${statusCfg.bgColor} ${statusCfg.color} border-0`}>
                            {isRu ? statusCfg.labelRu : statusCfg.labelEn}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
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
                        {isRu ? 'Заказы не найдены' : 'No orders found'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Sheet */}
      <AdminOrderDetailSheet
        orderId={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
        onStatusChanged={() => refetch()}
      />
    </div>
  );
}
