/**
 * Developer Portal — Overview dashboard
 */
import { useDeveloperProfile, useDeveloperProjects } from '@/hooks/useDeveloperPortal';
import { useDeveloperLeads } from '@/hooks/useNewbuildLeads';
import { useApplyAsDeveloper } from '@/hooks/useDeveloperPortal';
import { Link } from 'react-router-dom';
import { Building2, Users, Eye, TrendingUp, Plus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

function ApplyForm() {
  const apply = useApplyAsDeveloper();
  const [form, setForm] = useState({ name_en: '', name_ru: '', email: '', phone: '' });

  return (
    <div className="max-w-lg mx-auto p-8">
      <h1 className="nb-display text-3xl text-[hsl(var(--nb-gold))] mb-4">Стать девелопером</h1>
      <p className="text-[hsl(var(--nb-text-secondary))] mb-8">
        Разместите свои проекты на лучшей платформе Пхукета. Получайте лиды напрямую.
      </p>
      <div className="space-y-4">
        <Input placeholder="Company name (EN)" value={form.name_en} onChange={e => setForm(p => ({ ...p, name_en: e.target.value }))} className="bg-[hsl(var(--nb-surface))] border-[hsl(var(--nb-glass-border))]" />
        <Input placeholder="Название компании (RU)" value={form.name_ru} onChange={e => setForm(p => ({ ...p, name_ru: e.target.value }))} className="bg-[hsl(var(--nb-surface))] border-[hsl(var(--nb-glass-border))]" />
        <Input placeholder="Email" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="bg-[hsl(var(--nb-surface))] border-[hsl(var(--nb-glass-border))]" />
        <Input placeholder="Телефон" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="bg-[hsl(var(--nb-surface))] border-[hsl(var(--nb-glass-border))]" />
        <button
          className="nb-btn-gold w-full"
          disabled={!form.name_en || !form.name_ru || apply.isPending}
          onClick={() => apply.mutate(form)}
        >
          {apply.isPending ? 'Отправка...' : 'Отправить заявку'}
        </button>
      </div>
    </div>
  );
}

export default function DeveloperOverview() {
  const { data: developer, isLoading } = useDeveloperProfile();
  const { data: projects = [] } = useDeveloperProjects(developer?.id);
  const { data: leads = [] } = useDeveloperLeads();

  if (isLoading) return null;
  if (!developer) return <ApplyForm />;

  const newLeads = leads.filter(l => l.status === 'new').length;
  const activeProjects = projects.filter((p: any) => p.is_active).length;

  const kpis = [
    { label: 'Проекты', value: activeProjects, icon: Building2 },
    { label: 'Новые лиды', value: newLeads, icon: Users },
    { label: 'Всего лидов', value: leads.length, icon: TrendingUp },
  ];

  return (
    <div className="p-6 lg:p-10 space-y-8">
      <div>
        <h1 className="nb-display text-3xl text-[hsl(var(--nb-text))]">
          Добрый день, <span className="text-[hsl(var(--nb-gold))]">{developer.name_en}</span>
        </h1>
        {!developer.is_verified && (
          <p className="text-sm text-warning mt-2">⏳ Аккаунт на проверке</p>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpis.map(kpi => (
          <div key={kpi.label} className="nb-glass p-6">
            <div className="flex items-center gap-3 mb-3">
              <kpi.icon className="w-5 h-5 text-[hsl(var(--nb-gold))]" />
              <span className="text-sm text-[hsl(var(--nb-text-secondary))]">{kpi.label}</span>
            </div>
            <p className="nb-mono text-3xl text-[hsl(var(--nb-text))]">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link to="/developer-portal/projects/new">
          <Button variant="outline" className="border-[hsl(var(--nb-gold)/0.3)] text-[hsl(var(--nb-gold))] hover:bg-[hsl(var(--nb-gold)/0.1)]">
            <Plus className="w-4 h-4 mr-2" /> Новый проект
          </Button>
        </Link>
        <Link to="/developer-portal/leads">
          <Button variant="outline" className="border-[hsl(var(--nb-glass-border))] text-[hsl(var(--nb-text-secondary))] hover:text-[hsl(var(--nb-text))]">
            <Users className="w-4 h-4 mr-2" /> Просмотреть лиды
          </Button>
        </Link>
      </div>

      {/* Recent Leads */}
      {leads.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[hsl(var(--nb-text))]">Последние лиды</h2>
            <Link to="/developer-portal/leads" className="text-sm text-[hsl(var(--nb-gold))] flex items-center gap-1 hover:underline">
              Все <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="nb-glass overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[hsl(var(--nb-glass-border))]">
                  <th className="text-left p-4 text-[hsl(var(--nb-muted))] font-medium">Имя</th>
                  <th className="text-left p-4 text-[hsl(var(--nb-muted))] font-medium hidden sm:table-cell">Контакт</th>
                  <th className="text-left p-4 text-[hsl(var(--nb-muted))] font-medium">Статус</th>
                  <th className="text-left p-4 text-[hsl(var(--nb-muted))] font-medium hidden md:table-cell">Дата</th>
                </tr>
              </thead>
              <tbody>
                {leads.slice(0, 5).map(lead => (
                  <tr key={lead.id} className="border-b border-[hsl(var(--nb-glass-border))] last:border-0">
                    <td className="p-4 text-[hsl(var(--nb-text))]">{lead.full_name || '—'}</td>
                    <td className="p-4 text-[hsl(var(--nb-text-secondary))] hidden sm:table-cell">{lead.phone || lead.email || '—'}</td>
                    <td className="p-4">
                      <span className={`nb-badge ${lead.status === 'new' ? 'nb-badge-upcoming' : lead.status === 'qualified' ? 'nb-badge-completed' : 'nb-badge-construction'}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="p-4 text-[hsl(var(--nb-muted))] nb-mono text-xs hidden md:table-cell">
                      {new Date(lead.created_at).toLocaleDateString('ru-RU')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
