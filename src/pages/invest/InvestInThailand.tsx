import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/contexts/LanguageContext';
import { MiniAppLayout } from '@/components/miniapp';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Globe2, Building2, Plane, Banknote, ShieldCheck, ArrowRight, Briefcase, BookOpen } from 'lucide-react';
import { APP_ROUTES } from '@/lib/config/routes';

const MACRO = [
  { icon: TrendingUp, key: 'gdp', en: 'GDP growth +3% (2024)', ru: 'Рост ВВП +3% (2024)' },
  { icon: Plane, key: 'tour', en: '40M+ tourists/year', ru: '40M+ туристов в год' },
  { icon: Banknote, key: 'thb', en: 'Stable THB, low inflation', ru: 'Стабильный THB, низкая инфляция' },
  { icon: ShieldCheck, key: 'safe', en: 'Top-30 safest in SEA', ru: 'Топ-30 безопасных в ЮВА' },
];

const INDUSTRIES = [
  { icon: '🏨', en: 'Hospitality & Hotels', ru: 'Гостеприимство', tic: '20-100M ฿', roi: '8-14%' },
  { icon: '🍽️', en: 'F&B / Restaurants', ru: 'F&B / Рестораны', tic: '5-30M ฿', roi: '15-25%' },
  { icon: '🏗️', en: 'Real Estate Dev', ru: 'Девелопмент', tic: '50-500M ฿', roi: '20-40%' },
  { icon: '🛍️', en: 'Retail / E-com', ru: 'Ритейл / E-com', tic: '3-20M ฿', roi: '12-30%' },
  { icon: '⚓', en: 'Marine / Yachts', ru: 'Marine / Яхты', tic: '10-100M ฿', roi: '10-20%' },
  { icon: '🚢', en: 'Import / Export', ru: 'Импорт / Экспорт', tic: '5-50M ฿', roi: '15-35%' },
  { icon: '🏭', en: 'Manufacturing', ru: 'Производство', tic: '20-200M ฿', roi: '12-25%' },
  { icon: '💆', en: 'Wellness / Spa', ru: 'Wellness / Spa', tic: '3-15M ฿', roi: '15-30%' },
];

