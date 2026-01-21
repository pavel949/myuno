import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, TrendingUp, Shield, CalendarCheck, Users, 
  Headphones, CheckCircle, ArrowRight, Camera, 
  BarChart3, Globe, Wrench, Clock, Star, Sparkles
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { PremiumButton } from '@/components/uno/PremiumButton';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const ownerBenefits = [
  {
    icon: Building2,
    titleEn: 'Unified Dashboard',
    titleRu: 'Единый кабинет',
    descEn: 'Manage all your properties from one place',
    descRu: 'Управляйте всеми объектами из одного места'
  },
  {
    icon: TrendingUp,
    titleEn: 'Smart Pricing',
    titleRu: 'Умное ценообразование',
    descEn: 'AI-powered dynamic pricing for maximum revenue',
    descRu: 'Динамическое ценообразование на основе ИИ'
  },
  {
    icon: CalendarCheck,
    titleEn: 'Booking Calendar',
    titleRu: 'Календарь бронирований',
    descEn: 'Sync with Airbnb, Booking.com and more',
    descRu: 'Синхронизация с Airbnb, Booking.com и др.'
  },
  {
    icon: BarChart3,
    titleEn: 'Financial Reports',
    titleRu: 'Финансовая отчётность',
    descEn: 'Track income, expenses and profitability',
    descRu: 'Отслеживайте доходы, расходы и прибыльность'
  },
  {
    icon: Camera,
    titleEn: 'Professional Content',
    titleRu: 'Профессиональный контент',
    descEn: 'Photography and descriptions that sell',
    descRu: 'Фотографии и описания, которые продают'
  },
  {
    icon: Headphones,
    titleEn: '24/7 Support',
    titleRu: 'Поддержка 24/7',
    descEn: 'Dedicated support team for you and your guests',
    descRu: 'Выделенная команда поддержки для вас и гостей'
  }
];

const ukBenefits = [
  {
    icon: Users,
    titleEn: 'Portfolio Management',
    titleRu: 'Управление портфелем',
    descEn: 'Scale your property management business',
    descRu: 'Масштабируйте бизнес по управлению недвижимостью'
  },
  {
    icon: Globe,
    titleEn: 'OTA Integration',
    titleRu: 'Интеграция с OTA',
    descEn: 'iCal and API sync with all major platforms',
    descRu: 'iCal и API синхронизация со всеми платформами'
  },
  {
    icon: Wrench,
    titleEn: 'Service Coordination',
    titleRu: 'Координация сервисов',
    descEn: 'Cleaning, maintenance and guest services',
    descRu: 'Уборка, обслуживание и сервисы для гостей'
  },
  {
    icon: Clock,
    titleEn: 'Auto Check-in/out',
    titleRu: 'Авто заезд/выезд',
    descEn: 'Self-service guest onboarding',
    descRu: 'Самостоятельная регистрация гостей'
  }
];

const collaborationOptions = [
  {
    type: 'self',
    badgeEn: 'Free',
    badgeRu: 'Бесплатно',
    titleEn: 'Self Management',
    titleRu: 'Самостоятельное управление',
    descEn: 'Free access to all tools. You handle bookings, cleaning and guests.',
    descRu: 'Бесплатный доступ к инструментам. Вы сами управляете бронированиями и гостями.',
    priceEn: '0%',
    priceRu: '0%',
    features: ['dashboard', 'calendar', 'reports']
  },
  {
    type: 'full',
    badgeEn: 'Popular',
    badgeRu: 'Популярно',
    titleEn: 'UNO Full Management',
    titleRu: 'Полное управление UNO',
    descEn: 'We handle everything. You receive 70% after expenses.',
    descRu: 'Мы берём всё на себя. Вы получаете 70% после расходов.',
    priceEn: '70/30',
    priceRu: '70/30',
    features: ['everything', 'cleaning', 'guests', 'maintenance', 'pricing']
  },
  {
    type: 'hybrid',
    badgeEn: 'Flexible',
    badgeRu: 'Гибко',
    titleEn: 'Hybrid Model',
    titleRu: 'Гибридный формат',
    descEn: 'Choose specific services. Pay only for what you need.',
    descRu: 'Выберите нужные услуги. Платите только за то, что используете.',
    priceEn: 'custom',
    priceRu: 'индивидуально',
    features: ['selective', 'cleaning', 'checkin']
  }
];

const stats = [
  { valueEn: '500+', valueRu: '500+', labelEn: 'Properties', labelRu: 'Объектов' },
  { valueEn: '4.9', valueRu: '4.9', labelEn: 'Avg Rating', labelRu: 'Средний рейтинг' },
  { valueEn: '95%', valueRu: '95%', labelEn: 'Occupancy', labelRu: 'Заполняемость' },
  { valueEn: '24/7', valueRu: '24/7', labelEn: 'Support', labelRu: 'Поддержка' }
];

