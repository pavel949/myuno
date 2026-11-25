import { useParams, useNavigate, Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
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
import { extractArticleHeadings, headingAnchorId, readingMinutes, type ArticleHeading } from '@/lib/knowledge/articleOutline';

function formatUpdated(iso: string | null | undefined, isRu: boolean): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(isRu ? 'ru-RU' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function ArticleBody({ content }: { content: string }) {
  if (!content) return null;
  let headingIndex = 0;
  return (
    <>
      {content.split('\n\n').map((paragraph, idx) => {
        if (paragraph.startsWith('## ')) {
          const text = paragraph.replace('## ', '').trim();
          const id = headingAnchorId(text, headingIndex);
          headingIndex += 1;
          return (
            <h2 key={idx} id={id} className="scroll-mt-24 text-xl font-semibold mt-8 mb-3 text-foreground">
              {text}
            </h2>
          );
        }
        if (paragraph.startsWith('### ')) {
          return (
            <h3 key={idx} className="text-lg font-medium mt-5 mb-2 text-foreground">
              {paragraph.replace('### ', '')}
            </h3>
          );
        }
        if (paragraph.includes('\n- ') || paragraph.startsWith('- ')) {
          const items = paragraph.split('\n').filter((line) => line.startsWith('- '));
          return (
            <ul key={idx} className="list-disc pl-5 space-y-1 my-3 text-foreground">
              {items.map((item, i) => (
                <li key={i} className="text-base leading-relaxed">{item.replace('- ', '')}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={idx} className="text-foreground text-base leading-relaxed my-4">
            {paragraph}
          </p>
        );
      })}
    </>
  );
}

function TableOfContents({ headings, isRu }: { headings: ArticleHeading[]; isRu: boolean }) {
  return (
    <nav aria-label={isRu ? 'Содержание' : 'Contents'}>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {isRu ? 'Содержание' : 'Contents'}
      </p>
      <ol className="space-y-1 border-l border-border">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              className="-ml-px flex min-h-11 items-center border-l-2 border-transparent pl-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:min-h-9"
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default function KnowledgeArticlePage() {
  const { section, slug } = useParams<{ section: string; slug: string }>();
  const navigate = useNavigate();
  const { getCityName } = useLocation();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: article, isLoading, isError, refetch } = useKnowledgeArticle(section || '', slug || '');

  const cityName = getCityName(language as 'en' | 'ru' | 'th');
  const sectionMeta = getSectionMeta(section || '', language as 'en' | 'ru');

  const pageTitle = article ? `${article.title} — ${cityName}` : 'Knowledge Hub';
  const headings = article ? extractArticleHeadings(article.content) : [];
  const minutes = article ? readingMinutes(article.content) : 0;
  const updated = formatUpdated(article?.updatedAt, isRu);
  const showToc = headings.length >= 2;

  return (
    <>
      <SEOHead title={pageTitle} description={article?.summary || ''} />

      <PageContainer className="pb-32">
        {/* Header */}
        <header className="mb-6 flex items-start gap-3">
          <BackButton fallbackPath={section ? APP_ROUTES.KNOWLEDGE_SECTION(section) : APP_ROUTES.KNOWLEDGE} variant="ghost" size="sm" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {sectionMeta?.label}
              {cityName ? ` · ${cityName}` : ''}
            </p>
            <h1 className="mt-1 font-serif text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
              {isLoading ? <Skeleton className="h-8 w-56" /> : article?.title}
            </h1>
            {article && (updated || minutes > 0) && (
              <p className="mt-2 text-sm text-muted-foreground">
                {updated && (isRu ? `Обновлено ${updated}` : `Updated ${updated}`)}
                {updated && minutes > 0 && ' · '}
                {minutes > 0 && (isRu ? `${minutes} мин чтения` : `${minutes} min read`)}
              </p>
            )}
          </div>
        </header>

        {isLoading ? (
          <div className="space-y-4" aria-busy="true">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : isError ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-foreground">
                {isRu
                  ? 'Не удалось загрузить статью. Проверьте соединение и попробуйте снова.'
                  : "We couldn't load this article. Check your connection and try again."}
              </p>
              <Button variant="outline" className="mt-4 min-h-11" onClick={() => void refetch()}>
                {isRu ? 'Повторить' : 'Try again'}
              </Button>
            </CardContent>
          </Card>
        ) : article ? (
          <div className="grid gap-8 lg:grid-cols-[200px_minmax(0,1fr)_260px] lg:items-start">
            {/* TOC — sticky on desktop, inline on mobile */}
            <aside className={showToc ? 'lg:sticky lg:top-24' : 'hidden lg:block'}>
              {showToc && <TableOfContents headings={headings} isRu={isRu} />}
            </aside>

            {/* Reading column */}
            <article className="min-w-0">
              {article.summary && (
                <p className="mb-6 border-b border-border pb-6 text-lg leading-relaxed text-muted-foreground">
                  {article.summary}
                </p>
              )}
              <ArticleBody content={article.content} />
            </article>

            {/* Side panel */}
            <aside className="lg:sticky lg:top-24">
              <Card>
                <CardContent className="space-y-3 py-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {isRu ? 'Остались вопросы' : 'Still have a question'}
                  </p>
                  <p className="text-sm text-foreground">
                    {isRu
                      ? 'Напишите нам: ответим по вашей ситуации и подскажем следующий шаг.'
                      : 'Write to us: we answer for your situation and suggest the next step.'}
                  </p>
                  <Button asChild variant="outline" className="min-h-11 w-full">
                    <Link to={APP_ROUTES.CONTACT}>
                      <MessageCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                      {isRu ? 'Написать нам' : 'Contact us'}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </aside>
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">{isRu ? 'Статья не найдена' : 'Article not found'}</p>
              <Button variant="outline" className="mt-4 min-h-11" onClick={() => navigate(APP_ROUTES.KNOWLEDGE)}>
                {isRu ? 'Вернуться к справочнику' : 'Back to Knowledge Hub'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Related Services */}
        {article && (
          <div className="mt-10">
            <RelatedServicesLinks section={section} />
          </div>
        )}
      </PageContainer>
    </>
  );
}
