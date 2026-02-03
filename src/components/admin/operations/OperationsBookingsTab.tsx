import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Calendar, Clock, CheckCircle, XCircle, AlertCircle, Eye } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

const statusConfig: Record<string, { label: string; labelRu: string; color: string }> = {
  submitted: { label: 'Submitted', labelRu: 'Отправлен', color: 'bg-yellow-500/20 text-yellow-700' },
  confirmed: { label: 'Confirmed', labelRu: 'Подтверждён', color: 'bg-blue-500/20 text-blue-700' },
  completed: { label: 'Completed', labelRu: 'Завершён', color: 'bg-green-500/20 text-green-700' },
  cancelled_by_user: { label: 'Cancelled', labelRu: 'Отменён', color: 'bg-red-500/20 text-red-700' },
  cancelled_by_provider: { label: 'Cancelled', labelRu: 'Отменён', color: 'bg-red-500/20 text-red-700' },
  in_progress: { label: 'In Progress', labelRu: 'В процессе', color: 'bg-purple-500/20 text-purple-700' },
  draft: { label: 'Draft', labelRu: 'Черновик', color: 'bg-gray-500/20 text-gray-700' },
  expired: { label: 'Expired', labelRu: 'Истёк', color: 'bg-gray-500/20 text-gray-700' },
};

export function OperationsBookingsTab() {
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['admin-all-bookings', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          services:service_id (name_en, name_ru),
          providers:provider_id (name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter as 'submitted' | 'confirmed' | 'completed' | 'cancelled_by_user' | 'cancelled_by_provider' | 'in_progress' | 'draft' | 'expired');
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const stats = {
    submitted: bookings?.filter(b => b.status === 'submitted').length || 0,
    confirmed: bookings?.filter(b => b.status === 'confirmed').length || 0,
    completed: bookings?.filter(b => b.status === 'completed').length || 0,
    cancelled: bookings?.filter(b => b.status === 'cancelled_by_user' || b.status === 'cancelled_by_provider').length || 0,
  };

  const filteredBookings = bookings?.filter(b => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.id.toLowerCase().includes(q) ||
      b.services?.name_en?.toLowerCase().includes(q) ||
      b.providers?.name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold">{stats.submitted}</p>
              <p className="text-sm text-muted-foreground">{isRussian ? 'Ожидают' : 'Submitted'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{stats.confirmed}</p>
              <p className="text-sm text-muted-foreground">{isRussian ? 'Подтверждено' : 'Confirmed'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{stats.completed}</p>
              <p className="text-sm text-muted-foreground">{isRussian ? 'Завершено' : 'Completed'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <XCircle className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-2xl font-bold">{stats.cancelled}</p>
              <p className="text-sm text-muted-foreground">{isRussian ? 'Отменено' : 'Cancelled'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {isRussian ? 'Все бронирования' : 'All Bookings'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={isRussian ? 'Поиск...' : 'Search...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={isRussian ? 'Статус' : 'Status'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isRussian ? 'Все' : 'All'}</SelectItem>
                <SelectItem value="submitted">{isRussian ? 'Ожидают' : 'Submitted'}</SelectItem>
                <SelectItem value="confirmed">{isRussian ? 'Подтверждённые' : 'Confirmed'}</SelectItem>
                <SelectItem value="completed">{isRussian ? 'Завершённые' : 'Completed'}</SelectItem>
                <SelectItem value="cancelled_by_user">{isRussian ? 'Отменённые' : 'Cancelled'}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              {isRussian ? 'Загрузка...' : 'Loading...'}
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isRussian ? 'ID' : 'ID'}</TableHead>
                    <TableHead>{isRussian ? 'Услуга' : 'Service'}</TableHead>
                    <TableHead>{isRussian ? 'Провайдер' : 'Provider'}</TableHead>
                    <TableHead>{isRussian ? 'Дата' : 'Date'}</TableHead>
                    <TableHead>{isRussian ? 'Сумма' : 'Amount'}</TableHead>
                    <TableHead>{isRussian ? 'Статус' : 'Status'}</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings?.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-mono text-xs">
                        {booking.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        {isRussian 
                          ? booking.services?.name_ru || booking.services?.name_en 
                          : booking.services?.name_en || '—'}
                      </TableCell>
                      <TableCell>{booking.providers?.name || '—'}</TableCell>
                      <TableCell className="text-sm">
                        {booking.scheduled_at 
                          ? format(new Date(booking.scheduled_at), 'dd.MM.yyyy HH:mm')
                          : '—'}
                      </TableCell>
                      <TableCell>
                        {booking.total_amount 
                          ? `${booking.total_amount.toLocaleString()} ${booking.currency || 'THB'}`
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusConfig[booking.status as keyof typeof statusConfig]?.color || 'bg-muted'}>
                          {isRussian 
                            ? statusConfig[booking.status as keyof typeof statusConfig]?.labelRu 
                            : statusConfig[booking.status as keyof typeof statusConfig]?.label || booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!filteredBookings || filteredBookings.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {isRussian ? 'Бронирования не найдены' : 'No bookings found'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
