import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Shield, Eye, Lock, Database, Trash2, Mail, 
  Globe, Users, FileText, AlertTriangle, Settings
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PrivacyPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const dataCategories = [
    {
      icon: Users,
      title: isRu ? 'Идентификационные данные' : 'Identification Data',
      items: isRu 
        ? ['Имя и фамилия', 'Email адрес', 'Номер телефона', 'Дата рождения (если требуется)', 'Фотография профиля']
        : ['Name and surname', 'Email address', 'Phone number', 'Date of birth (if required)', 'Profile photo'],
      retention: isRu ? 'До удаления аккаунта + 3 года' : 'Until account deletion + 3 years',
      legal: 'PDPA Art. 24, GDPR Art. 6(1)(b)',
    },
    {
      icon: Database,
      title: isRu ? 'Транзакционные данные' : 'Transaction Data',
      items: isRu 
        ? ['История бронирований', 'Платёжная информация (токены)', 'Отзывы и рейтинги', 'Переписка с партнёрами']
        : ['Booking history', 'Payment information (tokens)', 'Reviews and ratings', 'Partner correspondence'],
      retention: isRu ? '7 лет (финансовые требования)' : '7 years (financial requirements)',
      legal: 'PDPA Art. 24, GDPR Art. 6(1)(c)',
    },
    {
      icon: Globe,
      title: isRu ? 'Технические данные' : 'Technical Data',
      items: isRu 
        ? ['IP-адрес', 'Тип устройства и браузера', 'Геолокация (с согласия)', 'Cookie и идентификаторы']
        : ['IP address', 'Device and browser type', 'Geolocation (with consent)', 'Cookies and identifiers'],
      retention: isRu ? '26 месяцев' : '26 months',
      legal: 'PDPA Art. 24, GDPR Art. 6(1)(f)',
    },
    {
      icon: Settings,
      title: isRu ? 'Данные предпочтений' : 'Preference Data',
      items: isRu 
        ? ['Язык интерфейса', 'Валюта', 'Уведомления', 'Избранное и история просмотров']
        : ['Interface language', 'Currency', 'Notifications', 'Favorites and view history'],
      retention: isRu ? 'До удаления аккаунта' : 'Until account deletion',
      legal: 'PDPA Art. 24, GDPR Art. 6(1)(a)',
    },
  ];

  const dataPurposes = [
    {
      purpose: isRu ? 'Предоставление услуг' : 'Service Provision',
      description: isRu 
        ? 'Обработка бронирований, платежей, связь с партнёрами'
        : 'Processing bookings, payments, partner communication',
      basis: isRu ? 'Исполнение договора' : 'Contract performance',
    },
    {
      purpose: isRu ? 'Улучшение сервиса' : 'Service Improvement',
      description: isRu 
        ? 'Анализ использования, персонализация рекомендаций'
        : 'Usage analysis, personalized recommendations',
      basis: isRu ? 'Законный интерес' : 'Legitimate interest',
    },
    {
      purpose: isRu ? 'Безопасность' : 'Security',
      description: isRu 
        ? 'Предотвращение мошенничества, защита аккаунтов'
        : 'Fraud prevention, account protection',
      basis: isRu ? 'Законный интерес' : 'Legitimate interest',
    },
    {
      purpose: isRu ? 'Маркетинг' : 'Marketing',
      description: isRu 
        ? 'Рассылки, персонализированная реклама'
        : 'Newsletters, personalized advertising',
      basis: isRu ? 'Согласие' : 'Consent',
    },
    {
      purpose: isRu ? 'Юридические требования' : 'Legal Requirements',
      description: isRu 
        ? 'Соблюдение законодательства, ответы на запросы'
        : 'Legal compliance, responding to requests',
      basis: isRu ? 'Юридическое обязательство' : 'Legal obligation',
    },
  ];

  const userRights = [
    {
      right: isRu ? 'Право на доступ' : 'Right of Access',
      description: isRu 
        ? 'Вы можете запросить копию всех ваших данных, которые мы храним.'
        : 'You can request a copy of all your data we store.',
      how: isRu ? 'Настройки → Мои данные → Скачать' : 'Settings → My Data → Download',
    },
    {
      right: isRu ? 'Право на исправление' : 'Right to Rectification',
      description: isRu 
        ? 'Вы можете исправить неточные данные в профиле.'
        : 'You can correct inaccurate data in your profile.',
      how: isRu ? 'Настройки → Редактировать профиль' : 'Settings → Edit Profile',
    },
    {
      right: isRu ? 'Право на удаление' : 'Right to Erasure',
      description: isRu 
        ? 'Вы можете запросить удаление аккаунта и данных (с ограничениями).'
        : 'You can request account and data deletion (with limitations).',
      how: isRu ? 'Настройки → Удалить аккаунт или privacy@myuno.app' : 'Settings → Delete Account or privacy@myuno.app',
    },
    {
      right: isRu ? 'Право на переносимость' : 'Right to Portability',
      description: isRu 
        ? 'Вы можете получить данные в машиночитаемом формате (JSON).'
        : 'You can receive data in machine-readable format (JSON).',
      how: isRu ? 'Настройки → Мои данные → Экспорт' : 'Settings → My Data → Export',
    },
    {
      right: isRu ? 'Право на ограничение' : 'Right to Restriction',
      description: isRu 
        ? 'Вы можете ограничить обработку данных в определённых случаях.'
        : 'You can restrict data processing in certain cases.',
      how: 'privacy@myuno.app',
    },
    {
      right: isRu ? 'Право на возражение' : 'Right to Object',
      description: isRu 
        ? 'Вы можете возразить против обработки для маркетинга или профилирования.'
        : 'You can object to processing for marketing or profiling.',
      how: isRu ? 'Настройки → Уведомления → Отписаться' : 'Settings → Notifications → Unsubscribe',
    },
  ];

  const thirdParties = [
    {
      category: isRu ? 'Партнёры (поставщики услуг)' : 'Partners (Service Providers)',
      data: isRu ? 'Имя, телефон, детали бронирования' : 'Name, phone, booking details',
      purpose: isRu ? 'Оказание забронированных услуг' : 'Providing booked services',
    },
    {
      category: isRu ? 'Платёжные провайдеры' : 'Payment Providers',
      data: isRu ? 'Платёжные токены, сумма, валюта' : 'Payment tokens, amount, currency',
      purpose: isRu ? 'Обработка платежей' : 'Payment processing',
    },
    {
      category: isRu ? 'Аналитика' : 'Analytics',
      data: isRu ? 'Анонимизированные данные использования' : 'Anonymized usage data',
      purpose: isRu ? 'Улучшение продукта' : 'Product improvement',
    },
    {
      category: isRu ? 'Облачные провайдеры' : 'Cloud Providers',
      data: isRu ? 'Все данные (зашифрованы)' : 'All data (encrypted)',
      purpose: isRu ? 'Хранение и обработка' : 'Storage and processing',
    },
    {
      category: isRu ? 'Государственные органы' : 'Government Authorities',
      data: isRu ? 'По законному требованию' : 'Upon lawful request',
      purpose: isRu ? 'Соблюдение закона' : 'Legal compliance',
    },
  ];

  const securityMeasures = [
    { icon: '🔐', title: isRu ? 'Шифрование' : 'Encryption', desc: isRu ? 'AES-256, TLS 1.3' : 'AES-256, TLS 1.3' },
    { icon: '🛡️', title: isRu ? 'Контроль доступа' : 'Access Control', desc: isRu ? 'Принцип минимальных привилегий' : 'Least privilege principle' },
    { icon: '📋', title: isRu ? 'Аудит' : 'Audit', desc: isRu ? 'Регулярные проверки безопасности' : 'Regular security audits' },
    { icon: '🔔', title: isRu ? 'Мониторинг' : 'Monitoring', desc: isRu ? '24/7 мониторинг угроз' : '24/7 threat monitoring' },
    { icon: '💾', title: isRu ? 'Бэкапы' : 'Backups', desc: isRu ? 'Ежедневные зашифрованные копии' : 'Daily encrypted backups' },
    { icon: '🏢', title: isRu ? 'Сертификация' : 'Certification', desc: isRu ? 'ISO 27001, SOC 2 (в процессе)' : 'ISO 27001, SOC 2 (in progress)' },
  ];

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader 
          title={isRu ? 'Политика конфиденциальности' : 'Privacy Policy'} 
          showBack 
        />

        {/* Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold mb-2">
                  {isRu ? 'Защита ваших персональных данных' : 'Protection of Your Personal Data'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {isRu 
                    ? 'myUNO Limited серьёзно относится к защите ваших данных. Эта политика соответствует PDPA (Thailand), GDPR (EU) и другим применимым законам.'
                    : 'myUNO Limited takes your data protection seriously. This policy complies with PDPA (Thailand), GDPR (EU), and other applicable laws.'}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-none">PDPA Compliant</span>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-none">GDPR Compliant</span>
                  <span className="text-xs bg-muted px-2 py-1 rounded-none">{isRu ? 'Январь 2026' : 'January 2026'}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Controller */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {isRu ? 'Контролёр данных' : 'Data Controller'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              <strong>myUNO Limited</strong><br />
              {isRu ? 'Адрес: ' : 'Address: '}Thailand / UAE<br />
              {isRu ? 'Email DPO: ' : 'DPO Email: '}dpo@myuno.app<br />
              {isRu ? 'Общие вопросы: ' : 'General inquiries: '}privacy@myuno.app
            </p>
          </CardContent>
        </Card>

        {/* Data Categories */}
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          {isRu ? '1. Какие данные мы собираем' : '1. What Data We Collect'}
        </h2>
        <div className="space-y-4 mb-8">
          {dataCategories.map((category, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <category.icon className="h-4 w-4 text-primary" />
                  {category.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid grid-cols-2 gap-1 mb-3">
                  {category.items.map((item, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="bg-muted px-2 py-1 rounded-none">
                    {isRu ? 'Хранение:' : 'Retention:'} {category.retention}
                  </span>
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded-none">
                    {category.legal}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Data Purposes */}
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Eye className="h-5 w-5 text-primary" />
          {isRu ? '2. Как мы используем данные' : '2. How We Use Data'}
        </h2>
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="space-y-4">
              {dataPurposes.map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-none">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{item.purpose}</h4>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-none whitespace-nowrap">
                    {item.basis}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* User Rights */}
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          {isRu ? '3. Ваши права' : '3. Your Rights'}
        </h2>
        <Accordion type="multiple" className="mb-8">
          {userRights.map((item, index) => (
            <AccordionItem key={index} value={`right-${index}`}>
              <AccordionTrigger className="text-left">
                <span className="font-medium text-sm">{item.right}</span>
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                <p className="text-xs bg-muted p-2 rounded-none">
                  <strong>{isRu ? 'Как:' : 'How:'}</strong> {item.how}
                </p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Third Parties */}
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          {isRu ? '4. Передача данных третьим лицам' : '4. Data Sharing with Third Parties'}
        </h2>
        <Card className="mb-8 overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-medium">{isRu ? 'Получатель' : 'Recipient'}</th>
                    <th className="text-left p-3 font-medium">{isRu ? 'Данные' : 'Data'}</th>
                    <th className="text-left p-3 font-medium">{isRu ? 'Цель' : 'Purpose'}</th>
                  </tr>
                </thead>
                <tbody>
                  {thirdParties.map((item, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-3 font-medium">{item.category}</td>
                      <td className="p-3 text-muted-foreground">{item.data}</td>
                      <td className="p-3 text-muted-foreground">{item.purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Lock className="h-5 w-5 text-primary" />
          {isRu ? '5. Безопасность данных' : '5. Data Security'}
        </h2>
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {securityMeasures.map((measure, index) => (
                <div key={index} className="text-center p-3 bg-muted rounded-none">
                  <span className="text-2xl mb-2 block">{measure.icon}</span>
                  <h4 className="font-medium text-sm">{measure.title}</h4>
                  <p className="text-xs text-muted-foreground">{measure.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* International Transfers */}
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          {isRu ? '6. Международная передача данных' : '6. International Data Transfers'}
        </h2>
        <Card className="mb-8">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-4">
              {isRu 
                ? 'Ваши данные могут передаваться и храниться за пределами Таиланда/ОАЭ. Мы обеспечиваем защиту данных через:'
                : 'Your data may be transferred and stored outside Thailand/UAE. We ensure data protection through:'}
            </p>
            <ul className="space-y-2">
              {(isRu 
                ? [
                    'Стандартные договорные условия (SCCs) для передач в ЕС',
                    'Соглашения о защите данных с каждым получателем',
                    'Хранение данных в сертифицированных дата-центрах',
                    'Шифрование данных при передаче и хранении',
                  ]
                : [
                    'Standard Contractual Clauses (SCCs) for EU transfers',
                    'Data protection agreements with each recipient',
                    'Storage in certified data centers',
                    'Encryption of data in transit and at rest',
                  ]
              ).map((item, idx) => (
                <li key={idx} className="text-sm flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Cookies */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="h-4 w-4" />
              {isRu ? '7. Cookie и отслеживание' : '7. Cookies and Tracking'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {isRu 
                ? 'Мы используем cookie для обеспечения работы сервиса, аналитики и персонализации. Подробнее:'
                : 'We use cookies for service operation, analytics, and personalization. Learn more:'}
            </p>
            <Link to="/cookies" className="text-sm text-primary hover:underline">
              {isRu ? '→ Политика Cookie' : '→ Cookie Policy'}
            </Link>
          </CardContent>
        </Card>

        {/* Children */}
        <Card className="mb-8 border-accent/40">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-accent dark:text-accent">
              <AlertTriangle className="h-4 w-4" />
              {isRu ? '8. Дети' : '8. Children'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {isRu 
                ? 'Платформа не предназначена для лиц младше 18 лет. Мы не собираем сознательно данные детей. Если вам стало известно о таком случае, сообщите нам: privacy@myuno.app.'
                : 'The Platform is not intended for persons under 18. We do not knowingly collect children\'s data. If you become aware of such a case, notify us: privacy@myuno.app.'}
            </p>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="mb-6">
          <CardContent className="pt-6 text-center">
            <h3 className="font-semibold mb-4">{isRu ? 'Контакты по вопросам конфиденциальности' : 'Privacy Contacts'}</h3>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">{isRu ? 'Ответственный за данные (DPO):' : 'Data Protection Officer (DPO):'}</span><br />
                <span className="font-medium">dpo@myuno.app</span>
              </p>
              <p>
                <span className="text-muted-foreground">{isRu ? 'Общие вопросы:' : 'General inquiries:'}</span><br />
                <span className="font-medium">privacy@myuno.app</span>
              </p>
            </div>
            <div className="mt-4 p-3 bg-muted rounded-none text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">myUNO Pte. Ltd.</p>
              <p>{isRu ? 'Регистрация: Сингапур | Операции: Таиланд' : 'Incorporated: Singapore | Operations: Thailand'}</p>
              <p className="mt-1">{isRu 
                ? 'Надзорный орган: PDPC (Сингапур), PDPA (Таиланд), соответствующий DPA для ЕС.'
                : 'Supervisory authority: PDPC (Singapore), PDPA (Thailand), respective DPA for EU.'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Related Links */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          <Link to="/terms" className="p-3 bg-muted rounded-none text-center hover:bg-muted/80 transition-colors">
            <FileText className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <span className="text-xs">{isRu ? 'Условия использования' : 'Terms of Use'}</span>
          </Link>
          <Link to="/cookies" className="p-3 bg-muted rounded-none text-center hover:bg-muted/80 transition-colors">
            <Settings className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <span className="text-xs">{isRu ? 'Cookie Политика' : 'Cookie Policy'}</span>
          </Link>
        </div>

        {/* Last updated */}
        <div className="text-center text-xs text-muted-foreground py-4">
          {isRu ? 'Последнее обновление: Январь 2026 | Версия 2.0' : 'Last updated: January 2026 | Version 2.0'}
        </div>
      </PageContainer>
    </AppLayout>
  );
}
