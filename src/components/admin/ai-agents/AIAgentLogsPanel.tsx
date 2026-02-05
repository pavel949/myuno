/**
 * AIAgentLogsPanel - Displays recent logs for a specific AI agent
 * Per admin_ai_observability_spec.md
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  RefreshCw, 
  Clock, 
  MessageSquare, 
  Zap, 
  CheckCircle2, 
  XCircle, 
  Copy,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { toast } from 'sonner';

interface AgentLog {
  id: string;
  agent_id: string;
  session_id: string | null;
  user_id: string | null;
  messages_count: number | null;
  response_time_ms: number | null;
  tokens_used: number | null;
  user_rating: number | null;
  feedback: string | null;
  created_at: string;
}

interface AIAgentLogsPanelProps {
  agentId: string;
  className?: string;
}

export function AIAgentLogsPanel({ agentId, className }: AIAgentLogsPanelProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d'>('24h');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const getTimeFilter = () => {
    const now = new Date();
    switch (timeRange) {
      case '1h':
        return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    }
  };

  const { data: logs, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['ai-agent-logs', agentId, timeRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_agent_logs')
        .select('*')
        .eq('agent_id', agentId)
        .gte('created_at', getTimeFilter())
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []) as AgentLog[];
    },
    refetchInterval: 30000, // Auto-refresh every 30s
  });

  // Calculate stats
  const stats = React.useMemo(() => {
    if (!logs || logs.length === 0) {
      return { total: 0, avgTime: 0, avgTokens: 0, avgRating: null };
    }

    const validTimes = logs.filter(l => l.response_time_ms != null);
    const validTokens = logs.filter(l => l.tokens_used != null);
    const validRatings = logs.filter(l => l.user_rating != null);

    return {
      total: logs.length,
      avgTime: validTimes.length > 0
        ? Math.round(validTimes.reduce((s, l) => s + (l.response_time_ms || 0), 0) / validTimes.length)
        : 0,
      avgTokens: validTokens.length > 0
        ? Math.round(validTokens.reduce((s, l) => s + (l.tokens_used || 0), 0) / validTokens.length)
        : 0,
      avgRating: validRatings.length > 0
        ? (validRatings.reduce((s, l) => s + (l.user_rating || 0), 0) / validRatings.length).toFixed(1)
        : null,
    };
  }, [logs]);

  const copySessionId = (sessionId: string) => {
    navigator.clipboard.writeText(sessionId);
    toast.success(isRu ? 'Скопировано' : 'Copied');
  };

  const formatTime = (date: string) => {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: isRu ? ru : enUS,
    });
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {isRu ? 'Логи вызовов' : 'Invocation Logs'}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
              <SelectTrigger className="w-[100px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">{isRu ? '1 час' : '1 hour'}</SelectItem>
                <SelectItem value="24h">{isRu ? '24 часа' : '24 hours'}</SelectItem>
                <SelectItem value="7d">{isRu ? '7 дней' : '7 days'}</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-muted/50 rounded-lg p-2 text-center">
            <p className="text-lg font-semibold">{stats.total}</p>
            <p className="text-[10px] text-muted-foreground uppercase">
              {isRu ? 'Вызовов' : 'Calls'}
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-2 text-center">
            <p className="text-lg font-semibold">{stats.avgTime}<span className="text-xs">ms</span></p>
            <p className="text-[10px] text-muted-foreground uppercase">
              {isRu ? 'Ср. время' : 'Avg Time'}
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-2 text-center">
            <p className="text-lg font-semibold">{stats.avgTokens}</p>
            <p className="text-[10px] text-muted-foreground uppercase">
              {isRu ? 'Ср. токенов' : 'Avg Tokens'}
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-2 text-center">
            <p className="text-lg font-semibold">{stats.avgRating || '—'}</p>
            <p className="text-[10px] text-muted-foreground uppercase">
              {isRu ? 'Рейтинг' : 'Rating'}
            </p>
          </div>
        </div>

        {/* Logs Table */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : logs && logs.length > 0 ? (
          <ScrollArea className="h-[300px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>{isRu ? 'Время' : 'Time'}</TableHead>
                  <TableHead>{isRu ? 'Сессия' : 'Session'}</TableHead>
                  <TableHead className="text-center">
                    <MessageSquare className="h-3.5 w-3.5 mx-auto" />
                  </TableHead>
                  <TableHead className="text-center">
                    <Clock className="h-3.5 w-3.5 mx-auto" />
                  </TableHead>
                  <TableHead className="text-center">
                    <Zap className="h-3.5 w-3.5 mx-auto" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <React.Fragment key={log.id}>
                    <TableRow 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                    >
                      <TableCell className="py-2">
                        {expandedLog === log.id ? (
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell className="py-2 text-xs">
                        {formatTime(log.created_at)}
                      </TableCell>
                      <TableCell className="py-2">
                        {log.session_id ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-1 font-mono text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              copySessionId(log.session_id!);
                            }}
                          >
                            {log.session_id.slice(0, 8)}...
                            <Copy className="h-3 w-3 ml-1" />
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="py-2 text-center text-xs">
                        {log.messages_count || '—'}
                      </TableCell>
                      <TableCell className="py-2 text-center text-xs">
                        {log.response_time_ms ? `${log.response_time_ms}ms` : '—'}
                      </TableCell>
                      <TableCell className="py-2 text-center text-xs">
                        {log.tokens_used || '—'}
                      </TableCell>
                    </TableRow>
                    {expandedLog === log.id && (
                      <TableRow>
                        <TableCell colSpan={6} className="bg-muted/30 py-3">
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <span className="text-muted-foreground">User ID:</span>{' '}
                              <span className="font-mono">{log.user_id?.slice(0, 8) || 'Anonymous'}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Rating:</span>{' '}
                              {log.user_rating ? `${log.user_rating}/5` : 'Not rated'}
                            </div>
                            {log.feedback && (
                              <div className="col-span-2">
                                <span className="text-muted-foreground">Feedback:</span>{' '}
                                <span className="italic">"{log.feedback}"</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{isRu ? 'Нет логов за этот период' : 'No logs for this period'}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AIAgentLogsPanel;
