import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, Home, Ship, MapPin, Car, Utensils, Scissors, 
  Stethoscope, AlertTriangle, Clock, CreditCard, MessageCircle,
  ShieldCheck, Phone, Anchor, Waves, Pill, GraduationCap, 
  Baby, Sparkles, Scale, PawPrint, ShoppingBag, Flower2,
  Droplets, Building, Wrench
} from 'lucide-react';
import { Link } from 'react-router-dom';

type ServiceType = 'escrow' | 'lead';

interface VerticalPolicy {
  icon: React.ElementType;
  title: string;
  color: string;
  serviceType: ServiceType;
  policies: Array<{
    period: string;
    refund: string;
  }>;
  note?: string;
  specifics?: string[];
}

export default function RefundPolicyPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const serviceTypeLabels = {
    escrow: {
      label: isRu ? 'Escrow-защита' : 'Escrow Protection',
      description: isRu 
        ? 'Оплата через платформу. Деньги удерживаются до оказания услуги. Возврат возможен согласно правилам ниже.'
        : 'Payment through platform. Funds held until service delivery. Refunds possible per rules below.',
      color: 'bg-green-500/10 text-green-600 border-green-500/30'
    },
    lead: {
      label: isRu ? 'Lead-услуга' : 'Lead Service',
      description: isRu 
        ? 'Мы передаём ваш запрос партнёру. Оплата напрямую. Возврат через myUNO невозможен — обращайтесь к партнёру.'
        : 'We forward your request to partner. Direct payment. Refund via myUNO not possible — contact partner directly.',
      color: 'bg-orange-500/10 text-orange-600 border-orange-500/30'
    }
  };

  const escrowVerticals: VerticalPolicy[] = [
    {
      icon: Home,
      title: isRu ? 'Аренда недвижимости' : 'Property Rentals',
      color: 'text-blue-500',
      serviceType: 'escrow',
      policies: [
        { period: isRu ? 'За 30+ дней до заезда' : '30+ days before check-in', refund: '100%' },
        { period: isRu ? 'За 14-29 дней' : '14-29 days before', refund: '50%' },
        { period: isRu ? 'За 7-13 дней' : '7-13 days before', refund: '25%' },
        { period: isRu ? 'Менее 7 дней' : 'Less than 7 days', refund: isRu ? 'Без возврата' : 'No refund' },
      ],
      note: isRu 
        ? 'Депозит возвращается в течение 7 дней после выезда при отсутствии повреждений.'
        : 'Deposit returned within 7 days after checkout if no damages.',
      specifics: isRu 
        ? ['G-Trust защита до $10,000', 'Проверенные объекты', 'Гарантия соответствия описанию']
        : ['G-Trust protection up to $10,000', 'Verified properties', 'Description accuracy guarantee']
    },
    {
      icon: Ship,
      title: isRu ? 'Аренда яхт и катеров' : 'Boat Charters',
      color: 'text-cyan-500',
      serviceType: 'escrow',
      policies: [
        { period: isRu ? 'За 7+ дней' : '7+ days before', refund: '100%' },
        { period: isRu ? 'За 3-6 дней' : '3-6 days before', refund: '50%' },
        { period: isRu ? 'За 1-2 дня' : '1-2 days before', refund: '25%' },
        { period: isRu ? 'В день аренды' : 'Same day', refund: isRu ? 'Без возврата' : 'No refund' },
      ],
      note: isRu 
        ? 'При отмене из-за погодных условий — полный возврат или перенос.'
        : 'Weather cancellations receive full refund or reschedule.',
      specifics: isRu
        ? ['Автоматическая отмена при шторме', 'Капитан и топливо включены', 'Страховка судна']
        : ['Auto-cancel on storm warning', 'Captain & fuel included', 'Vessel insurance']
    },
    {
      icon: MapPin,
      title: isRu ? 'Туры и экскурсии' : 'Tours & Excursions',
      color: 'text-green-500',
      serviceType: 'escrow',
      policies: [
        { period: isRu ? 'За 48+ часов' : '48+ hours before', refund: '100%' },
        { period: isRu ? 'За 24-48 часов' : '24-48 hours before', refund: '50%' },
        { period: isRu ? 'Менее 24 часов' : 'Less than 24 hours', refund: isRu ? 'Без возврата' : 'No refund' },
      ],
      note: isRu 
        ? 'Групповые туры могут иметь особые условия отмены.'
        : 'Group tours may have special cancellation terms.',
      specifics: isRu
        ? ['Лицензированные гиды', 'Трансфер от отеля', 'Мини-группы до 8 человек']
        : ['Licensed guides', 'Hotel pickup', 'Small groups up to 8']
    },
    {
      icon: Car,
      title: isRu ? 'Трансферы' : 'Transfers',
      color: 'text-orange-500',
      serviceType: 'escrow',
      policies: [
        { period: isRu ? 'За 24+ часа' : '24+ hours before', refund: '100%' },
        { period: isRu ? 'За 6-24 часа' : '6-24 hours before', refund: '50%' },
        { period: isRu ? 'Менее 6 часов' : 'Less than 6 hours', refund: isRu ? 'Без возврата' : 'No refund' },
      ],
      note: isRu 
        ? 'При задержке рейса — бесплатный перенос при уведомлении.'
        : 'Flight delay — free reschedule with notification.',
      specifics: isRu
        ? ['Отслеживание рейса', 'Встреча с табличкой', 'Детские кресла по запросу']
        : ['Flight tracking', 'Meet & greet service', 'Child seats on request']
    },
    {
      icon: Utensils,
      title: isRu ? 'Рестораны и доставка' : 'Restaurants & Delivery',
      color: 'text-red-500',
      serviceType: 'escrow',
      policies: [
        { period: isRu ? 'До подтверждения заказа' : 'Before order confirmation', refund: '100%' },
        { period: isRu ? 'После начала готовки' : 'After cooking starts', refund: isRu ? 'Без возврата' : 'No refund' },
      ],
      note: isRu 
        ? 'Претензии по качеству рассматриваются индивидуально.'
        : 'Quality complaints are reviewed individually.',
      specifics: isRu
        ? ['Фото блюда при доставке', 'Горячая линия качества', 'Компенсация за опоздание']
        : ['Photo proof on delivery', 'Quality hotline', 'Late delivery compensation']
    },
    {
      icon: Scissors,
      title: isRu ? 'Красота и СПА' : 'Beauty & SPA',
      color: 'text-pink-500',
      serviceType: 'escrow',
      policies: [
        { period: isRu ? 'За 24+ часа' : '24+ hours before', refund: '100%' },
        { period: isRu ? 'За 2-24 часа' : '2-24 hours before', refund: '50%' },
        { period: isRu ? 'Менее 2 часов' : 'Less than 2 hours', refund: isRu ? 'Без возврата' : 'No refund' },
      ],
      note: isRu 
        ? 'Неявка без предупреждения — без возврата.'
        : 'No-show without notice — no refund.',
      specifics: isRu
        ? ['Сертифицированные мастера', 'Стерильные инструменты', 'Аллерго-тест по запросу']
        : ['Certified specialists', 'Sterile equipment', 'Allergy test on request']
    },
    {
      icon: Waves,
      title: isRu ? 'Водные развлечения' : 'Water Sports',
      color: 'text-sky-500',
      serviceType: 'escrow',
      policies: [
        { period: isRu ? 'За 24+ часа' : '24+ hours before', refund: '100%' },
        { period: isRu ? 'За 6-24 часа' : '6-24 hours before', refund: '50%' },
        { period: isRu ? 'Менее 6 часов' : 'Less than 6 hours', refund: isRu ? 'Без возврата' : 'No refund' },
      ],
      note: isRu 
        ? 'Отмена при опасных волнах — полный возврат.'
        : 'Dangerous wave conditions — full refund.',
      specifics: isRu
        ? ['Инструктаж включён', 'Спасжилеты обязательны', 'Страховка активности']
        : ['Instruction included', 'Life jackets mandatory', 'Activity insurance']
    },
    {
      icon: Baby,
      title: isRu ? 'Няни и бебиситтеры' : 'Babysitters',
      color: 'text-purple-500',
      serviceType: 'escrow',
      policies: [
        { period: isRu ? 'За 24+ часа' : '24+ hours before', refund: '100%' },
        { period: isRu ? 'За 4-24 часа' : '4-24 hours before', refund: '50%' },
        { period: isRu ? 'Менее 4 часов' : 'Less than 4 hours', refund: isRu ? 'Без возврата' : 'No refund' },
      ],
      note: isRu 
        ? 'Все няни проходят проверку документов.'
        : 'All babysitters are document-verified.',
      specifics: isRu
        ? ['Background check', 'Первая помощь сертификат', 'Онлайн-отслеживание']
        : ['Background check', 'First aid certified', 'Online tracking']
    },
    {
      icon: Sparkles,
      title: isRu ? 'Клининг' : 'Cleaning Services',
      color: 'text-teal-500',
      serviceType: 'escrow',
      policies: [
        { period: isRu ? 'За 12+ часов' : '12+ hours before', refund: '100%' },
        { period: isRu ? 'За 4-12 часов' : '4-12 hours before', refund: '50%' },
        { period: isRu ? 'Менее 4 часов' : 'Less than 4 hours', refund: isRu ? 'Без возврата' : 'No refund' },
      ],
      note: isRu 
        ? 'Претензии принимаются в течение 2 часов после уборки.'
        : 'Claims accepted within 2 hours after cleaning.',
      specifics: isRu
        ? ['Эко-средства', 'Фото до/после', 'Гарантия переуборки']
        : ['Eco-friendly products', 'Before/after photos', 'Re-clean guarantee']
    },
    {
      icon: Flower2,
      title: isRu ? 'Цветы' : 'Flowers',
      color: 'text-rose-500',
      serviceType: 'escrow',
      policies: [
        { period: isRu ? 'За 6+ часов до доставки' : '6+ hours before delivery', refund: '100%' },
        { period: isRu ? 'После сборки букета' : 'After bouquet assembly', refund: isRu ? 'Без возврата' : 'No refund' },
      ],
      note: isRu 
        ? 'Замена при несвежих цветах в течение 24ч.'
        : 'Replacement for wilted flowers within 24h.',
      specifics: isRu
        ? ['Свежесть гарантия 5 дней', 'Фото перед доставкой', 'Анонимная доставка']
        : ['5-day freshness guarantee', 'Photo before delivery', 'Anonymous delivery']
    },
    {
      icon: ShoppingBag,
      title: isRu ? 'Маркетплейс' : 'Marketplace',
      color: 'text-amber-500',
      serviceType: 'escrow',
      policies: [
        { period: isRu ? 'До отправки' : 'Before shipping', refund: '100%' },
        { period: isRu ? 'После получения (брак)' : 'After receipt (defect)', refund: '100%' },
        { period: isRu ? 'Не подошло (14 дней)' : 'Not satisfied (14 days)', refund: isRu ? 'Возврат товара' : 'Return item' },
      ],
      note: isRu 
        ? 'Продукты питания возврату не подлежат.'
        : 'Food items are non-refundable.',
      specifics: isRu
        ? ['Проверка при получении', 'Оригинальная упаковка', 'Бесплатный возврат брака']
        : ['Inspection on receipt', 'Original packaging', 'Free defect returns']
    },
  ];

  const leadVerticals: VerticalPolicy[] = [
    {
      icon: Stethoscope,
      title: isRu ? 'Медицинские услуги' : 'Medical Services',
      color: 'text-emerald-500',
      serviceType: 'lead',
      policies: [],
      note: isRu 
        ? 'Мы направляем вас в клинику. Оплата и возврат — напрямую с клиникой.'
        : 'We refer you to a clinic. Payment and refunds — directly with the clinic.',
      specifics: isRu
        ? ['Проверенные клиники', 'Русскоговорящий персонал', 'Помощь с записью']
        : ['Verified clinics', 'Russian-speaking staff', 'Appointment assistance']
    },
    {
      icon: Pill,
      title: isRu ? 'Аптеки' : 'Pharmacies',
      color: 'text-green-600',
      serviceType: 'lead',
      policies: [],
      note: isRu 
        ? 'Заказ и оплата напрямую в аптеке.'
        : 'Order and payment directly at pharmacy.',
      specifics: isRu
        ? ['Поиск аналогов', 'Круглосуточные аптеки', 'Рецептурные препараты']
        : ['Generic alternatives', '24h pharmacies', 'Prescription drugs']
    },
    {
      icon: Scale,
      title: isRu ? 'Юридические услуги' : 'Legal Services',
      color: 'text-slate-600',
      serviceType: 'lead',
      policies: [],
      note: isRu 
        ? 'Консультация и оплата напрямую с юристом.'
        : 'Consultation and payment directly with lawyer.',
      specifics: isRu
        ? ['Лицензированные юристы', 'Визовые вопросы', 'Бизнес-регистрация']
        : ['Licensed lawyers', 'Visa matters', 'Business registration']
    },
    {
      icon: GraduationCap,
      title: isRu ? 'Образование' : 'Education',
      color: 'text-indigo-500',
      serviceType: 'lead',
      policies: [],
      note: isRu 
        ? 'Запись и оплата напрямую в учебном заведении.'
        : 'Enrollment and payment directly with institution.',
      specifics: isRu
        ? ['Языковые школы', 'Репетиторы', 'Детские центры']
        : ['Language schools', 'Tutors', 'Kids centers']
    },
    {
      icon: PawPrint,
      title: isRu ? 'Ветеринария' : 'Pet Services',
      color: 'text-orange-600',
      serviceType: 'lead',
      policies: [],
      note: isRu 
        ? 'Запись и оплата напрямую в клинике.'
        : 'Appointment and payment directly at clinic.',
      specifics: isRu
        ? ['Ветклиники', 'Грумминг', 'Зоомагазины']
        : ['Vet clinics', 'Grooming', 'Pet shops']
    },
    {
      icon: Building,
      title: isRu ? 'Покупка недвижимости' : 'Property Purchase',
      color: 'text-blue-600',
      serviceType: 'lead',
      policies: [],
      note: isRu 
        ? 'Мы подбираем объекты. Сделка и оплата — с застройщиком/владельцем.'
        : 'We match properties. Transaction and payment — with developer/owner.',
      specifics: isRu
        ? ['Бесплатный подбор', 'Due diligence', 'Юридическое сопровождение']
        : ['Free matching', 'Due diligence', 'Legal support']
    },
    {
      icon: Wrench,
      title: isRu ? 'Ремонт и обслуживание' : 'Repairs & Maintenance',
      color: 'text-gray-600',
      serviceType: 'lead',
      policies: [],
      note: isRu 
        ? 'Мы находим мастера. Оплата напрямую исполнителю.'
        : 'We find a specialist. Payment directly to contractor.',
      specifics: isRu
        ? ['Сантехника', 'Электрика', 'Кондиционеры']
        : ['Plumbing', 'Electrical', 'AC service']
    },
    {
      icon: Droplets,
      title: isRu ? 'Доставка воды' : 'Water Delivery',
      color: 'text-blue-400',
      serviceType: 'lead',
      policies: [],
      note: isRu 
        ? 'Заказ и оплата напрямую поставщику.'
        : 'Order and payment directly to supplier.',
      specifics: isRu
        ? ['Регулярная доставка', 'Кулеры в аренду', 'Разные бренды']
        : ['Regular delivery', 'Cooler rental', 'Various brands']
    },
  ];

  const generalTerms = [
    {
      icon: Clock,
      title: isRu ? 'Сроки возврата' : 'Refund Timeline',
      content: isRu 
        ? 'Escrow-возвраты: 5-10 рабочих дней на карту. UNO Кошелёк — мгновенно.'
        : 'Escrow refunds: 5-10 business days to card. UNO Wallet — instant.',
    },
    {
      icon: CreditCard,
      title: isRu ? 'Способ возврата' : 'Refund Method',
      content: isRu 
        ? 'Возврат тем же способом оплаты. Можно выбрать UNO Кошелёк для мгновенного зачисления.'
        : 'Refund via same payment method. Choose UNO Wallet for instant credit.',
    },
    {
      icon: AlertTriangle,
      title: isRu ? 'Форс-мажор' : 'Force Majeure',
      content: isRu 
        ? 'Стихийные бедствия, пандемии, гос. ограничения — полный возврат или перенос (только escrow).'
        : 'Natural disasters, pandemics, government restrictions — full refund or rebooking (escrow only).',
    },
    {
      icon: MessageCircle,
      title: isRu ? 'Споры и претензии' : 'Disputes & Claims',
      content: isRu 
        ? 'Escrow: мы медиатор. Lead: помогаем связаться с партнёром, но не гарантируем возврат.'
        : 'Escrow: we mediate. Lead: we help contact partner but cannot guarantee refund.',
    },
  ];

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader 
          title={isRu ? 'Политика возврата' : 'Refund Policy'} 
          showBack 
        />

        {/* Intro */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <RefreshCw className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-muted-foreground">
                  {isRu 
                    ? 'Условия возврата зависят от типа услуги. myUNO работает по двум моделям:'
                    : 'Refund terms depend on service type. myUNO operates two models:'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Types Explanation */}
        <div className="grid gap-4 mb-8">
          {Object.entries(serviceTypeLabels).map(([type, info]) => (
            <Card key={type} className={`border ${type === 'escrow' ? 'border-green-500/30' : 'border-orange-500/30'}`}>
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${type === 'escrow' ? 'bg-green-500/10' : 'bg-orange-500/10'}`}>
                    {type === 'escrow' ? (
                      <ShieldCheck className="h-5 w-5 text-green-600" />
                    ) : (
                      <Phone className="h-5 w-5 text-orange-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{info.label}</h3>
                      <Badge variant="outline" className={info.color}>
                        {type === 'escrow' 
                          ? (isRu ? 'Возврат возможен' : 'Refunds possible')
                          : (isRu ? 'Возврат невозможен' : 'No refunds')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{info.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Escrow Services */}
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="h-5 w-5 text-green-600" />
          <h2 className="text-lg font-semibold">
            {isRu ? 'Escrow-услуги (возврат возможен)' : 'Escrow Services (refunds available)'}
          </h2>
        </div>
        <div className="space-y-4 mb-8">
          {escrowVerticals.map((vertical, index) => (
            <Card key={index} className="border-green-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <vertical.icon className={`h-5 w-5 ${vertical.color}`} />
                    {vertical.title}
                  </div>
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30 text-xs">
                    Escrow
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-2">
                  {vertical.policies.map((policy, pIndex) => (
                    <div 
                      key={pIndex} 
                      className="flex items-center justify-between py-2 px-3 bg-muted rounded-lg"
                    >
                      <span className="text-sm">{policy.period}</span>
                      <span className={`text-sm font-semibold ${
                        policy.refund === '100%' ? 'text-green-500' :
                        policy.refund === '50%' ? 'text-yellow-500' :
                        policy.refund === '25%' ? 'text-orange-500' :
                        'text-red-500'
                      }`}>
                        {policy.refund}
                      </span>
                    </div>
                  ))}
                </div>
                {vertical.specifics && (
                  <div className="flex flex-wrap gap-1.5">
                    {vertical.specifics.map((spec, sIndex) => (
                      <Badge key={sIndex} variant="secondary" className="text-xs font-normal">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                )}
                {vertical.note && (
                  <p className="text-xs text-muted-foreground italic">
                    💡 {vertical.note}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Lead Services */}
        <div className="flex items-center gap-2 mb-4">
          <Phone className="h-5 w-5 text-orange-600" />
          <h2 className="text-lg font-semibold">
            {isRu ? 'Lead-услуги (возврат через myUNO невозможен)' : 'Lead Services (no refunds via myUNO)'}
          </h2>
        </div>
        <Card className="mb-4 border-orange-500/30 bg-orange-500/5">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                {isRu 
                  ? 'Для Lead-услуг myUNO выступает информационным посредником. Мы помогаем найти партнёра, но финансовые отношения — между вами и партнёром напрямую. Возврат средств возможен только через партнёра.'
                  : 'For Lead services, myUNO acts as an information intermediary. We help find a partner, but financial relationships are directly between you and the partner. Refunds are only possible through the partner.'}
              </p>
            </div>
          </CardContent>
        </Card>
        <div className="space-y-4 mb-8">
          {leadVerticals.map((vertical, index) => (
            <Card key={index} className="border-orange-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <vertical.icon className={`h-5 w-5 ${vertical.color}`} />
                    {vertical.title}
                  </div>
                  <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/30 text-xs">
                    Lead
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {vertical.specifics && (
                  <div className="flex flex-wrap gap-1.5">
                    {vertical.specifics.map((spec, sIndex) => (
                      <Badge key={sIndex} variant="secondary" className="text-xs font-normal">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                )}
                {vertical.note && (
                  <p className="text-xs text-muted-foreground">
                    ℹ️ {vertical.note}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* General Terms */}
        <h2 className="text-lg font-semibold mb-4">
          {isRu ? 'Общие условия' : 'General Terms'}
        </h2>
        <div className="space-y-4 mb-8">
          {generalTerms.map((term, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <term.icon className="h-4 w-4 text-muted-foreground" />
                  {term.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{term.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* G-Trust Link */}
        <Card className="mb-6 border-amber-500/30 bg-gradient-to-r from-amber-500/5 to-transparent">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-6 w-6 text-amber-500" />
                <div>
                  <p className="font-medium">{isRu ? 'G-Trust защита' : 'G-Trust Protection'}</p>
                  <p className="text-sm text-muted-foreground">
                    {isRu ? 'Гарантия возврата до $10,000 для escrow-услуг' : 'Up to $10,000 guarantee for escrow services'}
                  </p>
                </div>
              </div>
              <Link to="/g-trust" className="text-primary text-sm hover:underline">
                {isRu ? 'Подробнее →' : 'Learn more →'}
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {isRu 
                ? 'Нужна помощь с возвратом? Свяжитесь с поддержкой: support@myuno.app'
                : 'Need help with a refund? Contact support: support@myuno.app'}
            </p>
            <p className="text-xs text-muted-foreground mt-3">
              {isRu ? 'Последнее обновление: Январь 2026' : 'Last updated: January 2026'}
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
