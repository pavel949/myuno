import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

export interface BookingStep {
  id: string;
  labelEn: string;
  labelRu: string;
  labelTh?: string;
}

interface BookingStepProgressProps {
  steps: BookingStep[];
  currentStep: number;
  className?: string;
}

export function BookingStepProgress({ steps, currentStep, className }: BookingStepProgressProps) {
  const { language } = useLanguage();

  return (
    <div className={cn("w-full py-4", className)}>
      <ol className="relative flex items-start justify-between before:absolute before:inset-x-0 before:top-4 before:h-0.5 before:bg-border">
        {steps.length > 1 && (
          <li role="presentation" aria-hidden="true" className="absolute left-0 top-4 h-0.5 bg-primary transition-all duration-500"
            style={{ width: `${Math.min(100, (currentStep / (steps.length - 1)) * 100)}%` }} />
        )}
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isPending = index > currentStep;

          return (
            <li
              aria-current={isCurrent ? 'step' : undefined}
              key={step.id} 
              className="relative flex min-w-0 flex-1 flex-col items-center z-10"
            >
              {/* Step circle */}
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300",
                  isCompleted && "bg-primary text-primary-foreground",
                  isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                  isPending && "bg-muted text-muted-foreground border-2 border-border"
                )}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" aria-hidden="true" />
                ) : (
                  index + 1
                )}
              </div>

              {/* Step label */}
              <span 
                className={cn(
                  "text-xs mt-2 text-center max-w-full break-words transition-colors duration-300",
                  (isCompleted || isCurrent) ? "text-foreground font-medium" : "text-muted-foreground"
                )}
              >
                {language === 'ru' ? step.labelRu : language === 'th' ? step.labelTh || step.labelEn : step.labelEn}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// Default step configurations for different booking types
export const defaultBookingSteps: BookingStep[] = [
  { id: 'details', labelEn: 'Details', labelRu: 'Детали' },
  { id: 'contact', labelEn: 'Contact', labelRu: 'Контакты' },
  { id: 'payment', labelEn: 'Payment', labelRu: 'Оплата' },
];

export const eventBookingSteps: BookingStep[] = [
  { id: 'tickets', labelEn: 'Tickets', labelRu: 'Билеты' },
  { id: 'contact', labelEn: 'Contact', labelRu: 'Контакты' },
  { id: 'payment', labelEn: 'Payment', labelRu: 'Оплата' },
];

export const deliveryBookingSteps: BookingStep[] = [
  { id: 'recipient', labelEn: 'Recipient', labelRu: 'Получатель' },
  { id: 'delivery', labelEn: 'Delivery', labelRu: 'Доставка' },
  { id: 'payment', labelEn: 'Payment', labelRu: 'Оплата' },
];

export const serviceBookingSteps: BookingStep[] = [
  { id: 'datetime', labelEn: 'Date & Time', labelRu: 'Дата и время' },
  { id: 'contact', labelEn: 'Contact', labelRu: 'Контакты' },
  { id: 'payment', labelEn: 'Payment', labelRu: 'Оплата' },
];
