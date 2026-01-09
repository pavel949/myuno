import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { SectionCard } from '@/components/uno/SectionCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { 
  Handshake, TrendingUp, Users, Shield, 
  CheckCircle2, ArrowRight, Building2, Star 
} from 'lucide-react';

export default function PartnersPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const benefits = [
    {
      icon: Users,
      title: isRu ? 'Новые клиенты' : 'New Customers',
      description: isRu 
        ? 'Доступ к тысячам туристов и экспатов, которые ищут услуги на Пхукете'
        : 'Access to thousands of tourists and expats looking for services in Phuket',
    },
    {
      icon: TrendingUp,
      title: isRu ? 'Рост продаж' : 'Sales Growth',
      description: isRu 
        ? 'Увеличьте поток клиентов через удобную систему бронирования'
        : 'Increase customer flow through convenient booking system',
    },
    {
      icon: Shield,
      title: isRu ? 'Доверие' : 'Trust',
      description: isRu 
        ? 'Значок «Проверено UNO» повышает доверие клиентов к вашему бизнесу'
        : 'The "Verified by UNO" badge increases customer trust in your business',
    },
    {
      icon: Star,
      title: isRu ? 'Отзывы' : 'Reviews',
      description: isRu 
        ? 'Собирайте реальные отзывы и улучшайте рейтинг'
        : 'Collect real reviews and improve your rating',
    },
  ];

  const steps = [
    isRu ? 'Заполните заявку на сайте' : 'Fill out the application on the website',
    isRu ? 'Пройдите верификацию бизнеса' : 'Complete business verification',
    isRu ? 'Настройте профиль и услуги' : 'Set up your profile and services',
    isRu ? 'Начните принимать бронирования' : 'Start accepting bookings',
  ];

  const categories = [
    isRu ? 'Недвижимость и аренда' : 'Real Estate & Rental',
    isRu ? 'Транспорт и трансферы' : 'Transport & Transfers',
    isRu ? 'Рестораны и кафе' : 'Restaurants & Cafes',
    isRu ? 'Туры и экскурсии' : 'Tours & Excursions',
    isRu ? 'Медицинские услуги' : 'Medical Services',
    isRu ? 'Спа и красота' : 'Spa & Beauty',
    isRu ? 'Фитнес и спорт' : 'Fitness & Sports',
    isRu ? 'Водные активности' : 'Water Activities',
  ];

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader 
          title={isRu ? 'Для партнёров' : 'For Partners'} 
          showBack 
        />

        {/* Hero */}
        <SectionCard className="text-center bg-primary/5 border-primary/20">
          <Handshake className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="text-xl font-display font-bold mb-2">
            {isRu ? 'Станьте партнёром UNO' : 'Become a UNO Partner'}
          </h1>
          <p className="text-sm text-muted-foreground mb-4">
            {isRu 
              ? 'Присоединяйтесь к платформе и получайте новых клиентов каждый день'
              : 'Join the platform and get new customers every day'}
          </p>
          <Button className="gap-2">
            {isRu ? 'Подать заявку' : 'Apply Now'}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </SectionCard>

        {/* Benefits */}
        <div>
          <h2 className="font-semibold mb-3">{isRu ? 'Преимущества' : 'Benefits'}</h2>
          <div className="grid grid-cols-2 gap-3">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <SectionCard key={index} className="p-4">
                  <Icon className="w-6 h-6 text-primary mb-2" />
                  <h3 className="font-medium text-sm mb-1">{benefit.title}</h3>
                  <p className="text-xs text-muted-foreground">{benefit.description}</p>
                </SectionCard>
              );
            })}
          </div>
        </div>

        {/* How to join */}
        <SectionCard>
          <h2 className="font-semibold mb-4">{isRu ? 'Как стать партнёром' : 'How to Join'}</h2>
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-primary">{index + 1}</span>
                </div>
                <span className="text-sm">{step}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Categories */}
        <SectionCard>
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-5 h-5 text-muted-foreground" />
            <h2 className="font-semibold">{isRu ? 'Категории партнёров' : 'Partner Categories'}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat, index) => (
              <span 
                key={index}
                className="px-3 py-1.5 bg-secondary rounded-full text-xs"
              >
                {cat}
              </span>
            ))}
          </div>
        </SectionCard>

        {/* Requirements */}
        <SectionCard>
          <h2 className="font-semibold mb-3">{isRu ? 'Требования' : 'Requirements'}</h2>
          <div className="space-y-2">
            {[
              isRu ? 'Официальная регистрация бизнеса в Таиланде' : 'Official business registration in Thailand',
              isRu ? 'Необходимые лицензии для вашей деятельности' : 'Required licenses for your activity',
              isRu ? 'Готовность работать по стандартам UNO' : 'Willingness to work by UNO standards',
            ].map((req, index) => (
              <div key={index} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm text-muted-foreground">{req}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Contact */}
        <SectionCard className="text-center">
          <h3 className="font-semibold mb-2">
            {isRu ? 'Есть вопросы?' : 'Have Questions?'}
          </h3>
          <p className="text-sm text-muted-foreground mb-1">
            partners@uno.app
          </p>
          <p className="text-sm text-muted-foreground">
            +66 XX XXX XXXX
          </p>
        </SectionCard>
      </PageContainer>
    </AppLayout>
  );
}