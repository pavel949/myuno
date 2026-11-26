/**
 * VendorLanding — pre-onboarding page for supplier outreach.
 * Explains conditions, benefits, verification levels, and leads to the wizard.
 */
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserContext } from '@/hooks/useUserContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, CheckCircle2, Users, Shield, Zap, Globe, 
  Star, Clock, TrendingUp, BadgeCheck, Crown, Award,
  Loader2, MessageCircle, Rocket, Wallet, Lock, BarChart3, Gift,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getWhatsAppUrl } from '@/lib/config/contacts';
import { motion } from 'framer-motion';

export default function VendorLanding() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { vendorOrgs, isLoading: contextLoading } = useUserContext();
  const isRu = language === 'ru';

  // Already a vendor — redirect
  React.useEffect(() => {
    if (!contextLoading && vendorOrgs.length > 0) navigate('/vendor');
  }, [vendorOrgs, contextLoading, navigate]);

  const handleStart = () => {
    if (!user) {
      navigate('/auth?redirect=/vendor/onboarding');
    } else {
      navigate('/vendor/onboarding');
    }
  };

  const benefits = [
    {
      icon: Users,
      title: isRu ? 'Платёжеспособная аудитория' : 'Premium Audience',
      desc: isRu ? 'Иностранные экспаты и туристы с высоким чеком (EN/RU/TH)' : 'International expats & tourists with high spending (EN/RU/TH)',
    },
    {
      icon: Shield,
      title: isRu ? 'Понятные условия' : 'Clear terms',
      desc: isRu ? 'Условия оплаты и расчётов согласуются для выбранной услуги' : 'Payment and settlement terms are agreed for the selected service',
    },
    {
      icon: Zap,
      title: isRu ? 'Заявки с платформы' : 'Platform enquiries',
      desc: isRu ? 'Отвечайте на запросы клиентов по опубликованным услугам' : 'Respond to customer enquiries about published services',
    },
    {
      icon: Globe,
      title: isRu ? 'Мультиязычность' : 'Multilingual',
      desc: isRu ? 'Подготовьте описание услуги для нужных языков' : 'Prepare your service description in the languages you need',
    },
  ];

  const howItWorks = [
    { step: '1', label: isRu ? 'Регистрация' : 'Registration', desc: isRu ? 'Имя, категория, телефон' : 'Name, category, phone' },
    { step: '2', label: isRu ? 'Первый листинг' : 'First listing', desc: isRu ? 'Добавьте услугу и цену' : 'Add a service & price' },
    { step: '3', label: isRu ? 'Модерация' : 'Moderation', desc: isRu ? 'Проверка данных перед публикацией' : 'Details are reviewed before publication' },
    { step: '4', label: isRu ? 'Получайте заказы' : 'Get orders', desc: isRu ? 'Клиенты находят вас на платформе' : 'Clients find you on the platform' },
  ];

  const verificationLevels = [
    {
      icon: BadgeCheck,
      level: 'Profile',
      levelRu: 'Профиль',
      color: 'text-muted-foreground',
      bg: 'bg-muted/50',
      border: 'border-muted',
      desc: isRu ? 'Данные компании и контакты' : 'Company and contact details',
      perks: isRu 
        ? ['Описание компании', 'Контакты для связи']
        : ['Company description', 'Contact details'],
    },
    {
      icon: Shield,
      level: 'Review',
      levelRu: 'Проверка',
      color: 'text-primary',
      bg: 'bg-primary/5',
      border: 'border-primary/30',
      desc: isRu ? 'Документы + лицензия' : 'Documents + license',
      perks: isRu 
        ? ['Документы компании', 'Условия оказания услуг']
        : ['Company documents', 'Service terms'],
    },
    {
      icon: Crown,
      level: 'Services',
      levelRu: 'Услуги',
      color: 'text-accent',
      bg: 'bg-accent/5',
      border: 'border-accent/40',
      desc: isRu ? 'Описание, цена и порядок подтверждения' : 'Description, price and confirmation process',
      perks: isRu 
        ? ['Категория услуги', 'Согласованные условия']
        : ['Service category', 'Agreed terms'],
    },
  ];

  if (authLoading || contextLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="relative max-w-2xl mx-auto px-4 pt-12 pb-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Badge variant="secondary" className="mb-4 text-xs px-3 py-1 inline-flex items-center gap-1.5">
              <Rocket className="h-3.5 w-3.5" strokeWidth={1.75} />
              {isRu ? 'Бесплатная регистрация' : 'Free registration'}
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              {isRu ? 'Продавайте услуги' : 'Sell your services'}
              <br />
              <span className="text-primary">
                {isRu ? 'премиум-аудитории' : 'to a premium audience'}
              </span>
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-md mx-auto mb-6">
              {isRu 
                ? 'myUNO — маркетплейс для иностранных жителей и гостей Пхукета (EN/RU/TH). Подготовьте профиль и услуги для проверки перед публикацией.'
                : 'myUNO is a marketplace for international residents and visitors of Phuket (EN/RU/TH). Prepare your profile and services for review before publication.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" onClick={handleStart} className="h-12 text-base font-semibold px-8">
                {isRu ? 'Подать заявку' : 'Apply to join'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button size="lg" variant="outline" asChild className="h-12 text-base">
                <Link to="/partner-agreement">
                  {isRu ? 'Условия партнёрства' : 'Partnership terms'}
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="max-w-2xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold text-center mb-6">
          {isRu ? 'Почему партнёры выбирают myUNO' : 'Why partners choose myUNO'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {benefits.map((b, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
            >
              <Card className="h-full">
                <CardContent className="p-4 flex gap-3">
                  <div className="shrink-0 p-2 rounded-none bg-primary/10">
                    <b.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{b.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{b.desc}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-2xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold text-center mb-6">
          {isRu ? 'Как это работает' : 'How it works'}
        </h2>
        <div className="space-y-3">
          {howItWorks.map((item, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-md border bg-card">
              <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                {item.step}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              {i < howItWorks.length - 1 && (
                <ArrowRight className="h-4 w-4 text-muted-foreground/50 shrink-0 hidden sm:block" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Verification Levels */}
      <section className="max-w-2xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold text-center mb-2">
          {isRu ? 'Подготовка к публикации' : 'Prepare for publication'}
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-6">
          {isRu 
            ? 'Подготовьте данные компании и услуги. Доступные возможности зависят от проверки и согласованных условий.'
            : 'Prepare company and service details. Available capabilities depend on review and agreed terms.'}
        </p>
        <div className="space-y-3">
          {verificationLevels.map((lvl, i) => (
            <Card key={i} className={cn('border', lvl.border)}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className={cn('p-2 rounded-none', lvl.bg)}>
                    <lvl.icon className={cn('h-5 w-5', lvl.color)} />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{isRu ? lvl.levelRu : lvl.level}</p>
                    <p className="text-xs text-muted-foreground">{lvl.desc}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {lvl.perks.map((perk, j) => (
                    <Badge key={j} variant="secondary" className="text-[10px] font-normal">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {perk}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Key Conditions — simplified */}
      <section className="max-w-2xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold text-center mb-6">
          {isRu ? 'Ключевые условия' : 'Key Conditions'}
        </h2>
        <Card>
          <CardContent className="p-5 space-y-3">
            {([
              { Icon: Wallet, text: isRu ? 'Комиссия обсуждается индивидуально и фиксируется в договоре' : 'Commission is discussed individually and fixed in the contract' },
              { Icon: Clock, text: isRu ? 'Порядок и сроки расчётов согласуются при подключении' : 'Settlement process and timing are agreed during onboarding' },
              { Icon: Lock, text: isRu ? 'Способ оплаты зависит от услуги и подтверждённых условий заказа' : 'Payment method depends on the service and confirmed order terms' },
              { Icon: BarChart3, text: isRu ? 'Прозрачная аналитика: заказы, выручка, рейтинг в реальном времени' : 'Transparent analytics: orders, revenue, rating in real time' },
              { Icon: Gift, text: isRu ? 'Условия подключения и комиссии фиксируются до начала работы' : 'Onboarding terms and commission are agreed before work begins' },
            ] as { Icon: LucideIcon; text: string }[]).map(({ Icon, text }, i) => (
              <div key={i} className="flex items-start gap-3">
                <Icon className="h-5 w-5 shrink-0 text-primary mt-0.5" strokeWidth={1.75} />
                <p className="text-sm">{text}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* Final CTA */}
      <section className="max-w-2xl mx-auto px-4 py-10 text-center">
        <Card className="border-primary/20">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-2">
              {isRu ? 'Готовы начать?' : 'Ready to start?'}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              {isRu 
                ? 'Подготовьте данные компании и услуг. Обсудим условия подключения.'
                : 'Prepare company and service details. We will discuss onboarding terms.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" onClick={handleStart} className="h-12 text-base font-semibold px-8">
                {isRu ? 'Зарегистрироваться' : 'Register Now'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button size="lg" variant="ghost" className="h-12 text-base" asChild>
                <a href={getWhatsAppUrl()} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {isRu ? 'Задать вопрос' : 'Ask a question'}
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
        <p className="text-xs text-muted-foreground mt-4">
          {isRu 
            ? 'Нажимая кнопку, вы соглашаетесь с ' 
            : 'By clicking, you agree to the '}
          <Link to="/partner-agreement" className="underline hover:text-foreground">
            {isRu ? 'условиями партнёрства' : 'partnership terms'}
          </Link>
        </p>
      </section>
    </div>
  );
}
