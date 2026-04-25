import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { IntakeItem } from '@/hooks/useIntakeAgent';
import { AlertTriangle, RefreshCw, Pencil, Trash2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IntakeFailedListProps {
  items: IntakeItem[];
  onRetry: (id: string) => Promise<boolean> | void;
  onEdit: (item: IntakeItem) => void;
  onDiscard: (id: string) => void;
  retryingId?: string | null;
}

const ERROR_LABEL: Record<string, { en: string; ru: string; tone: 'destructive' | 'warning' | 'muted' }> = {
  validation: { en: 'Missing fields', ru: 'Не хватает полей', tone: 'warning' },
  unknown_table: { en: 'Unknown table', ru: 'Неизвестная таблица', tone: 'destructive' },
  schema: { en: 'Schema error', ru: 'Ошибка схемы', tone: 'destructive' },
  status: { en: 'Status / approval', ru: 'Статус / модерация', tone: 'warning' },
  network: { en: 'Network', ru: 'Сеть', tone: 'muted' },
  unknown: { en: 'Unknown error', ru: 'Неизвестная ошибка', tone: 'destructive' },
};

function formatTime(iso: string, isRu: boolean): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString(isRu ? 'ru-RU' : 'en-GB', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

/**
 * Visible queue of intake items that failed approval.
 * Rendered inside the IntakeQueue "Failed" tab.
 */
export function IntakeFailedList({
  items,
  onRetry,
  onEdit,
  onDiscard,
  retryingId,
}: IntakeFailedListProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-30" />
        <p>{isRu ? 'Нет ошибок — очередь пуста' : 'No errors — queue is clean'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm text-muted-foreground border-l-4 border-destructive bg-destructive/5 px-3 py-2">
        <span className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          {isRu
            ? `${items.length} объект${items.length === 1 ? '' : items.length < 5 ? 'а' : 'ов'} с ошибками — исправьте и повторите`
            : `${items.length} item${items.length === 1 ? '' : 's'} failed — fix and retry`}
        </span>
      </div>

      {items.map((item) => {
        const err = item.lastError;
        const meta = err ? ERROR_LABEL[err.code] ?? ERROR_LABEL.unknown : ERROR_LABEL.unknown;
        const title = (isRu ? item.suggestedTitle?.ru : item.suggestedTitle?.en)
          || item.suggestedTitle?.en
          || item.suggestedTitle?.ru
          || (isRu ? 'Без названия' : 'Untitled');
        const isRetrying = retryingId === item.id;

        return (
          <Card key={item.id} data-intake-failed-id={item.id} className="border-destructive/30">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Badge
                      variant={meta.tone === 'destructive' ? 'destructive' : 'secondary'}
                      className={cn(
                        'text-[10px] uppercase tracking-wide',
                        meta.tone === 'warning' && 'bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20',
                      )}
                    >
                      {isRu ? meta.ru : meta.en}
                    </Badge>
                    {err?.table && (
                      <code className="text-[10px] px-1.5 py-0.5 bg-muted rounded">
                        {err.table}
                      </code>
                    )}
                    {err?.occurredAt && (
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatTime(err.occurredAt, isRu)}
                      </span>
                    )}
                  </div>
                  <h4 className="font-medium text-sm truncate" title={title}>
                    {title}
                  </h4>
                  {err?.message && (
                    <p className="text-xs text-destructive mt-1 break-words">
                      {err.message}
                    </p>
                  )}
                  {err?.missing && err.missing.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {err.missing.map((f) => (
                        <Badge key={f} variant="outline" className="text-[10px] font-mono">
                          {f}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => onRetry(item.id)}
                  disabled={isRetrying}
                  className="gap-1.5"
                >
                  <RefreshCw className={cn('h-3.5 w-3.5', isRetrying && 'animate-spin')} />
                  {isRu ? 'Повторить' : 'Retry'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(item)}
                  className="gap-1.5"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  {isRu ? 'Исправить' : 'Edit'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDiscard(item.id)}
                  className="gap-1.5 text-muted-foreground hover:text-destructive ml-auto"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {isRu ? 'Отклонить' : 'Discard'}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
