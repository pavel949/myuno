/**
 * PartnerSetupGate - Clear explanation and progress for partner registration
 * 
 * Shows when user tries to access vendor features without completing onboarding
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Store, 
  ArrowRight, 
  CheckCircle2,
  Circle,
  Building2,
  Palette,
  CreditCard,
  Rocket
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface PartnerSetupGateProps {
  className?: string;
  /** Current step (1-4), 0 means not started */
  currentStep?: number;
}

const steps = [
  {
    id: 1,
    iconComponent: Building2,
    labelEn: 'Business Info',
    labelRu: 'Информация о бизнесе',
    descriptionEn: 'Add your business name and contact details',
    descriptionRu: 'Добавьте название и контакты',
  },
  {
    id: 2,
    iconComponent: Palette,
    labelEn: 'Select Categories',
    labelRu: 'Выбор категорий',
    descriptionEn: 'Choose the services you offer',
    descriptionRu: 'Выберите услуги, которые предоставляете',
  },
  {
    id: 3,
    iconComponent: CreditCard,
    labelEn: 'Payout Setup',
    labelRu: 'Настройка выплат',
    descriptionEn: 'Add payment details to receive earnings',
    descriptionRu: 'Добавьте реквизиты для получения выплат',
  },
  {
    id: 4,
    iconComponent: Rocket,
    labelEn: 'Start Selling',
    labelRu: 'Начать продажи',
    descriptionEn: 'Add your first product or service',
    descriptionRu: 'Добавьте первый товар или услугу',
  },
];

export function PartnerSetupGate({ className, currentStep = 0 }: PartnerSetupGateProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const progress = (currentStep / steps.length) * 100;

  return (
    <Card className={cn(
      'border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/5',
      'shadow-lg',
      className
    )}>
      <CardContent className="p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-4 rounded-full bg-primary/10 mx-auto">
            <Store className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-xl font-bold">
            {isRu ? 'Завершите регистрацию партнёра' : 'Complete Partner Setup'}
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {isRu 
              ? 'Для добавления услуг и товаров необходимо завершить регистрацию партнёрского аккаунта. Это займёт всего 2-3 минуты.'
              : 'To add services and products, you need to complete your partner account setup. This only takes 2-3 minutes.'}
          </p>
        </div>

        {/* Progress indicator */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{isRu ? 'Прогресс' : 'Progress'}</span>
            <span>{currentStep}/{steps.length} {isRu ? 'шагов' : 'steps'}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Steps */}
        <div className="space-y-2">
          {steps.map((step) => {
            const StepIcon = step.iconComponent;
            const isComplete = step.id <= currentStep;
            const isCurrent = step.id === currentStep + 1;
            
            return (
              <div
                key={step.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-none border transition-all",
                  isComplete && "bg-success/5 border-success/30",
                  isCurrent && "bg-primary/5 border-primary/30 ring-1 ring-primary/20",
                  !isComplete && !isCurrent && "bg-muted/20 border-muted/30 opacity-60"
                )}
              >
                <div className={cn(
                  "shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                  isComplete && "bg-success/20 text-success",
                  isCurrent && "bg-primary/20 text-primary",
                  !isComplete && !isCurrent && "bg-muted/30 text-muted-foreground"
                )}>
                  {isComplete ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <StepIcon className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium",
                    isComplete && "text-success line-through",
                    isCurrent && "text-primary"
                  )}>
                    {isRu ? step.labelRu : step.labelEn}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {isRu ? step.descriptionRu : step.descriptionEn}
                  </p>
                </div>
                {isCurrent && (
                  <Circle className="h-3 w-3 text-primary animate-pulse" />
                )}
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <Button 
          onClick={() => navigate('/vendor/onboarding')}
          className="w-full"
          size="lg"
        >
          {currentStep > 0 
            ? (isRu ? 'Продолжить регистрацию' : 'Continue Setup')
            : (isRu ? 'Начать регистрацию' : 'Start Setup')
          }
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>

        {/* Benefits hint */}
        <p className="text-xs text-center text-muted-foreground">
          ✓ {isRu ? 'Бесплатная регистрация' : 'Free registration'} · 
          ✓ {isRu ? '0% комиссии в первый месяц' : '0% commission first month'} · 
          ✓ {isRu ? 'Поддержка 24/7' : '24/7 support'}
        </p>
      </CardContent>
    </Card>
  );
}

export default PartnerSetupGate;
