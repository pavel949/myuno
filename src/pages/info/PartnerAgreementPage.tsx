import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Building2, Shield, CreditCard, AlertTriangle, 
  Users, Star, Clock, Ban, Scale, FileText,
  CheckCircle, XCircle, TrendingUp, Percent
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PartnerAgreementPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const partnerObligations = [
    {
      icon: Shield,
      title: isRu ? 'Эксклюзивность лидов' : 'Lead Exclusivity',
      content: isRu 
        ? 'Все клиенты, пришедшие через myUNO, обслуживаются ТОЛЬКО через Платформу в течение 12 месяцев с момента первого контакта.'
        : 'All clients acquired through myUNO are served ONLY through the Platform for 12 months from first contact.',
      critical: true,
    },
    {
      icon: Ban,
      title: isRu ? 'Запрет обхода' : 'Bypass Prohibition',
      content: isRu 
        ? 'Запрещается: предлагать скидки за прямое бронирование, переводить клиентов на другие каналы, собирать контакты для обхода Платформы.'
        : 'Prohibited: offering discounts for direct booking, redirecting clients to other channels, collecting contacts to bypass the Platform.',
      critical: true,
    },
    {
      icon: Star,
      title: isRu ? 'Стандарты качества (SLA)' : 'Quality Standards (SLA)',
      content: isRu 
        ? 'Время ответа на запрос: < 2 часов. Confirmation rate: > 90%. Минимальный рейтинг: 4.0 для сохранения активного статуса.'
        : 'Response time: < 2 hours. Confirmation rate: > 90%. Minimum rating: 4.0 to maintain active status.',
      critical: false,
    },
    {
      icon: FileText,
      title: isRu ? 'Актуальность информации' : 'Information Accuracy',
      content: isRu 
        ? 'Партнёр обязан поддерживать актуальность цен, доступности, описаний и фотографий. Устаревшая информация = штраф или снижение в рейтинге.'
        : 'Partner must keep prices, availability, descriptions, and photos up to date. Outdated information = penalty or ranking reduction.',
      critical: false,
    },
  ];

  const commissionTable = [
    { vertical: isRu ? 'Яхты и катера' : 'Yachts & Boats', commission: '12%', type: 'Escrow', deposit: '50%' },
    { vertical: isRu ? 'Туры и экскурсии' : 'Tours & Excursions', commission: '10%', type: 'Escrow', deposit: '100%' },
    { vertical: isRu ? 'Аренда недвижимости (short)' : 'Property Rentals (short)', commission: '8%', type: 'Partial', deposit: '30%' },
    { vertical: isRu ? 'Аренда недвижимости (long)' : 'Property Rentals (long)', commission: '₿2,999', type: 'Lead', deposit: '₿499' },
    { vertical: isRu ? 'Рестораны' : 'Restaurants', commission: '5%', type: 'Partial', deposit: '₿500' },
    { vertical: isRu ? 'Красота и СПА' : 'Beauty & SPA', commission: '15%', type: 'Escrow', deposit: '20%' },
    { vertical: isRu ? 'Медицинские услуги' : 'Medical Services', commission: '10%', type: 'Partial', deposit: '₿1,000' },
    { vertical: isRu ? 'Транспорт' : 'Transport', commission: '10%', type: 'Escrow', deposit: '100%' },
    { vertical: isRu ? 'Визовые услуги' : 'Visa Services', commission: '20%', type: 'Lead', deposit: '₿199' },
    { vertical: isRu ? 'Маркетплейс' : 'Marketplace', commission: '15%', type: 'Escrow', deposit: '100%' },
  ];

  const penalties = [
    {
      violation: isRu ? 'Первое нарушение обхода' : 'First bypass violation',
      action: isRu ? 'Предупреждение + штраф 100% комиссии' : 'Warning + 100% commission penalty',
      icon: AlertTriangle,
      color: 'text-yellow-500',
    },
    {
      violation: isRu ? 'Второе нарушение' : 'Second violation',
      action: isRu ? 'Штраф 300% комиссии + снижение рейтинга' : '300% commission penalty + rating reduction',
      icon: XCircle,
      color: 'text-orange-500',
    },
    {
      violation: isRu ? 'Третье нарушение' : 'Third violation',
      action: isRu ? 'Расторжение договора + бан + взыскание' : 'Contract termination + ban + recovery',
      icon: Ban,
      color: 'text-destructive',
    },
    {
      violation: isRu ? 'Низкий рейтинг (< 3.5)' : 'Low rating (< 3.5)',
      action: isRu ? 'Снижение в выдаче / временная приостановка' : 'Ranking reduction / temporary suspension',
      icon: TrendingUp,
      color: 'text-yellow-500',
    },
    {
      violation: isRu ? 'Confirmation rate < 80%' : 'Confirmation rate < 80%',
      action: isRu ? 'Предупреждение, затем снижение в выдаче' : 'Warning, then ranking reduction',
      icon: Clock,
      color: 'text-yellow-500',
    },
    {
      violation: isRu ? 'Мошенничество' : 'Fraud',
      action: isRu ? 'Немедленный бан + судебное преследование' : 'Immediate ban + legal prosecution',
      icon: Scale,
      color: 'text-destructive',
    },
  ];

  const paymentTerms = [
    {
      title: isRu ? 'Выплаты' : 'Payouts',
      content: isRu 
        ? 'Выплаты производятся еженедельно (по пятницам) на указанный банковский счёт или криптокошелёк. Минимальная сумма выплаты: ₿1,000.'
        : 'Payouts are made weekly (Fridays) to the specified bank account or crypto wallet. Minimum payout amount: ₿1,000.',
    },
    {
      title: isRu ? 'Холд' : 'Hold Period',
      content: isRu 
        ? 'Средства удерживаются на escrow до завершения услуги + 72 часа (период претензий). Для новых партнёров — 7 дней.'
        : 'Funds are held in escrow until service completion + 72 hours (claim period). For new partners — 7 days.',
    },
    {
      title: isRu ? 'Споры' : 'Disputes',
      content: isRu 
        ? 'При открытии спора выплата замораживается до разрешения. myUNO выступает арбитром и принимает финальное решение.'
        : 'When a dispute is opened, payment is frozen until resolution. myUNO acts as arbitrator and makes the final decision.',
    },
  ];

  const verificationLevels = [
    {
      level: isRu ? 'Базовый' : 'Basic',
      requirements: isRu 
        ? ['Email и телефон', 'Описание услуг', 'Фотографии']
        : ['Email and phone', 'Service descriptions', 'Photos'],
      benefits: isRu 
        ? ['Размещение на Платформе', 'Базовый поиск']
        : ['Platform listing', 'Basic search'],
      color: 'bg-muted',
    },
    {
      level: isRu ? 'Верифицированный' : 'Verified',
      requirements: isRu 
        ? ['Документы компании', 'Лицензии (если требуются)', 'Страховка']
        : ['Company documents', 'Licenses (if required)', 'Insurance'],
      benefits: isRu 
        ? ['Значок "Проверено"', 'Приоритет в поиске', 'G-Trust Protection']
        : ['Verified badge', 'Search priority', 'G-Trust Protection'],
      color: 'bg-primary/10',
    },
    {
      level: isRu ? 'Премиум' : 'Premium',
      requirements: isRu 
        ? ['Рейтинг 4.5+', '50+ бронирований', 'Confirmation rate 95%+']
        : ['Rating 4.5+', '50+ bookings', 'Confirmation rate 95%+'],
      benefits: isRu 
        ? ['Топ выдачи', 'Сниженная комиссия (-2%)', 'Персональный менеджер']
        : ['Top ranking', 'Reduced commission (-2%)', 'Personal manager'],
      color: 'bg-green-500/10',
    },
  ];

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader 
          title={isRu ? 'Партнёрское соглашение' : 'Partner Agreement'} 
          showBack 
        />

        {/* Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold mb-2">
                  {isRu ? 'Соглашение для поставщиков услуг' : 'Agreement for Service Providers'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {isRu 
                    ? 'Это соглашение регулирует отношения между myUNO Limited и Партнёрами (поставщиками услуг). Регистрируясь как Партнёр, вы принимаете эти условия.'
                    : 'This agreement governs the relationship between myUNO Limited and Partners (service providers). By registering as a Partner, you accept these terms.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Partner Obligations */}
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          {isRu ? '1. Обязательства Партнёра' : '1. Partner Obligations'}
        </h2>
        <div className="space-y-4 mb-8">
          {partnerObligations.map((item, index) => (
            <Card key={index} className={item.critical ? 'border-destructive/30' : ''}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <item.icon className={`h-4 w-4 ${item.critical ? 'text-destructive' : 'text-primary'}`} />
                  {item.title}
                  {item.critical && (
                    <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded">
                      {isRu ? 'КРИТИЧНО' : 'CRITICAL'}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{item.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Commission Table */}
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Percent className="h-5 w-5 text-primary" />
          {isRu ? '2. Комиссии по вертикалям' : '2. Commission by Vertical'}
        </h2>
        <Card className="mb-8 overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-medium">{isRu ? 'Вертикаль' : 'Vertical'}</th>
                    <th className="text-center p-3 font-medium">{isRu ? 'Комиссия' : 'Commission'}</th>
                    <th className="text-center p-3 font-medium">{isRu ? 'Тип' : 'Type'}</th>
                    <th className="text-center p-3 font-medium">{isRu ? 'Депозит' : 'Deposit'}</th>
                  </tr>
                </thead>
                <tbody>
                  {commissionTable.map((row, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-3">{row.vertical}</td>
                      <td className="p-3 text-center font-semibold text-primary">{row.commission}</td>
                      <td className="p-3 text-center">
                        <span className={`text-xs px-2 py-1 rounded ${
                          row.type === 'Escrow' ? 'bg-green-500/10 text-green-600' :
                          row.type === 'Partial' ? 'bg-yellow-500/10 text-yellow-600' :
                          'bg-orange-500/10 text-orange-600'
                        }`}>
                          {row.type}
                        </span>
                      </td>
                      <td className="p-3 text-center text-muted-foreground">{row.deposit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Penalties */}
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          {isRu ? '3. Штрафные санкции' : '3. Penalties'}
        </h2>
        <Card className="mb-8 border-destructive/30">
          <CardContent className="pt-6">
            <div className="space-y-4">
              {penalties.map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <item.icon className={`h-5 w-5 mt-0.5 ${item.color}`} />
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{item.violation}</h4>
                    <p className="text-xs text-muted-foreground">{item.action}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Terms */}
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          {isRu ? '4. Условия выплат' : '4. Payment Terms'}
        </h2>
        <div className="space-y-4 mb-8">
          {paymentTerms.map((item, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{item.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Verification Levels */}
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-primary" />
          {isRu ? '5. Уровни верификации' : '5. Verification Levels'}
        </h2>
        <div className="grid gap-4 mb-8">
          {verificationLevels.map((level, index) => (
            <Card key={index} className={level.color}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{level.level}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-2">
                      {isRu ? 'Требования:' : 'Requirements:'}
                    </h4>
                    <ul className="space-y-1">
                      {level.requirements.map((req, idx) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <span className="text-muted-foreground">•</span>
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-2">
                      {isRu ? 'Преимущества:' : 'Benefits:'}
                    </h4>
                    <ul className="space-y-1">
                      {level.benefits.map((ben, idx) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <span className="text-primary">✓</span>
                          {ben}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Audit Rights */}
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Scale className="h-5 w-5 text-primary" />
          {isRu ? '6. Право на аудит' : '6. Audit Rights'}
        </h2>
        <Card className="mb-8">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-4">
              {isRu 
                ? 'myUNO оставляет за собой право:'
                : 'myUNO reserves the right to:'}
            </p>
            <ul className="space-y-2">
              {(isRu 
                ? [
                    'Проводить тайные проверки (mystery shopping)',
                    'Запрашивать отчёты о сделках с клиентами myUNO',
                    'Проверять соответствие цен и услуг описаниям',
                    'Верифицировать лицензии и страховки',
                    'Анализировать отзывы и жалобы',
                  ]
                : [
                    'Conduct mystery shopping',
                    'Request reports on transactions with myUNO clients',
                    'Verify price and service compliance with descriptions',
                    'Verify licenses and insurance',
                    'Analyze reviews and complaints',
                  ]
              ).map((item, idx) => (
                <li key={idx} className="text-sm flex items-start gap-2">
                  <span className="text-primary">•</span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                {isRu 
                  ? 'Отказ от предоставления информации или препятствование аудиту = основание для расторжения договора.'
                  : 'Refusal to provide information or obstruction of audit = grounds for contract termination.'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Termination */}
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Ban className="h-5 w-5 text-primary" />
          {isRu ? '7. Расторжение' : '7. Termination'}
        </h2>
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-sm mb-2">{isRu ? 'По инициативе Партнёра:' : 'By Partner:'}</h4>
                <p className="text-sm text-muted-foreground">
                  {isRu 
                    ? 'Уведомление за 30 дней. Все активные бронирования должны быть выполнены. Задолженность по комиссиям погашена.'
                    : '30 days notice. All active bookings must be completed. Commission debts must be settled.'}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-sm mb-2">{isRu ? 'По инициативе myUNO:' : 'By myUNO:'}</h4>
                <p className="text-sm text-muted-foreground">
                  {isRu 
                    ? 'Немедленно при грубом нарушении. С уведомлением за 14 дней — при систематических нарушениях или неактивности более 90 дней.'
                    : 'Immediately for serious violations. With 14 days notice — for systematic violations or inactivity over 90 days.'}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-sm mb-2">{isRu ? 'Последствия расторжения:' : 'Consequences:'}</h4>
                <ul className="space-y-1">
                  {(isRu 
                    ? ['Удаление всех листингов', 'Выплата остатка после завершения всех бронирований', 'Запрет повторной регистрации при нарушениях']
                    : ['Removal of all listings', 'Payout after all bookings are completed', 'Re-registration ban for violations']
                  ).map((item, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-muted-foreground">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="mb-6">
          <CardContent className="pt-6 text-center">
            <h3 className="font-semibold mb-2">{isRu ? 'Контакты для партнёров' : 'Partner Contacts'}</h3>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">{isRu ? 'Подключение:' : 'Onboarding:'}</span>{' '}
                <span className="font-medium">partners@myuno.app</span>
              </p>
              <p>
                <span className="text-muted-foreground">{isRu ? 'Поддержка:' : 'Support:'}</span>{' '}
                <span className="font-medium">partner-support@myuno.app</span>
              </p>
              <p>
                <span className="text-muted-foreground">{isRu ? 'Финансы:' : 'Finance:'}</span>{' '}
                <span className="font-medium">finance@myuno.app</span>
              </p>
            </div>
            <div className="mt-4 p-3 bg-muted rounded-lg text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">myUNO Pte. Ltd.</p>
              <p>{isRu ? 'Сингапур | Сервисное подразделение: Таиланд' : 'Singapore | Service Operations: Thailand'}</p>
              <p className="mt-1">www.myuno.app</p>
            </div>
          </CardContent>
        </Card>

        {/* Related Links */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          <Link to="/terms" className="p-3 bg-muted rounded-lg text-center hover:bg-muted/80 transition-colors">
            <FileText className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <span className="text-xs">{isRu ? 'Условия использования' : 'Terms of Use'}</span>
          </Link>
          <Link to="/ip-policy" className="p-3 bg-muted rounded-lg text-center hover:bg-muted/80 transition-colors">
            <Shield className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <span className="text-xs">{isRu ? 'IP Политика' : 'IP Policy'}</span>
          </Link>
        </div>

        {/* Last updated */}
        <div className="text-center text-xs text-muted-foreground py-4">
          {isRu ? 'Последнее обновление: Январь 2026' : 'Last updated: January 2026'}
        </div>
      </PageContainer>
    </AppLayout>
  );
}
