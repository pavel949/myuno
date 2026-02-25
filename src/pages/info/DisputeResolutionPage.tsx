import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Scale, MessageCircle, Clock, Users, Shield,
  AlertTriangle, CheckCircle, XCircle, FileText,
  Phone, Mail, Gavel, ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DisputeResolutionPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const resolutionSteps = [
    {
      step: 1,
      icon: MessageCircle,
      title: isRu ? 'Прямой контакт с Партнёром' : 'Direct Partner Contact',
      timeframe: '24 ' + (isRu ? 'часа' : 'hours'),
      description: isRu 
        ? 'Свяжитесь с Партнёром через чат в приложении. Большинство вопросов решаются на этом этапе.'
        : 'Contact the Partner through the in-app chat. Most issues are resolved at this stage.',
      actions: isRu 
        ? ['Опишите проблему детально', 'Приложите фото/видео доказательства', 'Предложите решение']
        : ['Describe the problem in detail', 'Attach photo/video evidence', 'Propose a solution'],
    },
    {
      step: 2,
      icon: Users,
      title: isRu ? 'Обращение в поддержку myUNO' : 'Contact myUNO Support',
      timeframe: '48 ' + (isRu ? 'часов' : 'hours'),
      description: isRu 
        ? 'Если Партнёр не отвечает или не решает проблему — откройте официальный спор в приложении.'
        : 'If the Partner doesn\'t respond or resolve the issue — open an official dispute in the app.',
      actions: isRu 
        ? ['Нажмите "Открыть спор" в деталях бронирования', 'Выберите тип проблемы', 'Опишите ситуацию и ваши ожидания']
        : ['Click "Open Dispute" in booking details', 'Select the problem type', 'Describe the situation and your expectations'],
    },
    {
      step: 3,
      icon: Scale,
      title: isRu ? 'Медиация myUNO' : 'myUNO Mediation',
      timeframe: '7 ' + (isRu ? 'дней' : 'days'),
      description: isRu 
        ? 'Наша команда изучит обе стороны и примет решение. Мы можем запросить дополнительные доказательства.'
        : 'Our team will review both sides and make a decision. We may request additional evidence.',
      actions: isRu 
        ? ['Предоставьте все запрошенные документы', 'Ответьте на вопросы медиатора', 'Ожидайте решения']
        : ['Provide all requested documents', 'Answer mediator questions', 'Await decision'],
    },
    {
      step: 4,
      icon: Shield,
      title: isRu ? 'Омбудсмен myUNO' : 'myUNO Ombudsman',
      timeframe: '14 ' + (isRu ? 'дней' : 'days'),
      description: isRu 
        ? 'При несогласии с решением медиации — апелляция к независимому Омбудсмену myUNO. Омбудсмен — нейтральный эксперт, назначаемый платформой.'
        : 'If you disagree with mediation — appeal to independent myUNO Ombudsman. The Ombudsman is a neutral expert appointed by the platform.',
      actions: isRu 
        ? ['Подайте апелляцию в течение 3 дней после решения медиации', 'Укажите основания для несогласия', 'Омбудсмен проведёт независимую проверку', 'Решение омбудсмена может быть обжаловано только в арбитраже']
        : ['Submit appeal within 3 days of mediation decision', 'State grounds for disagreement', 'Ombudsman will conduct independent review', 'Ombudsman decision can only be appealed via arbitration'],
    },
    {
      step: 5,
      icon: Gavel,
      title: isRu ? 'Арбитраж (финальная инстанция)' : 'Arbitration (Final Instance)',
      timeframe: '30 ' + (isRu ? 'дней' : 'days'),
      description: isRu 
        ? 'Для споров свыше $1,000 или при несогласии с решением Омбудсмена — обязательный арбитраж THAC/HKIAC. Решение арбитра окончательное и обязательное.'
        : 'For disputes over $1,000 or if you disagree with Ombudsman — mandatory THAC/HKIAC arbitration. Arbitrator\'s decision is final and binding.',
      actions: isRu 
        ? ['Подайте заявку на арбитраж в течение 7 дней', 'Оплатите арбитражный сбор (возвращается при выигрыше)', 'Арбитраж проводится онлайн или очно', 'Решение арбитра является окончательным и не подлежит обжалованию']
        : ['Submit arbitration request within 7 days', 'Pay arbitration fee (refunded if you win)', 'Arbitration conducted online or in person', 'Arbitrator\'s decision is final and non-appealable'],
    },
  ];

  const disputeTypes = [
    {
      type: isRu ? 'Услуга не оказана' : 'Service Not Provided',
      resolution: isRu ? 'Полный возврат через G-Trust' : 'Full refund via G-Trust',
      timeframe: '3-5 ' + (isRu ? 'дней' : 'days'),
      covered: true,
    },
    {
      type: isRu ? 'Услуга отличается от описания' : 'Service Differs from Description',
      resolution: isRu ? 'Частичный/полный возврат' : 'Partial/full refund',
      timeframe: '5-7 ' + (isRu ? 'дней' : 'days'),
      covered: true,
    },
    {
      type: isRu ? 'Качество ниже ожиданий' : 'Quality Below Expectations',
      resolution: isRu ? 'Рассмотрение индивидуально' : 'Individual review',
      timeframe: '7-14 ' + (isRu ? 'дней' : 'days'),
      covered: true,
    },
    {
      type: isRu ? 'Спор о цене' : 'Price Dispute',
      resolution: isRu ? 'Сверка с описанием услуги' : 'Check against service description',
      timeframe: '3-5 ' + (isRu ? 'дней' : 'days'),
      covered: true,
    },
    {
      type: isRu ? 'Оплата вне Платформы' : 'Payment Outside Platform',
      resolution: isRu ? 'НЕ ПОКРЫВАЕТСЯ — потеря защиты' : 'NOT COVERED — loss of protection',
      timeframe: '-',
      covered: false,
    },
    {
      type: isRu ? 'Споры после 14 дней' : 'Disputes After 14 Days',
      resolution: isRu ? 'Ограниченные возможности' : 'Limited options',
      timeframe: isRu ? 'Индивидуально' : 'Individual',
      covered: false,
    },
  ];

  const gTrustCoverage = [
    {
      category: isRu ? 'Полное покрытие' : 'Full Coverage',
      items: isRu 
        ? ['Аренда яхт и катеров', 'Туры и экскурсии', 'Транспорт (escrow)', 'Маркетплейс товаров']
        : ['Boat charters', 'Tours & excursions', 'Transport (escrow)', 'Marketplace products'],
      maxCoverage: isRu ? 'До 100% стоимости' : 'Up to 100% of cost',
      color: 'bg-green-500/10 border-green-500/30',
    },
    {
      category: isRu ? 'Покрытие депозита' : 'Deposit Coverage',
      items: isRu 
        ? ['Краткосрочная аренда', 'Рестораны (no-show)', 'Красота и СПА', 'Медицина']
        : ['Short-term rentals', 'Restaurants (no-show)', 'Beauty & SPA', 'Medical'],
      maxCoverage: isRu ? 'До суммы депозита' : 'Up to deposit amount',
      color: 'bg-yellow-500/10 border-yellow-500/30',
    },
    {
      category: isRu ? 'Только лид-защита' : 'Lead Protection Only',
      items: isRu 
        ? ['Долгосрочная аренда', 'Визы', 'Юридические услуги', 'Образование']
        : ['Long-term rentals', 'Visas', 'Legal services', 'Education'],
      maxCoverage: isRu ? 'Возврат lead-fee' : 'Lead-fee refund',
      color: 'bg-orange-500/10 border-orange-500/30',
    },
  ];

  const evidenceTypes = [
    { icon: '📸', name: isRu ? 'Фотографии' : 'Photos', desc: isRu ? 'До и после, проблемы' : 'Before and after, issues' },
    { icon: '🎥', name: isRu ? 'Видео' : 'Video', desc: isRu ? 'Доказательства проблем' : 'Evidence of problems' },
    { icon: '💬', name: isRu ? 'Переписка' : 'Messages', desc: isRu ? 'Скриншоты чатов' : 'Chat screenshots' },
    { icon: '🧾', name: isRu ? 'Чеки/квитанции' : 'Receipts', desc: isRu ? 'Подтверждения оплаты' : 'Payment confirmations' },
    { icon: '📄', name: isRu ? 'Документы' : 'Documents', desc: isRu ? 'Договоры, письма' : 'Contracts, letters' },
    { icon: '👥', name: isRu ? 'Свидетели' : 'Witnesses', desc: isRu ? 'Контакты очевидцев' : 'Witness contacts' },
  ];

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader 
          title={isRu ? 'Разрешение споров' : 'Dispute Resolution'} 
          showBack 
        />

        {/* Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Scale className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold mb-2">
                  {isRu ? 'Справедливое разрешение конфликтов' : 'Fair Conflict Resolution'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {isRu 
                    ? 'myUNO выступает нейтральным посредником между Пользователями и Партнёрами. Мы стремимся к справедливому решению каждого спора.'
                    : 'myUNO acts as a neutral mediator between Users and Partners. We strive for a fair resolution of every dispute.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resolution Steps */}
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <ArrowRight className="h-5 w-5 text-primary" />
          {isRu ? 'Процесс разрешения спора' : 'Dispute Resolution Process'}
        </h2>
        <div className="space-y-4 mb-8">
          {resolutionSteps.map((step, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      {step.step}
                    </div>
                    {index < resolutionSteps.length - 1 && (
                      <div className="w-0.5 h-8 bg-border mt-2" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold flex items-center gap-2">
                        <step.icon className="h-4 w-4 text-primary" />
                        {step.title}
                      </h3>
                      <span className="text-xs bg-muted px-2 py-1 rounded flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {step.timeframe}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{step.description}</p>
                    <ul className="space-y-1">
                      {step.actions.map((action, idx) => (
                        <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                          <span className="text-primary mt-0.5">→</span>
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Dispute Types */}
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          {isRu ? 'Типы споров и решения' : 'Dispute Types and Resolutions'}
        </h2>
        <Card className="mb-8 overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-medium">{isRu ? 'Тип спора' : 'Dispute Type'}</th>
                    <th className="text-left p-3 font-medium">{isRu ? 'Решение' : 'Resolution'}</th>
                    <th className="text-center p-3 font-medium">{isRu ? 'Срок' : 'Timeframe'}</th>
                  </tr>
                </thead>
                <tbody>
                  {disputeTypes.map((item, index) => (
                    <tr key={index} className={`border-t ${!item.covered ? 'bg-destructive/5' : ''}`}>
                      <td className="p-3 flex items-center gap-2">
                        {item.covered ? (
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                        )}
                        {item.type}
                      </td>
                      <td className={`p-3 ${!item.covered ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {item.resolution}
                      </td>
                      <td className="p-3 text-center text-muted-foreground">{item.timeframe}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* G-Trust Coverage */}
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          {isRu ? 'Покрытие G-Trust по вертикалям' : 'G-Trust Coverage by Vertical'}
        </h2>
        <div className="grid gap-4 mb-8">
          {gTrustCoverage.map((category, index) => (
            <Card key={index} className={`border ${category.color}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  {category.category}
                  <span className="text-xs font-normal bg-background px-2 py-1 rounded">
                    {category.maxCoverage}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {category.items.map((item, idx) => (
                    <span key={idx} className="text-xs bg-background px-2 py-1 rounded">
                      {item}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Evidence */}
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-primary" />
          {isRu ? 'Какие доказательства собирать' : 'What Evidence to Collect'}
        </h2>
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {evidenceTypes.map((type, index) => (
                <div key={index} className="text-center p-3 bg-muted rounded-lg">
                  <span className="text-2xl mb-2 block">{type.icon}</span>
                  <h4 className="font-medium text-sm">{type.name}</h4>
                  <p className="text-xs text-muted-foreground">{type.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-primary/10 rounded-lg">
              <p className="text-sm text-primary">
                💡 {isRu 
                  ? 'Чем больше доказательств вы предоставите, тем быстрее мы решим ваш спор.'
                  : 'The more evidence you provide, the faster we can resolve your dispute.'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Important Notes */}
        <Card className="mb-8 border-warning/30 bg-warning/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-warning">
              <AlertTriangle className="h-4 w-4" />
              {isRu ? 'Важные ограничения' : 'Important Limitations'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {(isRu 
                ? [
                    'Споры рассматриваются только для транзакций через Платформу',
                    'Срок подачи спора — 14 дней с момента оказания услуги',
                    'Отзыв спора после начала рассмотрения невозможен',
                    'Решение myUNO или арбитра является окончательным',
                    'При ложных обвинениях — блокировка аккаунта',
                  ]
                : [
                    'Disputes are only reviewed for Platform transactions',
                    'Dispute deadline — 14 days from service date',
                    'Dispute cannot be withdrawn after review starts',
                    'myUNO or arbitrator decision is final',
                    'False accusations result in account blocking',
                  ]
              ).map((item, idx) => (
                <li key={idx} className="text-sm text-warning flex items-start gap-2">
                  <span>⚠️</span>
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Class Action Waiver */}
        <Card className="mb-8 border-destructive/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Gavel className="h-4 w-4 text-destructive" />
              {isRu ? 'Отказ от коллективных исков' : 'Class Action Waiver'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {isRu 
                ? 'Используя Платформу, вы соглашаетесь разрешать все споры только индивидуально. Вы отказываетесь от права на участие в коллективных исках, групповых арбитражах или любых объединённых процессах против myUNO Pte. Ltd.'
                : 'By using the Platform, you agree to resolve all disputes only individually. You waive the right to participate in class actions, group arbitrations, or any consolidated proceedings against myUNO Pte. Ltd.'}
            </p>
            <p className="text-xs text-muted-foreground mt-3 p-2 bg-muted rounded">
              {isRu 
                ? 'Применимое право: Сингапур | Арбитраж: SIAC (Singapore International Arbitration Centre) или THAC'
                : 'Governing Law: Singapore | Arbitration: SIAC (Singapore International Arbitration Centre) or THAC'}
            </p>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-center mb-4">{isRu ? 'Контакты для споров' : 'Dispute Contacts'}</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <Mail className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium">disputes@myuno.app</p>
                <p className="text-xs text-muted-foreground">{isRu ? 'Основная почта' : 'Primary email'}</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <Phone className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium">+66 76 XXX XXX</p>
                <p className="text-xs text-muted-foreground">{isRu ? 'Срочная линия' : 'Urgent line'}</p>
              </div>
            </div>
            <div className="mt-4 text-center">
              <Button asChild>
                <Link to="/contact">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {isRu ? 'Связаться с поддержкой' : 'Contact Support'}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Related Links */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          <Link to="/terms" className="p-3 bg-muted rounded-lg text-center hover:bg-muted/80 transition-colors">
            <FileText className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <span className="text-xs">{isRu ? 'Условия использования' : 'Terms of Use'}</span>
          </Link>
          <Link to="/refund-policy" className="p-3 bg-muted rounded-lg text-center hover:bg-muted/80 transition-colors">
            <Shield className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <span className="text-xs">{isRu ? 'Политика возврата' : 'Refund Policy'}</span>
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
