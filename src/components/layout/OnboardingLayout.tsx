import React, { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';

export interface OnboardingStep {
  id: string;
  labelEn: string;
  labelRu: string;
}

interface OnboardingLayoutProps {
  children: ReactNode;
  /** Current step (1-indexed) */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
  /** Optional step definitions for labels */
  steps?: OnboardingStep[];
  /** Title shown in header */
  title?: string;
  titleRu?: string;
  /** Show back button */
  showBack?: boolean;
  /** Custom back handler */
  onBack?: () => void;
  /** Show close/exit button */
  showClose?: boolean;
  /** Custom close handler or default exit path */
  onClose?: () => void;
  /** Exit path when close is clicked (default: /) */
  exitPath?: string;
  /** Role context for theming */
  role?: 'vendor' | 'owner' | 'team' | 'user';
  /** Additional class names */
  className?: string;
}

/**
 * Universal onboarding layout for vendor/owner/team flows.
 * Shows minimal navigation with progress tracking.
 */
export const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({ 
  children, 
  currentStep,
  totalSteps,
  steps,
  title,
  titleRu,
  showBack = true,
  onBack,
  showClose = true,
  onClose,
  exitPath = '/',
  role = 'user',
  className,
}) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const progressPercent = (currentStep / totalSteps) * 100;
  
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };
  
  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate(exitPath);
    }
  };

  const currentStepData = steps?.[currentStep - 1];
  const stepLabel = currentStepData 
    ? (isRu ? currentStepData.labelRu : currentStepData.labelEn)
    : null;

  const displayTitle = title 
    ? (isRu && titleRu ? titleRu : title)
    : stepLabel;

  return (
    <div className={cn("min-h-screen bg-background flex flex-col", className)}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        {/* Progress bar at very top */}
        <div className="h-1">
          <Progress 
            value={progressPercent} 
            className="h-1 rounded-none bg-muted"
          />
        </div>
        
        {/* Navigation row */}
        <div className="flex items-center justify-between h-14 px-4">
          {/* Left: Back button */}
          <div className="w-10">
            {showBack && currentStep > 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="h-10 w-10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
          </div>
          
          {/* Center: Title & Step indicator */}
          <div className="flex-1 text-center">
            {displayTitle && (
              <h1 className="text-base font-semibold truncate">
                {displayTitle}
              </h1>
            )}
            <p className="text-xs text-muted-foreground">
              {isRu ? `Шаг ${currentStep} из ${totalSteps}` : `Step ${currentStep} of ${totalSteps}`}
            </p>
          </div>
          
          {/* Right: Close button */}
          <div className="w-10">
            {showClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="h-10 w-10"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Step indicators (optional, for desktop) */}
      {steps && steps.length > 0 && (
        <div className="hidden md:flex items-center justify-center gap-2 py-4 px-4 border-b border-border bg-muted/30">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isActive = stepNumber === currentStep;
            const isCompleted = stepNumber < currentStep;
            
            return (
              <div key={step.id} className="flex items-center">
                {index > 0 && (
                  <div className={cn(
                    "w-8 h-0.5 mx-2",
                    isCompleted ? "bg-primary" : "bg-muted"
                  )} />
                )}
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors",
                    isActive && "bg-primary text-primary-foreground",
                    isCompleted && "bg-primary/20 text-primary",
                    !isActive && !isCompleted && "bg-muted text-muted-foreground"
                  )}>
                    {isCompleted ? '✓' : stepNumber}
                  </div>
                  <span className={cn(
                    "text-sm hidden lg:block",
                    isActive && "font-medium text-foreground",
                    !isActive && "text-muted-foreground"
                  )}>
                    {isRu ? step.labelRu : step.labelEn}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};

// Pre-defined step configurations for common flows
export const vendorOnboardingSteps: OnboardingStep[] = [
  { id: 'business', labelEn: 'Business Info', labelRu: 'О бизнесе' },
  { id: 'categories', labelEn: 'Categories', labelRu: 'Категории' },
  { id: 'documents', labelEn: 'Documents', labelRu: 'Документы' },
  { id: 'review', labelEn: 'Review', labelRu: 'Проверка' },
];

export const ownerOnboardingSteps: OnboardingStep[] = [
  { id: 'property', labelEn: 'Property Info', labelRu: 'О недвижимости' },
  { id: 'location', labelEn: 'Location', labelRu: 'Расположение' },
  { id: 'amenities', labelEn: 'Amenities', labelRu: 'Удобства' },
  { id: 'photos', labelEn: 'Photos', labelRu: 'Фотографии' },
  { id: 'pricing', labelEn: 'Pricing', labelRu: 'Цены' },
  { id: 'verification', labelEn: 'Verification', labelRu: 'Верификация' },
];

export const teamOnboardingSteps: OnboardingStep[] = [
  { id: 'profile', labelEn: 'Your Profile', labelRu: 'Ваш профиль' },
  { id: 'permissions', labelEn: 'Permissions', labelRu: 'Доступы' },
  { id: 'complete', labelEn: 'Complete', labelRu: 'Готово' },
];
