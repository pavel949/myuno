import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  FileText, AlertTriangle, Shield, Ban, Scale, 
  Building2, CreditCard, Lock, Globe, Users,
  Gavel, BookOpen, MessageSquare, RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TermsPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const definitions = [
    { 
      term: isRu ? '«Платформа»' : '"Platform"', 
      def: isRu ? 'Веб-сайт www.myuno.app и мобильное приложение myUNO, управляемые myUNO Pte. Ltd. (Сингапур).' : 'The website www.myuno.app and myUNO mobile application operated by myUNO Pte. Ltd. (Singapore).' 
    },
    { 
      term: isRu ? '«Пользователь»' : '"User"', 
      def: isRu ? 'Физическое лицо, зарегистрированное на Платформе для поиска и бронирования Услуг.' : 'An individual registered on the Platform to search for and book Services.' 
    },
    { 
      term: isRu ? '«Партнёр»' : '"Partner"', 
      def: isRu ? 'Юридическое или физическое лицо, предоставляющее Услуги через Платформу.' : 'A legal entity or individual providing Services through the Platform.' 
    },
    { 
      term: isRu ? '«Услуга»' : '"Service"', 
      def: isRu ? 'Любая услуга, товар или опыт, доступные для бронирования через Платформу.' : 'Any service, product, or experience available for booking through the Platform.' 
    },
    { 
      term: isRu ? '«Бронирование»' : '"Booking"', 
      def: isRu ? 'Подтверждённый заказ Услуги, оформленный через Платформу.' : 'A confirmed order for a Service placed through the Platform.' 
    },
    { 
      term: isRu ? '«Транзакция»' : '"Transaction"', 
      def: isRu ? 'Любой финансовый обмен между Пользователем и Партнёром.' : 'Any financial exchange between a User and a Partner.' 
    },
    { 
      term: isRu ? '«Контент Платформы»' : '"Platform Content"', 
      def: isRu ? 'Все данные, изображения, описания, отзывы и иная информация на Платформе.' : 'All data, images, descriptions, reviews, and other information on the Platform.' 
    },
  ];

  const serviceClassifications = [
    {
      type: isRu ? 'ПОЛНЫЙ ESCROW' : 'FULL ESCROW',
      color: 'bg-green-500',
      description: isRu ? 'Оплата полностью через myUNO' : 'Full payment through myUNO',
      examples: isRu 
        ? ['Аренда яхт и катеров', 'Туры и экскурсии', 'Аренда транспорта', 'Маркетплейс товаров', 'Доставка еды']
        : ['Boat charters', 'Tours & excursions', 'Vehicle rentals', 'Marketplace products', 'Food delivery'],
      protection: isRu ? 'Полная защита G-Trust' : 'Full G-Trust Protection',
    },
    {
      type: isRu ? 'ЧАСТИЧНЫЙ ESCROW' : 'PARTIAL ESCROW',
      color: 'bg-yellow-500',
      description: isRu ? 'Депозит через myUNO + остаток на месте' : 'Deposit via myUNO + balance on-site',
      examples: isRu 
        ? ['Краткосрочная аренда недвижимости', 'Рестораны (депозит)', 'Красота и СПА', 'Медицинские услуги']
        : ['Short-term property rentals', 'Restaurants (deposit)', 'Beauty & SPA', 'Medical services'],
      protection: isRu ? 'Защита депозита G-Trust' : 'G-Trust Deposit Protection',
    },
    {
      type: isRu ? 'ЛИДОГЕНЕРАЦИЯ' : 'LEAD GENERATION',
      color: 'bg-orange-500',
      description: isRu ? 'Платная заявка + оплата партнёру напрямую' : 'Paid request + direct payment to partner',
      examples: isRu 
        ? ['Долгосрочная аренда (1+ год)', 'Визовые услуги', 'Юридические услуги', 'Образование']
        : ['Long-term rentals (1+ year)', 'Visa services', 'Legal services', 'Education'],
      protection: isRu ? 'Защита заявки' : 'Lead Protection',
    },
  ];

  const platformTransactionSection = {
    title: isRu ? '6. ОБЯЗАТЕЛЬСТВО ПРОВЕДЕНИЯ ТРАНЗАКЦИЙ ЧЕРЕЗ ПЛАТФОРМУ' : '6. PLATFORM TRANSACTION REQUIREMENT',
    content: isRu 
      ? 'ВСЕ транзакции между Пользователями и Партнёрами должны осуществляться исключительно через Платформу myUNO в соответствии с классификацией Услуг (см. раздел 5).'
      : 'ALL transactions between Users and Partners must be conducted exclusively through the myUNO Platform in accordance with the Service classification (see section 5).',
    prohibitedItems: isRu ? [
      'Предлагать или принимать оплату вне Платформы (наличными, переводами на личные счета, криптовалютой)',
      'Запрашивать или предоставлять контактные данные для обхода Платформы',
      'Предлагать скидки за бронирование напрямую, минуя myUNO',
      'Размещать ссылки на сторонние ресурсы для оформления заказов',
      'Переносить бронирования за пределы Платформы',
      'Использовать информацию Платформы для прямых продаж',
    ] : [
      'Offering or accepting payment outside the Platform (cash, personal transfers, cryptocurrency)',
      'Requesting or providing contact information to bypass the Platform',
      'Offering discounts for direct booking, bypassing myUNO',
      'Posting links to external resources for placing orders',
      'Moving bookings outside the Platform',
      'Using Platform information for direct sales',
    ],
    consequences: isRu ? [
      'Немедленная блокировка аккаунта без возврата средств',
      'Аннулирование кэшбека, бонусов и статуса лояльности',
      'Лишение гарантий защиты G-Trust',
      'Взыскание упущенной комиссии (до 300% от суммы)',
      'Для Партнёров: расторжение договора и удаление из каталога',
      'Передача информации о нарушителях правоохранительным органам (при необходимости)',
    ] : [
      'Immediate account suspension without refund',
      'Cancellation of cashback, bonuses, and loyalty status',
      'Loss of G-Trust protection guarantees',
      'Recovery of lost commission (up to 300% of amount)',
      'For Partners: contract termination and catalog removal',
      'Reporting violators to authorities (if necessary)',
    ],
  };

  const liabilityLimits = [
    { 
      title: isRu ? 'Роль посредника' : 'Intermediary Role',
      content: isRu 
        ? 'myUNO выступает исключительно как маркетплейс, соединяющий Пользователей и Партнёров. myUNO не является поставщиком Услуг и не несёт ответственности за их качество, безопасность или соответствие описанию.'
        : 'myUNO acts solely as a marketplace connecting Users and Partners. myUNO is not a provider of Services and is not responsible for their quality, safety, or compliance with descriptions.'
    },
    { 
      title: isRu ? 'Максимальная ответственность' : 'Maximum Liability',
      content: isRu 
        ? 'Совокупная ответственность myUNO перед Пользователем по любым претензиям ограничена суммой, уплаченной через Платформу за последние 12 месяцев, но не более 50,000 THB.'
        : 'The total liability of myUNO to a User for any claims is limited to the amount paid through the Platform in the last 12 months, but not exceeding 50,000 THB.'
    },
    { 
      title: isRu ? 'Исключение ответственности' : 'Exclusions',
      content: isRu 
        ? 'myUNO не несёт ответственности за: косвенные убытки, упущенную выгоду, потерю данных, действия третьих лиц, форс-мажорные обстоятельства, транзакции вне Платформы.'
        : 'myUNO is not liable for: indirect damages, lost profits, data loss, third-party actions, force majeure, or transactions outside the Platform.'
    },
  ];

  const ipRights = [
    {
      title: isRu ? 'Собственность myUNO' : 'myUNO Ownership',
      content: isRu 
        ? 'Весь Контент Платформы, включая описания, фотографии, отзывы, данные о ценах, алгоритмы и аналитику, является исключительной собственностью myUNO Limited.'
        : 'All Platform Content, including descriptions, photos, reviews, pricing data, algorithms, and analytics, is the exclusive property of myUNO Limited.',
    },
    {
      title: isRu ? 'Лицензия пользователя' : 'User License',
      content: isRu 
        ? 'Загружая контент на Платформу, вы предоставляете myUNO бессрочную, безотзывную, всемирную лицензию на использование, копирование, модификацию и распространение этого контента.'
        : 'By uploading content to the Platform, you grant myUNO a perpetual, irrevocable, worldwide license to use, copy, modify, and distribute that content.',
    },
    {
      title: isRu ? 'Запреты' : 'Prohibitions',
      content: isRu 
        ? 'Запрещается: парсинг и скрапинг данных, копирование каталога услуг, создание конкурирующих баз данных, использование API для массового сбора информации. Нарушение влечёт штраф от $10,000 USD.'
        : 'Prohibited: data parsing/scraping, copying the service catalog, creating competing databases, using APIs for mass data collection. Violation incurs a penalty from $10,000 USD.',
    },
  ];

  const mainSections = [
    {
      id: 'general',
      icon: FileText,
      title: isRu ? '1. Общие положения' : '1. General Provisions',
      content: isRu 
        ? 'Настоящие Условия использования («Условия») представляют собой юридически обязывающее соглашение между вами и myUNO Limited (регистрация: Thailand/UAE). Используя Платформу, вы подтверждаете, что прочитали, поняли и согласны соблюдать эти Условия. Если вы не согласны — не используйте Платформу.'
        : 'These Terms of Use ("Terms") constitute a legally binding agreement between you and myUNO Limited (registration: Thailand/UAE). By using the Platform, you confirm that you have read, understood, and agree to comply with these Terms. If you disagree — do not use the Platform.',
    },
    {
      id: 'updates',
      icon: RefreshCw,
      title: isRu ? '2. Изменение Условий' : '2. Changes to Terms',
      content: isRu 
        ? 'myUNO оставляет за собой право изменять эти Условия. О существенных изменениях мы уведомим за 30 дней через email или push-уведомление. Продолжение использования Платформы после изменений означает согласие с новой редакцией.'
        : 'myUNO reserves the right to modify these Terms. We will notify you of significant changes 30 days in advance via email or push notification. Continued use of the Platform after changes means acceptance of the new version.',
    },
    {
      id: 'account',
      icon: Users,
      title: isRu ? '3. Регистрация и аккаунт' : '3. Registration and Account',
      content: isRu 
        ? 'Для использования Платформы требуется регистрация. Вы обязуетесь: предоставить достоверную информацию; использовать только один аккаунт; обеспечить безопасность учётных данных; немедленно сообщать о несанкционированном доступе. myUNO может запросить верификацию личности (KYC) для определённых операций.'
        : 'Registration is required to use the Platform. You agree to: provide accurate information; use only one account; ensure security of credentials; immediately report unauthorized access. myUNO may request identity verification (KYC) for certain operations.',
    },
    {
      id: 'role',
      icon: Building2,
      title: isRu ? '4. Роль myUNO' : '4. Role of myUNO',
      content: isRu 
        ? 'myUNO является технологической платформой (маркетплейсом), которая соединяет Пользователей с Партнёрами. myUNO НЕ ЯВЛЯЕТСЯ поставщиком услуг, работодателем Партнёров или стороной договора между Пользователем и Партнёром. myUNO не контролирует и не гарантирует: качество Услуг, точность информации Партнёров, выполнение обязательств Партнёрами.'
        : 'myUNO is a technology platform (marketplace) that connects Users with Partners. myUNO IS NOT a service provider, employer of Partners, or a party to the contract between User and Partner. myUNO does not control or guarantee: quality of Services, accuracy of Partner information, or Partner performance.',
    },
  ];

  const paymentTerms = [
    {
      title: isRu ? 'Способы оплаты' : 'Payment Methods',
      content: isRu 
        ? 'Платформа поддерживает: банковские карты (Visa, Mastercard, UnionPay), Apple Pay, Google Pay, myUNO Кошелёк, криптовалюты (через партнёров). Все платежи обрабатываются сертифицированными платёжными провайдерами.'
        : 'The Platform supports: bank cards (Visa, Mastercard, UnionPay), Apple Pay, Google Pay, myUNO Wallet, cryptocurrencies (via partners). All payments are processed by certified payment providers.',
    },
    {
      title: isRu ? 'Escrow-защита' : 'Escrow Protection',
      content: isRu 
        ? 'Для услуг категории «Полный Escrow» средства удерживаются на escrow-счёте до подтверждения выполнения Услуги. Партнёр получает оплату только после завершения Услуги и истечения периода претензий (24-72 часа).'
        : 'For "Full Escrow" services, funds are held in escrow until Service completion is confirmed. Partners receive payment only after Service completion and the claims period expires (24-72 hours).',
    },
    {
      title: isRu ? 'Комиссии' : 'Fees',
      content: isRu 
        ? 'myUNO взимает сервисную комиссию, которая включена в стоимость Услуги или добавляется отдельно. Размер комиссии отображается до подтверждения бронирования. Партнёры также уплачивают комиссию согласно Партнёрскому соглашению.'
        : 'myUNO charges a service fee, which is included in the Service price or added separately. The fee amount is displayed before booking confirmation. Partners also pay fees according to the Partner Agreement.',
    },
  ];

  const disputeProcess = [
    { step: '1', title: isRu ? 'Связь с Партнёром' : 'Contact Partner', time: '24h', description: isRu ? 'Попробуйте решить вопрос напрямую' : 'Try to resolve directly' },
    { step: '2', title: isRu ? 'Обращение в поддержку' : 'Contact Support', time: '48h', description: isRu ? 'Откройте спор в приложении' : 'Open a dispute in the app' },
    { step: '3', title: isRu ? 'Медиация myUNO' : 'myUNO Mediation', time: '7d', description: isRu ? 'Мы рассмотрим обе стороны' : 'We review both sides' },
    { step: '4', title: isRu ? 'Арбитраж' : 'Arbitration', time: '30d', description: isRu ? 'THAC/HKIAC — решение финальное' : 'THAC/HKIAC — decision is final' },
  ];

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader 
          title={isRu ? 'Условия использования' : 'Terms of Use'} 
          showBack 
        />

        {/* Header Card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Scale className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold mb-2">
                  {isRu ? 'Юридически обязывающее соглашение' : 'Legally Binding Agreement'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {isRu 
                    ? 'Эти Условия регулируют использование платформы myUNO. Пожалуйста, внимательно ознакомьтесь с ними перед использованием сервиса.'
                    : 'These Terms govern the use of the myUNO platform. Please read them carefully before using the service.'}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {isRu ? 'Последнее обновление: Январь 2026 | Версия 2.0' : 'Last updated: January 2026 | Version 2.0'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          <Link to="/privacy" className="p-3 bg-muted rounded-lg text-center hover:bg-muted/80 transition-colors">
            <Shield className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <span className="text-xs">{isRu ? 'Конфиденциальность' : 'Privacy Policy'}</span>
          </Link>
          <Link to="/refund-policy" className="p-3 bg-muted rounded-lg text-center hover:bg-muted/80 transition-colors">
            <RefreshCw className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <span className="text-xs">{isRu ? 'Возвраты' : 'Refund Policy'}</span>
          </Link>
          <Link to="/ip-policy" className="p-3 bg-muted rounded-lg text-center hover:bg-muted/80 transition-colors">
            <Lock className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <span className="text-xs">{isRu ? 'Интеллектуальная собственность' : 'IP Policy'}</span>
          </Link>
          <Link to="/dispute-resolution" className="p-3 bg-muted rounded-lg text-center hover:bg-muted/80 transition-colors">
            <Gavel className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <span className="text-xs">{isRu ? 'Споры' : 'Disputes'}</span>
          </Link>
        </div>

        {/* Definitions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              {isRu ? 'Определения' : 'Definitions'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {definitions.map((item, index) => (
                <div key={index} className="flex gap-2 text-sm">
                  <span className="font-medium min-w-[120px]">{item.term}</span>
                  <span className="text-muted-foreground">— {item.def}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main Sections 1-4 */}
        <Accordion type="multiple" className="mb-6">
          {mainSections.map((section) => (
            <AccordionItem key={section.id} value={section.id}>
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <section.icon className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm">{section.title}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">{section.content}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Section 5: Service Classification */}
        <Card className="mb-6 border-primary/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              {isRu ? '5. Классификация Услуг по типу оплаты' : '5. Service Classification by Payment Type'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {isRu 
                ? 'Услуги на Платформе классифицируются по способу проведения транзакций. Ваши права защиты зависят от типа услуги:'
                : 'Services on the Platform are classified by transaction method. Your protection rights depend on the service type:'}
            </p>
            {serviceClassifications.map((item, index) => (
              <div key={index} className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-3 h-3 rounded-full ${item.color}`} />
                  <span className="font-semibold text-sm">{item.type}</span>
                  <span className="text-xs text-muted-foreground">— {item.description}</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {item.examples.map((ex, i) => (
                    <span key={i} className="text-xs bg-background px-2 py-1 rounded">{ex}</span>
                  ))}
                </div>
                <p className="text-xs text-primary font-medium">✓ {item.protection}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Section 6: CRITICAL - Platform Transaction Requirement */}
        <Card className="mb-6 border-2 border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {platformTransactionSection.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-destructive/10 rounded-lg">
              <p className="text-sm font-medium">{platformTransactionSection.content}</p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Ban className="w-4 h-4 text-destructive" />
                <h3 className="font-semibold text-sm">{isRu ? 'СТРОГО ЗАПРЕЩАЕТСЯ:' : 'STRICTLY PROHIBITED:'}</h3>
              </div>
              <ul className="space-y-2">
                {platformTransactionSection.prohibitedItems.map((item, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-destructive mt-0.5">✕</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-sm mb-3 text-destructive">
                ⚠️ {isRu ? 'ПОСЛЕДСТВИЯ НАРУШЕНИЯ:' : 'CONSEQUENCES OF VIOLATION:'}
              </h3>
              <ul className="space-y-2">
                {platformTransactionSection.consequences.map((item, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-destructive mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Section 7: Why This Matters */}
        <Card className="mb-6 border border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              {isRu ? '7. Ваши преимущества при транзакциях через myUNO' : '7. Your Benefits When Transacting Through myUNO'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { icon: '🛡️', text: isRu ? 'Защита G-Trust' : 'G-Trust Protection' },
                { icon: '💳', text: isRu ? 'Безопасные платежи' : 'Secure Payments' },
                { icon: '⚖️', text: isRu ? 'Разрешение споров' : 'Dispute Resolution' },
                { icon: '💰', text: isRu ? 'Кэшбек и бонусы' : 'Cashback & Bonuses' },
                { icon: '⭐', text: isRu ? 'Верифицированные отзывы' : 'Verified Reviews' },
                { icon: '📋', text: isRu ? 'История бронирований' : 'Booking History' },
              ].map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <span>{benefit.icon}</span>
                  <span>{benefit.text}</span>
                </div>
              ))}
            </div>
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                ⚠️ {isRu 
                  ? 'При оплате вне Платформы вы теряете ВСЕ эти гарантии и не можете рассчитывать на помощь myUNO.'
                  : 'When paying outside the Platform, you lose ALL these guarantees and cannot expect myUNO assistance.'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Section 8: Payments */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              {isRu ? '8. Платежи и Escrow' : '8. Payments and Escrow'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {paymentTerms.map((term, index) => (
              <div key={index}>
                <h4 className="font-medium text-sm mb-1">{term.title}</h4>
                <p className="text-sm text-muted-foreground">{term.content}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Section 9: Liability */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Scale className="h-4 w-4" />
              {isRu ? '9. Ограничение ответственности' : '9. Limitation of Liability'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {liabilityLimits.map((item, index) => (
              <div key={index}>
                <h4 className="font-medium text-sm mb-1">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.content}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Section 10: IP Rights */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="h-4 w-4" />
              {isRu ? '10. Интеллектуальная собственность' : '10. Intellectual Property'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {ipRights.map((item, index) => (
              <div key={index}>
                <h4 className="font-medium text-sm mb-1">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.content}</p>
              </div>
            ))}
            <Link to="/ip-policy" className="text-sm text-primary hover:underline block">
              {isRu ? '→ Полная политика интеллектуальной собственности' : '→ Full Intellectual Property Policy'}
            </Link>
          </CardContent>
        </Card>

        {/* Section 11: Dispute Resolution */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Gavel className="h-4 w-4" />
              {isRu ? '11. Разрешение споров' : '11. Dispute Resolution'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {disputeProcess.map((step, index) => (
                <div key={index} className="min-w-[140px] p-3 bg-muted rounded-lg text-center">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-2 text-sm font-bold">
                    {step.step}
                  </div>
                  <h4 className="font-medium text-xs mb-1">{step.title}</h4>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                  <span className="text-xs text-primary mt-1 block">{step.time}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>{isRu ? 'Арбитраж:' : 'Arbitration:'}</strong> {isRu 
                  ? 'Все споры, не разрешённые через медиацию, подлежат обязательному арбитражу в Thailand Arbitration Center (THAC) или Hong Kong International Arbitration Centre (HKIAC). Решение арбитража является окончательным.'
                  : 'All disputes not resolved through mediation are subject to mandatory arbitration at Thailand Arbitration Center (THAC) or Hong Kong International Arbitration Centre (HKIAC). The arbitration decision is final.'}
              </p>
            </div>
            <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                <strong>{isRu ? 'ОТКАЗ ОТ КОЛЛЕКТИВНЫХ ИСКОВ:' : 'CLASS ACTION WAIVER:'}</strong> {isRu 
                  ? 'Вы соглашаетесь разрешать споры только индивидуально и отказываетесь от участия в коллективных исках против myUNO.'
                  : 'You agree to resolve disputes only individually and waive participation in class actions against myUNO.'}
              </p>
            </div>
            <Link to="/dispute-resolution" className="text-sm text-primary hover:underline block mt-3">
              {isRu ? '→ Подробная процедура разрешения споров' : '→ Detailed Dispute Resolution Process'}
            </Link>
          </CardContent>
        </Card>

        {/* Section 12: Governing Law */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4" />
              {isRu ? '12. Применимое право' : '12. Governing Law'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {isRu 
                ? 'Эти Условия регулируются законодательством Королевства Таиланд. Для пользователей из ОАЭ дополнительно применяется законодательство Дубая (DIFC). Язык договора — английский; переводы предоставляются для удобства.'
                : 'These Terms are governed by the laws of the Kingdom of Thailand. For users from the UAE, Dubai (DIFC) law additionally applies. The language of the agreement is English; translations are provided for convenience.'}
            </p>
          </CardContent>
        </Card>

        {/* Section 13: Account Termination */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Ban className="h-4 w-4" />
              {isRu ? '13. Прекращение доступа' : '13. Account Termination'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {isRu 
                ? 'myUNO может заблокировать или удалить ваш аккаунт без предупреждения в случае:'
                : 'myUNO may suspend or delete your account without notice in case of:'}
            </p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {(isRu 
                ? ['Нарушения Условий использования', 'Попытки обхода Платформы', 'Мошенничества или злоупотреблений', 'Создания нескольких аккаунтов', 'Угроз безопасности других пользователей']
                : ['Violation of Terms of Use', 'Attempting to bypass the Platform', 'Fraud or abuse', 'Creating multiple accounts', 'Threats to other users\' safety']
              ).map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-destructive">•</span>{item}
                </li>
              ))}
            </ul>
            <p className="text-sm text-muted-foreground">
              {isRu 
                ? 'При блокировке: средства на myUNO Кошельке замораживаются, кэшбек аннулируется, активные бронирования могут быть отменены. Вы можете подать апелляцию через support@myuno.app.'
                : 'Upon suspension: myUNO Wallet funds are frozen, cashback is cancelled, active bookings may be cancelled. You can appeal via support@myuno.app.'}
            </p>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="font-semibold mb-2">{isRu ? 'Контакты' : 'Contact'}</h3>
              <p className="text-sm text-muted-foreground mb-2">
                {isRu ? 'Юридические вопросы:' : 'Legal inquiries:'}
              </p>
              <p className="text-sm font-medium">legal@myuno.app</p>
              <div className="mt-4 p-3 bg-muted rounded-lg text-xs text-muted-foreground">
                <p className="font-medium text-foreground mb-1">myUNO Pte. Ltd.</p>
                <p>{isRu ? 'Регистрация: Сингапур' : 'Incorporated in Singapore'}</p>
                <p>{isRu ? 'Сервисное подразделение: Таиланд' : 'Service Operations: Thailand'}</p>
                <p className="mt-1">www.myuno.app</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Last updated */}
        <div className="text-center text-xs text-muted-foreground py-4">
          {isRu ? 'Последнее обновление: Январь 2026 | Версия 2.0' : 'Last updated: January 2026 | Version 2.0'}
        </div>
      </PageContainer>
    </AppLayout>
  );
}
