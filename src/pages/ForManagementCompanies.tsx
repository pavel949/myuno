import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Helmet } from 'react-helmet-async';
import { AppLayout } from '@/components/layout/AppLayout';
import { LandingChrome } from '@/components/landings';
import {
  Building2, BarChart3, Users, Calendar, FileText,
  MessageSquare, Shield, Zap, Check, ArrowRight,
  Globe, Smartphone, Clock, DollarSign
} from 'lucide-react';

const tiers = [
  {
    id: 'starter',
    nameEn: 'Starter',
    nameRu: 'Стартовый',
    priceUsd: 199,
    slots: 5,
    featuresEn: ['Up to 5 properties', 'Task management', 'Basic financials', 'Calendar sync', 'Email support'],
    featuresRu: ['До 5 объектов', 'Управление задачами', 'Базовые финансы', 'Синхронизация календаря', 'Поддержка по email'],
  },
  {
    id: 'professional',
    nameEn: 'Professional',
    nameRu: 'Профессиональный',
    priceUsd: 399,
    slots: 15,
    popular: true,
    featuresEn: ['Up to 15 properties', 'Full CRM + pipeline', 'Owner reports (auto PDF)', 'Guest welcome automation', 'WhatsApp notifications', 'Marketplace commissions', 'Priority support'],
    featuresRu: ['До 15 объектов', 'Полный CRM + воронка', 'Отчёты владельцам (авто PDF)', 'Welcome-автоматизация', 'WhatsApp уведомления', 'Комиссии маркетплейса', 'Приоритетная поддержка'],
  },
  {
    id: 'enterprise',
    nameEn: 'Enterprise',
    nameRu: 'Корпоративный',
    priceUsd: 799,
    slots: 50,
    featuresEn: ['Up to 50 properties', 'Everything in Professional', 'Multi-team management', 'Custom branding', 'API access', 'Dedicated account manager', 'SLA guarantee'],
    featuresRu: ['До 50 объектов', 'Всё из Профессионального', 'Мульти-команды', 'Ваш брендинг', 'Доступ к API', 'Выделенный менеджер', 'Гарантия SLA'],
  },
];

const features = [
  { icon: Building2, titleEn: 'Property Management', titleRu: 'Управление объектами', descEn: 'Track all properties, units, meters, inventory in one place', descRu: 'Все объекты, юниты, счётчики и инвентарь в одном месте' },
  { icon: Calendar, titleEn: 'Booking Calendar', titleRu: 'Календарь бронирований', descEn: 'iCal sync, Airbnb integration, availability management', descRu: 'Синхронизация iCal, интеграция с Airbnb, управление доступностью' },
  { icon: BarChart3, titleEn: 'Financial Reports', titleRu: 'Финансовые отчёты', descEn: 'Auto P&L statements, revenue tracking, expense management', descRu: 'Автоматические P&L, отслеживание дохода, управление расходами' },
  { icon: FileText, titleEn: 'Owner Portal', titleRu: 'Портал владельца', descEn: 'Transparent reporting, documents, real-time occupancy', descRu: 'Прозрачная отчётность, документы, occupancy в реальном времени' },
  { icon: Users, titleEn: 'Team & Staff', titleRu: 'Команда', descEn: 'Roles, task assignment, performance tracking', descRu: 'Роли, назначение задач, отслеживание производительности' },
  { icon: MessageSquare, titleEn: 'Guest Communication', titleRu: 'Связь с гостями', descEn: 'Welcome messages, auto check-in reminders, review requests', descRu: 'Welcome-сообщения, напоминания о заезде, запросы отзывов' },
  { icon: Smartphone, titleEn: 'Mobile-First', titleRu: 'Мобильная версия', descEn: 'Full functionality on any device, PWA support', descRu: 'Полная функциональность на любом устройстве, PWA' },
  { icon: Shield, titleEn: 'Security & Compliance', titleRu: 'Безопасность', descEn: 'Role-based access, audit logs, data encryption', descRu: 'Доступ по ролям, журнал действий, шифрование данных' },
];

