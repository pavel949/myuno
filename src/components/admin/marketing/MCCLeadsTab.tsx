import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  Download, 
  Sparkles,
  Mail,
  Phone,
  MessageCircle,
  ChevronRight,
  Users,
  Flame,
  Thermometer,
  Snowflake
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function MCCLeadsTab() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);

  const { data: leads, isLoading } = useQuery({
    queryKey: ['mcc-leads', searchQuery, priorityFilter],
    queryFn: async () => {
      let query = supabase
        .from('mcc_leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (priorityFilter) {
        query = query.eq('priority', priorityFilter);
      }
      
      if (searchQuery) {
        query = query.or(`email.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const { data: stats } = useQuery({
    queryKey: ['mcc-leads-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mcc_leads')
        .select('priority, status');
      
      if (error) throw error;
      
      return {
        total: data.length,
        hot: data.filter(l => l.priority === 'hot').length,
        warm: data.filter(l => l.priority === 'warm').length,
        cold: data.filter(l => l.priority === 'cold').length,
        converted: data.filter(l => l.status === 'converted').length,
      };
    }
  });

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'hot':
        return <Badge className="bg-destructive/20 text-destructive gap-1"><Flame className="h-3 w-3" /> Hot</Badge>;
      case 'warm':
        return <Badge className="bg-warning/20 text-warning gap-1"><Thermometer className="h-3 w-3" /> Warm</Badge>;
      case 'cold':
        return <Badge className="bg-info/20 text-info gap-1"><Snowflake className="h-3 w-3" /> Cold</Badge>;
      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-chart-1/20 text-chart-1',
      contacted: 'bg-chart-2/20 text-chart-2',
      engaged: 'bg-chart-3/20 text-chart-3',
      qualified: 'bg-chart-4/20 text-chart-4',
      converted: 'bg-success/20 text-success',
      lost: 'bg-destructive/20 text-destructive',
    };
    return <Badge className={colors[status] || 'bg-muted'} variant="secondary">{status}</Badge>;
  };

  // Mock leads for demo
  const mockLeads = [
    { id: '1', name: 'John Davidson', email: 'john.d@gmail.com', phone: '+1234567890', source: 'Google Ads', priority: 'hot', status: 'new', score: 85, created_at: new Date().toISOString() },
    { id: '2', name: 'Maria Sanchez', email: 'maria.s@yahoo.com', phone: '+0987654321', source: 'Meta Ads', priority: 'warm', status: 'contacted', score: 62, created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: '3', name: 'Alex Kowalski', email: 'alex.k@proton.me', source: 'Organic', priority: 'cold', status: 'new', score: 34, created_at: new Date(Date.now() - 7200000).toISOString() },
    { id: '4', name: 'Elena Petrova', email: 'elena.p@mail.ru', phone: '+7999888777', source: 'WhatsApp', priority: 'hot', status: 'engaged', score: 91, created_at: new Date(Date.now() - 86400000).toISOString() },
    { id: '5', name: 'Tom Williams', email: 'tom.w@outlook.com', source: 'Telegram', priority: 'warm', status: 'qualified', score: 55, created_at: new Date(Date.now() - 172800000).toISOString() },
  ];

  const displayLeads = leads?.length ? leads : mockLeads;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setPriorityFilter(null)}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.total || mockLeads.length}</p>
              <p className="text-xs text-muted-foreground">{isRu ? 'Всего' : 'Total'}</p>
            </div>
          </CardContent>
        </Card>
        <Card className={`cursor-pointer hover:shadow-md transition-shadow ${priorityFilter === 'hot' ? 'ring-2 ring-destructive' : ''}`} onClick={() => setPriorityFilter(priorityFilter === 'hot' ? null : 'hot')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <Flame className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.hot || 2}</p>
              <p className="text-xs text-muted-foreground">Hot</p>
            </div>
          </CardContent>
        </Card>
        <Card className={`cursor-pointer hover:shadow-md transition-shadow ${priorityFilter === 'warm' ? 'ring-2 ring-warning' : ''}`} onClick={() => setPriorityFilter(priorityFilter === 'warm' ? null : 'warm')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <Thermometer className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.warm || 2}</p>
              <p className="text-xs text-muted-foreground">Warm</p>
            </div>
          </CardContent>
        </Card>
        <Card className={`cursor-pointer hover:shadow-md transition-shadow ${priorityFilter === 'cold' ? 'ring-2 ring-info' : ''}`} onClick={() => setPriorityFilter(priorityFilter === 'cold' ? null : 'cold')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-info/10">
              <Snowflake className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.cold || 1}</p>
              <p className="text-xs text-muted-foreground">Cold</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <ChevronRight className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.converted || 0}</p>
              <p className="text-xs text-muted-foreground">{isRu ? 'Конверсии' : 'Converted'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={isRu ? 'Поиск по имени, email, телефону...' : 'Search by name, email, phone...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            {isRu ? 'Фильтры' : 'Filters'}
          </Button>
          <Button variant="outline">
            <Sparkles className="h-4 w-4 mr-2" />
            {isRu ? 'AI Скоринг' : 'AI Score'}
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            {isRu ? 'Экспорт' : 'Export'}
          </Button>
        </div>
      </div>

      {/* Leads Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium text-sm">{isRu ? 'Лид' : 'Lead'}</th>
                  <th className="text-left p-4 font-medium text-sm">{isRu ? 'Источник' : 'Source'}</th>
                  <th className="text-left p-4 font-medium text-sm">{isRu ? 'Приоритет' : 'Priority'}</th>
                  <th className="text-left p-4 font-medium text-sm">{isRu ? 'Статус' : 'Status'}</th>
                  <th className="text-left p-4 font-medium text-sm">{isRu ? 'Скор' : 'Score'}</th>
                  <th className="text-left p-4 font-medium text-sm">{isRu ? 'Действия' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {displayLeads.map((lead: any) => (
                  <tr key={lead.id} className="border-t hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-medium text-primary">
                          {lead.name?.charAt(0) || lead.email?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-medium">{lead.name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">{lead.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline">{lead.source}</Badge>
                    </td>
                    <td className="p-4">
                      {getPriorityBadge(lead.priority)}
                    </td>
                    <td className="p-4">
                      {getStatusBadge(lead.status)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${lead.score}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{lead.score}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        {lead.email && (
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Mail className="h-4 w-4" />
                          </Button>
                        )}
                        {lead.phone && (
                          <>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Phone className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
