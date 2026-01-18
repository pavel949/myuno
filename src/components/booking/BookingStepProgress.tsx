import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

export interface BookingStep {
  id: string;
  labelEn: string;
  labelRu: string;
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
      <div className="flex items-center justify-between relative">
        {/* Progress line background */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-border" />
        
        {/* Active progress line */}
        <div 
          className="absolute top-4 left-0 h-0.5 bg-primary transition-all duration-500 ease-out"
          style={{ 
            width: `${Math.min(100, (currentStep / (steps.length - 1)) * 100)}%` 
          }}
        />

        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isPending = index > currentStep;

          return (
            <div 
              key={step.id} 
              className="relative flex flex-col items-center z-10"
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
                  <Check className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </div>

              {/* Step label */}
              <span 
                className={cn(
                  "text-xs mt-2 text-center max-w-[80px] transition-colors duration-300",
                  (isCompleted || isCurrent) ? "text-foreground font-medium" : "text-muted-foreground"
                )}
              >
                {language === 'ru' ? step.labelRu : step.labelEn}
              </span>
            </div>
          );
        })}
      </div>
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
