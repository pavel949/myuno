/**
 * Developer Portal — Lead Detail
 */
import { useParams, Link } from 'react-router-dom';
import { useNewbuildLead, useUpdateLeadStatus } from '@/hooks/useNewbuildLeads';
import { APP_ROUTES } from '@/lib/config/routes';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Phone, MessageSquare, Mail } from 'lucide-react';

const STATUS_OPTIONS = ['new', 'contacted', 'qualified', 'deal', 'lost'];
const STATUS_LABELS: Record<string, string> = {
  new: 'Новый', contacted: 'Связались', qualified: 'Квалифицирован', deal: 'Сделка', lost: 'Потерян',
};

function ScoreBadge({ score }: { score: number }) {
  const cls = score >= 71 ? 'nb-badge-completed' : score >= 41 ? 'nb-badge-construction' : 'bg-red-500/15 text-red-400 border-red-500/30';
  return <span className={`nb-badge ${cls}`}>{score} pts</span>;
}

export default function DeveloperLeadDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: lead, isLoading } = useNewbuildLead(id);
  const updateStatus = useUpdateLeadStatus();

  if (isLoading) return null;

  if (!lead) {
    return (
      <div className="p-6 lg:p-10">
        <Link to={APP_ROUTES.DEVELOPER_PORTAL_LEADS} className="flex items-center gap-2 text-sm text-[hsl(var(--nb-muted))] hover:text-[hsl(var(--nb-gold))] mb-6">
          <ArrowLeft className="w-4 h-4" /> Все лиды
        </Link>
        <p className="text-[hsl(var(--nb-muted))]">Лид не найден</p>
      </div>
    );
  }

  const wa = lead.whatsapp || lead.phone;

  return (
    <div className="p-6 lg:p-10 max-w-2xl space-y-6">
      {/* Back */}
      <Link
        to={APP_ROUTES.DEVELOPER_PORTAL_LEADS}
        className="flex items-center gap-2 text-sm text-[hsl(var(--nb-muted))] hover:text-[hsl(var(--nb-gold))] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Все лиды
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="nb-display text-2xl text-[hsl(var(--nb-text))]">
            {lead.full_name || 'Без имени'}
          </h1>
          <p className="text-sm text-[hsl(var(--nb-muted))] nb-mono mt-1">
            {new Date(lead.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <ScoreBadge score={lead.score} />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {wa && (
          <a href={`https://wa.me/${wa.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="nb-btn-gold gap-2">
              <MessageSquare className="w-4 h-4" /> WhatsApp
            </Button>
          </a>
        )}
        {lead.phone && (
          <a href={`tel:${lead.phone}`}>
            <Button size="sm" variant="outline" className="border-[hsl(var(--nb-glass-border))] gap-2 text-[hsl(var(--nb-text-secondary))]">
              <Phone className="w-4 h-4" /> Звонок
            </Button>
          </a>
        )}
        {lead.email && (
          <a href={`mailto:${lead.email}`}>
            <Button size="sm" variant="outline" className="border-[hsl(var(--nb-glass-border))] gap-2 text-[hsl(var(--nb-text-secondary))]">
              <Mail className="w-4 h-4" /> Email
            </Button>
          </a>
        )}
      </div>

      {/* Details */}
      <div className="nb-glass p-6 grid sm:grid-cols-2 gap-4 text-sm">
        <div>
          <p className="nb-label mb-1">Источник</p>
          <p className="text-[hsl(var(--nb-text))]">{lead.source || '—'}</p>
        </div>
        <div>
          <p className="nb-label mb-1">Бюджет</p>
          <p className="nb-mono text-[hsl(var(--nb-gold))]">
            {lead.budget_min || lead.budget_max
              ? `฿${((lead.budget_min || 0) / 1e6).toFixed(1)}M – ฿${((lead.budget_max || 0) / 1e6).toFixed(1)}M`
              : '—'}
          </p>
        </div>
        {lead.unit_preference && (
          <div>
            <p className="nb-label mb-1">Предпочтения</p>
            <p className="text-[hsl(var(--nb-text))]">{lead.unit_preference}</p>
          </div>
        )}
        {lead.phone && (
          <div>
            <p className="nb-label mb-1">Телефон</p>
            <p className="text-[hsl(var(--nb-text))]">{lead.phone}</p>
          </div>
        )}
        {lead.email && (
          <div>
            <p className="nb-label mb-1">Email</p>
            <p className="text-[hsl(var(--nb-text))]">{lead.email}</p>
          </div>
        )}
        {lead.message && (
          <div className="sm:col-span-2">
            <p className="nb-label mb-1">Сообщение</p>
            <p className="text-[hsl(var(--nb-text-secondary))] leading-relaxed">{lead.message}</p>
          </div>
        )}
      </div>

      {/* Status */}
      <div className="nb-glass p-6">
        <p className="nb-label mb-3">Статус лида</p>
        <select
          value={lead.status}
          onChange={e => updateStatus.mutate({ id: lead.id, status: e.target.value })}
          className="w-full rounded-md bg-[hsl(var(--nb-bg))] border border-[hsl(var(--nb-glass-border))] px-3 py-2 text-sm text-[hsl(var(--nb-text))]"
        >
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
      </div>
    </div>
  );
}
