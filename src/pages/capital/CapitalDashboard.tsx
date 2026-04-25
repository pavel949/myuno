import { useNavigate } from 'react-router-dom';
import { useCapitalDashboardStats } from '@/hooks/capital/useCapitalDashboardStats';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, Megaphone, MessageCircle, TrendingUp, KanbanSquare, ArrowRight } from 'lucide-react';
import { PIPELINE_STAGE_LABELS, PIPELINE_STAGES_ORDER, type PipelineStage } from '@/types/capital';
import { useLanguage } from '@/contexts/LanguageContext';

const STAGE_CHART_COLORS: Record<string, string> = {
  lead: '#64748b',
  qualified: '#3b82f6',
  viewing: '#a855f7',
  reservation: '#f59e0b',
  contract: '#10b981',
  closed_won: '#22c55e',
  closed_lost: '#ef4444',
};

export default function CapitalDashboard() {
  const navigate = useNavigate();
  const { data: stats, isLoading } = useCapitalDashboardStats();

  if (isLoading || !stats) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const kpis = [
    { label: 'Контактов', value: stats.contactsCount, icon: Users, path: '/capital/contacts' },
    { label: 'Кампаний', value: stats.activeCampaigns, icon: Megaphone, path: '/capital/campaigns' },
    { label: 'Касаний за неделю', value: stats.outreachThisWeek, icon: MessageCircle, path: '/capital/outreach' },
    { label: 'Ожидаемая комиссия', value: `${stats.expectedCommission.toLocaleString()} THB`, icon: TrendingUp, path: '/capital/pipeline' },
  ];

  const chartData = PIPELINE_STAGES_ORDER
    .filter((s) => s !== 'closed_lost')
    .map((stage) => ({
      stage: PIPELINE_STAGE_LABELS[stage as PipelineStage],
      key: stage,
      count: stats.stageCounts[stage] ?? 0,
    }));

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Дашборд</h1>
        <Badge className="bg-success/20 text-success">Ignatev Capital</Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            onClick={() => navigate(kpi.path)}
            className="rounded-none border border-border/50 p-4 hover:border-success/40 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-none bg-success/10 flex items-center justify-center">
                <kpi.icon className="w-4 h-4 text-success" />
              </div>
            </div>
            <p className="text-2xl font-bold">{kpi.value}</p>
            <p className="text-xs text-muted-foreground">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Today */}
      <div
        className="rounded-none border border-border/50 p-4 hover:border-success/40 transition-colors cursor-pointer"
        onClick={() => navigate('/capital/outreach')}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-medium">Касания на сегодня</h2>
            <p className="text-3xl font-bold text-success mt-1">{stats.todayTouchesCount}</p>
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground" />
        </div>
      </div>

      {/* Pipeline Funnel */}
      <div className="rounded-none border border-border/50 p-4">
        <h2 className="font-medium mb-4 flex items-center gap-2">
          <KanbanSquare className="w-4 h-4" /> Воронка
        </h2>
        {chartData.every((d) => d.count === 0) ? (
          <p className="text-sm text-muted-foreground text-center py-8">Нет данных в воронке</p>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 80, right: 20 }}>
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="stage" width={80} tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {chartData.map((entry) => (
                  <Cell key={entry.key} fill={STAGE_CHART_COLORS[entry.key] || '#10b981'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: 'Контакты', path: '/capital/contacts', icon: Users },
          { label: 'Проекты', path: '/capital/projects', icon: Megaphone },
          { label: 'Воронка', path: '/capital/pipeline', icon: KanbanSquare },
        ].map((link) => (
          <div
            key={link.path}
            onClick={() => navigate(link.path)}
            className="rounded-none border border-border/30 p-3 text-center hover:border-success/40 transition-colors cursor-pointer"
          >
            <link.icon className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-sm">{link.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
