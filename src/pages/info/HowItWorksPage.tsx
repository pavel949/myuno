import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { SectionCard } from '@/components/uno/SectionCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { Search, Shield, CreditCard, Star, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function HowItWorksPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const steps = [
    {
      icon: Search,
      number: '01',
      title: isRu ? 'Найдите сервис' : 'Find a Service',
      description: isRu 
        ? 'Выберите категорию: жильё, транспорт, туры, медицина или другие услуги. Используйте фильтры и поиск.'
        : 'Choose a category: housing, transport, tours, medical or other services. Use filters and search.',
    },
    {
      icon: Shield,
      number: '02',
      title: isRu ? 'Проверьте партнёра' : 'Check the Partner',
      description: isRu 
        ? 'Все партнёры проходят верификацию. Читайте реальные отзывы и смотрите рейтинги.'
        : 'All partners are verified. Read real reviews and check ratings.',
    },
    {
      icon: CreditCard,
      number: '03',
      title: isRu ? 'Забронируйте' : 'Book It',
      description: isRu 
        ? 'Оформите бронирование онлайн. Оплатите удобным способом: карта, наличные или через кошелёк UNO.'
        : 'Book online. Pay conveniently: card, cash or via UNO wallet.',
    },
    {
      icon: Star,
      number: '04',
      title: isRu ? 'Получите услугу' : 'Get the Service',
      description: isRu 
        ? 'Получите услугу и оставьте отзыв. Зарабатывайте кэшбек и бонусы за активность.'
        : 'Receive the service and leave a review. Earn cashback and bonuses for activity.',
    },
  ];

  const benefits = [
    isRu ? 'Проверенные партнёры с реальными отзывами' : 'Verified partners with real reviews',
    isRu ? 'Честные цены без скрытых комиссий' : 'Fair prices with no hidden fees',
    isRu ? 'Поддержка на русском и английском 24/7' : 'Support in Russian and English 24/7',
    isRu ? 'Безопасные платежи и возврат средств' : 'Secure payments and refunds',
    isRu ? 'Кэшбек и бонусы за каждое бронирование' : 'Cashback and bonuses for every booking',
    isRu ? 'SOS-кнопка для экстренных ситуаций' : 'SOS button for emergencies',
  ];

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader 
          title={isRu ? 'Как это работает' : 'How It Works'} 
          showBack 
        />

        {/* Intro */}
        <SectionCard className="text-center">
          <h1 className="text-xl font-display font-bold mb-2">
            {isRu ? 'Всё просто!' : 'It is Simple!'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isRu 
              ? 'UNO объединяет все сервисы Пхукета в одном приложении. Найдите, забронируйте и получите услугу за несколько минут.'
              : 'UNO brings together all Phuket services in one app. Find, book and get service in minutes.'}
          </p>
        </SectionCard>

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="relative">
                <SectionCard className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-primary">{step.number}</span>
                      <h3 className="font-semibold">{step.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </SectionCard>
                {index < steps.length - 1 && (
                  <div className="absolute left-6 top-full h-4 w-px bg-border" />
                )}
              </div>
            );
          })}
        </div>

        {/* Benefits */}
        <SectionCard>
          <h2 className="font-semibold mb-4">{isRu ? 'Преимущества UNO' : 'UNO Benefits'}</h2>
          <div className="space-y-3">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm">{benefit}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* CTA */}
        <SectionCard className="text-center bg-primary/5 border-primary/20">
          <h2 className="font-semibold mb-2">
            {isRu ? 'Готовы начать?' : 'Ready to Start?'}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            {isRu 
              ? 'Выберите категорию на главной странице и найдите нужный сервис'
              : 'Choose a category on the main page and find the service you need'}
          </p>
          <a 
            href="/" 
            className="inline-flex items-center gap-2 text-primary font-medium text-sm"
          >
            {isRu ? 'Перейти на главную' : 'Go to Home'}
            <ArrowRight className="w-4 h-4" />
          </a>
        </SectionCard>
      </PageContainer>
    </AppLayout>
  );
}