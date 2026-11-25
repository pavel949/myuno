/**
 * /admin/content — Content manager (Design Bible Round 4A · H3).
 * One table for guides, articles, legal documents and official news with
 * type, languages, owner, status; the side panel shows language
 * completeness, SEO basics and an automatic copy check before publishing.
 */
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { PageShell, PageHeader } from '@/components/page';
import { SystemState } from '@/components/page/SystemState';
import { Button } from '@/components/ui/button';
import { WorkflowStatus, type WorkflowTone } from '@/components/admin/hq/WorkflowStatus';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { useContentInventory } from '@/hooks/useContentInventory';
import { contentChecks, type ContentCheck, type ContentItem, type ContentKind, type ContentStatus } from '@/lib/content/contentInventory';
import { cn } from '@/lib/utils';

type Filter = 'all' | ContentKind;

const KIND_LABEL: Record<ContentKind, { en: string; ru: string }> = {
  guide: { en: 'Guide', ru: 'Гайд' },
  article: { en: 'Article', ru: 'Статья' },
  legal: { en: 'Legal', ru: 'Юридический' },
  news: { en: 'News', ru: 'Новость' },
};

const STATUS: Record<ContentStatus, { tone: WorkflowTone; en: string; ru: string }> = {
  published: { tone: 'done', en: 'Published', ru: 'Опубликовано' },
  partial: { tone: 'waiting', en: 'Translation missing', ru: 'Нет перевода' },
  draft: { tone: 'neutral', en: 'Draft', ru: 'Черновик' },
  archived: { tone: 'neutral', en: 'Archived', ru: 'В архиве' },
};

const CHECK_LABEL: Record<ContentCheck['id'], { en: string; ru: string }> = {
  languages: { en: 'Languages', ru: 'Языки' },
  title_length: { en: 'Title ≤ 70 characters', ru: 'Заголовок ≤ 70 символов' },
  summary_length: { en: 'Description 50–170 characters', ru: 'Описание 50–170 символов' },
  slug: { en: 'URL slug', ru: 'Адрес (slug)' },
  internal_links: { en: 'Links to marketplaces', ru: 'Ссылки на разделы' },
  copy: { en: 'Copy check issues', ru: 'Проблемы текста' },
};

