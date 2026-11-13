import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  usePriceListItems,
  usePriceListVersions,
  useProjectFactAssertions,
} from '@/hooks/useDriveImport';
import { comparePriceListItems, type PriceListItem } from '@/lib/offplan/priceListVersions';
import { ExternalLink, GitCompareArrows, History } from 'lucide-react';

function itemSummary(item: PriceListItem | null, isRu: boolean): string {
  if (!item) return '—';
  const price = item.price == null
    ? (isRu ? 'цена не указана' : 'price not recorded')
    : `${Number(item.price).toLocaleString(isRu ? 'ru-RU' : 'en-US')} ${item.currency ?? (isRu ? 'валюта неизвестна' : 'currency unknown')}`;
  return `${price} · ${item.status === 'unknown' ? (isRu ? 'статус неизвестен' : 'status unknown') : item.status}`;
}

export function PriceListArchive({ projectId }: { projectId: string }) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const t = (en: string, ru: string) => isRu ? ru : en;
  const [chosenVersionId, setChosenVersionId] = useState<string | null>(null);
  const [showUnchanged, setShowUnchanged] = useState(false);
  const versionsQuery = usePriceListVersions(projectId);
  const factsQuery = useProjectFactAssertions(projectId);
  const versions = useMemo(() => versionsQuery.data ?? [], [versionsQuery.data]);
  const selectedVersion = versions.find(version => version.id === chosenVersionId) ?? versions[0] ?? null;
  const currentItemsQuery = usePriceListItems(selectedVersion?.id);
  const previousItemsQuery = usePriceListItems(selectedVersion?.previous_version_id);
  const diffs = useMemo(() => comparePriceListItems(
    currentItemsQuery.data ?? [], previousItemsQuery.data ?? [],
  ), [currentItemsQuery.data, previousItemsQuery.data]);
  const visibleDiffs = showUnchanged ? diffs : diffs.filter(diff => diff.changeType !== 'unchanged');

  const changeLabel = (change: string) => ({
    added: t('New in this version', 'Новая строка'),
    changed: t('Changed', 'Изменено'),
    unchanged: t('Unchanged', 'Без изменений'),
    removed_from_source: t('Absent from this version — not marked sold', 'Нет в этой версии — не отмечено как продано'),
    unresolved_identity: t('Identity needs review', 'Код требует проверки'),
  } as Record<string, string>)[change] ?? change;

  return (
    <details className="border border-border" data-testid="price-list-archive">
      <summary className="flex cursor-pointer list-none items-center gap-2 p-4 text-sm font-medium">
        <History className="h-4 w-4 text-primary" />
        {t('Price-list versions and fact sources', 'Версии прайсов и источники фактов')}
        {versions.length > 0 && <Badge variant="outline">{versions.length}</Badge>}
      </summary>
      <div className="space-y-5 border-t border-border p-4">
        <p className="text-xs text-muted-foreground">
          {t('Snapshots are evidence for review. They do not replace project units or publish imported facts automatically.', 'Снимки служат доказательством для проверки. Они не заменяют юниты проекта и не публикуют факты автоматически.')}
        </p>

        {versionsQuery.isLoading ? <Skeleton className="h-24" /> : versionsQuery.isError ? (
          <div role="alert" className="space-y-2 text-sm text-destructive">
            <p>{t('Could not load price-list history.', 'Не удалось загрузить историю прайсов.')}</p>
            <Button variant="outline" size="sm" onClick={() => versionsQuery.refetch()}>{t('Retry', 'Повторить')}</Button>
          </div>
        ) : versions.length === 0 ? (
          <p role="status" className="text-sm text-muted-foreground">
            {t('No imported price-list versions yet.', 'Импортированных версий прайсов пока нет.')}
          </p>
        ) : (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="price-list-version">{t('Version', 'Версия')}</label>
              <Select value={selectedVersion?.id} onValueChange={setChosenVersionId}>
                <SelectTrigger id="price-list-version"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {versions.map(version => (
                    <SelectItem key={version.id} value={version.id}>
                      v{version.version_number} · {new Date(version.captured_at).toLocaleString(isRu ? 'ru-RU' : 'en-US')} · {version.rows_total}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedVersion && (
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">{selectedVersion.status}</Badge>
                  <span>{t('Rows', 'Строк')}: {selectedVersion.rows_total}</span>
                  <span>{t('Need review', 'Требуют проверки')}: {selectedVersion.rows_needing_review}</span>
                  <span className="font-mono">SHA-256: {selectedVersion.content_sha256.slice(0, 12)}…</span>
                </div>
              )}
            </div>

            {selectedVersion?.previous_version_id && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <GitCompareArrows className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-medium">{t('Changes from previous version', 'Изменения относительно предыдущей версии')}</h4>
                  <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setShowUnchanged(value => !value)}>
                    {showUnchanged ? t('Hide unchanged', 'Скрыть без изменений') : t('Show unchanged', 'Показать без изменений')}
                  </Button>
                </div>
                {(currentItemsQuery.isLoading || previousItemsQuery.isLoading) ? <Skeleton className="h-24" /> :
                  (currentItemsQuery.isError || previousItemsQuery.isError) ? (
                    <p role="alert" className="text-sm text-destructive">{t('Could not compare these versions.', 'Не удалось сравнить эти версии.')}</p>
                  ) : visibleDiffs.length === 0 ? (
                    <p role="status" className="text-sm text-muted-foreground">{t('No changed rows.', 'Изменённых строк нет.')}</p>
                  ) : (
                    <div className="overflow-x-auto border border-border">
                      <table className="w-full min-w-[680px] text-sm">
                        <thead className="bg-muted/50"><tr>
                          <th className="p-2 text-left font-medium">{t('Unit', 'Юнит')}</th>
                          <th className="p-2 text-left font-medium">{t('Change', 'Изменение')}</th>
                          <th className="p-2 text-left font-medium">{t('Previous', 'Было')}</th>
                          <th className="p-2 text-left font-medium">{t('This version', 'Стало')}</th>
                        </tr></thead>
                        <tbody>{visibleDiffs.map(diff => (
                          <tr key={diff.itemKey} className="border-t border-border align-top">
                            <td className="whitespace-nowrap p-2 font-mono text-xs">{diff.unitCode ?? diff.itemKey}</td>
                            <td className="p-2"><Badge variant={diff.changeType === 'removed_from_source' || diff.changeType === 'unresolved_identity' ? 'secondary' : 'outline'}>{changeLabel(diff.changeType)}</Badge></td>
                            <td className="p-2 text-xs text-muted-foreground">{itemSummary(diff.before, isRu)}</td>
                            <td className="p-2 text-xs">{itemSummary(diff.after, isRu)}</td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  )}
              </div>
            )}

            {selectedVersion && !selectedVersion.previous_version_id && (
              <p className="text-xs text-muted-foreground">{t('This is the first archived version; there is no previous snapshot to compare.', 'Это первая сохранённая версия, предыдущего снимка для сравнения нет.')}</p>
            )}
          </>
        )}

        <div className="space-y-2 border-t border-border pt-4">
          <h4 className="text-sm font-medium">{t('Recent fact sources', 'Последние источники фактов')}</h4>
          {factsQuery.isLoading ? <Skeleton className="h-16" /> : factsQuery.isError ? (
            <p role="alert" className="text-sm text-destructive">{t('Could not load fact sources.', 'Не удалось загрузить источники фактов.')}</p>
          ) : (factsQuery.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('No imported fact assertions yet.', 'Импортированных фактов пока нет.')}</p>
          ) : (
            <div className="space-y-2">
              {(factsQuery.data ?? []).slice(0, 12).map(fact => (
                <div key={fact.id} className="grid gap-1 bg-muted/30 p-2 text-xs sm:grid-cols-[minmax(0,1fr)_auto]">
                  <div className="min-w-0">
                    <span className="font-medium">{fact.entity_type === 'unit' ? fact.source_unit_key ?? t('Unit', 'Юнит') : t('Project', 'Проект')} · {fact.field_key}</span>
                    <p className="break-words text-muted-foreground">
                      {fact.source_file_name ?? t('Source file not recorded', 'Файл источника не записан')}
                      {fact.source_file_url && (
                        <a href={fact.source_file_url} target="_blank" rel="noreferrer" className="ml-1 inline-flex items-center gap-0.5 underline">
                          {t('Open', 'Открыть')}<ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </p>
                  </div>
                  <Badge variant={fact.review_status === 'pending' ? 'secondary' : 'outline'} className="w-fit">
                    {fact.review_status === 'pending' ? t('Needs review', 'Ожидает проверки') : fact.review_status === 'approved' ? t('Approved', 'Подтверждено') : t('Rejected', 'Отклонено')}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </details>
  );
}