export default function OwnerLanding() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  const handleListProperty = () => {
    if (user) {
      navigate('/owner/properties/new');
    } else {
      navigate('/auth?redirect=/owner/properties/new');
    }
  };

  const handleFullManagement = () => {
    navigate('/owner/full-management');
  };

  const handleGoToDashboard = () => {
    navigate('/owner');
  };

  return (
    <AppLayout showFooter>
      <PageContainer>
        <PageHeader 
          title={isRu ? 'Для собственников' : 'For Property Owners'}
          showBack
        />

        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8 px-4"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
            <Shield className="w-3.5 h-3.5" />
            {isRu ? 'Проверенная платформа' : 'Trusted Platform'}
          </div>
          
          <h1 className="text-3xl font-bold mb-3">
            {isRu 
              ? 'Управляйте недвижимостью эффективнее с ' 
              : 'Manage Your Property Smarter with '}
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">UNO</span>
          </h1>
          
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            {isRu 
              ? 'Единая платформа для владельцев недвижимости и управляющих компаний. Бронирования, финансы, сервисы — всё в одном месте.'
              : 'The all-in-one platform for property owners and managers. Bookings, finances, services — all in one place.'}
          </p>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + i * 0.1 }}
                className="text-center p-3 rounded-xl bg-card border border-border/50"
              >
                <div className="text-xl font-bold text-primary">
                  {isRu ? stat.valueRu : stat.valueEn}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {isRu ? stat.labelRu : stat.labelEn}
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-3">
            <PremiumButton 
              size="lg" 
              className="w-full"
              onClick={handleListProperty}
            >
              <Building2 className="w-5 h-5 mr-2" />
              {isRu ? 'Разместить объект' : 'List Your Property'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </PremiumButton>
            
            {user && (
              <PremiumButton 
                variant="outline" 
                size="lg" 
                className="w-full"
                onClick={handleGoToDashboard}
              >
                {isRu ? 'В личный кабинет' : 'Go to Dashboard'}
              </PremiumButton>
            )}
          </div>
        </motion.section>

        {/* Owner Benefits */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="py-6"
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-primary" />
            {isRu ? 'Преимущества для собственников' : 'Benefits for Owners'}
          </h2>
          
          <div className="grid grid-cols-2 gap-3">
            {ownerBenefits.map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
              >
                <Card className="p-4 h-full hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-3">
                    <benefit.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-medium text-sm mb-1">
                    {isRu ? benefit.titleRu : benefit.titleEn}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {isRu ? benefit.descRu : benefit.descEn}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* UK Benefits */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="py-6"
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            {isRu ? 'Для управляющих компаний' : 'For Property Managers'}
          </h2>
          
          <div className="grid grid-cols-2 gap-3">
            {ukBenefits.map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.05 }}
              >
                <Card className="p-4 h-full bg-gradient-to-br from-teal-500/5 to-emerald-500/5 border-teal-500/20 hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500/20 to-emerald-500/10 flex items-center justify-center mb-3">
                    <benefit.icon className="w-5 h-5 text-teal-600" />
                  </div>
                  <h3 className="font-medium text-sm mb-1">
                    {isRu ? benefit.titleRu : benefit.titleEn}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {isRu ? benefit.descRu : benefit.descEn}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Collaboration Options */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="py-6"
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {isRu ? 'Варианты сотрудничества' : 'Collaboration Options'}
          </h2>
          
          <div className="space-y-3">
            {collaborationOptions.map((option, i) => (
              <motion.div
                key={option.type}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + i * 0.1 }}
              >
                <Card 
                  className={`p-4 cursor-pointer hover:shadow-md transition-all ${
                    option.type === 'full' 
                      ? 'border-primary/50 bg-gradient-to-br from-primary/5 to-primary/10' 
                      : ''
                  }`}
                  onClick={option.type === 'full' ? handleFullManagement : handleListProperty}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <Badge 
                        variant={option.type === 'full' ? 'default' : 'secondary'}
                        className="mb-2"
                      >
                        {isRu ? option.badgeRu : option.badgeEn}
                      </Badge>
                      <h3 className="font-semibold">
                        {isRu ? option.titleRu : option.titleEn}
                      </h3>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary">
                        {isRu ? option.priceRu : option.priceEn}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {option.type === 'full' 
                          ? (isRu ? 'вам / нам' : 'you / us')
                          : (isRu ? 'комиссия' : 'commission')}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {isRu ? option.descRu : option.descEn}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                    {option.features.slice(0, 3).join(' • ')}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Full Management CTA */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.85 }}
          className="py-6"
        >
          <Card className="p-5 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border-amber-500/30">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20">
                <Sparkles className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg">
                  {isRu ? 'Хотите пассивный доход?' : 'Want Passive Income?'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isRu ? 'Полное управление от myUNO' : 'Full management by myUNO'}
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {isRu 
                ? 'Мы возьмём всё на себя: гостей, уборку, обслуживание, отчётность. Вы получаете 70% после расходов.'
                : 'We handle everything: guests, cleaning, maintenance, reporting. You receive 70% after expenses.'}
            </p>
            <PremiumButton 
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              onClick={handleFullManagement}
            >
              {isRu ? 'Оставить заявку на управление' : 'Request Full Management'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </PremiumButton>
          </Card>
        </motion.section>

        {/* Final CTA */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.95 }}
          className="py-8"
        >
          <Card className="p-6 text-center bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
            <h2 className="text-xl font-bold mb-2">
              {isRu ? 'Готовы начать?' : 'Ready to Start?'}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              {isRu 
                ? 'Разместите объект бесплатно и начните получать бронирования уже сегодня'
                : 'List your property for free and start receiving bookings today'}
            </p>
            <PremiumButton 
              size="lg" 
              className="w-full"
              onClick={handleListProperty}
            >
              {isRu ? 'Разместить объект бесплатно' : 'List Property for Free'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </PremiumButton>
          </Card>
        </motion.section>
      </PageContainer>
    </AppLayout>
  );
}
