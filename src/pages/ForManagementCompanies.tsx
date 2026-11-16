import React from 'react';
import { getWhatsAppUrl } from '@/lib/config/contacts';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { APP_ROUTES } from '@/lib/config/routes';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Helmet } from 'react-helmet-async';
import { AppLayout } from '@/components/layout/AppLayout';
import { LandingChrome, LandingContainer } from '@/components/landings';
import { MARKETING_ACTION_BUTTON } from '@/design-system/ecosystemLayout';
import {
  Building2, BarChart3, Users, Calendar, FileText,
  MessageSquare, Shield, Zap, ArrowRight,
  Globe, Smartphone, Clock,
  KanbanSquare, Wrench, ClipboardList, Sun, Receipt, Wallet,
  RefreshCw, Sparkles, CalendarRange, Mailbox, FileSignature,
  AlertTriangle, ShoppingCart, ScrollText,
  List, CheckSquare, Activity, Percent, Gauge
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
    leadRu: 'Объекты, бронирования и календарь в рабочем кабинете компании. Проверяйте доступность и статус подключённых каналов.',
    leadEn: 'Properties, bookings and calendars in the company workspace. Check availability and the status of connected channels.',
    items: [
      { icon: RefreshCw, titleRu: 'Календарь и внешние каналы', titleEn: 'Calendar and external channels', descRu: 'Проверяйте подключённые календари, ошибки и состояние синхронизации. Доступность подключения нужно подтвердить для конкретного канала.', descEn: 'Review connected calendars, errors and sync status. Connection availability must be confirmed for each channel.' },
      { icon: CalendarRange, titleRu: 'Внешние iCal-календари', titleEn: 'External iCal calendars', descRu: 'Настройте доступные ссылки импорта и экспорта; проверяйте время и результат последней синхронизации.', descEn: 'Configure available import and export links; check the time and outcome of the latest sync.' },
      { icon: Sparkles, titleRu: 'Тарифы и условия размещения', titleEn: 'Rates and stay terms', descRu: 'Просматривайте и настраивайте тарифы. Рекомендации и интеграции зависят от доступных настроек компании.', descEn: 'Review and configure rates. Recommendations and integrations depend on the company settings available.' },
      { icon: Calendar, titleRu: 'Единый календарь всего портфеля', titleEn: 'Portfolio-wide unified calendar', descRu: 'Timeline-вид по всем объектам сразу: заезды, выезды, уборки и задачи в одной картине.', descEn: 'Timeline view across all properties: check-ins, check-outs, cleanings and tasks in a single picture.' },
      { icon: List, titleRu: 'Все бронирования в одном списке', titleEn: 'All bookings in one list', descRu: 'Фильтры по статусам confirmed / pending / checked-in / completed, bulk-действия и детальная карточка брони.', descEn: 'Filters by confirmed / pending / checked-in / completed, bulk actions and a detailed booking sheet.' },
      { icon: Building2, titleRu: 'Подготовка объекта к публикации', titleEn: 'Prepare a property for publication', descRu: 'Подготовьте название, фотографии, описание и условия. Проверьте сведения перед публикацией.', descEn: 'Prepare the title, photographs, description and terms. Review the details before publication.' },
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
      { icon: Activity, titleRu: 'Лог активностей и timeline по контакту', titleEn: 'Activity log & contact timeline', descRu: 'Все звонки, письма, встречи и изменения сделки на единой ленте — ничего не теряется при передаче.', descEn: 'Every call, email, meeting and deal change on a single feed — nothing is lost on hand-off.' },
    ],
  },
  {
    id: 'finance',
    badge: 'Finance',
    titleRu: 'Finance — P&L, выплаты и сверка',
    titleEn: 'Finance — P&L, payouts & reconciliation',
    leadRu: 'Просмотр записанных операций, отчётов и расхождений для сверки по доступным объектам.',
    leadEn: 'Review recorded operations, reports and reconciliation differences for the properties you can access.',
    items: [
      { icon: BarChart3, titleRu: 'P&L по каждому объекту', titleEn: 'P&L per property', descRu: 'Доходы и расходы по объекту за период: разбивка по категориям, графики, сравнение месяц-к-месяцу.', descEn: 'Income and expenses per property per period: category breakdown, charts, month-over-month comparison.' },
      { icon: Wallet, titleRu: 'Выплаты собственникам с полным расчётом', titleEn: 'Owner payouts with full breakdown', descRu: 'Валовая выручка минус комиссия УК, расходы, WHT и VAT — готовый расчёт net payout под перевод.', descEn: 'Gross revenue minus MC commission, expenses, WHT and VAT — net payout calculated and ready to transfer.' },
      { icon: AlertTriangle, titleRu: 'Дебиторка (AR Aging) с ведёрной разбивкой', titleEn: 'AR Aging with bucket breakdown', descRu: 'Кто и сколько должен по срокам 0–30 / 31–60 / 61–90 / 90+ дней — должники видны сразу.', descEn: 'Who owes what across 0–30 / 31–60 / 61–90 / 90+ day buckets — debtors surface instantly.' },
      { icon: Shield, titleRu: 'Сверка заказов с леджером', titleEn: 'Order-to-ledger reconciliation', descRu: 'Автоматически сравнивает подтверждённые заказы с записями в ledger_entries и подсвечивает расхождения.', descEn: 'Automatically compares confirmed orders against ledger entries and flags any discrepancy.' },
      { icon: Receipt, titleRu: 'Налоговый центр и экспорт отчётов', titleEn: 'Tax center & report exports', descRu: 'Документы по WHT и VAT в одном месте, выгрузка отчётов в Excel для бухгалтера и налоговой.', descEn: 'WHT and VAT docs in one place, Excel exports for accountants and tax filings.' },
      { icon: Percent, titleRu: 'Комиссии и условия маркетплейса', titleEn: 'Marketplace fees and terms', descRu: 'Состав комиссий и доступные операции зависят от согласованных условий и настроек компании.', descEn: 'Fees and available operations depend on agreed terms and company settings.' },
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
      { icon: CheckSquare, titleRu: 'Операционные задачи по объектам', titleEn: 'Operational tasks per property', descRu: 'Уборки, заезды, выезды, инспекции и снятие показаний — с приоритетом и ответственным исполнителем.', descEn: 'Cleaning, check-ins, check-outs, inspections and meter readings — each with priority and an assignee.' },
      { icon: Sun, titleRu: 'Утренний брифинг — сводка дня менеджеру', titleEn: 'Morning briefing — the manager\'s day at a glance', descRu: 'Заезды и выезды дня, просроченные задачи, активности CRM и дни рождения — одной лентой по приоритету.', descEn: 'Today\'s check-ins/outs, overdue tasks, CRM activities and birthdays — one prioritized feed.' },
      { icon: Wrench, titleRu: 'Плановое техническое обслуживание', titleEn: 'Preventive maintenance schedules', descRu: 'Расписание ТО по объекту: частота, следующая дата, подрядчик, бюджет и приоритет.', descEn: 'Maintenance schedule per property: frequency, next due date, contractor, budget and priority.' },
      { icon: ShoppingCart, titleRu: 'Закупки с 3-сторонним matching', titleEn: 'Procurement with 3-way match', descRu: 'Заявка на закупку → приёмка товаров → сверка с инвойсом поставщика. Без переплат и потерянных позиций.', descEn: 'Purchase order → goods receipt → vendor invoice match. No overpayments, no missed line items.' },
      { icon: Clock, titleRu: 'Расписание смен команды', titleEn: 'Team shift scheduling', descRu: 'Кто из сотрудников на каком объекте и в какое время — график на всю команду в одном экране.', descEn: 'Who is on which property and when — the full team\'s schedule on a single screen.' },
      { icon: Gauge, titleRu: 'Portfolio Health — индекс готовности портфеля', titleEn: 'Portfolio Health score', descRu: '0–100% по 8 проверкам каждого объекта (документы, фото, цены, ТО) — слабые места видны сразу.', descEn: '0–100% across 8 checks per property (docs, photos, pricing, maintenance) — weak spots surface instantly.' },

    ],
  },
];



