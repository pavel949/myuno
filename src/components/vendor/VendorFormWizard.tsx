import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Check, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
        return;
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
    if (index < currentStep) {
      onStepChange(index);
      return;
    }
    // Click the immediate next step = same as "Next" (validate current, then advance)
    if (index === currentStep + 1 && !isLastStep) {
      handleNext();
    }
  };

  const currentStepMeta = steps[currentStep];
  const currentTitle =
    isRussian && currentStepMeta?.titleRu ? currentStepMeta.titleRu : currentStepMeta?.title ?? '';

  const hintText = isRussian
    ? 'Заполните поля шага и нажмите «Далее» внизу или на следующий шаг в строке выше — так вы перейдёте к деталям, фото и проверке.'
    : 'Fill in this step, then use Next below or click the next step in the bar above to continue to details, photos, and review.';

  const tooltipBack = isRussian ? 'Вернуться к этому шагу' : 'Go back to this step';
  const tooltipNextStep = isRussian ? 'Следующий шаг' : 'Next step';
  const tooltipBlocked = isRussian
    ? 'Сначала завершите текущий шаг и нажмите «Далее», либо перейдите по шагам по порядку.'
    : 'Complete this step and press Next, or go through steps in order.';

  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn('flex flex-col min-h-0 h-full', className)}>
        {/* Step Progress Bar */}
        <div className="flex-shrink-0 flex items-center justify-between mb-3 sm:mb-6 px-1">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const isNextAdjacent = index === currentStep + 1;
            const isFarFuture = index > currentStep + 1;
            const isClickableForward = isNextAdjacent && !isLastStep;

            const label = isRussian && step.titleRu ? step.titleRu : step.title;

            const buttonInner = (
              <button
                type="button"
                onClick={() => handleStepClick(index)}
                disabled={isFarFuture || (!isClickableForward && !isCompleted && !isCurrent)}
                className={cn(
                  'flex items-center gap-2 transition-all text-left',
                  isCompleted && 'cursor-pointer',
                  isCurrent && 'cursor-default',
                  isClickableForward && 'cursor-pointer opacity-100',
                  isFarFuture && 'cursor-not-allowed opacity-50'
                )}
              >
                <div
                  className={cn(
                    'w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                    isCompleted && 'bg-primary text-primary-foreground',
                    isCurrent && 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background',
                    isFarFuture && 'bg-muted text-muted-foreground',
                    isClickableForward && 'bg-muted text-foreground ring-1 ring-border hover:bg-muted/80'
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
                    isFarFuture && 'text-muted-foreground',
                    isClickableForward && 'text-foreground'
                  )}
                >
                  {label}
                </span>
              </button>
            );

            const withTooltip = (() => {
              if (isCompleted) {
                return (
                  <Tooltip key={step.id}>
                    <TooltipTrigger asChild>{buttonInner}</TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[240px]">
                      {tooltipBack}
                    </TooltipContent>
                  </Tooltip>
                );
              }
              if (isClickableForward) {
                return (
                  <Tooltip key={step.id}>
                    <TooltipTrigger asChild>{buttonInner}</TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[260px]">
                      {tooltipNextStep}
                    </TooltipContent>
                  </Tooltip>
                );
              }
              if (isFarFuture) {
                return (
                  <Tooltip key={step.id}>
                    {/* Span wrapper: tooltips do not show on disabled buttons */}
                    <TooltipTrigger asChild>
                      <span className="inline-flex cursor-not-allowed">{buttonInner}</span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[260px]">
                      {tooltipBlocked}
                    </TooltipContent>
                  </Tooltip>
                );
              }
              return <React.Fragment key={step.id}>{buttonInner}</React.Fragment>;
            })();

            return (
              <React.Fragment key={step.id}>
                {withTooltip}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-0.5 mx-1 sm:mx-2 rounded-none transition-colors min-w-[8px]',
                      index < currentStep ? 'bg-primary' : 'bg-muted'
                    )}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Mobile: current step name (labels are hidden on xs) */}
        <p
          className="sm:hidden flex-shrink-0 text-sm font-medium text-center text-primary mb-2 px-1"
          aria-live="polite"
        >
          {isRussian ? 'Шаг' : 'Step'} {currentStep + 1} / {steps.length}
          {currentTitle ? ` — ${currentTitle}` : ''}
        </p>

        <p className="flex-shrink-0 text-xs text-muted-foreground text-center mb-3 px-1 leading-snug">
          {hintText}
        </p>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto min-h-0 pr-1">{children}</div>

        {/* Navigation Buttons */}
        <div className="flex-shrink-0 flex items-center justify-between pt-4 mt-4 border-t pb-[max(0.75rem,env(safe-area-inset-bottom))] gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={isFirstStep || isSubmitting}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {isRussian ? 'Назад' : 'Back'}
          </Button>

          <div className="text-sm text-muted-foreground tabular-nums shrink-0">
            {currentStep + 1} / {steps.length}
          </div>

          <Button type="button" onClick={handleNext} disabled={isSubmitting}>
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
    </TooltipProvider>
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
