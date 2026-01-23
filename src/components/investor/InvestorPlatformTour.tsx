import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Building2, ShoppingCart, Home, Ship, Car, Utensils, Heart,
  Scale, Shield, Smartphone, Globe, CreditCard, MessageSquare, Bell,
  BarChart3, Wallet, Star, ChevronRight, ChevronLeft, Play, CheckCircle2,
  Sparkles, MapPin, Clock, Headphones, FileCheck, TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface TourStep {
  id: string;
  title: string;
  titleRu: string;
  description: string;
  descriptionRu: string;
  icon: React.ElementType;
  color: string;
  features: { label: string; labelRu: string; icon: React.ElementType }[];
  screenshot?: string;
}

const tourSteps: TourStep[] = [
  {
    id: 'discovery',
    title: 'Service Discovery',
    titleRu: 'Поиск услуг',
    description: 'Users browse 15+ service categories from transport to legal services, all in one place.',
    descriptionRu: 'Пользователи просматривают 15+ категорий услуг от транспорта до юридических, всё в одном месте.',
    icon: Globe,
    color: 'bg-blue-500',
    features: [
      { label: '15+ Verticals', labelRu: '15+ вертикалей', icon: Sparkles },
      { label: 'Smart Search', labelRu: 'Умный поиск', icon: Globe },
      { label: 'Map View', labelRu: 'Вид на карте', icon: MapPin },
      { label: 'Filters & Sort', labelRu: 'Фильтры', icon: BarChart3 },
    ],
  },
  {
    id: 'booking',
    title: 'Unified Booking',
    titleRu: 'Единое бронирование',
    description: 'Book yachts, properties, tours, restaurants, medical services and more with a consistent UX.',
    descriptionRu: 'Бронируйте яхты, недвижимость, туры, рестораны, медицинские услуги с единым UX.',
    icon: ShoppingCart,
    color: 'bg-green-500',
    features: [
      { label: 'Instant Booking', labelRu: 'Мгновенное бронирование', icon: Clock },
      { label: 'Secure Payments', labelRu: 'Безопасные платежи', icon: CreditCard },
      { label: 'In-App Chat', labelRu: 'Чат в приложении', icon: MessageSquare },
      { label: 'Notifications', labelRu: 'Уведомления', icon: Bell },
    ],
  },
  {
    id: 'vendor',
    title: 'Vendor Dashboard',
    titleRu: 'Панель партнёра',
    description: 'Service providers manage bookings, track revenue, and grow their business with analytics.',
    descriptionRu: 'Провайдеры управляют бронированиями, отслеживают доход и развивают бизнес.',
    icon: Building2,
    color: 'bg-purple-500',
    features: [
      { label: 'Order Management', labelRu: 'Управление заказами', icon: FileCheck },
      { label: 'Revenue Analytics', labelRu: 'Аналитика дохода', icon: TrendingUp },
      { label: 'Customer Insights', labelRu: 'Инсайты клиентов', icon: Users },
      { label: 'SaaS Tools', labelRu: 'SaaS инструменты', icon: Sparkles },
    ],
  },
  {
    id: 'owner',
    title: 'Owner Portal',
    titleRu: 'Портал владельца',
    description: 'Property owners track financials, manage tenants, and maximize ROI with full management options.',
    descriptionRu: 'Владельцы недвижимости отслеживают финансы, управляют арендаторами, максимизируют ROI.',
    icon: Home,
    color: 'bg-indigo-500',
    features: [
      { label: 'Financial Dashboard', labelRu: 'Финансовый дашборд', icon: Wallet },
      { label: 'Booking Calendar', labelRu: 'Календарь бронирований', icon: Clock },
      { label: 'Expense Tracking', labelRu: 'Учёт расходов', icon: CreditCard },
      { label: 'Portfolio Analytics', labelRu: 'Аналитика портфеля', icon: BarChart3 },
    ],
  },
  {
    id: 'admin',
    title: 'Admin Control',
    titleRu: 'Админ панель',
    description: 'Platform operators manage all verticals, moderation, finance, and analytics from a unified dashboard.',
    descriptionRu: 'Операторы платформы управляют всеми вертикалями, модерацией и финансами из единого дашборда.',
    icon: BarChart3,
    color: 'bg-amber-500',
    features: [
      { label: 'Real-time KPIs', labelRu: 'KPI в реальном времени', icon: TrendingUp },
      { label: 'Content Moderation', labelRu: 'Модерация контента', icon: FileCheck },
      { label: 'Finance & Payouts', labelRu: 'Финансы и выплаты', icon: Wallet },
      { label: 'Lead Management', labelRu: 'Управление лидами', icon: Users },
    ],
  },
  {
    id: 'uno-team',
    title: 'UNO Team Support',
    titleRu: 'Поддержка UNO Team',
    description: 'On-ground support network provides 24/7 assistance, from airport pickup to emergency help.',
    descriptionRu: 'Офлайн поддержка 24/7: от встречи в аэропорту до экстренной помощи.',
    icon: Headphones,
    color: 'bg-rose-500',
    features: [
      { label: '24/7 Support', labelRu: 'Поддержка 24/7', icon: Clock },
      { label: 'SOS Button', labelRu: 'Кнопка SOS', icon: Shield },
      { label: 'Local Experts', labelRu: 'Местные эксперты', icon: MapPin },
      { label: 'Concierge Service', labelRu: 'Консьерж сервис', icon: Star },
    ],
  },
];