// Public setup paths, not a billing-plan catalogue. Active commercial terms
// remain in the governed company subscription and agreed rollout scope.
const rolloutOptions = [
  { id: 'setup', titleRu: 'Подключить компанию', titleEn: 'Set up your company', descriptionRu: 'Подготовьте профиль компании и сведения об объектах для подключения.', descriptionEn: 'Prepare your company profile and property details for setup.', path: '/auth?redirect=/mc/onboarding' },
  { id: 'workspace', titleRu: 'Продолжить работу', titleEn: 'Continue your work', descriptionRu: 'Откройте рабочий кабинет. Нужны вход и подтверждённый доступ к компании.', descriptionEn: 'Open the workspace. Sign-in and confirmed company access are required.', path: APP_ROUTES.MC },
  { id: 'scope', titleRu: 'Обсудить задачи', titleEn: 'Discuss your requirements', descriptionRu: 'Согласуйте состав инструментов, подключения, стоимость и порядок запуска с командой.', descriptionEn: 'Agree the tools, integrations, pricing and rollout steps with the team.', path: APP_ROUTES.CONTACT },
];

// Cross-module qualities — НЕ дублируют PMS/CRM/Finance/Ops deep-dive выше
const features = [
  { icon: FileText, titleEn: 'Owner Portal', titleRu: 'Портал владельца', descEn: 'Transparent reporting, documents, real-time occupancy', descRu: 'Прозрачная отчётность, документы, occupancy в реальном времени' },
  { icon: Users, titleEn: 'Team & Staff', titleRu: 'Команда и роли', descEn: 'Roles, task assignment, performance tracking', descRu: 'Роли, назначение задач, отслеживание производительности' },
  { icon: MessageSquare, titleEn: 'Guest Communication', titleRu: 'Связь с гостями', descEn: 'Welcome messages, auto check-in reminders, review requests', descRu: 'Welcome-сообщения, напоминания о заезде, запросы отзывов' },
  { icon: Smartphone, titleEn: 'Mobile-First & PWA', titleRu: 'Mobile-first и PWA', descEn: 'Full functionality on any device, installable PWA', descRu: 'Полная функциональность на любом устройстве, ставится как PWA' },
  { icon: Shield, titleEn: 'Security & Compliance', titleRu: 'Безопасность', descEn: 'Role-based access, audit logs, data encryption', descRu: 'Доступ по ролям, журнал действий, шифрование данных' },
  { icon: Globe, titleEn: 'Bilingual RU / EN', titleRu: 'Двуязычный RU / EN', descEn: 'Every screen, email and owner report in both languages', descRu: 'Все экраны, письма и отчёты владельцу — на двух языках' },
];


