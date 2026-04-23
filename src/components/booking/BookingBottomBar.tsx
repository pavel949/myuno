import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/uno/LoadingSpinner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookingBottomBarProps {
  total: number;
  onSubmit: () => void;
  isSubmitting?: boolean;
  disabled?: boolean;
  submitLabel?: string;
  showBreakdown?: { label: string; amount: number }[];
  step?: number;
  totalSteps?: number;
  hint?: string;
}

const stepHints = {
  0: {
    en: '👆 Select options — payment comes later',
    ru: '👆 Выберите параметры — оплата будет позже',
  },
  1: {
    en: '✍️ Add contact details — no charges',
    ru: '✍️ Укажите контакты — никаких списаний',
  },
  2: {
    en: '🔒 Review & confirm your booking',
    ru: '🔒 Проверьте и подтвердите бронирование',
  },
};

export function BookingBottomBar({
  total,
  onSubmit,
  isSubmitting = false,
  disabled = false,
  submitLabel,
  showBreakdown,
  step,
  totalSteps = 3,
  hint,
}: BookingBottomBarProps) {
  const { language, t } = useLanguage();
  const { currencyInfo, convertPrice } = useCurrency();
  const isRu = language === 'ru';
  
  const showStepHint = step !== undefined && step < totalSteps;
  const currentHint = hint || (step !== undefined 
    ? stepHints[step as keyof typeof stepHints]?.[isRu ? 'ru' : 'en'] 
    : null);
  const isFinalStep = step !== undefined && step >= totalSteps - 1;

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-[var(--bottom-nav-h)] left-0 right-0 bg-background/95 border-t z-40"
    >
      {/* Step Hint */}
      {showStepHint && currentHint && (
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={cn(
              "px-4 py-2 text-sm text-center border-b",
              isFinalStep 
                ? "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]" 
                : "bg-muted/50 text-muted-foreground"
            )}
          >
            <div className="flex items-center justify-center gap-2">
              {isFinalStep ? (
                <Shield className="w-4 h-4" />
              ) : (
                <Info className="w-4 h-4" />
              )}
              <span>{currentHint}</span>
              {!isFinalStep && step !== undefined && (
                <span className="text-xs opacity-70 ml-2">
                  ({step + 1}/{totalSteps})
                </span>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      <div className="p-3 sm:p-4">
        {showBreakdown && showBreakdown.length > 0 && (
          <div className="mb-3 space-y-1">
            {showBreakdown.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm text-muted-foreground">
                <span>{item.label}</span>
                <span>{currencyInfo.symbol}{convertPrice(item.amount).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground">
              {t('booking.total')}
            </p>
            <p className="text-2xl font-bold text-primary">
              {currencyInfo.symbol}{convertPrice(total).toLocaleString()}
            </p>
          </div>

          <Button
            onClick={onSubmit}
            disabled={disabled || isSubmitting}
            className={cn(
              "h-11 sm:h-12 px-6 sm:px-8 text-sm sm:text-base font-semibold min-w-[140px] sm:min-w-[160px] touch-manipulation",
              isFinalStep && "bg-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/90 text-primary-foreground"
            )}
            size="lg"
          >
            {isSubmitting && <LoadingSpinner size="sm" className="mr-2" />}
            {isFinalStep && <Shield className="w-4 h-4 mr-2" />}
            {submitLabel || t('action.confirm')}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
