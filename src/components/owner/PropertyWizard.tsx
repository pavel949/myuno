import { useState, ReactNode, useCallback, memo } from 'react';
import { Save, ChevronLeft, ChevronRight, Loader2, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { propertyWizardSteps, WizardStep } from './PropertyWizardSteps';

interface PropertyWizardProps {
  children: (stepId: string) => ReactNode;
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
  validateStep?: (stepId: string) => boolean;
  onSaveDraft?: () => void;
  lastSaved?: Date | null;
  saveState?: 'idle' | 'saving' | 'saved' | 'unsaved' | 'error';
}

function PropertyWizardInner({ 
  children, 
  onSubmit, 
  isSubmitting,
  validateStep,
  onSaveDraft,
  lastSaved,
  saveState = 'idle',
}: PropertyWizardProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [currentStep, setCurrentStep] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);

  const steps = propertyWizardSteps;
  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = useCallback(async () => {
    if (isNavigating) return; // Prevent double clicks
    
    if (validateStep && !validateStep(currentStepData.id)) {
      return;
    }
    
    if (isLastStep) {
      setIsNavigating(true);
      try {
        await onSubmit();
      } finally {
        setIsNavigating(false);
      }
    } else {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  }, [validateStep, currentStepData.id, isLastStep, onSubmit, steps.length, isNavigating]);

  const handlePrev = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);

  const handleStepClick = useCallback((index: number) => {
    // Allow going back to any previous step
    if (index < currentStep) {
      setCurrentStep(index);
      return;
    }
    // Allow going forward only if validation passes
    if (index > currentStep && validateStep) {
      // Validate all steps up to the target
      for (let i = currentStep; i < index; i++) {
        if (!validateStep(steps[i].id)) {
          return;
        }
      }
      setCurrentStep(index);
    } else if (index > currentStep) {
      setCurrentStep(index);
    }
  }, [currentStep, validateStep, steps]);

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="space-y-4">
        {/* Step Indicators - Mobile */}
        <div className="flex items-center justify-between md:hidden">
          <span className="text-sm text-muted-foreground">
            {isRu ? 'Шаг' : 'Step'} {currentStep + 1} / {steps.length}
          </span>
          <span className="text-sm font-medium">
            {isRu ? currentStepData.titleRu : currentStepData.title}
          </span>
        </div>

        {/* Progress Bar - Mobile */}
        <Progress value={progress} className="h-2 md:hidden" />

        {/* Step Indicators - Desktop */}
        <div className="hidden md:flex items-center justify-between gap-2">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            
            return (
              <button
                key={step.id}
                onClick={() => handleStepClick(index)}
                className={cn(
                  "flex-1 flex flex-col items-center gap-1 p-2 rounded-none transition-all",
                  isCurrent && "bg-primary/10",
                  isCompleted && "cursor-pointer hover:bg-muted",
                  !isCurrent && !isCompleted && "opacity-50"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                  isCompleted && "bg-primary text-primary-foreground",
                  isCurrent && "bg-primary text-primary-foreground",
                  !isCurrent && !isCompleted && "bg-muted text-muted-foreground"
                )}>
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    step.icon
                  )}
                </div>
                <span className={cn(
                  "text-xs font-medium text-center",
                  isCurrent && "text-primary",
                  !isCurrent && "text-muted-foreground"
                )}>
                  {isRu ? step.titleRu : step.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[300px]">
        {children(currentStepData.id)}
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-3 sticky bottom-0 bg-background py-4 border-t -mx-4 px-4 md:relative md:border-0 md:py-0 md:mx-0 md:px-0">
        <Button
          type="button"
          variant="outline"
          onClick={handlePrev}
          disabled={isFirstStep || isSubmitting}
          className="flex-1"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          {isRu ? 'Назад' : 'Back'}
        </Button>

        {onSaveDraft && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onSaveDraft}
            disabled={isSubmitting}
            title={isRu ? 'Сохранить черновик' : 'Save draft'}
          >
            <Save className="h-4 w-4" />
          </Button>
        )}
        
        <Button
          type="button"
          onClick={handleNext}
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {isRu ? 'Сохранение...' : 'Saving...'}
            </>
          ) : isLastStep ? (
            <>
              {isRu ? 'Добавить объект' : 'Add Property'}
              <Check className="h-4 w-4 ml-1" />
            </>
          ) : (
            <>
              {isRu ? 'Далее' : 'Next'}
              <ChevronRight className="h-4 w-4 ml-1" />
            </>
          )}
        </Button>
      </div>

      {(saveState !== 'idle' || lastSaved) && (
        <p className="text-[10px] text-muted-foreground text-center mt-1">
          {saveState === 'saving' && (isRu ? 'Сохранение...' : 'Saving...')}
          {saveState === 'unsaved' && (isRu ? 'Не сохранено' : 'Unsaved changes')}
          {saveState === 'error' && (isRu ? 'Ошибка сохранения' : 'Save failed')}
          {saveState === 'saved' && `${isRu ? 'Сохранено' : 'Saved'}${lastSaved ? ` · ${lastSaved.toLocaleTimeString()}` : ''}`}
        </p>
      )}
    </div>
  );
}

export const PropertyWizard = memo(PropertyWizardInner);
