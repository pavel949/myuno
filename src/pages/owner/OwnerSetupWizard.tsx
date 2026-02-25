import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOwnerProperties } from '@/hooks/usePropertyCare';
import { useExternalCalendars } from '@/hooks/useExternalCalendars';
import { PageContainer } from '@/components/uno/PageContainer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Home, Link2, DollarSign, MessageSquare, CheckCircle,
  ChevronRight, ChevronLeft, ArrowRight, Rocket, Plus, ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

const SETUP_STORAGE_KEY = 'uno_owner_setup_completed';

interface SetupStep {
  id: string;
  titleEn: string;
  titleRu: string;
  descEn: string;
  descRu: string;
  icon: React.ReactNode;
  emoji: string;
}

const SETUP_STEPS: SetupStep[] = [
  {
    id: 'welcome',
    titleEn: 'Welcome!',
    titleRu: 'Добро пожаловать!',
    descEn: 'Let\'s set up your property management in 4 easy steps',
    descRu: 'Настроим управление недвижимостью за 4 простых шага',
    icon: <Sparkles className="h-5 w-5" />,
    emoji: '👋',
  },
  {
    id: 'property',
    titleEn: 'Add Your Property',
    titleRu: 'Добавьте объект',
    descEn: 'Start by adding your first property with photos and details',
    descRu: 'Добавьте первый объект с фотографиями и описанием',
    icon: <Home className="h-5 w-5" />,
    emoji: '🏠',
  },
  {
    id: 'channels',
    titleEn: 'Connect Channels',
    titleRu: 'Подключите каналы',
    descEn: 'Link Airbnb, Booking.com and other OTAs for auto-sync',
    descRu: 'Подключите Airbnb, Booking.com и другие OTA для авто-синхронизации',
    icon: <Link2 className="h-5 w-5" />,
    emoji: '🔗',
  },
  {
    id: 'pricing',
    titleEn: 'Set Pricing',
    titleRu: 'Установите цены',
    descEn: 'Configure rates, discounts and booking rules',
    descRu: 'Настройте тарифы, скидки и правила бронирования',
    icon: <DollarSign className="h-5 w-5" />,
    emoji: '💰',
  },
  {
    id: 'messaging',
    titleEn: 'Auto-Messages',
    titleRu: 'Авто-сообщения',
    descEn: 'Set up automatic guest communications',
    descRu: 'Настройте автоматические сообщения гостям',
    icon: <MessageSquare className="h-5 w-5" />,
    emoji: '💬',
  },
];

export default function OwnerSetupWizard() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const [currentStep, setCurrentStep] = useState(0);

  const { data: properties } = useOwnerProperties();
  const { calendars } = useExternalCalendars();

  const hasProperties = (properties?.length || 0) > 0;
  const hasChannels = (calendars?.length || 0) > 0;
  const firstPropertyId = properties?.[0]?.id;

  const step = SETUP_STEPS[currentStep];
  const progress = ((currentStep) / (SETUP_STEPS.length - 1)) * 100;

  const handleNext = useCallback(() => {
    if (currentStep < SETUP_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleFinish = useCallback(() => {
    localStorage.setItem(SETUP_STORAGE_KEY, 'true');
    navigate('/owner');
  }, [navigate]);

  const handleSkip = useCallback(() => {
    localStorage.setItem(SETUP_STORAGE_KEY, 'true');
    navigate('/owner');
  }, [navigate]);

  return (
    <PageContainer>
      <div className="max-w-lg mx-auto pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold">
              {isRu ? 'Быстрый старт' : 'Quick Start'}
            </h1>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSkip} className="text-muted-foreground">
            {isRu ? 'Пропустить' : 'Skip'}
          </Button>
        </div>

        {/* Progress */}
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>{isRu ? 'Шаг' : 'Step'} {currentStep + 1} / {SETUP_STEPS.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2 mb-6" />

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-1.5 mb-8">
          {SETUP_STEPS.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentStep(idx)}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all",
                idx === currentStep && "bg-primary text-primary-foreground scale-110",
                idx < currentStep && "bg-primary/20 text-primary",
                idx > currentStep && "bg-muted text-muted-foreground"
              )}
            >
              {idx < currentStep ? <CheckCircle className="h-4 w-4" /> : s.emoji}
            </button>
          ))}
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
          >
            {currentStep === 0 && <WelcomeStep isRu={isRu} />}
            {currentStep === 1 && (
              <PropertyStep
                isRu={isRu}
                hasProperties={hasProperties}
                count={properties?.length || 0}
                onAdd={() => navigate('/owner/properties/new')}
              />
            )}
            {currentStep === 2 && (
              <ChannelsStep
                isRu={isRu}
                hasChannels={hasChannels}
                count={calendars?.length || 0}
                onConnect={() => navigate('/owner/channels')}
              />
            )}
            {currentStep === 3 && (
              <PricingStep
                isRu={isRu}
                hasProperties={hasProperties}
                onSetup={() => firstPropertyId && navigate(`/owner/properties/${firstPropertyId}/setup`)}
              />
            )}
            {currentStep === 4 && (
              <MessagingStep
                isRu={isRu}
                onSetup={() => navigate('/owner/auto-messaging')}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {currentStep > 0 && (
            <Button variant="outline" onClick={handlePrev} className="flex-1">
              <ChevronLeft className="h-4 w-4 mr-1" />
              {isRu ? 'Назад' : 'Back'}
            </Button>
          )}
          {currentStep < SETUP_STEPS.length - 1 ? (
            <Button onClick={handleNext} className="flex-1">
              {isRu ? 'Далее' : 'Next'}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleFinish} className="flex-1 bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              {isRu ? 'Начать работу!' : 'Start Working!'}
            </Button>
          )}
        </div>
      </div>
    </PageContainer>
  );
}

