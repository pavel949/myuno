/**
 * AdminNbLeads — admin inbox for newbuilds leads (`nb_leads` table).
 *
 * Wave 2 / C10. Until now no UI surfaced these leads. Lightweight list with
 * filters by status and quick contact info; full CRM lives elsewhere.
 */
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Phone, Building2, Calendar, Inbox } from 'lucide-react';
import { format } from 'date-fns';

interface NbLeadRow {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  status: string | null;
  source: string | null;
  score: number | null;
  project_id: string | null;
  developer_id: string | null;
  message: string | null;
  created_at: string;
}

export default function AdminNbLeads() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [status, setStatus] = useState<string>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-nb-leads', status],
    queryFn: async () => {
      let q = supabase
        .from('nb_leads')
        .select('id,full_name,email,phone,status,source,score,project_id,developer_id,message,created_at')
        .order('created_at', { ascending: false })
        .limit(200);
      if (status !== 'all') q = q.eq('status', status);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as NbLeadRow[];
    },
  });

  return (
    <PageContainer>
      <PageHeader title={isRu ? 'Заявки по новостройкам' : 'Newbuilds Leads'} showBack />

      <div className="flex items-center gap-3 mb-4">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isRu ? 'Все статусы' : 'All statuses'}</SelectItem>
            <SelectItem value="new">{isRu ? 'Новые' : 'New'}</SelectItem>
            <SelectItem value="contacted">{isRu ? 'Связались' : 'Contacted'}</SelectItem>
            <SelectItem value="qualified">{isRu ? 'Квалифицированы' : 'Qualified'}</SelectItem>
            <SelectItem value="converted">{isRu ? 'Конвертированы' : 'Converted'}</SelectItem>
            <SelectItem value="lost">{isRu ? 'Потеряны' : 'Lost'}</SelectItem>
          </SelectContent>
        </Select>
        {data && (
          <span className="text-sm text-muted-foreground">
            {data.length} {isRu ? 'заявок' : 'leads'}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : !data || data.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Inbox className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">{isRu ? 'Заявок пока нет' : 'No leads yet'}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {data.map((row) => (
            <Card key={row.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start gap-3 mb-2">
                  <div>
                    <div className="font-medium">{row.full_name || (isRu ? 'Без имени' : 'No name')}</div>
                    {row.source && (
                      <div className="text-xs text-muted-foreground">{row.source}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {typeof row.score === 'number' && (
                      <Badge variant="outline" className="text-xs">{row.score}</Badge>
                    )}
                    <Badge variant={row.status === 'new' ? 'default' : 'outline'} className="text-xs">
                      {row.status || 'new'}
                    </Badge>
                  </div>
                </div>
                {row.message && (
                  <p className="text-sm mb-2 line-clamp-2">{row.message}</p>
                )}
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  {row.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{row.phone}</span>}
                  {row.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{row.email}</span>}
                  {row.project_id && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{row.project_id.slice(0, 8)}</span>}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(row.created_at), 'dd MMM yyyy HH:mm')}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
