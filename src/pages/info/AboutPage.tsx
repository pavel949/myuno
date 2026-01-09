import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { SectionCard } from '@/components/uno/SectionCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { Shield, Users, Globe, Heart, Award, Target } from 'lucide-react';

export default function AboutPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const values = [
    {
      icon: Shield,
      title: isRu ? 'Доверие' : 'Trust',
      description: isRu 
        ? 'Каждый партнёр проходит проверку качества и надёжности'
        : 'Every partner is verified for quality and reliability',
    },
    {
      icon: Users,
      title: isRu ? 'Сообщество' : 'Community',
      description: isRu 
        ? 'Объединяем туристов, экспатов и местных жителей'
        : 'Connecting tourists, expats and locals',
    },
    {
      icon: Globe,
      title: isRu ? 'Доступность' : 'Accessibility',
      description: isRu 
        ? 'Все сервисы на русском и английском языках'
        : 'All services in Russian and English',
    },
    {
      icon: Heart,
      title: isRu ? 'Забота' : 'Care',
      description: isRu 
        ? 'Поддержка 24/7 и помощь в любой ситуации'
        : '24/7 support and help in any situation',
    },
  ];

  const stats = [
    { value: '500+', label: isRu ? 'Партнёров' : 'Partners' },
    { value: '50K+', label: isRu ? 'Пользователей' : 'Users' },
    { value: '100K+', label: isRu ? 'Бронирований' : 'Bookings' },
    { value: '4.8', label: isRu ? 'Рейтинг' : 'Rating' },
  ];

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader 
          title={isRu ? 'О нас' : 'About Us'} 
          showBack 
        />

        {/* Hero */}
        <SectionCard className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Target className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-display font-bold mb-3">
            {isRu ? 'UNO — Инфраструктура для жизни' : 'UNO — Infrastructure for Living'}
          </h1>
          <p className="text-muted-foreground">
            {isRu 
              ? 'Мы создаём единую платформу, которая объединяет все необходимые сервисы для комфортной жизни на Пхукете: от аренды жилья до медицинской помощи.'
              : 'We create a unified platform that brings together all essential services for comfortable living in Phuket: from housing rental to medical care.'}
          </p>
        </SectionCard>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          {stats.map((stat, index) => (
            <SectionCard key={index} className="text-center p-3">
              <div className="text-xl font-bold text-primary">{stat.value}</div>
              <div className="text-[10px] text-muted-foreground">{stat.label}</div>
            </SectionCard>
          ))}
        </div>

        {/* Mission */}
        <SectionCard>
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">{isRu ? 'Наша миссия' : 'Our Mission'}</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {isRu 
              ? 'Сделать жизнь на Пхукете простой и безопасной для каждого. Мы тщательно отбираем партнёров, проверяем качество услуг и гарантируем честные цены. UNO — это не просто приложение, это ваш надёжный помощник в новой стране.'
              : 'Make life in Phuket simple and safe for everyone. We carefully select partners, verify service quality and guarantee fair prices. UNO is not just an app, it is your reliable assistant in a new country.'}
          </p>
        </SectionCard>

        {/* Values */}
        <div>
          <h2 className="font-semibold mb-3">{isRu ? 'Наши ценности' : 'Our Values'}</h2>
          <div className="grid grid-cols-2 gap-3">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <SectionCard key={index} className="p-4">
                  <Icon className="w-6 h-6 text-primary mb-2" />
                  <h3 className="font-medium text-sm mb-1">{value.title}</h3>
                  <p className="text-xs text-muted-foreground">{value.description}</p>
                </SectionCard>
              );
            })}
          </div>
        </div>

        {/* Contact */}
        <SectionCard>
          <h2 className="font-semibold mb-2">{isRu ? 'Связаться с нами' : 'Contact Us'}</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>📧 support@uno.app</p>
            <p>📱 +66 XX XXX XXXX</p>
            <p>📍 Phuket, Thailand</p>
          </div>
        </SectionCard>
      </PageContainer>
    </AppLayout>
  );
}