import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { SectionCard } from '@/components/uno/SectionCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { Shield, Eye, Lock, Database, Trash2, Mail } from 'lucide-react';

export default function PrivacyPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const sections = [
    {
      icon: Database,
      title: isRu ? 'Какие данные мы собираем' : 'What Data We Collect',
      content: isRu 
        ? 'Мы собираем только необходимые данные для работы сервиса: email, номер телефона, имя, историю бронирований и предпочтения. Данные банковских карт обрабатываются платёжными системами и не хранятся на наших серверах.'
        : 'We collect only the data necessary for the service: email, phone number, name, booking history and preferences. Bank card data is processed by payment systems and is not stored on our servers.',
    },
    {
      icon: Eye,
      title: isRu ? 'Как мы используем данные' : 'How We Use Data',
      content: isRu 
        ? 'Ваши данные используются для обработки бронирований, персонализации рекомендаций, отправки уведомлений о статусе заказов и улучшения качества сервиса. Мы не продаём ваши данные третьим лицам.'
        : 'Your data is used to process bookings, personalize recommendations, send order status notifications and improve service quality. We do not sell your data to third parties.',
    },
    {
      icon: Lock,
      title: isRu ? 'Защита данных' : 'Data Protection',
      content: isRu 
        ? 'Все данные передаются по защищённому протоколу HTTPS и хранятся в зашифрованном виде. Доступ к персональным данным имеют только авторизованные сотрудники в рамках выполнения своих обязанностей.'
        : 'All data is transmitted via secure HTTPS protocol and stored encrypted. Access to personal data is limited to authorized employees within the scope of their duties.',
    },
    {
      icon: Shield,
      title: isRu ? 'Передача данных партнёрам' : 'Data Sharing with Partners',
      content: isRu 
        ? 'При бронировании услуги мы передаём партнёру только данные, необходимые для оказания услуги: имя, контактный телефон и детали бронирования. Партнёры обязуются соблюдать конфиденциальность.'
        : 'When booking a service, we share with the partner only the data necessary to provide the service: name, contact phone and booking details. Partners are required to maintain confidentiality.',
    },
    {
      icon: Trash2,
      title: isRu ? 'Удаление данных' : 'Data Deletion',
      content: isRu 
        ? 'Вы можете запросить удаление всех ваших данных, связавшись с поддержкой. После удаления аккаунта данные будут безвозвратно удалены в течение 30 дней, за исключением данных, которые мы обязаны хранить по закону.'
        : 'You can request deletion of all your data by contacting support. After account deletion, data will be permanently deleted within 30 days, except for data we are required to keep by law.',
    },
    {
      icon: Mail,
      title: isRu ? 'Маркетинговые рассылки' : 'Marketing Communications',
      content: isRu 
        ? 'Мы отправляем рекламные сообщения только с вашего согласия. Вы можете отписаться от рассылки в любой момент в настройках профиля или по ссылке в письме.'
        : 'We send marketing messages only with your consent. You can unsubscribe at any time in your profile settings or via the link in the email.',
    },
  ];

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader 
          title={isRu ? 'Политика конфиденциальности' : 'Privacy Policy'} 
          showBack 
        />

        {/* Intro */}
        <SectionCard className="text-center">
          <Shield className="w-10 h-10 text-primary mx-auto mb-3" />
          <h1 className="text-lg font-display font-bold mb-2">
            {isRu ? 'Ваши данные в безопасности' : 'Your Data is Safe'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isRu 
              ? 'Мы серьёзно относимся к защите ваших персональных данных и прозрачно объясняем, как мы их используем.'
              : 'We take the protection of your personal data seriously and transparently explain how we use it.'}
          </p>
        </SectionCard>

        {/* Sections */}
        {sections.map((section, index) => {
          const Icon = section.icon;
          return (
            <SectionCard key={index}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-sm">{section.title}</h2>
              </div>
              <p className="text-sm text-muted-foreground">{section.content}</p>
            </SectionCard>
          );
        })}

        {/* Last updated */}
        <div className="text-center text-xs text-muted-foreground py-4">
          {isRu ? 'Последнее обновление: январь 2026' : 'Last updated: January 2026'}
        </div>
      </PageContainer>
    </AppLayout>
  );
}