/**
 * Developer Portal — Analytics page with Recharts
 */
import { useDeveloperProfile, useDeveloperProjects } from '@/hooks/useDeveloperPortal';
import { useDeveloperLeads } from '@/hooks/useNewbuildLeads';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['hsl(215, 80%, 55%)', 'hsl(43, 52%, 54%)', 'hsl(142, 70%, 45%)', 'hsl(38, 92%, 50%)', 'hsl(0, 70%, 50%)'];

export default function DeveloperAnalytics() {
  const { data: developer } = useDeveloperProfile();
  const { data: projects = [] } = useDeveloperProjects(developer?.id);
  const { data: leads = [] } = useDeveloperLeads();

  // Leads by source
  const sourceMap: Record<string, number> = {};
  leads.forEach(l => { sourceMap[l.source] = (sourceMap[l.source] || 0) + 1; });
  const sourceData = Object.entries(sourceMap).map(([name, value]) => ({ name, value }));

  // Leads by status
  const statusMap: Record<string, number> = {};
  leads.forEach(l => { statusMap[l.status] = (statusMap[l.status] || 0) + 1; });
  const statusData = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

  // Leads over time (last 30 days)
  const now = Date.now();
  const dailyMap: Record<string, number> = {};
  leads.forEach(l => {
    const d = new Date(l.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
    dailyMap[d] = (dailyMap[d] || 0) + 1;
  });
  const dailyData = Object.entries(dailyMap).slice(-14).map(([date, count]) => ({ date, count }));

  return (
    <div className="p-6 lg:p-10 space-y-8">
      <h1 className="nb-display text-2xl text-[hsl(var(--nb-text))]">Аналитика</h1>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Проекты', value: projects.length },
          { label: 'Всего лидов', value: leads.length },
          { label: 'Конверсия в сделку', value: leads.length ? `${Math.round((statusMap.deal || 0) / leads.length * 100)}%` : '—' },
          { label: 'Новые (30д)', value: leads.filter(l => now - new Date(l.created_at).getTime() < 30 * 86400000).length },
        ].map(s => (
          <div key={s.label} className="nb-glass p-5">
            <p className="text-xs text-[hsl(var(--nb-muted))] mb-1">{s.label}</p>
            <p className="nb-mono text-2xl text-[hsl(var(--nb-text))]">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads over time */}
        <div className="nb-glass p-6">
          <h3 className="nb-label mb-4">Лиды по дням</h3>
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={dailyData}>
                <XAxis dataKey="date" tick={{ fill: 'hsl(50, 5%, 50%)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'hsl(50, 5%, 50%)', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#141414', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 8 }} />
                <Bar dataKey="count" fill="hsl(43, 52%, 54%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-[hsl(var(--nb-muted))] py-16">Нет данных</p>
          )}
        </div>

        {/* Leads by status */}
        <div className="nb-glass p-6">
          <h3 className="nb-label mb-4">Статусы лидов</h3>
          {statusData.length > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#141414', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {statusData.map((s, i) => (
                  <div key={s.name} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-[hsl(var(--nb-text-secondary))]">{s.name}</span>
                    <span className="nb-mono text-[hsl(var(--nb-text))]">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-center text-[hsl(var(--nb-muted))] py-16">Нет данных</p>
          )}
        </div>

        {/* Leads by source */}
        <div className="nb-glass p-6 lg:col-span-2">
          <h3 className="nb-label mb-4">Источники лидов</h3>
          {sourceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sourceData} layout="vertical">
                <XAxis type="number" tick={{ fill: 'hsl(50, 5%, 50%)', fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fill: 'hsl(50, 5%, 50%)', fontSize: 11 }} width={120} />
                <Tooltip contentStyle={{ background: '#141414', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 8 }} />
                <Bar dataKey="value" fill="hsl(43, 52%, 54%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-[hsl(var(--nb-muted))] py-16">Нет данных</p>
          )}
        </div>
      </div>
    </div>
  );
}