export default function AdminContent() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const tr = (en: string, ru: string) => (isRu ? ru : en);
  const enabled = useFeatureFlag('hq_round4a', true);
  const { data, isLoading, isError, refetch } = useContentInventory();
  const [params, setParams] = useSearchParams();
  const filter = (params.get('type') as Filter) || 'all';
  const selectedId = params.get('item');

  const items = useMemo(() => (data?.items ?? []).filter((i) => filter === 'all' || i.kind === filter), [data, filter]);
  const selected: ContentItem | undefined = items.find((i) => i.id === selectedId) ?? items[0];
  const date = (d: string | null) => (d ? new Date(d).toLocaleDateString(isRu ? 'ru-RU' : 'en-GB', { day: 'numeric', month: 'short' }) : '—');
  const setParam = (k: string, v: string | null) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    setParams(next, { replace: true });
  };

  if (!enabled) return <PageShell width="wide"><SystemState variant="not_found" /></PageShell>;

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: tr('All', 'Все') },
    ...(Object.keys(KIND_LABEL) as ContentKind[]).map((k) => ({ id: k, label: isRu ? KIND_LABEL[k].ru : KIND_LABEL[k].en })),
  ];
  const review = selected ? contentChecks(selected) : null;

  return (
    <PageShell width="wide">
      <PageHeader
        title={tr('Content', 'Контент')}
        subtitle={tr('Guides, articles, legal documents and news · EN / RU', 'Гайды, статьи, юридические документы и новости · EN / RU')}
        actions={<Button asChild variant="outline"><Link to="/admin/relocation-articles">{tr('+ New guide', '+ Новый гайд')}</Link></Button>}
      />
      {isLoading ? <SystemState variant="loading" rows={8} /> : isError || !data ? <SystemState variant="error" onAction={() => void refetch()} /> : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section className="min-w-0 border border-border bg-card">
            <div role="tablist" className="flex flex-wrap gap-1.5 border-b border-border px-4 py-3">
              {filters.map((f) => (
                <button
                  key={f.id} type="button" role="tab" aria-selected={filter === f.id}
                  onClick={() => setParam('type', f.id === 'all' ? null : f.id)}
                  className={cn('min-h-11 px-3 text-sm font-semibold sm:min-h-9', filter === f.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground')}
                >
                  {f.label}
                </button>
              ))}
            </div>
            {data.failedSources.length > 0 && (
              <p role="status" className="border-b border-border bg-warning/10 px-4 py-2 text-sm text-warning">
                {tr('Some sources did not load:', 'Не загрузились источники:')} {data.failedSources.join(', ')}
              </p>
            )}
            {items.length === 0 ? (
              <SystemState variant="no_results" compact title={tr('No content of this type', 'Нет контента этого типа')} actionLabel={tr('Show all', 'Показать всё')} onAction={() => setParam('type', null)} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="bg-muted text-left text-caption uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2">{tr('Item', 'Материал')}</th>
                      <th className="px-4 py-2">{tr('Type', 'Тип')}</th>
                      <th className="px-4 py-2">{tr('Languages', 'Языки')}</th>
                      <th className="px-4 py-2">{tr('Owner', 'Ответственный')}</th>
                      <th className="px-4 py-2">{tr('Updated', 'Обновлено')}</th>
                      <th className="px-4 py-2">{tr('Status', 'Статус')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((i) => (
                      <tr key={i.id} className={cn('border-t border-border', selected?.id === i.id && 'bg-muted/60')}>
                        <td className="px-4 py-2.5">
                          <button type="button" className="text-left font-semibold text-foreground underline-offset-4 hover:underline" onClick={() => setParam('item', i.id)}>
                            {i.title}
                          </button>
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">{isRu ? KIND_LABEL[i.kind].ru : KIND_LABEL[i.kind].en}</td>
                        <td className="px-4 py-2.5 font-mono text-muted-foreground">{(['en', 'ru'] as const).filter((l) => i.languages[l]).map((l) => l.toUpperCase()).join(' ') || '—'}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{i.owner ?? '—'}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{date(i.updatedAt)}</td>
                        <td className="px-4 py-2.5"><WorkflowStatus tone={STATUS[i.status].tone}>{isRu ? STATUS[i.status].ru : STATUS[i.status].en}</WorkflowStatus></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {selected && review ? (
            <aside className="flex flex-col gap-3 border border-border bg-card p-4" aria-label={tr('Pre-publish checks', 'Проверки перед публикацией')}>
              <span className="text-caption font-semibold uppercase tracking-wide text-accent">
                {tr('Checking', 'Проверка')} · {isRu ? KIND_LABEL[selected.kind].ru : KIND_LABEL[selected.kind].en}
              </span>
              <h2 className="font-display text-xl text-foreground">{selected.title}</h2>
              <div className="flex gap-1.5">
                {(['en', 'ru'] as const).map((l) => (
                  <span key={l} className={cn('rounded-full border px-3 py-1 text-xs font-semibold', selected.languages[l] ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground')}>
                    {l.toUpperCase()} {selected.languages[l] ? '✓' : tr('· missing', '· нет')}
                  </span>
                ))}
              </div>
              <ul className="flex flex-col gap-1.5 text-sm">
                {review.checks.map((c) => (
                  <li key={c.id} className="flex justify-between gap-2">
                    <span className="text-muted-foreground">{isRu ? CHECK_LABEL[c.id].ru : CHECK_LABEL[c.id].en}</span>
                    <span className={cn('font-semibold', c.ok ? 'text-success' : 'text-warning')}>{c.ok && c.id !== 'internal_links' ? '✓' : c.value}</span>
                  </li>
                ))}
              </ul>
              {review.copyIssues.length > 0 && (
                <div className="bg-warning/10 p-3 text-sm text-warning" role="status">
                  {tr('Copy check:', 'Проверка текста:')}{' '}
                  {review.copyIssues.map((c) => (c.kind === 'unsourced_number' ? tr(`unsourced number “${c.term}”`, `число без источника «${c.term}»`) : `«${c.term}»${c.suggestion ? ` → ${c.suggestion}` : ''}`)).join(' · ')}
                </div>
              )}
              <div className="mt-auto flex gap-2">
                {selected.editHref ? (
                  <Button asChild className="min-h-11 flex-1"><Link to={selected.editHref}>{tr('Open editor', 'Открыть редактор')}</Link></Button>
                ) : (
                  <p className="text-caption text-muted-foreground">{tr('No editor yet for this type; edit in the database console.', 'Редактора для этого типа пока нет.')}</p>
                )}
              </div>
            </aside>
          ) : (
            <SystemState variant="empty" icon={FileText} compact title={tr('Select an item', 'Выберите материал')} description={tr('Checks for language, SEO and copy appear here.', 'Здесь появятся проверки языков, SEO и текста.')} />
          )}
        </div>
      )}
    </PageShell>
  );
}
