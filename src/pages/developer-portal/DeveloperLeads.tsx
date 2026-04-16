/**
 * Developer Portal — Leads CRM
 */
import { useDeveloperLeads, useUpdateLeadStatus } from '@/hooks/useNewbuildLeads';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { APP_ROUTES } from '@/lib/config/routes';

const STATUS_OPTIONS = ['new', 'contacted', 'qualified', 'deal', 'lost'];
const STATUS_LABELS: Record<string, string> = {
  new: 'Новый', contacted: 'Связались', qualified: 'Квалифицирован', deal: 'Сделка', lost: 'Потерян',
};

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 71 ? 'nb-badge-completed' : score >= 41 ? 'nb-badge-construction' : 'bg-red-500/15 text-red-400 border-red-500/30';
  return <span className={`nb-badge ${color}`}>{score}</span>;
}

export default function DeveloperLeads() {
  const { data: leads = [], isLoading } = useDeveloperLeads();
  const updateStatus = useUpdateLeadStatus();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('');

  const filtered = statusFilter ? leads.filter(l => l.status === statusFilter) : leads;

  const exportCSV = () => {
    const header = 'Имя,Email,Телефон,WhatsApp,Бюджет мин,Бюджет макс,Статус,Источник,Баллы,Дата\n';
    const rows = filtered.map(l =>
      [l.full_name, l.email, l.phone, l.whatsapp, l.budget_min, l.budget_max, l.status, l.source, l.score, l.created_at].join(',')
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'leads.csv'; a.click();
  };

  return (
    <div className="p-6 lg:p-10 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="nb-display text-2xl text-[hsl(var(--nb-text))]">Лиды</h1>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="rounded-md bg-[hsl(var(--nb-surface))] border border-[hsl(var(--nb-glass-border))] px-3 py-2 text-sm text-[hsl(var(--nb-text))]"
          >
            <option value="">Все статусы</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
          <Button size="sm" variant="outline" onClick={exportCSV} className="border-[hsl(var(--nb-glass-border))] text-[hsl(var(--nb-text-secondary))]">
            <Download className="w-4 h-4 mr-1" /> CSV
          </Button>
        </div>
      </div>

      <p className="text-sm text-[hsl(var(--nb-muted))]">
        Найдено: {filtered.length} лидов
      </p>

      <div className="nb-glass overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[hsl(var(--nb-glass-border))]">
              <th className="text-left p-4 text-[hsl(var(--nb-muted))] font-medium">Дата</th>
              <th className="text-left p-4 text-[hsl(var(--nb-muted))] font-medium">Имя</th>
              <th className="text-left p-4 text-[hsl(var(--nb-muted))] font-medium hidden md:table-cell">Контакт</th>
              <th className="text-left p-4 text-[hsl(var(--nb-muted))] font-medium hidden lg:table-cell">Бюджет</th>
              <th className="text-left p-4 text-[hsl(var(--nb-muted))] font-medium hidden sm:table-cell">Источник</th>
              <th className="text-left p-4 text-[hsl(var(--nb-muted))] font-medium">Score</th>
              <th className="text-left p-4 text-[hsl(var(--nb-muted))] font-medium">Статус</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(lead => (
              <tr
                key={lead.id}
                onClick={() => navigate(APP_ROUTES.DEVELOPER_PORTAL_LEAD_DETAIL(lead.id))}
                className="border-b border-[hsl(var(--nb-glass-border))] last:border-0 hover:bg-[hsl(var(--nb-gold)/0.05)] cursor-pointer"
              >
                <td className="p-4 nb-mono text-xs text-[hsl(var(--nb-muted))]">
                  {new Date(lead.created_at).toLocaleDateString('ru-RU')}
                </td>
                <td className="p-4 text-[hsl(var(--nb-text))]">{lead.full_name || '—'}</td>
                <td className="p-4 text-[hsl(var(--nb-text-secondary))] hidden md:table-cell">
                  {lead.phone || lead.whatsapp || lead.email || '—'}
                </td>
                <td className="p-4 nb-mono text-[hsl(var(--nb-gold))] text-xs hidden lg:table-cell">
                  {lead.budget_min || lead.budget_max ? `฿${((lead.budget_min || 0) / 1e6).toFixed(1)}M – ฿${((lead.budget_max || 0) / 1e6).toFixed(1)}M` : '—'}
                </td>
                <td className="p-4 text-[hsl(var(--nb-muted))] text-xs hidden sm:table-cell">{lead.source}</td>
                <td className="p-4"><ScoreBadge score={lead.score} /></td>
                <td className="p-4" onClick={e => e.stopPropagation()}>
                  <select
                    value={lead.status}
                    onChange={e => updateStatus.mutate({ id: lead.id, status: e.target.value })}
                    className="rounded bg-[hsl(var(--nb-bg))] border border-[hsl(var(--nb-glass-border))] px-2 py-1 text-xs text-[hsl(var(--nb-text))]"
                  >
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-[hsl(var(--nb-muted))]">
                  {isLoading ? 'Загрузка...' : 'Лиды не найдены'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
