import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MessageSquare, Clock, CheckCircle, XCircle, Eye, Reply } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  open: 'bg-info/20 text-info',
  pending: 'bg-warning/20 text-warning',
  resolved: 'bg-success/20 text-success',
  closed: 'bg-muted text-muted-foreground',
};

export function OperationsInquiriesTab() {
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch inquiries from support_tickets or contact forms
  const { data: inquiries, isLoading } = useQuery({
    queryKey: ['admin-inquiries', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const stats = {
    open: inquiries?.filter(i => i.status === 'open').length || 0,
    pending: inquiries?.filter(i => i.status === 'pending' || i.status === 'in_progress').length || 0,
    resolved: inquiries?.filter(i => i.status === 'resolved').length || 0,
    total: inquiries?.length || 0,
  };

  const filteredInquiries = inquiries?.filter(i => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      i.subject?.toLowerCase().includes(q) ||
      i.description?.toLowerCase().includes(q) ||
      i.ticket_number?.toLowerCase().includes(q)
    );
  });

  const priorityColors: Record<string, string> = {
    low: 'bg-muted text-muted-foreground',
    medium: 'bg-info/20 text-info',
    high: 'bg-warning/20 text-warning',
    urgent: 'bg-destructive/20 text-destructive',
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-info" />
            <div>
              <p className="text-2xl font-bold">{stats.open}</p>
              <p className="text-sm text-muted-foreground">{isRussian ? 'Открытые' : 'Open'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-8 w-8 text-warning" />
            <div>
              <p className="text-2xl font-bold">{stats.pending}</p>
              <p className="text-sm text-muted-foreground">{isRussian ? 'В работе' : 'In Progress'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-success" />
            <div>
              <p className="text-2xl font-bold">{stats.resolved}</p>
              <p className="text-sm text-muted-foreground">{isRussian ? 'Решено' : 'Resolved'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-accent-purple" />
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">{isRussian ? 'Всего' : 'Total'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inquiries Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {isRussian ? 'Заявки' : 'Inquiries'}
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
                <SelectItem value="open">{isRussian ? 'Открытые' : 'Open'}</SelectItem>
                <SelectItem value="in_progress">{isRussian ? 'В работе' : 'In Progress'}</SelectItem>
                <SelectItem value="resolved">{isRussian ? 'Решено' : 'Resolved'}</SelectItem>
                <SelectItem value="closed">{isRussian ? 'Закрыто' : 'Closed'}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              {isRussian ? 'Загрузка...' : 'Loading...'}
            </div>
          ) : (
            <div className="rounded-none border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isRussian ? '№ тикета' : 'Ticket #'}</TableHead>
                    <TableHead>{isRussian ? 'Тема' : 'Subject'}</TableHead>
                    <TableHead>{isRussian ? 'Категория' : 'Category'}</TableHead>
                    <TableHead>{isRussian ? 'Приоритет' : 'Priority'}</TableHead>
                    <TableHead>{isRussian ? 'Статус' : 'Status'}</TableHead>
                    <TableHead>{isRussian ? 'Дата' : 'Date'}</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInquiries?.map((inquiry) => (
                    <TableRow key={inquiry.id}>
                      <TableCell className="font-mono text-xs">
                        {inquiry.ticket_number || inquiry.id.slice(0, 8)}
                      </TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {inquiry.subject || '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{inquiry.category || '—'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={priorityColors[inquiry.priority || 'medium'] || 'bg-muted'}>
                          {inquiry.priority || 'medium'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[inquiry.status || 'open'] || 'bg-muted'}>
                          {inquiry.status || 'open'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {inquiry.created_at ? format(new Date(inquiry.created_at), 'dd.MM.yyyy') : '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Reply className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!filteredInquiries || filteredInquiries.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {isRussian ? 'Заявки не найдены' : 'No inquiries found'}
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
