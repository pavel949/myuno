/**
 * ThaiLeadsPanel — admin inbox for B2B partner leads from the /thai-business
 * landing. Read + status-triage only (RLS scopes this to admin/uno_team).
 */
import { useState } from 'react';
import { Mail, Phone, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { thaiCategoryMeta, THAI_CATEGORIES, type ThaiCategory } from '@/types/thaiBusiness';
import {
  useThaiPartnerLeads,
  useUpdateThaiLeadStatus,
  type ThaiLeadStatus,
} from '@/hooks/thaiServices/useThaiPartnerLeads';

const STATUSES: ThaiLeadStatus[] = ['new', 'contacted', 'qualified', 'converted', 'rejected'];

const STATUS_RU: Record<ThaiLeadStatus, string> = {
  new: 'Новая',
  contacted: 'Связались',
  qualified: 'Квалифицирован',
  converted: 'Конвертирован',
  rejected: 'Отклонён',
};

const INTEREST_RU: Record<string, string> = {
  menu: 'Меню/каталог',
  website: 'Сайт',
  promotion: 'Продвижение',
  automation: 'Бронирования',
  payments: 'Платежи',
  translation: 'Перевод/чат',
};

const VALID_CATEGORY_IDS = new Set<string>(THAI_CATEGORIES.map((c) => c.id));

function isThaiCategory(value: string): value is ThaiCategory {
  return VALID_CATEGORY_IDS.has(value);
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('ru-RU', {
      timeZone: 'Asia/Bangkok',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function ThaiLeadsPanel() {
  const { data: leads = [], isLoading } = useThaiPartnerLeads();
  const updateStatus = useUpdateThaiLeadStatus();
  const [filter, setFilter] = useState<'all' | ThaiLeadStatus>('all');

  const filtered = leads.filter((l) => (filter === 'all' ? true : l.status === filter));

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {(['all', ...STATUSES] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-sm rounded-full border px-3 py-1.5 ${
              filter === f ? 'border-primary bg-primary/10 text-primary' : 'border-border text-foreground'
            }`}
          >
            {f === 'all' ? 'Все' : STATUS_RU[f]}
            {f !== 'all' && (
              <span className="ml-1 text-muted-foreground">
                {leads.filter((l) => l.status === f).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">Заявок нет</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((lead) => {
            const cat = lead.category && isThaiCategory(lead.category) ? thaiCategoryMeta(lead.category) : null;
            return (
              <div key={lead.id} className="border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground">{lead.contact_name}</span>
                      {lead.business_name && (
                        <span className="text-muted-foreground truncate">· {lead.business_name}</span>
                      )}
                      <Badge variant="outline">{STATUS_RU[lead.status]}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {cat ? cat.ru : '—'}
                      {lead.preferred_lang ? ` · ${lead.preferred_lang.toUpperCase()}` : ''} ·{' '}
                      {formatDate(lead.created_at)}
                    </p>
                  </div>
                  <select
                    value={lead.status}
                    onChange={(e) =>
                      updateStatus.mutate({ id: lead.id, status: e.target.value as ThaiLeadStatus })
                    }
                    disabled={updateStatus.isPending}
                    className="h-9 px-2 bg-background text-foreground border border-input text-sm shrink-0"
                    aria-label="Статус заявки"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_RU[s]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm">
                  <a href={`tel:${lead.phone}`} className="inline-flex items-center gap-1.5 text-primary">
                    <Phone className="w-4 h-4" />
                    {lead.phone}
                  </a>
                  {lead.email && (
                    <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-1.5 text-primary">
                      <Mail className="w-4 h-4" />
                      {lead.email}
                    </a>
                  )}
                </div>

                {lead.interests.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {lead.interests.map((key) => (
                      <span key={key} className="text-xs rounded-sm bg-muted px-2 py-0.5 text-foreground">
                        {INTEREST_RU[key] ?? key}
                      </span>
                    ))}
                  </div>
                )}

                {lead.message && (
                  <p className="mt-3 text-sm text-foreground/90 flex gap-2">
                    <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    {lead.message}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
