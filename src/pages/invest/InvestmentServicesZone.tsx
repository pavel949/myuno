import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/contexts/LanguageContext';
import { MiniAppLayout } from '@/components/miniapp';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck,
  Scale,
  Users,
  FileSearch,
  Building,
  ArrowRight,
  HandCoins,
} from 'lucide-react';
import { APP_ROUTES } from '@/lib/config/routes';

interface Service {
  icon: React.ElementType;
  titleRu: string;
  titleEn: string;
  descRu: string;
  descEn: string;
  badgeRu?: string;
  badgeEn?: string;
}

const SERVICES: Service[] = [
  {
    icon: ShieldCheck,
    titleRu: 'Представляйте мои интересы',
    titleEn: 'Represent my interests',
    descRu: 'Local partner / nominee / operator, который ведёт ваш проект на месте.',
    descEn: 'Local partner / nominee / operator running the project on the ground.',
    badgeRu: 'Главное',
    badgeEn: 'Featured',
  },
  {
    icon: Scale,
    titleRu: 'Юристы и BOI',
    titleEn: 'Lawyers & BOI',
    descRu: 'Регистрация компании, BOI, контракты, due diligence.',
    descEn: 'Company setup, BOI, contracts, due diligence.',
  },
  {
    icon: FileSearch,
    titleRu: 'Due Diligence',
    titleEn: 'Due Diligence',
    descRu: 'Проверка объекта, бизнеса или партнёра до сделки.',
    descEn: 'Asset, business or partner check before the deal.',
  },
  {
    icon: HandCoins,
    titleRu: 'Бухгалтерия и налоги',
    titleEn: 'Accounting & tax',
    descRu: 'Бухгалтер, payroll, налоги, аудит.',
    descEn: 'Accountant, payroll, tax filing, audit.',
  },
  {
    icon: Building,
    titleRu: 'Property Management',
    titleEn: 'Property Management',
    descRu: 'Управление арендной недвижимостью под ключ.',
    descEn: 'End-to-end rental property management.',
  },
  {
    icon: Users,
    titleRu: 'M&A / Business Brokerage',
    titleEn: 'M&A / Business Brokerage',
    descRu: 'Сопровождение покупки или продажи действующего бизнеса.',
    descEn: 'Support buying or selling an operating business.',
  },
];

export default function InvestmentServicesZone() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <>
      <Helmet>
        <title>{isRu ? 'Услуги для инвесторов | myUNO' : 'Investor Services | myUNO'}</title>
      </Helmet>
      <MiniAppLayout title={isRu ? 'Услуги' : 'Services'} showSearch={false}>
        <div className="space-y-5 pb-10">
          <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <h1 className="font-bold text-lg">
                  {isRu ? 'Capital Advisory Marketplace' : 'Capital Advisory Marketplace'}
                </h1>
              </div>
              <p className="text-sm text-muted-foreground">
                {isRu
                  ? 'Юристы, бухгалтеры, BOI-консультанты, нотариусы и operating partners — проверенные люди, ведущие ваш проект.'
                  : 'Lawyers, accountants, BOI consultants, notaries and operating partners — vetted people running your project.'}
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2">
            {SERVICES.map((svc, idx) => {
              const Icon = svc.icon;
              return (
                <Card key={idx} className="hover:border-primary/30 transition-colors">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="w-9 h-9 rounded-none bg-primary/10 text-primary flex items-center justify-center">
                        <Icon className="h-4 w-4" />
                      </div>
                      {svc.badgeRu && (
                        <Badge variant="secondary" className="text-[10px]">
                          {isRu ? svc.badgeRu : svc.badgeEn}
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-sm">{isRu ? svc.titleRu : svc.titleEn}</h3>
                    <p className="text-xs text-muted-foreground">{isRu ? svc.descRu : svc.descEn}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <section className="rounded-none bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 p-5 space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-none bg-primary/20">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold">
                  {isRu ? 'Оставить запрос' : 'Submit a request'}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {isRu
                    ? 'Опишите задачу — найдём проверенного партнёра под ваш бюджет и сроки.'
                    : 'Describe your task — we will match a vetted partner to your budget and timeline.'}
                </p>
              </div>
            </div>
            <Button onClick={() => navigate(APP_ROUTES.INVEST_RAISE)} className="w-full gap-2">
              {isRu ? 'Подать заявку' : 'Submit application'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </section>
        </div>
      </MiniAppLayout>
    </>
  );
}
