import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Info, CheckCircle, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookingStepHintProps {
  step: number;
  totalSteps: number;
  className?: string;
  customHint?: string;
}

const stepHints = {
  0: {
    en: 'Select date, time, and participants — no payment required yet',
    ru: 'Выберите дату, время и участников — оплата будет позже',
    icon: Info,
  },
  1: {
    en: 'Add your contact details — no charges at this step',
    ru: 'Укажите контакты для связи — никаких списаний',
    icon: Info,
  },
  2: {
    en: 'Choose your preferred payment method',
    ru: 'Выберите удобный способ оплаты',
    icon: Info,
  },
  3: {
    en: 'Review and confirm — secure booking',
    ru: 'Проверьте и подтвердите — безопасное бронирование',
    icon: Shield,
  },
};

export function BookingStepHint({ 
  step, 
  totalSteps, 
  className,
  customHint,
}: BookingStepHintProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const hintData = stepHints[step as keyof typeof stepHints] || stepHints[0];
  const Icon = hintData.icon;
  const hintText = customHint || (isRu ? hintData.ru : hintData.en);
  
  const isFinalStep = step === totalSteps - 1;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
          isFinalStep 
            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
            : "bg-muted text-muted-foreground",
          className
        )}
      >
        <Icon className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1">{hintText}</span>
        {!isFinalStep && (
          <span className="text-xs opacity-70 whitespace-nowrap">
            {step + 1} / {totalSteps}
          </span>
        )}
        {isFinalStep && (
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
