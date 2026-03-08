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
  Loader2, MessageCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
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
      desc: isRu ? 'Русскоязычные экспаты и туристы с высоким чеком' : 'Russian-speaking expats & tourists with high spending',
    },
    {
      icon: Shield,
      title: isRu ? 'Escrow-защита' : 'Escrow Protection',
      desc: isRu ? 'Гарантированная оплата за каждый заказ' : 'Guaranteed payment for every order',
    },
    {
      icon: Zap,
      title: isRu ? 'Заказы без маркетинга' : 'Orders Without Marketing',
      desc: isRu ? 'Мы приводим клиентов — вы оказываете услугу' : 'We bring clients — you deliver the service',
    },
    {
      icon: Globe,
      title: isRu ? 'Мультиязычность' : 'Multilingual',
      desc: isRu ? 'Ваш профиль виден на RU, EN и TH' : 'Your profile is visible in RU, EN & TH',
    },
  ];

  const howItWorks = [
    { step: '1', label: isRu ? 'Регистрация — 2 мин' : 'Register — 2 min', desc: isRu ? 'Имя, категория, телефон' : 'Name, category, phone' },
    { step: '2', label: isRu ? 'Первый листинг' : 'First listing', desc: isRu ? 'Добавьте услугу и цену' : 'Add a service & price' },
    { step: '3', label: isRu ? 'Модерация' : 'Moderation', desc: isRu ? 'Проверим за 24 часа' : 'Reviewed within 24h' },
    { step: '4', label: isRu ? 'Получайте заказы' : 'Get orders', desc: isRu ? 'Клиенты находят вас на платформе' : 'Clients find you on the platform' },
  ];

  const verificationLevels = [
    {
      icon: BadgeCheck,
      level: 'Basic',
      levelRu: 'Базовый',
      color: 'text-muted-foreground',
      bg: 'bg-muted/50',
      border: 'border-muted',
      desc: isRu ? 'Сразу после регистрации' : 'Right after registration',
      perks: isRu 
        ? ['Профиль на платформе', 'Получение заказов']
        : ['Platform profile', 'Receive orders'],
    },
    {
      icon: Shield,
      level: 'Verified',
      levelRu: 'Проверенный',
      color: 'text-primary',
      bg: 'bg-primary/5',
      border: 'border-primary/30',
      desc: isRu ? 'Документы + лицензия' : 'Documents + license',
      perks: isRu 
        ? ['Значок ✓ Проверено', 'Приоритет в поиске', 'Защита G-Trust']
        : ['✓ Verified badge', 'Search priority', 'G-Trust protection'],
    },
    {
      icon: Crown,
      level: 'Premium',
      levelRu: 'Премиум',
      color: 'text-amber-500',
      bg: 'bg-amber-500/5',
      border: 'border-amber-500/30',
      desc: isRu ? 'Рейтинг 4.5+ и 50+ заказов' : 'Rating 4.5+ & 50+ orders',
      perks: isRu 
        ? ['Топ выдачи', 'Сниженная комиссия', 'Персональный менеджер']
        : ['Top ranking', 'Reduced commission', 'Personal manager'],
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
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <div className="relative max-w-2xl mx-auto px-4 pt-12 pb-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Badge variant="secondary" className="mb-4 text-xs px-3 py-1">
              {isRu ? '🚀 Бесплатная регистрация' : '🚀 Free registration'}
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
                ? 'myUNO — маркетплейс для русскоязычных жителей Пхукета. Зарегистрируйтесь за 2 минуты и начните получать заказы.'
                : 'myUNO is a marketplace for Russian-speaking Phuket residents. Register in 2 minutes and start receiving orders.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" onClick={handleStart} className="h-12 text-base font-semibold px-8">
                {isRu ? 'Начать за 2 минуты' : 'Start in 2 minutes'}
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
                  <div className="shrink-0 p-2 rounded-lg bg-primary/10">
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
            <div key={i} className="flex items-center gap-4 p-3 rounded-xl border bg-card">
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
          {isRu ? 'Уровни верификации' : 'Verification Levels'}
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-6">
          {isRu 
            ? 'Чем выше уровень — тем больше заказов и ниже комиссия'
            : 'Higher level = more orders & lower commission'}
        </p>
        <div className="space-y-3">
          {verificationLevels.map((lvl, i) => (
            <Card key={i} className={cn('border', lvl.border)}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className={cn('p-2 rounded-lg', lvl.bg)}>
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
            {[
              { icon: '💰', text: isRu ? 'Комиссия обсуждается индивидуально и фиксируется в договоре' : 'Commission is discussed individually and fixed in the contract' },
              { icon: '⏱', text: isRu ? 'Выплаты каждую пятницу на ваш счёт' : 'Payouts every Friday to your account' },
              { icon: '🔒', text: isRu ? 'Escrow: деньги защищены до завершения услуги' : 'Escrow: money is protected until service completion' },
              { icon: '📊', text: isRu ? 'Прозрачная аналитика: заказы, выручка, рейтинг в реальном времени' : 'Transparent analytics: orders, revenue, rating in real time' },
              { icon: '🆓', text: isRu ? 'Регистрация бесплатна. 0% комиссии в первый месяц' : 'Registration is free. 0% commission in the first month' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-lg shrink-0">{item.icon}</span>
                <p className="text-sm">{item.text}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* Final CTA */}
      <section className="max-w-2xl mx-auto px-4 py-10 text-center">
        <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-2">
              {isRu ? 'Готовы начать?' : 'Ready to start?'}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              {isRu 
                ? 'Регистрация займёт 2 минуты. Первый месяц — без комиссии.'
                : 'Registration takes 2 minutes. First month — no commission.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" onClick={handleStart} className="h-12 text-base font-semibold px-8">
                {isRu ? 'Зарегистрироваться' : 'Register Now'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button size="lg" variant="ghost" className="h-12 text-base" asChild>
                <a href="https://wa.me/66612345678" target="_blank" rel="noopener noreferrer">
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