export function InvestorPlatformTour() {
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const step = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  const goToStep = (index: number) => {
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    setCurrentStep(index);
  };

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      goToStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">
              {isRussian ? 'Тур по платформе' : 'Platform Tour'}
            </h2>
            <Badge variant="outline">
              {currentStep + 1} / {tourSteps.length}
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
          
          {/* Step indicators */}
          <div className="flex justify-between mt-4">
            {tourSteps.map((s, index) => {
              const isActive = index === currentStep;
              const isCompleted = completedSteps.has(index);
              return (
                <button
                  key={s.id}
                  onClick={() => goToStep(index)}
                  className={cn(
                    "flex flex-col items-center gap-1 transition-all",
                    isActive ? "scale-110" : "opacity-60 hover:opacity-100"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                    isActive ? s.color : isCompleted ? "bg-green-500" : "bg-muted"
                  )}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    ) : (
                      <s.icon className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground hidden md:block">
                    {isRussian ? s.titleRu.split(' ')[0] : s.title.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="overflow-hidden">
            <div className={`h-2 ${step.color}`} />
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${step.color}`}>
                  <step.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">
                    {isRussian ? step.titleRu : step.title}
                  </CardTitle>
                  <CardDescription>
                    {isRussian ? step.descriptionRu : step.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Features Grid */}
              <div className="grid grid-cols-2 gap-3">
                {step.features.map((feature, index) => (
                  <motion.div
                    key={feature.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border"
                  >
                    <div className={`p-2 rounded-lg ${step.color}/10`}>
                      <feature.icon className={`w-4 h-4 ${step.color.replace('bg-', 'text-')}`} />
                    </div>
                    <span className="text-sm font-medium">
                      {isRussian ? feature.labelRu : feature.label}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Mock UI Preview */}
              <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-muted to-muted/50 p-6 border">
                <div className="absolute inset-0 bg-grid-black/5" />
                <div className="relative flex items-center justify-center h-40">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col items-center gap-3"
                  >
                    <div className={`p-4 rounded-2xl ${step.color} shadow-lg`}>
                      <step.icon className="w-10 h-10 text-white" />
                    </div>
                    <p className="text-sm text-muted-foreground text-center max-w-xs">
                      {isRussian 
                        ? 'Интерактивный предпросмотр этой функции'
                        : 'Interactive preview of this feature'}
                    </p>
                  </motion.div>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  {isRussian ? 'Назад' : 'Previous'}
                </Button>

                <div className="flex gap-1">
                  {tourSteps.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToStep(index)}
                      className={cn(
                        "w-2 h-2 rounded-full transition-all",
                        index === currentStep 
                          ? "bg-primary w-6" 
                          : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                      )}
                    />
                  ))}
                </div>

                <Button
                  onClick={nextStep}
                  disabled={currentStep === tourSteps.length - 1}
                >
                  {isRussian ? 'Далее' : 'Next'}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Quick Jump */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            {isRussian ? 'Быстрый переход' : 'Quick Jump'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {tourSteps.map((s, index) => (
              <Button
                key={s.id}
                variant={index === currentStep ? "default" : "outline"}
                size="sm"
                onClick={() => goToStep(index)}
                className="text-xs"
              >
                <s.icon className="w-3 h-3 mr-1" />
                {isRussian ? s.titleRu : s.title}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
