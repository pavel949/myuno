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
  Globe, Smartphone, Clock, DollarSign,
  KanbanSquare, Wrench, ClipboardList, Sun, Receipt, Wallet,
  RefreshCw, Sparkles, CalendarRange, Mailbox, FileSignature,
  AlertTriangle, ShoppingCart, ScrollText
} from 'lucide-react';

type ModuleFeature = { icon: React.ComponentType<{ className?: string }>; titleRu: string; titleEn: string; descRu: string; descEn: string };
type ModuleSpec = {
  id: string;
  badge: string;
  titleRu: string; titleEn: string;
  leadRu: string; leadEn: string;
  items: ModuleFeature[];
};

const modules: ModuleSpec[] = [
  {
    id: 'pms',
    badge: 'PMS',
    titleRu: 'PMS — управление объектами и бронированиями',
    titleEn: 'PMS — properties & bookings',
    leadRu: 'Один календарь, один тариф, один канал-менеджер. Объекты, доступность и цены везде синхронны.',
    leadEn: 'One calendar, one rate plan, one channel manager. Listings, availability and prices stay in sync everywhere.',
    items: [
      { icon: RefreshCw, titleRu: 'Канал-менеджер Airbnb, Booking, VRBO, Expedia', titleEn: 'Channel manager: Airbnb, Booking, VRBO, Expedia', descRu: 'Двусторонняя синхронизация листингов и календарей с 4 OTA, баннер конфликтов и health-дашборд каналов.', descEn: 'Two-way sync of listings and calendars with 4 OTAs, conflict banner and channel health dashboard.' },
      { icon: CalendarRange, titleRu: 'iCal-синхронизация любых внешних календарей', titleEn: 'iCal sync for any external calendar', descRu: 'Импорт чужих iCal-ссылок и экспорт своих — занятость подтягивается из всех источников автоматически.', descEn: 'Import external iCal links and export your own — availability flows in from every source automatically.' },
      { icon: Sparkles, titleRu: 'AI-ценообразование с рекомендациями по датам', titleEn: 'AI pricing with date-by-date suggestions', descRu: 'ИИ анализирует сезон и спрос, предлагает цену на каждую ночь — менеджер принимает или отклоняет одним кликом.', descEn: 'AI reads the season and demand, suggests a price per night — the manager accepts or dismisses in one click.' },
      { icon: Calendar, titleRu: 'Единый календарь всего портфеля', titleEn: 'Portfolio-wide unified calendar', descRu: 'Timeline-вид по всем объектам сразу: заезды, выезды, уборки и задачи в одной картине.', descEn: 'Timeline view across all properties: check-ins, check-outs, cleanings and tasks in a single picture.' },
      { icon: ClipboardList, titleRu: 'Все бронирования в одном списке', titleEn: 'All bookings in one list', descRu: 'Фильтры по статусам confirmed / pending / checked-in / completed, bulk-действия и детальная карточка брони.', descEn: 'Filters by confirmed / pending / checked-in / completed, bulk actions and a detailed booking sheet.' },
      { icon: Building2, titleRu: 'Онбординг объекта с импортом из Airbnb', titleEn: 'Onboarding wizard with Airbnb import', descRu: 'Мастер заводит новый объект пошагово и подтягивает название, фото, описание и цены прямо из листинга OTA.', descEn: 'Wizard onboards a new property step-by-step and pulls title, photos, description and prices from the OTA listing.' },
    ],
  },
  {
    id: 'crm',
    badge: 'CRM',
    titleRu: 'CRM — собственники, гости и сделки',
    titleEn: 'CRM — owners, guests & deals',
    leadRu: 'Каждый контакт, каждая сделка и каждое касание — в одной базе. Без таблиц в Excel и переписок в личках.',
    leadEn: 'Every contact, deal and touchpoint — in one database. No more spreadsheets and DMs.',
    items: [
      { icon: KanbanSquare, titleRu: 'Kanban-воронка сделок с настраиваемыми стадиями', titleEn: 'Deal kanban with custom stages', descRu: 'Доска: Новый → Контакт → Показ → Торг → Договор → Успех. Стадии настраиваются под каждую компанию.', descEn: 'Board: New → Contact → Viewing → Negotiation → Contract → Won. Stages are configurable per company.' },
      { icon: Users, titleRu: 'База контактов с тегами и дублями', titleEn: 'Contacts with tags & duplicate detection', descRu: 'Собственники, гости, лиды и подрядчики в одной базе; автоматический поиск дублей и лог активностей.', descEn: 'Owners, guests, leads and contractors in one base; automatic duplicate detection and activity log.' },
      { icon: ClipboardList, titleRu: 'CRM-задачи и встречи с напоминаниями', titleEn: 'CRM tasks & meetings with reminders', descRu: 'Звонки, показы и встречи с дедлайнами; просроченные задачи попадают в утренний брифинг с приоритетом.', descEn: 'Calls, viewings and meetings with deadlines; overdue tasks surface in the morning briefing with top priority.' },
      { icon: Mailbox, titleRu: 'Email-рассылки, шаблоны и автопоследовательности', titleEn: 'Email campaigns, templates & sequences', descRu: 'Письма собственникам и гостям по шаблонам, drip-последовательности для прогрева лидов.', descEn: 'Templated emails to owners and guests, drip sequences to warm up leads.' },
      { icon: FileSignature, titleRu: 'Портфель договоров управления', titleEn: 'Management contracts portfolio', descRu: 'Условия по каждому объекту: комиссия, распределение расходов, статус — с журналом изменений.', descEn: 'Terms per property: commission, expense split, status — with a full change log.' },
    ],
  },
  {
    id: 'finance',
    badge: 'Finance',
    titleRu: 'Finance — P&L, выплаты и сверка',
    titleEn: 'Finance — P&L, payouts & reconciliation',
    leadRu: 'Каждая копейка по каждому объекту. Прозрачные отчёты владельцам и автоматическая сверка с леджером.',
    leadEn: 'Every penny per property. Transparent owner statements and automatic ledger reconciliation.',
    items: [
      { icon: BarChart3, titleRu: 'P&L по каждому объекту', titleEn: 'P&L per property', descRu: 'Доходы и расходы по объекту за период: разбивка по категориям, графики, сравнение месяц-к-месяцу.', descEn: 'Income and expenses per property per period: category breakdown, charts, month-over-month comparison.' },
      { icon: Wallet, titleRu: 'Выплаты собственникам с полным расчётом', titleEn: 'Owner payouts with full breakdown', descRu: 'Валовая выручка минус комиссия УК, расходы, WHT и VAT — готовый расчёт net payout под перевод.', descEn: 'Gross revenue minus MC commission, expenses, WHT and VAT — net payout calculated and ready to transfer.' },
      { icon: AlertTriangle, titleRu: 'Дебиторка (AR Aging) с ведёрной разбивкой', titleEn: 'AR Aging with bucket breakdown', descRu: 'Кто и сколько должен по срокам 0–30 / 31–60 / 61–90 / 90+ дней — должники видны сразу.', descEn: 'Who owes what across 0–30 / 31–60 / 61–90 / 90+ day buckets — debtors surface instantly.' },
      { icon: Shield, titleRu: 'Сверка заказов с леджером', titleEn: 'Order-to-ledger reconciliation', descRu: 'Автоматически сравнивает подтверждённые заказы с записями в ledger_entries и подсвечивает расхождения.', descEn: 'Automatically compares confirmed orders against ledger entries and flags any discrepancy.' },
      { icon: Receipt, titleRu: 'Налоговый центр и экспорт отчётов', titleEn: 'Tax center & report exports', descRu: 'Документы по WHT и VAT в одном месте, выгрузка отчётов в Excel для бухгалтера и налоговой.', descEn: 'WHT and VAT docs in one place, Excel exports for accountants and tax filings.' },
    ],
  },
  {
    id: 'ops',
    badge: 'Ops',
    titleRu: 'Ops — операции, ТО и закупки',
    titleEn: 'Ops — operations, maintenance & procurement',
    leadRu: 'День менеджера начинается с брифинга, заканчивается без пропусков. Уборки, ТО и закупки — под контролем.',
    leadEn: 'The manager starts the day with a briefing and ends it without misses. Cleaning, maintenance and procurement under control.',
    items: [
      { icon: ClipboardList, titleRu: 'Операционные задачи по объектам', titleEn: 'Operational tasks per property', descRu: 'Уборки, заезды, выезды, инспекции и снятие показаний — с приоритетом и ответственным исполнителем.', descEn: 'Cleaning, check-ins, check-outs, inspections and meter readings — each with priority and an assignee.' },
      { icon: Sun, titleRu: 'Утренний брифинг — сводка дня менеджеру', titleEn: 'Morning briefing — the manager\'s day at a glance', descRu: 'Заезды и выезды дня, просроченные задачи, активности CRM и дни рождения — одной лентой по приоритету.', descEn: 'Today\'s check-ins/outs, overdue tasks, CRM activities and birthdays — one prioritized feed.' },
      { icon: Wrench, titleRu: 'Плановое техническое обслуживание', titleEn: 'Preventive maintenance schedules', descRu: 'Расписание ТО по объекту: частота, следующая дата, подрядчик, бюджет и приоритет.', descEn: 'Maintenance schedule per property: frequency, next due date, contractor, budget and priority.' },
      { icon: ShoppingCart, titleRu: 'Закупки с 3-сторонним matching', titleEn: 'Procurement with 3-way match', descRu: 'Заявка на закупку → приёмка товаров → сверка с инвойсом поставщика. Без переплат и потерянных позиций.', descEn: 'Purchase order → goods receipt → vendor invoice match. No overpayments, no missed line items.' },
      { icon: Clock, titleRu: 'Расписание смен команды', titleEn: 'Team shift scheduling', descRu: 'Кто из сотрудников на каком объекте и в какое время — график на всю команду в одном экране.', descEn: 'Who is on which property and when — the full team\'s schedule on a single screen.' },
    ],
  },
];



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

        {/* Modules deep-dive */}
        <section className="py-20 px-4 bg-muted/20">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              {isRu ? 'Что именно делает платформа' : 'What the platform actually does'}
            </h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              {isRu
                ? 'Четыре модуля, каждый собран на реальной работе нашей УК. Ниже — конкретные функции, не лозунги.'
                : 'Four modules, each built on the real work of our own MC. Below — concrete features, not slogans.'}
            </p>

            <div className="space-y-12">
              {modules.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="mb-6">
                    <Badge variant="outline" className="mb-3 text-primary border-primary/30">
                      {m.badge}
                    </Badge>
                    <h3 className="text-2xl md:text-3xl font-bold mb-2">
                      {isRu ? m.titleRu : m.titleEn}
                    </h3>
                    <p className="text-muted-foreground max-w-3xl">
                      {isRu ? m.leadRu : m.leadEn}
                    </p>
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {m.items.map((item, idx) => (
                      <Card key={idx} className="h-full hover:shadow-md transition-shadow">
                        <CardContent className="p-5">
                          <item.icon className="w-6 h-6 text-primary mb-3" />
                          <h4 className="font-semibold mb-2 text-base leading-snug">
                            {isRu ? item.titleRu : item.titleEn}
                          </h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {isRu ? item.descRu : item.descEn}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
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
