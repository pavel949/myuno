import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/contexts/LanguageContext';
import { MiniAppLayout } from '@/components/miniapp';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Building, FileText, Globe2, Briefcase, Calculator, Construction } from 'lucide-react';

interface Topic {
  icon: React.ElementType;
  titleRu: string;
  titleEn: string;
  itemsRu: string[];
  itemsEn: string[];
  color: string;
}

const TOPICS: Topic[] = [
  {
    icon: Building,
    titleRu: 'Структуры собственности',
    titleEn: 'Ownership structures',
    itemsRu: ['Thai Limited Company', 'BOI компания', 'Treaty of Amity (US)', 'Лизхолд vs Фрихолд'],
    itemsEn: ['Thai Limited Company', 'BOI Company', 'Treaty of Amity (US)', 'Leasehold vs Freehold'],
    color: 'emerald',
  },
  {
    icon: FileText,
    titleRu: 'Налоги и отчётность',
    titleEn: 'Tax & reporting',
    itemsRu: ['CIT, VAT, withholding', 'Personal income tax для иностранцев', 'Repatriation прибыли', 'Двойное налогообложение'],
    itemsEn: ['CIT, VAT, withholding', 'Personal income tax for foreigners', 'Profit repatriation', 'Double taxation treaties'],
    color: 'blue',
  },
  {
    icon: Globe2,
    titleRu: 'Виза и work permit',
    titleEn: 'Visa & work permit',
    itemsRu: ['Smart Visa', 'LTR Visa (10 лет)', 'Non-B + work permit', 'Виза собственника бизнеса'],
    itemsEn: ['Smart Visa', 'LTR Visa (10 years)', 'Non-B + work permit', 'Business owner visa'],
    color: 'violet',
  },
  {
    icon: Briefcase,
    titleRu: 'Как открыть',
    titleEn: 'How to open',
    itemsRu: ['Ресторан / кафе / бар', 'Отель / villa-rental', 'Spa / wellness', 'Retail / e-commerce', 'Чартерный бизнес'],
    itemsEn: ['Restaurant / cafe / bar', 'Hotel / villa rental', 'Spa / wellness', 'Retail / e-commerce', 'Charter business'],
    color: 'amber',
  },
  {
    icon: Calculator,
    titleRu: 'Импорт / экспорт',
    titleEn: 'Import / export',
    itemsRu: ['Customs и лицензии', 'FDA / TISI / FCC', 'Free Zone / Bonded Warehouse', 'Logistics из РФ и СНГ'],
    itemsEn: ['Customs & licenses', 'FDA / TISI / FCC', 'Free Zone / Bonded Warehouse', 'Logistics from CIS'],
    color: 'cyan',
  },
];

export default function InvestmentKnowledgeZone() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <>
      <Helmet>
        <title>{isRu ? 'Бизнес в Таиланде — Знания | myUNO' : 'Business in Thailand — Knowledge | myUNO'}</title>
      </Helmet>
      <MiniAppLayout title={isRu ? 'Знания' : 'Knowledge'} showSearch={false}>
        <div className="space-y-5 pb-10">
          <Card className="bg-gradient-to-br from-blue-500/10 to-violet-500/10 border-blue-500/20">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <h1 className="font-bold text-lg">
                  {isRu ? 'Бизнес в Таиланде 101' : 'Doing Business in Thailand 101'}
                </h1>
              </div>
              <p className="text-sm text-muted-foreground">
                {isRu
                  ? 'Гайды и кейсы по структурам, налогам, визам и индустриям. Контент пополняется.'
                  : 'Guides and case studies on structures, taxes, visas and industries. Content is growing.'}
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2">
            {TOPICS.map((topic, idx) => {
              const Icon = topic.icon;
              return (
                <Card key={idx} className="hover:border-primary/30 transition-colors">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-${topic.color}-500/10 text-${topic.color}-600 dark:text-${topic.color}-400`}>
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
              <Construction className="h-8 w-8 text-muted-foreground mx-auto" />
              <h3 className="font-semibold">
                {isRu ? 'Полный база знаний скоро' : 'Full knowledge base coming soon'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isRu
                  ? 'Готовим подробные статьи и интерактивные калькуляторы. Подпишитесь на обновления.'
                  : 'Detailed articles and interactive calculators are in the works. Stay tuned.'}
              </p>
              <Badge variant="outline">Phase 3</Badge>
            </CardContent>
          </Card>
        </div>
      </MiniAppLayout>
    </>
  );
}
