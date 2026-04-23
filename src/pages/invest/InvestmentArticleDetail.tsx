import { Helmet } from 'react-helmet-async';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useInvestmentArticle } from '@/hooks/investment-hub/useInvestmentArticles';
import { MiniAppLayout } from '@/components/miniapp';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, AlertTriangle, TrendingUp, Banknote, ArrowRight } from 'lucide-react';
import { APP_ROUTES } from '@/lib/config/routes';

export default function InvestmentArticleDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: article, isLoading } = useInvestmentArticle(slug);

  if (isLoading) {
    return (
      <MiniAppLayout title="..." showSearch={false}>
        <div className="space-y-4"><Skeleton className="h-8 w-2/3" /><Skeleton className="h-64" /></div>
      </MiniAppLayout>
    );
  }
  if (!article) {
    return (
      <MiniAppLayout title={isRu ? 'Не найдено' : 'Not found'} showSearch={false}>
        <p className="text-muted-foreground">{isRu ? 'Статья не найдена' : 'Article not found'}</p>
        <Button variant="ghost" onClick={() => navigate('/invest/articles')} className="mt-3">
          <ArrowLeft className="w-4 h-4 mr-1" /> {isRu ? 'Назад к базе знаний' : 'Back to knowledge base'}
        </Button>
      </MiniAppLayout>
    );
  }

  const title = isRu ? article.title_ru : article.title_en;
  const body = (isRu ? article.body_ru : article.body_en) || '';

  // Minimal markdown: headings + paragraphs + bullets
  const renderBody = (text: string) =>
    text.split('\n').map((line, i) => {
      const t = line.trim();
      if (!t) return <div key={i} className="h-2" />;
      if (t.startsWith('### ')) return <h3 key={i} className="text-base font-semibold mt-4 mb-1">{t.slice(4)}</h3>;
      if (t.startsWith('## ')) return <h2 key={i} className="text-lg font-bold mt-5 mb-2">{t.slice(3)}</h2>;
      if (t.startsWith('# ')) return <h1 key={i} className="text-xl font-bold mt-5 mb-2">{t.slice(2)}</h1>;
      if (t.startsWith('- ')) return <li key={i} className="ml-4 text-sm leading-relaxed">{t.slice(2).replace(/\*\*(.+?)\*\*/g, '$1')}</li>;
      return <p key={i} className="text-sm leading-relaxed">{t.replace(/\*\*(.+?)\*\*/g, '$1')}</p>;
    });

  return (
    <>
      <Helmet>
        <title>{title} | myUNO</title>
        <meta name="description" content={(isRu ? article.excerpt_ru : article.excerpt_en) || title} />
      </Helmet>
      <MiniAppLayout title={isRu ? 'Статья' : 'Article'} showSearch={false}>
        <article className="space-y-4 pb-10 max-w-2xl">
          <Button variant="ghost" size="sm" onClick={() => navigate('/invest/articles')} className="-ml-2">
            <ArrowLeft className="w-4 h-4 mr-1" /> {isRu ? 'База знаний' : 'Knowledge'}
          </Button>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">{article.category}</Badge>
            {article.read_time_min && (<><Clock className="w-3 h-3" />{article.read_time_min} {isRu ? 'мин' : 'min'}</>)}
          </div>

          <h1 className="text-2xl font-bold leading-tight">{title}</h1>

          {(article.avg_ticket_thb || article.typical_roi_pct) && (
            <div className="grid grid-cols-2 gap-2">
              {article.avg_ticket_thb && (
                <div className="rounded-none border p-3">
                  <div className="text-xs text-muted-foreground flex items-center gap-1"><Banknote className="w-3 h-3" />{isRu ? 'Средний тикет' : 'Avg ticket'}</div>
                  <p className="font-semibold">{(article.avg_ticket_thb / 1_000_000).toFixed(0)}M ฿</p>
                </div>
              )}
              {article.typical_roi_pct && (
                <div className="rounded-none border p-3">
                  <div className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="w-3 h-3" />{isRu ? 'Типичный ROI' : 'Typical ROI'}</div>
                  <p className="font-semibold">{article.typical_roi_pct}%</p>
                </div>
              )}
            </div>
          )}

          <div className="prose prose-sm max-w-none space-y-1">{renderBody(body)}</div>

          {article.risks_summary && (
            <div className="rounded-none border border-accent/40/30 bg-accent/5 p-3 mt-4">
              <div className="flex items-center gap-1.5 text-xs font-medium text-accent mb-1">
                <AlertTriangle className="w-3.5 h-3.5" /> {isRu ? 'Риски' : 'Risks'}
              </div>
              <p className="text-sm">{article.risks_summary}</p>
            </div>
          )}

          <div className="rounded-none border border-primary/30 bg-primary/5 p-4 mt-4">
            <h3 className="font-semibold mb-1">{isRu ? 'Готовы инвестировать?' : 'Ready to invest?'}</h3>
            <p className="text-sm text-muted-foreground mb-3">
              {isRu ? 'Посмотрите анонимизированные сделки или подайте свой проект.' : 'Browse anonymized deals or submit your own project.'}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => navigate(APP_ROUTES.INVEST_DEALS_BOARD)} className="gap-1.5">
                {isRu ? 'Сделки' : 'Browse deals'} <ArrowRight className="w-3.5 h-3.5" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => navigate(APP_ROUTES.INVEST_SUBMIT)}>
                {isRu ? 'Подать проект' : 'Submit opportunity'}
              </Button>
            </div>
          </div>
        </article>
      </MiniAppLayout>
    </>
  );
}