const ForManagementCompanies: React.FC = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  return (
    <AppLayout usePageContainer={false} showHeader={false}>
      <Helmet>
        <title>{isRu ? 'myUNO для управляющих компаний | PMS SaaS' : 'myUNO for Management Companies | PMS SaaS'}</title>
        <meta name="description" content={isRu
          ? 'Платформа управления недвижимостью на Пхукете. CRM, отчёты владельцам, календарь, команда — всё в одном.'
          : 'Property management platform for Phuket. CRM, owner reports, calendar, team — all in one.'} />
      </Helmet>

      <div className="min-h-screen bg-background">
        <LandingChrome isRu={isRu} variant="marketing" />
        {/* Hero */}
        <section className="relative overflow-hidden py-20 md:py-24">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
          <LandingContainer variant="marketing" className="relative text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <Badge variant="secondary" className="mb-6 text-sm px-4 py-1">
                {isRu ? '🏢 Для управляющих компаний Пхукета' : '🏢 For Phuket Property Managers'}
              </Badge>
              <h1 className="text-h1 md:text-display font-display mb-6">
                {isRu
                  ? <>Управляйте объектами.<br />Координируйте команду.<br /><span className="text-primary">Работайте в одном кабинете.</span></>
                  : <>Manage Properties.<br />Coordinate Your Team.<br /><span className="text-primary">Work in One Workspace.</span></>}
              </h1>
              <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                {isRu
                  ? 'Рабочее пространство для объектов, гостей, команды и отчётов. Доступные инструменты и подключения зависят от подтверждённых прав и настроек компании.'
                  : 'A workspace for properties, guests, teams and reports. Available tools and integrations depend on confirmed permissions and company settings.'}
              </p>
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 justify-center">
                <Button size="lg" onClick={() => navigate('/auth?redirect=/mc/onboarding')} className={MARKETING_ACTION_BUTTON}>
                  <Zap className="w-5 h-5" />
                  {isRu ? 'Подключить компанию' : 'Set up your company'}
                </Button>
                <Button size="lg" variant="outline" className={MARKETING_ACTION_BUTTON} onClick={() => navigate(APP_ROUTES.MC)}>
                  {isRu ? 'Войти в кабинет компании' : 'Open company workspace'}
                </Button>
                <Button size="lg" variant="outline" className={MARKETING_ACTION_BUTTON} onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>
                  {isRu ? 'Условия подключения' : 'Rollout terms'}
                </Button>
              </div>
            </motion.div>
          </LandingContainer>
        </section>

        {/* Core capabilities */}
        <section className="py-12 border-y border-border/50">
          <LandingContainer variant="marketing" className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: 'PMS', labelEn: 'Bookings, calendar, channel sync', labelRu: 'Брони, календарь, синхронизация каналов' },
              { value: 'CRM', labelEn: 'Owners, guests, leads in one place', labelRu: 'Собственники, гости и лиды в одном месте' },
              { value: 'Finance', labelEn: 'P&L, owner statements, payouts', labelRu: 'P&L, отчёты владельцам, выплаты' },
              { value: 'Ops', labelEn: 'Tasks, cleaning, maintenance', labelRu: 'Задачи, уборка, обслуживание' },
            ].map((stat) => (
              <div key={stat.value}>
                <div className="text-2xl md:text-h2 font-display text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{isRu ? stat.labelRu : stat.labelEn}</div>
              </div>
            ))}
          </LandingContainer>
        </section>

        {/* Modules deep-dive */}
        <section className="py-20 bg-muted/20">
          <LandingContainer variant="marketing">
            <h2 className="text-h2 font-display text-center mb-4">
              {isRu ? 'Что именно делает платформа' : 'What the platform actually does'}
            </h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              {isRu
                ? 'Ниже — основные области работы компании. Состав инструментов и подключений согласуется при запуске и зависит от ваших прав.'
                : 'Explore the main areas of company work. Tools and integrations are agreed during rollout and depend on your permissions.'}
            </p>

            {/* Sticky module nav */}
            <div className="sticky top-14 z-20 mb-10 bg-muted border-y border-border/50">
              <div className="flex gap-2 overflow-x-auto py-3 scrollbar-hide">
                {modules.map((m) => (
                  <a
                    key={m.id}
                    href={`#module-${m.id}`}
                    className="shrink-0 text-sm font-medium px-4 py-2 border border-border hover:border-primary hover:text-primary text-foreground/80 transition-colors"
                  >
                    {m.badge}
                  </a>
                ))}
              </div>
            </div>


            <div className="space-y-16">
              {modules.map((m, mIdx) => (
                <motion.div
                  key={m.id}
                  id={`module-${m.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.5 }}
                  className="scroll-mt-28"
                >
                  <div className="mb-8 flex items-start gap-4">
                    <div className="hidden md:flex items-center justify-center w-12 h-12 border border-primary/30 text-primary font-mono text-lg shrink-0">
                      {String(mIdx + 1).padStart(2, '0')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Badge variant="outline" className="mb-3 text-primary border-primary/30">
                        {m.badge}
                      </Badge>
                      <h3 className="text-h3 font-display mb-3 break-words hyphens-auto">
                        {isRu ? m.titleRu : m.titleEn}
                      </h3>
                      <p className="text-body-lg text-muted-foreground max-w-3xl">
                        {isRu ? m.leadRu : m.leadEn}
                      </p>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {m.items.map((item, idx) => (
                      <Card key={idx} className="h-full border-border hover:border-primary/40 transition-colors">
                        <CardContent className="p-5">
                          <item.icon className="w-7 h-7 text-primary mb-3" />
                          <h4 className="font-semibold mb-2 text-base leading-snug break-words hyphens-auto">
                            {isRu ? item.titleRu : item.titleEn}
                          </h4>
                          <p className="text-sm text-muted-foreground leading-relaxed break-words">
                            {isRu ? item.descRu : item.descEn}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>

          </LandingContainer>
        </section>

        {/* Features Grid */}
        <section className="py-20">
          <LandingContainer variant="marketing">
            <h2 className="text-h2 font-display text-center mb-4">
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
                      <h3 className="text-h3 font-display mb-2">{isRu ? f.titleRu : f.titleEn}</h3>
                      <p className="text-sm text-muted-foreground">{isRu ? f.descRu : f.descEn}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </LandingContainer>
        </section>

        {/* How it works */}
        <section className="py-20 bg-muted/30">
          <LandingContainer variant="marketing">
            <h2 className="text-h2 font-display text-center mb-12">
              {isRu ? 'Как начать работу' : 'How to get started'}
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
                  <h3 className="text-h3 font-display mb-2">{isRu ? s.titleRu : s.titleEn}</h3>
                  <p className="text-sm text-muted-foreground">{isRu ? s.descRu : s.descEn}</p>
                </div>
              ))}
            </div>
          </LandingContainer>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-20">
          <LandingContainer variant="marketing">
            <h2 className="text-h2 font-display text-center mb-4">
              {isRu ? 'Условия подключения' : 'Rollout terms'}
            </h2>
            <p className="text-center text-muted-foreground mb-12">
              {isRu ? 'Стоимость, состав инструментов, подключения и сроки согласуются для вашей компании. Подтверждённые условия подписки доступны в рабочем кабинете.' : 'Pricing, tools, integrations and timing are agreed for your company. Confirmed subscription terms are available in the workspace.'}
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              {rolloutOptions.map(option => (
                <Card key={option.id}>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-3">{isRu ? option.titleRu : option.titleEn}</h3>
                    <p className="text-sm text-muted-foreground mb-6">{isRu ? option.descriptionRu : option.descriptionEn}</p>
                    <Button className={`w-full ${MARKETING_ACTION_BUTTON}`} variant="outline" onClick={() => navigate(option.path)}>
                      {isRu ? 'Продолжить' : 'Continue'}<ArrowRight className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </LandingContainer>
        </section>

        {/* CTA */}
        <section className="py-20 bg-primary/5">
          <LandingContainer variant="marketing" className="text-center">
            <h2 className="text-h2 font-display mb-4">
              {isRu ? 'Готовы упростить управление?' : 'Ready to Simplify Management?'}
            </h2>
            <p className="text-muted-foreground mb-8">
              {isRu
                ? 'Мы сами используем myUNO каждый день. Присоединяйтесь к растущему сообществу УК Пхукета.'
                : 'We use myUNO every day ourselves. Join the growing community of Phuket property managers.'}
            </p>
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/auth?redirect=/mc/onboarding')} className={MARKETING_ACTION_BUTTON}>
                <Zap className="w-5 h-5" />
                {isRu ? 'Начать подключение' : 'Start company setup'}
              </Button>
              <Button size="lg" variant="outline" className={MARKETING_ACTION_BUTTON} onClick={() => window.open(getWhatsAppUrl("Hi, I'm interested in myUNO for my management company"), '_blank')}>
                <MessageSquare className="w-5 h-5 mr-2" />
                {isRu ? 'Связаться в WhatsApp' : 'Chat on WhatsApp'}
              </Button>
            </div>
          </LandingContainer>
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
