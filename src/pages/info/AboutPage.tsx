import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { SectionCard } from '@/components/uno/SectionCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { Shield, Users, Globe, Heart, Award, Target, CheckCircle2, BadgeCheck, ClipboardCheck, FileCheck } from 'lucide-react';

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

  const verificationSteps = [
    {
      icon: ClipboardCheck,
      title: isRu ? 'Проверка документов' : 'Document Verification',
      description: isRu 
        ? 'Лицензии, сертификаты и регистрационные документы'
        : 'Licenses, certificates, and registration documents',
    },
    {
      icon: BadgeCheck,
      title: isRu ? 'Оценка качества' : 'Quality Assessment',
      description: isRu 
        ? 'Соответствие стандартам обслуживания'
        : 'Compliance with service standards',
    },
    {
      icon: FileCheck,
      title: isRu ? 'Аудит безопасности' : 'Safety Audit',
      description: isRu 
        ? 'Проверка соблюдения норм безопасности'
        : 'Safety compliance verification',
    },
    {
      icon: CheckCircle2,
      title: isRu ? 'Постоянный мониторинг' : 'Continuous Monitoring',
      description: isRu 
        ? 'Регулярные проверки и анализ отзывов'
        : 'Regular audits and review analysis',
    },
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
            {isRu ? 'UNO — Дом там, где UNO' : 'UNO — Home is where UNO is'}
          </h1>
          <p className="text-muted-foreground">
            {isRu 
              ? 'Твоя жизнь за рубежом — проще. Мы создаём единую платформу, которая объединяет все необходимые сервисы для комфортной жизни: от аренды жилья до медицинской помощи.'
              : 'Your life abroad, simplified. We create a unified platform that brings together all essential services for comfortable living: from housing rental to medical care.'}
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

        {/* Verification System */}
        <SectionCard className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">{isRu ? 'Система верификации UNO' : 'UNO Verification System'}</h2>
              <p className="text-xs text-muted-foreground">
                {isRu ? 'Основана на лучших мировых практиках' : 'Based on global industry best practices'}
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {isRu 
              ? 'Каждый партнёр проходит многоступенчатую проверку по стандартам, разработанным на основе международных норм качества и безопасности. Мы гарантируем, что все сервисы на платформе соответствуют высочайшим требованиям индустрии.'
              : 'Every partner undergoes a multi-stage verification process according to standards developed based on international quality and safety norms. We guarantee that all services on the platform meet the highest industry requirements.'}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {verificationSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="flex items-start gap-2 p-2 rounded-lg bg-background/50">
                  <Icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-medium">{step.title}</h4>
                    <p className="text-[10px] text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-primary/10 flex items-center gap-2 text-xs text-primary">
            <BadgeCheck className="w-4 h-4" />
            <span className="font-medium">
              {isRu ? 'Только проверенные партнёры получают статус UNO Verified' : 'Only verified partners receive UNO Verified status'}
            </span>
          </div>
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
            <p>📧 assist@myuno.app</p>
            <p>📱 +66 92 240 7355</p>
            <p>📍 Phuket, Thailand</p>
          </div>
        </SectionCard>
      </PageContainer>
    </AppLayout>
  );
}