import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useInvestmentArticles } from '@/hooks/investment-hub/useInvestmentArticles';
import { MiniAppLayout } from '@/components/miniapp';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  BookOpen,
  Building,
  FileText,
  Globe2,
  Briefcase,
  Calculator,
  Construction,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface Topic {
  icon: React.ElementType;
  titleRu: string;
  titleEn: string;
  itemsRu: string[];
  itemsEn: string[];
}

const TOPICS: Topic[] = [
  {
    icon: Building,
    titleRu: 'Структуры собственности',
    titleEn: 'Ownership structures',
    itemsRu: ['Thai Limited Company', 'BOI компания', 'Treaty of Amity (US)', 'Лизхолд vs Фрихолд'],
    itemsEn: ['Thai Limited Company', 'BOI Company', 'Treaty of Amity (US)', 'Leasehold vs Freehold'],
  },
  {
    icon: FileText,
    titleRu: 'Налоги и отчётность',
    titleEn: 'Tax & reporting',
    itemsRu: ['CIT, VAT, withholding', 'Personal income tax для иностранцев', 'Repatriation прибыли', 'Двойное налогообложение'],
    itemsEn: ['CIT, VAT, withholding', 'Personal income tax for foreigners', 'Profit repatriation', 'Double taxation treaties'],
  },
  {
    icon: Globe2,
    titleRu: 'Виза и work permit',
    titleEn: 'Visa & work permit',
    itemsRu: ['Smart Visa', 'LTR Visa (10 лет)', 'Non-B + work permit', 'Виза собственника бизнеса'],
    itemsEn: ['Smart Visa', 'LTR Visa (10 years)', 'Non-B + work permit', 'Business owner visa'],
  },
  {
    icon: Briefcase,
    titleRu: 'Как открыть',
    titleEn: 'How to open',
    itemsRu: ['Ресторан / кафе / бар', 'Отель / villa-rental', 'Spa / wellness', 'Retail / e-commerce', 'Чартерный бизнес'],
    itemsEn: ['Restaurant / cafe / bar', 'Hotel / villa rental', 'Spa / wellness', 'Retail / e-commerce', 'Charter business'],
  },
  {
    icon: Calculator,
    titleRu: 'Импорт / экспорт',
    titleEn: 'Import / export',
    itemsRu: ['Customs и лицензии', 'FDA / TISI / FCC', 'Free Zone / Bonded Warehouse', 'Logistics из РФ и СНГ'],
    itemsEn: ['Customs & licenses', 'FDA / TISI / FCC', 'Free Zone / Bonded Warehouse', 'Logistics from CIS'],
  },
];

export default function InvestmentKnowledgeZone() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: articles = [], isLoading } = useInvestmentArticles();

  return (
    <>
      <Helmet>
        <title>{isRu ? 'Бизнес в Таиланде — Знания | myUNO' : 'Business in Thailand — Knowledge | myUNO'}</title>
      </Helmet>
      <MiniAppLayout title={isRu ? 'Знания' : 'Knowledge'} showSearch={false}>
        <div className="space-y-5 pb-10">
          <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <h1 className="font-bold text-lg">
                  {isRu ? 'Бизнес в Таиланде 101' : 'Doing Business in Thailand 101'}
                </h1>
              </div>
              <p className="text-sm text-muted-foreground">
                {isRu
                  ? 'Гайды по структурам, налогам, визам и индустриям + статьи и кейсы.'
                  : 'Guides on structures, taxes, visas and industries + articles and case studies.'}
              </p>
            </CardContent>
          </Card>

          <Tabs defaultValue="guides" className="space-y-4">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="guides">{isRu ? 'Гайды' : 'Guides'}</TabsTrigger>
              <TabsTrigger value="articles">
                {isRu ? 'Статьи' : 'Articles'}
                {articles.length > 0 && (
                  <Badge variant="secondary" className="ml-2 text-[10px]">
                    {articles.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="guides" className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                {TOPICS.map((topic, idx) => {
                  const Icon = topic.icon;
                  return (
                    <Card key={idx} className="hover:border-primary/30 transition-colors">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-none flex items-center justify-center bg-primary/10 text-primary">
                            <Icon className="h-4 w-4" />
                          </div>
                          <h3 className="font-semibold text-sm">
                            {isRu ? topic.titleRu : topic.titleEn}
                          </h3>
                        </div>
                        <ul className="space-y-1.5">
                          {(isRu ? topic.itemsRu : topic.itemsEn).map((item, i) => (
                            <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                              <span className="text-primary mt-0.5">•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              <Card className="border-dashed">
                <CardContent className="p-6 text-center space-y-2">
                  <Construction className="h-7 w-7 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    {isRu
                      ? 'Подробные статьи и интерактивные калькуляторы в разработке.'
                      : 'Detailed articles and interactive calculators are in the works.'}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="articles">
              {isLoading ? (
                <div className="grid sm:grid-cols-2 gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-40" />
                  ))}
                </div>
              ) : articles.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="p-8 text-center space-y-2">
                    <BookOpen className="h-7 w-7 text-muted-foreground mx-auto" />
                    <h3 className="font-semibold text-sm">
                      {isRu ? 'База знаний — Q3 2026' : 'Knowledge base — Q3 2026'}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {isRu
                        ? 'Гайды по инвестициям, налогам и юридическим структурам выйдут с запуском Capital в Q3 2026.'
                        : 'Investment, tax and legal-structure guides ship with the Capital launch in Q3 2026.'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {articles.map((a) => (
                    <Link key={a.id} to={`/invest/articles/${a.slug}`}>
                      <Card className="h-full hover:border-primary/40 transition-colors">
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-[10px]">{a.category}</Badge>
                            {a.read_time_min && (
                              <>
                                <Clock className="w-3 h-3" />
                                {a.read_time_min} {isRu ? 'мин' : 'min'}
                              </>
                            )}
                          </div>
                          <h3 className="font-semibold text-base leading-tight">
                            {isRu ? a.title_ru : a.title_en}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {isRu ? a.excerpt_ru : a.excerpt_en}
                          </p>
                          <div className="flex items-center gap-1.5 text-xs text-primary pt-1">
                            {isRu ? 'Читать' : 'Read'} <ArrowRight className="w-3 h-3" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </MiniAppLayout>
    </>
  );
}
