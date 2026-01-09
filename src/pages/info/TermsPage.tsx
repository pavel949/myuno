import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { SectionCard } from '@/components/uno/SectionCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { FileText } from 'lucide-react';

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
    {
      title: isRu ? '5. UNO Кошелёк и кэшбек' : '5. UNO Wallet and Cashback',
      content: isRu 
        ? 'Средства на UNO Кошельке могут использоваться для оплаты услуг. Кэшбек начисляется в соответствии с условиями акций и не подлежит обмену на наличные. UNO оставляет за собой право изменять условия программы кэшбека.'
        : 'Funds in UNO Wallet can be used to pay for services. Cashback is credited according to promotion terms and is not exchangeable for cash. UNO reserves the right to change cashback program terms.',
    },
    {
      title: isRu ? '6. Запрещённые действия' : '6. Prohibited Actions',
      content: isRu 
        ? 'Запрещается: создание фейковых аккаунтов, публикация ложных отзывов, злоупотребление реферальной программой, попытки взлома или вмешательства в работу платформы, любые незаконные действия.'
        : 'Prohibited: creating fake accounts, posting false reviews, abusing the referral program, attempting to hack or interfere with the platform, any illegal activities.',
    },
    {
      title: isRu ? '7. Ограничение ответственности' : '7. Limitation of Liability',
      content: isRu 
        ? 'UNO не несёт ответственности за: действия или бездействие партнёров, технические сбои, упущенную выгоду или косвенные убытки. Максимальная ответственность UNO ограничена суммой, уплаченной пользователем за конкретную услугу.'
        : 'UNO is not liable for: actions or inactions of partners, technical failures, lost profits or indirect damages. Maximum liability of UNO is limited to the amount paid by the user for the specific service.',
    },
    {
      title: isRu ? '8. Изменение условий' : '8. Changes to Terms',
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

        {/* Sections */}
        {sections.map((section, index) => (
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