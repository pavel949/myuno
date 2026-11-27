import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Users, Phone, Mail, Calendar, CheckCircle2, MoreHorizontal } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { VendorProspectDetail } from '@/components/admin/prospects/VendorProspectDetail';
import { statusConfig, type VendorProspect } from '@/hooks/useVendorAcquisition';

export function OperationsLeadsTab() {
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const statusLabel = (status: string | null) => {
    const config = status ? statusConfig[status] : undefined;
    if (config?.label) return isRussian ? config.labelRu : config.label;
    return `${isRussian ? 'Неизвестно' : 'Unknown'}${status ? ` (${status})` : ''}`;
  };
  const { user } = useAuth();
  const [selectedId, setSelectedId] = useState<{ actorId: string; id: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch leads from vendor_prospects or a leads table
  const { data: cachedLeads, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['vendor-prospects', 'operations-preview', user?.id, statusFilter],
    enabled: !!user,
    queryFn: async () => {
      let query = supabase
        .from('vendor_prospects')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      if (!data) throw new Error('Prospect response unavailable');
      return data;
    }
  });
  const leads = user && !isError ? cachedLeads : undefined;
  const available = !isLoading && !isError && !!leads;
  const selectedProspect = selectedId?.actorId === user?.id ? leads?.find(lead => lead.id === selectedId?.id) : undefined;

  const stats = {
    new: available ? leads.filter(l => l.status === 'new').length : '—',
    contacted: available ? leads.filter(l => l.status === 'contacted').length : '—',
    meeting: available ? leads.filter(l => l.status === 'meeting').length : '—',
    won: available ? leads.filter(l => l.status === 'won').length : '—',
  };

  const filteredLeads = leads?.filter(l => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      l.business_name?.toLowerCase().includes(q) ||
      l.contact_name?.toLowerCase().includes(q) ||
      l.email?.toLowerCase().includes(q) ||
      l.phone?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{isRussian ? 'Показатели текущей выборки — до 100 записей, с выбранным статусом.' : 'Counts for the loaded selection: up to 100 records with the selected status.'}</p>
      {error && <div role="alert" className="border border-warning p-4">
        {isRussian ? 'Не удалось загрузить кандидатов в партнёры.' : 'Could not load partner prospects.'}
        <Button variant="outline" onClick={() => void refetch()}>{isRussian ? 'Повторить' : 'Retry'}</Button>
      </div>}
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-8 w-8 text-info" />
            <div>
              <p className="text-2xl font-bold">{stats.new}</p>
              <p className="text-sm text-muted-foreground">{statusLabel('new')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Phone className="h-8 w-8 text-warning" />
            <div>
              <p className="text-2xl font-bold">{stats.contacted}</p>
              <p className="text-sm text-muted-foreground">{statusLabel('contacted')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Calendar className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{stats.meeting}</p>
              <p className="text-sm text-muted-foreground">{statusLabel('meeting')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-success" />
            <div>
              <p className="text-2xl font-bold">{stats.won}</p>
              <p className="text-sm text-muted-foreground">{statusLabel('won')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leads Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {isRussian ? 'Кандидаты в партнёры' : 'Partner prospects'}
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
                {Object.keys(statusConfig).map(status => <SelectItem key={status} value={status}>{statusLabel(status)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              {isRussian ? 'Загрузка...' : 'Loading...'}
            </div>
          ) : (
            <div className="rounded-none border overflow-x-auto">
              <Table className="min-w-[720px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>{isRussian ? 'Компания' : 'Company'}</TableHead>
                    <TableHead>{isRussian ? 'Контакт' : 'Contact'}</TableHead>
                    <TableHead>{isRussian ? 'Email' : 'Email'}</TableHead>
                    <TableHead>{isRussian ? 'Телефон' : 'Phone'}</TableHead>
                    <TableHead>{isRussian ? 'Категория' : 'Category'}</TableHead>
                    <TableHead>{isRussian ? 'Статус' : 'Status'}</TableHead>
                    <TableHead>{isRussian ? 'Дата' : 'Date'}</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads?.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.business_name || '—'}</TableCell>
                      <TableCell>{lead.contact_name || '—'}</TableCell>
                      <TableCell>
                        {lead.email ? (
                          <a href={`mailto:${lead.email}`} className="text-primary hover:underline flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {lead.email}
                          </a>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        {lead.phone ? (
                          <a href={`tel:${lead.phone}`} className="text-primary hover:underline flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {lead.phone}
                          </a>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{lead.category || '—'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {statusLabel(lead.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {lead.created_at ? format(new Date(lead.created_at), 'dd.MM.yyyy') : '—'}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8 min-h-[44px] min-w-[44px]" aria-label={isRussian ? 'Открыть кандидата' : 'Open prospect'} onClick={() => { if (user) setSelectedId({ actorId: user.id, id: lead.id }); }}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!error && (!filteredLeads || filteredLeads.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        {isRussian ? 'Лиды не найдены' : 'No leads found'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      {selectedProspect && <VendorProspectDetail key={`${user?.id}:${selectedProspect.id}`} prospect={selectedProspect as unknown as VendorProspect} open onClose={() => setSelectedId(null)} />}
    </div>
  );
}
