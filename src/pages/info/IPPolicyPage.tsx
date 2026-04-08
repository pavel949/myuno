import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Lock, Database, Copyright, Camera, FileText, 
  AlertTriangle, Scale, Ban, Shield, Globe, Code,
  Bot, Server, Sparkles, Eye, Gavel, Building2,
  CheckCircle2, XCircle, Fingerprint
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function IPPolicyPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const platformRights = {
    title: isRu ? 'Исключительные права myUNO Pte. Ltd.' : 'Exclusive Rights of myUNO Pte. Ltd.',
    description: isRu 
      ? 'Весь контент, размещённый на Платформе www.myuno.app, является исключительной собственностью myUNO Pte. Ltd. (Сингапур), если явно не указано иное. Это включает, но не ограничивается:'
      : 'All content on the Platform www.myuno.app is the exclusive property of myUNO Pte. Ltd. (Singapore) unless explicitly stated otherwise. This includes but is not limited to:',
    categories: [
      {
        icon: Database,
        title: isRu ? 'Данные и базы данных' : 'Data and Databases',
        items: isRu 
          ? [
              'Каталог услуг и партнёров (структура, описания, метаданные)',
              'Фотографии, видео и медиа-контент',
              'Отзывы, рейтинги и оценки',
              'Информация о ценах, доступности, расписаниях',
              'Агрегированная статистика и аналитика',
              'Геолокационные данные и карты покрытия',
            ]
          : [
              'Service and partner catalog (structure, descriptions, metadata)',
              'Photos, videos and media content',
              'Reviews, ratings and scores',
              'Price, availability and schedule information',
              'Aggregated statistics and analytics',
              'Geolocation data and coverage maps',
            ],
      },
      {
        icon: Code,
        title: isRu ? 'Программное обеспечение' : 'Software',
        items: isRu 
          ? [
              'Исходный код веб-приложения и мобильных приложений',
              'Алгоритмы поиска, ранжирования и рекомендаций',
              'Системы машинного обучения и AI-модели',
              'API, SDK и интеграционные протоколы',
              'Архитектура микросервисов и инфраструктура',
            ]
          : [
              'Web and mobile application source code',
              'Search, ranking and recommendation algorithms',
              'Machine learning systems and AI models',
              'APIs, SDKs and integration protocols',
              'Microservices architecture and infrastructure',
            ],
      },
      {
        icon: Sparkles,
        title: isRu ? 'Дизайн и UX' : 'Design and UX',
        items: isRu 
          ? [
              'Визуальный дизайн и UI-компоненты',
              'Пользовательские маршруты и flow',
              'Иконки, иллюстрации и графические элементы',
              'Типографика и цветовые схемы',
              'Анимации и микровзаимодействия',
            ]
          : [
              'Visual design and UI components',
              'User flows and journeys',
              'Icons, illustrations and graphics',
              'Typography and color schemes',
              'Animations and micro-interactions',
            ],
      },
    ],
  };

  const trademarks = {
    title: isRu ? 'Защита товарных знаков' : 'Trademark Protection',
    registered: [
      { name: 'myUNO®', status: 'registered', description: isRu ? 'Основной бренд платформы' : 'Main platform brand' },
      { name: 'UNO®', status: 'registered', description: isRu ? 'Сокращённое наименование' : 'Short name' },
      { name: 'G-Trust®', status: 'registered', description: isRu ? 'Система гарантий' : 'Guarantee system' },
    ],
    pending: [
      { name: 'UNO Wallet™', status: 'pending', description: isRu ? 'Платёжная система' : 'Payment system' },
      { name: 'UNO Points™', status: 'pending', description: isRu ? 'Программа лояльности' : 'Loyalty program' },
      { name: 'myUNO Concierge™', status: 'pending', description: isRu ? 'Консьерж-сервис' : 'Concierge service' },
    ],
    prohibitions: isRu 
      ? [
          'Регистрация доменов, содержащих "uno", "myuno", "g-trust"',
          'Использование в названиях компаний или продуктов',
          'Создание похожих логотипов или визуальных элементов',
          'Использование в мета-тегах, ключевых словах, рекламе',
          'Регистрация аккаунтов в соцсетях с этими названиями',
        ]
      : [
          'Registering domains containing "uno", "myuno", "g-trust"',
          'Use in company or product names',
          'Creating similar logos or visual elements',
          'Use in meta tags, keywords, advertising',
          'Registering social media accounts with these names',
        ],
  };

  const parsingProhibitions = [
    {
      icon: Bot,
      action: isRu ? 'Веб-скрапинг и парсинг' : 'Web Scraping and Parsing',
      description: isRu 
        ? 'Автоматический сбор данных с использованием ботов, краулеров, скриптов или любых автоматизированных средств'
        : 'Automated data collection using bots, crawlers, scripts or any automated means',
      penalty: '$50,000',
      detection: isRu ? 'ML-детектор + fingerprinting' : 'ML detector + fingerprinting',
    },
    {
      icon: Server,
      action: isRu ? 'API-абьюз' : 'API Abuse',
      description: isRu 
        ? 'Массовые запросы к API, превышение rate limits, использование API для сбора данных'
        : 'Mass API requests, exceeding rate limits, using API for data collection',
      penalty: '$25,000',
      detection: isRu ? 'Rate limiting + anomaly detection' : 'Rate limiting + anomaly detection',
    },
    {
      icon: Database,
      action: isRu ? 'Копирование базы данных' : 'Database Copying',
      description: isRu 
        ? 'Полное или частичное копирование каталога услуг, партнёров, цен или отзывов'
        : 'Full or partial copying of services, partners, prices or reviews catalog',
      penalty: '$100,000',
      detection: isRu ? 'Watermarking + canary traps' : 'Watermarking + canary traps',
    },
    {
      icon: Code,
      action: isRu ? 'Реверс-инжиниринг' : 'Reverse Engineering',
      description: isRu 
        ? 'Декомпиляция, дизассемблирование или анализ исходного кода и алгоритмов'
        : 'Decompilation, disassembly or analysis of source code and algorithms',
      penalty: '$200,000',
      detection: isRu ? 'Code obfuscation + legal' : 'Code obfuscation + legal',
    },
    {
      icon: Eye,
      action: isRu ? 'Мониторинг цен конкурентами' : 'Competitor Price Monitoring',
      description: isRu 
        ? 'Систематический сбор информации о ценах для конкурентного анализа'
        : 'Systematic collection of pricing information for competitive analysis',
      penalty: '$75,000',
      detection: isRu ? 'Behavioral analysis' : 'Behavioral analysis',
    },
    {
      icon: Building2,
      action: isRu ? 'Создание конкурирующих сервисов' : 'Creating Competing Services',
      description: isRu 
        ? 'Использование данных myUNO для запуска аналогичных платформ'
        : 'Using myUNO data to launch similar platforms',
      penalty: isRu ? 'Полный ущерб + 3x штраф' : 'Full damages + 3x penalty',
      detection: isRu ? 'Market monitoring' : 'Market monitoring',
    },
  ];

  const userContentLicense = {
    grant: {
      title: isRu ? 'Предоставляемая лицензия' : 'License Grant',
      intro: isRu 
        ? 'Загружая любой контент на Платформу, вы безвозмездно предоставляете myUNO Pte. Ltd.:'
        : 'By uploading any content to the Platform, you grant myUNO Pte. Ltd. free of charge:',
      rights: isRu 
        ? [
            'Всемирную, бессрочную, безотзывную лицензию',
            'Право использовать, копировать, хранить, модифицировать',
            'Право публично показывать и распространять',
            'Право создавать производные произведения',
            'Право сублицензировать партнёрам и аффилиатам',
            'Право использовать для обучения AI/ML моделей',
            'Право использовать в маркетинговых материалах',
          ]
        : [
            'Worldwide, perpetual, irrevocable license',
            'Right to use, copy, store, modify',
            'Right to publicly display and distribute',
            'Right to create derivative works',
            'Right to sublicense to partners and affiliates',
            'Right to use for AI/ML model training',
            'Right to use in marketing materials',
          ],
    },
    contentTypes: isRu 
      ? ['Фотографии и видео', 'Отзывы и комментарии', 'Рейтинги и оценки', 'Профильные данные', 'Сообщения в чатах', 'Запросы и бронирования']
      : ['Photos and videos', 'Reviews and comments', 'Ratings and scores', 'Profile data', 'Chat messages', 'Requests and bookings'],
    warranties: {
      title: isRu ? 'Ваши гарантии' : 'Your Warranties',
      items: isRu 
        ? [
            'Вы являетесь автором или имеете все необходимые права',
            'Контент не нарушает права третьих лиц (авторские, личные)',
            'Контент не содержит клеветы, оскорблений, угроз',
            'Контент соответствует законодательству и правилам Платформы',
            'Вы согласны на использование без дополнительного уведомления',
          ]
        : [
            'You are the author or have all necessary rights',
            'Content does not infringe third-party rights (copyright, personal)',
            'Content does not contain defamation, insults, threats',
            'Content complies with law and Platform rules',
            'You agree to use without additional notification',
          ],
    },
    retention: isRu 
      ? 'Лицензия сохраняется даже после удаления вашего аккаунта для контента, уже использованного в производных работах, кэшах и резервных копиях.'
      : 'The license survives even after account deletion for content already used in derivative works, caches and backups.',
  };

  const permittedUse = [
    { 
      allowed: true, 
      text: isRu ? 'Личное, некоммерческое использование (просмотр, бронирование)' : 'Personal, non-commercial use (viewing, booking)' 
    },
    { 
      allowed: true, 
      text: isRu ? 'Ссылки на Платформу с указанием источника' : 'Links to Platform with source attribution' 
    },
    { 
      allowed: true, 
      text: isRu ? 'Краткие цитаты в обзорах (до 100 слов) со ссылкой' : 'Brief quotes in reviews (up to 100 words) with link' 
    },
    { 
      allowed: true, 
      text: isRu ? 'Партнёрское использование согласно Partner Agreement' : 'Partner use per Partner Agreement' 
    },
    { 
      allowed: true, 
      text: isRu ? 'Пресс-материалы с письменного разрешения PR' : 'Press materials with written PR permission' 
    },
    { 
      allowed: false, 
      text: isRu ? 'Коммерческое использование без лицензии' : 'Commercial use without license' 
    },
    { 
      allowed: false, 
      text: isRu ? 'Автоматизированный сбор данных любыми средствами' : 'Automated data collection by any means' 
    },
    { 
      allowed: false, 
      text: isRu ? 'Создание конкурирующих продуктов на основе данных' : 'Creating competing products based on data' 
    },
    { 
      allowed: false, 
      text: isRu ? 'Продажа или передача данных третьим лицам' : 'Selling or transferring data to third parties' 
    },
  ];

  const dmcaProcess = [
    { step: '1', title: isRu ? 'Уведомление' : 'Notice', description: isRu ? 'Отправьте жалобу на ip@myuno.app' : 'Send complaint to ip@myuno.app' },
    { step: '2', title: isRu ? 'Верификация' : 'Verification', description: isRu ? 'Проверка в течение 48 часов' : 'Review within 48 hours' },
    { step: '3', title: isRu ? 'Takedown' : 'Takedown', description: isRu ? 'Удаление или блокировка контента' : 'Content removal or blocking' },
    { step: '4', title: isRu ? 'Контр-уведомление' : 'Counter-Notice', description: isRu ? 'Право на ответ 10 дней' : 'Right to respond 10 days' },
  ];

  const enforcement = isRu 
    ? [
        'Автоматизированный мониторинг нарушений 24/7',
        'ML-детекция ботов и необычного поведения',
        'Fingerprinting устройств и сессий',
        'Watermarking контента для отслеживания',
        'Canary traps (ловушки) в базе данных',
        'Сотрудничество с правоохранительными органами',
        'Судебное преследование в Сингапуре, Таиланде, ОАЭ',
        'Взыскание убытков и штрафных санкций',
      ]
    : [
        'Automated 24/7 violation monitoring',
        'ML detection of bots and unusual behavior',
        'Device and session fingerprinting',
        'Content watermarking for tracking',
        'Canary traps in database',
        'Cooperation with law enforcement',
        'Legal prosecution in Singapore, Thailand, UAE',
        'Damages and penalties recovery',
      ];

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader 
          title={isRu ? 'IP & Политика контента' : 'IP & Content Policy'} 
          showBack 
        />

        {/* Header */}
        <Card className="mb-6 border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold mb-2">
                  {isRu ? 'Защита интеллектуальной собственности' : 'Intellectual Property Protection'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {isRu 
                    ? 'Вся информация на Платформе www.myuno.app защищена законодательством Республики Сингапур, международными соглашениями (Бернская конвенция, TRIPS, WIPO) и локальными законами юрисдикций присутствия.'
                    : 'All information on www.myuno.app is protected by Republic of Singapore law, international agreements (Berne Convention, TRIPS, WIPO) and local laws of operating jurisdictions.'}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {isRu ? 'Последнее обновление: Январь 2026' : 'Last updated: January 2026'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Platform Rights */}
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Lock className="h-5 w-5 text-primary" />
          {isRu ? '1. Исключительные права myUNO' : '1. myUNO Exclusive Rights'}
        </h2>
        <Card className="mb-4">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-4">{platformRights.description}</p>
          </CardContent>
        </Card>
        <div className="space-y-4 mb-8">
          {platformRights.categories.map((category, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <category.icon className="h-4 w-4 text-primary" />
                  {category.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-2">
                  {category.items.map((item, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trademarks */}
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Copyright className="h-5 w-5 text-primary" />
          {isRu ? '2. Товарные знаки' : '2. Trademarks'}
        </h2>
        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-sm mb-3">{isRu ? 'Зарегистрированные ®' : 'Registered ®'}</h4>
                <div className="grid gap-2">
                  {trademarks.registered.map((tm, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-success/5 border border-success/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-success/10 text-success border-success/30">®</Badge>
                        <span className="font-medium text-sm">{tm.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{tm.description}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-sm mb-3">{isRu ? 'В процессе регистрации ™' : 'Pending Registration ™'}</h4>
                <div className="grid gap-2">
                  {trademarks.pending.map((tm, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-warning/5 border border-warning/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">™</Badge>
                        <span className="font-medium text-sm">{tm.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{tm.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="mb-8 border-destructive/30">
          <CardContent className="pt-4">
            <h4 className="font-medium text-sm mb-3 text-destructive flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              {isRu ? 'Запрещено' : 'Prohibited'}
            </h4>
            <ul className="space-y-2">
              {trademarks.prohibitions.map((item, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Anti-Parsing */}
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Ban className="h-5 w-5 text-destructive" />
          {isRu ? '3. Запрет парсинга и скрапинга' : '3. Parsing and Scraping Prohibition'}
        </h2>
        <Card className="mb-4 border-destructive/30 bg-destructive/5">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive mb-1">
                  {isRu ? 'СТРОГО ЗАПРЕЩЕНО' : 'STRICTLY PROHIBITED'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isRu 
                    ? 'Любой автоматизированный сбор данных с Платформы запрещён без письменного разрешения. Мы используем передовые технологии детекции и преследуем нарушителей в судебном порядке.'
                    : 'Any automated data collection from the Platform is prohibited without written permission. We use advanced detection technologies and pursue violators through legal channels.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="space-y-3 mb-8">
          {parsingProhibitions.map((item, index) => (
            <Card key={index} className="border-destructive/20">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <item.icon className="h-5 w-5 text-destructive mt-0.5" />
                    <div>
                      <h4 className="font-medium text-sm">{item.action}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                      <Badge variant="outline" className="mt-2 text-xs">
                        <Fingerprint className="h-3 w-3 mr-1" />
                        {item.detection}
                      </Badge>
                    </div>
                  </div>
                  <Badge className="bg-destructive text-destructive-foreground shrink-0">
                    {item.penalty}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* User Content License */}
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Camera className="h-5 w-5 text-primary" />
          {isRu ? '4. Лицензия на пользовательский контент' : '4. User Content License'}
        </h2>
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{userContentLicense.grant.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">{userContentLicense.grant.intro}</p>
            <ul className="space-y-2 mb-4">
              {userContentLicense.grant.rights.map((right, idx) => (
                <li key={idx} className="text-sm flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  {right}
                </li>
              ))}
            </ul>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground font-medium mb-2">
                {isRu ? 'Распространяется на:' : 'Applies to:'}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {userContentLicense.contentTypes.map((type, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">{type}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{userContentLicense.warranties.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {userContentLicense.warranties.items.map((item, idx) => (
                <li key={idx} className="text-sm flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card className="mb-8 border-warning/30 bg-warning/5">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">
              ⚠️ {userContentLicense.retention}
            </p>
          </CardContent>
        </Card>

        {/* Permitted Use */}
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          {isRu ? '5. Разрешённое и запрещённое использование' : '5. Permitted and Prohibited Use'}
        </h2>
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="space-y-2">
              {permittedUse.map((item, idx) => (
                <div key={idx} className={`flex items-start gap-2 p-2 rounded-lg ${item.allowed ? 'bg-success/5' : 'bg-destructive/5'}`}>
                  {item.allowed ? (
                    <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                  )}
                  <span className="text-sm">{item.text}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* DMCA */}
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-primary" />
          {isRu ? '6. DMCA и жалобы на нарушения' : '6. DMCA and Infringement Claims'}
        </h2>
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
              {dmcaProcess.map((step, index) => (
                <div key={index} className="min-w-[120px] p-3 bg-muted rounded-lg text-center">
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
                <strong>{isRu ? 'Контакт:' : 'Contact:'}</strong> ip@myuno.app<br />
                {isRu 
                  ? 'Укажите: URL нарушения, описание прав, доказательства, контактные данные, подпись.'
                  : 'Include: violation URL, rights description, evidence, contact details, signature.'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Enforcement */}
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Gavel className="h-5 w-5 text-primary" />
          {isRu ? '7. Применение и защита' : '7. Enforcement and Protection'}
        </h2>
        <Card className="mb-8">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-4">
              {isRu 
                ? 'myUNO активно защищает свою интеллектуальную собственность:'
                : 'myUNO actively protects its intellectual property:'}
            </p>
            <ul className="grid gap-2">
              {enforcement.map((item, idx) => (
                <li key={idx} className="text-sm flex items-start gap-2">
                  <Shield className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Governing Law */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4" />
              {isRu ? 'Применимое право' : 'Governing Law'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {isRu 
                ? 'Эта политика регулируется законодательством Республики Сингапур. Споры подлежат разрешению в судах Сингапура или через арбитраж SIAC. Для нарушений на территории Таиланда — дополнительно THAC.'
                : 'This policy is governed by the laws of the Republic of Singapore. Disputes are subject to resolution in Singapore courts or through SIAC arbitration. For violations in Thailand — additionally THAC.'}
            </p>
          </CardContent>
        </Card>

        {/* Related Links */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Link to="/terms" className="text-sm text-primary hover:underline">
            {isRu ? 'Условия использования →' : 'Terms of Service →'}
          </Link>
          <Link to="/partner-agreement" className="text-sm text-primary hover:underline">
            {isRu ? 'Партнёрское соглашение →' : 'Partner Agreement →'}
          </Link>
          <Link to="/privacy" className="text-sm text-primary hover:underline">
            {isRu ? 'Политика конфиденциальности →' : 'Privacy Policy →'}
          </Link>
        </div>

        {/* Contact */}
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {isRu 
                ? 'Вопросы по интеллектуальной собственности: ip@myuno.app'
                : 'IP questions: ip@myuno.app'}
            </p>
            <div className="mt-4 p-3 bg-muted rounded-lg text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">myUNO Pte. Ltd.</p>
              <p>{isRu ? 'Сингапур | Сервисное подразделение: Таиланд' : 'Singapore | Service Operations: Thailand'}</p>
              <p className="mt-1">www.myuno.app</p>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    </AppLayout>
  );
}
