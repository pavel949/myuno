import { useLanguage } from '@/contexts/LanguageContext';
import { useTermsActivity, type TermsActivity } from '@/hooks/useManagementTermsActivity';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  History,
  FileEdit,
  CheckCircle2,
  ShieldCheck,
  Archive,
  Plus,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

const ACTION_ICONS: Record<string, React.ElementType> = {
  created: Plus,
  updated: FileEdit,
  status_changed: ShieldCheck,
  activated: CheckCircle2,
  archived: Archive,
};

const ACTION_LABELS: Record<string, { en: string; ru: string }> = {
  created: { en: 'Created', ru: 'Создано' },
  updated: { en: 'Updated', ru: 'Обновлено' },
  status_changed: { en: 'Status changed', ru: 'Статус изменён' },
  activated: { en: 'Activated', ru: 'Активировано' },
  archived: { en: 'Archived', ru: 'Архивировано' },
};

const FIELD_LABELS: Record<string, { en: string; ru: string }> = {
  commission_rate: { en: 'Commission', ru: 'Комиссия' },
  commission_type: { en: 'Commission type', ru: 'Тип комиссии' },
  commission_base: { en: 'Commission base', ru: 'База расчёта' },
  status: { en: 'Status', ru: 'Статус' },
  payment_day: { en: 'Payout day', ru: 'День выплаты' },
  payment_currency: { en: 'Currency', ru: 'Валюта' },
  expense_responsibility: { en: 'Expenses', ru: 'Расходы' },
};

function ActivityItem({ item, isRu }: { item: TermsActivity; isRu: boolean }) {
  const Icon = ACTION_ICONS[item.action] || FileEdit;
  const label = ACTION_LABELS[item.action] || { en: item.action, ru: item.action };
  const fieldLabel = item.field_name
    ? (FIELD_LABELS[item.field_name] || { en: item.field_name, ru: item.field_name })
    : null;

  const timeAgo = formatDistanceToNow(new Date(item.created_at), {
    addSuffix: true,
    locale: isRu ? ru : undefined,
  });

  return (
    <div className="flex gap-3 py-2.5">
      <div className="mt-0.5 p-1.5 rounded-lg bg-muted/60 shrink-0">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">
          {isRu ? label.ru : label.en}
          {fieldLabel && (
            <span className="text-muted-foreground font-normal">
              {' — '}{isRu ? fieldLabel.ru : fieldLabel.en}
            </span>
          )}
        </p>
        {(item.old_value || item.new_value) && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {item.old_value && (
              <span className="line-through mr-1">{item.old_value}</span>
            )}
            {item.old_value && item.new_value && <span>→ </span>}
            {item.new_value && (
              <span className="text-foreground font-medium">{item.new_value}</span>
            )}
          </p>
        )}
        {item.note && (
          <p className="text-xs text-muted-foreground mt-0.5 italic">"{item.note}"</p>
        )}
        <p className="text-[10px] text-muted-foreground mt-1">{timeAgo}</p>
      </div>
    </div>
  );
}

interface TermsActivityLogProps {
  termsId?: string;
}

export function TermsActivityLog({ termsId }: TermsActivityLogProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: activities, isLoading } = useTermsActivity(termsId);

  if (!termsId) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <History className="h-4 w-4 text-muted-foreground" />
        <h4 className="text-sm font-semibold">
          {isRu ? 'История изменений' : 'Activity Log'}
        </h4>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : !activities?.length ? (
        <p className="text-xs text-muted-foreground py-4 text-center">
          {isRu ? 'История пока пуста' : 'No activity yet'}
        </p>
      ) : (
        <ScrollArea className="max-h-64">
          <div className="divide-y">
            {activities.map(item => (
              <ActivityItem key={item.id} item={item} isRu={isRu} />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
