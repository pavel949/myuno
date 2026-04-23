import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { untypedTables } from '@/lib/untypedTables';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Brain, Bot, Send, Users, TrendingUp, Activity, RefreshCw, Zap, Calendar, UserPlus, AlertTriangle, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AdminAIOps() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const queryClient = useQueryClient();

  // AI Agents status
  const { data: agents } = useQuery({
    queryKey: ['ai-agents-status'],
    queryFn: async () => {
      const { data } = await supabase.from('ai_agents').select('*').order('slug');
      return data || [];
    },
  });

  // AI Agent Logs (last 30 days, aggregated per agent)
  const { data: agentLogs } = useQuery({
    queryKey: ['ai-agent-logs-30d'],
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('ai_agent_logs')
        .select('agent_id, is_success, response_time_ms, tokens_used, created_at, error_code, model')
        .gte('created_at', since)
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  // AI Decisions log (last 24h)
  const { data: decisions } = useQuery({
    queryKey: ['ai-decisions-24h'],
    queryFn: async () => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data } = await untypedTables.aiDecisionsLog()
        .select('*')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(100);
      return data || [];
    },
  });

  // Social posts stats
  const { data: socialStats } = useQuery({
    queryKey: ['social-posts-stats'],
    queryFn: async () => {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await untypedTables.socialPosts().select('status, platform').gte('created_at', since);
      return {
        total: data?.length || 0,
        published: data?.filter(p => p.status === 'published').length || 0,
        failed: data?.filter(p => p.status === 'failed').length || 0,
      };
    },
  });

  // Content calendar
  const { data: calendarItems } = useQuery({
    queryKey: ['content-calendar'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await untypedTables.socialContentCalendar()
        .select('*')
        .gte('scheduled_date', today)
        .order('scheduled_date')
        .order('scheduled_time')
        .limit(14);
      return data || [];
    },
  });

  // Owner prospects pipeline
  const { data: ownerPipeline } = useQuery({
    queryKey: ['owner-pipeline'],
    queryFn: async () => {
      const { data } = await untypedTables.ownerProspects().select('status, nurture_stage, ai_score');
      const stats = {
        total: data?.length || 0,
        new: data?.filter(o => o.status === 'new').length || 0,
        nurturing: data?.filter(o => o.status === 'nurturing').length || 0,
        converted: data?.filter(o => o.status === 'converted').length || 0,
      };
      return stats;
    },
  });

  // Vendor prospects pipeline
  const { data: vendorPipeline } = useQuery({
    queryKey: ['vendor-pipeline-stats'],
    queryFn: async () => {
      const { data } = await supabase.from('vendor_prospects').select('status');
      return {
        total: data?.length || 0,
        new: data?.filter(v => v.status === 'new').length || 0,
        contacted: data?.filter(v => v.status === 'contacted').length || 0,
        onboarded: data?.filter(v => v.status === 'onboarded').length || 0,
      };
    },
  });

  // Aggregate agent health metrics
  const agentHealthMap = new Map<string, {
    calls: number;
    successes: number;
    failures: number;
    avgLatency: number;
    totalTokens: number;
    lastCall: string | null;
    errors: string[];
  }>();

  if (agentLogs) {
    for (const log of agentLogs) {
      const existing = agentHealthMap.get(log.agent_id) || {
        calls: 0, successes: 0, failures: 0, avgLatency: 0, totalTokens: 0, lastCall: null, errors: [],
      };
      existing.calls++;
      if (log.is_success !== false) existing.successes++;
      else {
        existing.failures++;
        if (log.error_code && !existing.errors.includes(log.error_code)) {
          existing.errors.push(log.error_code);
        }
      }
      existing.avgLatency = ((existing.avgLatency * (existing.calls - 1)) + (log.response_time_ms || 0)) / existing.calls;
      existing.totalTokens += log.tokens_used || 0;
      if (!existing.lastCall || log.created_at > existing.lastCall) {
        existing.lastCall = log.created_at;
      }
      agentHealthMap.set(log.agent_id, existing);
    }
  }

  // Computed metrics
  const totalCalls30d = agentLogs?.length || 0;
  const totalTokens30d = agentLogs?.reduce((s, l) => s + (l.tokens_used || 0), 0) || 0;
  const totalDecisions = decisions?.length || 0;
  const errorRate = totalCalls30d ? Math.round((agentLogs?.filter(l => l.is_success === false).length || 0) / totalCalls30d * 100) : 0;
  const activeAgentCount = agentHealthMap.size;

  const [runningAction, setRunningAction] = useState<string | null>(null);

  const runAction = async (action: string, fnName: string, body?: any) => {
    setRunningAction(action);
    try {
      const { data, error } = await supabase.functions.invoke(fnName, { body });
      if (error) throw error;
      toast.success(isRu ? `${action} выполнено` : `${action} completed`, {
        description: JSON.stringify(data?.results || data, null, 2).slice(0, 200),
      });
    } catch (e: any) {
      toast.error(isRu ? 'Ошибка' : 'Error', { description: e.message });
    } finally {
      setRunningAction(null);
    }
  };

  const getHealthBadge = (calls: number, successRate: number) => {
    if (calls === 0) return <Badge variant="outline" className="text-xs gap-1"><Clock className="h-3 w-3" />{isRu ? 'Неактивен' : 'Idle'}</Badge>;
    if (successRate >= 95) return <Badge className="text-xs gap-1 bg-success"><CheckCircle2 className="h-3 w-3" />{isRu ? 'Здоров' : 'Healthy'}</Badge>;
    if (successRate >= 80) return <Badge variant="secondary" className="text-xs gap-1"><AlertTriangle className="h-3 w-3" />{isRu ? 'Предупреждение' : 'Warning'}</Badge>;
    return <Badge variant="destructive" className="text-xs gap-1"><XCircle className="h-3 w-3" />{isRu ? 'Критично' : 'Critical'}</Badge>;
  };

  const daysSince = (dateStr: string | null) => {
    if (!dateStr) return '—';
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return isRu ? 'сегодня' : 'today';
    if (days === 1) return isRu ? 'вчера' : 'yesterday';
    return `${days}${isRu ? 'д назад' : 'd ago'}`;
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1536px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-7 w-7 text-primary" />
            AI Center
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isRu ? 'Мониторинг и управление всеми AI-процессами' : 'Monitor and manage all AI processes'}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => runAction('Platform Intelligence', 'ai-platform-intelligence')}
          disabled={!!runningAction}
        >
          <Zap className="h-4 w-4 mr-1" />
          {isRu ? 'Morning Digest' : 'Morning Digest'}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="text-sm text-muted-foreground">{isRu ? 'AI Вызовов (30д)' : 'AI Calls (30d)'}</div>
            <div className="text-2xl font-bold">{totalCalls30d}</div>
            <div className="text-xs text-muted-foreground">{totalTokens30d.toLocaleString()} tokens</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="text-sm text-muted-foreground">{isRu ? 'Ошибки AI' : 'AI Error Rate'}</div>
            <div className="text-2xl font-bold">{errorRate}%</div>
            <Badge variant={errorRate > 10 ? 'destructive' : 'secondary'} className="mt-1 text-xs">
              {errorRate > 10 ? '⚠️' : '✅'} {errorRate > 10 ? (isRu ? 'Высокий' : 'High') : 'OK'}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="text-sm text-muted-foreground">{isRu ? 'Активных (30д)' : 'Active (30d)'}</div>
            <div className="text-2xl font-bold">{activeAgentCount}</div>
            <div className="text-xs text-muted-foreground">
              {isRu ? `из ${agents?.length || 0} зарег.` : `of ${agents?.length || 0} registered`}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="text-sm text-muted-foreground">{isRu ? 'Посты (7д)' : 'Posts (7d)'}</div>
            <div className="text-2xl font-bold">{socialStats?.published || 0}</div>
            <div className="text-xs text-muted-foreground">
              {socialStats?.failed ? `${socialStats.failed} ${isRu ? 'ошибок' : 'failed'}` : isRu ? 'без ошибок' : 'no errors'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="text-sm text-muted-foreground">{isRu ? 'Решений (24ч)' : 'Decisions (24h)'}</div>
            <div className="text-2xl font-bold">{totalDecisions}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="health">
        <TabsList>
          <TabsTrigger value="health">
            <Activity className="h-4 w-4 mr-1" />
            {isRu ? 'Здоровье' : 'Health'}
          </TabsTrigger>
          <TabsTrigger value="pipelines">
            <TrendingUp className="h-4 w-4 mr-1" />
            {isRu ? 'Воронки' : 'Pipelines'}
          </TabsTrigger>
          <TabsTrigger value="social">
            <Send className="h-4 w-4 mr-1" />
            {isRu ? 'Соцсети' : 'Social'}
          </TabsTrigger>
          <TabsTrigger value="decisions">
            <Bot className="h-4 w-4 mr-1" />
            {isRu ? 'AI Лог' : 'AI Log'}
          </TabsTrigger>
        </TabsList>

        {/* Agent Health Tab */}
        <TabsContent value="health">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{isRu ? 'Матрица здоровья агентов (30 дней)' : 'Agent Health Matrix (30 days)'}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isRu ? 'Агент' : 'Agent'}</TableHead>
                    <TableHead>{isRu ? 'Статус' : 'Status'}</TableHead>
                    <TableHead className="text-right">{isRu ? 'Вызовы' : 'Calls'}</TableHead>
                    <TableHead className="text-right">{isRu ? 'Успех %' : 'Success %'}</TableHead>
                    <TableHead className="text-right">{isRu ? 'Ср. латенция' : 'Avg Latency'}</TableHead>
                    <TableHead className="text-right">Tokens</TableHead>
                    <TableHead>{isRu ? 'Последний' : 'Last Call'}</TableHead>
                    <TableHead>{isRu ? 'Ошибки' : 'Errors'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(agents || []).map((agent: any) => {
                    const health = agentHealthMap.get(agent.id);
                    const calls = health?.calls || 0;
                    const successRate = calls > 0 ? Math.round((health!.successes / calls) * 100) : 0;
                    return (
                      <TableRow key={agent.id} className={!agent.is_active ? 'opacity-50' : ''}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{agent.icon || '🤖'}</span>
                            <div>
                              <div className="font-medium text-sm">{isRu ? agent.name_ru : agent.name_en}</div>
                              <div className="text-xs text-muted-foreground">{agent.slug}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getHealthBadge(calls, successRate)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{calls}</TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {calls > 0 ? `${successRate}%` : '—'}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {calls > 0 ? `${Math.round(health!.avgLatency)}ms` : '—'}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {health?.totalTokens ? health.totalTokens.toLocaleString() : '—'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {daysSince(health?.lastCall || null)}
                        </TableCell>
                        <TableCell>
                          {health?.errors && health.errors.length > 0 ? (
                            <div className="flex gap-1 flex-wrap">
                              {health.errors.slice(0, 2).map(e => (
                                <Badge key={e} variant="destructive" className="text-xs">{e}</Badge>
                              ))}
                            </div>
                          ) : calls > 0 ? (
                            <span className="text-xs text-muted-foreground">—</span>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pipelines Tab */}
        <TabsContent value="pipelines" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    {isRu ? 'Собственники' : 'Owner Pipeline'}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => runAction('Owner Nurture', 'ai-owner-nurture', { action: 'auto_nurture' })} disabled={!!runningAction}>
                    <RefreshCw className={`h-3 w-3 ${runningAction === 'Owner Nurture' ? 'animate-spin' : ''}`} />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { label: isRu ? 'Новые' : 'New', value: ownerPipeline?.new || 0, color: 'bg-primary' },
                    { label: 'Nurturing', value: ownerPipeline?.nurturing || 0, color: 'bg-accent-foreground' },
                    { label: isRu ? 'Конвертированы' : 'Converted', value: ownerPipeline?.converted || 0, color: 'bg-chart-2' },
                  ].map(s => (
                    <div key={s.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${s.color}`} />
                        <span className="text-sm">{s.label}</span>
                      </div>
                      <span className="font-medium">{s.value}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t text-sm text-muted-foreground">
                    {isRu ? 'Всего:' : 'Total:'} {ownerPipeline?.total || 0}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {isRu ? 'Вендоры' : 'Vendor Pipeline'}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => runAction('Vendor Nurture', 'auto-vendor-nurture')} disabled={!!runningAction}>
                    <RefreshCw className={`h-3 w-3 ${runningAction === 'Vendor Nurture' ? 'animate-spin' : ''}`} />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { label: isRu ? 'Новые' : 'New', value: vendorPipeline?.new || 0, color: 'bg-primary' },
                    { label: 'Contacted', value: vendorPipeline?.contacted || 0, color: 'bg-accent-foreground' },
                    { label: 'Onboarded', value: vendorPipeline?.onboarded || 0, color: 'bg-chart-2' },
                  ].map(s => (
                    <div key={s.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${s.color}`} />
                        <span className="text-sm">{s.label}</span>
                      </div>
                      <span className="font-medium">{s.value}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t text-sm text-muted-foreground">
                    {isRu ? 'Всего:' : 'Total:'} {vendorPipeline?.total || 0}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Social Tab */}
        <TabsContent value="social" className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" onClick={() => runAction('Content Plan', 'ai-content-planner', { days: 7 })} disabled={!!runningAction}>
              <Calendar className="h-4 w-4 mr-1" />
              {isRu ? 'Сгенерировать план на неделю' : 'Generate weekly plan'}
            </Button>
          </div>
          {calendarItems && calendarItems.length > 0 ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{isRu ? 'Контент-календарь' : 'Content Calendar'}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isRu ? 'Дата' : 'Date'}</TableHead>
                      <TableHead>{isRu ? 'Заголовок' : 'Title'}</TableHead>
                      <TableHead>{isRu ? 'Статус' : 'Status'}</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {calendarItems.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-sm">{item.scheduled_date}</TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">{item.title}</TableCell>
                        <TableCell>
                          <Badge variant={
                            item.status === 'published' ? 'default' :
                            item.status === 'approved' ? 'secondary' :
                            item.status === 'failed' ? 'destructive' : 'outline'
                          }>
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {item.status === 'planned' && (
                            <Button variant="ghost" size="sm" onClick={async () => {
                              try {
                                const { error } = await untypedTables.socialContentCalendar().update({ status: 'approved' }).eq('id', item.id);
                                if (error) throw error;
                                queryClient.invalidateQueries({ queryKey: ['content-calendar'] });
                                toast.success(isRu ? 'Одобрено' : 'Approved');
                              } catch (e: any) {
                                toast.error(isRu ? 'Ошибка' : 'Error', { description: e.message });
                              }
                            }}>✅</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                {isRu ? 'Нет запланированных постов. Сгенерируйте контент-план.' : 'No scheduled posts. Generate a content plan.'}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* AI Decision Log Tab */}
        <TabsContent value="decisions">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isRu ? 'Время' : 'Time'}</TableHead>
                    <TableHead>{isRu ? 'Агент' : 'Agent'}</TableHead>
                    <TableHead>{isRu ? 'Действие' : 'Action'}</TableHead>
                    <TableHead>Tokens</TableHead>
                    <TableHead>{isRu ? 'Статус' : 'Status'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(decisions || []).slice(0, 30).map((d: any) => (
                    <TableRow key={d.id}>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(d.created_at).toLocaleTimeString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{d.agent_slug}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{d.decision_type}</TableCell>
                      <TableCell className="text-sm">{d.tokens_used || '—'}</TableCell>
                      <TableCell>
                        <Badge variant={d.status === 'error' ? 'destructive' : 'secondary'} className="text-xs">
                          {d.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!decisions || decisions.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        {isRu ? 'Нет решений за последние 24 часа' : 'No decisions in the last 24 hours'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
