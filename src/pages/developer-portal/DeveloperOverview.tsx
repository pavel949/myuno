/**
 * Developer Portal — Overview dashboard
 */
import { useDeveloperProfile, useDeveloperProjects } from '@/hooks/useDeveloperPortal';
import { useDeveloperLeads } from '@/hooks/useNewbuildLeads';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Users, TrendingUp, Plus, ArrowRight, AlertTriangle, PenLine, Banknote, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { APP_ROUTES } from '@/lib/config/routes';

export default function DeveloperOverview() {
  const { data: developer, isLoading } = useDeveloperProfile();
  const { data: projects = [] } = useDeveloperProjects(developer?.id);
  const { data: leads = [] } = useDeveloperLeads();
  const navigate = useNavigate();

  if (isLoading) return null;

  const newLeads = leads.filter(l => l.status === 'new').length;
  const activeProjects = projects.filter((p: any) => p.is_active).length;

  // Projects waiting approval
  const pendingApproval = projects.filter((p: any) => p.is_approved === false && p.is_active === true);

  // Projects needing attention (no cover or short description)
  const attentionProjects = projects.filter((p: any) =>
    !p.cover_image || !p.description_en || (p.description_en as string).length < 50
  );

  const kpis = [
    { label: 'Проекты', value: activeProjects, icon: Building2 },
    { label: 'Новые лиды', value: newLeads, icon: Users },
    { label: 'Всего лидов', value: leads.length, icon: TrendingUp },
  ];

  return (
    <div className="p-6 lg:p-10 space-y-8">
      <div>
        <h1 className="nb-display text-3xl text-[hsl(var(--nb-text))]">
          Добрый день, <span className="text-[hsl(var(--nb-gold))]">{developer!.name_en}</span>
        </h1>
        {!developer!.is_verified && (
          <p className="text-sm text-amber-400 mt-2">⏳ Аккаунт на проверке</p>
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

      {/* Pending approval banner */}
      {pendingApproval.length > 0 && (
        <div className="border-l-4 border-amber-400 bg-amber-500/10 p-4 rounded-r-lg">
          <p className="text-sm text-amber-300">
            <span className="font-semibold">{pendingApproval.length} проект{pendingApproval.length > 1 ? 'а' : ''}</span> ожидает проверки.
            Страница появится в каталоге после одобрения.
          </p>
        </div>
      )}

      {/* Attention items */}
      {attentionProjects.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-[hsl(var(--nb-text))]">Требуют внимания</h2>
          </div>
          <div className="space-y-2">
            {attentionProjects.map((p: any) => {
              const issues: string[] = [];
              if (!p.cover_image) issues.push('нет обложки');
              if (!p.description_en || (p.description_en as string).length < 50) issues.push('описание слишком короткое');
              return (
                <div key={p.id} className="nb-glass p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-[hsl(var(--nb-text))]">{p.name_en || p.name_ru}</p>
                    <p className="text-xs text-amber-400 mt-0.5">{issues.join(', ')}</p>
                  </div>
                  <Link to={APP_ROUTES.DEVELOPER_PORTAL_PROJECT_EDIT(p.id)}>
                    <Button size="sm" variant="outline" className="border-[hsl(var(--nb-glass-border))] text-[hsl(var(--nb-text-secondary))] shrink-0">
                      Редактировать
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Capital Marketplace CTAs — anonymized listings + raise funding */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Link
          to="/invest/submit?intent=raise_capital&category=residential_development"
          className="nb-glass p-5 hover:border-[hsl(var(--nb-gold)/0.4)] transition-colors group"
        >
          <div className="flex items-center gap-2 mb-2">
            <Banknote className="w-4 h-4 text-[hsl(var(--nb-gold))]" />
            <h3 className="font-semibold text-[hsl(var(--nb-text))]">Привлечь капитал</h3>
          </div>
          <p className="text-xs text-[hsl(var(--nb-text-secondary))] mb-3">
            Подайте проект в анонимизированный investor board. Заявки попадают в Ignatev Capital CRM.
          </p>
          <span className="text-xs text-[hsl(var(--nb-gold))] flex items-center gap-1 group-hover:gap-2 transition-all">
            Подать сделку <ArrowRight className="w-3 h-3" />
          </span>
        </Link>
        <Link
          to="/invest/submit?intent=find_buyer&category=residential_development"
          className="nb-glass p-5 hover:border-[hsl(var(--nb-gold)/0.4)] transition-colors group"
        >
          <div className="flex items-center gap-2 mb-2">
            <Tag className="w-4 h-4 text-[hsl(var(--nb-gold))]" />
            <h3 className="font-semibold text-[hsl(var(--nb-text))]">Продать остатки / inventory</h3>
          </div>
          <p className="text-xs text-[hsl(var(--nb-text-secondary))] mb-3">
            Распродайте непроданные юниты через сеть инвесторов myUNO. Анонимизация по умолчанию.
          </p>
          <span className="text-xs text-[hsl(var(--nb-gold))] flex items-center gap-1 group-hover:gap-2 transition-all">
            Подать листинг <ArrowRight className="w-3 h-3" />
          </span>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link to={APP_ROUTES.DEVELOPER_PORTAL_PROJECT_NEW}>
          <Button variant="outline" className="border-[hsl(var(--nb-gold)/0.3)] text-[hsl(var(--nb-gold))] hover:bg-[hsl(var(--nb-gold)/0.1)]">
            <Plus className="w-4 h-4 mr-2" /> Новый проект
          </Button>
        </Link>
        <Link to={APP_ROUTES.DEVELOPER_PORTAL_LEADS}>
          <Button variant="outline" className="border-[hsl(var(--nb-glass-border))] text-[hsl(var(--nb-text-secondary))] hover:text-[hsl(var(--nb-text))]">
            <Users className="w-4 h-4 mr-2" /> Просмотреть лиды
          </Button>
        </Link>
        <Link to={APP_ROUTES.DEVELOPER_PORTAL_COMPANY}>
          <Button variant="outline" className="border-[hsl(var(--nb-glass-border))] text-[hsl(var(--nb-text-secondary))] hover:text-[hsl(var(--nb-text))]">
            <PenLine className="w-4 h-4 mr-2" /> Профиль компании
          </Button>
        </Link>
      </div>

      {/* Recent Leads */}
      {leads.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[hsl(var(--nb-text))]">Последние лиды</h2>
            <Link to={APP_ROUTES.DEVELOPER_PORTAL_LEADS} className="text-sm text-[hsl(var(--nb-gold))] flex items-center gap-1 hover:underline">
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
                  <tr
                    key={lead.id}
                    onClick={() => navigate(APP_ROUTES.DEVELOPER_PORTAL_LEAD_DETAIL(lead.id))}
                    className="border-b border-[hsl(var(--nb-glass-border))] last:border-0 hover:bg-[hsl(var(--nb-gold)/0.05)] cursor-pointer"
                  >
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
