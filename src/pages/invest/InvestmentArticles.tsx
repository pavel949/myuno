import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useInvestmentArticles } from '@/hooks/investment-hub/useInvestmentArticles';
import { MiniAppLayout } from '@/components/miniapp';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/page/EmptyState';
import { Clock, ArrowRight, BookOpen } from 'lucide-react';

export default function InvestmentArticles() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: articles = [], isLoading } = useInvestmentArticles();

  const title = isRu ? 'База знаний — Инвестиции в Таиланд' : 'Knowledge Base — Invest in Thailand';

  return (
    <>
      <Helmet><title>{title}</title></Helmet>
      <MiniAppLayout title={isRu ? 'База знаний' : 'Knowledge Base'} showSearch={false}>
        <div className="space-y-4 pb-10">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BookOpen className="w-4 h-4" />
            {isRu ? 'Гайды по инвестициям, рынкам и юридическим структурам Таиланда' : 'Guides on investing, markets and legal structures in Thailand'}
          </div>
          {isLoading ? (
            <div className="grid sm:grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
            </div>
          ) : articles.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              isRu={isRu}
              title="Knowledge base planned · Q3 2026"
              titleRu="База знаний запланировано · Q3 2026"
              description="Investment, tax and legal-structure guides ship with the Capital launch in Q3 2026."
              descriptionRu="Гайды по инвестициям, налогам и юридическим структурам выйдут с запуском Capital в Q3 2026."
            />
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {articles.map((a) => (
                <Link key={a.id} to={`/invest/articles/${a.slug}`}>
                  <Card className="h-full hover:border-primary/40 transition-colors">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-[10px]">{a.category}</Badge>
                        {a.read_time_min && (<><Clock className="w-3 h-3" />{a.read_time_min} {isRu ? 'мин' : 'min'}</>)}
                      </div>
                      <h3 className="font-semibold text-base leading-tight">{isRu ? a.title_ru : a.title_en}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-3">{isRu ? a.excerpt_ru : a.excerpt_en}</p>
                      <div className="flex items-center gap-1.5 text-xs text-primary pt-1">
                        {isRu ? 'Читать' : 'Read'} <ArrowRight className="w-3 h-3" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </MiniAppLayout>
    </>
  );
}
