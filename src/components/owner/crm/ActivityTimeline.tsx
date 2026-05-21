/**
 * ActivityTimeline — unified call/meeting/email/note/sms/whatsapp/site-visit
 * log for a contact OR a deal. Reads from `crm_activities` via
 * `useActivityLogForContact` / `useActivityLogForDeal`. Inline composer with
 * a type tab strip; duration field auto-shows for calls + meetings.
 *
 * Trigger `trg_crm_activities_set_last_activity_at` on insert advances
 * `crm_contacts.last_activity_at`, which warms the contact in the cold list.
 */
import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  CRM_ACTIVITY_TYPES,
  type CrmActivityType,
  useActivityLogForContact,
  useActivityLogForDeal,
  useCreateActivity,
  useDeleteActivity,
} from '@/hooks/useCrmActivityLog';
import {
  Phone,
  CalendarDays,
  Mail,
  StickyNote,
  MessageSquare,
  Building2,
  Send,
  Trash2,
} from 'lucide-react';

const TYPE_ICONS: Record<CrmActivityType, typeof Phone> = {
  call: Phone,
  meeting: CalendarDays,
  email: Mail,
  note: StickyNote,
  sms: MessageSquare,
  whatsapp: MessageSquare,
  site_visit: Building2,
};

const DURATION_TYPES = new Set<CrmActivityType>(['call', 'meeting', 'site_visit']);

interface ActivityTimelineProps {
  companyId: string;
  /** Provide exactly one of contactId or dealId. */
  contactId?: string;
  dealId?: string;
  className?: string;
}

export function ActivityTimeline({
  companyId,
  contactId,
  dealId,
  className,
}: ActivityTimelineProps) {
  const { t, language } = useLanguage();
  const isRu = language === 'ru';

  const contactQuery = useActivityLogForContact(contactId);
  const dealQuery = useActivityLogForDeal(dealId);
  const activities = contactId ? contactQuery.data : dealQuery.data;
  const isLoading = contactId ? contactQuery.isLoading : dealQuery.isLoading;

  const createMutation = useCreateActivity();
  const deleteMutation = useDeleteActivity();

  const [activeType, setActiveType] = useState<CrmActivityType>('call');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [duration, setDuration] = useState('');

  const reset = () => {
    setTitle('');
    setBody('');
    setDuration('');
  };

  const handleSave = async () => {
    if (!body.trim() && !title.trim()) return;
    await createMutation.mutateAsync({
      company_id: companyId,
      contact_id: contactId ?? null,
      deal_id: dealId ?? null,
      activity_type: activeType,
      subject: title.trim() || null,
      description: body.trim() || null,
      duration_minutes:
        DURATION_TYPES.has(activeType) && duration ? Math.max(0, Number(duration)) : null,
    });
    reset();
  };

  return (
    <section className={cn('border border-border bg-card', className)}>
      <header className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <h3 className="font-display text-sm font-semibold text-foreground">{t('crm.activity.title')}</h3>
        <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
          {activities?.length ?? 0}
        </span>
      </header>

      {/* Composer */}
      <div className="border-b border-border p-4 space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {CRM_ACTIVITY_TYPES.map((type) => {
            const Icon = TYPE_ICONS[type];
            const isActive = activeType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setActiveType(type)}
                className={cn(
                  'inline-flex items-center gap-1.5 border px-2.5 py-1 text-xs font-medium transition-colors',
                  isActive
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground',
                )}
              >
                <Icon className="h-3 w-3" strokeWidth={2} aria-hidden />
                {t(`crm.activity.${type}` as const)}
              </button>
            );
          })}
        </div>

        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('crm.activity.compose.titlePlaceholder')}
          className="rounded-none text-sm"
        />
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t('crm.activity.compose.placeholder')}
          className="rounded-none text-sm min-h-[72px]"
        />

        <div className="flex items-center justify-between gap-3">
          {DURATION_TYPES.has(activeType) ? (
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">{t('crm.activity.compose.duration')}</label>
              <Input
                type="number"
                min={0}
                step={5}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="rounded-none w-20 text-sm font-mono tabular-nums"
                inputMode="numeric"
              />
            </div>
          ) : (
            <span />
          )}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={createMutation.isPending || (!body.trim() && !title.trim())}
            className="rounded-none"
          >
            <Send className="h-3.5 w-3.5 mr-1.5" />
            {createMutation.isPending
              ? t('crm.activity.compose.saving')
              : t('crm.activity.compose.save')}
          </Button>
        </div>
      </div>

      {/* Timeline */}
      <ol className="divide-y divide-border">
        {isLoading && (
          <li className="px-4 py-6 text-center text-xs text-muted-foreground">
            …
          </li>
        )}
        {!isLoading && (!activities || activities.length === 0) && (
          <li className="px-4 py-8 text-center text-sm text-muted-foreground">
            {t('crm.activity.empty')}
          </li>
        )}
        {(activities || []).map((entry) => {
          const Icon = TYPE_ICONS[entry.activity_type] ?? StickyNote;
          const dt = new Date(entry.activity_date);
          const dateLabel = dt.toLocaleString(isRu ? 'ru-RU' : 'en-GB', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          });
          return (
            <li key={entry.id} className="px-4 py-3 group">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center border border-border bg-background">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} aria-hidden />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-medium text-sm text-foreground truncate">
                      {entry.subject || t(`crm.activity.${entry.activity_type}` as const)}
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground shrink-0 tabular-nums">
                      {dateLabel}
                      {entry.duration_minutes != null && entry.duration_minutes > 0 && (
                        <> · {entry.duration_minutes}m</>
                      )}
                    </span>
                  </div>
                  {entry.description && (
                    <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                      {entry.description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(t('crm.activity.deleteConfirm'))) {
                      deleteMutation.mutate({
                        id: entry.id,
                        contact_id: entry.contact_id,
                        deal_id: entry.deal_id,
                      });
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  aria-label={t('crm.activity.delete')}
                  title={t('crm.activity.delete')}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
