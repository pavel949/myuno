import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { SectionCard } from '@/components/uno/SectionCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { FileText, AlertTriangle, Shield, Ban } from 'lucide-react';

export default function TermsPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const sections = [
    {
      title: isRu ? '1. Общие положения' : '1. General Provisions',
      content: isRu 
        ? 'Настоящие Условия использования регулируют отношения между пользователями и UNO (далее — «Платформа»). Используя приложение, вы соглашаетесь с данными условиями. Если вы не согласны, пожалуйста, не используйте сервис.'
        : 'These Terms of Use govern the relationship between users and UNO (hereinafter — "Platform"). By using the app, you agree to these terms. If you do not agree, please do not use the service.',
    },
    {
      title: isRu ? '2. Регистрация и аккаунт' : '2. Registration and Account',
      content: isRu 
        ? 'Для использования сервиса требуется регистрация. Вы обязуетесь предоставить достоверную информацию и поддерживать её актуальность. Вы несёте ответственность за сохранность данных для входа в аккаунт.'
        : 'Registration is required to use the service. You agree to provide accurate information and keep it up to date. You are responsible for maintaining the security of your account credentials.',
    },
    {
      title: isRu ? '3. Услуги и бронирование' : '3. Services and Booking',
      content: isRu 
        ? 'Платформа предоставляет возможность бронирования услуг у партнёров. UNO выступает посредником и не несёт ответственности за качество услуг, оказываемых партнёрами. Все претензии по качеству услуг следует направлять партнёру или в службу поддержки.'
        : 'The Platform provides the ability to book services from partners. UNO acts as an intermediary and is not responsible for the quality of services provided by partners. All claims regarding service quality should be directed to the partner or support service.',
    },
    {
      title: isRu ? '4. Оплата и возврат средств' : '4. Payment and Refunds',
      content: isRu 
        ? 'Оплата услуг осуществляется через платформу или напрямую партнёру. Условия отмены и возврата средств определяются политикой каждого партнёра. UNO не гарантирует возврат средств, но содействует в разрешении споров.'
        : 'Payment for services is made through the platform or directly to the partner. Cancellation and refund terms are determined by each partner\'s policy. UNO does not guarantee refunds but assists in dispute resolution.',
    },
  ];

  const platformTransactionSection = {
    title: isRu ? '5. ОБЯЗАТЕЛЬСТВО ПРОВЕДЕНИЯ ТРАНЗАКЦИЙ ЧЕРЕЗ ПЛАТФОРМУ' : '5. PLATFORM TRANSACTION REQUIREMENT',
    isImportant: true,
    content: isRu 
      ? 'ВАЖНО: Все транзакции между пользователями и партнёрами должны осуществляться исключительно через платформу UNO.'
      : 'IMPORTANT: All transactions between users and partners must be conducted exclusively through the UNO platform.',
    prohibitedItems: isRu ? [
      'Предлагать или принимать оплату вне платформы (наличными, переводами на личные счета, криптовалютой и т.д.)',
      'Запрашивать или предоставлять контактные данные (телефон, email, мессенджеры) для обхода платформы',
      'Предлагать скидки за бронирование напрямую, минуя UNO',
      'Размещать в объявлениях или сообщениях ссылки на сторонние ресурсы для оформления заказов',
      'Переносить текущие, будущие или повторные бронирования за пределы платформы',
    ] : [
      'Offering or accepting payment outside the platform (cash, personal bank transfers, cryptocurrency, etc.)',
      'Requesting or providing contact information (phone, email, messengers) to bypass the platform',
      'Offering discounts for booking directly, bypassing UNO',
      'Posting links to external resources for placing orders in listings or messages',
      'Moving current, future, or repeat bookings outside the platform',
    ],
    consequences: isRu ? [
      'Немедленная блокировка аккаунта без возврата средств с UNO Кошелька',
      'Аннулирование накопленного кэшбека и бонусов',
      'Лишение гарантий защиты покупателя',
      'Возможное взыскание упущенной комиссии платформы',
      'Для партнёров: расторжение партнёрского соглашения и удаление из каталога',
    ] : [
      'Immediate account suspension without refund of UNO Wallet funds',
      'Cancellation of accumulated cashback and bonuses',
      'Loss of buyer protection guarantees',
      'Possible recovery of lost platform commission',
      'For partners: termination of partnership agreement and removal from catalog',
    ],
  };

  const whyImportantSection = {
    title: isRu ? '6. Почему это важно: Ваши преимущества' : '6. Why This Matters: Your Benefits',
    benefits: isRu ? [
      { icon: '🛡️', text: 'Защита покупателя — гарантия возврата средств при проблемах с услугой' },
      { icon: '💳', text: 'Безопасные платежи — ваши данные защищены' },
      { icon: '⚖️', text: 'Разрешение споров — бесплатная помощь в конфликтных ситуациях' },
      { icon: '💰', text: 'Кэшбек и бонусы — только для транзакций через платформу' },
      { icon: '⭐', text: 'Верифицированные отзывы — реальные отзывы от реальных клиентов' },
      { icon: '📋', text: 'История бронирований — все заказы в одном месте' },
    ] : [
      { icon: '🛡️', text: 'Buyer protection — guaranteed refund for service issues' },
      { icon: '💳', text: 'Secure payments — your data is protected' },
      { icon: '⚖️', text: 'Dispute resolution — free assistance in conflict situations' },
      { icon: '💰', text: 'Cashback and bonuses — only for platform transactions' },
      { icon: '⭐', text: 'Verified reviews — real reviews from real customers' },
      { icon: '📋', text: 'Booking history — all orders in one place' },
    ],
    warning: isRu 
      ? 'При оплате вне платформы вы теряете все эти гарантии и не можете рассчитывать на помощь UNO в случае проблем.'
      : 'When paying outside the platform, you lose all these guarantees and cannot count on UNO assistance in case of problems.',
  };

  const remainingSections = [
    {
      title: isRu ? '7. UNO Кошелёк и кэшбек' : '7. UNO Wallet and Cashback',
      content: isRu 
        ? 'Средства на UNO Кошельке могут использоваться для оплаты услуг. Кэшбек начисляется в соответствии с условиями акций и не подлежит обмену на наличные. UNO оставляет за собой право изменять условия программы кэшбека.'
        : 'Funds in UNO Wallet can be used to pay for services. Cashback is credited according to promotion terms and is not exchangeable for cash. UNO reserves the right to change cashback program terms.',
    },
    {
      title: isRu ? '8. Запрещённые действия' : '8. Prohibited Actions',
      content: isRu 
        ? 'Помимо обхода платформы (см. раздел 5), запрещается: создание фейковых аккаунтов, публикация ложных отзывов, злоупотребление реферальной программой, попытки взлома или вмешательства в работу платформы, обмен контактными данными для обхода комиссии, предложение или принятие платежей вне UNO, реклама услуг вне платформы в сообщениях, любые незаконные действия.'
        : 'In addition to platform circumvention (see section 5), prohibited: creating fake accounts, posting false reviews, abusing the referral program, attempting to hack or interfere with the platform, exchanging contact information to bypass commission, offering or accepting payments outside UNO, advertising services outside the platform in messages, any illegal activities.',
    },
    {
      title: isRu ? '9. Ограничение ответственности' : '9. Limitation of Liability',
      content: isRu 
        ? 'UNO не несёт ответственности за: действия или бездействие партнёров, технические сбои, упущенную выгоду или косвенные убытки, транзакции, совершённые вне платформы. Максимальная ответственность UNO ограничена суммой, уплаченной пользователем за конкретную услугу через платформу.'
        : 'UNO is not liable for: actions or inactions of partners, technical failures, lost profits or indirect damages, transactions made outside the platform. Maximum liability of UNO is limited to the amount paid by the user for the specific service through the platform.',
    },
    {
      title: isRu ? '10. Изменение условий' : '10. Changes to Terms',
      content: isRu 
        ? 'UNO оставляет за собой право изменять настоящие Условия. О существенных изменениях мы уведомим через приложение или email. Продолжение использования сервиса после изменений означает согласие с новыми условиями.'
        : 'UNO reserves the right to modify these Terms. We will notify you of significant changes through the app or email. Continued use of the service after changes means acceptance of the new terms.',
    },
  ];

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader 
          title={isRu ? 'Условия использования' : 'Terms of Use'} 
          showBack 
        />

        {/* Intro */}
        <SectionCard className="text-center">
          <FileText className="w-10 h-10 text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {isRu 
              ? 'Пожалуйста, внимательно ознакомьтесь с условиями использования сервиса UNO'
              : 'Please read the terms of use of the UNO service carefully'}
          </p>
        </SectionCard>

        {/* First 4 sections */}
        {sections.map((section, index) => (
          <SectionCard key={index}>
            <h2 className="font-semibold text-sm mb-2">{section.title}</h2>
            <p className="text-sm text-muted-foreground">{section.content}</p>
          </SectionCard>
        ))}

        {/* Platform Transaction Requirement - CRITICAL SECTION */}
        <SectionCard className="border-2 border-destructive/50 bg-destructive/5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <h2 className="font-bold text-sm text-destructive">{platformTransactionSection.title}</h2>
          </div>
          
          <p className="text-sm font-medium mb-4 p-2 bg-destructive/10 rounded-lg">
            {platformTransactionSection.content}
          </p>

          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Ban className="w-4 h-4 text-destructive" />
              <h3 className="font-semibold text-sm">
                {isRu ? 'Строго запрещается:' : 'Strictly prohibited:'}
              </h3>
            </div>
            <ul className="space-y-2">
              {platformTransactionSection.prohibitedItems.map((item, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-destructive mt-1">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-2 text-destructive">
              {isRu ? '⚠️ Последствия нарушения:' : '⚠️ Consequences of violation:'}
            </h3>
            <ul className="space-y-2">
              {platformTransactionSection.consequences.map((item, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-destructive mt-1">✕</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </SectionCard>

        {/* Why This Matters - Benefits Section */}
        <SectionCard className="border border-primary/30 bg-primary/5">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-sm">{whyImportantSection.title}</h2>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            {isRu 
              ? 'Транзакции через UNO обеспечивают вам:' 
              : 'Transactions through UNO provide you with:'}
          </p>

          <ul className="space-y-3 mb-4">
            {whyImportantSection.benefits.map((benefit, idx) => (
              <li key={idx} className="text-sm flex items-start gap-2">
                <span>{benefit.icon}</span>
                <span className="text-muted-foreground">{benefit.text}</span>
              </li>
            ))}
          </ul>

          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              ⚠️ {whyImportantSection.warning}
            </p>
          </div>
        </SectionCard>

        {/* Remaining sections */}
        {remainingSections.map((section, index) => (
          <SectionCard key={index}>
            <h2 className="font-semibold text-sm mb-2">{section.title}</h2>
            <p className="text-sm text-muted-foreground">{section.content}</p>
          </SectionCard>
        ))}

        {/* Contact */}
        <SectionCard className="text-center">
          <p className="text-sm text-muted-foreground mb-1">
            {isRu ? 'Вопросы по условиям:' : 'Questions about terms:'}
          </p>
          <p className="text-sm font-medium">legal@uno.app</p>
        </SectionCard>

        {/* Last updated */}
        <div className="text-center text-xs text-muted-foreground py-4">
          {isRu ? 'Последнее обновление: январь 2026' : 'Last updated: January 2026'}
        </div>
      </PageContainer>
    </AppLayout>
  );
}