// ── Step Components ──

function WelcomeStep({ isRu }: { isRu: boolean }) {
  const benefits = isRu
    ? ['Добавьте объекты и управляйте ими', 'Синхронизируйте бронирования с OTA', 'Автоматизируйте общение с гостями', 'Отслеживайте доходы и расходы']
    : ['Add and manage your properties', 'Sync bookings with OTAs', 'Automate guest communications', 'Track revenue and expenses'];

  return (
    <div className="text-center space-y-6">
      <motion.div
        initial={{ scale: 0.5 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 12 }}
        className="text-6xl"
      >
        🏡
      </motion.div>
      <div>
        <h2 className="text-2xl font-bold mb-2">
          {isRu ? 'Добро пожаловать в myUNO!' : 'Welcome to myUNO!'}
        </h2>
        <p className="text-muted-foreground">
          {isRu
            ? 'Профессиональное управление недвижимостью на Пхукете'
            : 'Professional property management in Phuket'}
        </p>
      </div>
      <Card>
        <CardContent className="pt-4">
          <p className="text-sm font-medium mb-3">
            {isRu ? 'Что вы сможете:' : 'What you can do:'}
          </p>
          <ul className="space-y-2 text-left">
            {benefits.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function PropertyStep({ isRu, hasProperties, count, onAdd }: {
  isRu: boolean; hasProperties: boolean; count: number; onAdd: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <span className="text-4xl">🏠</span>
        <h2 className="text-xl font-bold mt-2">
          {isRu ? 'Добавьте объект' : 'Add Your Property'}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {isRu ? 'Укажите тип, характеристики и загрузите фото' : 'Set type, specs and upload photos'}
        </p>
      </div>

      {hasProperties ? (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
          <CardContent className="pt-4 flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <p className="font-medium">{isRu ? 'Готово!' : 'Done!'}</p>
              <p className="text-sm text-muted-foreground">
                {isRu ? `${count} объект(ов) добавлено` : `${count} property(ies) added`}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
          <CardContent className="pt-6 pb-6 text-center">
            <Home className="h-12 w-12 text-primary/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              {isRu ? 'У вас пока нет объектов' : 'You don\'t have any properties yet'}
            </p>
            <Button onClick={onAdd} size="lg">
              <Plus className="h-4 w-4 mr-2" />
              {isRu ? 'Добавить объект' : 'Add Property'}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="bg-muted/50">
        <CardContent className="pt-3 pb-3">
          <p className="text-xs text-muted-foreground">
            💡 {isRu
              ? 'Совет: Вы можете импортировать данные с Airbnb — это быстрее, чем заполнять вручную'
              : 'Tip: You can import data from Airbnb — it\'s faster than filling in manually'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function ChannelsStep({ isRu, hasChannels, count, onConnect }: {
  isRu: boolean; hasChannels: boolean; count: number; onConnect: () => void;
}) {
  const channels = [
    { name: 'Airbnb', emoji: '🏡', color: 'bg-rose-100 dark:bg-rose-900/30' },
    { name: 'Booking.com', emoji: '🅱️', color: 'bg-blue-100 dark:bg-blue-900/30' },
    { name: 'Agoda', emoji: '🔴', color: 'bg-red-100 dark:bg-red-900/30' },
    { name: 'VRBO', emoji: '🏠', color: 'bg-indigo-100 dark:bg-indigo-900/30' },
  ];

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <span className="text-4xl">🔗</span>
        <h2 className="text-xl font-bold mt-2">
          {isRu ? 'Подключите каналы' : 'Connect Channels'}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {isRu ? 'iCal-синхронизация каждые 5 минут' : 'iCal sync every 5 minutes'}
        </p>
      </div>

      {hasChannels && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
          <CardContent className="pt-4 flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <p className="font-medium">{isRu ? 'Подключено!' : 'Connected!'}</p>
              <p className="text-sm text-muted-foreground">
                {isRu ? `${count} канал(ов)` : `${count} channel(s)`}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-2">
        {channels.map(ch => (
          <Card key={ch.name} className={cn("cursor-pointer hover:ring-2 ring-primary/30 transition-all", ch.color)} onClick={onConnect}>
            <CardContent className="pt-3 pb-3 text-center">
              <span className="text-2xl">{ch.emoji}</span>
              <p className="text-sm font-medium mt-1">{ch.name}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button onClick={onConnect} variant="outline" className="w-full">
        <ExternalLink className="h-4 w-4 mr-2" />
        {isRu ? 'Открыть Channel Manager' : 'Open Channel Manager'}
      </Button>

      <Card className="bg-muted/50">
        <CardContent className="pt-3 pb-3">
          <p className="text-xs text-muted-foreground">
            💡 {isRu
              ? 'Совет: Скопируйте ссылку iCal из личного кабинета OTA и вставьте в Channel Manager'
              : 'Tip: Copy the iCal link from your OTA dashboard and paste it in Channel Manager'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function PricingStep({ isRu, hasProperties, onSetup }: {
  isRu: boolean; hasProperties: boolean; onSetup: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <span className="text-4xl">💰</span>
        <h2 className="text-xl font-bold mt-2">
          {isRu ? 'Установите цены' : 'Set Your Pricing'}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {isRu ? 'Базовые тарифы, скидки за длительное проживание' : 'Base rates, long-stay discounts'}
        </p>
      </div>

      <Card>
        <CardContent className="pt-4 space-y-3">
          {[
            { labelEn: 'Nightly rate', labelRu: 'Цена за ночь', emoji: '🌙' },
            { labelEn: 'Weekly / Monthly discounts', labelRu: 'Скидки за неделю / месяц', emoji: '📅' },
            { labelEn: 'Check-in / Check-out times', labelRu: 'Время заезда / выезда', emoji: '🕐' },
            { labelEn: 'Deposit amount', labelRu: 'Сумма залога', emoji: '🛡️' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
              <span className="text-lg">{item.emoji}</span>
              <span className="text-sm">{isRu ? item.labelRu : item.labelEn}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {hasProperties ? (
        <Button onClick={onSetup} className="w-full" size="lg">
          <DollarSign className="h-4 w-4 mr-2" />
          {isRu ? 'Настроить цены' : 'Set Up Pricing'}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      ) : (
        <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
          <CardContent className="pt-3 pb-3 flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <p className="text-sm text-muted-foreground">
              {isRu ? 'Сначала добавьте объект (шаг 2)' : 'Add a property first (step 2)'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MessagingStep({ isRu, onSetup }: {
  isRu: boolean; onSetup: () => void;
}) {
  const templates = isRu
    ? ['Приветствие при бронировании', 'Инструкция перед заездом', 'Напоминание о выезде', 'Запрос отзыва']
    : ['Booking confirmation', 'Pre check-in instructions', 'Check-out reminder', 'Review request'];

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <span className="text-4xl">💬</span>
        <h2 className="text-xl font-bold mt-2">
          {isRu ? 'Авто-сообщения' : 'Auto-Messages'}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {isRu ? 'Общайтесь с гостями на автопилоте' : 'Communicate with guests on autopilot'}
        </p>
      </div>

      <Card>
        <CardContent className="pt-4 space-y-2">
          {templates.map((t, i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
              <Badge variant="secondary" className="text-xs w-6 h-6 flex items-center justify-center p-0 rounded-full">
                {i + 1}
              </Badge>
              <span className="text-sm">{t}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Button onClick={onSetup} variant="outline" className="w-full" size="lg">
        <MessageSquare className="h-4 w-4 mr-2" />
        {isRu ? 'Настроить сообщения' : 'Set Up Messages'}
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>

      <Card className="bg-muted/50">
        <CardContent className="pt-3 pb-3">
          <p className="text-xs text-muted-foreground">
            💡 {isRu
              ? 'Совет: AI поможет сгенерировать тексты на русском и английском'
              : 'Tip: AI will help generate messages in Russian and English'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export function isSetupCompleted(): boolean {
  return localStorage.getItem(SETUP_STORAGE_KEY) === 'true';
}