const ForManagementCompanies: React.FC = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  return (
    <AppLayout showHeader={false}>
      <Helmet>
        <title>{isRu ? 'myUNO для управляющих компаний | PMS SaaS' : 'myUNO for Management Companies | PMS SaaS'}</title>
        <meta name="description" content={isRu
          ? 'Платформа управления недвижимостью на Пхукете. CRM, отчёты владельцам, календарь, команда — всё в одном.'
          : 'Property management platform for Phuket. CRM, owner reports, calendar, team — all in one.'} />
      </Helmet>

      <div className="min-h-screen bg-background">
        <LandingChrome isRu={isRu} />
        {/* Hero */}
        <section className="relative overflow-hidden py-20 md:py-32 px-4">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
          <div className="relative max-w-5xl mx-auto text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <Badge variant="secondary" className="mb-6 text-sm px-4 py-1">
                {isRu ? '🏢 Для управляющих компаний Пхукета' : '🏢 For Phuket Property Managers'}
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                {isRu
                  ? <>Управляйте объектами.<br />Автоматизируйте отчёты.<br /><span className="text-primary">Масштабируйтесь.</span></>
                  : <>Manage Properties.<br />Automate Reports.<br /><span className="text-primary">Scale.</span></>}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                {isRu
                  ? 'myUNO — платформа, которую мы создали для своей управляющей компании. Теперь она доступна вам. Проверена на реальных объектах.'
                  : 'myUNO is the platform we built for our own management company. Now available for yours. Battle-tested on real properties.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" onClick={() => navigate('/auth?redirect=/mc/onboarding&trial=true')} className="gap-2">
                  <Zap className="w-5 h-5" />
                  {isRu ? 'Попробовать бесплатно' : 'Start Free Trial'}
                </Button>
                <Button size="lg" variant="outline" onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>
                  {isRu ? 'Посмотреть тарифы' : 'View Pricing'}
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Core capabilities */}
        <section className="py-12 border-y border-border/50">
          <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: 'PMS', labelEn: 'Bookings, calendar, channel sync', labelRu: 'Брони, календарь, синхронизация каналов' },
              { value: 'CRM', labelEn: 'Owners, guests, leads in one place', labelRu: 'Собственники, гости и лиды в одном месте' },
              { value: 'Finance', labelEn: 'P&L, owner statements, payouts', labelRu: 'P&L, отчёты владельцам, выплаты' },
              { value: 'Ops', labelEn: 'Tasks, cleaning, maintenance', labelRu: 'Задачи, уборка, обслуживание' },
            ].map((stat) => (
              <div key={stat.value}>
                <div className="text-2xl md:text-3xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{isRu ? stat.labelRu : stat.labelEn}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4">
              {isRu ? 'Всё что нужно УК в одной платформе' : 'Everything a PM Needs in One Platform'}
            </h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              {isRu
                ? 'Не собирайте из 10 инструментов. У нас всё встроено.'
                : "Don't stitch 10 tools together. We have it all built-in."}
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((f, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <f.icon className="w-8 h-8 text-primary mb-3" />
                      <h3 className="font-semibold mb-2">{isRu ? f.titleRu : f.titleEn}</h3>
                      <p className="text-sm text-muted-foreground">{isRu ? f.descRu : f.descEn}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              {isRu ? 'Начните за 15 минут' : 'Get Started in 15 Minutes'}
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { step: '1', titleEn: 'Register', titleRu: 'Регистрация', descEn: 'Create account and set up your company profile', descRu: 'Создайте аккаунт и заполните профиль компании', icon: Globe },
                { step: '2', titleEn: 'Add Properties', titleRu: 'Добавьте объекты', descEn: 'Import from CSV or add one by one', descRu: 'Импорт из CSV или добавление по одному', icon: Building2 },
                { step: '3', titleEn: 'Invite Team', titleRu: 'Пригласите команду', descEn: 'Assign roles and start managing', descRu: 'Назначьте роли и начните работать', icon: Users },
              ].map((s) => (
                <div key={s.step} className="text-center">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                    {s.step}
                  </div>
                  <h3 className="font-semibold mb-2">{isRu ? s.titleRu : s.titleEn}</h3>
                  <p className="text-sm text-muted-foreground">{isRu ? s.descRu : s.descEn}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4">
              {isRu ? 'Прозрачные тарифы' : 'Transparent Pricing'}
            </h2>
            <p className="text-center text-muted-foreground mb-12">
              {isRu ? '14 дней бесплатно. Без привязки карты.' : '14-day free trial. No credit card required.'}
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              {tiers.map((tier) => (
                <Card key={tier.id} className={`relative ${tier.popular ? 'border-primary shadow-lg ring-2 ring-primary/20' : ''}`}>
                  {tier.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                      {isRu ? 'Популярный' : 'Most Popular'}
                    </Badge>
                  )}
                  <CardContent className="p-6 pt-8">
                    <h3 className="text-xl font-bold mb-1">{isRu ? tier.nameRu : tier.nameEn}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {isRu ? `До ${tier.slots} объектов` : `Up to ${tier.slots} properties`}
                    </p>
                    <div className="flex items-baseline gap-1 mb-6">
                      <span className="text-4xl font-bold">${tier.priceUsd}</span>
                      <span className="text-muted-foreground">/{isRu ? 'мес' : 'mo'}</span>
                    </div>
                    <Button
                      className="w-full mb-6 gap-2"
                      variant={tier.popular ? 'default' : 'outline'}
                      onClick={() => navigate('/auth?redirect=/mc/onboarding&trial=true&tier=' + tier.id)}
                    >
                      {isRu ? 'Начать бесплатно' : 'Start Free Trial'}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                    <ul className="space-y-2">
                      {(isRu ? tier.featuresRu : tier.featuresEn).map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4 bg-primary/5">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              {isRu ? 'Готовы упростить управление?' : 'Ready to Simplify Management?'}
            </h2>
            <p className="text-muted-foreground mb-8">
              {isRu
                ? 'Мы сами используем myUNO каждый день. Присоединяйтесь к растущему сообществу УК Пхукета.'
                : 'We use myUNO every day ourselves. Join the growing community of Phuket property managers.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/auth?redirect=/mc/onboarding&trial=true')} className="gap-2">
                <Zap className="w-5 h-5" />
                {isRu ? 'Начать 14-дневный триал' : 'Start 14-Day Trial'}
              </Button>
              <Button size="lg" variant="outline" onClick={() => window.open('https://wa.me/66922407355?text=Hi%2C+I%27m+interested+in+myUNO+for+my+management+company', '_blank')}>
                <MessageSquare className="w-5 h-5 mr-2" />
                {isRu ? 'Связаться в WhatsApp' : 'Chat on WhatsApp'}
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-4 border-t border-border/50 text-center text-sm text-muted-foreground">
          © 2025–2026 myUNO · Phuket, Thailand · <a href="mailto:support@myuno.app" className="underline">support@myuno.app</a>
        </footer>
      </div>
    </AppLayout>
  );
};

export default ForManagementCompanies;
