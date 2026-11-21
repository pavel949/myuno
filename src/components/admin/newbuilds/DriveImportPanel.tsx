import { Card } from '@/components/ui/card';
import { AlertCircle, History } from 'lucide-react';
import { QueryRecovery } from '@/components/shared/QueryRecovery';
import { useConfiguredDriveWatch, useDriveReceipts } from '@/hooks/useDriveImport';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

const jobLabels: ReadonlyMap<string, string> = new Map([
  ['queued', 'В очереди'], ['running', 'Обработка идёт'],
  ['completed', 'Обработка завершена'], ['failed', 'Ошибка обработки'], ['partial', 'Частичная обработка'],
]);

const reviewLabels: ReadonlyMap<string, string> = new Map([
  ['pending', 'Ожидало проверки'], ['approved', 'Ранее отмечено как согласованное'],
  ['partially_applied', 'Ранее отмечено как частично применённое'], ['discarded', 'Отклонено'],
]);

function formatAge(timestamp: string) {
  const date = new Date(timestamp);
  return Number.isFinite(date.getTime())
    ? formatDistanceToNow(date, { addSuffix: true, locale: ru })
    : 'Время не указано';
}

/** Project-scoped read-only inspection; not a scheduler control or a publication workflow. */
export function DriveImportPanel({ projectId }: { projectId: string }) {
  const receipts = useDriveReceipts(projectId);
  const watch = useConfiguredDriveWatch(projectId);

  return (
    <Card className="p-5 space-y-4">
      <div>
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <History className="h-5 w-5 text-primary" aria-hidden="true" />
          История импорта из Google Drive
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Здесь можно посмотреть историю. Новый импорт и применение результатов в этом разделе недоступны.
          История не подтверждает актуальность цен, наличие объектов или публикацию.
        </p>
      </div>

      {watch.isLoading ? (
        <p className="text-sm text-muted-foreground" role="status">Проверяем настройки автоимпорта…</p>
      ) : watch.isError ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Не удалось проверить настройки автоимпорта.</p>
          <QueryRecovery onRetry={watch.refetch} />
        </div>
      ) : watch.data ? (
        <p className="flex items-start gap-2 text-sm text-warning" role="status">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          У проекта есть источник с настройкой автоимпорта. Работу расписания этот экран не проверяет и не меняет.
        </p>
      ) : null}

      {receipts.isLoading ? (
        <p className="text-sm text-muted-foreground" role="status">Загружаем историю…</p>
      ) : receipts.isError ? (
        <QueryRecovery onRetry={receipts.refetch} />
      ) : receipts.data && receipts.data.length > 0 ? (
        <ul className="space-y-2" aria-label="Последние записи импорта">
          {receipts.data.map(job => (
            <li key={job.id} className="space-y-1 border border-border p-3 text-sm">
              <p className="font-medium">{jobLabels.get(job.status) ?? 'Статус обработки неизвестен'}</p>
              <p className="text-muted-foreground">
                {formatAge(job.created_at)} · {job.files_processed}/{job.files_total} обработано
                {job.files_failed > 0 && ` · ошибок: ${job.files_failed}`}
                {job.files_skipped > 0 && ` · пропущено: ${job.files_skipped}`}
              </p>
              {job.review_status && reviewLabels.has(job.review_status) && (
                <p className="text-muted-foreground">{reviewLabels.get(job.review_status)}</p>
              )}
              <p className="break-all text-muted-foreground">Номер записи: <code>{job.id}</code></p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Нет доступных записей импорта.</p>
      )}
    </Card>
  );
}
