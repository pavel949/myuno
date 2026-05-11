import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/uno/BackButton';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SEOHead } from '@/components/seo';
import { useLanguage } from '@/contexts/LanguageContext';
import { APP_ROUTES } from '@/lib/config/routes';
import { useRelocationArticle } from '@/hooks/useRelocationArticles';
import { renderMarkdownLikeContent } from '@/lib/relocation/renderMarkdownLike';

export default function RelocationGuideArticle() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: article, isLoading } = useRelocationArticle(slug);

  const title = article ? (isRu ? article.title_ru : article.title_en) : isRu ? 'Гайд' : 'Guide';
  const summary = article ? (isRu ? article.summary_ru : article.summary_en) : '';

  return (
    <AppLayout>
      <SEOHead
        title={title}
        description={summary}
        type="article"
        url={slug ? `https://myuno.app${APP_ROUTES.RELOCATION_GUIDE(slug)}` : undefined}
      />
      <div className="px-4 pb-28 pt-4 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <BackButton fallbackPath={APP_ROUTES.RELOCATION_GUIDES} variant="ghost" />
        </div>

        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-8 w-[75%]" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        )}

        {!isLoading && !article && (
          <p className="text-sm text-muted-foreground">{isRu ? 'Материал не найден.' : 'Article not found.'}</p>
        )}

        {article && (
          <>
            <h1 className="text-2xl font-bold text-foreground">{isRu ? article.title_ru : article.title_en}</h1>
            <p className="text-sm text-muted-foreground mt-2">{isRu ? article.summary_ru : article.summary_en}</p>
            <div className="mt-6">{renderMarkdownLikeContent(isRu ? article.content_ru : article.content_en)}</div>
            <div className="mt-8 flex flex-wrap gap-2">
              {article.related_route && (
                <Button type="button" variant="default" onClick={() => navigate(article.related_route!)}>
                  {isRu ? 'Связанный сервис' : 'Related service'}
                </Button>
              )}
              <Button type="button" variant="outline" onClick={() => navigate(APP_ROUTES.VISA_COMPARE)}>
                {isRu ? 'Сравнить визы' : 'Compare visas'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate(APP_ROUTES.RELOCATION_MY_PLAN)}>
                {isRu ? 'Мой план' : 'My plan'}
              </Button>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
