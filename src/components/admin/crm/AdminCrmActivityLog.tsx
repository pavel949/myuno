import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { typedFrom } from '@/lib/untypedTables';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { Target, Users, Building2 } from 'lucide-react';

interface ActivityEntry {
  id: string;
  type: 'vendor' | 'user' | 'owner';
  action: string;
  entity_name: string;
  created_at: string;
  details?: string;
}



function useUnifiedActivity(typeFilter?: string) {
  return useQuery({
    queryKey: ['admin-crm-activity', typeFilter],
    queryFn: async (): Promise<ActivityEntry[]> => {
      const entries: ActivityEntry[] = [];

      // Vendor prospect activity
      if (!typeFilter || typeFilter === 'vendor') {
        const { data } = await supabase
          .from('vendor_prospect_activity')
          .select('id, activity_type, new_value, created_at, prospect_id')
          .order('created_at', { ascending: false })
          .limit(20);
        (data || []).forEach((a: Record<string, unknown>) => {
          entries.push({
            id: `v-${a.id}`,
            type: 'vendor',
            action: a.activity_type as string,
            entity_name: (a.new_value as string) || (a.prospect_id as string)?.slice(0, 8) || '',
            created_at: a.created_at as string,
          });
        });
      }

      // MCC leads activity
      if (!typeFilter || typeFilter === 'user') {
        const { data } = await typedFrom('mcc_leads')
          .select('id, full_name, status, created_at')
          .order('created_at', { ascending: false })
          .limit(20);
        (data || []).forEach((l: Record<string, unknown>) => {
          entries.push({
            id: `u-${l.id}`,
            type: 'user',
            action: `lead_${(l.status as string) || 'created'}`,
            entity_name: (l.full_name as string) || 'Unknown',
            created_at: l.created_at as string,
          });
        });
      }

      // Owner prospects
      if (!typeFilter || typeFilter === 'owner') {
        const { data } = await typedFrom('owner_prospects')
          .select('id, owner_name, status, created_at')
          .order('created_at', { ascending: false })
          .limit(20);
        (data || []).forEach((o: Record<string, unknown>) => {
          entries.push({
            id: `o-${o.id}`,
            type: 'owner',
            action: `prospect_${(o.status as string) || 'new'}`,
            entity_name: (o.owner_name as string) || 'Unknown',
            created_at: o.created_at as string,
          });
        });
      }

      return entries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 50);
    },
    staleTime: 15_000,
  });
}

const typeIcons = { vendor: Target, user: Users, owner: Building2 };
const typeColors = { vendor: 'bg-blue-100 text-blue-800', user: 'bg-green-100 text-green-800', owner: 'bg-purple-100 text-purple-800' };

export function AdminCrmActivityLog() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [typeFilter, setTypeFilter] = useState<string>('');
  const { data: activities, isLoading } = useUnifiedActivity(typeFilter || undefined);

  if (isLoading) {
    return <div className="space-y-3">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>;
  }

  return (
    <div className="space-y-4">
      <Select value={typeFilter} onValueChange={setTypeFilter}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder={isRu ? 'Все типы' : 'All types'} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{isRu ? 'Все' : 'All'}</SelectItem>
          <SelectItem value="vendor">{isRu ? 'Вендоры' : 'Vendors'}</SelectItem>
          <SelectItem value="user">{isRu ? 'Пользователи' : 'Users'}</SelectItem>
          <SelectItem value="owner">{isRu ? 'Собственники' : 'Owners'}</SelectItem>
        </SelectContent>
      </Select>

      <div className="space-y-2">
        {(activities || []).map((a) => {
          const Icon = typeIcons[a.type];
          return (
            <Card key={a.id}>
              <CardContent className="p-3 flex items-center gap-3">
                <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{a.entity_name}</p>
                  <p className="text-xs text-muted-foreground">{a.action}</p>
                </div>
                <Badge className={`${typeColors[a.type]} text-xs flex-shrink-0`}>{a.type}</Badge>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                </span>
              </CardContent>
            </Card>
          );
        })}
        {(!activities || activities.length === 0) && (
          <p className="text-center py-8 text-muted-foreground">{isRu ? 'Нет активности' : 'No activity yet'}</p>
        )}
      </div>
    </div>
  );
}
