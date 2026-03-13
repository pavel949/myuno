import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

export default function KnowledgeArticlePage() {
  const { section, slug } = useParams<{ section: string; slug: string }>();
  const navigate = useNavigate();
  const { getCityName } = useLocation();
  const { language } = useLanguage();
  const { data: article, isLoading } = useKnowledgeArticle(section || '', slug || '');

  const cityName = getCityName(language as 'en' | 'ru' | 'th');
  const sectionMeta = getSectionMeta(section || '', language as 'en' | 'ru');

  const pageTitle = article 
    ? `${article.title} — ${cityName}` 
    : 'Knowledge Hub';

  // Simple markdown-like rendering (basic)
  const renderContent = (content: string) => {
    if (!content) return null;

    return content.split('\n\n').map((paragraph, idx) => {
      // Check for headers
      if (paragraph.startsWith('## ')) {
        return (
          <h2 key={idx} className="text-xl font-semibold mt-6 mb-3 text-foreground">
            {paragraph.replace('## ', '')}
          </h2>
        );
      }
      if (paragraph.startsWith('### ')) {
        return (
          <h3 key={idx} className="text-lg font-medium mt-4 mb-2 text-foreground">
            {paragraph.replace('### ', '')}
          </h3>
        );
      }
      
      // Check for bullet lists
      if (paragraph.includes('\n- ') || paragraph.startsWith('- ')) {
        const items = paragraph.split('\n').filter(line => line.startsWith('- '));
        return (
          <ul key={idx} className="list-disc list-inside space-y-1 my-3 text-foreground">
            {items.map((item, i) => (
              <li key={i} className="text-sm">{item.replace('- ', '')}</li>
            ))}
          </ul>
        );
      }

      // Regular paragraph
      return (
        <p key={idx} className="text-foreground text-sm leading-relaxed my-3">
          {paragraph}
        </p>
      );
    });
  };

  return (
    <>
      <SEOHead 
        title={pageTitle}
        description={article?.summary || ''}
      />
      
      <PageContainer className="pb-32">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(`/knowledge/${section}`)}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              {sectionMeta?.label}
            </p>
            <h1 className="text-xl font-bold text-foreground">
              {isLoading ? <Skeleton className="h-7 w-48" /> : article?.title}
            </h1>
          </div>
        </div>

        {/* Content */}
        <section className="mb-8">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : article ? (
            <Card>
              <CardContent className="py-6">
                {article.icon && (
                  <div className="text-4xl mb-4">{article.icon}</div>
                )}
                {article.summary && (
                  <p className="text-muted-foreground text-sm mb-4 pb-4 border-b">
                    {article.summary}
                  </p>
                )}
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {renderContent(article.content)}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  {language === 'ru' 
                    ? 'Статья не найдена'
                    : 'Article not found'
                  }
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => navigate('/knowledge')}
                >
                  {language === 'ru' ? 'Вернуться к справочнику' : 'Back to Knowledge Hub'}
                </Button>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Related Services */}
        {article && <RelatedServicesLinks section={section} />}
      </PageContainer>
    </>
  );
}
