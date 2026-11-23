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
import { Target, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ActivityEntry {
  id: string;
  type: 'vendor' | 'owner';
  action: string;
  entity_name: string;
  created_at: string;
  details?: string;
}

type ActivityType = 'vendor' | 'owner';

function useUnifiedActivity(typeFilter?: ActivityType) {
  return useQuery({
    queryKey: ['admin-crm-activity', typeFilter],
    queryFn: async (): Promise<ActivityEntry[]> => {
      const entries: ActivityEntry[] = [];

      // Vendor prospect activity — embed the prospect so the feed shows the business,
      // not the raw new_value (which for status changes is just the status code).
      if (!typeFilter || typeFilter === 'vendor') {
        const { data, error } = await supabase
          .from('vendor_prospect_activity')
          .select('id, activity_type, old_value, new_value, created_at, prospect_id, vendor_prospects(business_name)')
          .order('created_at', { ascending: false })
          .limit(30);
        if (error) throw error;
        (data || []).forEach((row) => {
          const a = row as unknown as Record<string, unknown> & { vendor_prospects?: { business_name?: string | null } | null };
          const type = a.activity_type as string;
          const isStatus = type === 'status_change';
          entries.push({
            id: `v-${a.id}`,
            type: 'vendor',
            action: isStatus ? `status: ${(a.old_value as string) || '—'} → ${(a.new_value as string) || '—'}` : type,
            entity_name: a.vendor_prospects?.business_name || (a.prospect_id as string)?.slice(0, 8) || '',
            details: !isStatus ? ((a.new_value as string) || undefined) : undefined,
            created_at: a.created_at as string,
          });
        });
      }

      // MCC leads activity removed — mcc_leads table dropped 2026-06-06.

      // Owner prospects
      if (!typeFilter || typeFilter === 'owner') {
        const { data, error } = await typedFrom('owner_prospects')
          .select('id, owner_name, status, created_at, updated_at')
          .order('updated_at', { ascending: false })
          .limit(30);
        if (error) throw error;
        (data || []).forEach((o: Record<string, unknown>) => {
          entries.push({
            id: `o-${o.id}`,
            type: 'owner',
            action: `prospect_${(o.status as string) || 'new'}`,
            entity_name: (o.owner_name as string) || 'Unknown',
            created_at: (o.updated_at as string) || (o.created_at as string),
          });
        });
      }

      return entries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 50);
    },
    staleTime: 15_000,
  });
}

const typeIcons = { vendor: Target, owner: Building2 };
const typeColors = { vendor: 'bg-primary/10 text-primary', owner: 'bg-primary/10 text-primary' };

export function AdminCrmActivityLog() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [typeFilter, setTypeFilter] = useState<string>('');
  // "all" is the Select's reset value — treat it as no filter (it used to hide everything).
  const effectiveType = typeFilter === 'vendor' || typeFilter === 'owner' ? typeFilter : undefined;
  const { data: activities, isLoading, isError, refetch } = useUnifiedActivity(effectiveType);

  if (isLoading) {
    return <div className="space-y-3">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>;
  }

  if (isError) {
    return (
      <div className="py-8 text-center space-y-3">
        <p className="text-sm text-destructive">{isRu ? 'Не удалось загрузить активность' : 'Could not load activity'}</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>{isRu ? 'Повторить' : 'Retry'}</Button>
      </div>
    );
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
                  {a.details && <p className="text-xs text-muted-foreground truncate">{a.details}</p>}
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
