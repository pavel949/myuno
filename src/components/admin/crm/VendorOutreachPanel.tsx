import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { typedFrom } from '@/lib/untypedTables';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { Send, RefreshCw, Mail, MessageSquare, Users, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface OutreachStats {
  notContacted: number;
  contacted: number;
  followUp1: number;
  followUp2: number;
  followUp3: number;
  registered: number;
  total: number;
}

interface OutreachLogEntry {
  id: string;
  contact_id: string;
  channel: 'email' | 'whatsapp';
  status: string;
  followup_sequence: number;
  subject: string | null;
  sent_at: string;
  next_followup_at: string | null;
  contact: {
    first_name: string | null;
    last_name: string | null;
    company_name: string | null;
  } | null;
}



function useOutreachStats() {
  return useQuery({
    queryKey: ['vendor-outreach-stats'],
    queryFn: async (): Promise<OutreachStats> => {
      const { data, error } = await supabase
        .from('crm_contacts')
        .select('outreach_status')
        .eq('contact_type', 'vendor');

      if (error) throw error;

      const contacts = data || [];
      return {
        notContacted: contacts.filter(c => c.outreach_status === 'not_contacted').length,
        contacted: contacts.filter(c => c.outreach_status === 'contacted').length,
        followUp1: contacts.filter(c => c.outreach_status === 'follow_up_1').length,
        followUp2: contacts.filter(c => c.outreach_status === 'follow_up_2').length,
        followUp3: contacts.filter(c => c.outreach_status === 'follow_up_3').length,
        registered: contacts.filter(c => c.outreach_status === 'registered').length,
        total: contacts.length,
      };
    },
    staleTime: 15_000,
  });
}

function useOutreachLog() {
  return useQuery({
    queryKey: ['vendor-outreach-log'],
    queryFn: async (): Promise<OutreachLogEntry[]> => {
      const { data, error } = await typedFrom('vendor_outreach_log')
        .select(`
          id, contact_id, channel, status, followup_sequence, subject, sent_at, next_followup_at,
          crm_contacts!contact_id(first_name, last_name, company_name)
        `)
        .order('sent_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      return (data || []).map((entry: any) => ({
        ...entry,
        contact: entry.crm_contacts,
      }));
    },
    staleTime: 15_000,
  });
}

function useRunOutreach() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (action: 'initial' | 'followup') => {
      const { data, error } = await supabase.functions.invoke('vendor-outreach-agent', {
        body: { action, limit: 10 },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-outreach-stats'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-outreach-log'] });
      toast.success(`Outreach completed: ${data.successful}/${data.processed} sent`);
    },
    onError: (error) => {
      toast.error(`Outreach failed: ${error.message}`);
    },
  });
}

const statusColors: Record<string, string> = {
  sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  opened: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  clicked: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  replied: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  registered: 'bg-primary/10 text-primary',
  failed: 'bg-destructive/10 text-destructive',
};

export function VendorOutreachPanel() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: stats, isLoading: statsLoading } = useOutreachStats();
  const { data: log, isLoading: logLoading } = useOutreachLog();
  const runOutreach = useRunOutreach();

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{isRu ? 'Не связывались' : 'Not Contacted'}</span>
            </div>
            {statsLoading ? (
              <Skeleton className="h-7 w-12 mt-1" />
            ) : (
              <p className="text-2xl font-bold mt-1">{stats?.notContacted || 0}</p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Send className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">{isRu ? 'Отправлено' : 'Sent'}</span>
            </div>
            {statsLoading ? (
              <Skeleton className="h-7 w-12 mt-1" />
            ) : (
              <p className="text-2xl font-bold mt-1">{stats?.contacted || 0}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">{isRu ? 'Follow-up 1' : 'Follow-up 1'}</span>
            </div>
            {statsLoading ? (
              <Skeleton className="h-7 w-12 mt-1" />
            ) : (
              <p className="text-2xl font-bold mt-1">{stats?.followUp1 || 0}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-orange-500" />
              <span className="text-xs text-muted-foreground">{isRu ? 'Follow-up 2' : 'Follow-up 2'}</span>
            </div>
            {statsLoading ? (
              <Skeleton className="h-7 w-12 mt-1" />
            ) : (
              <p className="text-2xl font-bold mt-1">{stats?.followUp2 || 0}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-xs text-muted-foreground">{isRu ? 'Финальный' : 'Final'}</span>
            </div>
            {statsLoading ? (
              <Skeleton className="h-7 w-12 mt-1" />
            ) : (
              <p className="text-2xl font-bold mt-1">{stats?.followUp3 || 0}</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">{isRu ? 'Регистрации' : 'Registered'}</span>
            </div>
            {statsLoading ? (
              <Skeleton className="h-7 w-12 mt-1" />
            ) : (
              <p className="text-2xl font-bold text-primary mt-1">{stats?.registered || 0}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => runOutreach.mutate('initial')}
          disabled={runOutreach.isPending || (stats?.notContacted || 0) === 0}
          className="gap-2"
        >
          <Send className="h-4 w-4" />
          {isRu ? 'Запустить Outreach' : 'Run Initial Outreach'}
          {stats?.notContacted ? ` (${stats.notContacted})` : ''}
        </Button>
        
        <Button
          variant="outline"
          onClick={() => runOutreach.mutate('followup')}
          disabled={runOutreach.isPending}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          {isRu ? 'Follow-up рассылка' : 'Send Follow-ups'}
        </Button>
      </div>

      {/* Activity Log */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{isRu ? 'Лог активности' : 'Activity Log'}</CardTitle>
        </CardHeader>
        <CardContent>
          {logLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : !log || log.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              {isRu ? 'Нет отправленных сообщений' : 'No outreach messages yet'}
            </p>
          ) : (
            <div className="space-y-2">
              {log.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  {entry.channel === 'whatsapp' ? (
                    <MessageSquare className="h-4 w-4 text-green-600 flex-shrink-0" />
                  ) : (
                    <Mail className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {entry.contact?.company_name || 
                       `${entry.contact?.first_name || ''} ${entry.contact?.last_name || ''}`.trim() || 
                       'Unknown'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {entry.subject || `Sequence ${entry.followup_sequence}`}
                    </p>
                  </div>

                  <Badge variant="secondary" className={`${statusColors[entry.status] || ''} text-xs flex-shrink-0`}>
                    {entry.status}
                  </Badge>

                  <span className="text-xs text-muted-foreground flex-shrink-0 hidden sm:inline">
                    {formatDistanceToNow(new Date(entry.sent_at), { addSuffix: true })}
                  </span>

                  {entry.next_followup_at && new Date(entry.next_followup_at) > new Date() && (
                    <Badge variant="outline" className="text-xs flex-shrink-0 hidden md:inline-flex">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDistanceToNow(new Date(entry.next_followup_at))}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
