import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  RefreshCw, Home, Ship, MapPin, Car, Utensils, Scissors, 
  Stethoscope, AlertTriangle, Clock, CreditCard, MessageCircle 
} from 'lucide-react';

export default function RefundPolicyPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const verticalPolicies = [
    {
      icon: Home,
      title: isRu ? 'Аренда недвижимости' : 'Property Rentals',
      color: 'text-blue-500',
      policies: [
        {
          period: isRu ? 'За 30+ дней до заезда' : '30+ days before check-in',
          refund: '100%',
        },
        {
          period: isRu ? 'За 14-29 дней' : '14-29 days before',
          refund: '50%',
        },
        {
          period: isRu ? 'За 7-13 дней' : '7-13 days before',
          refund: '25%',
        },
        {
          period: isRu ? 'Менее 7 дней' : 'Less than 7 days',
          refund: isRu ? 'Без возврата' : 'No refund',
        },
      ],
      note: isRu 
        ? 'Депозит возвращается в течение 7 дней после выезда при отсутствии повреждений.'
        : 'Deposit is returned within 7 days after checkout if no damages.',
    },
    {
      icon: Ship,
      title: isRu ? 'Яхты и катера' : 'Yachts & Boats',
      color: 'text-cyan-500',
      policies: [
        {
          period: isRu ? 'За 7+ дней' : '7+ days before',
          refund: '100%',
        },
        {
          period: isRu ? 'За 3-6 дней' : '3-6 days before',
          refund: '50%',
        },
        {
          period: isRu ? 'За 1-2 дня' : '1-2 days before',
          refund: '25%',
        },
        {
          period: isRu ? 'В день аренды' : 'Same day',
          refund: isRu ? 'Без возврата' : 'No refund',
        },
      ],
      note: isRu 
        ? 'При отмене из-за погодных условий — полный возврат или перенос.'
        : 'Weather cancellations receive full refund or reschedule.',
    },
    {
      icon: MapPin,
      title: isRu ? 'Туры и экскурсии' : 'Tours & Excursions',
      color: 'text-green-500',
      policies: [
        {
          period: isRu ? 'За 48+ часов' : '48+ hours before',
          refund: '100%',
        },
        {
          period: isRu ? 'За 24-48 часов' : '24-48 hours before',
          refund: '50%',
        },
        {
          period: isRu ? 'Менее 24 часов' : 'Less than 24 hours',
          refund: isRu ? 'Без возврата' : 'No refund',
        },
      ],
      note: isRu 
        ? 'Групповые туры могут иметь особые условия отмены.'
        : 'Group tours may have special cancellation terms.',
    },
    {
      icon: Car,
      title: isRu ? 'Транспорт и трансферы' : 'Transport & Transfers',
      color: 'text-orange-500',
      policies: [
        {
          period: isRu ? 'За 24+ часа' : '24+ hours before',
          refund: '100%',
        },
        {
          period: isRu ? 'За 6-24 часа' : '6-24 hours before',
          refund: '50%',
        },
        {
          period: isRu ? 'Менее 6 часов' : 'Less than 6 hours',
          refund: isRu ? 'Без возврата' : 'No refund',
        },
      ],
      note: isRu 
        ? 'Аренда авто: депозит возвращается при возврате без повреждений.'
        : 'Car rental: deposit returned if vehicle is returned undamaged.',
    },
    {
      icon: Utensils,
      title: isRu ? 'Рестораны и доставка' : 'Restaurants & Delivery',
      color: 'text-red-500',
      policies: [
        {
          period: isRu ? 'До подтверждения заказа' : 'Before order confirmation',
          refund: '100%',
        },
        {
          period: isRu ? 'После начала готовки' : 'After cooking starts',
          refund: isRu ? 'Без возврата' : 'No refund',
        },
      ],
      note: isRu 
        ? 'Претензии по качеству рассматриваются индивидуально.'
        : 'Quality complaints are reviewed individually.',
    },
    {
      icon: Scissors,
      title: isRu ? 'Красота и СПА' : 'Beauty & SPA',
      color: 'text-pink-500',
      policies: [
        {
          period: isRu ? 'За 24+ часа' : '24+ hours before',
          refund: '100%',
        },
        {
          period: isRu ? 'За 2-24 часа' : '2-24 hours before',
          refund: '50%',
        },
        {
          period: isRu ? 'Менее 2 часов' : 'Less than 2 hours',
          refund: isRu ? 'Без возврата' : 'No refund',
        },
      ],
      note: isRu 
        ? 'Неявка без предупреждения — без возврата.'
        : 'No-show without notice — no refund.',
    },
    {
      icon: Stethoscope,
      title: isRu ? 'Медицинские услуги' : 'Medical Services',
      color: 'text-emerald-500',
      policies: [
        {
          period: isRu ? 'За 24+ часа' : '24+ hours before',
          refund: '100%',
        },
        {
          period: isRu ? 'Менее 24 часов' : 'Less than 24 hours',
          refund: '50%',
        },
      ],
      note: isRu 
        ? 'Возврат за оказанные медицинские услуги не производится.'
        : 'No refund for completed medical services.',
    },
  ];

  const generalTerms = [
    {
      icon: Clock,
      title: isRu ? 'Сроки возврата' : 'Refund Timeline',
      content: isRu 
        ? 'Возврат средств производится в течение 5-10 рабочих дней на карту, с которой была произведена оплата. При оплате через UNO Кошелёк — мгновенно.'
        : 'Refunds are processed within 5-10 business days to the card used for payment. UNO Wallet payments are refunded instantly.',
    },
    {
      icon: CreditCard,
      title: isRu ? 'Способ возврата' : 'Refund Method',
      content: isRu 
        ? 'Возврат осуществляется тем же способом, которым была произведена оплата. Вы можете выбрать возврат на UNO Кошелёк для мгновенного зачисления.'
        : 'Refunds are made using the same payment method. You can choose UNO Wallet for instant credit.',
    },
    {
      icon: AlertTriangle,
      title: isRu ? 'Форс-мажор' : 'Force Majeure',
      content: isRu 
        ? 'При отмене по причине стихийных бедствий, пандемий или государственных ограничений — полный возврат или перенос бронирования.'
        : 'Cancellations due to natural disasters, pandemics or government restrictions receive full refund or rebooking.',
    },
    {
      icon: MessageCircle,
      title: isRu ? 'Споры и претензии' : 'Disputes & Claims',
      content: isRu 
        ? 'При возникновении спорных ситуаций свяжитесь с поддержкой. Мы выступаем посредником между вами и партнёром для справедливого решения.'
        : 'For disputes, contact support. We mediate between you and the partner for fair resolution.',
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
                    ? 'Условия отмены и возврата зависят от типа услуги и времени до её начала. Ниже подробные правила для каждой категории.'
                    : 'Cancellation and refund terms depend on service type and time before start. Below are detailed rules for each category.'}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {isRu ? 'Последнее обновление: Январь 2026' : 'Last updated: January 2026'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vertical Policies */}
        <h2 className="text-lg font-semibold mb-4">
          {isRu ? 'Условия по категориям' : 'Terms by Category'}
        </h2>
        <div className="space-y-4 mb-8">
          {verticalPolicies.map((vertical, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <vertical.icon className={`h-5 w-5 ${vertical.color}`} />
                  {vertical.title}
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
                {vertical.note && (
                  <p className="text-xs text-muted-foreground italic">
                    💡 {vertical.note}
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
        <div className="space-y-4">
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

        {/* Contact */}
        <Card className="mt-8">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {isRu 
                ? 'Нужна помощь с возвратом? Свяжитесь с поддержкой: support@uno.ae'
                : 'Need help with a refund? Contact support: support@uno.ae'}
            </p>
          </CardContent>
        </Card>
      </PageContainer>
    </AppLayout>
  );
}
