import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Check, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export interface WizardStep {
  id: string;
  title: string;
  titleRu?: string;
  icon?: React.ReactNode;
  /** Optional validation function that returns error message or null */
  validate?: () => string | null;
}

interface VendorFormWizardProps {
  steps: WizardStep[];
  currentStep: number;
  onStepChange: (step: number) => void;
  children: React.ReactNode;
  /** Called when final step is submitted */
  onSubmit: () => void | Promise<void>;
  isSubmitting?: boolean;
  /** Custom submit button label */
  submitLabel?: string;
  submitLabelRu?: string;
  className?: string;
}

export function VendorFormWizard({
  steps,
  currentStep,
  onStepChange,
  children,
  onSubmit,
  isSubmitting = false,
  submitLabel = 'Save',
  submitLabelRu = 'Сохранить',
  className,
}: VendorFormWizardProps) {
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    const step = steps[currentStep];
    if (step.validate) {
      const error = step.validate();
      if (error) {
        return; // Validation failed
      }
    }
    
    if (isLastStep) {
      onSubmit();
    } else {
      onStepChange(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      onStepChange(currentStep - 1);
    }
  };

  const handleStepClick = (index: number) => {
    // Only allow going to previous steps or validated steps
    if (index < currentStep) {
      onStepChange(index);
    }
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Step Progress Bar */}
      <div className="flex items-center justify-between mb-6 px-1">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isPending = index > currentStep;

          return (
            <React.Fragment key={step.id}>
              <button
                type="button"
                onClick={() => handleStepClick(index)}
                disabled={isPending}
                className={cn(
                  'flex items-center gap-2 transition-all',
                  isCompleted && 'cursor-pointer',
                  isPending && 'cursor-not-allowed opacity-50'
                )}
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                    isCompleted && 'bg-primary text-primary-foreground',
                    isCurrent && 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background',
                    isPending && 'bg-muted text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : step.icon ? (
                    step.icon
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={cn(
                    'text-sm font-medium hidden sm:inline',
                    isCurrent && 'text-primary',
                    isPending && 'text-muted-foreground'
                  )}
                >
                  {isRussian && step.titleRu ? step.titleRu : step.title}
                </span>
              </button>
              
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-2 rounded transition-colors',
                    index < currentStep ? 'bg-primary' : 'bg-muted'
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-1">
        {children}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 mt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={handlePrevious}
          disabled={isFirstStep || isSubmitting}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          {isRussian ? 'Назад' : 'Back'}
        </Button>

        <div className="text-sm text-muted-foreground">
          {currentStep + 1} / {steps.length}
        </div>

        <Button
          type="button"
          onClick={handleNext}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              {isRussian ? 'Сохранение...' : 'Saving...'}
            </>
          ) : isLastStep ? (
            isRussian ? submitLabelRu : submitLabel
          ) : (
            <>
              {isRussian ? 'Далее' : 'Next'}
              <ChevronRight className="h-4 w-4 ml-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// Step content wrapper for animation
interface WizardStepContentProps {
  stepId: string;
  currentStepId: string;
  children: React.ReactNode;
}

export function WizardStepContent({ stepId, currentStepId, children }: WizardStepContentProps) {
  if (stepId !== currentStepId) return null;
  return <div className="animate-fade-in">{children}</div>;
}
