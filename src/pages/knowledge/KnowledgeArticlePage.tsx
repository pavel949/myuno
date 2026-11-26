import { Link, useParams } from 'react-router-dom';
import { PageContainer } from '@/components/uno/PageContainer';
import { SEOHead } from '@/components/seo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BackButton } from '@/components/uno/BackButton';
import { APP_ROUTES } from '@/lib/config/routes';
import { useLocation } from '@/contexts/LocationContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useKnowledgeArticle, getSectionMeta } from '@/hooks/useLocationKnowledge';
import { RelatedServicesLinks } from '@/components/knowledge';
import { pickLang, type LangValues } from '@/lib/i18n/pickLang';

type ArticleBlock =
  | { type: 'heading'; level: 2 | 3; id: string; text: string }
  | { type: 'paragraph' | 'list'; lines: string[] };

function articleBlocks(content: string) {
  const blocks: ArticleBlock[] = [];
  let sectionNumber = 0;
  let startBlock = true;

  for (const line of content.split(/\r?\n/)) {
    if (!line.trim()) {
      startBlock = true;
      continue;
    }

    const heading = /^(#{2,3})[ \t]+(.+)$/.exec(line);
    if (heading) {
      sectionNumber += 1;
      blocks.push({ type: 'heading', level: heading[1].length === 2 ? 2 : 3, id: 'section-' + sectionNumber, text: heading[2] });
      startBlock = true;
      continue;
    }

    const bullet = /^- +(.+)$/.exec(line);
    const type = bullet ? 'list' : 'paragraph';
    const text = bullet ? bullet[1] : line;
    const last = blocks.at(-1);
    if (!startBlock && last?.type === type) last.lines.push(text);
    else blocks.push({ type, lines: [text] });
    startBlock = false;
  }

  return blocks;
}

export default function KnowledgeArticlePage() {
  const { section, slug } = useParams<{ section: string; slug: string }>();
  const { getCityName } = useLocation();
  const { language } = useLanguage();
  const t = (labels: LangValues) => pickLang(language, labels);
  const { data: article, isLoading, isError, isFetching, refetch } = useKnowledgeArticle(section || '', slug || '');
  const cityName = getCityName(language as 'en' | 'ru' | 'th');
  const sectionMeta = getSectionMeta(section || '', language === 'ru' ? 'ru' : 'en');
  const knowledgeTitle = t({ en: 'Knowledge', ru: 'База знаний', th: 'คลังความรู้' });
  const contentsTitle = t({ en: 'On this page', ru: 'На этой странице', th: 'ในหน้านี้' });
  const blocks = article ? articleBlocks(article.content) : [];
  const headings = blocks.filter(block => block.type === 'heading');
  const updated = article?.updatedAt ? new Date(article.updatedAt) : null;
  const contentsLinks = (
    <ol className="space-y-1">
      {headings.map(heading => (
        <li key={heading.id} className={heading.level === 3 ? 'ps-3' : undefined}>
          <a href={'#' + heading.id} className="ds-focus block px-2 py-1 text-sm text-muted-foreground [overflow-wrap:anywhere] hover:bg-muted hover:text-foreground">
            {heading.text}
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <>
      <SEOHead title={article ? article.title + ' — ' + cityName : knowledgeTitle} description={article?.summary || ''} />
      <PageContainer className="space-y-6 overflow-visible pb-24">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <BackButton fallbackPath={section ? APP_ROUTES.KNOWLEDGE_SECTION(section) : APP_ROUTES.KNOWLEDGE} variant="ghost" size="sm" />
          <Link to={APP_ROUTES.KNOWLEDGE} className="underline-offset-4 hover:underline">{knowledgeTitle}</Link>
          {section && sectionMeta && (
            <>
              <span aria-hidden="true">/</span>
              <Link to={APP_ROUTES.KNOWLEDGE_SECTION(section)} className="underline-offset-4 hover:underline">
                {sectionMeta.label}
              </Link>
            </>
          )}
        </div>

        {isError ? (
          <Card>
            <CardContent className="space-y-3 py-6">
              <h1 className="text-h2">{knowledgeTitle}</h1>
              <p role="alert">{t({ en: 'This article could not be loaded.', ru: 'Не удалось загрузить статью.', th: 'โหลดบทความนี้ไม่ได้' })}</p>
              <Button variant="outline" disabled={isFetching} onClick={() => refetch()}>
                {t({ en: 'Try again', ru: 'Повторить', th: 'ลองอีกครั้ง' })}
              </Button>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="space-y-4" aria-busy="true" aria-label={t({ en: 'Loading article', ru: 'Загружаем статью', th: 'กำลังโหลดบทความ' })}>
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : article ? (
          <div className="grid items-start gap-6 lg:grid-cols-12">
            {headings.length > 0 && (
              <nav aria-label={contentsTitle} className="hidden min-w-0 lg:sticky lg:top-24 lg:col-span-2 lg:block">
                <p className="mb-2 font-semibold">{contentsTitle}</p>
                {contentsLinks}
              </nav>
            )}

            <article className={headings.length > 0 ? 'min-w-0 lg:col-span-7' : 'min-w-0 lg:col-span-9'}>
              <header className="space-y-3 border-b pb-5">
                <h1 className="text-h1 [overflow-wrap:anywhere]">{article.title}</h1>
                {updated && !Number.isNaN(updated.getTime()) && (
                  <p className="text-sm text-muted-foreground">
                    {t({ en: 'Updated', ru: 'Обновлено', th: 'อัปเดต' })}{' '}
                    <time dateTime={updated.toISOString()}>{new Intl.DateTimeFormat(language, { dateStyle: 'medium' }).format(updated)}</time>
                  </p>
                )}
                {article.summary && <p className="text-lg text-muted-foreground [overflow-wrap:anywhere]">{article.summary}</p>}
              </header>

              {headings.length > 0 && (
                <details className="mt-5 border p-3 lg:hidden">
                  <summary className="cursor-pointer font-semibold">{contentsTitle}</summary>
                  <nav aria-label={contentsTitle} className="mt-2">{contentsLinks}</nav>
                </details>
              )}

              <div className="mt-6 max-w-[var(--layout-width-article)] space-y-4 leading-relaxed [overflow-wrap:anywhere]">
                {blocks.map((block, index) => {
                  if (block.type === 'heading') {
                    const Heading = block.level === 2 ? 'h2' : 'h3';
                    const style = block.level === 2 ? 'text-h3' : 'font-semibold';
                    return <Heading key={block.id} id={block.id} tabIndex={-1} className={'mt-6 scroll-mt-24 ' + style}>{block.text}</Heading>;
                  }
                  if (block.type === 'list') {
                    return <ul key={index} className="list-disc space-y-1 ps-6">
                      {block.lines.map((line, lineIndex) => <li key={lineIndex}>{line}</li>)}
                    </ul>;
                  }
                  return <p key={index} className="whitespace-pre-line">{block.lines.join('\n')}</p>;
                })}
              </div>
            </article>

            <aside className="min-w-0 lg:sticky lg:top-24 lg:col-span-3">
              <RelatedServicesLinks section={section} />
            </aside>
          </div>
        ) : (
          <Card>
            <CardContent className="space-y-4 py-6">
              <h1 className="text-h2">{t({ en: 'Article not found', ru: 'Статья не найдена', th: 'ไม่พบบทความ' })}</h1>
              <Button asChild variant="outline"><Link to={APP_ROUTES.KNOWLEDGE}>{knowledgeTitle}</Link></Button>
            </CardContent>
          </Card>
        )}
      </PageContainer>
    </>
  );
}
