import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/uno/LoadingSpinner';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';

interface BookingBottomBarProps {
  total: number;
  currency?: string;
  onSubmit: () => void;
  isSubmitting?: boolean;
  disabled?: boolean;
  submitLabel?: string;
  showBreakdown?: { label: string; amount: number }[];
}

export function BookingBottomBar({
  total,
  currency = 'THB',
  onSubmit,
  isSubmitting = false,
  disabled = false,
  submitLabel,
  showBreakdown,
}: BookingBottomBarProps) {
  const { language } = useLanguage();
  const currencySymbol = currency === 'THB' ? '฿' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₽';

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 p-3 sm:p-4 bg-background/95 backdrop-blur-lg border-t z-40 pb-safe"
    >
      {showBreakdown && showBreakdown.length > 0 && (
        <div className="mb-3 space-y-1">
          {showBreakdown.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm text-muted-foreground">
              <span>{item.label}</span>
              <span>{currencySymbol}{item.amount.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground">
            {language === 'ru' ? 'Итого' : 'Total'}
          </p>
          <p className="text-2xl font-bold text-primary">
            {currencySymbol}{total.toLocaleString()}
          </p>
        </div>

        <Button
          onClick={onSubmit}
          disabled={disabled || isSubmitting}
          className="h-11 sm:h-12 px-6 sm:px-8 text-sm sm:text-base font-semibold min-w-[140px] sm:min-w-[160px] touch-manipulation"
          size="lg"
        >
          {isSubmitting && <LoadingSpinner size="sm" className="mr-2" />}
          {submitLabel || (language === 'ru' ? 'Подтвердить' : 'Confirm')}
        </Button>
      </div>
    </motion.div>
  );
}
