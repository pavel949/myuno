import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Users, Phone, Mail, Calendar, TrendingUp, MoreHorizontal } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  new: 'bg-blue-500/20 text-blue-700',
  contacted: 'bg-yellow-500/20 text-yellow-700',
  qualified: 'bg-green-500/20 text-green-700',
  converted: 'bg-purple-500/20 text-purple-700',
  lost: 'bg-red-500/20 text-red-700',
};

export function OperationsLeadsTab() {
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch leads from vendor_prospects or a leads table
  const { data: leads, isLoading } = useQuery({
    queryKey: ['admin-leads', statusFilter],
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
      return data;
    }
  });

  const stats = {
    new: leads?.filter(l => l.status === 'new' || !l.status).length || 0,
    contacted: leads?.filter(l => l.status === 'contacted').length || 0,
    qualified: leads?.filter(l => l.status === 'qualified').length || 0,
    converted: leads?.filter(l => l.status === 'converted').length || 0,
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
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{stats.new}</p>
              <p className="text-sm text-muted-foreground">{isRussian ? 'Новые' : 'New'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Phone className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold">{stats.contacted}</p>
              <p className="text-sm text-muted-foreground">{isRussian ? 'Связались' : 'Contacted'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{stats.qualified}</p>
              <p className="text-sm text-muted-foreground">{isRussian ? 'Квалифицированы' : 'Qualified'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Calendar className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-2xl font-bold">{stats.converted}</p>
              <p className="text-sm text-muted-foreground">{isRussian ? 'Конвертировано' : 'Converted'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leads Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {isRussian ? 'Лиды' : 'Leads'}
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
                <SelectItem value="new">{isRussian ? 'Новые' : 'New'}</SelectItem>
                <SelectItem value="contacted">{isRussian ? 'Связались' : 'Contacted'}</SelectItem>
                <SelectItem value="qualified">{isRussian ? 'Квалифицированы' : 'Qualified'}</SelectItem>
                <SelectItem value="converted">{isRussian ? 'Конвертировано' : 'Converted'}</SelectItem>
                <SelectItem value="lost">{isRussian ? 'Потеряны' : 'Lost'}</SelectItem>
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
                        <Badge className={statusColors[lead.status || 'new'] || 'bg-muted'}>
                          {lead.status || 'new'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {lead.created_at ? format(new Date(lead.created_at), 'dd.MM.yyyy') : '—'}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!filteredLeads || filteredLeads.length === 0) && (
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
    </div>
  );
}
