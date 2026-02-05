import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserContext } from '@/hooks/useUserContext';
import { type AppRole, ROLE_METADATA, SELF_ACTIVATABLE_ROLES } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Store,
  Building2,
  Check,
  Circle,
  ArrowRight,
  Clock,
  AlertCircle,
  FileText,
  CreditCard,
  UserCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Role transition steps configuration
interface TransitionStep {
  id: string;
  labelEn: string;
  labelRu: string;
  descriptionEn: string;
  descriptionRu: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface RoleTransition {
  fromRole: AppRole;
  toRole: AppRole;
  steps: TransitionStep[];
  onboardingPath: string;
  labelEn: string;
  labelRu: string;
  descriptionEn: string;
  descriptionRu: string;
}

const ROLE_TRANSITIONS: RoleTransition[] = [
  {
    fromRole: 'user',
    toRole: 'vendor',
    onboardingPath: '/vendor/onboarding',
    labelEn: 'Become a Service Provider',
    labelRu: 'Стать поставщиком услуг',
    descriptionEn: 'Offer tours, activities, and services to our community',
    descriptionRu: 'Предлагайте туры, впечатления и услуги нашему сообществу',
    steps: [
      {
        id: 'profile',
        labelEn: 'Complete Profile',
        labelRu: 'Заполните профиль',
        descriptionEn: 'Add your business information',
        descriptionRu: 'Добавьте информацию о бизнесе',
        icon: UserCheck,
      },
      {
        id: 'documents',
        labelEn: 'Upload Documents',
        labelRu: 'Загрузите документы',
        descriptionEn: 'Business license, ID verification',
        descriptionRu: 'Лицензия, подтверждение личности',
        icon: FileText,
      },
      {
        id: 'payment',
        labelEn: 'Payment Setup',
        labelRu: 'Настройка оплаты',
        descriptionEn: 'How you want to receive payments',
        descriptionRu: 'Как вы хотите получать платежи',
        icon: CreditCard,
      },
      {
        id: 'review',
        labelEn: 'Review & Approval',
        labelRu: 'Проверка и одобрение',
        descriptionEn: 'We\'ll review your application',
        descriptionRu: 'Мы рассмотрим вашу заявку',
        icon: Clock,
      },
    ],
  },
  {
    fromRole: 'user',
    toRole: 'owner',
    onboardingPath: '/owner/onboarding',
    labelEn: 'Become a Property Owner',
    labelRu: 'Стать владельцем недвижимости',
    descriptionEn: 'List and manage your properties for rent',
    descriptionRu: 'Размещайте и управляйте недвижимостью для аренды',
    steps: [
      {
        id: 'profile',
        labelEn: 'Owner Profile',
        labelRu: 'Профиль владельца',
        descriptionEn: 'Your contact and business details',
        descriptionRu: 'Контактная и бизнес информация',
        icon: UserCheck,
      },
      {
        id: 'property',
        labelEn: 'Add Property',
        labelRu: 'Добавьте недвижимость',
        descriptionEn: 'Details, photos, pricing',
        descriptionRu: 'Детали, фото, цены',
        icon: Building2,
      },
      {
        id: 'documents',
        labelEn: 'Verification',
        labelRu: 'Верификация',
        descriptionEn: 'Property ownership documents',
        descriptionRu: 'Документы на собственность',
        icon: FileText,
      },
      {
        id: 'activation',
        labelEn: 'Activation',
        labelRu: 'Активация',
        descriptionEn: 'Go live and start receiving bookings',
        descriptionRu: 'Запуск и приём бронирований',
        icon: Check,
      },
    ],
  },
];

/**
 * Status indicator for a transition step
 */
type StepStatus = 'completed' | 'current' | 'pending';

interface TransitionStepItemProps {
  step: TransitionStep;
  status: StepStatus;
  stepNumber: number;
  isLast: boolean;
}

function TransitionStepItem({ step, status, stepNumber, isLast }: TransitionStepItemProps) {
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const Icon = step.icon;

  return (
    <div className="flex gap-3">
      {/* Step indicator */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
            status === 'completed' && "bg-primary text-primary-foreground",
            status === 'current' && "bg-primary/20 text-primary border-2 border-primary",
            status === 'pending' && "bg-muted text-muted-foreground"
          )}
        >
          {status === 'completed' ? (
            <Check className="w-4 h-4" />
          ) : (
            stepNumber
          )}
        </div>
        {!isLast && (
          <div 
            className={cn(
              "w-0.5 h-full min-h-[40px] mt-1",
              status === 'completed' ? "bg-primary" : "bg-muted"
            )}
          />
        )}
      </div>

      {/* Step content */}
      <div className="flex-1 pb-6">
        <div className="flex items-center gap-2">
          <Icon className={cn(
            "w-4 h-4",
            status === 'completed' && "text-primary",
            status === 'current' && "text-primary",
            status === 'pending' && "text-muted-foreground"
          )} />
          <span className={cn(
            "font-medium text-sm",
            status === 'pending' && "text-muted-foreground"
          )}>
            {isRussian ? step.labelRu : step.labelEn}
          </span>
          {status === 'current' && (
            <Badge variant="secondary" className="text-xs">
              {isRussian ? 'Текущий' : 'Current'}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {isRussian ? step.descriptionRu : step.descriptionEn}
        </p>
      </div>
    </div>
  );
}

/**
 * Role transition card showing progress toward a new role
 */
interface RoleTransitionCardProps {
  transition: RoleTransition;
  currentStep?: number; // 0-indexed, -1 for not started
  className?: string;
}

export function RoleTransitionCard({ 
  transition, 
  currentStep = -1,
  className 
}: RoleTransitionCardProps) {
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  
  const totalSteps = transition.steps.length;
  const completedSteps = Math.max(0, currentStep);
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  const toRoleMeta = ROLE_METADATA[transition.toRole];
  const RoleIcon = transition.toRole === 'vendor' ? Store : Building2;

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <RoleIcon className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">
              {isRussian ? transition.labelRu : transition.labelEn}
            </CardTitle>
            <CardDescription>
              {isRussian ? transition.descriptionRu : transition.descriptionEn}
            </CardDescription>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5 mt-4">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {isRussian ? 'Прогресс' : 'Progress'}
            </span>
            <span>{completedSteps} / {totalSteps}</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      </CardHeader>

      <CardContent>
        {/* Steps */}
        <div className="space-y-0">
          {transition.steps.map((step, index) => {
            let status: StepStatus = 'pending';
            if (index < currentStep) status = 'completed';
            else if (index === currentStep) status = 'current';
            
            return (
              <TransitionStepItem
                key={step.id}
                step={step}
                status={status}
                stepNumber={index + 1}
                isLast={index === transition.steps.length - 1}
              />
            );
          })}
        </div>

        {/* Action button */}
        <Button asChild className="w-full mt-2">
          <Link to={transition.onboardingPath}>
            {currentStep === -1 
              ? (isRussian ? 'Начать' : 'Get Started')
              : (isRussian ? 'Продолжить' : 'Continue')
            }
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Available role transitions for current user
 */
export function AvailableRoleTransitions({ className }: { className?: string }) {
  const { language } = useLanguage();
  const { hasRole, isLoading } = useUserContext();
  const isRussian = language === 'ru';

  if (isLoading) return null;

  // Filter transitions the user can take
  const availableTransitions = ROLE_TRANSITIONS.filter(t => {
    // User must have the fromRole and NOT have the toRole
    return !hasRole(t.toRole);
  });

  if (availableTransitions.length === 0) return null;

  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="text-sm font-medium text-muted-foreground">
        {isRussian ? 'Расширьте свои возможности' : 'Expand Your Capabilities'}
      </h3>
      <div className="grid gap-4 md:grid-cols-2">
        {availableTransitions.map((transition) => (
          <RoleTransitionCard
            key={`${transition.fromRole}-${transition.toRole}`}
            transition={transition}
            currentStep={-1}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Pending role status indicator
 */
interface PendingRoleStatusProps {
  role: AppRole;
  submittedAt?: Date;
  className?: string;
}

export function PendingRoleStatus({ role, submittedAt, className }: PendingRoleStatusProps) {
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const meta = ROLE_METADATA[role];

  return (
    <Card className={cn("border-warning/50 bg-warning/5", className)}>
      <CardContent className="flex items-center gap-3 py-4">
        <div className="p-2 rounded-full bg-warning/20">
          <Clock className="w-5 h-5 text-warning" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm">
            {isRussian ? 'Ожидает одобрения' : 'Pending Approval'}
          </p>
          <p className="text-xs text-muted-foreground">
            {isRussian 
              ? `Ваша заявка на роль "${meta.labelRu}" находится на рассмотрении`
              : `Your "${meta.labelEn}" role application is under review`
            }
          </p>
        </div>
        <Badge variant="outline" className="border-warning/50 text-warning">
          {isRussian ? 'На рассмотрении' : 'Under Review'}
        </Badge>
      </CardContent>
    </Card>
  );
}