export default function InvestInThailand() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <>
      <Helmet>
        <title>{isRu ? 'Инвестиции в Таиланд | myUNO' : 'Invest in Thailand | myUNO'}</title>
        <meta
          name="description"
          content={
            isRu
              ? 'Почему стоит инвестировать в Таиланд: макроэкономика, индустрии, тикеты, ROI.'
              : 'Why invest in Thailand: macro, industries, ticket sizes, ROI.'
          }
        />
      </Helmet>
      <MiniAppLayout title={isRu ? 'Invest in Thailand' : 'Invest in Thailand'} showSearch={false}>
        <div className="space-y-5 pb-10">
          {/* Hero */}
          <Card className="bg-gradient-to-br from-primary/15 via-accent/10 to-primary/5 border-primary/20">
            <CardContent className="p-6 space-y-3">
              <Badge variant="secondary" className="gap-1">
                <Globe2 className="h-3 w-3" /> {isRu ? 'Юго-Восточная Азия' : 'Southeast Asia'}
              </Badge>
              <h1 className="text-2xl font-bold">
                {isRu
                  ? 'Почему капитал движется в Таиланд'
                  : 'Why capital is moving into Thailand'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isRu
                  ? 'Демография, туризм, льготы BOI, доступ на рынки ASEAN, развитая инфраструктура и доступная стоимость входа делают Таиланд №1 направлением для среднего и крупного капитала из СНГ и EU.'
                  : 'Demographics, tourism, BOI incentives, ASEAN market access, mature infrastructure and accessible entry tickets make Thailand the #1 destination for mid-size CIS and EU capital.'}
              </p>
            </CardContent>
          </Card>

          {/* Macro stats */}
          <div className="grid grid-cols-2 gap-3">
            {MACRO.map(({ icon: Icon, key, en, ru }) => (
              <Card key={key}>
                <CardContent className="p-4">
                  <Icon className="h-5 w-5 text-primary mb-2" />
                  <div className="text-sm font-semibold leading-tight">{isRu ? ru : en}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Industry briefs */}
          <section className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-bold">
                {isRu ? 'Куда инвестировать' : 'Where to invest'}
              </h2>
              <Button
                variant="link"
                size="sm"
                className="text-xs"
                onClick={() => navigate(APP_ROUTES.INVEST_BUSINESS)}
              >
                {isRu ? 'Каталог' : 'Catalog'} →
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {INDUSTRIES.map((ind) => (
                <Card key={ind.en} className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(APP_ROUTES.INVEST_BUSINESS)}>
                  <CardContent className="p-4 space-y-2">
                    <div className="text-2xl">{ind.icon}</div>
                    <div className="font-semibold text-sm leading-tight">{isRu ? ind.ru : ind.en}</div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{isRu ? 'Тикет' : 'Ticket'}</span>
                        <span className="font-mono">{ind.tic}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ROI</span>
                        <span className="font-mono text-primary">{ind.roi}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* CTA: Real Estate dominates */}
          <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <h3 className="font-bold">
                  {isRu ? 'Недвижимость — основа портфеля' : 'Real Estate — portfolio anchor'}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {isRu
                  ? 'Off-plan на ранней стадии даёт 25-40% ROI до сдачи. Готовые виллы — 7-12% годовых аренды. Резидентская виза от 10M ฿.'
                  : 'Early off-plan delivers 25-40% ROI before completion. Ready villas yield 7-12% rental p.a. Investor visa from 10M ฿.'}
              </p>
              <div className="flex gap-2">
                <Button onClick={() => navigate(APP_ROUTES.INVEST_REAL_ESTATE)} className="flex-1 gap-1.5">
                  {isRu ? 'Объекты' : 'Browse properties'} <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={() => navigate('/newbuilds')}>
                  {isRu ? 'Новостройки' : 'New builds'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* CTA: Knowledge Base */}
          <Card className="bg-gradient-to-br from-accent/10 to-primary/5 border-accent/20">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <h3 className="font-bold">
                  {isRu ? 'База знаний инвестора' : 'Investor knowledge base'}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {isRu
                  ? 'Гайды по структурам, налогам, визам, due diligence и индустриям Таиланда.'
                  : 'Guides on structures, taxes, visas, due diligence and Thai industries.'}
              </p>
              <Button variant="outline" onClick={() => navigate('/invest/articles')} className="w-full gap-1.5">
                {isRu ? 'Открыть базу знаний' : 'Open knowledge base'} <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* CTA: Capital deal intake (USD 200K+) — RERE Investment track */}
          <Card className="border-border bg-card">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-foreground" />
                <h3 className="font-semibold">
                  {isRu ? 'Инвестиционная сделка от 200 000 USD' : 'Investment deal from USD 200 000'}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {isRu
                  ? 'Сопровождение сделки: проверка контрагентов, эскроу, подписание. Комиссия — 2% сделки + 0,5% эскроу. Ставки публичны.'
                  : 'Deal support: counterparty checks, escrow, signing. Fee — 2% deal + 0.5% escrow. Rates are public.'}
              </p>
              <Button onClick={() => navigate('/invest/capital-deal')} className="w-full gap-1.5">
                {isRu ? 'Перейти к услуге' : 'Open service'} <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* CTA: Pitch */}
          <Card className="bg-gradient-to-br from-primary/10 to-accent/5 border-primary/20">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                <h3 className="font-bold">
                  {isRu ? 'У вас проект или бизнес?' : 'Have a project or business?'}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {isRu
                  ? 'Девелоперы, операторы, основатели: подайте проект — мы покажем его релевантным инвесторам анонимно.'
                  : 'Developers, operators, founders: pitch your project — we match anonymously to relevant investors.'}
              </p>
              <Button onClick={() => navigate('/invest/submit')} className="w-full gap-1.5">
                {isRu ? 'Подать проект' : 'Pitch your project'} <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </MiniAppLayout>
    </>
  );
}
