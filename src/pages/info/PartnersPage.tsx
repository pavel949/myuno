import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { SectionCard } from '@/components/uno/SectionCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Handshake, TrendingUp, Users, Shield, 
  CheckCircle2, ArrowRight, Building2, Star,
  Percent, Clock, BarChart3, MessageSquare,
  Wallet, Globe, Award, Sparkles,
  FileCheck, ClipboardCheck, GraduationCap, Rocket,
  Phone, Mail, ShieldCheck, Crown,
  Car, UtensilsCrossed, Ship, Briefcase
} from 'lucide-react';
import { COMPANY_CONTACTS } from '@/lib/config';

export default function PartnersPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  // Hero Stats
  const heroStats = [
    { value: '500+', label: isRu ? 'Активных партнёров' : 'Active Partners' },
    { value: '15+', label: isRu ? 'Сервисных вертикалей' : 'Service Verticals' },
    { value: '50K+', label: isRu ? 'Обработанных заказов' : 'Orders Processed' },
    { value: '4.8', label: isRu ? 'Средний рейтинг' : 'Average Rating' },
  ];

  // Partnership Types
  const partnershipTypes = [
    {
      icon: Briefcase,
      title: isRu ? 'Service Provider' : 'Service Provider',
      subtitle: isRu ? 'Исполнитель услуг' : 'Service Executor',
      description: isRu 
        ? 'Туры, транспорт, клининг, ремонт, доставка и другие услуги'
        : 'Tours, transport, cleaning, repairs, delivery and other services',
      examples: isRu 
        ? 'Гиды, водители, мастера, курьеры'
        : 'Guides, drivers, craftsmen, couriers',
    },
    {
      icon: Building2,
      title: isRu ? 'Property Owner' : 'Property Owner',
      subtitle: isRu ? 'Владелец недвижимости' : 'Property Owner',
      description: isRu 
        ? 'Сдача вилл, кондо, апартаментов в краткосрочную и долгосрочную аренду'
        : 'Rent villas, condos, apartments for short and long term',
      examples: isRu 
        ? 'Частные владельцы, управляющие компании'
        : 'Private owners, management companies',
    },
    {
      icon: UtensilsCrossed,
      title: isRu ? 'Vendor' : 'Vendor',
      subtitle: isRu ? 'Поставщик товаров' : 'Goods Supplier',
      description: isRu 
        ? 'Рестораны, магазины, цветы, продукты, товары для дома'
        : 'Restaurants, shops, flowers, groceries, home goods',
      examples: isRu 
        ? 'Рестораны, супермаркеты, флористы'
        : 'Restaurants, supermarkets, florists',
    },
    {
      icon: Users,
      title: isRu ? 'Affiliate' : 'Affiliate',
      subtitle: isRu ? 'Реферальный партнёр' : 'Referral Partner',
      description: isRu 
        ? 'Рекомендуйте myUNO и получайте комиссию с каждого заказа'
        : 'Recommend myUNO and earn commission on every order',
      examples: isRu 
        ? 'Блогеры, агенты, отели, комьюнити'
        : 'Bloggers, agents, hotels, communities',
    },
  ];

  // Business Model Highlights (без конкретных процентов)
  const businessHighlights = [
    {
      category: isRu ? 'Недвижимость' : 'Real Estate',
      icon: Building2,
      highlight: isRu ? 'Выгодные условия' : 'Competitive Terms',
      features: [
        isRu ? 'Первый месяц бесплатно' : 'First month free',
        isRu ? 'Нет абонентской платы' : 'No subscription fee',
      ],
    },
    {
      category: isRu ? 'Транспорт' : 'Transport',
      icon: Car,
      highlight: isRu ? 'Гибкие условия' : 'Flexible Terms',
      features: [
        isRu ? 'Бесплатные лиды' : 'Free leads',
        isRu ? 'GPS-интеграция' : 'GPS integration',
      ],
    },
    {
      category: isRu ? 'Туры и активности' : 'Tours & Activities',
      icon: Ship,
      highlight: isRu ? 'Индивидуально' : 'Custom Rates',
      features: [
        isRu ? 'Маркетинговая поддержка' : 'Marketing support',
        isRu ? 'Продвижение в топ' : 'Top promotion',
      ],
    },
    {
      category: isRu ? 'Рестораны и еда' : 'Restaurants & Food',
      icon: UtensilsCrossed,
      highlight: isRu ? 'Гибкие условия' : 'Flexible Terms',
      features: [
        isRu ? 'Нет абонентской платы' : 'No subscription fee',
        isRu ? 'Интеграция с POS' : 'POS integration',
      ],
    },
  ];

  // Onboarding Steps
  const onboardingSteps = [
    {
      step: 1,
      icon: FileCheck,
      title: isRu ? 'Заявка онлайн' : 'Online Application',
      duration: isRu ? '5 минут' : '5 minutes',
      description: isRu 
        ? 'Заполните форму с базовой информацией о вашем бизнесе'
        : 'Fill out the form with basic information about your business',
    },
    {
      step: 2,
      icon: Shield,
      title: isRu ? 'Legal Check' : 'Legal Check',
      duration: isRu ? '1-3 дня' : '1-3 days',
      description: isRu 
        ? 'Проверка документов, лицензий и юридического статуса'
        : 'Verification of documents, licenses and legal status',
    },
    {
      step: 3,
      icon: ClipboardCheck,
      title: isRu ? 'Quality Audit' : 'Quality Audit',
      duration: isRu ? 'При необходимости' : 'If required',
      description: isRu 
        ? 'Оценка качества услуг для премиум-категорий'
        : 'Quality assessment for premium categories',
    },
    {
      step: 4,
      icon: Building2,
      title: isRu ? 'Настройка профиля' : 'Profile Setup',
      duration: isRu ? '30 минут' : '30 minutes',
      description: isRu 
        ? 'Добавьте услуги, фото, цены и расписание'
        : 'Add services, photos, prices and schedule',
    },
    {
      step: 5,
      icon: GraduationCap,
      title: isRu ? 'Обучение' : 'Training',
      duration: isRu ? '1 час' : '1 hour',
      description: isRu 
        ? 'Онлайн-обучение работе с платформой и лучшим практикам'
        : 'Online training on platform and best practices',
    },
    {
      step: 6,
      icon: Rocket,
      title: isRu ? 'Go Live!' : 'Go Live!',
      duration: '',
      description: isRu 
        ? 'Начните получать заказы и зарабатывать'
        : 'Start receiving orders and earning',
    },
  ];

  // Partner Tools
  const partnerTools = [
    {
      icon: BarChart3,
      title: isRu ? 'Dashboard' : 'Dashboard',
      description: isRu ? 'Аналитика и статистика в реальном времени' : 'Real-time analytics and statistics',
    },
    {
      icon: ClipboardCheck,
      title: isRu ? 'Управление заказами' : 'Order Management',
      description: isRu ? 'Все бронирования в одном месте' : 'All bookings in one place',
    },
    {
      icon: MessageSquare,
      title: isRu ? 'Чат с клиентами' : 'Customer Chat',
      description: isRu ? 'Встроенный мессенджер для коммуникации' : 'Built-in messenger for communication',
    },
    {
      icon: Wallet,
      title: isRu ? 'Финансы' : 'Finance',
      description: isRu ? 'Отчёты, выплаты, инвойсы' : 'Reports, payouts, invoices',
    },
    {
      icon: Globe,
      title: isRu ? 'Маркетинг' : 'Marketing',
      description: isRu ? 'Промо-материалы и инструменты продвижения' : 'Promo materials and promotion tools',
    },
    {
      icon: Award,
      title: isRu ? 'Trust Score' : 'Trust Score',
      description: isRu ? 'Отслеживание рейтинга и советы по улучшению' : 'Rating tracking and improvement tips',
    },
  ];

  // Benefits
  const benefits = [
    {
      icon: Users,
      title: isRu ? 'Новые клиенты' : 'New Customers',
      description: isRu 
        ? 'Доступ к тысячам туристов и экспатов, активно ищущих услуги'
        : 'Access to thousands of tourists and expats actively looking for services',
    },
    {
      icon: TrendingUp,
      title: isRu ? 'Рост продаж' : 'Sales Growth',
      description: isRu 
        ? 'Партнёры увеличивают выручку в среднем на 40% за первые 3 месяца'
        : 'Partners increase revenue by 40% on average in the first 3 months',
    },
    {
      icon: ShieldCheck,
      title: isRu ? 'G-Trust Badge' : 'G-Trust Badge',
      description: isRu 
        ? 'Значок верификации повышает конверсию и доверие клиентов'
        : 'Verification badge increases conversion and customer trust',
    },
    {
      icon: Sparkles,
      title: isRu ? 'Маркетинг' : 'Marketing',
      description: isRu 
        ? 'Бесплатное продвижение в соцсетях и рассылках myUNO'
        : 'Free promotion in myUNO social media and newsletters',
    },
  ];

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader 
          title={isRu ? 'Для партнёров' : 'For Partners'} 
          showBack 
        />

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <SectionCard className="text-center bg-gradient-to-br from-primary/10 via-primary/5 to-amber-500/10 border-primary/20">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                <Handshake className="w-8 h-8 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-2xl font-display font-bold mb-2">
              {isRu ? 'Станьте частью экосистемы myUNO' : 'Become Part of the myUNO Ecosystem'}
            </h1>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {isRu 
                ? 'Присоединяйтесь к крупнейшей платформе сервисов на Пхукете и получайте новых клиентов каждый день'
                : 'Join the largest service platform in Phuket and get new customers every day'}
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {heroStats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="bg-background/60 rounded-xl p-3"
                >
                  <div className="text-xl font-bold text-primary">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </div>

            <Link to="/vendor/onboarding">
              <Button size="lg" className="gap-2">
                {isRu ? 'Подать заявку' : 'Apply Now'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </SectionCard>
        </motion.div>

        {/* Benefits */}
        <div>
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Star className="w-5 h-5 text-accent-amber" />
            {isRu ? 'Преимущества партнёрства' : 'Partnership Benefits'}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <SectionCard className="h-full">
                    <Icon className="w-6 h-6 text-primary mb-2" />
                    <h3 className="font-medium text-sm mb-1">{benefit.title}</h3>
                    <p className="text-xs text-muted-foreground">{benefit.description}</p>
                  </SectionCard>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Partnership Types */}
        <div>
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            {isRu ? 'Типы партнёрства' : 'Partnership Types'}
          </h2>
          <div className="space-y-3">
            {partnershipTypes.map((type, index) => {
              const Icon = type.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <SectionCard>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm">{type.title}</h3>
                          <span className="text-xs text-muted-foreground">• {type.subtitle}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">{type.description}</p>
                        <p className="text-xs text-primary">{type.examples}</p>
                      </div>
                    </div>
                  </SectionCard>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Business Model - без конкретных процентов */}
        <div>
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Handshake className="w-5 h-5 text-success" />
            {isRu ? 'Бизнес-модель' : 'Business Model'}
          </h2>
          <SectionCard className="mb-4">
            <p className="text-sm text-muted-foreground mb-3">
              {isRu 
                ? 'Мы предлагаем индивидуальные условия сотрудничества для каждой категории партнёров. Комиссия обсуждается лично и зависит от объёма, категории услуг и уровня верификации.'
                : 'We offer individual partnership terms for each category. Commission is discussed personally and depends on volume, service category, and verification level.'}
            </p>
            <Link to="/vendor/onboarding">
              <Button variant="outline" size="sm" className="gap-2">
                {isRu ? 'Узнать условия' : 'Get Terms'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </SectionCard>
          <div className="grid grid-cols-2 gap-3">
            {businessHighlights.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <SectionCard className="h-full">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-5 h-5 text-muted-foreground" />
                      <span className="text-xs font-medium">{item.category}</span>
                    </div>
                    <div className="text-lg font-semibold text-primary mb-2">{item.highlight}</div>
                    <div className="space-y-1">
                      {item.features.map((feature, fIndex) => (
                        <div key={fIndex} className="flex items-center gap-1 text-xs text-muted-foreground">
                          <CheckCircle2 className="w-3 h-3 text-success" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Onboarding Process */}
        <SectionCard>
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Rocket className="w-5 h-5 text-primary" />
            {isRu ? 'Процесс онбординга' : 'Onboarding Process'}
          </h2>
          <div className="space-y-4">
            {onboardingSteps.map((step, index) => {
              const Icon = step.icon;
              const isLast = index === onboardingSteps.length - 1;
              return (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isLast ? 'bg-success text-white' : 'bg-primary/10'
                      }`}>
                        <Icon className={`w-5 h-5 ${isLast ? '' : 'text-primary'}`} />
                      </div>
                      {!isLast && (
                        <div className="w-0.5 h-6 bg-border mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-sm">{step.title}</h3>
                        {step.duration && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {step.duration}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </SectionCard>

        {/* Partner Tools */}
        <div>
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            {isRu ? 'Инструменты партнёра' : 'Partner Tools'}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {partnerTools.map((tool, index) => {
              const Icon = tool.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <SectionCard className="text-center h-full">
                    <Icon className="w-6 h-6 text-primary mx-auto mb-2" />
                    <h3 className="font-medium text-xs mb-1">{tool.title}</h3>
                    <p className="text-[10px] text-muted-foreground">{tool.description}</p>
                  </SectionCard>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* G-Trust Badge */}
        <SectionCard className="bg-gradient-to-br from-accent-amber/10 to-warning/5 border-accent-amber/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-amber to-accent-amber/80 flex items-center justify-center flex-shrink-0">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">
                {isRu ? 'Получите G-Trust Badge' : 'Get G-Trust Badge'}
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                {isRu 
                  ? 'Пройдите полную верификацию и получите знак доверия, который повышает конверсию на 35%'
                  : 'Complete full verification and get a trust badge that increases conversion by 35%'}
              </p>
              <Link to="/g-trust">
                <Button variant="outline" size="sm" className="gap-1">
                  {isRu ? 'Подробнее о G-Trust' : 'Learn about G-Trust'}
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </div>
        </SectionCard>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <SectionCard className="text-center bg-gradient-to-br from-primary/10 to-primary/5">
            <h3 className="text-lg font-semibold mb-2">
              {isRu ? 'Готовы начать?' : 'Ready to Start?'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {isRu 
                ? 'Присоединяйтесь к сотням успешных партнёров myUNO'
                : 'Join hundreds of successful myUNO partners'}
            </p>
            <Link to="/vendor/onboarding">
              <Button size="lg" className="gap-2">
                {isRu ? 'Стать партнёром' : 'Become a Partner'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </SectionCard>
        </motion.div>

        {/* Contact Section */}
        <SectionCard>
          <h3 className="font-semibold mb-3 text-center">
            {isRu ? 'Контакты для партнёров' : 'Partner Contacts'}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <Mail className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">{isRu ? 'Email' : 'Email'}</p>
                <p className="text-sm font-medium">{COMPANY_CONTACTS.email.partners}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <Phone className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">{isRu ? 'Телефон' : 'Phone'}</p>
                <p className="text-sm font-medium">{COMPANY_CONTACTS.phone.display}</p>
              </div>
            </div>
          </div>
        </SectionCard>
      </PageContainer>
    </AppLayout>
  );
}
