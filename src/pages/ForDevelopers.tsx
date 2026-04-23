/**
 * Public landing — real estate developers (projects, leads, placement on myUNO).
 */
import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { APP_ROUTES } from '@/lib/config/routes';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  Building2, LineChart, Users, Megaphone, ArrowRight, HardHat, LayoutGrid, PenLine,
  CheckCircle2,
} from 'lucide-react';

const benefits = [
  {
    icon: LayoutGrid,
    titleEn: 'Premium project showcase',
    titleRu: 'Премиальная витрина проектов',
    descEn: 'Dedicated newbuilds section, rich media, and unit-level pages.',
    descRu: 'Раздел новостроек, медиа и страницы юнитов.',
  },
  {
    icon: Users,
    titleEn: 'Qualified demand',
    titleRu: 'Целевой спрос',
    descEn: 'Investors, relocators, and owners already use myUNO in Phuket.',
    descRu: 'Инвесторы, релоканты и собственники уже в экосистеме myUNO.',
  },
  {
    icon: LineChart,
    titleEn: 'Lead & funnel tools',
    titleRu: 'Лиды и воронка',
    descEn: 'Portal tools to track interest, tours, and partner handoffs.',
    descRu: 'Портал для интереса, туров и передачи партнёрам.',
  },
  {
    icon: Megaphone,
    titleEn: 'Co-marketing',
    titleRu: 'Совместный маркетинг',
    descEn: 'Campaign landing pages, CRM handoffs, and concierge routing.',
    descRu: 'Лендинги кампаний, CRM и маршрутизация консьержа.',
  },
];

export default function ForDevelopers() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  return (
    <AppLayout showHeader={false}>
      <Helmet>
        <title>
          {isRu
            ? 'Застройщикам Пхукета — myUNO | Проекты и лиды'
            : 'Phuket developers — myUNO | Projects & leads'}
        </title>
        <meta
          name="description"
          content={
            isRu
              ? 'Размещение проектов, лиды инвесторов и релокантов, премиальная витрина новостроек на myUNO.'
              : 'List projects, capture investor and relocator leads, premium newbuilds placement on myUNO.'
          }
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <section className="relative overflow-hidden py-16 md:py-24 px-4">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
          <div className="relative max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              <Badge variant="secondary" className="mb-4 gap-1">
                <HardHat className="w-3.5 h-3.5" />
                {isRu ? 'Для девелоперов' : 'For developers'}
              </Badge>
              <h1 className="text-3xl md:text-5xl font-bold font-display tracking-tight mb-4">
                {isRu
                  ? 'Ваш проект — в супераппе, откуда приходят сделки'
                  : 'Your project in the super-app where deals start'}
              </h1>
              <p className="text-muted-foreground text-base md:text-lg mb-8">
                {isRu
                  ? 'Новострои, off-plan, брендированные страницы и доступ к аудитории myUNO на Пхукете.'
                  : 'Newbuilds, off-plan, branded pages, and access to myUNO’s Phuket audience.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" className="gap-2" onClick={() => navigate(APP_ROUTES.DEVELOPER_PORTAL_APPLY)}>
                  <PenLine className="w-4 h-4" />
                  {isRu ? 'Начать — это бесплатно' : 'Get started — it\'s free'}
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2"
                  onClick={() => navigate(APP_ROUTES.DEVELOPER_PORTAL)}
                >
                  <Building2 className="w-4 h-4" />
                  {isRu ? 'Войти в кабинет' : 'Sign in to portal'}
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 pb-16 grid sm:grid-cols-2 gap-4">
          {benefits.map((b, i) => (
            <motion.div
              key={b.titleEn}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.35 }}
            >
              <Card className="h-full border-border/80">
                <CardContent className="pt-6">
                  <b.icon className="w-8 h-8 text-primary mb-3" />
                  <h2 className="font-display font-semibold text-lg mb-1">
                    {isRu ? b.titleRu : b.titleEn}
                  </h2>
                  <p className="text-sm text-muted-foreground">{isRu ? b.descRu : b.descEn}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </section>

        {/* How it works */}
        <section className="max-w-3xl mx-auto px-4 pb-16">
          <h2 className="text-2xl font-display font-bold text-center mb-8">
            {isRu ? 'Как это работает' : 'How it works'}
          </h2>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            {[
              {
                step: '1',
                titleEn: 'Register company',
                titleRu: 'Зарегистрируйте компанию',
                descEn: 'Fill in company details and submit for review.',
                descRu: 'Заполните данные компании и отправьте на проверку.',
              },
              {
                step: '2',
                titleEn: 'Submit projects',
                titleRu: 'Добавьте проекты',
                descEn: 'Upload floor plans, renderings, prices, and unit layouts.',
                descRu: 'Загрузите планировки, рендеры, цены и юниты.',
              },
              {
                step: '3',
                titleEn: 'Receive leads',
                titleRu: 'Получайте лиды',
                descEn: 'Qualified buyers contact you directly through the portal.',
                descRu: 'Квалифицированные покупатели связываются с вами через портал.',
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i, duration: 0.35 }}
                className="flex-1 flex gap-4 items-start"
              >
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                  {item.step}
                </div>
                <div>
                  <p className="font-semibold text-sm mb-1">{isRu ? item.titleRu : item.titleEn}</p>
                  <p className="text-xs text-muted-foreground">{isRu ? item.descRu : item.descEn}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="max-w-3xl mx-auto px-4 pb-20 text-center">
          <div className="rounded-none border border-border/80 bg-card p-8">
            <h3 className="text-xl font-display font-bold mb-2">
              {isRu ? 'Готовы разместить проект?' : 'Ready to list your project?'}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {isRu
                ? 'Регистрация бесплатна. Модерация — до 48 часов.'
                : 'Registration is free. Moderation takes up to 48 hours.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
              <Button size="lg" className="gap-2" onClick={() => navigate(APP_ROUTES.DEVELOPER_PORTAL_APPLY)}>
                <PenLine className="w-4 h-4" />
                {isRu ? 'Зарегистрировать компанию' : 'Register your company'}
              </Button>
              <Button size="lg" variant="outline" className="gap-2" onClick={() => navigate(APP_ROUTES.DEVELOPER_PORTAL)}>
                <Building2 className="w-4 h-4" />
                {isRu ? 'Войти в кабинет' : 'Sign in to portal'}
              </Button>
            </div>
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground flex-wrap">
              {[
                isRu ? '120+ инвесторов ежемесячно' : '120+ investors monthly',
                isRu ? 'Выход на рынок за 48ч' : 'Live in 48h',
                isRu ? 'Без скрытых платежей' : 'No hidden fees',
              ].map((item) => (
                <span key={item} className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                  {item}
                </span>
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            {isRu
              ? 'Нужна индивидуальная интеграция — напишите через поддержку в приложении.'
              : 'Need a custom integration — contact support in the app.'}
          </p>
        </section>
      </div>
    </AppLayout>
  );
}
