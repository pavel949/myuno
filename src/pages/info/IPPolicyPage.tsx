import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Lock, Database, Copyright, Camera, FileText, 
  AlertTriangle, Scale, Ban, Shield, Globe 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function IPPolicyPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const ownershipItems = [
    {
      icon: Database,
      title: isRu ? 'Данные и контент' : 'Data and Content',
      items: isRu 
        ? ['Описания услуг и партнёров', 'Фотографии и медиа-материалы', 'Отзывы и рейтинги', 'Информация о ценах и доступности', 'Статистика бронирований']
        : ['Service and partner descriptions', 'Photos and media materials', 'Reviews and ratings', 'Price and availability information', 'Booking statistics'],
    },
    {
      icon: Lock,
      title: isRu ? 'Технологии' : 'Technology',
      items: isRu 
        ? ['Алгоритмы поиска и ранжирования', 'Системы рекомендаций', 'Аналитические модели', 'Исходный код и архитектура', 'API и интерфейсы']
        : ['Search and ranking algorithms', 'Recommendation systems', 'Analytics models', 'Source code and architecture', 'APIs and interfaces'],
    },
    {
      icon: Copyright,
      title: isRu ? 'Бренд и товарные знаки' : 'Brand and Trademarks',
      items: isRu 
        ? ['myUNO®', 'UNO®', 'G-Trust®', 'UNO Кошелёк™', 'Логотипы и визуальная айдентика']
        : ['myUNO®', 'UNO®', 'G-Trust®', 'UNO Wallet™', 'Logos and visual identity'],
    },
  ];

  const userLicense = [
    {
      title: isRu ? 'Предоставляемые права' : 'Rights Granted',
      content: isRu 
        ? 'Загружая контент на Платформу (фотографии, отзывы, описания), вы предоставляете myUNO Limited:'
        : 'By uploading content to the Platform (photos, reviews, descriptions), you grant myUNO Limited:',
      items: isRu 
        ? [
            'Бессрочную, безотзывную лицензию',
            'Право на использование, копирование, модификацию',
            'Право на распространение и публичный показ',
            'Право на создание производных произведений',
            'Право на передачу лицензии третьим лицам',
            'Всемирный территориальный охват',
          ]
        : [
            'Perpetual, irrevocable license',
            'Right to use, copy, modify',
            'Right to distribute and publicly display',
            'Right to create derivative works',
            'Right to sublicense to third parties',
            'Worldwide territorial coverage',
          ],
    },
    {
      title: isRu ? 'Ваша ответственность' : 'Your Responsibility',
      content: isRu 
        ? 'Загружая контент, вы гарантируете:'
        : 'By uploading content, you guarantee:',
      items: isRu 
        ? [
            'Вы являетесь автором или имеете права на контент',
            'Контент не нарушает права третьих лиц',
            'Контент не содержит незаконных материалов',
            'Контент соответствует правилам Платформы',
          ]
        : [
            'You are the author or have rights to the content',
            'Content does not infringe third-party rights',
            'Content does not contain illegal materials',
            'Content complies with Platform rules',
          ],
    },
  ];

  const prohibitions = [
    {
      action: isRu ? 'Парсинг и скрапинг' : 'Parsing and Scraping',
      description: isRu 
        ? 'Автоматический сбор данных с Платформы любыми средствами'
        : 'Automated data collection from the Platform by any means',
      penalty: '$10,000+',
    },
    {
      action: isRu ? 'Копирование каталога' : 'Catalog Copying',
      description: isRu 
        ? 'Полное или частичное копирование базы услуг/партнёров'
        : 'Full or partial copying of the services/partners database',
      penalty: '$25,000+',
    },
    {
      action: isRu ? 'Создание конкурирующих БД' : 'Creating Competing DBs',
      description: isRu 
        ? 'Использование данных myUNO для создания аналогичных сервисов'
        : 'Using myUNO data to create similar services',
      penalty: '$50,000+',
    },
    {
      action: isRu ? 'Злоупотребление API' : 'API Abuse',
      description: isRu 
        ? 'Использование API для массового сбора информации'
        : 'Using API for mass data collection',
      penalty: isRu ? 'Блокировка + штраф' : 'Block + fine',
    },
    {
      action: isRu ? 'Реверс-инжиниринг' : 'Reverse Engineering',
      description: isRu 
        ? 'Анализ и воссоздание алгоритмов Платформы'
        : 'Analysis and recreation of Platform algorithms',
      penalty: '$100,000+',
    },
    {
      action: isRu ? 'Несанкционированное использование ТЗ' : 'Unauthorized TM Use',
      description: isRu 
        ? 'Использование товарных знаков myUNO без разрешения'
        : 'Using myUNO trademarks without permission',
      penalty: isRu ? 'Судебное преследование' : 'Legal prosecution',
    },
  ];

  const dmcaProcess = [
    { step: '1', title: isRu ? 'Уведомление' : 'Notice', description: isRu ? 'Отправьте жалобу на ip@myuno.app' : 'Send complaint to ip@myuno.app' },
    { step: '2', title: isRu ? 'Рассмотрение' : 'Review', description: isRu ? 'Мы изучим в течение 72 часов' : 'We will review within 72 hours' },
    { step: '3', title: isRu ? 'Действие' : 'Action', description: isRu ? 'Удаление или уведомление нарушителя' : 'Removal or violator notification' },
    { step: '4', title: isRu ? 'Контр-уведомление' : 'Counter-Notice', description: isRu ? 'Право на ответ в течение 14 дней' : 'Right to respond within 14 days' },
  ];

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader 
          title={isRu ? 'Политика интеллектуальной собственности' : 'Intellectual Property Policy'} 
          showBack 
        />

        {/* Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold mb-2">
                  {isRu ? 'Защита интеллектуальной собственности myUNO' : 'Protection of myUNO Intellectual Property'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {isRu 
                    ? 'Вся информация, размещённая на Платформе, является собственностью myUNO Limited и защищена законодательством об интеллектуальной собственности Таиланда, ОАЭ и международными соглашениями.'
                    : 'All information on the Platform is the property of myUNO Limited and is protected by intellectual property laws of Thailand, UAE, and international agreements.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ownership */}
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          {isRu ? '1. Собственность myUNO' : '1. myUNO Ownership'}
        </h2>
        <div className="space-y-4 mb-8">
          {ownershipItems.map((item, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <item.icon className="h-4 w-4 text-primary" />
                  {item.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid grid-cols-2 gap-2">
                  {item.items.map((i, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      {i}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* User License */}
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Camera className="h-5 w-5 text-primary" />
          {isRu ? '2. Лицензия на пользовательский контент' : '2. User Content License'}
        </h2>
        <div className="space-y-4 mb-8">
          {userLicense.map((section, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{section.content}</p>
                <ul className="space-y-2">
                  {section.items.map((item, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="text-primary mt-0.5">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Prohibitions */}
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Ban className="h-5 w-5 text-destructive" />
          {isRu ? '3. Запрещённые действия' : '3. Prohibited Actions'}
        </h2>
        <Card className="mb-8 border-destructive/30">
          <CardContent className="pt-6">
            <div className="space-y-4">
              {prohibitions.map((item, index) => (
                <div key={index} className="flex items-start justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{item.action}</h4>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  <span className="text-xs font-bold text-destructive bg-destructive/10 px-2 py-1 rounded">
                    {item.penalty}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-destructive/10 rounded-lg">
              <p className="text-sm text-destructive font-medium">
                ⚠️ {isRu 
                  ? 'Нарушение этих правил влечёт немедленную блокировку, штраф и возможное судебное преследование.'
                  : 'Violation of these rules results in immediate blocking, fines, and possible legal prosecution.'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Permitted Use */}
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          {isRu ? '4. Разрешённое использование' : '4. Permitted Use'}
        </h2>
        <Card className="mb-8">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-4">
              {isRu 
                ? 'Разрешается использование материалов myUNO только в следующих случаях:'
                : 'Use of myUNO materials is permitted only in the following cases:'}
            </p>
            <ul className="space-y-3">
              {(isRu 
                ? [
                    'Личное, некоммерческое использование (просмотр, бронирование)',
                    'Ссылки на Платформу с указанием источника',
                    'Обзоры и рецензии с цитированием (до 100 слов)',
                    'Партнёрское использование согласно Партнёрскому соглашению',
                    'Пресс-материалы с письменного разрешения PR-отдела',
                  ]
                : [
                    'Personal, non-commercial use (viewing, booking)',
                    'Links to the Platform with source attribution',
                    'Reviews with quotations (up to 100 words)',
                    'Partner use according to Partner Agreement',
                    'Press materials with written PR department permission',
                  ]
              ).map((item, idx) => (
                <li key={idx} className="text-sm flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* DMCA / Takedown */}
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-primary" />
          {isRu ? '5. Жалобы на нарушение авторских прав' : '5. Copyright Infringement Claims'}
        </h2>
        <Card className="mb-8">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-4">
              {isRu 
                ? 'Если вы считаете, что ваши авторские права нарушены на Платформе, следуйте процедуре DMCA:'
                : 'If you believe your copyright has been infringed on the Platform, follow the DMCA procedure:'}
            </p>
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
              {dmcaProcess.map((step, index) => (
                <div key={index} className="min-w-[140px] p-3 bg-muted rounded-lg text-center">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-2 text-sm font-bold">
                    {step.step}
                  </div>
                  <h4 className="font-medium text-xs mb-1">{step.title}</h4>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>{isRu ? 'Контакт для жалоб:' : 'Contact for claims:'}</strong><br />
                ip@myuno.app<br />
                {isRu 
                  ? 'Укажите: описание нарушения, URL, доказательства прав, контактные данные.'
                  : 'Include: violation description, URL, proof of rights, contact details.'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Enforcement */}
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Scale className="h-5 w-5 text-primary" />
          {isRu ? '6. Применение и санкции' : '6. Enforcement and Sanctions'}
        </h2>
        <Card className="mb-8">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-4">
              {isRu 
                ? 'myUNO активно защищает свою интеллектуальную собственность и применяет следующие меры:'
                : 'myUNO actively protects its intellectual property and applies the following measures:'}
            </p>
            <ul className="space-y-3">
              {(isRu 
                ? [
                    'Мониторинг нарушений с помощью автоматизированных систем',
                    'Блокировка доступа нарушителей',
                    'Направление претензий (cease and desist)',
                    'Судебное преследование в юрисдикциях Thailand/UAE/Singapore',
                    'Взыскание убытков и штрафов',
                    'Сотрудничество с правоохранительными органами',
                  ]
                : [
                    'Monitoring violations with automated systems',
                    'Blocking violator access',
                    'Sending cease and desist letters',
                    'Legal prosecution in Thailand/UAE/Singapore jurisdictions',
                    'Recovery of damages and penalties',
                    'Cooperation with law enforcement',
                  ]
              ).map((item, idx) => (
                <li key={idx} className="text-sm flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Governing Law */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4" />
              {isRu ? '7. Применимое право' : '7. Governing Law'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {isRu 
                ? 'Эта политика регулируется законодательством Республики Сингапур и международными соглашениями об интеллектуальной собственности (Бернская конвенция, TRIPS). Споры подлежат разрешению в судах Сингапура или через арбитраж SIAC.'
                : 'This policy is governed by the laws of the Republic of Singapore and international intellectual property agreements (Berne Convention, TRIPS). Disputes are subject to resolution in Singapore courts or through SIAC arbitration.'}
            </p>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="mb-6">
          <CardContent className="pt-6 text-center">
            <h3 className="font-semibold mb-2">{isRu ? 'Контакты' : 'Contact'}</h3>
            <p className="text-sm text-muted-foreground mb-2">
              {isRu ? 'Вопросы об интеллектуальной собственности:' : 'IP inquiries:'}
            </p>
            <p className="text-sm font-medium">ip@myuno.app</p>
            <p className="text-xs text-muted-foreground mt-2">
              {isRu ? 'Пресс-запросы:' : 'Press inquiries:'} press@myuno.app
            </p>
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
          <Link to="/partner-agreement" className="p-3 bg-muted rounded-lg text-center hover:bg-muted/80 transition-colors">
            <Scale className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <span className="text-xs">{isRu ? 'Партнёрское соглашение' : 'Partner Agreement'}</span>
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
